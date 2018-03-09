var config = require("../../shared/config");
var fetchModule = require("fetch");
var ObservableArray = require("data/observable-array").ObservableArray;

function ItemListViewModel(items) {
  var baseUrl = config.apiUrl + "tasks";
  var viewModel = new ObservableArray(items);

  viewModel.load = function() {
      return fetch(baseUrl + ".json", {
          headers: getCommonHeaders()
      })
      .then(handleErrors)
      .then(function(response) {
          return response.json();
      }).then(function(data) {
          data.forEach(function(item) {
              viewModel.push({
                id: item.id,
                slug: item.slug,
                name: item.name,
                description: item.description,
                picture: item.picture,
                picture_src: item.picture_src,
                icon: String.fromCharCode(item.picture_src === null ? 0xf111 : 0xf058),
                icon_class: item.picture_src === null ? "fa-circle" : "fa-check-circle"
              });
          });
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
          viewModel.push({
            id: item.id,
            slug: item.slug,
            name: item.name,
            description: item.description,
            picture: item.picture,
            picture_src: item.picture_src,
            icon: String.fromCharCode(item.picture_src === null ? 0xf111 : 0xf058),
            icon_class: item.picture_src === null ? "fa-circle" : "fa-check-circle"
          });
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
