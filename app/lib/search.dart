import 'package:flutter/material.dart';
import 'package:fluix/fluix.dart';
import 'package:provider/provider.dart';
import 'package:shopping_list/socket.dart';
import 'models.dart';
import 'package:shopping_list/storage.dart' as storage;

class AddItem extends SearchDelegate<String> {
  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        FluidIconButton.ghost(
          icon: Icon(LiquidIcons.close),
          onTap: () => query = "",
        )
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return FluidIconButton.ghost(
      icon: Icon(LiquidIcons.arrow_left),
      onTap: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    close(context, query);
    return Container();
  }

  List items = [];
  bool hasData = false;

  @override
  Widget buildSuggestions(BuildContext context) {
    return SuggestionList(query, (res) => close(context, res));
  }
}

class SuggestionList extends StatefulWidget {
  final void Function(String) onSelected;
  final String search;

  const SuggestionList(
    this.search,
    this.onSelected, {
    Key key,
  }) : super(key: key);

  @override
  _SuggestionListState createState() => _SuggestionListState();
}

class _SuggestionListState extends State<SuggestionList> {
  List items = [];
  bool hasData = false;
  Socket socket;

  @override
  void didChangeDependencies() {
    socket = Provider.of<CheckItemList>(context).socket;
    if (!socket.isConnected) {
      storage.getSuggestions().then((list) {
        items = list;
      });
    }
    socket.emit("history");
    socket.on("history", (dat) {
      items = dat;

      storage.storeSuggestions(items);
    });
    socket.on("history_remove", historyRemove);
    super.didChangeDependencies();
  }

  void historyRemove(dat) {
    if (mounted && dat['name'] != null)
      setState(() {
        items.remove(dat['name']);
      });
  }

  @override
  Widget build(BuildContext context) {
    List filtered = items
        .where(
          (item) => item.toLowerCase().contains(
                widget.search.toLowerCase(),
              ),
        )
        .toList();

    return ListView(
      children: [
        FluidList.builder(
          itemCount: filtered.length,
          builder: (int i) {
            return FluidListItem(
              title: Text(filtered[i]),
              onTap: () => widget.onSelected(filtered[i]),
              trailing: FluidIconButton.secondary(
                icon: Icon(LiquidIcons.close),
                onTap: () => socket.removeHistory(filtered[i]),
              ),
            );
          },
        )
      ],
    );
  }
}
