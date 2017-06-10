var fs = require('fs'),
  gm = require('gm'),
  Tesseract = require('tesseract.js'),
  TelegramBot = require('node-telegram-bot-api'),
  Promise = require('bluebird'),
  CronJob = require("cron").CronJob;

var config = require('./config'),
  image = require('./lib/image'),
  recentSchedule = require('./lib/schedule'),
  attendance = require('./lib/attendance')

  // Create a bot that uses 'polling' to fetch new updates
  bot = new TelegramBot(config.token, { polling: true })

// CONST list
const IMAGELOOT = 'images'
const TARGETIMAGE = 'images/recent.png'
const ATTENDFILEPATH = 'data/attend.json'
const ATTENDDEFAULTFILEPATH = 'data/attend_default.json'

const TIMEZONEOFFSET = new Date().getTimezoneOffset() * 60000

const ATTENDASK = {
  reply_markup: {
    inline_keyboard: [
      [
        {text: '참석', callback_data: 'attend'},
        {text: '불참', callback_data: 'absent'}
      ]
    ],
  }
}

// chatID List
const adminAccountID = config.adminAccountID
const groupChatID = config.groupChatID


// System Messages
const systemMessageBotStart = function (chatId) {
  bot.sendMessage(adminAccountID, '개발제한구역 관리자가 시작/재시작 되었습니다.')
}
const systemMessageBotSettingComplete = function (chatId) {
  bot.sendMessage(adminAccountID, '개발제한구역 관리자가 서비스 준비를 마쳤습니다.')
}
const systemMessageUnknownError = function (chatID) {
  bot.sendMessage(chatID, '알수 없는 애러가 발생했습니다. 관리자가 수정할 때 까지 요청을 자제해주세요.')
}
const systemMessageCheckImage = function (chatID) {
  bot.sendMessage(chatID, '이미지 확인 중 입니다. 잠시만 기다려주세요.')
}
const systemMessageIncorrectImage = function (chatID) {
  bot.sendMessage(chatID, '일정 정보 이미지가 아닙니다. 이미지를 확인하시고 다시 보내주세요.')
}
const setAttendDataMessage = function (chatId, onlyShow) {
  bot.sendMessage(chatId, attendance.getMessage(), onlyShow ? {} : ATTENDASK)
}

const sendSchedule = function(chatId, textOnly){
  if(textOnly){
    bot.sendMessage(chatId, recentSchedule.scheduleMessage())
    return
  }

  if(recentSchedule.isExisted()){
    bot.sendMessage(chatId, recentSchedule.scheduleMessage() + '\n\n구글 켈린더 링크입니다. ' + recentSchedule.eventLinkToGoogle())
    // make ics file
    if(!fs.existsSync('./data/')){
      console.log('make "data" directory!')
      fs.mkdirSync('data')
    }
    fs.writeFileSync('data/이번주_개발제한구역일정.ics', recentSchedule.eventICSString())
    bot.sendDocument(chatId, 'data/이번주_개발제한구역일정.ics')
  } else {
    bot.sendMessage(chatId, '등록된 일정이 없습니다. 저장된 일정 정보 불러오기를 시도합니다. 1분 후 다시 시도해주세요. 같은 메시지를 보셨다면 일정 등록을 위한 일정 이미지를 업로드 해주세요.')
    registerSchedule(chatId) 
  }
}

const setAttend = function (chatID, name) {
  console.log(new Date(Date.now() - TIMEZONEOFFSET).toISOString() + ' ' + name + '님이 참석의사를 표현하셨습니다.')
  attendance.addAttend(chatID, name)
}

const setAbsent = function (chatID, name) {
  console.log(new Date(Date.now() - TIMEZONEOFFSET).toISOString() + ' ' + name + '님이 불참의사를 표현하셨습니다.')
  attendance.addAbsent(chatID, name)
}

const makeName = function (dataFrom) {
  var name = dataFrom.first_name
  if (dataFrom.last_name !== undefined){
    name = name + ' ' + dataFrom.last_name
  }
  return name
}

// print log
const printRecentScheduleObject = function () {
  console.log( JSON.stringify(recentSchedule.getData()) )
  console.log( recentSchedule.scheduleMessage() )
  console.log( recentSchedule.eventLinkToGoogle() )
  console.log( recentSchedule.eventICSString() )
}

// ocr by tesseract
var findTextInImage = function(imagePath, chatId, language) {
  if(language == 'undefined' || language == null){
    language = 'kor'
  }
  Tesseract.recognize(imagePath, {
    lang: language
  })
  // .progress(function (p) { console.log('progress', p)  })
  .catch(err => console.error(err))
  .then(function (result) {
    var resultTextLines = result.text.replace(/ /gi, '').split('\n')
    for (var i in resultTextLines) {
      // console.log(i, resultTextLines[i])
      
      if (resultTextLines[i].indexOf('개발제한구역') > 0) {
        // console.log('find firstline', resultTextLines[i])
        var firstLine = resultTextLines[i]
        var secondLine = resultTextLines[parseInt(i) + 1]
      }
      if (resultTextLines[i].indexOf('예약') > 0) {
        // console.log('find lastLine', resultTextLines[i])
        var lastLine = resultTextLines[i]
        // break;
      }
    }
    recentSchedule.timeStart = Number( firstLine.slice(2, 4) )
    recentSchedule.timeEnd = Number( secondLine.slice(2, 4).replace('O','') ) + 12
    if(recentSchedule.timeStart !== 12){
      recentSchedule.timeStart += 12
    }
    recentSchedule.place = lastLine.slice(lastLine.indexOf('일') + 1, lastLine.indexOf('예'))
    recentSchedule.date = lastLine.slice(0, lastLine.indexOf('일') + 1)
    attendance.setDate(recentSchedule.date)

    // console.log(firstLine, secondLine, lastLine, recentSchedule)
    systemMessageBotSettingComplete(chatId)
    if(chatId){
      sendSchedule(chatId)
    }
  }).finally(function(){
    // delete cropped image
    fs.unlinkSync(imagePath)
  })
}

