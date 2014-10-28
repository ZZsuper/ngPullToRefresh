'use strict';
/*global angular*/

function offset(elem) {
  var x = 0;
  var y = 0;

  while (elem) {
    x += elem.offsetLeft;
    y += elem.offsetTop;
    elem = elem.offsetParent;
  }

  return { left: x, top: y };
}

angular.module('ngPullToRefresh')
  .directive('pullToRefresh', ['$compile', function ($compile) {

    return {

      link: function (scope, element, attrs) {

        var scrollElem = document.querySelector('.main');
        // refresh function should accept a callback function parameter,
        // so we can hide the pull-to-refresh status
        var refreshFunc = scope.$eval(element.attr('pull-to-refresh'));
        scope.pullState = '';
        var threshold = 80;

        var wrapper = angular.element('<div class="pull-to-refresh" />');
        var statusElem = angular.element('<header ng-switch on="pullState">' +
          '<div ng-switch-when="refreshing"><i class="icon refreshing spin"></i> Loading.....</div>' +
          '<div ng-switch-when="ready"><i class="icon release"></i> Release to refresh</div>' +
          '<div ng-switch-default=""><i class="icon pull-down"></i> Pull down to refresh</div>' +
          '</header>');
        statusElem = $compile(statusElem)(scope);

        element[0].parentNode.insertBefore(wrapper[0], element[0]);
        wrapper.append(statusElem);
        wrapper.append(element);

        var wrapperOffsetY = offset(wrapper[0]).top;
        element.css('position', 'relative');
        element.css('top', '0px');

        //grab the loading div
        //var loader = angular.element(document.getElementById("touchloader"));

        //keep the state whether the fingers are touched
        var isTouched = false;
        //keep the state whether a PULL actually went out
        var isMoved = false;
        //This has the original Top offset (relative to screen) position of the list
        var prevY = null;
        //This has the original Top CSS position of the list
        var cssY = element.css('top');
        console.log('cssY=' + cssY);
        cssY = parseInt(cssY.substring(0, cssY.length - 2));

        function pullingDown(change) {
          console.log('pulling down: ' + change);
          if (change > 0) {
            if (change > threshold) {
              scope.pullState = 'ready';
            } else {
              scope.pullState = change;
            }
            statusElem.css('display', 'block');
            element.css('top', cssY + change + 'px');
            isMoved = true;
            scope.$apply();
          }
        }

        function pullingStopped(change) {
          var restoreCssY = cssY;
          if (isMoved && change > threshold) {
            restoreCssY += 60;
            scope.pullState = 'refreshing';
            scope.$apply();
            callRefreshFunc();
          } else {
            //statusElem.css('display', 'none');
          }
          element.css('transition', 'top 1s');
          element.css('top', restoreCssY + 'px');
          isTouched = false;
          isMoved = false;
        }

        function callRefreshFunc() {
          if (angular.isFunction(refreshFunc)) {
            console.log('calling refresh function');
            refreshFunc(function () {
              element.css('transition', 'top 1s');
              element.css('top', cssY + 'px');
              //statusElem.css('display', 'none');
            });
          } else {
            console.log('simulate refresh function');
            window.setTimeout(function () {
              element.innerHTML = '<li>new user</li><li>new user 2</li>' + element.innerHTML;
              element.css('transition', 'top 1s');
              element.css('top', cssY + 'px');
              //statusElem.css('display', 'none');
            }, 1000);
          }
        }

        //Add the start of the touching
        element.bind('touchstart', function (e) {
          // only enable pull to refresh at the top of the page
          //if (offset(wrapper[0]).top === wrapperOffsetY) {
          if (scrollElem.scrollTop === 0) {
            console.log('touch start');
            isTouched = true;
            //initialize the touched point
            prevY = e.originalEvent.touches[0].clientY;
            console.log('prevY=' + prevY);
            //we use css3 transitions when available for smooth sliding
            element.css('transition', '');
            //e.preventDefault();
          }
        });

        element.bind('touchend', function (e) {
          //on touchup we cancel the touch event
          //now if the list has moved downwards, it should come up but in a transition
          var change = e.originalEvent.changedTouches[0].clientY - prevY;
          if (isTouched && change > 0) {
            pullingStopped(change);
            e.preventDefault();
          }
        });

        element.bind('touchmove', function (e) {
          var change = e.originalEvent.touches[0].clientY - prevY;
          if (isTouched) {
            pullingDown(change);
            e.preventDefault();
          }
        });


        //binding mouse events to make this work in desktop browsers as well
        element.bind('mousedown', function (e) {
          // only enable pull to refresh at the top of the page
          //if (offset(wrapper[0]).top === wrapperOffsetY) {

          // only check left button click
          if (e.button === 0 && scrollElem.scrollTop === 0) {

            console.log(wrapper[0]);
            console.log(offset(wrapper[0]).top);
            console.log(wrapperOffsetY);

            isTouched = true;
            prevY = e.clientY;
            element.css('transition', '');

            e.preventDefault();
          }
        });

        element.bind('mouseup', function (e) {

          if (isTouched) {
            var change = e.clientY - prevY;
            pullingStopped(change);
            e.preventDefault();
          }
        });

        element.bind('mousemove', function (e) {
          if (isTouched) {
            var change = e.clientY - prevY;
            pullingDown(change);
          }
          e.preventDefault();
        });

      }
    };
  }]);
