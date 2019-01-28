const fs = require('fs'),
  TelegramBot = require('node-telegram-bot-api'),
  CronJob = require("cron").CronJob

const config = require('./config'),
  schedule = require('./lib/schedules'),
  attendance = require('./lib/attendance')

const { getScheduleMessage, eventLinkToGoogle, eventICSString } = require('./lib/tools')

  // Create a bot that uses 'polling' to fetch new updates
  bot = new TelegramBot(config.token, { polling: true })

// CONST list
const TIMESTAMP =( Date.now() - new Date().getTimezoneOffset() * 60000 )

const getISOTimeString = () => (new Date(TIMESTAMP).toISOString())

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
const setAttendDataMessage = function (chatID, onlyShow) {
  bot.sendMessage(chatID, attendance.getMessage(true), onlyShow ? {} : ATTENDASK)
}

const sendSchedule = function(chatID, textOnly){
  try {
    schedule.getLatestSchesule().then(info => {
      if(textOnly){
        bot.sendMessage(chatID, getScheduleMessage(info))
        return
      }
  
      bot.sendMessage(chatID, getScheduleMessage(info), {
        reply_markup: {
          inline_keyboard: [
            [{text: '구글 켈린더에 등록하기(링크)', url: eventLinkToGoogle(info)}]
          ],
        }
      })
      // make ics file
      const icsFilePath = 'data/이번주_개발제한구역일정.ics'
      fs.writeFileSync(icsFilePath, eventICSString(info))
      bot.sendDocument(chatID, icsFilePath)
    })
  } catch(e) {
    console.log('error in sendMessage!!', e)
    // bot.sendMessage(chatID, '등록된 일정이 없습니다. 관리자에게 문의해주세요.')
  }
}

const setAttend = function (chatID, name) {
  console.log(getISOTimeString() + ' ' + name + '님이 참석의사를 표현하셨습니다.')
  attendance.addAttend(chatID, name)
}

const setAbsent = function (chatID, name) {
  console.log(getISOTimeString() + ' ' + name + '님이 불참의사를 표현하셨습니다.')
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

  schedule.getLatestSchesule().then(info => {
    console.log( getScheduleMessage(info) )
    console.log( eventLinkToGoogle(info) )
    console.log( eventICSString(info) )
  })
}

var registerScheduleByText = function(message) {
  var messageArray = message.split('|')
  schedule.insert(
    messageArray[1].replace(/(년|월)/gi, '-').replace('일', ''),
    messageArray[2],
    messageArray[3],
    messageArray[4]
  )

  attendance.setDate(messageArray[1], true)
}

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg, match) {
  var chatID = msg.chat.id
  var fromID = msg.from.id
  if(chatID === groupChatID || chatID === adminAccountID){
    try {
      var message = msg.text

      if (message) {
        var name = makeName(msg.from)
        if (/^\/scheduletext/.test(message)) {
          console.log(getISOTimeString() + ' ' + name + '님이 스케쥴(텍스트만)을 요청하셨습니다.')
          // printRecentScheduleObject()
          sendSchedule(chatID, true)
        } else if (/^\/schedule/.test(message)) {
          console.log(getISOTimeString() + ' ' + name + '님이 스케쥴을 요청하셨습니다.')
          sendSchedule(chatID)
        } else if (/^\/joinlist/.test(message)) {
          console.log(getISOTimeString() + ' ' + name + '님이 참석인원정보를 요청하셨습니다.')
          if(attendance.isResponsedPerson(chatID)){
            setAttendDataMessage(chatID, true)
          } else {
            setAttendDataMessage(chatID)
          }
        } else if (/^\/attend/.test(message) || /^참석$/.test(message)) {
          setAttend(fromID, name)
          setAttendDataMessage(chatID, true)
        } else if (/^\/absent/.test(message) || /^불참$/.test(message)) {
          setAbsent(fromID, name)
          setAttendDataMessage(chatID, true)
        }
        if (chatID === adminAccountID) {
          if (/^일정입력 /.test(message) || /^일정등록 /.test(message)) {
            console.log(getISOTimeString() + " " + "관리자가 일정을 입력했습니다.");
            registerScheduleByText(message);
            sendSchedule(chatID);
          } else if (/^장소변경 /.test(message)) {

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
  // var chatID = response.message.chat.id
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

// // Weekly routine is running every Monday at 00:00am 
// new CronJob('10 00 00 * * 1', function () { 
//   const nowTime = new Date(Date.now() + 1000*60*60*9)
//   const saturdayTime = new Date(Date.now() + 1000*60*60*9 + 1000*60*60*24*5)
//   const sundayTime = new Date(Date.now() + 1000*60*60*9 + 1000*60*60*24*6)
//   schedule.insert(
//    // saturdayTime.toISOString().slice(0, 10).replace('-', '년').replace('-', '월') + '일',
//     sundayTime.toISOString().slice(0, 10).replace('-', '년').replace('-', '월') + '일',
//     '14:00',
//     4,
//     '장소 미정'
//   )

//   attendance.setDate(recentSchedule.date, true)
// }).start()