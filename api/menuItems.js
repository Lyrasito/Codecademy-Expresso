const express = require("express");
const itemsRouter = express.Router({ mergeParams: true });
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

itemsRouter.param("menuItemId", (req, res, next, menuItemId) => {
  db.get(
    "SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId",
    { $menuItemId: menuItemId },
    (err, item) => {
      if (err) {
        next(err);
      } else {
        if (item) {
          req.menuItem = item;
          next();
        } else {
          res.sendStatus(404);
        }
      }
    }
  );
});

itemsRouter.get("/", (req, res, next) => {
  db.all(
    "SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId",
    { $menuId: req.menu.id },
    (err, items) => {
      if (err) {
        next(err);
      } else {
        res.send({ menuItems: items });
      }
    }
  );
});

const validateItem = (req, res, next) => {
  const newItem = req.body.menuItem;
  if (!newItem.name || !newItem.inventory || !newItem.price) {
    res.sendStatus(400);
  } else {
    next();
  }
};

itemsRouter.post("/", validateItem, (req, res, next) => {
  const newItem = req.body.menuItem;
  db.run(
    `INSERT INTO MenuItem (name, description, price, inventory, menu_id) VALUES ($name, $description, $price, $inventory, $menuId)`,
    {
      $name: newItem.name,
      $description: newItem.description,
      $price: newItem.price,
      $inventory: newItem.inventory,
      $menuId: req.menu.id,
    },
    function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`,
          (err, item) => {
            res.status(201).send({ menuItem: item });
          }
        );
      }
    }
  );
});

itemsRouter.get("/:menuItemId", (req, res, next) => {
  res.send({ menuItem: req.menuItem });
});

itemsRouter.put("/:menuItemId", validateItem, (req, res, next) => {
  const newItem = req.body.menuItem;
  const sql = `UPDATE MenuItem SET name = '${newItem.name}', description = '${newItem.description}', inventory = ${newItem.inventory}, price = ${newItem.price} WHERE MenuItem.id = ${req.params.menuItemId}`;
  db.run(sql, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(
        `SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`,
        (err, item) => {
          res.send({ menuItem: item });
        }
      );
    }
  });
});

itemsRouter.delete("/:menuItemId", (req, res, next) => {
  db.run(
    `DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId`,
    { $menuItemId: req.params.menuItemId },
    function (err) {
      if (err) {
        next(err);
      } else {
        res.status(204).send();
      }
    }
  );
});

module.exports = itemsRouter;
