var ICS = require('ics'),
    ics = new ICS()

module.exports = {
  extractTextCount: 0,
  date: "",
  place: "",
  timeStart: "",
  timeEnd: "",
  dateStart: "",
  dateEnd: "",
  scheduleMessage: "",
  eventLinkToGoogle: "",
  eventICSString: "",
  initData: function(){
    // init recentSchedule data
    this.extractTextCount = 0;  
    this.date = "";
    this.place = "";
    this.timeStart = "";
    this.timeEnd = "";
    this.dateStart = "";
    this.dateEnd = "";
    this.scheduleMessage = "";
    this.eventLinkToGoogle = "";
    this.eventICSString = "";
  },
  makeDateString: function(){
    if(this.date != "" && this.timeStart != "" && this.timeEnd != ""){
      this.dateStart = this.date.replace('년 ','-').replace('월 ','-').replace('일',' ') + this.timeStart + ':00';
      this.dateEnd = this.date.replace('년 ','-').replace('월 ','-').replace('일',' ') + this.timeEnd + ':00';
      return this.dateStart + ' / ' + this.dateEnd;      
    }
  },
  makeScheduleMessage: function(){
    this.scheduleMessage = '등록된 일정정보입니다. '+this.date+' 카우엔독 2층 '+this.place+'에서'; 
    if(this.timeStart != ""){
      this.scheduleMessage += ' 오후 '+this.timeStart+'시 부터 오후 '+this.timeEnd+'시 까지 ';
    }
    this.scheduleMessage += '진행됩니다.';
    return this.scheduleMessage;
  },
  makeEventLinkToGoogle: function(){
    if(this.date != ""){
      this.eventLinkToGoogle = "http://www.google.com/calendar/render?action=TEMPLATE&text=개발제한구역+스터디&dates="+(new Date(this.dateStart)).toISOString().replace(/-|:|\.\d\d\d/g,"")+"/"+(new Date(this.dateEnd)).toISOString().replace(/-|:|\.\d\d\d/g,"")+"&sprop=name:개발제한구역&location=카우앤독+2층+"+this.place;
      return this.eventLinkToGoogle;
    }
  },
  makeICSString: function(){
    this.eventICSString = ics.buildEvent({
      start: (new Date(this.dateStart)).toISOString().replace(/-|:|\.\d\d\d/g,""),
      end: (new Date(this.dateEnd)).toISOString().replace(/-|:|\.\d\d\d/g,""),
      title: '개발제한구역 스터디',
      description: '탤레그램의 @RestricedZoneBot이 자동으로 생성한 이벤트 입니다.',
      location: '카우앤독 2층 ' + this.place,
      url: ''
    });
    return this.eventICSString;
  },
  bulidRecentSchedule: function(){
    this.makeScheduleMessage();
    this.makeDateString();
    this.makeEventLinkToGoogle();
    this.makeICSString();
    console.log(this); 
  }
};