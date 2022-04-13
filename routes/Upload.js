const multer = require("multer");
const verifyToken = require("../authScripts/verifyToken");
const router = require("express").Router();
const con = require("../dbScripts/connect");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const verifyUserAuth = require("../authScripts/verifyUserAuth");
const SECRET_KEY = process.env.SECRET_KEY;
const options = {
  root: path.join(__dirname, "../"),
};
const SetStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./upload/videos/workouts/${req.params.WorkoutId}`);
  },
  filename: function (req, file, cb) {
    if (!file.mimetype.startsWith("video")) cb("error");
    else cb(null, req.params.set + ".mp4");
  },
});
const upload = multer({ storage: SetStorage }).single("video");
router.route("/");
router.route("/:WorkoutId/:set").post(verifyToken, (req, res) => {
  let UserId;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    UserId = authData.user.UserID;
  });
  if (!UserId) return;
  const mode = req.query.mode;
  const WorkoutId = req.params.WorkoutId;
  let SetNum = Number(req.params.set);
  if (!Number.isInteger(SetNum) || SetNum < 0) {
    return res.sendStatus(400);
  }
  const CheckSetSql =
    "SELECT s.SetId,w.UserId FROM sets s " +
    "join exercisessets e using (exersetid) " +
    "join workouts w using(WorkoutId) " +
    "where w.WorkoutId=? " +
    "limit 1 offset ?";
  const UpdateSetSql = "update sets set VideoExist=? where setid=?";
  con.query(CheckSetSql, [WorkoutId, SetNum], function (err, result) {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else if (result.length == 0) res.sendStatus(400);
    else if (result[0].UserId != UserId) res.sendStatus(403);
    else if (mode == "example") {
      const WorkoutDir = `upload/videos/workouts/${WorkoutId}`;
      const PreviousFile = `${WorkoutDir}/${SetNum}.mp4`;
      if (fs.existsSync(PreviousFile, options)) {
        fs.rmSync(PreviousFile, options);
        let files = fs.readdirSync(WorkoutDir, options);
        if (!files.length) fs.rmdirSync(WorkoutDir, options);
      }
      con.query(UpdateSetSql, [-1, result[0].SetId], function (err) {
        if (err) {
          console.error(err);
          res.sendStatus(500);
        } else res.sendStatus(200);
      });
    } else {
      const dir = `upload/videos/workouts/${WorkoutId}`;
      if (!fs.existsSync(dir, options)) fs.mkdirSync(dir, options);

      upload(req, res, (err) => {
        if (err) res.sendStatus(400);
        else {
          con.query(UpdateSetSql, [1, result[0].SetId], function (err) {
            if (err) {
              console.error(err);
              res.sendStatus(500);
            } else res.sendStatus(200);
          });
        }
      });
    }
  });
});
router.route("/:WorkoutId/:set/video.mp4").get((req, res) => {
  const CheckSetSql =
    "SELECT w.UserId,w.public,s.VideoExist FROM sets s " +
    "join exercisessets e using (exersetid) " +
    "join workouts w using(WorkoutId) " +
    "where w.WorkoutId=? " +
    "limit 1 offset ?";
  let UserId;
  jwt.verify(req.query.token, SECRET_KEY, (err, authData) => {
    if (err) {
      return res.sendStatus(401);
    }
    UserId = authData.user.UserID;
  });
  if (!UserId) return;
  const WorkoutId = req.params.WorkoutId;
  let SetNum = Number(req.params.set);
  if (!Number.isInteger(SetNum) || SetNum < 0) {
    return res.sendStatus(400);
  }
  con.query(CheckSetSql, [WorkoutId, SetNum], function (err, result) {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else if (result.length == 0) res.sendStatus(404);
    else {
      if (!result[0].VideoExist) res.sendStatus(404);
      if (result[0].VideoExist == -1) {
        const ExampleVideo = "upload/videos/workouts/example.mp4";
        if (fs.existsSync(ExampleVideo, options)) {
          res.sendFile(ExampleVideo, options);
        } else res.sendStatus(404);
      } else {
        verifyUserAuth(UserId, result[0].UserId, result[0].public).then(
          (isAuth) => {
            if (!isAuth) return res.sendStatus(403);
            const Video = `upload/videos/workouts/${WorkoutId}/${SetNum}.mp4`;
            if (fs.existsSync(Video, options)) {
              res.sendFile(Video, options);
            } else res.sendStatus(404);
          }
        );
      }
    }
  });
});
module.exports = router;
