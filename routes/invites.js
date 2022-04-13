const router = require("express").Router();
const con = require("../dbScripts/connect");
const verifyToken = require("../authScripts/verifyToken");
const jwt = require("jsonwebtoken");
const verifyFunctions = require("../authScripts/verifyFriend");
const SECRET_KEY = process.env.SECRET_KEY;
router.route("/add/:username").post(verifyToken, (req, res) => {
  const UserNameSql = "Select UserId from Users where UserName=?";
  const inviteSql = "Insert Into Invites Values(?,?)";
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);

    user = authData.user;
  });
  if (!user) return;
  UserID = user.UserID;
  con.query(UserNameSql, [req.params.username], (err, result) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else if (result.length == 0)
      res.status(400).send("No user with this username");
    else {
      let User2Id = result[0].UserId;
      verifyFunctions
        .verifyFriend(UserID, User2Id)
        .then((isFriend) => {
          if (isFriend)
            res.status(400).send("This user is already your friend");
          else {
            verifyFunctions
              .checkIfInvite(UserID, User2Id)
              .then((isInvite) => {
                if (isInvite)
                  res.status(400).send("You already sent request to this user");
                else {
                  con.query(inviteSql, [UserID, User2Id], (err) => {
                    if (err) {
                      console.error(err);
                      res.sendStatus(500);
                    } else res.send("Invite Sent");
                  });
                }
              })
              .catch((err) => {
                console.error(err);
                res.sendStatus(500);
              });
          }
        })
        .catch((err) => {
          console.error(err);
          res.sendStatus(500);
        });
    }
  });
});
router.route("/:id/:action").post(verifyToken, (req, res) => {
  const action = req.params.action;
  if ((action != "accept") & (action != "reject")) return res.sendStatus(400);
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  if (!user) return;
  UserID = user.UserID;
  User2Id = req.params.id;
  CheckInviteSql = "select 1 from invites where InviterId=? and InvitedId=?";
  DeleteInviteSql = "Delete from invites where InviterId=? and InvitedId=?";
  AddFriendSql = "Insert Into Friendships values(?,?)";
  con.query(CheckInviteSql, [User2Id, UserID], (err, result) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else if (result.length == 0) res.status(400).send("No Invite");
    else {
      con.query(DeleteInviteSql, [User2Id, UserID], (err) => {
        if (err) {
          console.error(err);
          res.sendStatus(500);
        }
      });
      if (action == "accept") {
        con.query(AddFriendSql, [User2Id, UserID], (err) => {
          if (err) {
            console.error(err);
            res.sendStatus(500);
          }
        });
      }
      res.send(action + "ed");
    }
  });
});
router.route("/").get(verifyToken, (req, res) => {
  let user;
  jwt.verify(req.token, SECRET_KEY, (err, authData) => {
    if (err) return res.sendStatus(401);
    user = authData.user;
  });
  if (!user) return;
  const inviteSql =
    "Select InviterId,UserName,Email from invites i join users u on u.userId=i.InviterId where invitedId=?";
  con.query(inviteSql, [user.UserID], (err, result) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else res.json(result);
  });
});
module.exports = router;
