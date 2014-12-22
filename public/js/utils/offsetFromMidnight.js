define(['./offsetTime'], function (offsetTime) {
    'use strict';

    /**
     * Return absolute offset percent of the given duration from the midnight
     *
     * @param {{fromMidnight: number}}
     * @return {Number}
     */
    return function offsetFromMidnight(duration) {
        return offsetTime(duration.fromMidnight);
    }
});
