var config = require("../../shared/config");
var fetchModule = require("fetch");
var observableModule = require("data/observable");
var bghttpModule = require("nativescript-background-http");
var session = bghttpModule.session("image-upload");

function Item(item) {
  item = item || {};

  var viewModel = new observableModule.fromObject({
    id: item.id || "",
    slug: item.slug || "",
    name: item.name || "",
    description: item.description || "",
    picture: item.picture || "",
    picture_src: item.picture_src || "",
    icon: String.fromCharCode(global.uploading.get(item.id) ? 0xf110 : (item.picture_src === undefined ? 0xf111 : 0xf058)),
    icon_class: (global.uploading.get(item.id) ? "fa-spin" : (item.picture_src === undefined ? "fa-circle" : "fa-check-circle")),
    icon_id: "icon_" + item.id,
    loading: false,
    location: {}
  });

  global.uploaded.on(observableModule.Observable.propertyChangeEvent, function(propertyChangeData){
    console.log("uploaded change event:"+propertyChangeData.propertyName);
    if (propertyChangeData.propertyName == viewModel.id && propertyChangeData.value == true) {
      console.log("uploaded true:"+propertyChangeData.value);

      viewModel.set("icon", String.fromCharCode(0xf058));
      viewModel.set("icon_class", "fa-check-circle");
    }
  });

  global.uploading.on(observableModule.Observable.propertyChangeEvent, function(propertyChangeData){
    console.log("uploading change event:"+propertyChangeData.propertyName);
    if (propertyChangeData.propertyName == viewModel.id && propertyChangeData.value == true) {
      console.log("uploading true:"+propertyChangeData.value);

      viewModel.set("icon", String.fromCharCode(0xf110));
      viewModel.set("icon_class", "fa-spin");
    }
  });

  viewModel.uploaded = function() {
    global.uploading.set(viewModel.id, false);
    global.uploaded.set(viewModel.id, true);
    console.log("completed uploading item: " + viewModel.id);
  };

  viewModel.uploading = function() {
    global.uploading.set(viewModel.id, true);
    //global.uploaded.set(viewModel.id, false);
    console.log("uploading item: " + viewModel.id);
  };

  viewModel.isUploaded = function() {
    return global.uploaded.get(viewModel.id);
  };

  viewModel.isLoading = function() {
    return viewModel.loading || global.uploading.get(viewModel.id);
  };

  viewModel.isUploading = function() {
    return global.uploading.get(viewModel.id);
  };

  viewModel.load = function(id, complete) {
    id = id || "";
    complete = complete || function() {};

    return fetchModule.fetch(config.apiUrl + "tasks/" + id + ".json", {
      method: "GET",
      headers: getCommonHeaders()
    })
    .then(handleErrors)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      viewModel.id = data.id;
      viewModel.slug = data.slug;
      viewModel.name = data.name;
      viewModel.description = data.description;
      viewModel.picture = data.picture;
      viewModel.picture_src = data.picture_src;
      viewModel.icon = String.fromCharCode(global.uploading.get(data.id) ? 0xf110 : (data.picture_src === undefined ? 0xf111 : 0xf058));
      viewModel.icon_class = (global.uploading.get(data.id) ? "fa-spin" : (data.picture_src === undefined ? "fa-circle" : "fa-check-circle"));
      viewModel.icon_id = "icon_" + data.id;
      viewModel.loading = false;

      viewModel.location = {
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        horizontalAccuracy: data.horizontal_accuracy,
        verticalAccuracy: data.vertical_accuracy,
        speed: data.speed,
        direction: data.direction,
        timestamp: data.timestamp
      };

      console.log("viewModel:" + JSON.stringify(viewModel));

      return viewModel;
    })
    .then(complete);
  };

  viewModel.save = function(events) {
    events = events || {};
    console.log("save");

    var url = config.apiUrl + "tasks";
    var method = "POST";
    if (viewModel.id) {
      url += "/" + viewModel.id
      method = "PATCH";
    }

    var request = {
        url: url,
        method: method,
        headers: {
            "Authorization": config.appAuthHeader,
            "Content-Type": "application/octet-stream",
            "File-Name": viewModel.name
        },
        description: "{ 'uploading': " + viewModel.name + " }"
    };

    var params = [];
    if (viewModel.name !== null) params.push({ name: "task[name]", value: viewModel.name });
    if (viewModel.description !== null) params.push({ name: "task[description]", value: viewModel.description });
    if (viewModel.picture_src !== null) params.push({ name: "task[picture]", filename: viewModel.picture_src, mimeType: "image/png" });

    if (viewModel.location !== null && viewModel.location != {}) {
      params.push({ name: "task[latitude]", value: viewModel.location.latitude });
      params.push({ name: "task[longitude]", value: viewModel.location.longitude });
      params.push({ name: "task[altitude]", value: viewModel.location.altitude });
      params.push({ name: "task[horizontal_accuracy]", value: viewModel.location.horizontalAccuracy });
      params.push({ name: "task[vertical_accuracy]", value: viewModel.location.verticalAccuracy });
      params.push({ name: "task[speed]", value: viewModel.location.speed });
      params.push({ name: "task[direction]", value: viewModel.location.direction });
      params.push({ name: "task[timestamp]", value: viewModel.location.timestamp });
    }

    console.log("Params: " + JSON.stringify(params));

    var task = session.multipartUpload(params, request);

    function logEvent(e) {
//      console.log("currentBytes: " + e.currentBytes);
//      console.log("totalBytes: " + e.totalBytes);
//      console.log("eventName: " + e.eventName);
        console.log(".");
    }

    task.on("progress", viewModel.uploading)
    task.on("error", logEvent)
    task.on("complete", viewModel.uploaded);

    for(var name in events) {
      task.on(name, events[name]);
    }
  };

  return viewModel;
}

function getCommonHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": config.appAuthHeader
  }
}

function handleErrors(response) {
  if (!response.ok) {
    console.log(JSON.stringify(response));
    throw Error(response.statusText);
  }
  return response;
}

module.exports = Item;