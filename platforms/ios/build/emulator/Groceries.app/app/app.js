var observableModule = require("data/observable");
//var geolocation = require("nativescript-geolocation");
var applicationModule = require("application");

global.uploading = new observableModule.fromObject({});
global.uploaded = new observableModule.fromObject({});

applicationModule.start({ moduleName: "views/login/login" });
