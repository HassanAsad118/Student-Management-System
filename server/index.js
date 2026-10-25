require("dotenv").config();

const express = require("express");

const { MongoClient, ObjectId } = require("mongodb");

const configureAuth = require("./auth");
const { validateStudent } = require("./studentValidation");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
configureAuth(app);


app.get("/api/health", (req, res) => {
  res.json({
    message: "Student Management API is running",
    database: "Connected",
  });
});

app.get("/api/students", async (req, res) => {
  try {
    const students = await app.locals.db
      .collection("students")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(students);
  } catch {
    res.status(500).json({
      message: "Unable to load students.",
    });
  }
});

app.post("/api/students", async (req, res) => {
  const { student: values, error } = validateStudent(req.body);
  if (error) return res.status(400).json({ message: error });

  const student = { ...values, createdAt: new Date() };

  try {
    const result = await app.locals.db.collection("students").insertOne(student);
    res.status(201).json({ ...student, _id: result.insertedId });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This Student ID is already assigned to another student." });
    }
    res.status(500).json({ message: "Unable to save the student." });
  }
});

// Validate the student ID before running routes that use :id.
app.param("id", (req, res, next, id) => {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({ message: "Invalid student ID." });
  }

  req.studentObjectId = new ObjectId(id);
  next();
});

// View one student.
app.get("/api/students/:id", async (req, res) => {
  try {
    const student = await app.locals.db
      .collection("students")
      .findOne({ _id: req.studentObjectId });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json(student);
  } catch {
    res.status(500).json({ message: "Unable to load student details." });
  }
});

// Update a student.
app.put("/api/students/:id", async (req, res) => {
  const { student: updates, error } = validateStudent(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const student = await app.locals.db.collection("students").findOneAndUpdate(
      { _id: req.studentObjectId },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This Student ID is already assigned to another student." });
    }
    res.status(500).json({ message: "Unable to update the student." });
  }
});

// Delete a student.
app.delete("/api/students/:id", async (req, res) => {
  try {
    const result = await app.locals.db
      .collection("students")
      .deleteOne({ _id: req.studentObjectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json({ message: "Student deleted successfully." });
  } catch {
    res.status(500).json({ message: "Unable to delete the student." });
  }
});

// Keep all API failures in the JSON format expected by React.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("API request failed:", error.name);
  const invalidJson = error.type === "entity.parse.failed";
  res.status(invalidJson ? 400 : 500).json({
    message: invalidJson
      ? "The request contains invalid JSON."
      : "The server could not complete the request. Please try again.",
  });
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in server/.env");
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();

    const db = client.db("student_management");
    await db.command({ ping: 1 });

    app.locals.db = db;
    await db.collection("users").createIndex(
      { email: 1 },
      { unique: true }
    );

    // Existing records may have no Student ID until an admin assigns one.
    // The partial index enforces uniqueness for every assigned ID.
    await db.collection("students").createIndex(
      { studentId: 1 },
      { unique: true, partialFilterExpression: { studentId: { $type: "string" } } }
    );

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed.");
    console.error("Error type:", error.name);

    await client.close();
    process.exit(1);
  }
}

startServer();
