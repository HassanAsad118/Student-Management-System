const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const { ObjectId } = require("mongodb");

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);

      req.session.userId = user._id.toString();

      req.session.save((saveError) => {
        if (saveError) return reject(saveError);
        resolve();
      });
    });
  });
}

function configureAuth(app) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("Add SESSION_SECRET to server/.env");
  }

  const store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    dbName: "student_management",
    collectionName: "sessions",
  });

  store.on("error", () => {
    console.error("Session database error.");
  });

  app.use(
    session({
      name: "sms.sid",
      secret: process.env.SESSION_SECRET,
      store,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60 * 8,
      },
    })
  );

  const router = express.Router();

  router.post("/register", async (req, res) => {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanName ||
      cleanName.length > 100 ||
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Enter a valid name and email address.",
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Use at least 8 characters and no more than 72 bytes for your password.",
      });
    }

    const users = req.app.locals.db.collection("users");

    const existingUser = await users.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: "user",
      createdAt: new Date(),
    };

    const result = await users.insertOne(user);
    user._id = result.insertedId;

    await startSession(req, user);

    res.status(201).json({ user: publicUser(user) });
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Enter your email and password.",
      });
    }

    const user = await req.app.locals.db
      .collection("users")
      .findOne({ email: email.trim().toLowerCase() });

    const validPassword =
      user && (await bcrypt.compare(password, user.passwordHash));

    if (!validPassword) {
      return res.status(401).json({
        message: "Incorrect email or password.",
      });
    }

    await startSession(req, user);

    res.json({ user: publicUser(user) });
  });

  router.get("/me", async (req, res) => {
    if (!req.session.userId) {
      return res.json({ user: null });
    }

    const user = await req.app.locals.db
      .collection("users")
      .findOne({ _id: new ObjectId(req.session.userId) });

    res.json({ user: user ? publicUser(user) : null });
  });

  router.post("/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);

      res.clearCookie("sms.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });

      res.json({ message: "Logged out successfully." });
    });
  });

  router.use((error, req, res, next) => {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Authentication error:", error.name);

    res.status(500).json({
      message: "Authentication request failed. Please try again.",
    });
  });

  app.use("/api/auth", router);

  // Protect every student route, including requests outside React.
  app.use("/api/students", async (req, res, next) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({
          message: "Please log in to continue.",
        });
      }

      const user = await req.app.locals.db
        .collection("users")
        .findOne({ _id: new ObjectId(req.session.userId) });

      if (!user) {
        return res.status(401).json({
          message: "Please log in again.",
        });
      }

      const readOnly = ["GET", "HEAD"].includes(req.method);

      if (!readOnly && user.role !== "admin") {
        return res.status(403).json({
          message: "Only admins can change student records.",
        });
      }

      next();
    } catch {
      res.status(500).json({
        message: "Unable to verify your login.",
      });
    }
  });
}

module.exports = configureAuth;