const router = require("express").Router();
const con = require("../dbScripts/connect");
const verifyToken = require("../authScripts/verifyToken");
const jwt = require("jsonwebtoken");
const verifyFriend = require("../authScripts/verifyFriend").verifyFriend;
const SECRET_KEY = process.env.SECRET_KEY;
router.route("/:id").delete(verifyToken, (req, res) => {
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  if (!user) return;
  const UserID = user.UserID;
  const FriendId = req.params.id;
  DeleteFriendSql =
    "Delete from friendships where (Friend1Id=? and Friend2Id=?)or(Friend2Id=? and Friend1Id=?)";
  verifyFriend(FriendId, UserID)
    .then((isFriend) => {
      if (!isFriend) return res.sendStatus(400);
      con.query(
        DeleteFriendSql,
        [UserID, FriendId, UserID, FriendId],
        (err) => {
          if (err) {
            console.error(err);
            res.sendStatus(500);
          } else res.send("Unfriended");
        }
      );
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});
router.route("/").get(verifyToken, (req, res) => {
  const FriendsSql =
    "Set @Id=?;" +
    "Select u.UserId,u.UserName,u.Email " +
    "from friendships f " +
    "join users u " +
    "on ( f.Friend1Id=u.UserId or f.Friend2Id=u.UserID) " +
    "and u.UserId!=@Id " +
    "Where Friend1Id=@Id or Friend2Id=@Id";
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);

    user = authData.user;
  });
  if (!user) return;
  con.query(FriendsSql, [user.UserID], (err, result) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }
    res.json(result[1]);
  });
});
module.exports = router;
