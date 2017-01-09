var Tesseract = require('tesseract.js'),
  // Promise = require('bluebird'),
  restify = require('restify'),
  TelegramBot = require('node-telegram-bot-api'),
  fs = require('fs'),
  gm = require('gm'),
  request = require('request');

var config = require('./config'),
  downloadFile = require('./downloadFile'),
  cropImage = require('./cropImage');
  compareImage = require('./compareImage');

const IMAGELOOT = 'images';
const IMAGERECENT = 'images/recent.png';

var recentSchedule = {
  date:"",
  place:"",
};

var token = config.token;
// Create a bot that uses 'polling' to fetch new updates
var bot = new TelegramBot(token, {
  polling: true
});

// ocr by tesseract
var findTextInImage = function(imagePath, chatId) {
  Tesseract.recognize(imagePath, {
    lang: 'kor'
  })
  // .progress(function (p) { console.log('progress', p);  })
  .catch(err => console.error(err))
  .then(function (result) {
    console.log( '\n\n----- '+imagePath+' -----\n' + result.text );

    var resultTextLines = result.text.split('\n');

    switch(imagePath.split('/')[1]){
      case 'dateAndPlace.png':
        recentSchedule.date = resultTextLines[0].slice(4, 17);
        recentSchedule.place = resultTextLines[1].replace("삐",'M').replace("5","B").slice(4, 8);
        break;
      case 'timestamp.png':
        // do Nothing
        break;
    }
  }).finally(function(result){
    if(chatId){
      bot.sendMessage(chatId, result.text);
    }
    // delete cropped image
    fs.unlinkSync(imagePath);
  });
};

var extractTextFromImage = function (file_id, chatId) {

  bot.downloadFile(file_id, IMAGELOOT)
  .then(function(downloadedFilepath){
    new Promise(function(resolve, reject){

        compareImage(downloadedFilepath, IMAGELOOT+"/recent.png", resolve);

    }).then(function(isDoingWork){

      console.log("then in downloadFile()", downloadedFilepath, isDoingWork);

      if(isDoingWork){
        fs.rename(downloadedFilepath, IMAGERECENT);
        // date and place info
        cropImage(IMAGERECENT, IMAGELOOT + '/dateAndPlace.png', 450, 180, 100, 120, findTextInImage, chatId);
        // timestamp info
        cropImage(IMAGERECENT, IMAGELOOT + '/timestamp.png', 600, 260, 20, 780, findTextInImage, chatId);
      } else {
        console.log('This image is not schedule image!');
        fs.unlinkSync(downloadedFilepath);
      }
    }).catch(console.log.bind(console));

  });
};

bot.onText(/\/schedule/, function(msg, match) {
  var fromId = msg.from.id;
  var scheduleMessage = '아직 등록된 일정이 없습니다.';
  console.log(recentSchedule);
  new Promise(function(resolve, reject){
    if(recentSchedule.date == ''){
      resolve();
    } else {
      reject();
    }
  }).then(function(){
    console.log("resolve");
    // date and place info
    cropImage(IMAGERECENT, IMAGELOOT + '/dateAndPlace.png', 450, 180, 100, 120, findTextInImage, chatId);
    // timestamp info
    cropImage(IMAGERECENT, IMAGELOOT + '/timestamp.png', 600, 260, 20, 780, findTextInImage, chatId);
    scheduleMessage = '등록된 일정정보입니다. '+recentSchedule.date+' 카우엔독 2층 '+recentSchedule.place+'에서 진행됩니다.';      

    bot.sendMessage(fromId, scheduleMessage);
  }).catch(function(){
    console.log("reject");
    bot.sendMessage(fromId, scheduleMessage);  
  });
});

bot.onText(/\/attend/, function(msg, match) {
  var fromId = msg.from.id;
  var fromName = msg.from.first_name + ' ' + msg.from.last_name;
  console.log(msg);
  bot.sendMessage(fromId, fromName+"님께서 참석의사를 표현하셨습니다.");
});

bot.onText(/\/absent/, function(msg, match) {
  var fromId = msg.from.id;
  var fromName = msg.from.first_name + ' ' + msg.from.last_name;
  console.log(msg);
  bot.sendMessage(fromId, fromName+"님께서 불참의사를 표현하셨습니다.");
});

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  // console.log("from on: ", msg);
  if (msg.document) {
    extractTextFromImage(msg.document.file_id, chatId);
  } else if (msg.photo) {
    extractTextFromImage(msg.photo[msg.photo.length - 1].file_id, chatId);
  } else if (msg.text) {
    // send a message to the chat acknowledging receipt of their message
    switch (msg.text) {
      case '안녕':
        bot.sendMessage(chatId, "안녕하세요!");
        break;
    }
  }
});