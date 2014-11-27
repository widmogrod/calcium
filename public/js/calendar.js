define([
    'gapi',
    'config',
    'utils/dateToRange',
    'utils/dateDurationInMinutes',
    'utils/dateMinutesFromMidnight',
    'jef/stream',
    'jef/functional/merge',
    'jef/functional/map'
], function (gapi, config, dateToRange, dateDurationInMinutes, dateMinutesFromMidnight, Stream, merge, map) {
    'use strict';

    gapi.client.setApiKey(config.gapi.apiKey);

    return {
        authorize: function (immediate) {
            return gapi.auth.authorize(_.merge(
                config.gapi,
                immediate ? {immediate: true} : {}
            ));
        },
        loadCalendarList: function () {
            return Stream.fromPromise(gapi.client.request({
                path: '/calendar/v3/users/me/calendarList'
            })).map(function (result) {
                // Better would be flatMap
                // TODO: In Stream Remove []
                return [result.result.items];
            }).map(function (items) {
                // TODO: In Stream Remove []
                return [map(items, function (item) {
                    return {
                        id: item.id,
                        name: item.summary
                    }
                })];
            }).map(function (items) {
                return [
                    _.sortBy(items, ['name'])
                ];
            });
        },
        loadEventsList: function (calendarId, date) {
            var range = dateToRange(date);

            return Stream.fromPromise(gapi.client.request({
                path: '/calendar/v3/calendars/' + calendarId + '/events',
                params: {
                    timeMax: range.end,
                    timeMin: range.start
                }
            })).map(function (result) {
                // Better would be flatMap
                // TODO: In Stream Remove []
                // Remove items without start-end date
                return [_.filter(result.result.items, function(item) {
                    return item.start && item.end;
                })];
            }).map(function (items) {
                // TODO: In Stream Remove []
                return [map(items, function (item) {
                    return {
                        id: item.id,
                        name: item.summary,
                        status: item.status,
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
                })];
            }).map(function (items) {
                return [
                    _.sortBy(items, ['name'])
                ];
            });
        }
    }
});
