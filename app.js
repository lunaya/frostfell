const Discord = require('discord.js')
const axios = require('axios')
const client = new Discord.Client()
const config = require('./config.js')
// const TwitchList = require('./twitchlist.js')
// const twitchList = TwitchList


//warframe items list
const alertItems = [ "Orokin", "Nitain", "Forma", "Kavat" ]

//poll warframe API every 10 minutes
function warframePoller(channel){
  setTimeout(function(){
    axios({
      method: 'get',
      url: config.warframeGetUrl
    })
    .then(function(response){
      console.log("then")
      const alerts = response.data["Alerts"]
      let finalOutput = ""

      const alertArray = alerts.map(function(alert){
        console.log("alerts array map")

        //parse rewards
        const reward = alert.MissionInfo.missionReward

        //only do things if alert has any rewards
        if (reward.items) {
          console.log('yay')

          // parse individual alert info
          const mission = alert.MissionInfo.missionType.substring(3)
          const level = (alert.MissionInfo.minEnemyLevel + alert.MissionInfo.maxEnemyLevel) / 2
          const expireTime = alert.Expiry.$date.$numberLong
          const minutesLeft = Math.round((expireTime - Date.now()) / 60 / 1000 )

          let itemArray = []
          reward.items.map(function(item){

            //parse item name
            const itemName = reward.items[0].substr(reward.items[0].lastIndexOf("/")+1)

            console.log("checking items")
            //check against important item list
            alertItems.map(function(wantedItem){
              if (itemName.indexOf(wantedItem) >= 0){
                console.log('pushing')
                itemArray.push(itemName)
              }
            })
          })

          //pushes the alert to finalOutput IF an item matches one we want
          if (itemArray.length > 0){
            const rewardOutput = itemArray.join(", ")
            finalOutput += (mission + "[level " + level + "] - " + rewardOutput + " - " + minutesLeft + "m remaining\n")
          }

        }
      })

      //check to see if anything was pushed to final output - if so, broadcast
      if (finalOutput.length >= 1){
        console.log(finalOutput)
        // channel.sendMessage(finalOutput)
      }
      //if not, then nothing important was found
      else {
        console.log("nothing important found")
      }
      
      //recursively call again
      warframePoller()
    })
  }, 15 *1000*60)//delay, in minutes *math
}


// (function twitchPoller(){
//   setTimeout(function(){
//     axios({
//       method: 'get',
//       url: config.twitchGetUrl + twitchList.users,
//       headers: {
//         "client-id": config.twitchClientId
//       }
//     })
//     .then(function(response){

//     })
//   })

// })();

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
    // console.log(rollsTotal)
  }
  return rollsMsg + "-> Total: " + rollsTotal.toString()
}

function randomArrayIndex(array) {
  return parseInt(Math.random() * array.length -1)
}

client.on('message', message => {
  var msgArray = message.content.split(" ")
  var firstWord = msgArray[0]

  if (firstWord === '/test') {
    message.guild.channels.find("loop", "#frostfell_no").sendMessage("nyan");
  }

  if (firstWord === 'beep') {
    message.channel.sendMessage('boop')
  }

  if (firstWord === 'frostfell') {
    message.channel.sendMessage(':<!')
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

  if (firstWord === '/gif') {
    msgArray.shift()
    msgArray.join('-')
    const searchTerms = regex(msgArray, "-")

    const getGfyLink = axios({
      method: 'get',
      url: config.gfyGetUrl + searchTerms,
      headers: {
        "Authorization": "Bearer " + config.gfyKey,
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

      const getKey = axios({
        method: 'post',
        url: config.gfyAuthUrl,
        data: {
          "grant_type": "client_credentials",
          "client_id": config.gfyClientId,
          "client_secret": config.gfyClientSecret
        }
      })
      .then(function(response){

        const gfyKey = response.data.access_token
        config.gfyKey = gfyKey

        const getGfyLink = axios({
          method: 'get',
          url: config.gfyGetUrl + searchTerms,
          headers: {
            "Authorization": "Bearer " + config.gfyKey,
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

  if (firstWord === '/lewd') {
    if (!msgArray[1]) {
      const searchTerms = ""

      const getLewds = axios({
        method: 'get',
        url: config.booruGetUrl + searchTerms,
      })
      .then(function(response){
        const booruId = response.data[randomArrayIndex(response.data)].id
        message.channel.sendMessage(config.booruPostUrl + booruId)
      })
      .catch(function(response){
        // console.log(response)
      })
    }
    else {
      msgArray.shift()
      const searchTerms = msgArray.join('+')

      console.log(searchTerms)
      
      const getLewds = axios({
        method: 'get',
        url: config.booruGetUrl + searchTerms,
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
        // console.log(response)
      })
    }
  }

});

client.on('ready', () => {
  console.log('I am ready!')
  const warframeChannel = client.channels.get(config.warframeChannel)

  // twitchPoller()
  warframePoller(warframeChannel)
});

const login = config.loginKey
client.login(login)