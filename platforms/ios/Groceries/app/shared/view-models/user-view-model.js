var config = require("../../shared/config");
var fetchModule = require("fetch");
var observableModule = require("data/observable");
var validator = require("email-validator");

function User(info) {
    info = info || {};

    // You can add properties to observables on creation
    var viewModel = new observableModule.fromObject({
        email: info.email || "",
        password: info.password || "",
        apiUrl: info.apiUrl || ""
    });

    viewModel.login = function() {
        return fetchModule.fetch(viewModel.get("apiUrl") + "users/login", {
            method: "POST",
            body: JSON.stringify({
                email: viewModel.get("email"),
                password: viewModel.get("password")
            }),
            headers: getCommonHeaders()
        })
        .then(handleErrors)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            config.token = data.email;
        });
    };

    viewModel.register = function() {
        return fetchModule.fetch(config.apiUrl + "users", {
            method: "POST",
            body: JSON.stringify({
                email: viewModel.get("email"),
                password: viewModel.get("password")
            }),
            headers: getCommonHeaders()
        }).then(handleErrors);
    };

    viewModel.isValidEmail = function() {
        var email = this.get("email");
        return validator.validate(email);
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

module.exports = User;