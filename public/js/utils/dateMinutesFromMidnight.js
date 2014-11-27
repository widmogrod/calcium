define(['moment'], function(moment) {
    'use strict';

    /**
     * Return duration in minutes
     *
     * @param {String|Date} date
     * @return integer
     */
    return function dateMinutesFromMidnight(date) {
        var midnight = moment(date).startOf('day');
        return moment(date).diff(midnight, 'minutes');
    }
});