var extractTextFromImage = function (file_id, chatId) {
  bot.downloadFile(file_id, IMAGELOOT)
  .then(function(downloadedFilepath){
    new Promise(function(resolve, reject){
      if(adminAccountID !== undefined && chatId === adminAccountID) {
        systemMessageCheckImage(chatId)
      }
      fs.chmodSync(downloadedFilepath, 777)
      if(fs.existsSync(TARGETIMAGE)){
        image.compare(downloadedFilepath, TARGETIMAGE, resolve)
      } else {
        resolve(true)
      }
    }).then(function(isTargetImage){
      if(isTargetImage){
        fs.renameSync(downloadedFilepath, TARGETIMAGE)
        registerSchedule(chatId)
      } else {
        console.log('This image is not TARGET image!')
        if(adminAccountID !== undefined && chatId === adminAccountID) {
          systemMessageIncorrectImage(chatId)
        }
        fs.unlinkSync(downloadedFilepath)
      }
    }).catch(console.log.bind(console))
  })
}

var registerSchedule = function(chatId){
  if(fs.existsSync(TARGETIMAGE)){
    // initialization recentSchedule data
    recentSchedule.initData()
    if(chatId !== undefined && fs.existsSync(ATTENDFILEPATH)){ 
      // init process  
      fs.unlinkSync(ATTENDFILEPATH)
    }
    if (chatId !== undefined) {
      attendance.setDataFromFile()
    }
    // make image better for OCR
    image.processForOCR(TARGETIMAGE, IMAGELOOT + '/recent_processed.png', findTextInImage, chatId, 'custom')
  } else {
    console.log(TARGETIMAGE + ' is not exist.')
    if(chatId){
      bot.sendMessage(chatId, '저에게 일정 이미지를 보내신적이 없습니다. 일정 이미지를 보내신 후 다시 시도해주세요.')
    }
  }
}

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg, match) {
  var chatId = msg.chat.id
  if(chatId === groupChatID || chatId === adminAccountID){
    try {
      var message = msg.text
      // console.log('from on: ', msg)
      if (msg.document) {
        extractTextFromImage(msg.document.file_id, chatId)
      } else if (msg.photo) {
        extractTextFromImage(msg.photo[msg.photo.length - 1].file_id, chatId)
      } else if (message) {
        var name = makeName(msg.from)
        if (/\/scheduletext/.test(message)) {
          console.log(new Date(Date.now() - TIMEZONEOFFSET).toISOString() + ' ' + name + '님이 스케쥴(텍스트만)을 요청하셨습니다.')
          // printRecentScheduleObject()
          sendSchedule(chatId, true)
        } else if (/\/schedule/.test(message)) {
          console.log(new Date(Date.now() - TIMEZONEOFFSET).toISOString() + ' ' + name + '님이 스케쥴을 요청하셨습니다.')
          sendSchedule(chatId)
        } else if (/\/joinlist/.test(message)) {
          console.log(new Date(Date.now() - TIMEZONEOFFSET).toISOString() + ' ' + name + '님이 참석인원정보를 요청하셨습니다.')
          setAttendDataMessage(chatId)
        } else if (/\/attend/.test(message)) {
          setAttend(chatId, name)
          setAttendDataMessage(chatId, true)
        } else if (/\/absent/.test(message)) {
          setAbsent(chatId, name)
          setAttendDataMessage(chatId, true)
        }
      }
    } catch (error) {
      console.warn(error)
      systemMessageUnknownError(chatId)
    }
  }
})

// process for inline_keyboard
bot.on('callback_query', function(response) {
  console.log('callback_query', response)
  var chatId = response.message.chat.id
  var name = makeName(response.from)
  var replyData = response.data
  switch(replyData){
    case 'attend':
      console.log('select attend!')
      setAttend(chatId, name)
      break
    case 'absent':
      console.log('select absent!')
      setAbsent(chatId, name)
      break
  }
  bot.editMessageText(attendance.getMessage(), {
    'chat_id': response.from.id,
    'message_id': response.message.message_id
  })
})

// init schedule data
systemMessageBotStart()
registerSchedule()

// Weekly routine is running every Friday at 9:30pm
var remindSchedule = new CronJob('00 30 19 * * 5', function () {
  if (groupChatID !== undefined || groupChatID !== null || attendance.totelResponseCount() < 5){
    bot.sendMessage(groupChatID, '[알림] 참석/불참을 안하신 분들은 참석/불참 여부 등록을 부탁드립니다.', ATTENDASK)
  }
})
remindSchedule.start()
