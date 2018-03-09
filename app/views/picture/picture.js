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

var ItemViewModel = require("../../shared/view-models/item-view-model");
var pageData = new observableModule.fromObject({
  item: null,
  isLoading: true
});

exports.loaded = function(args) {
  page = args.object;
  var context = page.navigationContext;
//  var id = context.item.id;
//  var item = new ItemViewModel({ id: id });
  var item = context.item;
  item.load(item.id, function(loaded) {
    console.log("item"+JSON.stringify(loaded));
    pageData.set("item", loaded);
    page.bindingContext = pageData;

    http.getImage(loaded.picture_src).then(function(r) {
      loaded.picture = r;
      pageData.set("item", loaded);
      pageData.set("isLoading", false);
    }, function(err) {
      pageData.set("isLoading", false);
    });

    console.log("pageData: " + JSON.stringify(pageData));
  });

/*
  geolocation.isEnabled().then(function (isEnabled) {
    if (!isEnabled) {
      geolocation.enableLocationRequest().then(function () {
      }, function (e) {
        console.log("Error: " + (e.message || e));
      });
    }
  }, function (e) {
      console.log("Error: " + (e.message || e));
  });
*/
};

exports.takePicture = function() {
  var isAvailable = camera.isAvailable(); 
//  if (isAvailable) {
    camera.requestPermissions().then(function() {
      var options = { saveToGallery: false, keepAspectRatio: false };
      camera.takePicture(options)
        .then(function (imageAsset) {
          console.log("Result is an image asset instance");
          var image = new imageModule.Image();
          image.src = imageAsset;

          var item = pageData.get("item");
          item.picture = imageAsset;

          var source = new imageSource.ImageSource();
          source.fromAsset(imageAsset).then(function(imageSource) {
            var folder = fs.knownFolders.documents().path;
            var fileName = "test.png";
            var path = fs.path.join(folder, fileName);
            var saved = imageSource.saveToFile(path, "png");
            item.picture_src = path;

            geolocation.getCurrentLocation({desiredAccuracy: 3, updateDistance: 10, maximumAge: 20000, timeout: 20000}).
            then(function(location) {
              item.location = location;
              if (location) {
                console.log("location:" + JSON.stringify(location));

                item.save({
                  progress: function() {
                    pageData.set("isLoading", true);
                  },
                  error: function() {
                    pageData.set("isLoading", false);
                  },
                  complete: function() {
                    console.log("*****complete*****");
                    pageData.set("isLoading", false);
                  }
                });
                frameModule.topmost().goBack();
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
    console.log(JSON.stringify(response));
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