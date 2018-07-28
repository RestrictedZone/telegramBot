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
  booking = require('./lib/booking').booking
  checkBooking = require('./lib/booking').checkBooking
  checkReservation = require('./lib/checkReservation')

  // Create a bot that uses 'polling' to fetch new updates
  bot = new TelegramBot(config.token, { polling: true })

// CONST list
const IMAGELOOT = 'images'
const TARGETIMAGE = 'images/recent.png'
const ATTENDFILEPATH = 'data/attend.json'
const ATTENDDEFAULTFILEPATH = 'data/attend_default.json'

var ISREADYTOSERVE = false

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
const systemMessageBotStart = function () {
  bot.sendMessage(adminAccountID, '개발제한구역 관리자가 시작/재시작 되었습니다.')
}
const systemMessageBotSettingComplete = function () {
  bot.sendMessage(adminAccountID, '개발제한구역 관리자가 서비스 준비를 마쳤습니다.')
}
const systemMessageResetAttendList = function () {
  bot.sendMessage(adminAccountID, '일정 참석 인원 정보가 초기화 되었습니다.')
}
const systemMessageUnknownError = function (chatID, error) {
  bot.sendMessage(chatID, '알수 없는 애러가 발생했습니다. 관리자가 수정할 때 까지 요청을 자제해주세요.' + error)
}
const systemMessageCheckImage = function (chatID) {
  bot.sendMessage(chatID, '이미지 확인 중 입니다. 잠시만 기다려주세요.')
}
const systemMessageIncorrectImage = function (chatID) {
  bot.sendMessage(chatID, '일정 정보 이미지가 아닙니다. 이미지를 확인하시고 다시 보내주세요.')
}
const setAttendDataMessage = function (chatID, onlyShow) {
  bot.sendMessage(chatID, attendance.getMessage(true), onlyShow ? {} : ATTENDASK)
}

const sendSchedule = function(chatID, textOnly){
  if(recentSchedule.isExisted()){
    if(textOnly){
      bot.sendMessage(chatID, recentSchedule.scheduleMessage())
      return
    }

    bot.sendMessage(chatID, recentSchedule.scheduleMessage(), {
      reply_markup: {
        inline_keyboard: [
          [{text: '구글 켈린더에 등록하기(링크)', url: recentSchedule.eventLinkToGoogle()}]
        ],
      }
    })
    // make ics file
    if(!fs.existsSync('./data/')){
      console.log('make "data" directory!')
      fs.mkdirSync('data')
    }
    fs.writeFileSync('data/이번주_개발제한구역일정.ics', recentSchedule.eventICSString())
    bot.sendDocument(chatID, 'data/이번주_개발제한구역일정.ics')
  } else {
    bot.sendMessage(chatID, '등록된 일정이 없습니다. 저장된 일정 정보 불러오기를 시도합니다. 1분 후 다시 시도해주세요. 같은 메시지를 보셨다면 일정 등록을 위한 일정 이미지를 업로드 해주세요.')
    registerSchedule(chatID) 
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
var findTextInImage = function(imagePath, chatID, language) {
  if(language == 'undefined' || language == null){
    language = 'kor'
  }
  Tesseract.recognize(imagePath, {
    lang: language
  })
  // .progress(function (p) { console.log('progress', p)  })
  .catch(function(err) { console.error(err) } )
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
    try {
      recentSchedule.timeStart = firstLine.replace(/ /g,'').replace(/O/gi,'0').slice(2, 7)
      recentSchedule.timeEnd = (parseInt(secondLine.replace(/ /g,'').replace(/O/gi,'0').slice(2,4)) + 12) + secondLine.replace(/ /g,'').replace(/O/gi,'0').slice(4,7)
      if(recentSchedule.timeStart.slice(0,2) !== '12'){
        recentSchedule.timeStart = (parseInt(recentSchedule.timeStart.slice(0,2)) + 12) + recentSchedule.timeStart.slice(2)
      }
      recentSchedule.place = '카우엔독 2층\n' + lastLine.slice(lastLine.indexOf('일') + 1, lastLine.indexOf('예'))
      recentSchedule.date = lastLine.slice(0, lastLine.indexOf('일') + 1)
      attendance.setDate(recentSchedule.date, true)

      // console.log(firstLine, secondLine, lastLine, recentSchedule)
      if(chatID){
        sendSchedule(chatID)
      }
    } catch (error) {
      console.log(error)
      systemMessageUnknownError(chatID, error)
    }
    
  }).finally(function(){
    systemMessageBotSettingComplete(chatID)
    if(chatID){
      sendSchedule(chatID)
    }
    ISREADYTOSERVE = true
    // delete cropped image
    fs.unlinkSync(imagePath)
  })
}

