const router = require("express").Router();
const con = require("../dbScripts/connect");
const verifyToken = require("../authScripts/verifyToken");
const verifyUserAuth = require("../authScripts/verifyUserAuth");
const checkIfInvite = require("../authScripts/verifyFriend").checkIfInvite;
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const WorkoutsPerPage = 5;
const whitelist = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload/profiles");
  },
  filename: function (req, file, cb) {
    if (!whitelist.includes(file.mimetype)) cb("error");
    else cb(null, req.UserID + ".jpg");
  },
});
const upload = multer({ storage }).single("ProfilePicture");
const SECRET_KEY = process.env.SECRET_KEY;
router.route("/:id/workouts").get(verifyToken, (req, res) => {
  let query;
  if (req.query.q == null) query = "%%";
  else query = `%${req.query.q}%`;
  let page = Number(req.query.page || 1);
  if (!Number.isInteger(page) || page < 1) {
    res.sendStatus(400);
    return;
  }
  page--;
  const OwnerWorkoutSql =
    "Select w.WorkoutId,Title,WorkoutDate,public,count(c.CommentId) as unseen " +
    "from Workouts w " +
    "left join comments c on(c.WorkoutId=w.workoutid and c.PostDate>w.userentered and c.CommentorId!=w.userid) " +
    "where UserId=? and Title Like ? " +
    "group by workoutid " +
    "order by unseen desc ,WorkoutDate desc limit ? offset ? ";
  const FriendworkoutSql =
    "Select WorkoutId,Title,WorkoutDate,public from Workouts where UserId=? and public and Title Like ? order by WorkoutDate desc limit ? offset ?";
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  if (!user) return;
  let UserID = user.UserID;
  let FriendId = req.params.id;
  const workoutSql = UserID == FriendId ? OwnerWorkoutSql : FriendworkoutSql;
  verifyUserAuth(UserID, FriendId)
    .then((isAuth) => {
      if (isAuth) {
        con.query(
          workoutSql,
          [FriendId, query, WorkoutsPerPage, page * WorkoutsPerPage],
          function (err, result) {
            if (err) {
              console.error(err);
              return res.sendStatus(500);
            }
            res.json(result);
          }
        );
      } else res.json([]);
    })
    .catch((err) => {
      res.sendStatus(500);
      console.error(err);
    });
});
router.route("/:id/userdata").get(verifyToken, (req, res) => {
  let FriendSql = "Select UserName,Email from users where UserId=?";
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  if (!user) return;
  let UserID = user.UserID;
  let FriendId = req.params.id;
  verifyUserAuth(UserID, FriendId)
    .then((isAuth) => {
      const FriendPromise = new Promise((resolve) => {
        con.query(FriendSql, [FriendId], function (err, result) {
          if (err) {
            console.error(err);
            return res.sendStatus(500);
          }
          resolve(result);
        });
      });
      FriendPromise.then((result) => {
        if (isAuth) {
          res.json({
            isauth: true,
            userdata: result[0],
          });
        } else {
          checkIfInvite(UserID, FriendId)
            .then((isInvited) =>
              res.json({
                isauth: false,
                userdata: result[0],
                invited: isInvited,
              })
            )
            .catch((err) => {
              console.error(err);
              res.sendStatus(500);
            });
        }
      });
    })
    .catch((err) => {
      res.sendStatus(500);
      console.error(err);
    });
});
router.route("/addPicture").post(verifyToken, (req, res) => {
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    req.UserID = authData.user.UserID;
    upload(req, res, (err) => {
      if (err) res.sendStatus(400);
      else res.sendStatus(200);
    });
  });
});
router.route("/:id/profile").get((req, res) => {
  const options = {
    root: path.join(__dirname, "../"),
  };
  if (fs.existsSync("upload/profiles/" + req.params.id + ".jpg", options)) {
    res.sendFile("upload/profiles/" + req.params.id + ".jpg", options);
  } else res.sendStatus(404);
});
router.route("/userdata").get(verifyToken, (req, res) => {
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    res.json(authData.user);
  });
});
module.exports = router;
