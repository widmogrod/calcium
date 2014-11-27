require.config({
    name: 'main',
    paths: {
        async: '../vendor/requirejs-plugins/src/async',
        text: '../vendor/requirejs-text/text',
        jquery: '../vendor/jquery/src/jquery',
        jef: '../vendor/jef/src'
    }
});

define([
    'calendar',
    'jef/stream',
    'text!template/calendars-list.html',
    'jef/integration/jquery.streamOn'
], function(calendar, Stream, calendarsListTemplate) {
    'use strict';

    var calendarsListView = _.template(calendarsListTemplate);

    function element(e) {
        return $(e.target);
    }

    function elementToAction($el) {
        return $el.data('action');
    }

    function equal(name) {
        return function(action) {
            return action === name
        }
    }

    var actionsClicks = $(document).streamOn('click', '[data-action]').map(element).map(elementToAction);

    var actions = new Stream();

    actionsClicks.pipe(actions);

    // Auth
    actions.accept(equal('try-auth')).on('data', function() {
        calendar.authorize().then(function(v) {
            console.log('[√] try-auth', v);
            actions.push('authorized');
        }, function(e) {
            console.log('[x] try-auth', e);
            actions.push('authorized-error');
        })
    });
    actions.accept(equal('authorized')).on('data', function() {
        $('body').removeClass('no-auth');
        actions.push('load-calendars');
    });
    actions.accept(equal('authorized-error')).on('data', function() {
        // Display some kind of info
        actions.push('unauthorized');
    });
    actions.accept(equal('unauthorized')).on('data', function() {
        $('body').addClass('no-auth');
    });
    // Calendars
    actions.accept(equal('load-calendars')).on('data', function() {
        calendar.loadCalendarList().on('data', function(items) {
            $('#js-calendars-list').html(
                calendarsListView({
                    items: items
                })
            );
            console.log('[√] load-calendars', items);
        }).on('error', function(e) {
            console.log('[e] load-calendars', e);
        });
    });

    console.log('[-] init try-auth');
    actions.push('try-auth');
});

