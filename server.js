const express = require("express");

const bodyParser = require("body-parser");
const errorhandler = require("errorhandler");
const cors = require("cors");
const morgan = require("morgan");
const apiRouter = require("./api/api");

const app = express();

app.use(bodyParser.json());
app.use(errorhandler());
app.use(cors());
app.use(morgan("dev"));
app.use("/api", apiRouter);
app.use(express.static("public"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});

module.exports = app;
