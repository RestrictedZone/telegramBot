const timezoneOffset = new Date().getTimezoneOffset() * 60000;

const getScheduleMessage = (info) => {
    return `이번 스터디 일정은 ${info.date.replace('-', '년').replace('-', '월')}일 ${info.place} 에서 ${info.startTime} 부터 ${info.howLongTime} 시간 동안 진행됩니다.`;
}
const eventLinkToGoogle = (info) => {
    return `http://www.google.com/calendar/render?action=TEMPLATE&text=개발제한구역+스터디&dates=${info.date.replace(/-/gi, '')}T${info.startTime.replace(':', '')}00/${info.date.replace(/-/gi, '')}T${parseInt(info.startTime.slice(0,2))+info.howLongTime}0000&sprop=name:개발제한구역&location=${info.place}`
}
const eventICSString = (info) => {
  const ICSData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//imsukmin//blog.nGenius.kr//KO',
    'BEGIN:VEVENT',
    'UID:' + require('uuid/v1')(),
    'DTSTAMP;TZID=Asia/Seoul:' + new Date(Date.now() - timezoneOffset).toISOString().replace(/-|:|\.\d\d\d/g,"").slice(0, -1),
    'DTSTART;TZID=Asia/Seoul:' + `${info.date.replace(/-/gi, '')}T${info.startTime.replace(':', '')}00`,
    'DTEND;TZID=Asia/Seoul:' + `${info.date.replace(/-/gi, '')}T${parseInt(info.startTime.slice(0,2))+info.howLongTime}0000`,
    'SUMMARY:개발제한구역 스터디',
    'DESCRIPTION:탤레그램의 @RestricedZoneBot이 자동으로 생성한 이벤트 입니다.',
    'LOCATION:' + info.place,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  return ICSData
}

module.exports = {
  getScheduleMessage,
  eventLinkToGoogle,
  eventICSString
}