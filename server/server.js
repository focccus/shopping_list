const fs = require("fs"),
  url = require("url"),
  path = require("path"),
  express = require("express"),
  cors = require("cors"),
  Datastore = require("nedb"),
  app = express(),
  server = require("http").createServer(app),
  io = require("socket.io")(server);

app.use(express.static("web"));
app.use(express.json());
app.use(cors());

app.get("/", (_, res) => {
  res.sendFile(__dirname + "/web/index.html");
});

app.get("/app", (_, res) => {
  res.sendFile(__dirname + "/download/Einkauf.apk");
});

var recipes = new Datastore({
  filename: "data/recipes.db",
  autoload: true,
});

app.post("/syncrecipes", async (req, res) => {
  let time = parseInt(req.query.last) || 0;

  console.log(req.body);

  if (req.body && Array.isArray(req.body)) {
    for (let recipe of req.body) {
      if (recipe.id && recipe.name) {
        recipe.synced = Date.now();

        console.log(recipe);

        recipes.update(
          { id: recipe.id },
          { $set: recipe },
          { upsert: true },
          (err, num) => {
            if (err) console.log(err);
          }
        );
      }
    }
  }

  recipes.find({ synced: { $gt: time } }, (err, items) => {
    if (err) console.log(err);
    res.send(items);
  });
});

// socket io
var history = new Datastore({ filename: "data/history.db", autoload: true });
var items = new Datastore({ filename: "data/items.db", autoload: true });

var _sockets = new Set();

io.on("connection", (socket) => {
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

server.listen(8090, "0.0.0.0");
console.log("Server started on 0.0.0.0:8090");
