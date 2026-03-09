import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-distributed-secret-key";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const secureCookie = process.env.SESSION_COOKIE_SECURE === "true";
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "local-session-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: secureCookie,
      sameSite: secureCookie ? "none" : "lax",
      maxAge: sessionTtl,
    },
  });
}

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await authStorage.getUserByUsername(username);
        if (!user || user.password !== hashPassword(password)) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await authStorage.getUser(payload.sub);
          if (user) return done(null, user);
          return done(null, false);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await authStorage.getUser(id);
      cb(null, user);
    } catch (err) {
      cb(err);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email } = req.body;
      const existing = await authStorage.getUserByUsername(username);
      if (existing) return res.status(400).json({ message: "Username taken" });

      const user = await authStorage.createUser({
        username,
        password: hashPassword(password),
        email,
      });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        res.status(201).json(user);
      });
    } catch (err) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Auth failed" });

      req.login(user, (err) => {
        if (err) return next(err);
        const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1d" });
        res.json({ user, token });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.sendStatus(200);
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  
  passport.authenticate("jwt", { session: false }, (err: any, user: any) => {
    if (err || !user) return res.status(401).json({ message: "Unauthorized" });
    req.user = user;
    next();
  })(req, res, next);
};
