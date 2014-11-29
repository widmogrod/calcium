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
    'jef/stream',
    'jef/functional/merge',
    'text!template/calendars-list.html',
    'text!template/events-list.html',
    'jef/integration/jquery.streamOn'
], function (moment, momentLocale, calendar, Stream, merge, calendarsListTemplate, eventsListTemplate) {
    'use strict';

    moment.locale('en-gb');

    var calendarsListView = _.template(calendarsListTemplate);
    var eventsListView = _.template(eventsListTemplate);

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

    var actions = new Stream();
    var actionsClicks = $(document).streamOn('click', '[data-action]').map(element).map(elementToData);

    actionsClicks.pipe(actions);

    // Auth
    actions.accept(actionIs('try-auth')).on('data', function (params) {
        calendar.authorize(params.immediate).then(function (v) {
            actions.push(dispatch('authorized'));
        }, function (e) {
            console.log('[x] error of authorization:', e);
            actions.push(dispatch('authorized-error'));
        })
    });
    actions.accept(actionIs('authorized')).on('data', function () {
        $('body').removeClass('no-auth');
        actions.push(dispatch('load-calendars'));
    });
    actions.accept(actionIs('authorized-error')).on('data', function () {
        // Display some kind of info
        actions.push(dispatch('unauthorized'));
    });
    actions.accept(actionIs('unauthorized')).on('data', function () {
        $('body').addClass('no-auth');
    });
    // Calendars
    actions.accept(actionIs('load-calendars')).on('data', function () {
        calendar.loadCalendarList().on('data', function (items) {
            $('#js-calendars-list').html(
                calendarsListView({
                    items: items
                })
            );
        }).on('error', function (e) {
            console.log('[e] load-calendars', e);
        });
    });
    actions.accept(actionIs('toggle-calendar')).on('data', function (params) {
        calendar.loadEventsList(params.id, new Date()).on('data', function (items) {
            $('#js-events-list').html(
                eventsListView({
                    items: items
                })
            );
        }).on('error', function (e) {
            console.log('[e] load-events', e);
        });
    });
    actions.accept(actionAny(['authorized', 'unauthorized'])).on('data', function() {
        $('body').addClass('ready').removeClass('init');
    });

    actions.push(dispatch('try-auth', {immediate: true}));
});

