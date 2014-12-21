require.config({
    name: 'main',
    paths: {
        async: '../vendor/requirejs-plugins/src/async',
        text: '../vendor/requirejs-text/text',
        jquery: '../vendor/jquery/src/jquery',
        moment: '../vendor/moment/moment',
        momentLocale: '../vendor/moment/locale',
        jef: '../vendor/jef/src'
    }
});

define([
    'moment',
    'momentLocale/en-gb',
    'calendar',
    'jef/stream2',
    'jef/functional/merge',
    'text!template/calendars-list.html',
    'text!template/events-list.html',
    'text!template/events-time.html',
    'jef/integration/jquery.streamOn'
], function (moment, momentLocale, calendar, Stream,
             merge, calendarsListTemplate, eventsListTemplate, eventsTimeTemplate){
    'use strict';

    moment.locale('en-gb');

    var calendarsListView = _.template(calendarsListTemplate);
    var eventsListView = _.template(eventsListTemplate);
    var eventsTimeView = _.template(eventsTimeTemplate);

    function element(e) {
        return $(e.target);
    }

    function elementToData($el) {
        return $el.data();
    }

    function actionIs(name) {
        return function (data) {
            return data.action === name
        }
    }
    function actionAny(actions) {
        return function (data) {
            return -1 !== actions.indexOf(data.action);
        }
    }

    function dispatch(action, params) {
        return merge({
            action: action
        }, params || {})
    }

    var $doc = $(document);
    var actions = new Stream.Push();
    var actionsClicks = Stream.fromEmitter($doc, '[data-action]', 'click').map(element).map(elementToData);

    actions.consume(actionsClicks);
    actions.log('actions');

    // Auth
    actions.filter(actionIs('try-auth')).on(function (params) {
        calendar.authorize(params.immediate).then(function () {
            actions.push(dispatch('authorized'));
        }, function (e) {
            console.log('[x] error of authorization:', e);
            actions.push(dispatch('authorized-error'));
        })
    });
    actions.filter(actionIs('authorized')).on(function () {
        $('body').removeClass('no-auth');
        actions.push(dispatch('load-calendars'));
    });
    actions.filter(actionIs('authorized-error')).on(function () {
        // Display some kind of info
        actions.push(dispatch('unauthorized'));
    });
    actions.filter(actionIs('unauthorized')).on(function () {
        $('body').addClass('no-auth');
    });
    // Calendars
    actions.filter(actionIs('load-calendars')).on(function () {
        calendar.loadCalendarList().on(function (items) {
            $('#js-calendars-list').html(
                calendarsListView({
                    items: items
                })
            );
        });
    });
    actions.filter(actionIs('toggle-calendar')).on(function (params) {
        var $result = $('#js-events-list');
        $result.html(eventsTimeView());

        calendar.loadEventsList(params.id, new Date()).on(function(items) {
            $result.append(
                eventsListView({
                    items: items
                })
            );
        });
    });
    actions.filter(actionAny(['authorized', 'unauthorized'])).on(function() {
        $('body').addClass('ready').removeClass('init');
    });

    actions.push(dispatch('try-auth', {immediate: true}));
});

