var fs = require('fs'),
  gm = require('gm'),
  Tesseract = require('tesseract.js'),
  TelegramBot = require('node-telegram-bot-api'),
  moment = require('moment'),
  Promise = require('bluebird');

var config = require('./config'),
  image = require('./lib/image'),
  recentSchedule = require('./lib/scheduleData'),
  // Create a bot that uses 'polling' to fetch new updates
  bot = new TelegramBot(config.token, { polling: true });
  
moment.locale();

const IMAGELOOT = 'images';
const TARGETIMAGE = 'images/recent.png';

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

    seperateExtractedTextByimageFilename(result.text,imagePath.split('/')[1]);
    if( recentSchedule.extractTextCount > 3 ){
      recentSchedule.extractTextCount = 0;  
      if(chatId){
        sendSchedule(chatId);
      }
    } else {
      recentSchedule.extractTextCount++;
    }
  }).finally(function(){
    // delete cropped image
    fs.unlinkSync(imagePath);
  });
};

var seperateExtractedTextByimageFilename = function(extractedText, imageFilename){
    var resultTextLines = extractedText.split('\n');

    switch(imageFilename){
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
};

var extractTextFromImage = function (file_id, chatId) {

  bot.downloadFile(file_id, IMAGELOOT)
  .then(function(downloadedFilepath){
    new Promise(function(resolve, reject){
      fs.chmodSync(downloadedFilepath, 777);
      if(fs.existsSync(TARGETIMAGE)){
        image.compare(downloadedFilepath, TARGETIMAGE, resolve);
      } else {
        resolve(true);
      }

    }).then(function(isTargetImage){

      if(isTargetImage){
        fs.renameSync(downloadedFilepath, TARGETIMAGE);
        registerSchedule(chatId);
      } else {
        console.log('This image is not TARGET image!');
        fs.unlinkSync(downloadedFilepath);
      }
    }).catch(console.log.bind(console));

  });
};

var registerSchedule = function(chatId){

  if(fs.existsSync(TARGETIMAGE)){
    // initialization recentSchedule data
    recentSchedule.initData();

    // date info
    image.crop(TARGETIMAGE, IMAGELOOT + '/date.png', 450, 85, 100, 130, findTextInImage, chatId);
    // place info
    image.crop(TARGETIMAGE, IMAGELOOT + '/place.png', 450, 85, 100, 215, findTextInImage, chatId, "eng");
    // timestamp info
    image.crop(TARGETIMAGE, IMAGELOOT + '/timestamp1.png', 600, 80, 20, 780, findTextInImage, chatId);
    image.crop(TARGETIMAGE, IMAGELOOT + '/timestamp2.png', 600, 80, 20, 860, findTextInImage, chatId);
    image.crop(TARGETIMAGE, IMAGELOOT + '/timestamp3.png', 600, 80, 20, 940, findTextInImage, chatId);  
  } else {
    console.log(TARGETIMAGE + " is not exist.");
    if(chatId){
      bot.sendMessage(chatId, "저에게 일정 이미지를 보내신적이 없습니다. 일정 이미지를 보내신 후 다시 시도해주세요.");
    }
  }
};

var sendSchedule = function(chatId){
  if(recentSchedule.isExsited()){
    bot.sendMessage(chatId, recentSchedule.scheduleMessage() + "\n\n구글 켈린더 링크입니다. " + recentSchedule.eventLinkToGoogle());
    // make ics file
    fs.writeFileSync('data/이번주_개발제한구역일정.ics', recentSchedule.eventICSString());
    bot.sendDocument(chatId, 'data/이번주_개발제한구역일정.ics');
  } else {
    bot.sendMessage(chatId, '등록된 일정이 없습니다. 정보갱신 시도합니다. 잠시 후 정보가 나타납니다. 잠시만 기다려주세요. 1분이상 응답이 없을 경우 다시 시도해주세요.');
    registerSchedule(chatId); 
  }

};

bot.onText(/\/schedule/, function(msg, match) {
  console.log(moment().format('ll') + " " + msg.chat.first_name + ' ' + msg.chat.last_name + "님이 스케쥴을 요청하셨습니다.");
  sendSchedule(msg.chat.id);
});

bot.onText(/\/attend/, function(msg, match) {
  bot.sendMessage(msg.chat.id, msg.chat.first_name + ' ' + msg.chat.last_name+"님께서 "+recentSchedule.date+" 모임 참석의사를 표현하셨습니다.");
});

bot.onText(/\/absent/, function(msg, match) {
  bot.sendMessage(msg.chat.id, msg.chat.first_name + ' ' + msg.chat.last_name+"님께서 "+recentSchedule.date+" 모임 불참의사를 표현하셨습니다.");
});

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg) {
  var chatId = msg.chat.id
      message = msg.text;
  // console.log("from on: ", msg);
  if (msg.document) {
    extractTextFromImage(msg.document.file_id, chatId);
  } else if (msg.photo) {
    extractTextFromImage(msg.photo[msg.photo.length - 1].file_id, chatId);
  } else if (message) {
    // send a message to the chat acknowledging receipt of their message
    // TODO : create something new

    if( message.indexOf('안녕') > -1 ){
      bot.sendMessage(chatId, "안녕하세요!");
    } else if( message.indexOf('일정') > -1 || message.indexOf('스케쥴') > -1 ) {
      sendSchedule(chatId);     
    }
  }
});

// init schedule data
registerSchedule();
