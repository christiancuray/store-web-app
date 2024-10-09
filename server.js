const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const port = process.env.PORT || 8080;

const storeService = require("./store-service");
app.use(express.static("public"));
/*
app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "about.html"));
});

/*
app.get("/shop", (req, res) => {
  res.send("TODO: get all items who have published==true");
});

const dataFilePath = path.join(__dirname, "data", "items.json");
const categoriesFilePath = path.join(__dirname, "data", "categories.json");
app.get("/shop", (req, res) => {
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the JSON file:", err);
      return res.status(404).send("Page not found");
    }

    // Parse the JSON data
    const items = JSON.parse(data);

    // Filter the items to return only those with published set to true
    const publishedItems = items.filter((item) => (item.published = true));

    // Send the filtered items as JSON
    res.json(publishedItems);
  });
});

app.get("/items", (req, res) => {
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the JSON file:", err);
      return res.status(404).send("Page not found");
    }

    // Parse the JSON data
    const items = JSON.parse(data);

    // Send the items as JSON
    res.json(items);
  });
});

app.get("/categories", (req, res) => {
  fs.readFile(categoriesFilePath, "utf8", (err, categories) => {
    if (err) {
      console.error("Error reading the JSON file:", err);
      return res.status(404).send("Page not found");
    }

    // Parse the JSON data
    const categoriesData = JSON.parse(categories);

    // Send the categories as JSON
    res.json(categoriesData);
  });
});
*/

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
      res.status(500).send("Internal Server Error");
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
      res.status(500).send("Internal Server Error");
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
      res.status(500).send("Internal Server Error");
    });
});
app.listen(port, () => {
  console.log(`Express html server listening on http://localhost:${port}`);
});
