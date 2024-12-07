const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

// create a user schema
let userSchema = new Schema({
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
      },
      userAgent: {
        type: String,
        required: true,
      },
    },
  ],
});

let User; // to be defined on new connection

// Initializes the connection to the database
let initialize = () => {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(
      "mongodb+srv://curay404:christian16@dbs311.ynedt.mongodb.net/web"
    );
    db.on("error", (err) => {
      reject("There was an error verifying the user: ", err.message);
    });
    db.once("open", () => {
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
            reject("There was an error creating the user: ", err.message);
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
