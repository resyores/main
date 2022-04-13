const con = require("../dbScripts/connect");
function MarkSeen(WorkoutId) {
  return new Promise((resolve, reject) => {
    const Sql = "Update workouts set UserEntered=? where workoutid=?";
    con.query(Sql, [new Date(), WorkoutId], (err, result) => {
      if (err) reject(err);
      else if(result.affectedRows!=1)reject("Invalid Workout")
      else resolve();
    });
  });
}
module.exports=MarkSeen;