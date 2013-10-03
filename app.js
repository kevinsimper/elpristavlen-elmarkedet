var request = require('request');
var fs = require('fs');
var unzip = require('unzip');
var program = require('commander');
var moment = require('moment'); 
var nconf = require('nconf');

nconf.file('./config.json');
var StartDate, EndDate;
StartDate = moment().subtract('month', 1).startOf('month').format('M/D/YYYY');
EndDate = moment().subtract('month', 1).day(10).format('M/D/YYYY');

console.log('Path', nconf.get('path'));
program
  .version('0.0.1')
  .option('-r, --run', 'Run the program')
  .option('-t, --test', 'Run a test run, but do not store data.')
  .option('-c, --config', 'Make a config.json file where the program is.')
  .option('-d, --date [value]', 'Set the date manually, which month to download, eg. 10/2013')
  .parse(process.argv);

if(program.date){
  // Manuelly override the date
  var newDate = program.date.split('/');
  StartDate = moment().month(newDate[0] - 1).year(newDate[1]).startOf('month').format('M/D/YYYY');
  EndDate = moment().month(newDate[0] - 1).year(newDate[1]).endOf('month').format('M/D/YYYY');
}

StartDate += ' 12:00:00 AM';
EndDate += ' 12:00:00 AM';

console.log(StartDate);
console.log(EndDate);

if(program.run) {
  var url = init();
  console.log(url);
  downloadFile(url);
}

if(program.test) {
  var url = init();
  console.log(url);
  request(url, function(err, response, body){
    if(err) console.log(err);
    console.log(response);
  });
}



if(program.config){
  // Make a config file
  nconf.set('path', './');
  nconf.set('lastRun', '');
  nconf.
  nconf.save();
}

function init() {
  console.log('Init');
  var url = "http://www.elpristavlen.dk/layouts/danskenergi/StatisticsHttpHandler.ashx?ReportType=0&StartDate=" + StartDate + "&EndDate=" + EndDate;
  return url;
}

function downloadFile(url) {
  console.log('Downloading..');
  var zipfile = fs.createWriteStream('statestik.zip');
  var r = request(url).pipe(zipfile);

  var counter = 1;
  var wait = setInterval(function(){
    console.log(10 * counter + ' sekunder gået..')
    counter++;
  }, 10000);


  r.on('close', function(){
    console.log('File downloading finished');
    clearInterval(wait);
    extractFiles();
  });
  
}

function extractFiles() {
  var finalfile = fs.createReadStream('statestik.zip');
  finalfile.pipe(unzip.Extract({ path: './'}));
  console.log('Unzip complete');
  finalfile.on('close', function(){
    fs.unlink('statestik.zip');
    fs.readdir('./', function(err, list){
      console.log(list);
    });
  });
}