const express = require("express");
const timesheetsRouter = express.Router({ mergeParams: true });
const sqlite3 = require("sqlite3");
const e = require("express");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

timesheetsRouter.get("/", (req, res, next) => {
  db.all(
    "SELECT * FROM Timesheet WHERE employee_id = $employeeId",
    {
      $employeeId: req.employee.id,
    },
    (err, timesheets) => {
      if (err) {
        next(err);
      } else {
        res.send({ timesheets: timesheets });
      }
    }
  );
});

const validateTimesheets = (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.date) {
    res.sendStatus(400);
  }
  next();
};

timesheetsRouter.post("/", validateTimesheets, (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  db.run(
    "INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)",
    {
      $hours: newTimesheet.hours,
      $rate: newTimesheet.rate,
      $date: newTimesheet.date,
      $employeeId: req.employee.id,
    },
    function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
          (err, timesheet) => {
            res.status(201).send({ timesheet: timesheet });
          }
        );
      }
    }
  );
});
timesheetsRouter.param("timesheetId", (req, res, next, timesheetId) => {
  db.get(
    `SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId}`,
    (err, timesheet) => {
      if (err) {
        next(err);
      } else {
        if (timesheet) {
          req.timesheet = timesheet;
          next();
        } else {
          res.sendStatus(404);
        }
      }
    }
  );
});
timesheetsRouter.put("/:timesheetId", validateTimesheets, (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  db.run(
    `UPDATE Timesheet SET hours = ${newTimesheet.hours}, rate = ${newTimesheet.rate}, date = ${newTimesheet.date} WHERE Timesheet.id = ${req.params.timesheetId}`,
    function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
          (err, timesheet) => {
            res.send({ timesheet: timesheet });
          }
        );
      }
    }
  );
});

timesheetsRouter.delete("/:timesheetId", (req, res, next) => {
  db.run(
    "DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId",
    {
      $timesheetId: req.params.timesheetId,
    },
    function (err) {
      if (err) {
        next(err);
      } else {
        res.status(204).send();
      }
    }
  );
});

module.exports = timesheetsRouter;
