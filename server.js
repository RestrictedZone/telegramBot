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

// CONST list
const IMAGELOOT = 'images';
const TARGETIMAGE = 'images/recent.png';
const ATTENDFILEPATH = 'data/attend.json';
const ATTENDDEFAULTFILEPATH = 'data/attend_default.json';

// chatID List
const adminAccountID = 17273224; // nGenius
const groupChatID = -155796528; // Restricted Dev Zone

var attendList
// for attend info data
if(fs.existsSync(ATTENDFILEPATH)){
  attendList = JSON.parse(fs.readFileSync(ATTENDFILEPATH, 'utf8'))
} else {
  attendList = JSON.parse(fs.readFileSync(ATTENDDEFAULTFILEPATH, 'utf8'))
}

// System Messages
const systemMessageBotStart = function () {
  bot.sendMessage(adminAccountID, "개발제한구역 관리자가 시작/재시작 되었습니다.");
}
const systemMessageBotSettingComplete = function () {
  bot.sendMessage(adminAccountID, "개발제한구역 관리자가 서비스 준비를 마쳤습니다.");
}
const systemMessageUnknownError = function (chatID) {
  bot.sendMessage(chatID, "알수 없는 애러가 발생했습니다. 관리자가 수정할 때 까지 요청을 자제해주세요.");
}
const systemMessageCheckImage = function (chatID) {
  bot.sendMessage(chatID, "이미지 확인 중 입니다. 잠시만 기다려주세요.");
}
const systemMessageIncorrectImage = function (chatID) {
  bot.sendMessage(chatID, "맞지 않는 이미지를 주셨습니다. 이미지를 확인하시고 다시 보내주세요.");
}
const setAttendListMessage = function (chatId) {
  attendList.message = attendList.date + " 스터디 참석 정보입니다.\n참석: " + attendList.attend.toString() + "\n불참: " +  attendList.absent.toString();
  bot.sendMessage(chatId, attendList.message);
}

// util functions
const saveAttendList = function () {
  fs.writeFile(ATTENDFILEPATH, JSON.stringify(attendList), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
}

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
    var resultText = result.text.replace(/ /gi, '')
    console.log( '\n----- '+imagePath+' -----\n' + resultText );

    seperateExtractedTextByimageFilename(resultText, imagePath.split('/')[1]);
    if( recentSchedule.extractTextCount > 3 ){
      recentSchedule.extractTextCount = 0;
      systemMessageBotSettingComplete()
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
    var firstLine = resultTextLines[0];
    var secondLine = resultTextLines[1];

    switch(imageFilename){
      case 'date.png':
        recentSchedule.date = firstLine.slice(firstLine.length - 10, firstLine.length).replace('초', '3').replace('이','1');
        attendList.date = recentSchedule.date;
        break;
      case 'place.png':
        recentSchedule.place = firstLine.slice(firstLine.length-4, firstLine.length).replace('8', 'B');
        break;
      case 'timestamp1.png':
        if(firstLine.indexOf("개발제한구역") > 0){
          recentSchedule.timeStart = firstLine.slice(2, 4).trim().replace('묘빼', '12');
          recentSchedule.timeEnd = secondLine.slice(2, 4).trim();
          recentSchedule.timeStart = parseInt( recentSchedule.timeStart )
          recentSchedule.timeEnd = parseInt( recentSchedule.timeEnd ) + 12
          if(recentSchedule.timeStart !== 12){
            recentSchedule.timeStart += 12
          }
        }
        break;
      case 'timestamp2.png':
        if(firstLine.indexOf("개발제한구역") > 0){
          recentSchedule.timeStart = firstLine.slice(2, 4).trim().replace('묘빼', '12');
          recentSchedule.timeEnd = secondLine.slice(2, 4).trim();
          recentSchedule.timeStart = parseInt( recentSchedule.timeStart )
          recentSchedule.timeEnd = parseInt( recentSchedule.timeEnd ) + 12
          if(recentSchedule.timeStart !== 12){
            recentSchedule.timeStart += 12
          }
        }
        break;
      case 'timestamp3.png':
        if(firstLine.indexOf("개발제한구역") > 0){
          recentSchedule.timeStart = firstLine.slice(2, 4).trim().replace('묘빼', '12');
          recentSchedule.timeEnd = secondLine.slice(2, 4).trim();
          recentSchedule.timeStart = parseInt( recentSchedule.timeStart )
          recentSchedule.timeEnd = parseInt( recentSchedule.timeEnd ) + 12
          if(recentSchedule.timeStart !== 12){
            recentSchedule.timeStart += 12
          }
        }
        break;
    }
};

var extractTextFromImage = function (file_id, chatId) {

  bot.downloadFile(file_id, IMAGELOOT)
  .then(function(downloadedFilepath){
    new Promise(function(resolve, reject){
      systemMessageCheckImage(chatId);
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
        systemMessageIncorrectImage(chatId);
        fs.unlinkSync(downloadedFilepath);
      }
    }).catch(console.log.bind(console));

  });
};

