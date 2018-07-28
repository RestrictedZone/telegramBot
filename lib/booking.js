const axios = require('axios')
const account = require('../config').cowndog
const TIMEZONEOFFSET = new Date().getTimezoneOffset() * 60000

// default header

exports.booking = function () {

  axios.defaults.headers.common['Content-Type'] = 'application/json'
  axios.defaults.headers.common['Host'] = 'app.cowndog.com'
  axios.defaults.headers.common['Connection'] = 'keep-alive'
  axios.defaults.headers.common['X-Device-UUID'] = '891273981729387129837'
  axios.defaults.headers.common['Origin'] = 'https://app.cowndog.com'
  axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Mobile Safari/537.36'
  axios.defaults.headers.common['Content-Type'] = 'application/json;charset=UTF-8'
  axios.defaults.headers.common['Accept'] = 'application/json, text/plain, */*'
  axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
  axios.defaults.headers.common['DNT'] = '1'
  axios.defaults.headers.common['Referer'] = 'https://app.cowndog.com/'
  axios.defaults.headers.common['Accept-Encoding'] = 'gzip, deflate, br'
  axios.defaults.headers.common['Accept-Language'] = 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'

  // get login token
  console.log('=============   /api/members/login.json   =============')
  axios({
    method: "post",
    url: "https://app.cowndog.com/api/members/login.json",
    data: {
      email: account.id,
      password: account.pw,
      device_data: {
        device: {
          available: false,
          platform: null,
          version: null,
          uuid: null,
          cordova: null,
          model: null
        },
        device_token: "",
        register_id: ""
      }
    }
  }).then(function(response) {
    console.log("=============   /api/rooms/reserve.json   =============");
    console.log("status", response.status);
    console.log("data", response.data);
    console.log("headers", response.headers);
    const loginToken = response.headers["set-cookie"][response.headers["set-cookie"].length - 1].split(";")[0];
    const nowDate = new Date(Date.now() - TIMEZONEOFFSET);
    nowDate.setDate(nowDate.getDate() + 15);
    const dateString = nowDate
      .toISOString()
      .replace(/-/gi, "")
      .slice(0, 8);
    console.log("loginToken", loginToken);
    // set Cookie(login token) from server
    axios.defaults.headers.common["Cookie"] = loginToken;
    axios({
      method: "post",
      url: "https://app.cowndog.com/api/rooms/reserve.json",
      data: {
        room_id: "1",
        date: dateString,
        startTime: "14:00",
        endTime: "16:30",
        title: "스터디",
        organization: "개발제한구역",
        contact: "imsukmin@gmail.com"
      }
    }).then(function(response) {
      console.log("=============   /api/rooms/pay.json   =============");
      console.log("status", response.status);
      console.log("data", response.data);
      console.log("headers", response.headers);
      axios({
        method: "post",
        url: "https://app.cowndog.com/api/rooms/pay.json",
        data: { rent_id: response.data.response.rent_id, card_id: "4260" }
      }).then(function(response) {
        console.log("status", response.status);
        console.log("data", response.data);
        console.log("headers", response.headers);
      });
    });
  });
}

exports.checkBooking = function (dateString) {
  const url = 'https://app.cowndog.com/api/rooms/schedule.json?date=' + dateString
  return axios.get(url)
}
