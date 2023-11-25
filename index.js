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

app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = await User.findById(_id);

  if (!user) res.json({ error: "User not found" });

  if (from && to && limit) {
    const exercises = user.exercises
      .filter((exercise) => {
        const date = new Date(exercise.date);
        return date >= new Date(from) && date <= new Date(to);
      })
      .slice(0, parseInt(limit));

    return res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(({ description, duration, date }) => ({
        description,
        duration,
        date,
      })),
    });
  }

  res.json({
    username: user.username,
    count: user.exercises.length,
    _id: user._id,
    log: user.exercises.map(({ description, duration, date }) => ({
      description,
      duration,
      date,
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