var registerSchedule = function(chatId){
  
  if(fs.existsSync(TARGETIMAGE)){
    // initialization recentSchedule data
    recentSchedule.initData();
    if(chatId !== undefined && fs.existsSync(ATTENDFILEPATH)){ 
      // init process  
      fs.unlinkSync(ATTENDFILEPATH)
    }
    if (chatId !== undefined) {
      attendList = JSON.parse(fs.readFileSync(ATTENDDEFAULTFILEPATH, 'utf8'))      
    } 
    
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
  if(recentSchedule.isExisted()){
    bot.sendMessage(chatId, recentSchedule.scheduleMessage() + "\n\n구글 켈린더 링크입니다. " + recentSchedule.eventLinkToGoogle());
    // make ics file
    if(!fs.existsSync("./data/")){
      console.log("make 'data' directory!");
      fs.mkdirSync("data");
    }
    fs.writeFileSync('data/이번주_개발제한구역일정.ics', recentSchedule.eventICSString());
    bot.sendDocument(chatId, 'data/이번주_개발제한구역일정.ics');
  } else {
    bot.sendMessage(chatId, '등록된 일정이 없습니다. 정보갱신 시도합니다. 처리중 입니다. 1분 후 다시 시도해주세요.');
    registerSchedule(chatId); 
  }

};

bot.onText(/\/schedule/, function(msg, match) {
  if(msg.chat.id === groupChatID || msg.chat.id === adminAccountID){
    try {
        console.log(moment().format('ll') + " " + msg.chat.first_name + ' ' + msg.chat.last_name + "님이 스케쥴을 요청하셨습니다.");
        console.log( JSON.stringify(recentSchedule.getData()) );
        console.log( recentSchedule.scheduleMessage() );
        console.log( recentSchedule.eventLinkToGoogle() );
        console.log( recentSchedule.eventICSString() );
        sendSchedule(msg.chat.id);   
    } catch (error) {
      console.warn(error)
      systemMessageUnknownError(msg.chat.id);
    }
  }
});

bot.onText(/\/joinlist/, function(msg, match) {
  if(msg.chat.id === groupChatID || msg.chat.id === adminAccountID){
    try {
      console.log('attlist')  
      if (attendList.date === "" || (attendList.attend.length === 0 && attendList.absent.length === 0) ) {
        bot.sendMessage(msg.chat.id, attendList.message);
        return;
      }
      setAttendListMessage(msg.chat.id);
    } catch (error) {
      console.warn(error)
      printMessageUnknownError(msg.chat.id)
    }
  }
});

bot.onText(/\/attend/, function(msg, match) {
  if(msg.chat.id === groupChatID || msg.chat.id === adminAccountID){
    try {
      var name = msg.from.first_name;
      if (msg.from.last_name !== undefined){
        name = name + ' ' + msg.from.last_name;
      }

      var att = attendList.attend;
      // console.log(msg)
      var abs = attendList.absent;
      console.log('attend', name, attendList, att.indexOf(name) === -1, abs.indexOf(name) !== -1)
      if(att.indexOf(name) === -1){
        att.push(name)
      }
      if(abs.indexOf(name) !== -1){
        abs.splice(abs.indexOf(name), 1)
      }
      // console.log(att, abs)
      // bot.sendMessage(msg.chat.id, name+"님께서 "+recentSchedule.date+" 모임 참석의사를 표현하셨습니다.");
      setAttendListMessage(msg.chat.id);
      saveAttendList();      
    } catch (error) {
      console.warn(error)
      printMessageUnknownError(msg.chat.id)
    }
  }
});

bot.onText(/\/absent/, function(msg, match) {
  if(msg.chat.id === groupChatID || msg.chat.id === adminAccountID){
    try {
      var name = msg.from.first_name;
      if (msg.from.last_name !== undefined){
        name = name + ' ' + msg.from.last_name;
      }
      var att = attendList.attend;
      var abs = attendList.absent;
      // console.log(msg)
      console.log('absent', name, attendList, abs.indexOf(name) === -1, att.indexOf(name) !== -1)
      if(abs.indexOf(name) === -1){
        abs.push(name)
      }
      if(att.indexOf(name) !== -1){
        att.splice(att.indexOf(name), 1)
      }
      // console.log(att, abs)
      // bot.sendMessage(msg.chat.id, name+"님께서 "+recentSchedule.date+" 모임 불참의사를 표현하셨습니다.");
      setAttendListMessage(msg.chat.id);
      saveAttendList();      
    } catch (error) {
      console.warn(error)
      printMessageUnknownError(msg.chat.id)
    }
  } 
});

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg) {
  if(msg.chat.id === groupChatID || msg.chat.id === adminAccountID){
    try {
      var chatId = msg.chat.id;
      var message = msg.text;
      // console.log("from on: ", msg);
      if (msg.document) {
        extractTextFromImage(msg.document.file_id, chatId);
      } else if (msg.photo) {
        extractTextFromImage(msg.photo[msg.photo.length - 1].file_id, chatId);
      } else if (message) {
        // send a message to the chat acknowledging receipt of their message
        // TODO : create something new

        // if( message.indexOf('안녕') > -1 ){
        //   bot.sendMessage(chatId, "안녕하세요!");
        // } else if( message.indexOf('일정') > -1 || message.indexOf('스케쥴') > -1 ) {
        //   sendSchedule(chatId);     
        // }
      }
    } catch (error) {
      console.warn(error)
      printMessageUnknownError(msg.chat.id)
    }
  }
});

// init schedule data
systemMessageBotStart();
registerSchedule();


