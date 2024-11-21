/*********************************************************************************
WEB322 – Assignment 05
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Christian Daryl Curay
Student ID: 122375231
Date: November 12, 2024
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
const exphbs = require("express-handlebars");
const stripJs = require("strip-js");

// set cloudinary config
cloudinary.config({
  cloud_name: "dvdff6abc",
  api_key: "125478299579294",
  api_secret: "7V5OMnN0rcV4LABLXyEvB4Om_OY",
  secure: true,
});

// set up multer for file uploads
const upload = multer();
//Middleware to parse URL-encoded data from form submission
app.use(express.urlencoded({ extended: true }));

// set up handlebars to render templates
const hbs = exphbs.create({
  extname: ".hbs",
  helpers: {
    navLink: function (url, options) {
      const activeRoute = options.data.root.activeRoute;
      return (
        '<li class="nav-item"><a ' +
        (url == activeRoute
          ? 'class="nav-link active" '
          : 'class="nav-link" ') +
        'href="' +
        url +
        '">' +
        options.fn(this) +
        "</a></li>"
      );
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    safeHTML: function (context) {
      return stripJs(context);
    },
    formatDate: function (dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    },
  },
});

// Use the hbs instance with helpers
app.engine(".hbs", hbs.engine);
// Set the view engine to use handlebars
app.set("views", path.join(__dirname, "views"));
app.set("view engine", ".hbs");

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

// middleware to set activeRoute
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// route to redirect to shop page
app.get("/", (req, res) => {
  res.redirect("/shop");
});

// route to display about page
app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "item" by category
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
    } else {
      // Obtain the published "items"
      items = await storeService.getPublishedItems();
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    // get the latest item from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();
    console.log(categories);
    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    console.error("Error fetching categories:", err);
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

// route to get the item that search by ID
app.get("/shop/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
    } else {
      // Obtain the published "items"
      items = await storeService.getPublishedItems();
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the item by "id"
    viewData.item = await storeService.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();
    console.log(categories);
    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    console.error("Error fetching categories:", err);
    viewData.categoriesMessage = "no results";
  }
  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

// route to get all items
app.get("/items", (req, res) => {
  // show items that search by category
  const category = req.query.category;

  if (category) {
    storeService
      .getItemsByCategory(category)
      .then((items) => {
        //return items in JSON format
        if (items.length > 0) {
          res.render("items", { items: items });
        } else {
          res.render("items", { message: "No results" });
        }
      })
      .catch((error) => {
        console.error("Error getting items by category:", error);
        res.render("items", { message: "No results" });
      });
  }
  // show items that search by minDate
  else if (req.query.minDate) {
    storeService
      .getItemsByMinDate(req.query.minDate)
      .then((items) => {
        //return items in JSON format
        if (items.length > 0) {
          res.render("items", { items: items });
        } else {
          res.render("items", { message: "No results" });
        }
      })
      .catch((error) => {
        console.error("Error getting items by minDate:", error);
        res.render("items", { message: "No results" });
      });
  }
  // otherwise, return all items
  storeService
    .getAllItems()
    .then((items) => {
      // render all items in JSON format
      if (items.length > 0) {
        res.render("items", { items: items });
      } else {
        res.render("items", { message: "No results" });
      }
    })
    .catch((error) => {
      console.error("Error getting items by category:", error);
      res.render("items", { message: "No results" });
    });
});

// route to get all categories
app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((cat) => {
      if (cat.length > 0) {
        res.render("categories", { categories: cat });
      } else {
        res.render("categories", { message: "No results" });
      }
    })
    .catch((error) => {
      console.error("Error getting categories:", error);
      res.render("categories", { message: "No results" });
    });
});

// route to get the add item form
app.get("/items/add", (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      res.render("addItem", { categories: data });
    })
    .catch((error) => {
      res.render("addItem", { categories: [] });
    });
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
        res.status(404).render("404");
      }
    })
    .catch((error) => {
      console.error("Error getting item by id:", error);
      res.status(500).send({ message: "Error getting item by id" });
    });
});

// route to get the add category form
app.get("/categories/add", (req, res) => {
  res.render("addCategory");
});

// route that handles the form submission
app.post("/categories/add", (req, res) => {
  storeService
    .addCategory(req.body)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((error) => {
      res.status(500).send("Error adding category");
    });
});

// route to get the delete category by ID
app.get("/categories/delete/:id", (req, res) => {
  storeService
    .deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((error) => {
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});

// route to get the delete item by ID
app.get("/items/delete/:id", (req, res) => {
  storeService
    .deleteItemById(req.params.id)
    .then(() => {
      res.redirect("/items");
    })
    .catch((error) => {
      res.status(500).send("Unable to Remove Item / Item not found");
    });
});

// route to handle when trying to access a page that does not exist
// app.use((req, res) => {
//   res.status(404).render("404");
// });

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// starts the server
app.listen(port, () => {
  console.log(`Express html server listening on http://localhost:${port}`);
});
