var assert = require("assert"); //nodejs에서 제공하는 aseert 모듈
var scheduleData = require("./scheduleData");
var ICS = require('ics'),
    ics = new ICS()

describe('scheduleData', function() {
	describe('check INIT data', function () {
		it('extractTextCount', function () {
			assert.equal(scheduleData.extractTextCount, 0);
		});
        it('place', function () {
			assert.equal(scheduleData.place, "");
		});
        it('date', function () {
			assert.equal(scheduleData.date, "");
		});
        it('timeStart', function () {
			assert.equal(scheduleData.timeStart, "");
		});
        it('timeEnd', function () {
			assert.equal(scheduleData.timeEnd, "");
		});
        it('initData', function () {
			assert.equal(typeof scheduleData.initData, "function");
		});
		it('isExsited', function () {
			assert.equal(typeof scheduleData.isExsited, "function");
		});
        it('dateStart', function () {
			assert.equal(typeof scheduleData.dateStart, "function");
		});
        it('dateEnd', function () {
			assert.equal(typeof scheduleData.dateEnd, "function");
		});
        it('scheduleMessage', function () {
			assert.equal(typeof scheduleData.scheduleMessage, "function");
		});
        it('eventLinkToGoogle', function () {
			assert.equal(typeof scheduleData.eventLinkToGoogle, "function");
		});
        it('eventICSString', function () {
			assert.equal(typeof scheduleData.eventICSString, "function");
		});
	});
    describe("initData()",function(){
		before(function(){
			scheduleData.extractTextCount = 123987129837;
			scheduleData.place = "dummyData";
			scheduleData.date = "dummyData";
			scheduleData.timeStart = "dummyData";
			scheduleData.timeEnd = "dummyData";
			scheduleData.initData();
		});
		
		it('extractTextCount', function () {
			assert.equal(scheduleData.extractTextCount, 0);
		});
        it('place', function () {
			assert.equal(scheduleData.place, "");
		});
        it('date', function () {
			assert.equal(scheduleData.date, "");
		});
        it('timeStart', function () {
			assert.equal(scheduleData.timeStart, "");
		});
        it('timeEnd', function () {
			assert.equal(scheduleData.timeEnd, "");
		});
	});
	describe("isExsited()",function(){
		beforeEach(function(){
			scheduleData.initData();
		});
		it('before input basic data', function() {
			assert.equal(scheduleData.isExsited(), false);
		});
		it('after all input basic data without place', function() {
			scheduleData.date = "2017년 1월 18일";
			scheduleData.timeStart = "02";
			scheduleData.timeEnd = "04";
			assert.equal(scheduleData.isExsited(), false);
		});	
		it('after all input basic data without date', function() {
			scheduleData.place = "N06A";
			scheduleData.timeStart = "02";
			scheduleData.timeEnd = "04";
			assert.equal(scheduleData.isExsited(), false);
		});	
		it('after all input basic data without timeStart', function() {
			scheduleData.place = "N06A";
			scheduleData.date = "2017년 1월 18일";
			scheduleData.timeEnd = "04";
			assert.equal(scheduleData.isExsited(), false);
		});	
		it('after all input basic data without timeEnd', function() {
			scheduleData.place = "N06A";
			scheduleData.date = "2017년 1월 18일";
			scheduleData.timeStart = "02";
			assert.equal(scheduleData.isExsited(), false);
		});	
		it('after all input basic data', function() {
 			scheduleData.place = "N06A";
			scheduleData.date = "2017년 1월 18일";
			scheduleData.timeStart = "02";
			scheduleData.timeEnd = "04";
			assert.equal(scheduleData.isExsited(), true);
		});		
	});
	describe('dateStart()', function () {
		
		it('before input basic data', function() {
			scheduleData.initData();
			assert.equal(scheduleData.dateStart(), "");
		});
		it('after input basic data', function() {
			scheduleData.date = "2017년 1월 18일";
			scheduleData.timeStart = "02";
			assert.equal(scheduleData.dateStart().toString(), new Date("2017-1-18 02:00").toString());
		});		
			
	});
	describe('dateEnd()', function () {
				
		it('before input basic data', function() {
			scheduleData.initData();
			assert.equal(scheduleData.dateEnd(), "");
		});
		it('after input basic data', function() {
			scheduleData.date = "2017년 1월 18일";
			scheduleData.timeEnd = "04";
			assert.equal(scheduleData.dateEnd().toString(), new Date("2017-1-18 04:00").toString());
		});		
		
	});
	describe('scheduleMessage()', function () {
		it('before input basic data', function() {
			scheduleData.initData();
			assert.equal(scheduleData.scheduleMessage(), "");
		});
		it('after input basic data', function() {
			scheduleData.place = "N06A";
			scheduleData.date = "2017년 1월 18일";
			scheduleData.timeStart = "02";
			scheduleData.timeEnd = "04";
			assert.equal(scheduleData.scheduleMessage(), "이번주는 2017년 1월 18일 카우엔독 2층 N06A에서 오후 02시 부터 오후 04시 까지 진행됩니다.");
		});	
	});
	describe('eventLinkToGoogle()', function () {
		it('before input basic data', function() {
			scheduleData.initData();
			assert.equal(scheduleData.eventLinkToGoogle(), "");
		});
		it('after input basic data', function() {
			scheduleData.place = "N06A";
			scheduleData.date = "2017년 1월 18일";
			scheduleData.timeStart = "02";
			scheduleData.timeEnd = "04";
			assert.equal(scheduleData.eventLinkToGoogle(), "http://www.google.com/calendar/render?action=TEMPLATE&text=개발제한구역+스터디&dates=20170117T170000Z/20170117T190000Z&sprop=name:개발제한구역&location=카우앤독+2층+N06A");
		});	
	});
	describe('eventICSString()', function () {
		it('before input basic data', function() {
			scheduleData.initData();
			assert.equal(scheduleData.eventICSString(), "");
		});
		it('after input basic data', function() {
			scheduleData.place = "N06A";
			scheduleData.date = "2017년 1월 18일";
			scheduleData.timeStart = "02";
			scheduleData.timeEnd = "04";
			var icalArray = scheduleData.eventICSString().split("\n");	
			assert.equal(icalArray[7], "DTSTART:20170118T020000\r");
			assert.equal(icalArray[8], "DTEND:20170118T040000\r");
			assert.equal(icalArray[9], "SUMMARY:개발제한구역 스터디\r");
			assert.equal(icalArray[10], "DESCRIPTION:탤레그램의 @RestricedZoneBot이 자동으로 생성한 이벤트 입니다.\r");
			assert.equal(icalArray[11], "LOCATION:카우앤독 2층 N06A\r");					
		});	
	});
});

