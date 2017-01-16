var ICS = require('ics'),
    ics = new ICS()

module.exports = {
  extractTextCount: 0,
  place: "",
  date: "",
  timeStart: "",
  timeEnd: "",
  initData: function(){
    console.log("");
    // init recentSchedule data
    this.extractTextCount = 0;  
    this.date = "";
    this.place = "";
    this.timeStart = "";
    this.timeEnd = "";
  },
  isExsited: function(){
    if( this.place != "" && this.date != "" && this.timeStart != "" && this.timeEnd != "" ){
      return true;
    } else {
      return false;
    }
  },
  dateStart: function(){
    console.log("");
    if(this.date != "" && this.timeStart != ""){
      return new Date(this.date.replace('년 ','-').replace('월 ','-').replace('일',' ') + this.timeStart + ':00');      
    } else {
      return "";
    }
  },
  dateEnd: function(){
    console.log("");
    if(this.date != "" && this.timeEnd != ""){
      return new Date(this.date.replace('년 ','-').replace('월 ','-').replace('일',' ') + this.timeEnd + ':00');
    } else {
      return "";
    }
  },
  scheduleMessage: function(){
    console.log("");
    var messageText = '이번주는 '+this.date+' 카우엔독 2층 '+this.place+'에서'; 
    if(this.timeStart != ""){
      messageText += ' 오후 '+this.timeStart+'시 부터 오후 '+this.timeEnd+'시 까지 ';
    }
    messageText += '진행됩니다.';
    return messageText;
  },
  eventLinkToGoogle: function(){
    console.log("");
    if(this.date != ""){
      var messageText = "http://www.google.com/calendar/render?action=TEMPLATE&text=개발제한구역+스터디&dates="+this.dateStart().toISOString().replace(/-|:|\.\d\d\d/g,"")+"/"+this.dateEnd().toISOString().replace(/-|:|\.\d\d\d/g,"")+"&sprop=name:개발제한구역&location=카우앤독+2층+"+this.place;
      return messageText;
    } else {
      return "";
    }
  },
  eventICSString: function(){
    console.log("");
    var messageText = ics.buildEvent({
      start: this.dateStart().toISOString().replace(/-|:|\.\d\d\d/g,""),
      end: this.dateEnd().toISOString().replace(/-|:|\.\d\d\d/g,""),
      title: '개발제한구역 스터디',
      description: '탤레그램의 @RestricedZoneBot이 자동으로 생성한 이벤트 입니다.',
      location: '카우앤독 2층 ' + this.place,
      url: ''
    });
    return messageText;
  }
};