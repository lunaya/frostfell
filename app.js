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
let broadcastedIds = []

//poll warframe API every 10 minutes
function warframePoller(channel){
  setTimeout(function(){

    //get the info
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

        //check unique alert list for existing id, skip if it exists
        if (!(alertIds.indexOf(thisAlertId) > -1)){
          if (!(broadcastedIds.indexOf(thisAlertId) > -1)){

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

          }//end of if alert was broadcasted before         
        }//end of if alert ID is new
        else {
          console.log("neat")
        }


      }) //end of alerts.map
      console.log(alertIds)

      //check to see if anything was pushed to final output - if so, broadcast
      if (finalOutput.length > 0){
        //if we're broadcasting something, add the id to the list and shore the length
        broadcastedIds.push(thisAlertId)
        if(broadcastedIds.length > 30){
          broadcastedIds.shift()
        }
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

//integer checker
function isNormalInteger(str){
    var n = Math.floor(Number(str))
    return String(n) === str && n >= 0
}

//removes punctuation from input and separates with what's given
function regex (string, separator) {
    return String(string).replace(/[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|+=-]/g, separator)
}

//roll 1 to x
function roller(max){
  return Math.floor((Math.random() * max) + 1)
}

//roll 0 to x
function rollFromZero(max){
  return Math.floor((Math.random() * max))
}

//takes in number of dice and how many sides per each, adds them up and gives them back
function dRoll(sides, dice){
  let rollsMsg = "Rolling " + dice + "d" + sides + " -> ";
  var rollsTotal = 0;
  for (var i=1 ; i <= dice ; i++){
    const thisRoll = roller(sides)
    rollsMsg += "[" + thisRoll + "]  "
    rollsTotal += thisRoll
  }
  return rollsMsg + "-> Total: " + rollsTotal.toString()
}
 
/////////////////////
//BOT CHAT COMMANDS//
/////////////////////
client.on('message', message => {
  //act only if slash command - saves processing of every message
  if (message.content.charAt(0) === '/'){

    var msgArray = message.content.split(" ")
    var firstWord = msgArray[0]

    //your waifu is shit
    if (firstWord === '/waifu'){
      message.channel.sendMessage(config.waifu)
    }

    if (firstWorld === '/win'){
      message.channel.sendMessage(config.win)
    }

    //random number from 1-100
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

    //default 1 20-sided die, can specify # of sides and # of dice.  ex /d 50 4   will roll 4x 50-sided dice, or 4d50
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

    //img search that includes imgur, google photos and photobucket.  custom google search api.
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

        //if no results
        if (!d.items){
          message.channel.sendMessage("I couldn't find that! D:")
        }
        //pick a random result
        else{
          const imgUrl = d.items[rollFromZero(d.items.length - 1)].link
          message.channel.sendMessage(imgUrl)
        }

      })
      .catch(function(response){
        console.log(response)
      })
    }

    //finds a gif from gfycat API
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

        //if no results
        if (!d.gfycats){
          message.channel.sendMessage("I couldn't find that! D:")
        }
        //pick a random result
        else{
          const gfyCatId = d.gfycats[rollFromZero(d.gfycats.length - 1)].gfyId
          message.channel.sendMessage(config.gfyUrl + gfyCatId)
        }
      })
      .catch(function(response){
      //if the first call fails, it's most likely because the API token which lasts 4 hours is out of date
      //so, with the catch function we should instead send a call for a new API token
      //and subsequently re-send the initial gif request

        const getKey = axios({
          method: 'post',
          url: config.gfyAuthUrl,
          data: {
            "grant_type": "client_credentials",
            "client_id": config.gfyClientId,
            "client_secret": config.gfyClientSecret
          }
        })
        //upon receiving the new API token, we'll write it to the config file and proceed with /gif search
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
          //finally, we search the original /gif command again
          .then(function(response){
            const d = response.data

            //if no results
            if (!d.gfycats){
              message.channel.sendMessage("I couldn't find that! D:")
            }
            //pick a random result
            else{
              const gfyCatId = d.gfycats[rollFromZero(d.gfycats.length - 1)].gfyId
              message.channel.sendMessage(config.gfyUrl + gfyCatId)
            }
          })
        })
      })
    }

    //danbooru search API.  can take up to two search terms.
    //punctuation is allowed here for booru-esque search terms i.e. fate_(series)
    if (firstWord === '/lewd'){
      if (!msgArray[1]) {
        const searchTerms = ""

        //default from a blank /lewd is to simply pick a random image from all of danbooru
        const getLewds = axios({
          method: 'get',
          url: config.booruGetUrl + searchTerms,
        })
        .then(function(response){
          const d = response.data

          //pick a random result
          const booruId = d[rollFromZero(d.length - 1)].id
          message.channel.sendMessage(config.booruPostUrl + booruId)
        })
        .catch(function(response){
          console.log(response)
        })
      }
      else {
        //if there are search terms, we'll use those instead
        msgArray.shift()
        const searchTerms = msgArray.join('+')

        console.log(searchTerms)
        
        const getLewds = axios({
          method: 'get',
          url: config.booruGetUrl + searchTerms,
        })
        .then(function(response){
          const d = response.data

          //if no results
          if (d.length == 0){
            message.channel.sendMessage("This tag doesn't exist D:a")
          }
          //pick random result
          else{
            const booruId = d[rollFromZero(d.length - 1)].id
            message.channel.sendMessage(config.booruPostUrl + booruId)
          }
        })
      }
    }
  }

});

//initialization and channel definitions
client.on('ready', () => {
  console.log('I am ready!')
  const warframeChannel = client.channels.get(config.warframeChannel)
  const frostfellChannel = client.channels.get(config.frostfellChannel)
  
  //have to pass channel to async caller
  warframePoller(warframeChannel)
});

//client key and start
const login = config.loginKey
client.login(login)