const fs = require('fs')

const timezoneOffset = new Date().getTimezoneOffset() * 60000;
const timezoneDate = new Date(Date.now() - timezoneOffset);

const SCHEDULEFILEPATH = 'data/schedule.json'
const SCHEDULEDEFAULTFILEPATH = 'data/schedule_default.json'

var scheduleData

if(fs.existsSync(SCHEDULEFILEPATH)){
  scheduleData = JSON.parse(fs.readFileSync(SCHEDULEFILEPATH, 'utf8'))
} else {
  scheduleData = JSON.parse(fs.readFileSync(SCHEDULEDEFAULTFILEPATH, 'utf8'))
}

module.exports = {
  extractTextCount: 0,
  place: scheduleData.place,
  date: scheduleData.date,
  timeStart: scheduleData.timeStart,
  timeEnd: scheduleData.timeEnd,
  initData: function () {
    // init recentSchedule data
    this.extractTextCount = 0;  
    this.date = "";
    this.place = "";
    this.timeStart = "";
    this.timeEnd = "";
  },
  setData: function (date, place, timeStart, timeEnd) {
    this.date = date
    this.place = place
    this.timeStart = timeStart
    this.timeEnd = timeEnd
  },
  getData: function () {
    return {
      'date': this.date,
      'place': this.place,
      'timeStart': this.timeStart,
      'timeEnd': this.timeEnd,
      'dateStart': this.dateStart(),
      'dateEnd': this.dateEnd()
    }
  },
  isExisted: function () {
    console.log(this)
    if( this.place != "" && this.date != "" && this.timeStart != "" && this.timeEnd != "" ){
      return true;
    } else {
      return false;
    }
  },
  dateStart: function () {
    if(this.date != "" && this.timeStart != ""){
      var dateText = this.date.replace('년','-').replace('월','-').replace('일',' ') + this.timeStart;
      console.log('dateStart => dateText', dateText)
      return new Date(new Date(dateText) - timezoneOffset).toISOString();
    } else {
      return "";
    }
  },
  dateEnd: function () {
    if(this.date != "" && this.timeEnd != ""){
      var dateText = this.date.replace('년','-').replace('월','-').replace('일',' ') + this.timeEnd;
      console.log('dateEnd => dateText', dateText)
      return new Date(new Date(dateText) - timezoneOffset).toISOString();
    } else {
      return "";
    }
  },
  exportJSON: function () {
    fs.writeFile(SCHEDULEFILEPATH, JSON.stringify({
      date: this.date,
      place: this.place,
      timeStart: this.timeStart,
      timeEnd: this.timeEnd
    }), (err) => {
      if (err) throw err
      console.log('The file "' + SCHEDULEFILEPATH + '" has been saved!')
    })
  },
  scheduleMessage: function () {
    if(this.isExisted()){
      var messageText = '이번주는 '+this.date+' '+this.place+'에서'; 
      if(this.timeStart != ""){
        messageText += ' '+this.timeStart+'부터 '+this.timeEnd+'까지 ';
      }
      messageText += '진행됩니다.';
      return messageText;
    } else {
      return "";
    }
  },
  eventLinkToGoogle: function () {
    if(this.isExisted()){
      return "http://www.google.com/calendar/render?action=TEMPLATE&text=개발제한구역+스터디&dates="+this.dateStart().replace(/-|:|\.\d\d\d/g,"").slice(0, -1)+"/"+this.dateEnd().replace(/-|:|\.\d\d\d/g,"").slice(0, -1)+"&sprop=name:개발제한구역&location=카우앤독+2층+"+this.place;
    } else {
      return "";
    }
  },
  eventICSString: function () {
    var ICSData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'PRODID:-//imsukmin//blog.nGenius.kr//KO',
      'BEGIN:VEVENT',
      'UID:' + require('uuid/v1')(),
      'DTSTAMP;TZID=Asia/Seoul:' + new Date(Date.now() - timezoneOffset).toISOString().replace(/-|:|\.\d\d\d/g,"").slice(0, -1),
      'DTSTART;TZID=Asia/Seoul:' + this.dateStart().replace(/-|:|\.\d\d\d/g,"").slice(0, -1),
      'DTEND;TZID=Asia/Seoul:' + this.dateEnd().replace(/-|:|\.\d\d\d/g,"").slice(0, -1),
      'SUMMARY:개발제한구역 스터디',
      'DESCRIPTION:탤레그램의 @RestricedZoneBot이 자동으로 생성한 이벤트 입니다.',
      'LOCATION:카우앤독 2층 ' + this.place,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')
    if(this.isExisted()){
      return ICSData
    } else {
      return "";
    }
  }
};