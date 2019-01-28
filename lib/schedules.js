const mysql      = require('mysql2')
const config   = require('../config')

const getMysqlPool = () => {
  return mysql.createPool(config.db).promise()
}

// create the connection
// query database

const insert = (date, startTime, howLongTime, place) => {

  date = (date !== undefined && typeof date === 'string') ? date : ''
  startTime = (startTime !== undefined && typeof startTime === 'string') ? startTime : '14:00'
  howLongTime = (howLongTime !== undefined && typeof howLongTime === 'number') ? howLongTime : 4
  place = (place !== undefined && typeof place === 'string') ? place : '장소미정'

  const pool = getMysqlPool()

  return pool.query(`INSERT INTO 
      schedule (date, startTime, howLongTime, place, responsedPersonList) 
      VALUES (?, ?, ?, ?, "")`,
      [date, startTime, howLongTime, place])
    .then( ([rows,fields]) => {
      console.log(rows)
      return rows
    })
    .catch(e => console.log(e))
    .then( () => pool.end())
}

const update = () => (date, startTime, howLongTime, place, responsedPersonList) => {

  return getLatestSchesule().then( info => {
      date = (date !== undefined && typeof date === 'string') ? date : info.date
      startTime = (startTime !== undefined && typeof startTime === 'string') ? startTime : info.startTime
      howLongTime = (howLongTime !== undefined && typeof howLongTime === 'number') ? howLongTime : info.howLongTime
      place = (place !== undefined && typeof place === 'string') ? place : info.place
      responsedPersonList = (responsedPersonList !== undefined && typeof responsedPersonList === 'string') ? responsedPersonList : info.responsedPersonList

      const pool = getMysqlPool()

      pool.query(`UPDATE schedule
        SET 
          date=?, 
          startTime=?,
          howLongTime=?,
          place=?,
          responsedPersonList=?,
        WHERE id=?}`,
        [date, startTime, howLongTime, place, responsedPersonList, info.id])
      })
      .catch(e => console.log(e))
      .then( () => pool.end())
}

const updatePlace = (place) => {
  if(place !== undefined && typeof place === 'string') {
    console.log('updatePlace ERROR! 장소의 값이 이상합니다. : ', place)
    return
  }

  // const pool = getMysqlPool()
  getLatestSchesule().then( info => {
      const pool = getMysqlPool()
      pool.query(`UPDATE schedule SET place=?, WHERE id=?`, [place, info.id])
      .catch(e => console.log(e))
      .then( () => pool.end())
  })
  .catch(e => console.log(e))
}

const updateAttendee = (responsedPersonList) => {
  responsedPersonList = (responsedPersonList !== undefined && typeof responsedPersonList === 'string') ? responsedPersonList : ''

  getLatestSchesule().then( info => {
      const pool = getMysqlPool()

      pool.query(`UPDATE schedule
      SET responsedPersonList= ?
      WHERE id= ?`, [responsedPersonList, info.id] )
      .then( () => pool.end())
      .catch(e => console.log(e))
  })
  .catch(e => console.log(e))
}

const getLatestSchesule = () => {
  const pool = getMysqlPool()

  return pool.query('SELECT * FROM schedule ORDER BY id DESC LIMIT 1')
    .then( ([rows,fields]) => { pool.end(); return rows[0]})
    .then(row => {console.log(row); return row})
    .catch(e => console.log(e))
}

module.exports = {
  insert,
  update,
  updatePlace,
  updateAttendee,
  getLatestSchesule
}