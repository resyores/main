const con = require("../dbScripts/connect");
const jwt = require("jsonwebtoken");
const verifyUserAuth = require("../authScripts/verifyUserAuth");
const MarkSeen = require("../utils/MarkSeen");
const SECRET_KEY = process.env.SECRET_KEY;
function getWorkout(req, res) {
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  if (!user) return;
  const workoutID = req.params.id;
  if (!workoutID) return res.sendStatus(400);
  const tokenUserId = user.UserID;
  const WorkoutSql =
    "Select u.UserId,u.UserName,public,WorkoutDate,title From Workouts join users u using(UserId) Where WorkoutId=?";
  const ExerSetSql =
    "SELECT ExerSetId,ExerciseName,exercises.ExerciseId FROM exercisessets " +
    "join exercises using(ExerciseId) where WorkoutId=?";
  const SetsSql = "SELECT * FROM sets where ExerSetId in (?)";
  const UserSql = "Select UserName from Users Where UserId=?";

  let public, title, userId, date, userName;
  const workoutPromise = new Promise((resolve) => {
    con.query(WorkoutSql, [workoutID], (err, result) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      if (result.length == 0) return res.sendStatus(400);
      public = result[0].public;
      userName = result[0].UserName;
      title = result[0].title;
      userId = result[0].UserId;
      date = result[0].WorkoutDate;
      resolve();
    });
  });

  workoutPromise.then(() => {
    if (userId == tokenUserId) {
      MarkSeen(workoutID).catch((e) => {
        console.error(e);
      });
    }
    verifyUserAuth(tokenUserId, userId, public)
      .then(() => {
        con.query(ExerSetSql, [workoutID], function (err, result) {
          if (err) {
            console.error(err);
            return res.sendStatus(500);
          }
          con.query(
            SetsSql,
            [
              result.map((exerSet) => {
                return exerSet.ExerSetId;
              }),
            ],
            function (err, result2) {
              if (err) {
                console.error(err);
                return res.sendStatus(500);
              }
              let exerSets = result.map((exerSet) => {
                return {
                  exercise: {
                    exercisename: exerSet.ExerciseName,
                    exerciseid: exerSet.ExerciseId,
                  },
                  sets: result2
                    .filter((set) => set.ExerSetId == exerSet.ExerSetId)
                    .map((set) => {
                      return {
                        reps: set.Reps,
                        weight: set.Weight,
                        videoexist: set.VideoExist,
                      };
                    }),
                };
              });
              res.json({
                username: userName,
                public,
                date,
                title,
                exersets: exerSets,
              });
            }
          );
        });
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(500);
      });
  });
}
module.exports = getWorkout;
