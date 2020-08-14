import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

import 'models.dart';

// TODO: Change this
const URI = "http://localhost:8090";

class Socket {
  IO.Socket socket;
  bool isConnected = false;
  ValueNotifier<bool> onConnectionChange = ValueNotifier(false);

  Socket({String url = URI}) {
    socket = IO.io(url, <String, dynamic>{
      'transports': ['websocket']
    });
    socket.on('connect', (_) {
      print("connected");
      isConnected = true;
      onConnectionChange.value = !onConnectionChange.value;
    });
    socket.on('reconnect', (_) {
      print("reconnected");
      isConnected = true;
      onConnectionChange.value = !onConnectionChange.value;
    });
    socket.on('disconnect', (_) {
      print("disconnected");
      isConnected = false;
      onConnectionChange.value = !onConnectionChange.value;
    });
  }

  void addItem(String name, int amount) {
    socket.emit("add", {"name": name, "amount": amount});
  }

  void removeItem(CheckItem item) {
    socket.emit("remove", {"id": item.id, "name": item.name});
  }

  void removeHistory(String history) {
    socket.emit("history_remove", {"name": history});
  }

  Function(String, [dynamic]) get emit => socket.emit;
  Function(String, Function(dynamic)) get on => socket.on;
}
