import 'package:flutter/material.dart';
import 'package:fluix/fluix.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shopping_list/socket.dart';

import 'homepage.dart';
import 'models.dart';

void main() {
  SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);

  runApp(
    ChangeNotifierProvider(
      builder: (context) => CheckItemList(socket: Socket(), items: []),
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return FluixApp(
      //title: 'Flutter Demo',
      debugShowCheckedModeBanner:false,
      theme: FluidThemeData.richBlue(),
      home: HomePage(),
    );
  }
}
