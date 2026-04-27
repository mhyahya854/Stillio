import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { google } from "googleapis";
import driveHelper from "./drive.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const AUTH_URL = process.env.AUTH_URL || `http://localhost:${PORT}`;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";

if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
  console.warn("AUTH_GOOGLE_ID or AUTH_GOOGLE_SECRET not set. Auth will fail until configured.");
}
if (!process.env.AUTH_SECRET) {
  console.warn("AUTH_SECRET not set. Set AUTH_SECRET in environment for session security.");
}

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.use(
  session({
    secret: process.env.AUTH_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 7 },
  }),
);

function createOAuthClient() {
  return new google.auth.OAuth2({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
    redirectUri: `${AUTH_URL}/api/auth/callback/google`,
  });
}

app.get("/api/auth/login", (req, res) => {
  const oauth2Client = createOAuthClient();
  const state = crypto.randomBytes(12).toString("hex");
  req.session.oauthState = state;
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile", "https://www.googleapis.com/auth/drive.file"],
    state,
  });
  res.redirect(url);
});

app.get("/api/auth/callback/google", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.session.oauthState) {
    return res.status(400).send("Invalid state or missing code");
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    // tokens: { access_token, refresh_token, scope, token_type, expiry_date }
    req.session.tokens = tokens;
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();
    req.session.user = { id: data.id, email: data.email, name: data.name, picture: data.picture };

    // Redirect back to client app
    res.redirect(process.env.CLIENT_ORIGIN || CLIENT_ORIGIN);
  } catch (err) {
    console.error("Auth callback error:", err);
    res.status(500).send("Authentication failed");
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('session destroy error', err);
      return res.status(500).json({ error: 'logout_failed' });
    }
    res.json({ ok: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'not_authenticated' });
  res.json({ user: req.session.user });
});

async function getClientWithFreshTokens(req) {
  const tokens = req.session.tokens;
  if (!tokens) throw { code: 'not_authenticated' };
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);

  // Refresh if missing expiry or expired
  const needsRefresh = !tokens.expiry_date || Date.now() > tokens.expiry_date - 60000;
  if (needsRefresh) {
    if (!tokens.refresh_token) throw { code: 'no_refresh_token' };
    try {
      const refreshed = await oauth2Client.refreshToken(tokens.refresh_token);
      const newCreds = refreshed.credentials || refreshed;
      req.session.tokens = { ...tokens, ...newCreds };
      oauth2Client.setCredentials(req.session.tokens);
    } catch (err) {
      console.error('token refresh failed', err);
      throw { code: 'token_refresh_failed' };
    }
  }
  return oauth2Client;
}

function ensureAuth(handler) {
  return async (req, res) => {
    if (!req.session || !req.session.tokens) return res.status(401).json({ error: 'not_authenticated' });
    try {
      const client = await getClientWithFreshTokens(req);
      return handler(req, res, client);
    } catch (err) {
      const code = err && err.code ? err.code : 'internal_error';
      if (code === 'no_refresh_token') return res.status(401).json({ error: 'missing_refresh_token' });
      if (code === 'token_refresh_failed') return res.status(401).json({ error: 'token_refresh_failed' });
      console.error('ensureAuth error', err);
      return res.status(500).json({ error: code });
    }
  };
}

app.get('/api/drive/load', ensureAuth(async (req, res, client) => {
  try {
    const data = await driveHelper.loadSyncJson(client);
    if (!data) return res.status(404).json({ error: 'file_not_found' });
    res.json({ fileId: data.fileId, data: data.data });
  } catch (err) {
    console.error('drive load error', err);
    res.status(500).json({ error: 'drive_error' });
  }
}));

app.post('/api/drive/save', ensureAuth(async (req, res, client) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'invalid_payload' });
  try {
    const fileId = await driveHelper.saveSyncJson(client, payload);
    res.json({ ok: true, fileId });
  } catch (err) {
    console.error('drive save error', err);
    res.status(500).json({ error: 'drive_error' });
  }
}));

app.delete('/api/drive/delete', ensureAuth(async (req, res, client) => {
  try {
    const deleted = await driveHelper.deleteSyncFile(client);
    res.json({ ok: true, deleted });
  } catch (err) {
    console.error('drive delete error', err);
    res.status(500).json({ error: 'drive_error' });
  }
}));

app.listen(PORT, () => {
  console.log(`Auth/Drive server listening on http://localhost:${PORT}`);
});
