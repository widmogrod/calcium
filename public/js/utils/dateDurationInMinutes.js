define(['moment'], function(moment) {
    'use strict';

    /**
     * Return duration in minutes
     *
     * @param {String|Date} start
     * @param {String|Date} end
     * @return integer
     */
    return function dateDurationInMinutes(start, end) {
        return moment(end).diff(start, 'minutes');
    }
});
