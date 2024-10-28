/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Christian Daryl Curay
Student ID: 122375231
Date: October 27, 2024
Vercel Web App URL: https://web-application-three-pi.vercel.app
GitHub Repository URL: https://github.com/christiancuray/web-app

********************************************************************************/
const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const port = process.env.PORT || 8080;
const storeService = require("./store-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// set cloudinary config
cloudinary.config({
  cloud_name: "dvdff6abc",
  api_key: "125478299579294",
  api_secret: "7V5OMnN0rcV4LABLXyEvB4Om_OY",
  secure: true,
});

// set up multer for file uploads
const upload = multer();

// set up view engine to render EJS templates
app.set("views", __dirname + "/views");

// to serve static files from public directory
app.use(express.static(__dirname + "/public"));

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
  // show items that search by category
  if (req.query.category) {
    storeService
      .getItemsByCategory(req.query.category)
      .then((items) => {
        //return items in JSON format
        res.json(items);
      })
      .catch((error) => {
        console.error("Error getting items by category:", error);
        res.status(500).send({ message: "Error getting items by category" });
      });
  }
  // show items that search by minDate
  else if (req.query.minDate) {
    storeService
      .getItemsByMinDate(req.query.minDate)
      .then((items) => {
        //return items in JSON format
        res.json(items);
      })
      .catch((error) => {
        console.error("Error getting items by minDate:", error);
        res.status(500).send({ message: "Error getting items by minDate" });
      });
  }
  // otherwise, return all items
  storeService
    .getAllItems()
    .then((items) => {
      // return items in JSON format
      res.json(items);
    })
    .catch((error) => {
      console.error("Error getting all items:", error);
      res.status(500).send({ message: "Error getting all items" });
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
      res.status(500).send({ message: "Error getting categories" });
    });
});

// route to get the add item form
app.get("/items/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "addItem.html"));
});

// route that handles the form submission
app.post("/items/add", upload.single("featureImage"), (req, res) => {
  let processItem = (imageUrl) => {
    req.body.featureImage = imageUrl;
    storeService
      .addItem(req.body)
      .then((addedItem) => {
        console.log("Added Item:", addedItem);
        res.redirect("/items");
      })
      .catch((error) => {
        console.error("Error adding item:", error);
        res.status(500).send("Error adding item");
      });
  };

  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processItem(uploaded.url);
    });
  } else {
    processItem("");
  }
});

// route to get the item that search by ID
app.get("/item/value", (req, res) => {
  // pass to itemValue variable
  const itemValue = req.params.value;

  storeService
    .getItemById(itemValue)
    .then((item) => {
      if (item) {
        //return the item in JSON format
        res.json;
      } else {
        res.status(404).send("Item not found");
      }
    })
    .catch((error) => {
      console.error("Error getting item by id:", error);
      res.status(500).send({ message: "Error getting item by id" });
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
