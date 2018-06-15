const axios = require('axios')
// default header
module.exports = function () {
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

  let targetDate = new Date(Date.now() + 1000*60*60*24*6 + 1000*60*60*9 ).toISOString().slice(0,10).replace(/-/gi, '')

  // get login token
  console.log('=============   /api/rooms/schedule.json [' + targetDate + ']   =============')
  return axios({
    method: "get",
    url: "https://app.cowndog.com/api/rooms/schedule.json?date=" + targetDate,
  })
}
