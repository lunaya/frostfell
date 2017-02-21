const Discord = require('discord.js')
const axios = require('axios')
const client = new Discord.Client()
// const Config = require('./config.js')
// const config = Config


client.on('ready', () => {
  console.log('I am ready!')
});

function isNormalInteger(str) {
    var n = Math.floor(Number(str))
    return String(n) === str && n >= 0
}

function regex (string, separator) {
    return String(string).replace(/[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|+=-]/g, separator)
}

function roller(max){
  return Math.floor((Math.random() * max) + 1)
}

function dRoll(sides, dice){
  let rollsMsg = "Rolling " + dice + "d" + sides + " -> ";
  var rollsTotal = 0;
  for (var i=1 ; i <= dice ; i++) {
    const thisRoll = roller(sides)
    rollsMsg += "[" + thisRoll + "]  "
    rollsTotal += thisRoll
    console.log(rollsTotal)
  }
  return rollsMsg + "-> Total: " + rollsTotal.toString()
}

function getGfyKey() {
  const getKey = axios({
    method: 'post',
    // url: config.gfyAuthUrl,
    url: process.env.gfyAuthUrl,
    data: {
      "grant_type": "client_credentials",
      // "client_id": config.gfyBody["client_id"],
      "client_id": process.env.gfyClientId,
      // "client_secret": config.gfyBody["client_secret"]
      "client_secret": process.env.gfyClientSecret
    }
  })
  .then(function(response){
    const gfyKey = response.data.access_token
    // config.gfyKey = gfyKey
    process.env.gfyKey = gfyKey
  })
  .catch(function(response){
    console.log(response)
  });
}

function randomArrayIndex(array) {
  return parseInt(Math.random() * array.length -1)
}

client.on('message', message => {
  var msgArray = message.content.split(" ")
  var firstWord = msgArray[0]

  if (firstWord === '/halp') {
    message.channel.sendMessage("Hi!  I'm frostfell :D  I'm wings' bot!  I can do many things!!")
    message.channel.sendMessage("Use /gif + words (underscores for phrases, spaces for separate tags) to find a random gif! ex: /gif rocket_league, /gif cats dogs" )
    message.channel.sendMessage("Use /rng (number optional) to generate a random number between 1-100, or the optional number you specify.  ex: /rng 10")
    message.channel.sendMessage("Use /d (numbers optional) to roll one d20 die, where the optional numbers are sides and number of dice.  ex: /d 10 5 rolls 5 10-sided dice.")
  }
  if (firstWord === 'beep') {
    message.channel.sendMessage('boop')
  }

  if (firstWord === 'haha') {
    message.channel.sendMessage('XD!')
  }

  

  if (firstWord === '/dc') {
    message.channel.sendMessage('goodbye ;o;!')
    client.destroy();
  }

  if (firstWord === '/gif') {
    msgArray.shift()
    msgArray.join('-')
    const searchTerms = regex(msgArray, "-")
    console.log(searchTerms)

    const getGfyLink = axios({
      method: 'get',
      // url: config.gfyGetUrl + searchTerms,
      url: process.env.gfyGetUrl + searchTerms,
      headers: {
        // "Authorization": "Bearer " + config.gfyKey,
        "Authorization": "Bearer " + process.env.gfyKey,
      }
    })
    .then(function(response){
      if (!response.data.gfycats) {
        message.channel.sendMessage("I couldn't find that! D:")
      }
      else{
        const gfyCatId = response.data.gfycats[randomArrayIndex(response.data.gfycats)].gfyId
        message.channel.sendMessage("https://gfycat.com/" + gfyCatId)
      }
    })
    .catch(function(response){
      console.log("gfycat error, running key getter")

      const getKey = axios({
        method: 'post',
        // url: config.gfyAuthUrl,
        url: process.env.gfyAuthUrl,
        data: {
          "grant_type": "client_credentials",
          // "client_id": config.gfyBody["client_id"],
          "client_id": process.env.gfyClientId,
          // "client_secret": config.gfyBody["client_secret"]
          "client_secret": process.env.gfyClientSecret
        }
      })
      .then(function(response){

        const gfyKey = response.data.access_token
        // config.gfyKey = gfyKey
        process.env.gfyKey = gfyKey

        const getGfyLink = axios({
          method: 'get',
          // url: config.gfyGetUrl + searchTerms,
          url: process.env.gfyGetUrl + searchTerms,
          headers: {
            // "Authorization": "Bearer " + config.gfyKey,
            "Authorization": "Bearer " + process.env.gfyKey,
          }
        })
        .then(function(response){
          if (!response.data.gfycats) {
            message.channel.sendMessage("I couldn't find that! D:")
          }
          else{
            const gfyCatId = response.data.gfycats[randomArrayIndex(response.data.gfycats)].gfyId
            message.channel.sendMessage("https://gfycat.com/" + gfyCatId)
          }
        })
      })
    })
  }

  if (firstWord === '/rng') {
    if (msgArray[1]){
      if (isNormalInteger(msgArray[1]) === false){
        message.channel.sendMessage("I can't roll this D:")
      }
      else {
        message.channel.sendMessage('ROLL ' + msgArray[1] + '! -> ' + roller(msgArray[1]))
      }      
    }
    else {
      message.channel.sendMessage('ROLL 100! -> ' + roller(100))
    }
  }

  if (firstWord === '/d') {
    if (!msgArray[1]){
      message.channel.sendMessage('Rolling 1d20 -> ' + roller(20))
    }
    else {
      if (isNormalInteger(msgArray[1]) === false){
        message.channel.sendMessage("I can't roll this D:")
      }
      else {
        if (!msgArray[2]){
          message.channel.sendMessage(dRoll(msgArray[1], 1))
        }
        else {
          if (isNormalInteger(msgArray[2]) === false){
            message.channel.sendMessage("I can't roll this D:")
          }
          else {
            message.channel.sendMessage(dRoll(msgArray[1], msgArray[2]))
          }
        }
      }
    }
  }

  if (firstWord === '/lewd') {
    if (!msgArray[1]) {
      const searchTerms = ""

      const getLewds = axios({
        method: 'get',
        // url: config.booruGetUrl + searchTerms,
        url: process.env.booruGetUrl + searchTerms,
      })
      .then(function(response){
        const booruId = response.data[randomArrayIndex(response.data)].id
        // message.channel.sendMessage(config.booruPostUrl + booruId)
        message.channel.sendMessage(process.env.booruPostUrl + booruId)
      })
      .catch(function(response){
        console.log(response)
      })
    }
    else {
      msgArray.shift()
      const searchTerms = msgArray.join('+')

      console.log(searchTerms)
      
      const getLewds = axios({
        method: 'get',
        // url: config.booruGetUrl + searchTerms,
        url: process.env.booruGetUrl + searchTerms,
      })
      .then(function(response){
        if (response.data.length == 0){
          message.channel.sendMessage("This tag doesn't exist D:a")
        }
        else{
          const booruId = response.data[randomArrayIndex(response.data)].id
          message.channel.sendMessage(config.booruPostUrl + booruId)
        }
      })
      .catch(function(response){
        console.log(response)
      })
    }
  }
});
// const login = config.clientLogin
const login = process.env.loginKey
client.login(login)