/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Christian Daryl Curay
Student ID: 122375231
Date: October 8, 2024
Vercel Web App URL: 
GitHub Repository URL: https://github.com/christiancuray/web-app

********************************************************************************/
const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const port = process.env.PORT || 8080;
const storeService = require("./store-service");

// to serve static files from public directory
app.use(express.static("public"));

// call initialize function from store-service.js to
// read the data from the items.json and categories.json files
storeService
  .initialize()
  .then((message) => {
    console.log(message);
  })
  .catch((err) => {
    console.log(err);
  });

// route to redirect to about page
app.get("/", (req, res) => {
  res.redirect("/about");
});

// route to display about page
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "about.html"));
});

// route to get all items who have published set to true
app.get("/shop", (req, res) => {
  storeService
    .getPublishedItems()
    .then((items) => {
      res.json(items);
    })
    .catch((error) => {
      console.error("Error getting published items:", error);
    });
});

// route to get all items
app.get("/items", (req, res) => {
  storeService
    .getAllItems()
    .then((items) => {
      res.json(items);
    })
    .catch((error) => {
      console.error("Error getting all items:", error);
    });
});

// route to get all categories
app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((categories) => {
      res.json(categories);
    })
    .catch((error) => {
      console.error("Error getting categories:", error);
    });
});

// route to handle when trying to access a page that does not exist
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

// starts the server
app.listen(port, () => {
  console.log(`Express html server listening on http://localhost:${port}`);
});
