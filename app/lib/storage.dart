import 'dart:async';

import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shopping_list/models.dart';

Box box;

init() async {
  if (box != null) return box;
  await Hive.initFlutter();
  box = await Hive.openBox('shopping_list');
}

Future<List<CheckItem>> getItems() async {
  if (box == null) await init();
  if (box.get('items') == null) return [];
  return (box.get('items') as List)
      .map((js) => CheckItem.fromJson(js))
      .toList();
}

Future<List<CachedAction>> getActions() async {
  if (box == null) await init();
  if (box.get('actions') == null) return [];
  return (box.get('actions') as List)
      .map((act) => CachedAction.fromJson(act))
      .toList();
}

Future<List> getSuggestions() async {
  if (box == null) await init();
  if (box.get('suggestions') == null) return [];
  return box.get('suggestions');
}

void storeItems(CheckItemList items) async {
  if (box == null) await init();
  await box.put("items", items.toJson());
  if (items.cachedActions != null && items.cachedActions.isNotEmpty)
    await box.put(
        "actions", items.cachedActions.map((act) => act.toJson()).toList());
}

void storeSuggestions(List list) async {
  if (box == null) await init();
  await box.put("suggestions", list);
}
