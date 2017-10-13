var fs = require('fs');
var express = require('express');
var app = express();
var path = require('path');
var XLSX = require('xlsx');
var bodyParser = require('body-parser');
var uid = require('uniqid');
var port = 8183;

app.use('/', express.static('public'));
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({limit: '5mb'}));
app.use(bodyParser.text({limit: '5mb'}));


app.get('/', function (req, res) {
res.sendFile(path.join(__dirname,"pages/sysadmin.html"))

});

app.get("/sysadmin/logs", function (req, res) {
   // res.sendFile(appViewsPath+'sysadmin/logs.html');
    res.sendFile(path.join(__dirname,"pages/sysadmin/logs.html"))
});


//app.post('/get_data_for_dialog', function (req, res) {
//   var data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json")));
//   var outData={};
//    outData.columns=data.columns;
//    outData.items = data.rows;
//    console.log("outData=",outData);
//    res.send(outData);
//});

app.listen(port, function (err) {
    console.log("app run on port ", port);
});
