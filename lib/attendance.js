const fs = require('fs')
const schedule = require('./schedules')

function attendance () {
  schedule.getLatestSchesule().then(info => {
    console.log(info, info.responsedPersonList)
    this.data = {
      date: info.date.replace('-', '년').replace('-', '월') + '일',
      message: info.message,
      responsedPersonList: JSON.parse(info.responsedPersonList)
    }
  })
}

attendance.prototype.isNotyet = function () {
  return (this.data.date === '' || (this.data.attend.length === 0 && this.data.absent.length === 0))
}

attendance.prototype.setDate = function (date, isReset) {
  this.data.date = date
  if(isReset) {
    this.data.responsedPersonList = {}
  }
  this.getMessage()
  // this.saveToFile()
  this.updateToDatabase()
}

// attendance.prototype.setDataFromFile = function () {
//   this.data = JSON.parse(fs.readFileSync(ATTENDDEFAULTFILEPATH, 'utf8'))
// }

attendance.prototype.getMessage = function () {
  var attendListArray = []
  var absentListArray = []

  if(this.totelResponseCount() === 0) {
    return '아직 참석한 인원의사를 표시한 사람이 없습니다.'
  } else {
    for (const key of Object.keys(this.data.responsedPersonList)) {
      const person = this.data.responsedPersonList[key]
      person.isAttend 
      ? attendListArray.push(person.name)
      : absentListArray.push(person.name)
    }
    this.data.message = this.data.date + ' 스터디 참석 정보\n참석: ' + attendListArray.join(', ') + '\n불참: ' + absentListArray.join(',')
  
    return this.data.message
  }
}

// attendance.prototype.saveToFile = function () {
//   fs.writeFile(ATTENDFILEPATH, JSON.stringify(this.data), (err) => {
//     if (err) throw err
//     console.log('The file "' + ATTENDFILEPATH + '" has been saved!')
//   })
// }

// attendance.prototype.loadFromFile = function () {
//   if(fs.existsSync(ATTENDFILEPATH)){
//     attendData = JSON.parse(fs.readFileSync(ATTENDFILEPATH, 'utf8'))
//   } else {
//     attendData = JSON.parse(fs.readFileSync(ATTENDDEFAULTFILEPATH, 'utf8'))
//   }
//   console.log('The attendance info file is loaded!')
// }

attendance.prototype.resetAttendee = function () {
  // this.data.attend = []
  // this.data.absent = []
  this.data.responsedPersonList = {}
}

attendance.prototype.addAttend = function (chatID, name) {
  console.log(this.data)
  // if(this.data.attend.indexOf(chatID) === -1){
  //   this.data.attend.push(chatID)
  // }
  // if(this.data.absent.indexOf(chatID) !== -1){
  //   this.data.absent.splice(this.data.absent.indexOf(chatID), 1)
  // }
  this.addResponsedPersonList(chatID, name, true)
  // this.saveToFile()
  this.updateToDatabase()
}

attendance.prototype.addAbsent = function (chatID, name) {
  // if(this.data.absent.indexOf(chatID) === -1){
  //   this.data.absent.push(chatID)
  // }
  // if(this.data.attend.indexOf(chatID) !== -1){
  //   this.data.attend.splice(this.data.attend.indexOf(chatID), 1)
  // }
  this.addResponsedPersonList(chatID, name, false)
  // this.saveToFile()
  this.updateToDatabase()
}

attendance.prototype.addResponsedPersonList = function (chatID, name, isAttend) {
  this.data.responsedPersonList[chatID] = {
    name: name,
    isAttend: isAttend
  }
}

attendance.prototype.isResponsedPerson = function (chatID) {
  return this.data.responsedPersonList.hasOwnProperty(chatID)
}

attendance.prototype.totelResponseCount = function () {
  return Object.keys(this.data.responsedPersonList).length
}

attendance.prototype.updateToDatabase = function () {
  schedule.updateAttendee(JSON.stringify(this.data.responsedPersonList))
}

module.exports = new attendance()
