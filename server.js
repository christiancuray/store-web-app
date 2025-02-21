/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Christian Daryl Curay
Student ID: 122375231
Date: December 6, 2024
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
const authData = require("./auth-service");
const clientSessions = require("client-sessions");
require("dotenv").config();

// set cloudinary config
cloudinary.config({
  cloud_name: "dvdff6abc",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// set up multer for file uploads
const upload = multer();

//Middleware to parse URL-encoded data from form submission
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
    formatDateTime: function (dateTime) {
      if (!dateTime) return "";
      return new Date(dateTime).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
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

// middleware to set up client-sessions
app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: process.env.CLIENT_SESSION_SECRET, // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

// middleware to set up session object
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// function to check if user is logged in or not
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

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

///////////////////////////////////////////////
////       routes for about and shop       ////
///////////////////////////////////////////////

// route to redirect to shop page
app.get("/", (req, res) => {
  res.redirect("/shop");
});

// route to display about page
app.get("/about", (req, res) => {
  res.render("about");
});

// route to display shop page ( default page )
app.get("/shop", async (req, res) => {
  let viewData = {};

  try {
    let items = []; // empty array for "items"

    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
      //console.log(items);
    } else {
      items = await storeService.getPublishedItems();
      //console.log(items);
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    viewData.item = items[0];
    viewData.items = items;
  } catch (err) {
    viewData.message = "no items results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();
    //console.log(categories);
    viewData.categories = categories;
  } catch (err) {
    console.error("Error fetching categories:", err);
    viewData.categoriesMessage = "no categories results";
  }
  res.render("shop", { data: viewData });
});

// route to get the item that search by ID
app.get("/shop/:id", async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
    } else {
      items = await storeService.getPublishedItems();
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    viewData.items = items;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    viewData.item = await storeService.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await storeService.getCategories();
    //console.log(categories);
    viewData.categories = categories;
  } catch (err) {
    console.error("Error fetching categories:", err);
    viewData.categoriesMessage = "no results";
  }
  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

///////////////////////////////////////////////
////         routes for categories         ////
///////////////////////////////////////////////

// route to get all categories
app.get("/categories", ensureLogin, (req, res) => {
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

// route to get the add category form
app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

// route that handles the form submission
app.post("/categories/add", ensureLogin, (req, res) => {
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
app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  storeService
    .deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((error) => {
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});

///////////////////////////////////////////////
////           routes for items            ////
///////////////////////////////////////////////

// route to get all items
app.get("/items", ensureLogin, (req, res) => {
  // show items that search by category
  if (req.query.category) {
    storeService
      .getItemsByCategory(req.query.category)
      .then((items) => {
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
  else {
    storeService
      .getAllItems()
      .then((items) => {
        if (items.length > 0) {
          res.render("items", { items: items });
        } else {
          res.render("items", { message: "No results" });
        }
      })
      .catch((error) => {
        console.error("Error getting items:", error);
        res.render("items", { message: "No results" });
      });
  }
});

// route to get the add item form
app.get("/items/add", ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      res.render("addItem", { categories: data });
    })
    .catch((error) => {
      res.render("addItem", { categories: [] });
    });
});

// route that handles the add item form submission
app.post(
  "/items/add",
  ensureLogin,
  upload.single("featureImage"),
  (req, res) => {
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
  }
);

// route to get the item that search by ID
app.get("/item/value", ensureLogin, (req, res) => {
  // pass to itemValue variable
  const itemValue = req.params.value;

  storeService
    .getItemById(itemValue)
    .then((item) => {
      if (item) {
        // Fix: Send the actual item
        res.json(item);
      } else {
        res.status(404).render("404");
      }
    })
    .catch((error) => {
      console.error("Error getting item by id:", error);
      res.status(500).send({ message: "Error getting item by id" });
    });
});

// route to get the delete item by ID
app.get("/items/delete/:id", ensureLogin, (req, res) => {
  storeService
    .deleteItemById(req.params.id)
    .then(() => {
      res.redirect("/items");
    })
    .catch((error) => {
      res.status(500).send("Unable to Remove Item / Item not found");
    });
});

///////////////////////////////////////////////
////     routes for login and register     ////
///////////////////////////////////////////////

// route to login page
app.get("/login", (req, res) => {
  res.render("login");
});

// route to register page
app.get("/register", (req, res) => {
  res.render("register");
});

// route to handle registration form submission
app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", {
        successMessage: "New user created successfully.",
      });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

//route to handle login form submission
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect("/items");
    })
    .catch((err) => {
      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

// route to handle logout
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

// route to display user history
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

// route to handle when trying to access a page that does not exist
app.use((req, res) => {
  res.status(404).render("404");
});

// starts the server
storeService
  .initialize()
  .then(() => authData.initialize())
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening on: http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Unable to start server:", err);
  });
