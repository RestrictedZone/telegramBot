var ICS = require('ics'),
    ics = new ICS()

module.exports = {
  extractTextCount: 0,
  place: "",
  date: "",
  timeStart: "",
  timeEnd: "",
  initData: function () {
    // init recentSchedule data
    this.extractTextCount = 0;  
    this.date = "";
    this.place = "";
    this.timeStart = "";
    this.timeEnd = "";
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
    if( this.place != "" && this.date != "" && this.timeStart != "" && this.timeEnd != "" ){
      return true;
    } else {
      return false;
    }
  },
  dateStart: function () {
    if(this.date != "" && this.timeStart != ""){
      var dateText = this.date.replace('년','-').replace('월','-').replace('일',' ') + (parseInt(this.timeStart)) + ':00';
      // console.log('dateStart', dateText)
      return new Date(dateText).toISOString();
    } else {
      return "";
    }
  },
  dateEnd: function () {
    if(this.date != "" && this.timeEnd != ""){
      var dateText = this.date.replace('년','-').replace('월','-').replace('일',' ') + (parseInt(this.timeEnd)) + ':00';
      // console.log('dateEnd', dateText)
      return new Date(dateText).toISOString();
    } else {
      return "";
    }
  },
  scheduleMessage: function () {
    if(this.isExisted()){
      var messageText = '이번주는 '+this.date+' 카우엔독 2층 '+this.place+'에서'; 
      if(this.timeStart != ""){
        messageText += ' '+this.timeStart+'시 부터 '+this.timeEnd+'시 까지 ';
      }
      messageText += '진행됩니다.';
      return messageText;
    } else {
      return "";
    }
  },
  eventLinkToGoogle: function () {
    if(this.isExisted()){
      return "http://www.google.com/calendar/render?action=TEMPLATE&text=개발제한구역+스터디&dates="+this.dateStart().replace(/-|:|\.\d\d\d/g,"")+"/"+this.dateEnd().replace(/-|:|\.\d\d\d/g,"")+"&sprop=name:개발제한구역&location=카우앤독+2층+"+this.place;
    } else {
      return "";
    }
  },
  eventICSString: function () {
    if(this.isExisted()){    
      return ics.buildEvent({
        start: this.dateStart().replace(/-|:|\.\d\d\d/g,""),
        end: this.dateEnd().replace(/-|:|\.\d\d\d/g,""),
        title: '개발제한구역 스터디',
        description: '탤레그램의 @RestricedZoneBot이 자동으로 생성한 이벤트 입니다.',
        location: '카우앤독 2층 ' + this.place,
        url: ''
      });
    } else {
      return "";
    }
  }
};