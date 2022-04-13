const con = require("../dbScripts/connect");
function getBotId() {
  return new Promise((resolve, reject) => {
    let FindBotSql = "Select UserId from users where username='BOT'";

    con.query(FindBotSql, [], function (err, result) {
      if (err) reject(err);
      else if (result.length == 0) reject("No Bot");
      else resolve(result[0].UserId);
    });
  });
}
module.exports = getBotId;
