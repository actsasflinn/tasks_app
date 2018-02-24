var swipeDelete = require("../../shared/utils/ios-swipe-delete");
var dialogsModule = require("ui/dialogs");
var frameModule = require("ui/frame");
var observableModule = require("data/observable")
var page;

var ItemListViewModel = require("../../shared/view-models/item-list-view-model");

var itemList = new ItemListViewModel([]);
var pageData = new observableModule.fromObject({
  itemList: itemList,
  item: "",
  isLoading: true
});

exports.loaded = function(args) {
    page = args.object;
    var listView = page.getViewById("itemList");
    if (page.ios) {
      swipeDelete.enable(listView, function(index) {
        itemList.delete(index);
      });
    }
    page.bindingContext = pageData;

    itemList.empty();
    itemList.load().then(function() {
      pageData.set("isLoading", false);
      listView.animate({
        opacity: 1,
        duration: 1000
      });
    });
};

exports.add = function() {
  // Check for empty submissions
  if (pageData.get("item").trim() === "") {
    dialogsModule.alert({
      message: "Enter an item",
      okButtonText: "OK"
    });
    return;
  }

  // Dismiss the keyboard
  page.getViewById("item").dismissSoftInput();
  itemList.add(pageData.get("item"))
    .catch(function() {
      dialogsModule.alert({
        message: "An error occurred while adding an item to your list.",
        okButtonText: "OK"
      });
    });

  // Empty the input field
  pageData.set("item", "");
};

exports.delete = function(args) {
  var item = args.view.bindingContext;
  var index = itemList.indexOf(item);
  itemList.delete(index);
};

exports.picture = function(args) {
  var navigationEntry = {
    moduleName: "views/picture/picture",
    context: { pictureName: args.view.text },
  };
  frameModule.topmost().navigate(navigationEntry);
};