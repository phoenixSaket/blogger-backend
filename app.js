// Create express app
const cors = require("cors");
const express = require("express");
const app = express();
const db = require("./database.js");
const bodyParser = require("body-parser");
const md5 = require("md5");
const multer = require("multer");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://localhost:3000/",
      "localhost:3000",
      "http://localhost:4200",
      "https://localhost:4200/",
      "localhost:4200",
    ],
  })
);

const DIR = "C:/Users/SaketV/Pictures/ImagesDirectory/";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage }).any();

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

app.post("/api/getUser", (req, res, err) => {
  let id = req.body.id;

  let sql = "SELECT * FROM user WHERE id = ?";
  let params = [id];

  db.get(sql, params, (err, result) => {
    if (err) {
      console.log("Error", err);
      return res.status(400).json({ Error: err });
    }

    if (result) {
      return res.status(200).json(result);
    } else {
      return res.status(200).json({ data: "No Result" });
    }
  });
});

app.post("/api/uploadImage", (req, res, err) => {
  upload(req, res, (err) => {
    if (err) {
      console.log("Error", err);
      return res.status(400).json({ message: "Error", Error: err });
    }
    let name = req.files[0].originalname;
    return res.status(200).json({ message: "Success", filename: name });
  });
});

app.post("/api/addBlog", (req, res, err) => {
  const data = req.body.data;
  const { userId, title, subtitle, content, images, isPrivate, date, likes } =
    data;

  if (!userId || !title || !subtitle || !content || !date) {
    return res.status(400).json({ Error: "Value Required" });
  }
  const sql =
    "INSERT INTO blogs (userId, title, subtitle, content, images, isPrivate, date, likes) VALUES (?,?,?,?,?,?,?,?)";

  let params = [
    userId,
    title,
    subtitle,
    content,
    images,
    isPrivate,
    date,
    likes,
  ];

  db.run(sql, params, (err) => {
    if (err) {
      console.log("Error : ", err);
      return res.status(400).json({ Error: err });
    }
    return res.status(200).json({ Message: { success: true } });
  });
});

app.post("/api/getBlogs", (req, res, err) => {
  const id = req.body.id;

  let sql = "SELECT * FROM blogs WHERE isPrivate = 0;";

  let data = [];
  db.all(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ Error: err });
    }

    let noData = false;

    if (result) {
      data = result;
    } else {
      noData = true;
    }

    let sql = "SELECT * FROM blogs WHERE isPrivate = 1 AND userId = ?;";
    let params = [id];

    db.all(sql, params, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ Error: err });
      }

      if (result) {
        const privateData = result;
        // privateData.forEach((element) => {
        // data.push(privateData);
        // });
        return res.status(200).json({ blogs: data, privateBlogs: privateData });
      } else {
        if (noData) {
          return res.status(200).json({ Message: "No data" });
        } else {
          return res.status(200).json({ blogs: data });
        }
      }
    });
  });
});

app.get("/api/getMaxBlogs/", (req, res, err) => {
  const sql = "SELECT count(*) as max FROM blogs";

  db.get(sql, (err, result) => {
    if (err) {
      console.log("Error", err);
      return res.status(400).json({ Error: err });
    }

    if (result) {
      return res.status(200).json({ Message: result.max });
    }
  });
});

// Default response for any other request
app.use(function (req, res) {
  res.status(404);
});
