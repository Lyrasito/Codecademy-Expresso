const express = require("express");
const sqlite3 = require("sqlite3");
const timesheetsRouter = require("./timesheets");
const employeesRouter = express.Router();
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

employeesRouter.param("employeeId", (req, res, next, employeeId) => {
  db.get(
    "SELECT * FROM Employee WHERE Employee.id = $employeeId",
    {
      $employeeId: employeeId,
    },
    (err, employee) => {
      if (err) {
        next(err);
      } else {
        if (employee) {
          req.employee = employee;
          next();
        } else {
          res.sendStatus(404);
        }
      }
    }
  );
});

employeesRouter.use("/:employeeId/timesheets", timesheetsRouter);

employeesRouter.get("/", (req, res, next) => {
  db.all(
    "SELECT * FROM Employee WHERE Employee.is_current_employee = 1",
    (err, employees) => {
      if (err) {
        next(err);
      } else {
        res.send({ employees: employees });
      }
    }
  );
});
employeesRouter.get("/:employeeId", (req, res, next) => {
  res.send({ employee: req.employee });
});

const validateEmployee = (req, res, next) => {
  const newEmployee = req.body.employee;
  if (!newEmployee.name || !newEmployee.position || !newEmployee.wage) {
    res.sendStatus(400);
  }
  next();
};

employeesRouter.post("/", validateEmployee, (req, res, next) => {
  const newEmployee = req.body.employee;
  db.run(
    "INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $isCurrentEmployee)",
    {
      $name: newEmployee.name,
      $position: newEmployee.position,
      $wage: newEmployee.wage,
      $isCurrentEmployee: 1,
    },
    function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
          (err, employee) => {
            res.status(201).send({ employee: employee });
          }
        );
      }
    }
  );
});

employeesRouter.put("/:employeeId", validateEmployee, (req, res, next) => {
  const newEmployee = req.body.employee;
  const getCurrentEmployee = newEmployee.isCurrentEmployee === 0 ? 0 : 1;
  db.run(
    "UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId",
    {
      $name: newEmployee.name,
      $position: newEmployee.position,
      $wage: newEmployee.wage,
      $isCurrentEmployee: getCurrentEmployee,
      $employeeId: req.params.employeeId,
    },
    function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
          (err, employee) => {
            res.send({ employee: employee });
          }
        );
      }
    }
  );
});

employeesRouter.delete("/:employeeId", (req, res, next) => {
  db.run(
    "UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId",
    { $employeeId: req.params.employeeId },
    function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
          (err, employee) => {
            res.send({ employee: employee });
          }
        );
      }
    }
  );
});
module.exports = employeesRouter;
