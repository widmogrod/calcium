define(['./constant'], function (constant) {
    'use strict';

    /**
     * Return absolute offset percent of the given duration from the midnight
     *
     * @param {{duration: number, fromMidnight: number}}
     * @return {Number}
     */
    return function offsetTime(time) {
        return time / constant.MIDNIGHT * 100;
    }
});
