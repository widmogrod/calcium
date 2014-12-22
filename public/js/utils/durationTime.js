define(function () {
    'use strict';

    return function durationTime(o) {
        return o.duration.fromMidnight + o.duration.duration;
    }
});
