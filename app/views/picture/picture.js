var camera = require("nativescript-camera");
var imageModule = require("ui/image");
var dialogsModule = require("ui/dialogs");
var observableModule = require("data/observable");
var config = require("../../shared/config");
var fetchModule = require("fetch");
var fs = require("tns-core-modules/file-system");
var imageSource = require("tns-core-modules/image-source");
var frameModule = require("ui/frame");

var bghttpModule = require("nativescript-background-http");
var session = bghttpModule.session("image-upload");

var geolocation = require("nativescript-geolocation");

var page;

var pageData = new observableModule.fromObject({
  isUploading: false,
  cameraImage: "",
  description: "",
  pictureName: "",
});

exports.loaded = function(args) {
  page = args.object;
  var context = page.navigationContext;
  console.log(context.pictureName);
  pageData.set("cameraImage", "");
  pageData.set("description", "");
  pageData.set("pictureName", context.pictureName);
  pageData.set("isUploading", false);
  page.bindingContext = pageData;

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
};

exports.takePicture = function() {
  var isAvailable = camera.isAvailable(); 
//  if (isAvailable) {
    camera.requestPermissions().then(function() {
      var options = { saveToGallery: false, keepAspectRatio: true };
      camera.takePicture(options)
        .then(function (imageAsset) {
          console.log("Result is an image asset instance");
          var image = new imageModule.Image();
          image.src = imageAsset;

          var source = new imageSource.ImageSource();

          pageData.set("cameraImage", imageAsset);

          var taskName = pageData.get("pictureName");
          console.log(taskName);

          source.fromAsset(imageAsset).then(function(imageSource) {
            var folder = fs.knownFolders.documents().path;
            var fileName = "test.png";
            var path = fs.path.join(folder, fileName);
            var saved = imageSource.saveToFile(path, "png");

            //var stream64 = imageSource.toBase64String("png");
            //console.log(stream64);
            //var file = fs.File.fromPath(path);

            var request = {
                url: config.apiUrl + "tasks",
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "File-Name": taskName
                },
                description: "{ 'uploading': " + taskName + " }"
            };

            geolocation.getCurrentLocation({desiredAccuracy: 3, updateDistance: 10, maximumAge: 20000, timeout: 20000}).
            then(function(location) {
                if (location) {
                  console.log("Current location is: " +
                    " lat: " + location.latitude +
                    " lon: " + location.longitude +
                    " alt: " + location.altitude +
                    " horizAcc: " + location.horizontalAccuracy +
                    " vertAcc: " + location.verticalAccuracy +
                    " speed: " + location.speed +
                    " direction: " + location.direction +
                    " ts: " + location.timestamp
                  );

                  var params = [
                    { name: "task[name]", value: taskName },
                    { name: "task[description]", value: pageData.get("description") },
                    { name: "task[latitude]", value: location.latitude },
                    { name: "task[longitude]", value: location.longitude },
                    { name: "task[altitude]", value: location.altitude },
                    { name: "task[horizontal_accuracy]", value: location.horizontalAccuracy },
                    { name: "task[vertical_accuracy]", value: location.verticalAccuracy },
                    { name: "task[speed]", value: location.speed },
                    { name: "task[direction]", value: location.direction },
                    { name: "task[timestamp]", value: location.timestamp },
                    { name: "task[picture]", filename: path, mimeType: "image/png" }
                  ];

                  var task = session.multipartUpload(params, request);
                  frameModule.topmost().goBack();
                }
            }, function(e){
                console.log("Error: " + e.message);
            });

            task.on("progress", function() {
              pageData.set("isUploading", true);
              logEvent();
            });
            task.on("error", function() {
              pageData.set("isUploading", false);
              logEvent();
            });
            task.on("complete", function() {
              pageData.set("isUploading", false);
              logEvent();
            });

            function logEvent(e) {
                console.log("currentBytes: " + e.currentBytes);
                console.log("totalBytes: " + e.totalBytes);
                console.log("eventName: " + e.eventName);
            }
          });

          console.log(image);
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
