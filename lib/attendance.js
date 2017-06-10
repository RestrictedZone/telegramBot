var fs = require('fs')

var attendData
// CONST list
const ATTENDFILEPATH = './data/attend.json'
const ATTENDDEFAULTFILEPATH = './data/attend_default.json'

// for attend info data
if(fs.existsSync(ATTENDFILEPATH)){
  attendData = JSON.parse(fs.readFileSync(ATTENDFILEPATH, 'utf8'))
} else {
  attendData = JSON.parse(fs.readFileSync(ATTENDDEFAULTFILEPATH, 'utf8'))
}

function attendance () {
  this.data = {
    date: attendData.date,
    message: attendData.message,
    attend: attendData.attend,
    absent: attendData.absent
  }
}

attendance.prototype.isNotyet = function () {
  return (this.data.date === '' || (this.data.attend.length === 0 && this.data.absent.length === 0))
}

attendance.prototype.setDate = function (date) {
  this.data.date = date
}

attendance.prototype.setDataFromFile = function () {
  this.data = JSON.parse(fs.readFileSync(ATTENDDEFAULTFILEPATH, 'utf8'))
}

attendance.prototype.getMessage = function () {
  if (!this.isNotyet()){
    this.data.message = this.data.date + ' 스터디 참석 정보\n참석: ' + this.data.attend.toString() + '\n불참: ' +  this.data.absent.toString()
  }
  return this.data.message
}

attendance.prototype.saveToFile = function () {
  fs.writeFile(ATTENDFILEPATH, JSON.stringify(this.data), (err) => {
    if (err) throw err
    console.log('The file "' + ATTENDFILEPATH + '" has been saved!')
  })
}

attendance.prototype.addAttend = function (name) {
  if(this.data.attend.indexOf(name) === -1){
    this.data.attend.push(name)
  }
  if(this.data.absent.indexOf(name) !== -1){
    this.data.absent.splice(this.data.absent.indexOf(name), 1)
  }
  this.saveToFile()
}

attendance.prototype.addAbsent = function (name) {
  if(this.data.absent.indexOf(name) === -1){
    this.data.absent.push(name)
  }
  if(this.data.attend.indexOf(name) !== -1){
    this.data.attend.splice(this.data.attend.indexOf(name), 1)
  }
  this.saveToFile()
}

attendance.prototype.totelResponseCount = function () {
  return this.data.attend.length + this.data.absent.length
}

module.exports = new attendance()
