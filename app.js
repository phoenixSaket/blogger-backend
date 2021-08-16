// Create express app
var cors = require("cors");
var express = require("express");
var app = express();
var db = require("./database.js");
var bodyParser = require("body-parser");
var md5 = require("md5");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://localhost:3000/",
      "localhost:3000",
    ],
  })
);

var lastID = 0;

// Server port
var HTTP_PORT = 8000;

// Start server
app.listen(HTTP_PORT, () => {
  console.log("Server running on port %PORT%".replace("%PORT%", HTTP_PORT));
});

// Root endpoint
app.get("/", (req, res, next) => {
  res.json({ message: "Ok" });
});

// Insert here other API endpoints
app.post("/api/addUser", (req, res, err) => {
  var name, username, email, password, isOnline, lastLoggedOut;

  if (req.body.user.name) {
    name = req.body.user.name;
  }
  if (req.body.user.username) {
    username = req.body.user.username;
  }
  if (req.body.user.email) {
    email = req.body.user.email;
  }
  if (req.body.user.password) {
    password = md5(req.body.user.password);
  }
  if (req.body.user.isOnline) {
    isOnline = req.body.user.isOnline;
  }
  if (req.body.user.lastLoggedOut) {
    lastLoggedOut = req.body.user.lastLoggedOut;
  }

  let insert =
    "INSERT INTO user (name, username, email, password, isOnline, lastLoggedOut) VALUES (?,?,?,?,?,?)";

  let params = [name, username, email, password, isOnline, lastLoggedOut];

  //   {
  //     "user": {
  //         "name": "Saket",
  //         "username": "phoenix",
  //         "email": "saket@mail.com",
  //         "password": "test",
  //         "isOnline": 1,
  //         "lastLoggedOut": null
  //     }
  //   }

  db.run(insert, params, (err, result) => {
    if (err) {
      console.log("Error", err);
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: "success",
      id: this.lastID,
    });
  });
});

app.get("/api/getMaxID", (req, res, err) => {
  let sql = "SELECT MAX(id) AS max from user;";

  db.get(sql, (err, result) => {
    if (err) {
      console.log("Error", err.message);
      return res.status(400).json({ message: err.message });
    }
    lastID = result.max;
    return res.status(200).json({ message: result.max });
  });
});

app.post("/api/login", (req, res, err) => {
  let username = req.body.user.username;
  let password = req.body.user.password;

  let sql = "SELECT password,id FROM user WHERE username = ?";
  let params = [username];
  let isValid = false;
  let id = 0;

  db.get(sql, params, (err, result) => {
    if (err) {
      console.log("Error", err.message);
      res.status(400).json({ message: err.message });
      return;
    }

    if (!!!result) {
      console.log("Error", "Invalid credentials");
      res.status(400).json({ message: "Invalid credentials !" });
      return;
    }

    if (md5(password) === result.password) {
      isValid = true;
    } else {
      console.log("Error", "Invalid Password");
      res.status(400).json({ message: "Invalid Password !" });
      return;
    }

    id = result.id;

    res.status(200).json({ message: isValid, id: id });
  });
});

// Default response for any other request
app.use(function (req, res) {
  res.status(404);
});
