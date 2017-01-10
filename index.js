var Tesseract = require('tesseract.js'),
  Promise = require('bluebird'),
  restify = require('restify'),
  TelegramBot = require('node-telegram-bot-api'),
  fs = require('fs'),
  gm = require('gm'),
  ICS = require('ics'),
  request = require('request');

var config = require('./config'),
  // downloadFile = require('./downloadFile'),
  cropImage = require('./cropImage'),
  compareImage = require('./compareImage'),
  ics = new ICS();
 
const IMAGELOOT = 'images';
const IMAGERECENT = 'images/recent.png';

var recentSchedule = {
  extractTextCount: 0,
  date: "",
  place: "",
  timeStart: "",
  timeEnd: "",
  dateStart: "",
  dateEnd: "",
  scheduleMessage: "",
  eventLinkToGoogle: "",
  eventICSString: "",
  makeDateString: function(){
    if(this.date != "" && this.timeStart != "" && this.timeEnd != ""){
      this.dateStart = this.date.replace('년 ','-').replace('월 ','-').replace('일',' ') + this.timeStart + ':00';
      this.dateEnd = this.date.replace('년 ','-').replace('월 ','-').replace('일',' ') + this.timeEnd + ':00';
      return this.dateStart + ' / ' + this.dateEnd;      
    }
  },
  makeScheduleMessage: function(){
    this.scheduleMessage = '등록된 일정정보입니다. '+this.date+' 카우엔독 2층 '+this.place+'에서'; 
    if(this.timeStart != ""){
      this.scheduleMessage += ' 오후 '+this.timeStart+'시 부터 오후 '+this.timeEnd+'시 까지 ';
    }
    this.scheduleMessage += '진행됩니다.';
    return this.scheduleMessage;
  },
  makeEventLinkToGoogle: function(){
    if(this.date != ""){
      this.eventLinkToGoogle = "http://www.google.com/calendar/render?action=TEMPLATE&text=개발제한구역+스터디&dates="+(new Date(recentSchedule.dateStart)).toISOString().replace(/-|:|\.\d\d\d/g,"")+"/"+(new Date(recentSchedule.dateEnd)).toISOString().replace(/-|:|\.\d\d\d/g,"")+"&sprop=name:개발제한구역&location=카우앤독+2층+"+this.place;
      return this.eventLinkToGoogle;
    }
  },
  makeICSString: function(){
    this.eventICSString = ics.buildEvent({
      start: (new Date(recentSchedule.dateStart)).toISOString().replace(/-|:|\.\d\d\d/g,""),
      end: (new Date(recentSchedule.dateEnd)).toISOString().replace(/-|:|\.\d\d\d/g,""),
      title: '개발제한구역 스터디',
      description: '탤레그램의 @RestricedZoneBot이 자동으로 생성한 이벤트 입니다.',
      location: '카우앤독 2층 ' + this.place,
      url: ''
    });
    return this.eventICSString;
  },
  bulidRecentSchedule: function(){
    recentSchedule.makeScheduleMessage();
    recentSchedule.makeDateString();
    recentSchedule.makeEventLinkToGoogle();
    recentSchedule.makeICSString();
    console.log(recentSchedule); 
  }
};

var token = config.token;
// Create a bot that uses 'polling' to fetch new updates
var bot = new TelegramBot(token, {
  polling: true
});

