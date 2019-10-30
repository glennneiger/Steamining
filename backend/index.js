const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
var mysql = require('mysql');
var con = mysql.createConnection({
  multipleStatements: true,
  host:'localhost',
  user:'root',
  password:'UIuc7355608!!',
  database:'steamining_main'
});
const fetch = require('node-fetch')


/*
API_users_add_into_database:
@ CREATOR: Peilin Rao
@ DESCRIPTION: loads the user's information into our database
@ INPUT: user's steamid64
@ OUTPUT: none
@ SIDE EFFECT: add tuples in USER_GAME table
@ COMPONENTS:
    APIGetPlayerSummaries: call steam's GetPlayerSummaries API
    APIGetOwnedGames: call steam's GetOwnedGames API
    insert_to_user_game_table: construct SQL query and connect to our SQL.
*/
function APIGetPlayerSummaries(key,steamid) {
  return fetch("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key="+key+"&steamids="+steamid+"&format=json")
         .then(res => res.json());
}
function APIGetOwnedGames(key,steamid) {
  return fetch("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key="+key+"&steamid="+steamid+"&format=json") // Call the fetch function passing the url of the API as a parameter
  .then((resp) => resp.json())
}

function insert_to_users_table(responseOne, responseTwo){
  console.log("Sanity check:")
  console.log("Are we ok with GetPlayerSummaries?:",responseOne!=null);
  console.log("Are we ok with GetPlayerSummaries?:",responseTwo!=null);

  var sql = "";
  username = responseOne.response.players[0].personaname;
  steamId64 = responseOne.response.players[0].steamid;
  if(responseTwo.response.length == 0){
    throw new Error('The user have no game! We do not have to do anything for him');
  };
  for (var i = 0; i < responseTwo.response.games.length; i++){
    sql+= "INSERT INTO STEAMINING_MAIN.USERS(SteamId64, UserName, GameId, PlayTime) values (\""+steamId64+"\",\""+username+"\","+responseTwo.response.games[i].appid+","+responseTwo.response.games[i].playtime_forever+");"
  }

  console.log(sql);
  con.connect(function(err) {
    if (err) throw err;
    console.log("Trying to add a new user into our database.");
    con.query(sql, function (err, result) { if (err) throw err; console.log("Successfully added");});
  });

}

function API_users_add_into_database(steamid){
  key = "AA7FA6275849EC957DF95C8DE0945CB7";
  APIGetOwnedGames(key,steamid)
  .then(responseTwo => {
      APIGetPlayerSummaries(key,steamid)
      .then(responseOne => {
        insert_to_users_table(responseOne, responseTwo);
      });
  });
}





app.get('/',(req,res)=>{
  res.send('hello from the backend');
});

app.get('/add_into_database',(req,res)=>{
  const{ steamid } = req.query;
  API_users_add_into_database(steamid);
  res.send("You are added!");
})

app.listen(4000,()=>{
  console.log('backend listening on 4000');
})
