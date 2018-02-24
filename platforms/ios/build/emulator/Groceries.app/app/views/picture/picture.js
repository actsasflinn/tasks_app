var camera = require("nativescript-camera");
var imageModule = require("ui/image");
var dialogsModule = require("ui/dialogs");
var observableModule = require("data/observable");
var config = require("../../shared/config");
var fetchModule = require("fetch");
var fs = require("tns-core-modules/file-system");
var imageSource = require("tns-core-modules/image-source");

var bghttpModule = require("nativescript-background-http");
var session = bghttpModule.session("image-upload");

//var fsModule     = require('file-system');
//var bgHttpModule = require('nativescript-background-http');
var page;

var pageData = new observableModule.fromObject({
  saveToGallery: false
});

exports.loaded = function(args) {
  page = args.object;
  var context = page.navigationContext;
  console.log(context.pictureName);
  pageData.set("pictureName", context.pictureName);
  page.bindingContext = pageData;
};

exports.takePicture = function() {
  var isAvailable = camera.isAvailable(); 
//  if (isAvailable) {
    camera.requestPermissions().then(function() {
      var options = { saveToGallery: false };
      camera.takePicture(options)
        .then(function (imageAsset) {
          console.log("Result is an image asset instance");
          var image = new imageModule.Image();
          image.src = imageAsset;

          var source = new imageSource.ImageSource();

          pageData.set("cameraImage", imageAsset);

          var taskName = pageData.get("pictureName");
          console.log(taskName);

          //////
/*
          var contentType = `image/${format}`;
          var savePath = fsModule.knownFolders.documents().path;
          var fileName = 'img_' + new Date().getTime() + '.' + format;
          var filePath = fsModule.path.join( savePath, fileName );

          if ( imageSource.saveToFile( filePath, format ) ) {
              var session = bgHttpModule.session('image-upload')

              var options = {
                  url: 'http://0.0.0.0:3000',
                  method: 'PATCH',
                  headers: {
                      'Content-Type': 'application/octet-stream',
                      'File-Name': fileName
                  },
                  description: '{ \'uploading\': ' + fileName + ' }'
              }

              var task = session.uploadFile("file://" + this.filePath, request);

              task.on('progress', logEvent)
              task.on('error', logEvent)
              task.on('complete', logEvent)

              function logEvent(e) {
                  console.log(e.eventName)
              }
          }
*/

          source.fromAsset(imageAsset).then(function(imageSource) {
            var folder = fs.knownFolders.documents().path;
            var fileName = "test.png";
            var path = fs.path.join(folder, fileName);
            var saved = imageSource.saveToFile(path, "png");

            var stream64 = imageSource.toBase64String("png");
            console.log(stream64);
            var file = fs.File.fromPath(path);

            var formData = new FormData();
            var blob = new Blob([stream64], { type: "image/png"});

            console.log("blob")

            formData.append('task[name]', taskName);
            formData.append('task[picture]', blob);
            console.log("formdata:", formData);

            fetch(config.apiUrl + "tasks.json", {
                method: "POST",
                body: formData
            })
            .then(handleErrors)
            .then(function(item) {
              console.log(item)
            });
            /*

            var request = {
                url: config.apiUrl + "tasks.json",
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "File-Name": taskName
                },
                description: "{ 'uploading': " + taskName + " }"
            };

            var task = session.uploadFile(path, request);
            task.on("progress", logEvent);
            task.on("error", logEvent);
            task.on("complete", logEvent);

            function logEvent(e) {
                console.log("currentBytes: " + e.currentBytes);
                console.log("totalBytes: " + e.totalBytes);
                console.log("eventName: " + e.eventName);
            }
*/
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
