const fs = require("fs"),
  url = require("url"),
  path = require("path");

var app = require("http").createServer((req, res) => {
  function sendFile(filename, headers = {}) {
    if (fs.statSync(filename).isDirectory()) filename += "/index.html";

    fs.readFile(filename, "binary", function (err, file) {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.write(err + "\n");
        res.end();
        return;
      }

      res.writeHead(200, headers);
      res.write(file, "binary");
      res.end();
    });
  }

  console.log(req.url);
  if (req.url === "/app") {
    return sendFile("./download/Einkauf.apk", {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": "attachment; filename=Einkauf.apk",
      "Content-Transfer-Encoding": "binary",
    });
  }

  var uri = url.parse(req.url).pathname,
    filename = path.join(process.cwd() + "/web/", uri);

  fs.exists(filename, function (exists) {
    if (!exists) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.write("404 Not Found\n");
      res.end();
      return;
    }
  });

  sendFile(filename);
});

var Datastore = require("nedb");
var io = require("socket.io")(app);
app.listen(8090, "0.0.0.0");
console.log("Server started on 0.0.0.0:8090");
var history = new Datastore({ filename: "data/history.db", autoload: true });
var items = new Datastore({ filename: "data/items.db", autoload: true });

var _sockets = new Set();

io.on("connection", function (socket) {
  console.log(">>>>>>> new connection", socket.handshake.query.timestamp);
  _sockets.add(socket);
  socket.on("add", (data) => {
    if (data.name) {
      items.update(
        { name: data.name },
        { $set: { name: data.name }, $inc: { amount: data.amount || 1 } },
        { upsert: true, returnUpdatedDocs: true },
        (err, num, doc) => {
          console.log(doc);
          _sockets.forEach((socket) => socket.emit("addItem", doc));
        }
      );
      history.update(
        { name: data.name },
        { $set: { name: data.name }, $inc: { usage: 1 } },
        { upsert: true },
        (err, num) => {
          if (err) console.log(err);
        }
      );
    }
  });
  socket.on("remove", (data) => {
    if (data.id) {
      console.log(data);

      items.remove({ _id: data.id }, (err, num) => {
        console.log(num);
        if (err) console.log(err);
        else if (num > 0)
          _sockets.forEach((socket) =>
            socket.emit("removeItem", { id: data.id })
          );
      });
    }
  });
  socket.on("items", (_) => {
    items.find({}, (err, items) => socket.emit("items", items));
  });
  socket.on("history", (_) => {
    history
      .find({})
      .sort({ usage: -1 })
      .exec((err, history) => {
        history = history.map((h) => h.name);
        socket.emit("history", history);
      });
  });
  socket.on("history_remove", (data) => {
    if (data.name) {
      history.remove({ name: data.name }, (err, num) => {
        if (err) console.log(err);
        else if (num > 0)
          _sockets.forEach((socket) =>
            socket.emit("history_remove", { name: data.name })
          );
      });
    }
  });
  socket.on("disconnect", () => {
    _sockets.delete(socket);
    console.log(">>>>>>> disconnect", socket.handshake.query.timestamp);
    console.log(">>>>>>> Total Sockets", _sockets.size);
  });
});
