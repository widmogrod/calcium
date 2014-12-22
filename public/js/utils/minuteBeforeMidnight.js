define(['./constant'], function (constant) {
    'use strict';

    return function minuteBeforeMidnight(minute) {
        return minute < constant.MIDNIGHT;
    };
});
