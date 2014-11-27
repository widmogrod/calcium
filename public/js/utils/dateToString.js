define(function() {
    'use strict';

    /**
     * @param {Date} d
     * @return {String}
     */
    return function dateToString(d) {
        // 2014-11-27T08:00:00.000Z
        var result;

        result = d.getFullYear();
        result += '-';
        result += d.getMonth() + 1;
        result += '-';
        result += d.getDate();
        result += 'T';
        result += d.getHours();
        result += ':';
        result += d.getMinutes();
        result += ':';
        result += d.getSeconds();
        result += '.000Z';

        return result;
    }
});
