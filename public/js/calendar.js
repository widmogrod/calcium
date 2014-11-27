define(['gapi', 'config', 'jef/stream', 'jef/functional/map'], function (gapi, config, Stream, map) {
    'use strict';

    gapi.client.setApiKey(config.gapi.apiKey);

    return {
        authorize: function() {
            return gapi.auth.authorize(config.gapi);
        },
        loadCalendarList: function () {
            return Stream.fromPromise(gapi.client.request({
                'path': '/calendar/v3/users/me/calendarList'
            })).map(function(result) {
                // Better would be flatMap
                // TODO: In Stream Remove []
                return [result.result.items];
            }).map(function(items) {
                // TODO: In Stream Remove []
                return [map(items, function(item) {
                    return {
                        id: item.id,
                        name: item.summary
                    }
                })];
            });
        }
    }
});
