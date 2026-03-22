import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  ExchangeMobileAuthorizationCodeBody,
  ExchangeMobileAuthorizationCodeResponse,
  LogoutMobileSessionResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  ISSUER_URL,
  type SessionData,
} from "../lib/auth";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) return { allowed: true };

  if (now - record.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfter = Math.ceil((LOCKOUT_DURATION - (now - record.lastAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

function recordFailedAttempt(identifier: string) {
  const now = Date.now();
  const record = loginAttempts.get(identifier);
  if (record) {
    record.count += 1;
    record.lastAttempt = now;
  } else {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
  }
}

function clearFailedAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "").trim();
}

interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  data?: Record<string, any>;
}

const otpStore = new Map<string, OtpRecord>();
const OTP_TTL = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function sendOtp(identifier: string, data?: Record<string, any>): string {
  const otp = generateOtp();
  otpStore.set(identifier, {
    otp,
    expiresAt: Date.now() + OTP_TTL,
    attempts: 0,
    verified: false,
    data,
  });
  return otp;
}

function verifyOtp(identifier: string, otp: string): { valid: boolean; error?: string; data?: Record<string, any> } {
  const record = otpStore.get(identifier);
  if (!record) {
    return { valid: false, error: "No OTP found. Please request a new one." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(identifier);
    return { valid: false, error: "OTP has expired. Please request a new one." };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(identifier);
    return { valid: false, error: "Too many failed attempts. Please request a new OTP." };
  }

  record.attempts += 1;

  if (record.otp !== otp) {
    return { valid: false, error: "Invalid OTP. Please try again." };
  }

  record.verified = true;
  return { valid: true, data: record.data };
}

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

async function upsertUser(claims: Record<string, unknown>) {
  const replitUserId = claims.sub as string;
  const userData = {
    id: replitUserId,
    replitUserId,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as
      | string
      | null,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        replitUserId: userData.replitUserId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

router.post("/auth/otp/send", async (req: Request, res: Response) => {
  try {
    const { emailOrPhone: rawEmailOrPhone, purpose } = req.body;

    if (!rawEmailOrPhone) {
      res.status(400).json({ error: "Email or phone number is required" });
      return;
    }

    if (!purpose || !["register", "forgot-password"].includes(purpose)) {
      res.status(400).json({ error: "Invalid purpose" });
      return;
    }

    const isEmail = rawEmailOrPhone.includes("@");
    const emailOrPhone = isEmail
      ? normalizeEmail(rawEmailOrPhone)
      : normalizePhone(rawEmailOrPhone);

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailOrPhone)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }
    } else {
      const phoneClean = emailOrPhone.replace(/\+/g, "");
      if (phoneClean.length < 7 || phoneClean.length > 15 || !/^\+?\d+$/.test(emailOrPhone)) {
        res.status(400).json({ error: "Invalid phone number format" });
        return;
      }
    }

    const rateKey = `otp:${purpose}:${emailOrPhone}`;
    const rateCheck = checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: `Too many OTP requests. Please try again in ${Math.ceil(rateCheck.retryAfter! / 60)} minutes.`,
      });
      return;
    }

    const condition = isEmail
      ? eq(usersTable.email, emailOrPhone)
      : eq(usersTable.phone, emailOrPhone);

    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(condition);

    if (purpose === "register" && existingUser) {
      res.status(409).json({ error: "An account with this email or phone already exists" });
      return;
    }

    if (purpose === "forgot-password" && !existingUser) {
      res.json({
        message: "If an account exists, an OTP has been sent.",
        otp: null,
      });
      return;
    }

    const otpKey = `${purpose}:${emailOrPhone}`;
    const otp = sendOtp(otpKey);

    req.log.info({ identifier: emailOrPhone, purpose, otp }, "OTP generated");

    res.json({
      message: isEmail
        ? `OTP sent to ${emailOrPhone}`
        : `OTP sent to ${emailOrPhone.slice(0, 3)}****${emailOrPhone.slice(-2)}`,
      otp,
    });
  } catch (err: any) {
    req.log.error({ err }, "OTP send error");
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

router.post("/auth/otp/verify", async (req: Request, res: Response) => {
  try {
    const { emailOrPhone: rawEmailOrPhone, otp, purpose } = req.body;

    if (!rawEmailOrPhone || !otp || !purpose) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const isEmail = rawEmailOrPhone.includes("@");
    const emailOrPhone = isEmail
      ? normalizeEmail(rawEmailOrPhone)
      : normalizePhone(rawEmailOrPhone);

    const otpKey = `${purpose}:${emailOrPhone}`;
    const result = verifyOtp(otpKey, otp);

    if (!result.valid) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ verified: true, message: "OTP verified successfully" });
  } catch (err: any) {
    req.log.error({ err }, "OTP verify error");
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email: rawEmail, phone: rawPhone, password, firstName, lastName, otpVerified } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    if (!rawEmail && !rawPhone) {
      res.status(400).json({ error: "Email or phone number is required" });
      return;
    }

    const email = rawEmail ? normalizeEmail(rawEmail) : null;
    const phone = rawPhone ? normalizePhone(rawPhone) : null;

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }
    }

    if (phone) {
      const phoneClean = phone.replace(/\+/g, "");
      if (phoneClean.length < 7 || phoneClean.length > 15 || !/^\+?\d+$/.test(phone)) {
        res.status(400).json({ error: "Invalid phone number format" });
        return;
      }
    }

    const identifier = email || phone || "";
    const otpKey = `register:${identifier}`;
    const otpRecord = otpStore.get(otpKey);
    if (!otpRecord || !otpRecord.verified) {
      res.status(400).json({ error: "Please verify your email or phone with OTP first" });
      return;
    }

    otpStore.delete(otpKey);

    const conditions = [];
    if (email) conditions.push(eq(usersTable.email, email));
    if (phone) conditions.push(eq(usersTable.phone, phone));

    const existing = await db
      .select()
      .from(usersTable)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions));

    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email or phone already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(usersTable)
      .values({
        email,
        phone,
        passwordHash,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        emailVerified: email ? true : false,
        phoneVerified: phone ? true : false,
      } as any)
      .returning();

    const sessionData: SessionData = {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        profileImageUrl: newUser.profileImageUrl,
        role: newUser.role,
        hospitalId: newUser.hospitalId ?? null,
        doctorId: newUser.doctorId ?? null,
      },
      access_token: "local",
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.json({ user: sessionData.user });
  } catch (err: any) {
    req.log.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { emailOrPhone: rawEmailOrPhone, password } = req.body;

    if (!rawEmailOrPhone || !password) {
      res.status(400).json({ error: "Email/phone and password are required" });
      return;
    }

    const isEmail = rawEmailOrPhone.includes("@");
    const emailOrPhone = isEmail
      ? normalizeEmail(rawEmailOrPhone)
      : normalizePhone(rawEmailOrPhone);

    const rateCheck = checkRateLimit(emailOrPhone);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: `Too many login attempts. Please try again in ${Math.ceil(rateCheck.retryAfter! / 60)} minutes.`,
      });
      return;
    }

    const condition = isEmail
      ? eq(usersTable.email, emailOrPhone)
      : eq(usersTable.phone, emailOrPhone);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(condition);

    if (!user || !user.passwordHash) {
      recordFailedAttempt(emailOrPhone);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      recordFailedAttempt(emailOrPhone);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    clearFailedAttempts(emailOrPhone);

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        hospitalId: user.hospitalId ?? null,
        doctorId: user.doctorId ?? null,
      },
      access_token: "local",
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.json({ user: sessionData.user });
  } catch (err: any) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { emailOrPhone: rawEmailOrPhone } = req.body;

    if (!rawEmailOrPhone) {
      res.status(400).json({ error: "Email or phone number is required" });
      return;
    }

    const isEmail = rawEmailOrPhone.includes("@");
    const emailOrPhone = isEmail
      ? normalizeEmail(rawEmailOrPhone)
      : normalizePhone(rawEmailOrPhone);

    const rateCheck = checkRateLimit(`reset:${emailOrPhone}`);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: `Too many reset attempts. Please try again in ${Math.ceil(rateCheck.retryAfter! / 60)} minutes.`,
      });
      return;
    }

    const condition = isEmail
      ? eq(usersTable.email, emailOrPhone)
      : eq(usersTable.phone, emailOrPhone);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(condition);

    if (!user) {
      res.json({ message: "If an account exists, an OTP has been sent.", otp: null });
      return;
    }

    const otpKey = `forgot-password:${emailOrPhone}`;
    const otp = sendOtp(otpKey);

    req.log.info({ userId: user.id, otp }, "Password reset OTP generated");

    res.json({
      message: "If an account exists, an OTP has been sent.",
      otp,
    });
  } catch (err: any) {
    req.log.error({ err }, "Forgot password error");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { emailOrPhone: rawEmailOrPhone, otp, newPassword } = req.body;

    if (!rawEmailOrPhone || !otp || !newPassword) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const isEmail = rawEmailOrPhone.includes("@");
    const emailOrPhone = isEmail
      ? normalizeEmail(rawEmailOrPhone)
      : normalizePhone(rawEmailOrPhone);

    const otpKey = `forgot-password:${emailOrPhone}`;
    const otpResult = verifyOtp(otpKey, otp);

    if (!otpResult.valid) {
      recordFailedAttempt(`reset:${emailOrPhone}`);
      res.status(400).json({ error: otpResult.error });
      return;
    }

    const condition = isEmail
      ? eq(usersTable.email, emailOrPhone)
      : eq(usersTable.phone, emailOrPhone);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(condition);

    if (!user) {
      res.status(400).json({ error: "Account not found" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(usersTable)
      .set({ passwordHash } as any)
      .where(eq(usersTable.id, user.id));

    otpStore.delete(otpKey);
    clearFailedAttempts(`reset:${emailOrPhone}`);

    res.json({ message: "Password has been reset successfully. You can now sign in." });
  } catch (err: any) {
    req.log.error({ err }, "Reset password error");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/auth/me", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/register", async (req: Request, res: Response) => {
  res.redirect("/sign-in");
});

router.get("/login", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
    state,
    nonce,
  });

  setOidcCookie(res, "code_verifier", codeVerifier);
  setOidcCookie(res, "nonce", nonce);
  setOidcCookie(res, "state", state);
  setOidcCookie(res, "return_to", returnTo);

  res.redirect(redirectTo.href);
});

