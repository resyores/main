const con = require("../dbScripts/connect");
function verifyFriend(userid, friendid) {
  return new Promise((resolve, reject) => {
    const friendSql =
      "Select 1 from friendships where (Friend1Id=? and Friend2Id=?)or(Friend2Id=? and Friend1Id=?)";
    con.query(
      friendSql,
      [userid, friendid, userid, friendid],
      function (err, result) {
        if (err) {
          console.error(err);
          reject(err);
        }
        resolve(result.length > 0);
      }
    );
  });
}
function checkIfInvite(user1Id, user2Id) {
  return new Promise((resolve, reject) => {
    const friendSql =
      "Select 1 from invites where (InviterId=? and InvitedId=?) or(InvitedId=? and InviterId=?)";
    con.query(
      friendSql,
      [user1Id, user2Id, user1Id, user2Id],
      function (err, result) {
        if (err) {
          console.error(err);
          reject(err);
        }
        resolve(result.length);
      }
    );
  });
}
module.exports = { verifyFriend, checkIfInvite };
