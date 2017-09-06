'use strict';

// Make sure to include the `ui.router` module as a dependency
var app = angular.module('algorea', ['ui.router', 'ui.bootstrap', 'franceIOILogin', 'ngSanitize','small-ui-confirm', 'anguFixedHeaderTable', 'jm.i18next']);

app.factory('$exceptionHandler', ['$log', function($log) {
    return function (exception, cause) {
      $log.error(exception, cause);
      ErrorLogger.log(exception.message, exception.fileName, exception.lineNumber, exception.columnNumber, exception);
    }
}]);