// Query params are not validated because the OIDC provider may include
// parameters not expressed in the schema.
router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const codeVerifier = req.cookies?.code_verifier;
  const nonce = req.cookies?.nonce;
  const expectedState = req.cookies?.state;

  if (!codeVerifier || !expectedState) {
    res.redirect("/api/login");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch {
    res.redirect("/api/login");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  res.clearCookie("code_verifier", { path: "/" });
  res.clearCookie("nonce", { path: "/" });
  res.clearCookie("state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/api/login");
    return;
  }

  const dbUser = await upsertUser(
    claims as unknown as Record<string, unknown>,
  );

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      role: dbUser.role,
      hospitalId: dbUser.hospitalId ?? null,
      doctorId: dbUser.doctorId ?? null,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

router.post(
  "/mobile-auth/token-exchange",
  async (req: Request, res: Response) => {
    const parsed = ExchangeMobileAuthorizationCodeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid required parameters" });
      return;
    }

    const { code, code_verifier, redirect_uri, state, nonce } = parsed.data;

    try {
      const config = await getOidcConfig();

      const callbackUrl = new URL(redirect_uri);
      callbackUrl.searchParams.set("code", code);
      callbackUrl.searchParams.set("state", state);
      callbackUrl.searchParams.set("iss", ISSUER_URL);

      const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: code_verifier,
        expectedNonce: nonce ?? undefined,
        expectedState: state,
        idTokenExpected: true,
      });

      const claims = tokens.claims();
      if (!claims) {
        res.status(401).json({ error: "No claims in ID token" });
        return;
      }

      const dbUser = await upsertUser(
        claims as unknown as Record<string, unknown>,
      );

      const now = Math.floor(Date.now() / 1000);
      const sessionData: SessionData = {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
          role: dbUser.role,
          hospitalId: dbUser.hospitalId ?? null,
          doctorId: dbUser.doctorId ?? null,
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
      };

      const sid = await createSession(sessionData);
      res.json(ExchangeMobileAuthorizationCodeResponse.parse({ token: sid }));
    } catch (err) {
      req.log.error({ err }, "Mobile token exchange error");
      res.status(500).json({ error: "Token exchange failed" });
    }
  },
);

router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json(LogoutMobileSessionResponse.parse({ success: true }));
});

export default router;
