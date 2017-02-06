'use strict';

// Controller used on the forum index (/forum/)
//
// TODO: 
//   * change SyncQueue.requestSets.forumIndex adding the following arguments:
//      - page
//      - threads per page
//      - order by
//   * implement pagination
//   * implement display order according to the different columns (or implement it in the filter tab?)

angular.module('algorea')
   .controller('forumIndexController', ['$scope', 'itemService', 'loginService', '$state', '$timeout', '$rootScope', '$i18next', function ($scope, itemService, loginService, $state, $timeout, $rootScope, $i18next) {
   $scope.layout.isOnePage(true);
   $scope.refreshing = true;
   $scope.loading = true;
   $scope.threads = {};
   $scope.currentFilter = null;
   $scope.formValues = {};
   $scope.filterInfos = {filters: {}, currentFilter: null};
   // global filters are on the left
   $scope.globalFilters = {
      all: {filter: null, description: 'Toutes'},
      favorites: {filter: {bStarred: true}, description: $i18next.t('forum_favorites')},
      unread: {filter: {bUnread: true}, description: $i18next.t('forum_unread')},
      participated: {filter: {bParticipated: true}, description: $i18next.t('forum_participated')}
   };
   $scope.selectFilter = function(filter) {
      $scope.filterInfos.currentFilter = filter;
      SyncQueue.planToSend(0);
   };
   $scope.selectGlobalFilter = function(filter, filterName) {
      console.error(filterName);
      $scope.currentGlobalFilter = filter;
      // TODO: cache minVersion for requestSet?
      SyncQueue.requestSets.forumIndex.minVersion = 0;
      SyncQueue.requestSets.forumIndex.globalFilter = filterName;
      $scope.refresh();
   };
   $scope.selectTab = function(tabName) {
      console.error(tabName);
      if (tabName != $scope.currentTabName) {
         $scope.currentTabName = tabName;
         // TODO: cache minVersion for requestSet? seems difficult with pagination, etc.
         SyncQueue.requestSets.forumIndex.minVersion = 0;
         SyncQueue.requestSets.forumIndex.tabName = tabName;
         $scope.refresh();
      }
   };
   $scope.refresh = function() {
      $scope.refreshing = true;
      itemService.syncForumIndex(function() {
         $scope.refreshing = false;
         $scope.$applyAsync();
      });
   };
   $scope.currentGlobalFilter = $scope.globalFilters.all;
   $scope.init = function() {
      $scope.myUserID = SyncQueue.requests.loginData.ID;
      $scope.currentTabName = 'helpOthers';
      SyncQueue.requestSets.forumIndex = {minVersion: 0, name: 'forumIndex', tabName: $scope.currentTabName};
      itemService.syncForumIndex(function() {
         $scope.threads = ModelsManager.getRecords('threads');
         $scope.loading = false;
         $scope.refreshing = false;
         $timeout($scope.$apply);
      });
   }
   itemService.onNewLoad(function() {
      $scope.init();
   });
   $scope.$on('syncResetted', function() {
      $scope.loading = true;
      itemService.onNewLoad(function() {
         $scope.init();
      });
   });
   $scope.$on('$destroy', function() {
      itemService.unsyncForumIndex();
   });
   $scope.tabs = {
      'helpOthers': {active: true, length: 0},
      'getHelp': {active: false, length: 0},
      'general': {active: false, length: 0},
      'technicalSupport': {active: false, length: 0}
   };
   $scope.setGlobalFilter = function(filterField) {
      $scope.globalFilter = {};
      if (!filterField) {
         return;
      }
      $scope.globalFilter[filterField] = true;
   };
   $scope.goToUser = function(userID) {
      console.log('goToUser('+userID+');');
   };
   $scope.newThread = function(sType) {
      if (!sType) {
         sType = 'Help';
      }
      $state.go('newThreadType', {sType: sType});
   };
}]);

// controller of a thread when displayed in the forum index

angular.module('algorea')
   .controller('forumIndexThreadController', ['$scope', '$state', 'itemService', '$i18next', function ($scope, $state, itemService, $i18next) {
   function getUserThread(thread) {
      var result_user_thread = null;
      angular.forEach(thread.user_thread, function(user_thread) {
         result_user_thread = user_thread;
         return;
      });
      return result_user_thread;
   };
   // we don't want users_threads for all users and all threads, only meaningful
   // ones, so we create them only when relevant
   $scope.user_thread = getUserThread($scope.thread);
   $scope.accessible = false;
   if (!$scope.thread.idItem) {
      $scope.accessible = true;
   }

   if ($scope.thread.idItem && $scope.thread.item) {
      $scope.user_item = itemService.getUserItem($scope.thread.item);
      if (($scope.user_item && $scope.user_item.bValidated == 1) || $scope.thread.idUserCreated == $scope.myUserID) {
         $scope.accessible = true;
      }
   }
   $scope.goToThread = function(idThread) {
      if ($scope.accessible) {
         $state.go('thread', {idThread: idThread});
      }
   };
   if (!$scope.accessible) {
      $scope.accessibiltyMessage = $i18next.t('forum_needs_solved');
   }
   $scope.isUserThreadTmp = false;
   if (! $scope.user_thread) {
      $scope.isUserThreadTmp = true;
      $scope.user_thread = ModelsManager.createRecord('users_threads');
      $scope.user_thread.idUser = $scope.myUserID;
      $scope.user_thread.idThread = $scope.thread.ID;
   }
   $scope.saveUserThread = function(event) {
      if (! $scope.isUserThreadTmp) {
         ModelsManager.updated('users_threads', $scope.user_thread.ID);
      } else {
         // TODO: handle case where a user_thread has been created in the
         // meantime
         ModelsManager.insertRecord('users_threads', $scope.user_thread);
      }
      event.stopPropagation();
   };
}]);


