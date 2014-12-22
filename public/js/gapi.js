define('gapi', ['config', 'async!https://apis.google.com/js/client.js!onload'], function (config) {
    'use strict';

    gapi.client.setApiKey(config.gapi.apiKey);

    return gapi;
});
