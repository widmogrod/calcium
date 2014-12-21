define(['moment'], function(moment) {
    'use strict';

    return function dateToRange(date) {
        var m = moment(date)

        return {
            start: m.startOf('week').format('YYYY-MM-DD') + 'T00:00:00+01:00',
            end: m.endOf('week').format('YYYY-MM-DD') + 'T23:59:59+01:00'
        }
    }
});
