const verifyFriend = require("./verifyFriend").verifyFriend;
function verifyUserAuth(WorkoutUserId, tokenUserId, isPublic) {
  return new Promise((resolve, reject) => {
    let isAuthorized = WorkoutUserId == tokenUserId;
    if (isAuthorized) return resolve(true);
    verifyFriend(WorkoutUserId, tokenUserId)
      .then((isFriend) => {
        if (isPublic == undefined) isPublic = true;
        isAuthorized = isFriend && Boolean(isPublic);
        if (!isFriend) return resolve(false);
        resolve(true);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
module.exports = verifyUserAuth;
