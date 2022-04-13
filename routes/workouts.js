const router = require("express").Router();
const con = require("../dbScripts/connect");
const verifyToken = require("../authScripts/verifyToken");
const jwt = require("jsonwebtoken");
const getWorkout = require("../WorkoutFunctions/getWorkout");
const deleteWorkout = require("../WorkoutFunctions/DeleteWorkout");
const addWorkout = require("../WorkoutFunctions/AddWorkout");
const SECRET_KEY = process.env.SECRET_KEY;
router.route("/:id").get(verifyToken, getWorkout);
router.route("/:id/basic").get(verifyToken, (req, res) => {
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  if (!user) return;
  const WorkoutSql =
    "Select w.WorkoutId,w.UserId,Title,WorkoutDate,public,count(c.CommentId) as unseen " +
    "from Workouts w " +
    "left join comments c on(c.WorkoutId=w.workoutid and c.PostDate>w.userentered and c.CommentorId!=w.userid)" +
    "where w.workoutid=?";
  con.query(WorkoutSql, [req.params.id], function (err, result) {
    if (err) {
      res.sendStatus(500);
      console.error(err);
    } else if (result[0].UserId != user.UserID) res.sendStatus(403);
    else res.json(result[0]);
  });
});
router.route("/add").post(verifyToken, addWorkout);

router.route("/:id").delete(verifyToken, deleteWorkout);

router.route("/:id/changeState/:public").patch(verifyToken, (req, res) => {
  const public = req.params.public;
  if ((public != 0) & (public != 1)) return res.sendStatus(400);
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  const UserId = user.UserID;
  const WorkoutId = req.params.id;
  if (!user) return;
  const getWorkoutSql = "Select UserId From Workouts Where WorkoutId=?";
  const UpdateWorkoutSql = "Update Workouts Set public=? Where WorkoutId=?";
  con.query(getWorkoutSql, [WorkoutId], function (err, result) {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else if (result.length == 0) res.sendStatus(400);
    else if (result[0].UserId != UserId) res.status(403).send("Forbidden");
    else if (result.length == 0) res.sendStatus(400);
    else {
      con.query(UpdateWorkoutSql, [public, WorkoutId], (err) => {
        if (err) {
          console.error(err);
          res.sendStatus(500);
        } else res.send("Status Changed");
      });
    }
  });
});
module.exports = router;
