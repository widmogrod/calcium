require.config({
    name: 'main',
    paths: {
        async: '../vendor/requirejs-plugins/src/async',
        jquery: '../vendor/jquery/src/jquery',
        jef: '../vendor/jef/src'
    }
});

define(['calendar', 'jef/stream', 'jef/integration/jquery.streamOn'], function(calendar, Stream) {
    'use strict';

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

    actions.accept(equal('try-auth')).on('data', function() {
        calendar.authorize().then(function() {
            actions.push('authorized');
        }, function(e) {
            actions.push('authorized-error');
        })
    });
    actions.accept(equal('authorized')).on('data', function() {
        $('body').removeClass('no-auth');
    });
    actions.accept(equal('authorized-error')).on('data', function() {
        $('body').removeClass('no-auth');
    });
    actions.accept(equal('unauthorized')).on('data', function() {
        $('body').addClass('no-auth');
    });

    if (calendar.isAuth()) {
        actions.push('unauthorized');
    }
});

