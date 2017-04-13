const Discord = require('discord.js')
const axios = require('axios')
const client = new Discord.Client()
const config = require('./config.js')
// const TwitchList = require('./twitchlist.js')
// const twitchList = TwitchList


//warframe items list
const wantedItems = [ "Orokin", "Alertium", "Forma", "Catbrow" ] //alertium = nitain, Catbrow = Kavat

//warframe alert id list 
let alertIds = []

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

        //get alert id
        const thisAlertId = alert._id.$oid

        //check unique alert list for existing id
        if (!(alertIds.indexOf(thisAlertId) > -1)){
          //add alert id to alerts array.  delete earliest id if array is 'full' at 10 numbers
          alertIds.push(thisAlertId)

          if(alertIds.length > 10){
            alertIds.shift()
          }

          //parse rewards
          const reward = alert.MissionInfo.missionReward

          //only do things if alert has any rewards
          if (reward.items || reward.countedItems){

            // parse individual alert info
            const mission = alert.MissionInfo.missionType.substring(3)
            const level = (alert.MissionInfo.minEnemyLevel + alert.MissionInfo.maxEnemyLevel) / 2
            const expireTime = alert.Expiry.$date.$numberLong
            const minutesLeft = Math.round((expireTime - Date.now()) / 60 / 1000 )

            //create arrays
            let itemArray = []
            let outputArray = []

            //read in "Items" contained in rewards (bp's, helmets)
            if (reward.items){
              reward.items.map(function(item){
                const thisItemName = item.substr(item.lastIndexOf("/")+1)
                itemArray.push(thisItemName)
              })
            }

            //read in "countedItems" contained in rewards (numbers of mats)
            if (reward.countedItems){
              reward.countedItems.map(function(item){
                const thisItemName = item.ItemType.substr(item.ItemType.lastIndexOf("/")+1) + "[" + item.ItemCount.toString() + "]"
                itemArray.push(thisItemName)
              })
            }

            //compare full list of this one alert's items against ones we want
            itemArray.map(function(alertItem){
              wantedItems.map(function(wantedItem){
                if(alertItem.includes(wantedItem)){
                  outputArray.push(alertItem)
                }
              })
            })

            //simply adds a message to the final output if it exists
            if (outputArray.length > 0){
              const rewardOutput = outputArray.join(", ")
              finalOutput += (mission + "[level " + level + "] - " + rewardOutput + " - " + minutesLeft + "m remaining\n")
            }

          }//end of things to do if reward items exist
        }//end of if alert ID is new
        else {
          console.log("neat")
        }


      }) //end of alerts.map
      console.log(alertIds)

      //check to see if anything was pushed to final output - if so, broadcast
      if (finalOutput.length > 0){
        channel.sendMessage(finalOutput)
      }

      // if not, then nothing important was found
      else {
        console.log("nothing important found")
      }
      
      //recursively call again
      warframePoller(channel)

    }) //end of axios
  }, 10 *1000*60)//delay, in minutes *math  //end of setTimeout
} //end of warframepoller


function isNormalInteger(str){
    var n = Math.floor(Number(str))
    return String(n) === str && n >= 0
}

function regex (string, separator) {
    return String(string).replace(/[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|+=-]/g, separator)
}

function roller(max){
  return Math.floor((Math.random() * max) + 1)
}

function rollFromZero(max){
  return Math.floor((Math.random() * max))
}

function dRoll(sides, dice){
  let rollsMsg = "Rolling " + dice + "d" + sides + " -> ";
  var rollsTotal = 0;
  for (var i=1 ; i <= dice ; i++){
    const thisRoll = roller(sides)
    rollsMsg += "[" + thisRoll + "]  "
    rollsTotal += thisRoll
    // console.log(rollsTotal)
  }
  return rollsMsg + "-> Total: " + rollsTotal.toString()
}

client.on('message', message => {
  //act only if slash command - saves processing of every message
  if (message.content.charAt(0) === '/'){

    var msgArray = message.content.split(" ")
    var firstWord = msgArray[0]

    if (firstWord === '/waifu'){
      message.channel.sendMessage(config.waifu)
    }

    if (firstWord === '/rng'){
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

    if (firstWord === '/d'){
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

    if (firstWord === '/img'){
      //parse search terms
      msgArray.shift()
      msgArray.join('-')
      const searchTerms = regex(msgArray, "+")

      //GET image from custom google search
      const findImg = axios({
        method: 'get',
        url: config.imgSearchUrl + searchTerms,
      })
      .then(function(response){
        const d = response.data
        if (!d.items){
          message.channel.sendMessage("I couldn't find that! D:")
        }
        else{
          const imgUrl = d.items[rollFromZero(d.items.length - 1)].link
          message.channel.sendMessage(imgUrl)
        }

      })
      .catch(function(response){
        console.log(response)
      })
    }

    if (firstWord === '/gif'){
      //parse search terms
      msgArray.shift()
      msgArray.join('-')
      const searchTerms = regex(msgArray, "-")

      //GET gif from gfycat
      const getGfyLink = axios({
        method: 'get',
        url: config.gfyGetUrl + searchTerms,
        headers: {
          "Authorization": "Bearer " + config.gfyKey,
        }
      })
      .then(function(response){
        const d = response.data

        if (!d.gfycats){
          message.channel.sendMessage("I couldn't find that! D:")
        }
        else{
          const gfyCatId = d.gfycats[rollFromZero(d.gfycats.length - 1)].gfyId
          message.channel.sendMessage(config.gfyUrl + gfyCatId)
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
            const d = response.data

            if (!d.gfycats){
              message.channel.sendMessage("I couldn't find that! D:")
            }
            else{
              const gfyCatId = d.gfycats[rollFromZero(d.gfycats.length - 1)].gfyId
              message.channel.sendMessage(config.gfyUrl + gfyCatId)
            }
          })
        })
      })
    }

    if (firstWord === '/lewd'){
      if (!msgArray[1]) {
        const searchTerms = ""

        const getLewds = axios({
          method: 'get',
          url: config.booruGetUrl + searchTerms,
        })
        .then(function(response){
          const d = response.data

          const booruId = d[rollFromZero(d.length - 1)].id
          message.channel.sendMessage(config.booruPostUrl + booruId)
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
          url: config.booruGetUrl + searchTerms,
        })
        .then(function(response){
          const d = response.data

          if (d.length == 0){
            message.channel.sendMessage("This tag doesn't exist D:a")
          }
          else{
            const booruId = d[rollFromZero(d.length - 1)].id
            message.channel.sendMessage(config.booruPostUrl + booruId)
          }
        })
      }
    }

  }

});

client.on('ready', () => {
  console.log('I am ready!')
  const warframeChannel = client.channels.get(config.warframeChannel)
  const frostfellChannel = client.channels.get(config.frostfellChannel)
  
  //have to pass channel to async caller
  warframePoller(warframeChannel)
});

const login = config.loginKey
client.login(login)