/*
  users_table.js
  @ CREATOR: Peilin Rao
  @ DESCRIPTION: contains all the APIs related to users_table
  @ COMPONENTS:
  @ NOTE: create associated sql table using:
    CREATE TABLE STEAMINING_MAIN.USERS(
    SteamId64 VARCHAR(17) NOT NULL,
    UserName VARCHAR(100) NOT NULL,
    GameId INT,
    PlayTime INT,
    PRIMARY KEY(SteamId64, GameId)
    );
*/

module.exports = {
  /*
  API_users_add:
  @ CREATOR: Peilin Rao
  @ DESCRIPTION: loads the user's information into our database
  @ INPUT: user's steamid64
  @ OUTPUT: none
  @ EFFECT: add tuples in USER_GAME table
  @ COMPONENTS:
      APIGetPlayerSummaries: call steam's GetPlayerSummaries API
      APIGetOwnedGames: call steam's GetOwnedGames API
      insert_to_user_game_table: construct SQL query and connect to our SQL.
  */
  API_users_add: function (steamid){
    var mysql = require('mysql');
    var con = mysql.createConnection({
      multipleStatements: true,
      host:'localhost',
      user:'root',
      password:'UIuc7355608!!',
      database:'STEAMINING'
    });
    const fetch = require('node-fetch')
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
      var antiinjection = []
      username = responseOne.response.players[0].personaname;
      steamId64 = responseOne.response.players[0].steamid;
      avatar = responseOne.response.players[0].avatarfull;
      if(responseTwo.response.length == 0){
        throw new Error('The user have no game! We do not have to do anything for him');
      };
      for (var i = 0; i < responseTwo.response.games.length; i++){
        antiinjection.push(steamId64);
        antiinjection.push(responseTwo.response.games[i].appid);
        antiinjection.push(responseTwo.response.games[i].playtime_forever);
        antiinjection.push(responseTwo.response.games[i].playtime_forever);
        sql+= "INSERT IGNORE INTO STEAMINING.USERS(SteamId64, GameId, PlayTime) values (?,?,?) ON DUPLICATE KEY UPDATE PlayTime = ?;"
      }
      antiinjection.push(steamId64);
      antiinjection.push(username);
      antiinjection.push(avatar);
      antiinjection.push(avatar);
      sql += "INSERT IGNORE INTO STEAMINING.INFO(SteamId64, UserName, Avatar) values (?,?,?) ON DUPLICATE KEY UPDATE avatar = ?;"
      console.log(sql);
      con.connect(function(err) {
        if (err) throw err;
        console.log("Trying to add a new user into our database.");
        con.query(sql, antiinjection, function (err, result) { if (err) throw err; console.log("Successfully added");});
      });

    }
    key = "AA7FA6275849EC957DF95C8DE0945CB7";
    APIGetOwnedGames(key,steamid)
    .then(responseTwo => {
        APIGetPlayerSummaries(key,steamid)
        .then(responseOne => {
          insert_to_users_table(responseOne, responseTwo);
        });
    });
  },

  /*
  API_users_delete:
  @ CREATOR: Peilin Rao
  @ DESCRIPTION: delete the user's information into our database
  @ INPUT: user's steamid64
  @ OUTPUT: none
  @ EFFECT: delete tuples in USER_GAME table
  @ COMPONENTS:
  */
  API_users_delete: function (steamid){
    var mysql = require('mysql');
    var con = mysql.createConnection({
      multipleStatements: true,
      host:'localhost',
      user:'root',
      password:'UIuc7355608!!',
      database:'STEAMINING'
    });

    sql = "DELETE FROM STEAMINING.USERS WHERE SteamId64 = \""+ steamid +"\";"

    con.connect(function(err) {
      if (err) throw err;
      console.log("Trying to remove a  user into our database.");
      con.query(sql, function (err, result) { if (err) throw err; console.log("Successfully removed");});
    });
  }
};
