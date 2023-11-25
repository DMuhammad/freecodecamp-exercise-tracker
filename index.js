const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

const userSchema = new mongoose.Schema({
  username: {
    required: true,
    type: String,
  },
  exercises: [exerciseSchema],
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  const user = await User.find();
  res.json(user.map(({ username, _id }) => ({ username, _id })));
});

app.post("/api/users", (req, res) => {
  const { username } = req.body;

  const user = new User({
    username,
  });

  user
    .save()
    .then((data) => {
      res.json({
        username,
        _id: data._id,
      });
    })
    .catch((error) => {
      res.json({
        error: error.message,
      });
    });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  let { description, duration, date } = req.body;

  if (!date) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  const user = await User.findById(_id);

  user.exercises.push({
    description,
    duration: parseInt(duration),
    date,
  });

  user
    .save()
    .then(() => {
      res.json({
        username: user.username,
        description,
        duration: parseInt(duration),
        date,
        _id: user._id,
      });
    })
    .catch((error) => {
      res.json({ error: error.message });
    });
});

// app.get("/api/users/:_id/logs", async (req, res) => {
//   const { _id } = req.params;
//   const { from, to, limit } = req.query;

//   const user = await User.findById(_id);

//   if (!user) res.json({ error: "User not found" });

//   if (from && to && limit) {
//     const exercises = user.exercises
//       .filter((exercise) => {
//         const date = new Date(exercise.date);
//         return date >= new Date(from) && date <= new Date(to);
//       })
//       .slice(0, parseInt(limit));

//     return res.json({
//       username: user.username,
//       count: exercises.length,
//       _id: user._id,
//       logs: exercises.map(({ description, duration, date }) => ({
//         description,
//         duration,
//         date,
//       })),
//     });
//   }

//   res.json({
//     username: user.username,
//     count: user.exercises.length,
//     _id: user._id,
//     log: user.exercises.map(({ description, duration, date }) => ({
//       description,
//       duration,
//       date,
//     })),
//   });
// });

app.get('/api/users/:_id/logs', (req, res) => {

  User.findById(req.params._id).then((data) => {
    let limit = data.exercises.length;
    let from = '1970-01-01';
    let to = '2038-01-18';

    if (typeof req.query.from != 'undefined') {
      from = req.query.from;
    }
    if (typeof req.query.to != 'undefined') {
      to = req.query.to;
    }
    if (typeof req.query.limit != 'undefined') {
      limit = parseInt(req.query.limit);
    }

    let fromF = new Date(from).toDateString();
    let toF = new Date(to).toDateString();

    let ans = data.exercises.filter(q =>
      new Date(q.date).getTime() >= new Date(from).getTime() &&
      new Date(q.date).getTime() < new Date(to).getTime()
    );

    let resp = {
      "_id": req.params._id,
      "username": data.username
    };

    if (from != '1970-01-01') resp.from = fromF;
    if (to != '2038-01-18') resp.to = toF;

    resp.count = ans.slice(0, limit).length;
    resp.log = ans.slice(0, limit);

    res.json(resp);

    if (typeof req.query.from != 'undefined' ||
      typeof req.query.to != 'undefined' ||
      typeof req.query.limit != 'undefined') {
      console.log(req._parsedOriginalUrl.path);
      console.log(resp);
    }
  }).catch((err) => {
    res.json({ error: err.message })
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
