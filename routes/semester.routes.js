const semesterRoutes = require("express").Router();
const SemesterController = require("../controllers/semesters/semester.controller");

semesterRoutes.post("/semester", SemesterController.createSemester);
semesterRoutes.get("/semester", SemesterController.getAllSemester);
semesterRoutes.put("/semester/:id", SemesterController.updateSemester);
semesterRoutes.delete("/semester/:id", SemesterController.deleteSemester);

module.exports = { semesterRoutes };
