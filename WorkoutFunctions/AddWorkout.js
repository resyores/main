const con = require("../dbScripts/connect");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const INCREMENT = 10;
function addWorkout(req, res) {
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);

    user = authData.user;
  });
  if (!user) return;
  const UserId = user.UserID;
  let public = req.body.public;
  let title = req.body.title;
  if (public === undefined) public = false;
  if (!title) return res.sendStatus(400);
  const exerSets = req.body.exersets;
  let exerciseSql = "Select ExerciseId from exercises";
  let workoutSql =
    "Insert Into Workouts (UserId,public,WorkoutDate,title,userentered)  Values (?)";
  let exerSetsSql = "Insert Into exercisessets (WorkoutId,ExerciseId) values ?";
  let SetSql = "Insert Into Sets (ExerSetId,Reps,Weight) values ?";
  exerciseExistPromise = new Promise((resolve) => {
    con.query(exerciseSql, [], function (err, result) {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      let indexList = [];
      for (let i = 0; i < result.length; i++) {
        indexList.push(Number(result[i].ExerciseId));
      }
      try {
        let setExist = false;
        for (const exerSet of exerSets) {
          if (!indexList.includes(Number(exerSet.exerciseid)))
            return res.sendStatus(400);
          for (const set of exerSet.sets) {
            if (!Number(set.weight) || !Number(set.reps))
              return res.sendStatus(400);
            setExist = true;
          }
        }
        if (!setExist) return res.sendStatus(400);

        resolve();
      } catch {
        return res.sendStatus(400);
      }
    });
  });
  exerciseExistPromise.then(() => {
    const curDate = new Date();
    con.query(
      workoutSql,
      [[UserId, public, curDate, title, curDate]],
      function (err, result) {
        if (err) {
          console.error(err);
          return res.sendStatus(500);
        }
        const WorkoutId = result.insertId;
        let exerSetsOnly;
        exerSetsOnly = exerSets.map((exerSet) => {
          return [WorkoutId, exerSet.exerciseid];
        });

        const exersetPromise = new Promise((resolve) => {
          con.query(exerSetsSql, [exerSetsOnly], function (err, result2) {
            if (err) {
              console.error(err);
              return res.sendStatus(500);
            }
            const firstExerSetId = result2.insertId;
            let sets = [];
            exerSets.forEach((exerSet, index) => {
              const ExerSetId = firstExerSetId + index * INCREMENT;
              exerSet.sets.forEach((set) => {
                sets.push([ExerSetId, Number(set.reps), Number(set.weight)]);
              });
            });
            resolve(sets);
          });
        });
        exersetPromise.then((sets) => {
          con.query(SetSql, [sets], function (err) {
            if (err) {
              console.error(err);
              return res.sendStatus(500);
            }
            res.sendStatus(201);
          });
        });
      }
    );
  });
}
module.exports = addWorkout;
