var camera = require("nativescript-camera");
var imageModule = require("ui/image");
var dialogsModule = require("ui/dialogs");
var observableModule = require("data/observable");
var config = require("../../shared/config");
var fetchModule = require("fetch");
var fs = require("tns-core-modules/file-system");
var imageSource = require("tns-core-modules/image-source");
var frameModule = require("ui/frame");
var http = require("http");

var geolocation = require("nativescript-geolocation");

var page;
var item;

var ItemViewModel = require("../../shared/view-models/item-view-model");
//var pageData = new observableModule.fromObject({
//  item: null,
//  isLoading: true
//});

exports.loaded = function(args) {
  page = args.object;
  var parentContext = page.navigationContext;
  item = parentContext.item;
//  pageData.set("item", item);
  page.bindingContext = item;

  item.load(item.id, function(loaded) {
    console.log("item"+JSON.stringify(loaded));
    //pageData.set("item", loaded);
    page.bindingContext = loaded;

    http.getImage(loaded.picture_src).then(function(response) {
      item.set("loading", false);
      item.set("picture", response);

      //loaded.picture = response;
      //pageData.set("item", loaded);
      //page.bindingContext = item;
    }, function(err) {
      item.set("loading", false);
    });

    console.log("pageData: " + JSON.stringify(item));
  });
};

exports.back = function(args) {
  item.save();
  frameModule.topmost().navigate({ moduleName: "views/list/list", clearHistory: true });
};

exports.takePicture = function(args) {
  var isAvailable = camera.isAvailable(); 
//  if (isAvailable) {
    camera.requestPermissions().then(function() {
      var options = { saveToGallery: false, keepAspectRatio: false };
      camera.takePicture(options)
        .then(function (imageAsset) {
          console.log("Result is an image asset instance");
          var image = new imageModule.Image();
          image.src = imageAsset;

          //var item = pageData.get("item");
          item.set("picture", imageAsset);

          var source = new imageSource.ImageSource();
          source.fromAsset(imageAsset).then(function(imageSource) {
            var folder = fs.knownFolders.documents().path;
            var fileName = "image_"+ item.id +".png";
            var path = fs.path.join(folder, fileName);
            var saved = imageSource.saveToFile(path, "png");
            item.set("picture_src", path);

            geolocation.getCurrentLocation({desiredAccuracy: 3, updateDistance: 10, maximumAge: 20000, timeout: 20000}).
            then(function(location) {
              item.set("location", location);
              if (location) {
                item.save();
                frameModule.topmost().navigate({ moduleName: "views/list/list", clearHistory: true });
              }
            }, function(e){
              console.log("Error: " + e.message);
            });
          });
        }).catch(function (err) {
          console.log("Error -> " + err.message);
        });
    });

/*  } else {
    dialogsModule.alert({
      message: "Your camera is not available",
      okButtonText: "OK"
    });
  }
*/
}

function handleErrors(response) {
  if (!response.ok) {
    //console.log(JSON.stringify(response));
    throw Error(response.statusText);
  }
  return response;
}

function getCommonHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": config.appAuthHeader
  }
}