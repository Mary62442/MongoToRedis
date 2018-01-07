$(document).ready(function() {
	console.log("ready!");
});

(function() {
  "use strict";
  angular.module("api", [])
  .constant('Title', {
    value: 'Simple example of Angularjs 1.6'
  })
  .controller("MainCtrl", ["Title", MainCtrl]);
  function MainCtrl(Title) {

  	
    angular.element(document).ready(function () {
       alert('from controller');
    });
  }
})();