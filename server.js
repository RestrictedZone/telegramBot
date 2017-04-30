var fs = require('fs'),
  gm = require('gm'),
  Tesseract = require('tesseract.js'),
  TelegramBot = require('node-telegram-bot-api'),
  moment = require('moment'),
  Promise = require('bluebird')

var config = require('./config'),
  image = require('./lib/image'),
  recentSchedule = require('./lib/scheduleData'),
  // Create a bot that uses 'polling' to fetch new updates
  bot = new TelegramBot(config.token, { polling: true })
  
moment.locale()

// CONST list
const IMAGELOOT = 'images'
const TARGETIMAGE = 'images/recent.png'
const ATTENDFILEPATH = 'data/attend.json'
const ATTENDDEFAULTFILEPATH = 'data/attend_default.json'

// python child process
var spawn = require('child_process').spawn


// chatID List
const adminAccountID = config.adminAccountID
const groupChatID = config.groupChatID

var attendList
// for attend info data
if(fs.existsSync(ATTENDFILEPATH)){
  attendList = JSON.parse(fs.readFileSync(ATTENDFILEPATH, 'utf8'))
} else {
  attendList = JSON.parse(fs.readFileSync(ATTENDDEFAULTFILEPATH, 'utf8'))
}

// System Messages
const systemMessageBotStart = function () {
  bot.sendMessage(adminAccountID, "개발제한구역 관리자가 시작/재시작 되었습니다.")
}
const systemMessageBotSettingComplete = function () {
  bot.sendMessage(adminAccountID, "개발제한구역 관리자가 서비스 준비를 마쳤습니다.")
}
const systemMessageUnknownError = function (chatID) {
  bot.sendMessage(chatID, "알수 없는 애러가 발생했습니다. 관리자가 수정할 때 까지 요청을 자제해주세요.")
}
const systemMessageCheckImage = function (chatID) {
  bot.sendMessage(chatID, "이미지 확인 중 입니다. 잠시만 기다려주세요.")
}
const systemMessageIncorrectImage = function (chatID) {
  bot.sendMessage(chatID, "일정 정보 이미지가 아닙니다. 이미지를 확인하시고 다시 보내주세요.")
}
const setAttendListMessage = function (chatId) {
  attendList.message = attendList.date + " 스터디 참석 정보입니다.\n참석: " + attendList.attend.toString() + "\n불참: " +  attendList.absent.toString()
  bot.sendMessage(chatId, attendList.message)
}

const sendSchedule = function(chatId){
  if(recentSchedule.isExisted()){
    bot.sendMessage(chatId, recentSchedule.scheduleMessage() + "\n\n구글 켈린더 링크입니다. " + recentSchedule.eventLinkToGoogle())
    // make ics file
    if(!fs.existsSync("./data/")){
      console.log("make 'data' directory!")
      fs.mkdirSync("data")
    }
    fs.writeFileSync('data/이번주_개발제한구역일정.ics', recentSchedule.eventICSString())
    bot.sendDocument(chatId, 'data/이번주_개발제한구역일정.ics')
  } else {
    bot.sendMessage(chatId, '등록된 일정이 없습니다. 저장된 일정 정보 불러오기를 시도합니다. 1분 후 다시 시도해주세요. 같은 메시지를 보셨다면 일정 등록을 위한 일정 이미지를 업로드 해주세요.')
    registerSchedule(chatId) 
  }
}

// print log
const printRecentScheduleObject = function () {
  console.log( JSON.stringify(recentSchedule.getData()) )
  console.log( recentSchedule.scheduleMessage() )
  console.log( recentSchedule.eventLinkToGoogle() )
  console.log( recentSchedule.eventICSString() )
}


// util functions
const saveAttendList = function () {
  fs.writeFile(ATTENDFILEPATH, JSON.stringify(attendList), (err) => {
    if (err) throw err
    console.log('The file' + ATTENDFILEPATH + 'has been saved!')
  })
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
    attendList.date = recentSchedule.date

    console.log(firstLine, secondLine, lastLine, recentSchedule)  
    systemMessageBotSettingComplete()
    if(chatId){
      sendSchedule(chatId)
    }
  }).finally(function(){
    // delete cropped image
    //fs.unlinkSync(imagePath)
  })
}

var extractTextFromImage = function (file_id, chatId) {

  bot.downloadFile(file_id, IMAGELOOT)
  .then(function(downloadedFilepath){
    new Promise(function(resolve, reject){
      systemMessageCheckImage(chatId)
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
        systemMessageIncorrectImage(chatId)
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
      attendList = JSON.parse(fs.readFileSync(ATTENDDEFAULTFILEPATH, 'utf8'))      
    }
    // make image better for OCR
    image.processForOCR(TARGETIMAGE, IMAGELOOT + '/recent_processed.png', findTextInImage, chatId, 'custom')
  } else {
    console.log(TARGETIMAGE + " is not exist.")
    if(chatId){
      bot.sendMessage(chatId, "저에게 일정 이미지를 보내신적이 없습니다. 일정 이미지를 보내신 후 다시 시도해주세요.")
    }
  }
}

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg) {
  if(msg.chat.id === groupChatID || msg.chat.id === adminAccountID){
    try {
      var chatId = msg.chat.id
      var message = msg.text
      // console.log("from on: ", msg)
      if (msg.document) {
        extractTextFromImage(msg.document.file_id, chatId)
      } else if (msg.photo) {
        extractTextFromImage(msg.photo[msg.photo.length - 1].file_id, chatId)
      } else if (message) {
        var name = msg.from.first_name
        if (msg.from.last_name !== undefined){
          name = name + ' ' + msg.from.last_name
        }

        var att = attendList.attend
        var abs = attendList.absent
        switch(message){
          case '/schedule':
            console.log(moment().format('ll') + " " + name + "님이 스케쥴을 요청하셨습니다.")
            // printRecentScheduleObject()
            sendSchedule(msg.chat.id)   
            break

          case '/joinlist':
            console.log(moment().format('ll') + " " + name + "님이 참석인원정보를 요청하셨습니다.")
            if (attendList.date === "" || (attendList.attend.length === 0 && attendList.absent.length === 0) ) {
              bot.sendMessage(msg.chat.id, attendList.message)
              return
            }
            setAttendListMessage(msg.chat.id)
            break

          case '/attend':
            console.log(moment().format('ll') + " " + name + "님이 참석의사를 표현하셨습니다.")
            if(att.indexOf(name) === -1){
              att.push(name)
            }
            if(abs.indexOf(name) !== -1){
              abs.splice(abs.indexOf(name), 1)
            }
            // bot.sendMessage(msg.chat.id, name+"님께서 "+recentSchedule.date+" 모임 참석의사를 표현하셨습니다.")
            setAttendListMessage(msg.chat.id)
            saveAttendList()  
            break

          case '/absent':
            console.log(moment().format('ll') + " " + name + "님이 불참의사를 표현하셨습니다.")
            if(abs.indexOf(name) === -1){
              abs.push(name)
            }
            if(att.indexOf(name) !== -1){
              att.splice(att.indexOf(name), 1)
            }
            // console.log(att, abs)
            // bot.sendMessage(msg.chat.id, name+"님께서 "+recentSchedule.date+" 모임 불참의사를 표현하셨습니다.")
            setAttendListMessage(msg.chat.id)
            saveAttendList() 
            break
        }
      }
    } catch (error) {
      console.warn(error)
      printMessageUnknownError(msg.chat.id)
    }
  }
})

// init schedule data
systemMessageBotStart()
registerSchedule()


