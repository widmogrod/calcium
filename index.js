var express = require('express');
var fs = require('fs');
var sassMiddleware = require('node-sass-middleware');
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

app.use(sassMiddleware({
    src: __dirname + '/public/scss',
    dest: __dirname + '/public/css',
    outputStyle: 'compressed',
    prefix: '/css',
    debug: true
}));
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.render('index');
});
app.get('/oauth2callback', function (req, res) {
    res.render('index');
});

var server = app.listen(app.get('port'), function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)
});
