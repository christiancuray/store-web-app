const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 8080;

const storeService = require("./store-service");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "about.html"));
});

app.get("/shop", (req, res) => {
  res.send("TODO: get all items who have published==true");
});

app.listen(port, () => {
  //console.log(`Express html server listening on port http://localhost:${port}`);
  console.log(`Express html server listening on port ${port}`);
});
