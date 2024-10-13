const fs = require("fs");
const path = require("path");

// variables to store the data from the items.json and categories.json files
let items = [];
let categories = [];

// functin that reads the data from the items.json and categories.json files
let initialize = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, "data", "items.json"),
      "utf8",
      (err, dataI) => {
        if (err) {
          reject("Unable to read items.json");
        }
        // parse the data from the items.json file
        items = JSON.parse(dataI);

        fs.readFile(
          path.join(__dirname, "data", "categories.json"),
          "utf8",
          (err, dataC) => {
            if (err) {
              reject("Unable to read categories.json");
            }

            // parse the data from the categories.json file
            categories = JSON.parse(dataC);

            resolve("Initialization success!");
          }
        );
      }
    );
  });
};

// function that returns all items
let getAllItems = () => {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject("No results returned");
    }
    resolve(items);
  });
};

// function that returns all items taht have published set to true
let getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject("No results returned");
    }
    // filter the items that have published set to true
    resolve(items.filter((item) => item.published === true));
  });
};

// function that returns all categories
let getCategories = () => {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject("No results returned");
    }
    resolve(categories);
  });
};

// export the functions to be used in the server.js
module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
};
