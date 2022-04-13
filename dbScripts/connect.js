const mysql = require("mysql");
require("dotenv").config();
const options = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
};
let connection = mysql.createPool(options);

function keepAlive() {
  connection.getConnection(function (err, con) {
    if (err) {
      console.error("mysql keepAlive err", err);
      return;
    }
    console.log("ping db");
    con.ping(); 
    con.release();
  });
}
setInterval(keepAlive, 30000);
module.exports = connection;
