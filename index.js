// https://www.googleapis.com/auth/calendar
// https://www.googleapis.com/auth/calendar
var express = require('express');
var fs = require('fs'); // this engine requires the fs module

var app = express();

app.engine('html', function (filePath, options, callback) {
    fs.readFile(filePath, function (err, content) {
        if (err) throw new Error(err);
        return callback(null, content.toString());
    })
});
app.set('views', './templates'); // specify the views directory
app.set('view engine', 'html');
app.set('port', process.env.PORT || 5000);

app.get('/', function (req, res) {
    res.render('index');
});
app.get('/root-lotus-777', function (req, res) {
    res.render('index');
});

var server = app.listen(app.get('port'), function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)

});
