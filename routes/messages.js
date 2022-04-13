const router = require("express").Router();
const verifyToken = require("../authScripts/verifyToken");
const con = require("../dbScripts/connect");
const jwt = require("jsonwebtoken");
const { verifyFriend } = require("../authScripts/verifyFriend");
const { getChatRoom, sendChatMessage } = require("../socketScripts/MainSocket");
const SECRET_KEY = process.env.SECRET_KEY;
const messagesPerPage = 15;
router.route("/:id").get(verifyToken, (req, res) => {
  const messageSql =
    "Select content,senderid from messages where (senderid=? and reciverid=?) or (reciverid=? and senderid=?) order by messageid desc limit ? offset ? ";
  let user;
  let page = Number(req.query.page || 1);
  if (!Number.isInteger(page) || page < 1) {
    res.sendStatus(400);
    return;
  }
  page--;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  if (!user) return;
  const FriendId = req.params.id;
  const UserId = user.UserID;
  verifyFriend(FriendId, UserId)
    .then((isFriend) => {
      if (!isFriend) return res.sendStatus(403);
      con.query(
        messageSql,
        [
          FriendId,
          UserId,
          FriendId,
          UserId,
          messagesPerPage,
          page * messagesPerPage,
        ],
        function (err, result) {
          if (err) {
            console.error(err);
            res.sendStatus(500);
          } else res.json(result);
        }
      );
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});
router.route("/send/:id").post(verifyToken, (req, res) => {
  const content = req.body.content;
  const messageSql =
    "insert into messages (senderid,reciverid,content) values(?)";
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  if (!user) return;
  if (!content) res.sendStatus(400);
  const FriendId = req.params.id;
  const UserId = user.UserID;
  verifyFriend(FriendId, UserId)
    .then((isFriend) => {
      if (!isFriend) return res.sendStatus(403);
      con.query(messageSql, [[UserId, FriendId, content]], function (err) {
        if (err) {
          console.error(err);
          res.sendStatus(500);
        } else {
          res.sendStatus(201);
          const room = getChatRoom(Number(FriendId), Number(UserId));
          if (room) room.sendMessage(FriendId, content, user.username);
          else sendChatMessage(FriendId, user, content);
        }
      });
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});
module.exports = router;