// ocr by tesseract
var findTextInImage = function(imagePath, chatId, language) {
  if(language == 'undefined' || language == null){
    language = 'kor';
  }
  Tesseract.recognize(imagePath, {
    lang: language
  })
  // .progress(function (p) { console.log('progress', p);  })
  .catch(err => console.error(err))
  .then(function (result) {
    console.log( '\n----- '+imagePath+' -----\n' + result.text );

    var resultTextLines = result.text.split('\n');

    switch(imagePath.split('/')[1]){
      case 'date.png':
        recentSchedule.date = resultTextLines[0].slice(4, 17);
        break;
      case 'place.png':
        recentSchedule.place = resultTextLines[0].slice(8, 12).replace('8', 'B');
        break;
      case 'timestamp1.png':
        if(resultTextLines[0].indexOf("개발제한구역") > 0){
          recentSchedule.timeStart = resultTextLines[0].slice(2, 5).trim();
          recentSchedule.timeEnd = resultTextLines[1].slice(2, 5).trim();
        }
        break;
      case 'timestamp2.png':
        if(resultTextLines[0].indexOf("개발제한구역") > 0){
          recentSchedule.timeStart = resultTextLines[0].slice(2, 5).trim();
          recentSchedule.timeEnd = resultTextLines[1].slice(2, 5).trim();
        }
        break;
      case 'timestamp3.png':
        if(resultTextLines[0].indexOf("개발제한구역") > 0){
          recentSchedule.timeStart = resultTextLines[0].slice(2, 5).trim();
          recentSchedule.timeEnd = resultTextLines[1].slice(2, 5).trim();
        }
        break;
    }
    if( recentSchedule.extractTextCount > 3 ){
      recentSchedule.extractTextCount = 0;  
      recentSchedule.bulidRecentSchedule();
      if(chatId){
        sendSchedule(chatId);
      }
    } else {
      recentSchedule.extractTextCount++;
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
        createSchedule(chatId);
      } else {
        console.log('This image is not schedule image!');
        fs.unlinkSync(downloadedFilepath);
      }
    }).catch(console.log.bind(console));

  });
};

var createSchedule = function(chatId){
  // init recentSchedule data
  recentSchedule.extractTextCount = 0;  
  recentSchedule.date = "";
  recentSchedule.place = "";
  recentSchedule.timeStart = "";
  recentSchedule.timeEnd = "";
  recentSchedule.dateStart = "";
  recentSchedule.dateEnd = "";
  recentSchedule.scheduleMessage = "";
  recentSchedule.eventLinkToGoogle = "";
  recentSchedule.eventICSString = "";

  // date info
  cropImage(IMAGERECENT, IMAGELOOT + '/date.png', 450, 85, 100, 130, findTextInImage, chatId);
  // place info
  cropImage(IMAGERECENT, IMAGELOOT + '/place.png', 450, 85, 100, 215, findTextInImage, chatId, "eng");
  // timestamp info
  cropImage(IMAGERECENT, IMAGELOOT + '/timestamp1.png', 600, 80, 20, 780, findTextInImage, chatId);
  cropImage(IMAGERECENT, IMAGELOOT + '/timestamp2.png', 600, 80, 20, 860, findTextInImage, chatId);
  cropImage(IMAGERECENT, IMAGELOOT + '/timestamp3.png', 600, 80, 20, 940, findTextInImage, chatId);  
};

var sendSchedule = function(chatId){
    bot.sendMessage(chatId, recentSchedule.scheduleMessage + "\n\n구글 켈린더 링크입니다. " + recentSchedule.eventLinkToGoogle);
    // make ics file
    fs.writeFileSync('data/이번주_개발제한구역일정.ics', recentSchedule.eventICSString);
    bot.sendDocument(chatId, 'data/이번주_개발제한구역일정.ics');
};

bot.onText(/\/schedule/, function(msg, match) {
  // console.log(msg);
  var chatId = msg.chat.id;
  if(recentSchedule.date == ''){
    bot.sendMessage(chatId, '등록된 일정이 없습니다. 정보갱신 시도합니다. 잠시 후 정보가 나타납니다. 잠시만 기다려주세요. 1분이상 응답이 없을 경우 다시 시도해주세요.');
    createSchedule(chatId);    
  } else {
    sendSchedule(chatId);
  }
});

bot.onText(/\/attend/, function(msg, match) {
  bot.sendMessage(msg.chat.id, msg.chat.first_name + ' ' + msg.chat.last_name+"님께서 참석의사를 표현하셨습니다.");
});

bot.onText(/\/absent/, function(msg, match) {
  bot.sendMessage(msg.chat.id, msg.chat.first_name + ' ' + msg.chat.last_name+"님께서 불참의사를 표현하셨습니다.");
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

// init schedule data
createSchedule();

 
