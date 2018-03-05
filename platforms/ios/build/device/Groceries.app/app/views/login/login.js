var config = require("../../shared/config");
var dialogsModule = require("ui/dialogs");
var frameModule = require("ui/frame");

var UserViewModel = require("../../shared/view-models/user-view-model");
var user = new UserViewModel({
  email: "username@domain.com",
  password: "password",
  apiUrl: "foo"
});

exports.loaded = function(args) {
  page = args.object;
  if (page.ios) {
      var navigationBar = frameModule.topmost().ios.controller.navigationBar;
      navigationBar.barStyle = UIBarStyle.UIBarStyleBlack;
  }
  page.bindingContext = user;
};

exports.signIn = function() {
  user.login()
    .catch(function(error) {
      console.log(error);
      dialogsModule.alert({
        message: "Unfortunately we could not find your account.",
        okButtonText: "OK"
      });
      return Promise.reject();
    })
    .then(function() {
      frameModule.topmost().navigate({ moduleName: "views/list/list", clearHistory: true });
    });
};

exports.register = function() {
  var topmost = frameModule.topmost();
  topmost.navigate("views/register/register");
};
