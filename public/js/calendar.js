define(['gapi', 'config'], function (gapi, config) {
    'use strict';

    gapi.client.setApiKey(config.gapi.apiKey);

    return {
        isAuth: function() {
            return !!gapi.auth.getToken();
        },
        authorize: function() {
            return gapi.auth.authorize(config.gapi);
        },
        calendarList: function () {
            return gapi.client.request({
                'path': '/calendar/v3/users/me/calendarList'
            });
        }
    }
});
