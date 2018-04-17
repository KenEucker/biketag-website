var express = require('express'),
    path = require('path'),
    app = express(),
    favicon = require('serve-favicon'),
    port = 8080;

console.log(path.join(__dirname, '/templates/biketag/'));
app.use(express.static(path.join(__dirname, '/templates/biketag/')));
app.use(favicon(path.join(__dirname, 'assets/', 'favicon.ico')));

app.use("/assets", function(req, res) {
    var file = req.url = (req.url.indexOf('?') != -1) ? req.url.substring(0, req.url.indexOf('?')) : req.url;
    res.sendFile(path.join(__dirname, "assets/", req.url));
});

app.listen(port, function () {
    console.log("App listening on: http://localhost:" + port);
});
