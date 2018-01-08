

(function() {
  "use strict";
  angular.module("api", [])
  .constant('Title', { value: 'Simple example of Angularjs 1.6' })
  .controller("apiCtrl", ["Title", MainCtrl]);
  function MainCtrl(Title) {
  	this.test="Maria Burlando";
  	this.title = Title.value;
  	this.myText = "My text";

    angular.element(document).ready(function () {});
  }
})();