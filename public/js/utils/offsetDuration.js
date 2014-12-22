define(['./offsetTime'], function (offsetTime) {
    'use strict';

    /**
     * Return absolute offset percent of the given duration from the midnight
     *
     * @param {{duration: number}}
     * @return {Number}
     */
    return function offsetDuration(duration) {
        return offsetTime(duration.duration);
    }
});
