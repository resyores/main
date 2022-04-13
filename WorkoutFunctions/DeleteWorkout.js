const con = require("../dbScripts/connect");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const SECRET_KEY = process.env.SECRET_KEY;
const options = {
  root: path.join(__dirname, ".."),
};
function deleteWorkout(req, res) {
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);

    user = authData.user;
  });
  if (!user) return;
  const UserId = user.UserID;
  const WorkoutId = req.params.id;
  if (!WorkoutId) return res.sendStatus(400);
  const getWorkoutSql = "Select UserId From Workouts Where WorkoutId=?";
  const deleteWorkoutSql = "Delete From Workouts where WorkoutId=?";
  const getExerSetsSql =
    "Select ExerSetId From exercisessets where WorkoutId=?";
  const deleteExerSetsSql = "Delete From exercisessets where WorkoutId=?";
  const deleteSetSql = "Delete From Sets where ExerSetId in (?)";
  const DeleteComments = "Delete from Comments where WorkoutId=?";
  const gWorkPromise = new Promise((resolve) => {
    con.query(getWorkoutSql, [WorkoutId], function (err, result) {
      if (err) {
        console.error(err);
        res.sendStatus(500);
      } else if (result[0].UserId != UserId) res.status(403).send("Forbidden");
      else if (result.length == 0) res.sendStatus(400);
      else resolve();
    });
  });

  gWorkPromise.then(() => {
    con.query(deleteWorkoutSql, [WorkoutId], (err) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      const ExerSetPromise = new Promise((resolve) => {
        con.query(getExerSetsSql, [WorkoutId], (err, result) => {
          if (err) {
            console.error(err);
            res.sendStatus(500);
          } else {
            const ids = result.map((exerSet) => {
              return exerSet.ExerSetId;
            });
            con.query(deleteSetSql, [ids], (herr) => {
              if (err) console.error(err);
            });

            resolve();
          }
        });
      });
      ExerSetPromise.then(() => {
        con.query(deleteExerSetsSql, [WorkoutId], (err) => {
          if (err) {
            console.error(err);
            return res.sendStatus(500);
          }
          con.query(DeleteComments, [WorkoutId], (err) => {
            if (err) {
              console.error(err);
              return res.sendStatus(500);
            }
            const dir = `upload/videos/workouts/${WorkoutId}`;
            if (fs.existsSync(dir, options)) {
              fs.rmdirSync(dir, { ...options, recursive: true });
            }
            res.send("Workout Deleted");
          });
        });
      });
    });
  });
}
module.exports = deleteWorkout;
