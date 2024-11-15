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
        try {
          items = JSON.parse(dataI);
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }

        fs.readFile(
          path.join(__dirname, "data", "categories.json"),
          "utf8",
          (err, dataC) => {
            if (err) {
              reject("Unable to read categories.json");
            }

            // parse the data from the categories.json file
            try {
              categories = JSON.parse(dataC);
            } catch (e) {
              console.error("Error parsing JSON:", e);
            }
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

// function that let the user add item to the items collection
let addItem = (itemData) => {
  return new Promise((resolve, reject) => {
    // check if the itemData has a published property
    if (itemData.published === undefined) {
      itemData.published = false;
    } else {
      itemData.published = true;
    }
    // generate item id for new item
    itemData.id = items.length + 1;

    // Add the current date (formatted as YYYY-MM-DD) as itemDte
    const currentDate = new Date();
    const formattedDate =
      currentDate.getFullYear() +
      "-" +
      (currentDate.getMonth() + 1) +
      "-" +
      currentDate.getDate(); // YYYY-MM-DD format
    itemData.itemDte = formattedDate;

    // add the news item to the items array
    items.push(itemData);

    resolve(itemData);
  });
};

// function that returns items that belong to the provided category
let getItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    if (!category) {
      reject("No results returned");
    } else {
      // Filter the items that belong to the provided category
      resolve(items.filter((item) => item.category === Number(category)));
    }
  });
};

// function that returns items that have a date greater than or equal to the provided date
let getItemsByMinDate = (minDate) => {
  return new Promise((resolve, reject) => {
    if (minDate.length === 0) {
      reject("No results returned");
    } else {
      // convert minDate to Date object
      minDate = new Date(minDate);

      // filter the items that have a date greater than or equal to the provided date
      resolve(items.filter((item) => new Date(item.date) >= minDate));
    }
  });
};

// function that returns item that have the provided id
let getItemById = (id) => {
  return new Promise((resolve, reject) => {
    if (id.length === 0) {
      reject("No results returned");
    } else {
      // filter the items that have the provided id
      resolve(items.filter((item) => item.id === id));
    }
  });
};

let getPublishedItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject("No results returned");
    }
    // filter the items that have published set to true and belong to the provided category
    resolve(
      items.filter(
        (item) => item.published === true && item.category === category
      )
    );
  });
};

// export the functions to be used in the server.js
module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
};
