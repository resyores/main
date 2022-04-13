const router = require("express").Router();
const con = require("../dbScripts/connect");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const SECRET_KEY = process.env.SECRET_KEY;
router.route("/Login").post((req, res) => {
  const Email = req.body.email;
  const Password = req.body.password;
  if (!Email || !Password) return res.sendStatus(400);
  let sql = "SELECT * FROM Users Where Email=?";
  con.query(sql, [Email], function (err, result) {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else if (result.length == 0) res.status(400).send("Email doesn't exist");
    else {
      bcrypt.compare(Password, result[0].Password, (err, response) => {
        if (err) {
          console.error(err);
          return res.sendStatus(500);
        }
        if (!response) {
          res.status(400).send("Wrong Email/Password Combination");
        } else {
          const user = {
            username: result[0].UserName,
            email: result[0].Email,
            UserID: result[0].UserID,
          };
          jwt.sign({ user }, SECRET_KEY, (err, token) => {
            if (err) {
              console.error(err);
              res.sendStatus(500);
            } else res.json({ isAuth: true, token, user });
          });
        }
      });
    }
  });
});
router.route("/SignUp").post((req, res) => {
  const UserName = req.body.username;
  const Email = req.body.email;
  const Password = req.body.password;
  if (
    !Email ||
    !UserName ||
    !Password ||
    Email.length < 5 ||
    Password.length < 5 ||
    UserName.length < 5
  )
    return res.sendStatus(400);
  const CheckSql = "Select Email from Users where Email=? or UserName=?";
  const InsertSql = "Insert Into Users (UserName,Email,Password)  Values (?)";

  con.query(CheckSql, [Email, UserName], function (err, result) {
    if (err) {
      res.sendStatus(500);
      console.error(err);
    } else if (result.length != 0) {
      if (result[0].Email == Email)
        res.status(400).send({ index: 0, message: "Email Already Exists" });
      else
        res.status(400).send({ index: 1, message: "UserName Already Exists" });
    } else {
      bcrypt.hash(Password, saltRounds, (err, hash) => {
        if (err) {
          console.error(err);
          return res.sendStatus(500);
        }
        con.query(InsertSql, [[UserName, Email, hash]], function (err) {
          if (err) {
            res.sendStatus(500);
            console.error(err);
          } else {
            res.sendStatus(201);
          }
        });
      });
    }
  });
});
module.exports = router;