var extractTextFromImage = function (file_id, chatID) {
  bot.downloadFile(file_id, IMAGELOOT)
  .then(function(downloadedFilepath){
    new Promise(function(resolve, reject){
      if(adminAccountID !== undefined && chatID === adminAccountID) {
        systemMessageCheckImage(chatID)
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
        registerSchedule(chatID)
      } else {
        console.log('This image is not TARGET image!')
        if(adminAccountID !== undefined && chatID === adminAccountID) {
          systemMessageIncorrectImage(chatID)
        }
        fs.unlinkSync(downloadedFilepath)
      }
    }).catch(console.log.bind(console))
  })
}

var registerSchedule = function(chatID){
  if(fs.existsSync(TARGETIMAGE)){
    // initialization recentSchedule data
    recentSchedule.initData()
    if(chatID !== undefined && fs.existsSync(ATTENDFILEPATH)){ 
      // init process  
      fs.unlinkSync(ATTENDFILEPATH)
    }
    if (chatID !== undefined) {
      attendance.setDataFromFile()
    }
    // make image better for OCR
    image.processForOCR(TARGETIMAGE, IMAGELOOT + '/recent_processed.png', findTextInImage, chatID, 'custom')
  } else {
    console.log(TARGETIMAGE + ' is not exist.')
    ISREADYTOSERVE = true
    if(chatID){
      bot.sendMessage(chatID, '저에게 일정 이미지를 보내신적이 없습니다. 일정 이미지를 보내신 후 다시 시도해주세요.')
    }
  }
}

var registerScheduleByText = function(message) {
  var messageArray = message.split('|')
  recentSchedule.initData()
  recentSchedule.timeStart = messageArray[2]
  recentSchedule.timeEnd = messageArray[3]
  recentSchedule.place = messageArray[4]
  recentSchedule.date = messageArray[1]
  attendance.setDate(recentSchedule.date, true)
}

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg, match) {
  var chatID = msg.chat.id
  var fromID = msg.from.id
  if(chatID === groupChatID || chatID === adminAccountID){
    try {
      var message = msg.text
      // console.log('from on: ', msg)
      if (!ISREADYTOSERVE) {
        // console.log('block message', message, msg.document, msg.photo)
        if ( (message && message.indexOf('/') === 0) || 
              msg.document || 
              msg.photo
        ){
          // console.log('block message send message')
          bot.sendMessage(chatID, '개발제한구역관리자가 서비스 준비중입니다. 잠시만 기다려주세요.')
        }
        return
      }
      if (msg.document) {
        if(msg.document.mine_type === 'image/png') {
          extractTextFromImage(msg.document.file_id, chatID)
        }
      } else if (msg.photo) {
        extractTextFromImage(msg.photo[msg.photo.length - 1].file_id, chatID)
      } else if (message) {
        var name = makeName(msg.from)
        if (/\/scheduletext/.test(message)) {
          console.log(new Date(Date.now() - TIMEZONEOFFSET).toISOString() + ' ' + name + '님이 스케쥴(텍스트만)을 요청하셨습니다.')
          // printRecentScheduleObject()
          sendSchedule(chatID, true)
        } else if (/\/schedule/.test(message)) {
          console.log(new Date(Date.now() - TIMEZONEOFFSET).toISOString() + ' ' + name + '님이 스케쥴을 요청하셨습니다.')
          sendSchedule(chatID)
        } else if (/\/joinlist/.test(message)) {
          console.log(new Date(Date.now() - TIMEZONEOFFSET).toISOString() + ' ' + name + '님이 참석인원정보를 요청하셨습니다.')
          if(attendance.isResponsedPerson(chatID)){
            setAttendDataMessage(chatID, true)
          } else {
            setAttendDataMessage(chatID)
          }
        } else if (/\/attend/.test(message) || /^참석$/.test(message)) {
          setAttend(fromID, name)
          setAttendDataMessage(chatID, true)
        } else if (/\/absent/.test(message) || /^불참$/.test(message)) {
          setAbsent(fromID, name)
          setAttendDataMessage(chatID, true)
        }
        if (chatID === adminAccountID) {
          if (/^일정입력 /.test(message) || /^일정등록 /.test(message)) {
            console.log(new Date(Date.now() - TIMEZONEOFFSET).toISOString() + " " + "관리자가 일정을 입력했습니다.");
            registerScheduleByText(message);
            sendSchedule(chatID);
          } else if (/^참석인원(리셋|초기화)$/.test(message)) {
            attendance.resetAttendee()
            systemMessageResetAttendList()
          }
        }
      }
    } catch (error) {
      console.warn(error)
      systemMessageUnknownError(chatID)
    }
  }
})

