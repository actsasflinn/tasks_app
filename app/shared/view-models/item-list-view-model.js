var config = require("../../shared/config");
var fetchModule = require("fetch");
var ObservableArray = require("data/observable-array").ObservableArray;
var ItemViewModel = require("./item-view-model");

function ItemListViewModel(items) {
  var baseUrl = config.apiUrl + "tasks";
  var viewModel = new ObservableArray(items);

  viewModel.load = function() {
    console.log("loading...");
      return fetch(baseUrl + ".json", {
          headers: getCommonHeaders()
      })
      .then(handleErrors)
      .then(function(response) {
          return response.json();
      }).then(function(data) {
          data.forEach(function(item) {
            var i = new ItemViewModel(item);
            //console.log(JSON.stringify(i));
            viewModel.push(i);
            //return i;
          });
          return viewModel;
      });
  };

  viewModel.empty = function() {
      while (viewModel.length) {
          viewModel.pop();
      }
  };

  viewModel.add = function(item) {
      return fetch(baseUrl + ".json", {
          method: "POST",
          body: JSON.stringify({
              name: item
          }),
          headers: getCommonHeaders()
      })
      .then(handleErrors)
      .then(function(response) {
          return response.json();
      })
      .then(function(item) {
          //console.log(JSON.stringify(item));
          global.uploaded.set(item.id, false);
          global.uploading.set(item.id, false);

          var i = new ItemViewModel(item);
          console.log(JSON.stringify(i));
          viewModel.push(i);
          return i;
      });
  };

  viewModel.delete = function(index) {
      return fetch(baseUrl + "/" + viewModel.getItem(index).id + ".json", {
          method: "DELETE",
          headers: getCommonHeaders()
      })
      .then(handleErrors)
      .then(function() {
          viewModel.splice(index, 1);
      });
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
    //console.log(JSON.stringify(response));
    throw Error(response.statusText);
  }
  return response;
}

module.exports = ItemListViewModel;
