define([
    'gapi',
    'config',
    'utils/dateToRange',
    'utils/dateDurationInMinutes',
    'utils/dateMinutesFromMidnight',
    'utils/minuteBeforeMidnight',
    'utils/durationTime',
    'jef/stream2',
    'jef/functional/merge',
    'jef/functional/map',
    'jef/functional/reduce',
    'moment'
], function (gapi, config, dateToRange, dateDurationInMinutes,
             dateMinutesFromMidnight, minuteBeforeMidnight,
             durationTime,
             Stream, merge, map, reduce, moment) {
    'use strict';

    return {
        authorize: function (immediate) {
            var o = merge(
                config.gapi,
                immediate ? {immediate: true} : {}
            );
            return gapi.auth.authorize(o);
        },
        loadCalendarList: function () {
            return Stream.fromPromise(gapi.client.request({
                path: '/calendar/v3/users/me/calendarList'
            })).map(function (value) {
                return Stream.fromArray(value.result.items);
            }).concat().map(function (item) {
                return {
                    id: item.id,
                    name: item.summary
                }
            }).filter(function (item) {
                return /Room$/.test(item.name);
            }).toArray();
        },
        loadEventsList: function (calendarId, date) {
            var range = dateToRange(date);
            return Stream.fromPromise(gapi.client.request({
                    path: '/calendar/v3/calendars/' + calendarId + '/events',
                    params: {
                        timeMax: range.end,
                        timeMin: range.start,
                        orderBy: 'startTime',
                        singleEvents: true
                    }
                }))
                .map(function (value) {
                    return Stream.fromArray(value.result.items);
                })
                .concat()
                .filter(function (item) {
                    return item.status === 'confirmed'
                    && item.visibility !== 'private'
                })
                .map(function (item) {
                    return {
                        start: moment(item.start.dateTime),
                        duration: {
                            fromMidnight: dateMinutesFromMidnight(item.start.dateTime),
                            duration: dateDurationInMinutes(item.start.dateTime, item.end.dateTime)
                        }
                    }
                })
                .group(function (item) {
                    return item.start.day();
                })
                .map(function (data) {
                    return Stream.fromArray(data)
                        .reduce(function (value, base) {
                            base.key = value.duration.fromMidnight;
                            base.index = base.indices.indexOf(base.key);
                            if (-1 === base.index) {
                                base.result.push(value);
                                base.indices.push(base.key);
                                base.index = base.indices.length - 1;
                            }
                            if (base.result[base.index].duration.duration < value.duration.duration) {
                                base.result[base.index] = value;
                            }

                            return base;
                        }, {
                            key: null,
                            index: null,
                            indices: [],
                            result: []
                        })
                        .map(function (value) {
                            return Stream.fromArray(value.result);
                        })
                        .concat()
                        .reduce(function (value, base) {
                            if (!base.prev) {
                                base.prev = value;
                                base.result.push(base.prev);
                            } else if (durationTime(base.prev) >= value.duration.fromMidnight) {
                                base.prev = base.result[base.result.length - 1] = merge(value, {
                                    duration: {
                                        duration: base.prev.duration.duration + value.duration.duration,
                                        fromMidnight: base.prev.duration.fromMidnight
                                    }
                                });
                            } else {
                                base.prev = value;
                                base.result.push(base.prev);
                            }

                            return base;
                        }, {
                            prev: null,
                            result: []
                        })
                        .map(function (item) {
                            return Stream.fromArray(item.result);
                        })
                        .concat()
                        .reduce(function (value, base) {
                            if (base.prev) {
                                base.result.push({
                                    data: value,
                                    duration: value.duration.fromMidnight - durationTime(base.prev),
                                    fromMidnight: base.prev.duration.fromMidnight
                                });
                                base.prev = value;
                            } else if (value.duration.fromMidnight) {
                                base.prev = value;
                                base.result.push({
                                    data: value,
                                    duration: value.duration.fromMidnight,
                                    fromMidnight: 0
                                });
                            }

                            return base;
                        }, {
                            prev: null,
                            result: []
                        })
                        .map(function (diff) {
                            if (minuteBeforeMidnight(durationTime(diff.prev))) {
                                diff.result.push({
                                    data: diff.prev,
                                    duration: 1440 - durationTime(diff.prev),
                                    fromMidnight: durationTime(diff.prev)
                                })
                            }

                            return Stream.fromArray(diff.result);
                        })
                        .concat()
                })
                .concat()
                .map(function (item) {
                    return {
                        id: null,
                        name: item.data.start.format('dddd'),
                        duration: item
                    }
                })
                .group(function (item) {
                    return item.duration.data.start.day()
                })
        }
    }
});
