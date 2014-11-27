require.config({
    name: 'main',
    paths: {
        async: '../vendor/requirejs-plugins/src/async',
        text: '../vendor/requirejs-text/text',
        jquery: '../vendor/jquery/src/jquery',
        moment: '../vendor/moment/moment',
        momentLocale: '../vendor/moment/locale',
        rxjs: '../vendor/rxjs/dist/rx.all.min',
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

    function dispatch(action, params) {
        return merge({
            action: action
        }, params || {})
    }

    var actions = new Stream();
    var actionsClicks = $(document).streamOn('click', '[data-action]').map(element).map(elementToData);

    actionsClicks.pipe(actions);

    // Auth
    actions.accept(actionIs('try-auth')).on('data', function () {
        console.log('[-] action try-auth');
        calendar.authorize().then(function (v) {
            console.log('[√] try-auth', v);
            actions.push(dispatch('authorized'));
        }, function (e) {
            console.log('[x] try-auth', e);
            actions.push(dispatch('authorized-error'));
        })
    });
    actions.accept(actionIs('authorized')).on('data', function () {
        console.log('[-] action authorized');
        $('body').removeClass('no-auth');
        actions.push(dispatch('load-calendars'));
    });
    actions.accept(actionIs('authorized-error')).on('data', function () {
        console.log('[-] action authorized-error');
        // Display some kind of info
        actions.push(dispatch('unauthorized'));
    });
    actions.accept(actionIs('unauthorized')).on('data', function () {
        console.log('[-] action unauthorized');
        $('body').addClass('no-auth');
    });
    // Calendars
    actions.accept(actionIs('load-calendars')).on('data', function () {
        console.log('[-] action load-calendars');
        calendar.loadCalendarList().on('data', function (items) {
            $('#js-calendars-list').html(
                calendarsListView({
                    items: items
                })
            );
            console.log('[√] load-calendars', items);
        }).on('error', function (e) {
            console.log('[e] load-calendars', e);
        });
    });
    actions.accept(actionIs('toggle-calendar')).on('data', function (params) {
        console.log('[-] action toggle-calendar', params.id);
        calendar.loadEventsList(params.id, new Date()).on('data', function (items) {
            $('#js-events-list').html(
                eventsListView({
                    items: items
                })
            );
            console.log('[√] load-events', items);
        }).on('error', function (e) {
            console.log('[e] load-events', e);
        });
    });

    console.log('[-] init try-auth');
    actions.push(dispatch('try-auth'));
});