// process for inline_keyboard
bot.on('callback_query', function(response) {
  // console.log('callback_query', response)
  var chatID = response.message.chat.id
  var fromID = response.from.id
  var name = makeName(response.from)
  var replyData = response.data
  switch(replyData){
    case 'attend':
      console.log('select attend!')
      setAttend(fromID, name)
      break
    case 'absent':
      console.log('select absent!')
      setAbsent(fromID, name)
      break
  }
  bot.editMessageText(attendance.getMessage(true), {
    'chat_id': response.message.chat.id,
    'message_id': response.message.message_id
  })
})

// init schedule data
systemMessageBotStart()
registerSchedule()

// Weekly routine is running every Friday at 9:30pm
new CronJob('00 30 19 * * 5', function () {
  if (attendance.totelResponseCount() < 5) {
    if (groupChatID !== undefined && groupChatID !== null) {
      bot.sendMessage(groupChatID, '[알림] 참석/불참을 안하신 분들은 참석/불참 여부 등록을 부탁드립니다.', {
        reply_markup: {
          keyboard: [
            [{text: '참석'}, {text: '불참'}]
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      })
    }
  }
}).start()


// Weekly routine is running every Saterday at 00:00am 
new CronJob('10 00 00 * * 6', function () { 
  booking() 
  bot.sendMessage(adminAccountID, '자동예약이 실행되었습니다. 스케쥴을 확인해주세요.')   
}).start()

new CronJob('00 01 00 * * 6', function() {
  const nowDate = new Date(Date.now() - TIMEZONEOFFSET)
  nowDate.setDate(nowDate.getDate() + 14);
  const dateString = nowDate
    .toISOString()
    .replace(/-/gi, "")
    .slice(0, 8);
  checkBooking(dateString).then(function (res) {
    const reservtionList = res.data.response // array
    // console.log(reservtionList)
    let isBookStatusOK = false
    for (const bookData of reservtionList) {
      if(
        bookData.organization === '개발제한구역' &&
        bookData.title === '스터디' &&
        bookData.contact === 'imsukmin@gmail.c'
      ) {
        isBookStatusOK = true
        bot.sendMessage(adminAccountID, '자동예약이 실행결과: 예약이 정상적으로 되었습니다.')
        break
      }
    }
    if(!isBookStatusOK){
      bot.sendMessage(adminAccountID, '자동예약이 실행결과: 예약이 되지 않았습니다. 카우엔독 웹에서 일정을 확인해주세요. https://app.cowndog.com/#/app/room')
    }
  })
}).start()

// Weekly routine is running every Sunday at 00:00am 
new CronJob('10 00 00 * * 0', function () { 
  checkReservation().then(function(response) {
    for (let schedule of response.data.response) {
      if(schedule.organization === '개발제한구역') {
        let reservationDateStart = new Date(schedule.start * 1000 + 1000*60*60*9).toISOString()
        let reservationDateEnd = new Date(schedule.end * 1000 + 1000*60*60*9).toISOString()
        recentSchedule.initData()
        recentSchedule.timeStart = reservationDateStart.slice(11,16)
        recentSchedule.timeEnd = reservationDateEnd.slice(11,16)
        recentSchedule.place = schedule.location
        recentSchedule.date = reservationDateStart.slice(0,10).replace('-', '년').replace('-', '월') + '일'
        attendance.setDate(recentSchedule.date, true)
        attendance.getMessage(true)
        attendance.saveToFile()
        bot.sendMessage(adminAccountID, '이번주 토요일 카우엔독 예약로 스케쥴이 변경 되었습니다.')
        break;
      }
    }    
  })   
}).start()
