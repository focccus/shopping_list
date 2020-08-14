import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shopping_list/socket.dart';
import 'package:shopping_list/storage.dart' as storage;

class CheckItem {
  String id;
  String name;
  int amount;
  bool showDone;
  bool cached;

  CheckItem(
      {this.id, this.name, this.amount, this.showDone = false, this.cached})
      : assert(name != null);
  factory CheckItem.fromJson(Map data) => CheckItem(
        id: data["_id"],
        name: data["name"],
        amount: data["amount"],
        cached: data["cached"],
      );

  Map toJson() => {
        "_id": id,
        "name": name,
        "value": showDone,
        "amount": amount,
        "cached": cached
      };

  @override
  String toString() {
    return toJson().toString();
  }
}

class CheckItemList extends ChangeNotifier {
  List<CheckItem> items = [];
  Socket socket;
  List<CachedAction> cachedActions = [];

  CheckItemList({this.items, this.socket}) {
    this.load();

    socket.on("addItem", (dat) {
      if ((dat as Map)["_id"] != null && (dat as Map)["name"] != null)
        add(CheckItem.fromJson((dat as Map)));
      save();
    });
    socket.on("removeItem", (dat) {
      if ((dat as Map)["id"] != null) remove(dat["id"]);
      save();
    });

    socket.on("items", (dat) {
      if (dat is List) items = dat.map((t) => CheckItem.fromJson(t)).toList();
      notifyListeners();
      save();
    });

    storage.getActions().then((actions) {
      cachedActions.addAll(actions);
    });

    socket.onConnectionChange.addListener(() {
      if (socket.isConnected && cachedActions.isNotEmpty) {
        cachedActions.forEach((action) {
          if (action.type == "add")
            socket.addItem(action.data.name, action.data.amount);
          if (action.type == "remove") socket.removeItem(action.data);
        });
        cachedActions = [];
        items.removeWhere((item) => item.cached != null && item.cached);
      }
      notifyListeners();
    });
  }

  load() {
    socket.emit("items");
    if (!socket.isConnected) {
      storage.getItems().then((newitems) {
        if (items != null && items.isEmpty) items = newitems;
        notifyListeners();
      });
    }
  }

  save() {
    storage.storeItems(this);
  }

  get count => items.length;

  requestItemAdd(String name, [int amount]) {
    if (name == null || name.trim().isEmpty) return;
    if (socket.isConnected) {
      socket.addItem(name, amount);
    } else {
      var data = CheckItem(name: name, amount: amount, cached: true);
      items.insert(0, data);
      cachedActions.add(CachedAction.addItem(data));
      save();
    }
    //add(CheckItem(name: name));
  }

  requestItemReAdd(CheckItem item) {
    item.showDone = false;
    items.remove(item);
    requestItemAdd(item.name, item.amount);
    notifyListeners();
  }

  requestItemDone(CheckItem item) {
    item.showDone = true;
    notifyListeners();
    if (socket.isConnected) {
      socket.emit("remove", {"id": item.id});
    } else {
      cachedActions.add(CachedAction.removeItem(item));
      Timer(Duration(milliseconds: 100), () {
        items.remove(item);
        save();
      });
    }
  }

  checkExists(id) => items.indexWhere((item) => item.id == id);

  add(CheckItem item) {
    var exists = item.id == null ? null : checkExists(item.id);
    if (exists >= 0) {
      notifyListeners();
      return items[exists] = item;
    }
    items.insert(0, item);
    notifyListeners();
  }

  remove(String id) {
    if (checkExists(id) >= 0 && items[checkExists(id)].showDone) return;
    items.removeWhere((item) => item.id == id);
    notifyListeners();
  }

  List toJson() {
    return items.map((item) => item.toJson()).toList();
  }
}

class CachedAction {
  final String type;
  final CheckItem data;

  const CachedAction(this.type, this.data);
  const CachedAction.addItem(this.data) : type = "add";
  const CachedAction.removeItem(this.data) : type = "remove";

  CachedAction.fromJson(Map json)
      : this.type = json["action"],
        this.data = CheckItem.fromJson(json["data"]);

  Map toJson() {
    return {
      "action": type,
      "data": data.toJson(),
    };
  }

  @override
  String toString() {
    return toJson().toString();
  }
}
