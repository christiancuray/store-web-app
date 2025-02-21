const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;
require("dotenv").config();

// Add this near the top of the file after the require statements
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
// DO NOT log the actual URI as it contains sensitive information

// create a user schema
let userSchema = new Schema(
  {
    userName: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    loginHistory: [
      {
        dateTime: {
          type: Date,
          required: true,
          get: function (date) {
            if (date) {
              return date.toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
            }
            return "";
          },
        },
        userAgent: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { toJSON: { getters: true } }
);

let User; // to be defined on new connection

// Initializes the connection to the database
let initialize = () => {
  return new Promise((resolve, reject) => {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is missing from environment variables");
      reject("Error: MONGO_URI is not defined in environment variables");
      return;
    }

    let db = mongoose.createConnection(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    db.on("error", (err) => {
      console.error("MongoDB Connection Error Details:", {
        message: err.message,
        code: err.code,
        name: err.name,
      });
      reject("There was an error connecting to MongoDB: " + err.message);
    });

    db.once("open", () => {
      console.log("Successfully connected to MongoDB");
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

// Function to register a new user
let registerUser = (userData) => {
  return new Promise((resolve, reject) => {
    // check if the inputs are empty
    if (
      userData.userName == "" ||
      userData.password == "" ||
      userData.password2 == "" ||
      userData.email == ""
    ) {
      reject("Please fill out all fields");
      return;
    }

    // check if the passwords match
    if (userData.password != userData.password2) {
      reject("Passwords do not match");
      return;
    }

    // encrypt the password and create a new user
    bcrypt.hash(userData.password, 10).then((hash) => {
      // create a new user
      let newUser = new User({
        userName: userData.userName,
        password: hash,
        email: userData.email,
        loginHistory: [],
      });
      //console.log(newUser);

      // save the user to the database
      newUser
        .save()
        .then(() => {
          resolve("User " + userData.userName + " created.");
        })
        .catch((err) => {
          if (err.code == 11000) {
            reject("User Name already taken");
          } else {
            reject("There was an error creating the user: " + err.message);
          }
        });
    });
  }).catch((err) => {
    console.log(err);
    reject("There was an error encrypting the password");
  });
};

// Function to check the user's credentials
let checkUser = (userData) => {
  return new Promise((resolve, reject) => {
    // Find the user in the database by userName
    User.find({ userName: userData.userName })
      .exec()
      .then((users) => {
        // If no users found, reject the promise
        if (users.length === 0) {
          return reject(`Unable to find user: ${userData.userName}`);
        }

        // Compare the entered password with the hashed password in the database
        bcrypt.compare(userData.password, users[0].password).then((result) => {
          if (!result) {
            return reject(`Incorrect Password for user: ${userData.userName}`);
          }

          // If the password is matched, update the user's login history
          User.updateOne(
            { userName: users[0].userName },
            {
              $push: {
                loginHistory: {
                  dateTime: new Date(),
                  userAgent: userData.userAgent,
                },
              },
            }
          )
            .exec()
            .then(() => {
              resolve(users[0]);
            })
            .catch((err) => {
              reject(
                `There was an error updating the user's login history: ${err.message}`
              );
            });
        });
      })
      // If there was an error finding the user, reject the promise
      .catch((err) => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
};

module.exports = {
  initialize,
  checkUser,
  registerUser,
};
