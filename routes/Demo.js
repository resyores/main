const router = require("express").Router();
const con = require("../dbScripts/connect");
const jwt = require("jsonwebtoken");
const makeid = require("../utils/generator");
const SECRET_KEY = process.env.SECRET_KEY;
const getBotId = require("../utils/GetBotId");
const verifyToken = require("../authScripts/verifyToken");
const { verifyFriend } = require("../authScripts/verifyFriend");
const {
  getChatRoom,
  sendChatMessage,
  getWorkoutRoom,
  sendWorkoutMessage,
} = require("../socketScripts/MainSocket");
const MarkSeen = require("../utils/MarkSeen");
router.route("/Start").post((req, res) => {
  const username = "DemoUser-" + makeid(4);
  const email = makeid(5) + "@tracker.com";
  const password = "";
  const InsertSql = "Insert Into Users (UserName,Email,Password)  Values (?)";
  const BefriendBotSql = "Insert into friendships values(?)";
  con.query(InsertSql, [[username, email, password]], function (err, result) {
    if (err) {
      res.sendStatus(500);
      console.error(err);
    } else {
      const user = {
        username,
        email,
        UserID: result.insertId,
      };
      jwt.sign({ user }, SECRET_KEY, (err, token) => {
        if (err) {
          console.error(err);
          res.sendStatus(500);
        } else {
          getBotId()
            .then((BotId) => {
              con.query(BefriendBotSql, [[BotId, user.UserID]], function (err) {
                if (err) {
                  console.error(err);
                  res.sendStatus(500);
                } else res.json({ isAuth: true, token, user });
              });
            })
            .catch((err) => {
              console.error(err);
              res.sendStatus(500);
            });
        }
      });
    }
  });
});
router.route("/SendMessage").post(verifyToken, (req, res) => {
  const messageSql =
    "insert into messages (senderid,reciverid,content) values(?)";
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);

    user = authData.user;
  });
  if (!user) return;
  getBotId()
    .then((BotId) => {
      verifyFriend(user.UserID, BotId)
        .then((isFriend) => {
          if (!isFriend) return res.sendStatus(403);
          const content = "hi this is a message from a bot";
          con.query(
            messageSql,
            [[BotId, user.UserID, content]],
            function (err) {
              if (err) {
                console.error(err);
                res.sendStatus(500);
              } else {
                res.sendStatus(201);
                const room = getChatRoom(Number(BotId), Number(user.UserID));
                if (room) room.sendMessage(user.UserID, content, "BOT");
                else
                  sendChatMessage(
                    user.UserID,
                    { UserID: BotId, username: "BOT" },
                    content
                  );
              }
            }
          );
        })
        .catch((err) => {
          console.error(err);
          res.sendStatus(500);
        });
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});
router.route("/Comment").post(verifyToken, (req, res) => {
  const CommentSql =
    "insert into comments (commentorid,workoutid,content,PostDate) values(?)";
  const WorkoutSql =
    "Select WorkoutId from workouts where userid=? order by workoutdate desc limit 1";
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);

    user = authData.user;
  });
  if (!user) return;
  con.query(WorkoutSql, [user.UserID], function (err, result) {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else if (result.length == 0) res.sendStatus(400);
    else {
      const WorkoutId = result[0].WorkoutId;
      getBotId().then((BotId) => {
        const content = "This is a comment commented by a bot";
        con.query(
          CommentSql,
          [[BotId, WorkoutId, content, new Date()]],
          function (err) {
            if (err) {
              console.error(err);
              return res.sendStatus(500);
            }
            res.sendStatus(201);
            const room = getWorkoutRoom(String(WorkoutId));
            const bot = { username: "BOT", UserID: BotId };
            if (room) {
              room.sendMessage(content, bot, room.creator);
              if (Object.values(room.users).includes(room.creator))
                MarkSeen(WorkoutId);
            } else sendWorkoutMessage(user.UserID, WorkoutId, bot, content);
          }
        );
      });
    }
  });
});
module.exports = router;
