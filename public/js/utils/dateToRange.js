define(['moment'], function(moment) {
    'use strict';

    return function dateToRange(date) {
        var m = moment(date).format('YYYY-MM-DD');

        return {
            start: m + 'T00:00:00+01:00',
            end: m + 'T23:59:59+01:00'
        }
    }
});
