const con = require("../dbScripts/connect");
function CreateBot() {
    let CreateBotSql =
      "Insert into users (UserName,Email,Password) values('BOT','Bot@tracker.com','')";
    con.query(CreateBotSql)
}
module.exports = CreateBot;
