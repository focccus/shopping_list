import 'package:flutter/material.dart';
import 'package:fluix/fluix.dart';
import 'package:shopping_list/socket.dart';
import 'models.dart';
import 'search.dart';
import 'package:provider/provider.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  Widget build(BuildContext context) {
    var theme = FluidTheme.of(context);

    void itemChanged(CheckItem item, CheckItemList items, bool val) {
      val ? items.requestItemDone(item) : items.requestItemReAdd(item);
    }

    var media = MediaQuery.of(context);

    return Consumer<CheckItemList>(
      builder: (context, items, _) {
        return FluidShell(
          appBar: FluidBar(
            color: items.socket.isConnected ? null : theme.primary.darker,
            height: 80,
            actions: <Widget>[
              if (!items.socket.isConnected && media.size.width > 400)
                SizedBox(
                  height: 50,
                  child: FluidCard(
                    alignChild: Alignment.center,
                    backgroundColor: theme.primary.darkest,
                    child: Text("Offline"),
                  ),
                ),
              SizedBox(
                width: 8,
              ),
              FluidIconButton(
                theme: FluidButtonTheme(theme.primary, Liquids.sensitiveGrey,
                    activeBackground:
                        Liquids.sensitiveGrey.lighter.withAlpha(20)),
                icon: Icon(LiquidIcons.clouddownload),
                onTap: () => items.load(),
              ),
            ],
            title: SearchButton((String res) => items.requestItemAdd(res)),
          ),
          responsiveSidebar: false,
          body: ListView(children: [
            FluidList.builder(
              itemCount: items.count,
              builder: (int i) {
                var item = items.items[i];
                return FluidListItem.checkbox(
                  value: item.showDone,
                  title: Container(
                    child: Text(
                      item.cached != null && item.cached
                          ? item.name + ' (nicht gespeichert)'
                          : item.name,
                      style: TextStyle(
                        decoration: item.showDone
                            ? TextDecoration.lineThrough
                            : TextDecoration.none,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  trailing: item.amount != null && item.amount > 1
                      ? Text("x${item.amount}")
                      : null,
                  onChanged: (bool val) => itemChanged(item, items, val),
                );
              },
            ),
            if (items.count == 0)
              Column(
                children: <Widget>[
                  SizedBox(
                    height: media.orientation == Orientation.landscape ? 2 : 50,
                  ),
                  Image.asset(
                    'assets/undraw_empty.png',
                    width: media.orientation == Orientation.landscape
                        ? media.size.width / 2
                        : media.size.width / 1.2,
                  ),
                  SizedBox(
                    height: media.orientation == Orientation.landscape ? 8 : 50,
                  ),
                  Text(
                    "Scheint, als ob du noch keinen Einkauf hinzugefügt hast!",
                    style: theme.typography.largeBody,
                    textAlign: TextAlign.center,
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child:
                        SearchButton((String res) => items.requestItemAdd(res)),
                  ),
                ],
              )
          ]),
        );
      },
    );
  }
}

class SearchButton extends StatelessWidget {
  void Function(String) searchResult;

  SearchButton(this.searchResult);

  @override
  Widget build(BuildContext context) {
    return FluidIconButton.highlight(
      icon: Icon(LiquidIcons.plus),
      child: Text(
        "Hinzufügen",
        style: TextStyle(fontSize: 16),
      ),
      onTap: () => showSearch(context: context, delegate: AddItem()).then(
        searchResult,
      ),
    );
  }
}
