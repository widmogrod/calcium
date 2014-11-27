require.config({
    name: 'main',
    paths: {
        async: '../vendor/requirejs-plugins/src/async'
    }
});

define(['gapi', 'config'], function(gapi, config) {
    'use strict';

    gapi.client.setApiKey(config.gapi.apiKey);

    //gapi.auth.authorize(config, function () {
    //    console.log('login complete');
    //    console.log(gapi.auth.getToken());
    //});

    gapi.client.request({
        'path': '/calendar/v3/users/me/calendarList'
    }).then(function (r) {
        console.log('r', r);
    }, function (e) {
        console.log('e', e);
    });
});

