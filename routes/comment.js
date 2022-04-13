const router = require("express").Router();
const con = require("../dbScripts/connect");
const verifyToken = require("../authScripts/verifyToken");
const verifyUserAuth = require("../authScripts/verifyUserAuth");
const jwt = require("jsonwebtoken");
const {
  sendWorkoutMessage,
  getWorkoutRoom,
} = require("../socketScripts/MainSocket");
const MarkSeen = require("../utils/MarkSeen");
const CommentsPerPage = 10;
const SECRET_KEY = process.env.SECRET_KEY;
router.route("/:WorkoutId").post(verifyToken, (req, res) => {
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);

    user = authData.user;
  });
  if (!user) return;
  const tokenUserId = user.UserID;
  const Content = req.body.content;
  const WorkoutId = req.params.WorkoutId;
  if (!Content || !WorkoutId) return res.sendStatus(400);
  const commentSql =
    "Insert into comments (CommentorId,WorkoutId,content,postdate) Values (?) ";
  const workoutPromise = new Promise((resolve) => {
    const WorkoutSql = "Select UserId,public From Workouts Where WorkoutId=?";
    con.query(WorkoutSql, [WorkoutId], (err, result) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      if (result.length == 0) return res.sendStatus(400);
      resolve(result[0].UserId, result[0].public);
    });
  });

  workoutPromise.then((userId, public) => {
    verifyUserAuth(userId, tokenUserId, public)
      .then((isAuth) => {
        if (!isAuth) return res.sendStatus(403);
        con.query(
          commentSql,
          [[tokenUserId, WorkoutId, Content, new Date()]],
          (err) => {
            if (err) {
              console.error(err);
              return res.sendStatus(500);
            }
            if (userId == tokenUserId) {
              MarkSeen(WorkoutId).catch((e) => console.error(e));
            }
            res.sendStatus(201);
            const room = getWorkoutRoom(String(WorkoutId));
            if (room) {
              room.sendMessage(Content, user, room.creator);
              if (Object.values(room.users).includes(room.creator))
                MarkSeen(WorkoutId);
            } else sendWorkoutMessage(userId, WorkoutId, user, Content);
          }
        );
      })
      .catch((err) => {
        res.sendStatus(500);
        console.error(err);
      });
  });
});
router.route("/:WorkoutId").get(verifyToken, (req, res) => {
  const CommentSql =
    "SELECT CommentId,Content,UserId,UserName,PostDate FROM Comments c join users u " +
    "on u.UserId=c.CommentorId where c.WorkoutId=? order by CommentId desc limit ? offset ?";
  const WorkoutSql = "Select UserId,public From Workouts  Where WorkoutId=?";
  let page = Number(req.query.page || 1);
  if (!Number.isInteger(page) || page < 1) {
    res.sendStatus(400);
    return;
  }
  page--;
  const WorkoutId = req.params.WorkoutId;
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);

    user = authData.user;
  });
  if (!user) return;
  con.query(WorkoutSql, [WorkoutId], function (err, result) {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else if (result.length == 0) res.sendStatus(400);
    else {
      verifyUserAuth(result[0].UserId, user.UserID, result[0].public)
        .then((isAuth) => {
          if (!isAuth) return res.sendStatus(403);
          con.query(
            CommentSql,
            [WorkoutId, CommentsPerPage, page * CommentsPerPage],
            function (err, result) {
              if (err) {
                console.error(err);
                return res.sendStatus(500);
              }
              res.json(result);
            }
          );
        })
        .catch((err) => {
          console.error(err);
          res.sendStatus(500);
        });
    }
  });
});
module.exports = router;
