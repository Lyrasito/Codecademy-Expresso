const express = require("express");
const menusRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);
const itemsRouter = require("./menuItems");

menusRouter.param("menuId", (req, res, next, menuId) => {
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId}`, (err, menu) => {
    if (err) {
      next(err);
    } else {
      if (menu) {
        req.menu = menu;
        next();
      } else {
        res.sendStatus(404);
      }
    }
  });
});
menusRouter.use("/:menuId/menu-items", itemsRouter);

menusRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (err, menus) => {
    if (err) {
      next(err);
    } else {
      res.send({ menus: menus });
    }
  });
});

menusRouter.get("/:menuId", (req, res, next) => {
  res.send({ menu: req.menu });
});

const validateMenu = (req, res, next) => {
  const newMenu = req.body.menu;
  if (!newMenu.title) {
    res.sendStatus(400);
  }
  next();
};

menusRouter.post("/", validateMenu, (req, res, next) => {
  db.run(
    `INSERT INTO Menu (title) VALUES ($title)`,
    { $title: req.body.menu.title },
    function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
          (err, menu) => {
            res.status(201).send({ menu: menu });
          }
        );
      }
    }
  );
});

menusRouter.put("/:menuId", validateMenu, (req, res, next) => {
  db.run(
    "UPDATE Menu SET title = $title WHERE Menu.id = $menuId",
    { $title: req.body.menu.title, $menuId: req.params.menuId },
    function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
          (err, menu) => {
            res.send({ menu: menu });
          }
        );
      }
    }
  );
});

module.exports = menusRouter;
