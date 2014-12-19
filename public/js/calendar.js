define([
    'gapi',
    'config',
    'utils/dateToRange',
    'utils/dateDurationInMinutes',
    'utils/dateMinutesFromMidnight',
    'jef/stream2',
    'jef/functional/merge',
    'jef/functional/map',
    'jef/functional/reduce'
], function (gapi, config, dateToRange, dateDurationInMinutes,
             dateMinutesFromMidnight, Stream, merge, map, reduce) {
    'use strict';

    gapi.client.setApiKey(config.gapi.apiKey);

    return {
        authorize: function (immediate) {
            var o = merge(
                config.gapi,
                immediate ? {immediate: true} : {}
            );
            return gapi.auth.authorize(o);
        },
        loadCalendarList: function () {
            console.log('loadCalendarList');
            return Stream.fromPromise(gapi.client.request({
                path: '/calendar/v3/users/me/calendarList'
            }))
                .map(function (value) {
                    return Stream.fromArray(value.result.items);
                })
                .concat()
                .map(function (item) {
                    return {
                        id: item.id,
                        name: item.summary
                    }
                })
                .reduce(function (item, base) {
                    return base.push(item), base
                }, []);
        },
        loadEventsList: function (calendarId, date) {
            var range = dateToRange(date);
            return Stream.fromPromise(gapi.client.request({
                path: '/calendar/v3/calendars/' + calendarId + '/events',
                params: {
                    timeMax: range.end,
                    timeMin: range.start
                }
            }))
                .map(function (value) {
                    return Stream.fromArray(value.result.items);
                })
                .concat()
                .timeout()
                .filter(function (item) {
                    return item.status === 'confirmed'
                    && item.visibility !== 'private'
                })
                .map(function (item) {
                    return {
                        id: item.id,
                        name: item.summary,
                        start: item.start.dateTime,
                        end: item.end.dateTime,
                        recurrence: !!item.recurrence,
                        // OLD
                        range: {
                            start: item.start.dateTime,
                            end: item.end.dateTime
                        },
                        duration: {
                            fromMidnight: dateMinutesFromMidnight(item.start.dateTime),
                            duration: dateDurationInMinutes(item.start.dateTime, item.end.dateTime)
                        },
                        howManyAtendees: item.attendees ? item.attendees.length : 0
                    }
                })
                .reduce(function (item, base) {
                    return base.push(item), base
                }, [])
                .map(function (data) {
                    var gruped = reduce(data, function (value, base) {
                        if (!(value.duration.fromMidnight in base)) {
                            base[value.duration.fromMidnight] = value;
                        } else if (base[value.duration.fromMidnight].duration.duration < value.duration.duration) {
                            base[value.duration.fromMidnight] = value;
                        }
                        return base;
                    }, {});
                    // ----
                    //console.log('gruped', gruped);

                    function summ(o) {
                        return o.duration.fromMidnight + o.duration.duration;
                    }

                    var reduced2 = reduce(gruped, function (value, base) {
                        if (!base.prev) {
                            base.prev = value;
                            base.result.push(base.prev);
                        } else if (summ(base.prev) >= value.duration.fromMidnight) {
                            base.prev = base.result[base.result.length - 1] = {
                                duration: {
                                    duration: base.prev.duration.duration + value.duration.duration,
                                    fromMidnight: base.prev.duration.fromMidnight
                                }
                            };
                        } else {
                            base.prev = value;
                            base.result.push(base.prev);
                        }

                        return base;
                    }, {prev: null, data: gruped, result: []})

                    //console.log('reduced2', reduced2)

                    var diff = reduce(reduced2.result, function (value, base) {
                        if (base.prev) {
                            base.result.push({
                                duration: value.duration.fromMidnight - base.prev.duration.fromMidnight,
                                fromMidnight: base.prev.duration.fromMidnight
                            });
                            base.prev = value;
                        } else if (value.duration.fromMidnight) {
                            base.prev = value;
                            base.result.push({
                                duration: value.duration.fromMidnight,
                                fromMidnight: 0
                            });
                        }

                        return base;
                    }, {
                        prev: null,
                        result: []
                    });

                    //console.log('diff', diff);
                    var ress = diff.result;

                    if (summ(diff.prev) < 1440) {
                        ress.push({
                            duration: 1440 - summ(diff.prev),
                            fromMidnight: summ(diff.prev)
                        })
                    }

                    console.log('ress', ress);

                    return Stream.fromArray(ress);
                })
                .concat()
                .map(function (item) {
                    return {
                        id: null,
                        name: 'Free',
                        duration: item
                    }
                }).reduce(function (item, base) {
                    return base.push(item), base
                }, []);


            //return Stream.fromPromise(gapi.client.request({
            //    path: '/calendar/v3/calendars/' + calendarId + '/events',
            //    params: {
            //        timeMax: range.end,
            //        timeMin: range.start
            //    }
            //})).map(function (result) {
            //    // Better would be flatMap
            //    // TODO: In Stream Remove []
            //    // Remove items without start-end date
            //    return [_.filter(result.result.items, function(item) {
            //        return item.start && item.end;
            //    })];
            //}).map(function (items) {
            //    // TODO: In Stream Remove []
            //    return [map(items, function (item) {
            //        return {
            //            id: item.id,
            //            name: item.summary,
            //            status: item.status,
            //            range: {
            //                start: item.start.dateTime,
            //                end: item.end.dateTime
            //            },
            //            duration: {
            //                fromMidnight: dateMinutesFromMidnight(item.start.dateTime),
            //                duration: dateDurationInMinutes(item.start.dateTime, item.end.dateTime)
            //            },
            //
            //            howManyAtendees: item.attendees ? item.attendees.length : 0
            //        }
            //    })];
            //}).map(function (items) {
            //    return [
            //        _.sortBy(items, ['name'])
            //    ];
            //});
        }
    }
});
