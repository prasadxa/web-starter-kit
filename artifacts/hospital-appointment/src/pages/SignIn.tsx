import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartPulse, Mail, Phone, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Clock, Star, KeyRound, CheckCircle2, ShieldCheck } from "lucide-react";

type ForgotStep = "request" | "otp" | "newpass" | "success";
type RegStep = "form" | "otp" | "done";

function OtpInputGroup({ length = 6, value, onChange }: { length?: number; value: string; onChange: (v: string) => void }) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = value.split("");
    while (arr.length < length) arr.push("");
    arr[idx] = char;
    const next = arr.join("").slice(0, length);
    onChange(next);
    if (char && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-13 text-center text-xl font-bold border-2 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-background"
        />
      ))}
    </div>
  );
}

export default function SignIn() {
  const [, navigate] = useLocation();

  const [loginMode, setLoginMode] = useState<"email" | "phone">("email");
  const [registerMode, setRegisterMode] = useState<"email" | "phone">("email");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regStep, setRegStep] = useState<RegStep>("form");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regOtp, setRegOtp] = useState("");
  const [regOtpDisplay, setRegOtpDisplay] = useState("");
  const [regResendTimer, setRegResendTimer] = useState(0);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");
  const [forgotMode, setForgotMode] = useState<"email" | "phone">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotOtpDisplay, setForgotOtpDisplay] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotResendTimer, setForgotResendTimer] = useState(0);

  useEffect(() => {
    if (regResendTimer > 0) {
      const t = setTimeout(() => setRegResendTimer(regResendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [regResendTimer]);

  useEffect(() => {
    if (forgotResendTimer > 0) {
      const t = setTimeout(() => setForgotResendTimer(forgotResendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [forgotResendTimer]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    const emailOrPhone = loginMode === "email" ? loginEmail : loginPhone;
    if (!emailOrPhone || !loginPassword) {
      setLoginError("Please fill in all fields");
      setLoginLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailOrPhone, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        setLoginLoading(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setLoginError("Something went wrong. Please try again.");
      setLoginLoading(false);
    }
  }

  async function handleSendRegOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setRegError("");
    setRegLoading(true);

    if (!regFirstName.trim()) {
      setRegError("First name is required");
      setRegLoading(false);
      return;
    }

    const identifier = registerMode === "email" ? regEmail : regPhone;
    if (!identifier) {
      setRegError(registerMode === "email" ? "Email is required" : "Phone number is required");
      setRegLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters");
      setRegLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match");
      setRegLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: identifier, purpose: "register" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Failed to send OTP");
        setRegLoading(false);
        return;
      }

      if (data.otp) {
        setRegOtpDisplay(data.otp);
      }
      setRegStep("otp");
      setRegResendTimer(60);
    } catch {
      setRegError("Something went wrong. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleResendRegOtp() {
    setRegError("");
    setRegLoading(true);

    const identifier = registerMode === "email" ? regEmail : regPhone;

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: identifier, purpose: "register" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Failed to resend OTP");
        setRegLoading(false);
        return;
      }

      if (data.otp) {
        setRegOtpDisplay(data.otp);
      }
      setRegOtp("");
      setRegResendTimer(60);
    } catch {
      setRegError("Something went wrong.");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleVerifyRegOtp() {
    setRegError("");
    setRegLoading(true);

    if (regOtp.length !== 6) {
      setRegError("Please enter the complete 6-digit OTP");
      setRegLoading(false);
      return;
    }

    const identifier = registerMode === "email" ? regEmail : regPhone;

    try {
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: identifier, otp: regOtp, purpose: "register" }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setRegError(verifyData.error || "Invalid OTP");
        setRegLoading(false);
        return;
      }

      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: registerMode === "email" ? regEmail : undefined,
          phone: registerMode === "phone" ? regPhone : undefined,
          password: regPassword,
          firstName: regFirstName,
          lastName: regLastName || undefined,
          otpVerified: true,
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        setRegError(regData.error || "Registration failed");
        setRegLoading(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setRegError("Something went wrong. Please try again.");
      setRegLoading(false);
    }
  }

  async function handleForgotRequest(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    const emailOrPhone = forgotMode === "email" ? forgotEmail : forgotPhone;
    if (!emailOrPhone) {
      setForgotError("Please enter your email or phone number");
      setForgotLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Request failed");
        setForgotLoading(false);
        return;
      }

      if (data.otp) {
        setForgotOtpDisplay(data.otp);
      }

      setForgotStep("otp");
      setForgotResendTimer(60);
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResendForgotOtp() {
    setForgotError("");
    setForgotLoading(true);

    const emailOrPhone = forgotMode === "email" ? forgotEmail : forgotPhone;

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Failed to resend OTP");
        setForgotLoading(false);
        return;
      }

      if (data.otp) {
        setForgotOtpDisplay(data.otp);
      }
      setForgotOtp("");
      setForgotResendTimer(60);
    } catch {
      setForgotError("Something went wrong.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleVerifyForgotOtp() {
    setForgotError("");

    if (forgotOtp.length !== 6) {
      setForgotError("Please enter the complete 6-digit OTP");
      return;
    }

    setForgotStep("newpass");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters");
      setForgotLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords do not match");
      setForgotLoading(false);
      return;
    }

    const emailOrPhone = forgotMode === "email" ? forgotEmail : forgotPhone;

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, otp: forgotOtp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Reset failed");
        setForgotLoading(false);
        return;
      }

      setForgotStep("success");
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  function resetForgotState() {
    setShowForgotPassword(false);
    setForgotStep("request");
    setForgotEmail("");
    setForgotPhone("");
    setForgotError("");
    setForgotOtp("");
    setForgotOtpDisplay("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
    setForgotResendTimer(0);
  }

  function resetRegState() {
    setRegStep("form");
    setRegOtp("");
    setRegOtpDisplay("");
    setRegError("");
    setRegResendTimer(0);
  }

  function renderOtpVerifyCard({
    title,
    subtitle,
    identifier,
    otpDisplay,
    otp,
    setOtp,
    error,
    loading,
    resendTimer,
    onVerify,
    onResend,
    onBack,
  }: {
    title: string;
    subtitle: string;
    identifier: string;
    otpDisplay: string;
    otp: string;
    setOtp: (v: string) => void;
    error: string;
    loading: boolean;
    resendTimer: number;
    onVerify: () => void;
    onResend: () => void;
    onBack: () => void;
  }) {
    return (
      <Card className="border-0 shadow-xl shadow-black/5 rounded-2xl">
        <CardHeader className="pb-4 pt-6 px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              <p className="text-muted-foreground text-sm">{subtitle}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">OTP sent to</p>
            <p className="font-semibold text-foreground">{identifier}</p>
          </div>

          {otpDisplay && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-emerald-600 mb-1">Demo Mode — Your OTP:</p>
              <p className="text-2xl font-mono font-bold text-emerald-700 tracking-[0.3em]">{otpDisplay}</p>
              <p className="text-xs text-emerald-500 mt-1">In production, this would be sent via SMS/Email</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-3 block text-center">Enter 6-digit OTP</Label>
            <OtpInputGroup value={otp} onChange={setOtp} />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <Button
            type="button"
            onClick={onVerify}
            className="w-full h-11 rounded-xl font-semibold text-base shadow-lg shadow-primary/20"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Verify OTP <CheckCircle2 className="w-4 h-4" />
              </span>
            )}
          </Button>

          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend OTP in <span className="font-semibold text-primary">{resendTimer}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={onResend}
                disabled={loading}
                className="text-sm text-primary font-semibold hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderForgotPassword() {
    return (
      <Card className="border-0 shadow-xl shadow-black/5 rounded-2xl">
        {forgotStep === "request" && (
          <>
            <CardHeader className="pb-4 pt-6 px-6">
              <button
                type="button"
                onClick={resetForgotState}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
              <h2 className="text-2xl font-bold text-foreground">Forgot Password?</h2>
              <p className="text-muted-foreground text-sm">We'll send a 6-digit OTP to verify your identity</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setForgotMode("email")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                      forgotMode === "email"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotMode("phone")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                      forgotMode === "phone"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                </div>

                {forgotMode === "email" ? (
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 h-11 rounded-xl"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="forgot-phone" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="forgot-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="pl-10 h-11 rounded-xl"
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {forgotError && (
                  <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
                    {forgotError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl font-semibold text-base shadow-lg shadow-primary/20"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending OTP...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send OTP <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {forgotStep === "otp" && (
          <>
            <CardHeader className="pb-4 pt-6 px-6">
              <button
                type="button"
                onClick={() => { setForgotStep("request"); setForgotError(""); setForgotOtp(""); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Verify OTP</h2>
                  <p className="text-muted-foreground text-sm">Enter the OTP to reset your password</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-5">
              <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                <p className="text-sm text-muted-foreground">OTP sent to</p>
                <p className="font-semibold text-foreground">{forgotMode === "email" ? forgotEmail : forgotPhone}</p>
              </div>
              {forgotOtpDisplay && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-emerald-600 mb-1">Demo Mode — Your OTP:</p>
                  <p className="text-2xl font-mono font-bold text-emerald-700 tracking-[0.3em]">{forgotOtpDisplay}</p>
                  <p className="text-xs text-emerald-500 mt-1">In production, this would be sent via SMS/Email</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium mb-3 block text-center">Enter 6-digit OTP</Label>
                <OtpInputGroup value={forgotOtp} onChange={setForgotOtp} />
              </div>
              {forgotError && (
                <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
                  {forgotError}
                </div>
              )}
              <Button
                type="button"
                onClick={handleVerifyForgotOtp}
                className="w-full h-11 rounded-xl font-semibold text-base shadow-lg shadow-primary/20"
                disabled={forgotLoading || forgotOtp.length !== 6}
              >
                <span className="flex items-center gap-2">
                  Verify OTP <CheckCircle2 className="w-4 h-4" />
                </span>
              </Button>
              <div className="text-center">
                {forgotResendTimer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend OTP in <span className="font-semibold text-primary">{forgotResendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendForgotOtp}
                    disabled={forgotLoading}
                    className="text-sm text-primary font-semibold hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </CardContent>
          </>
        )}

        {forgotStep === "newpass" && (
          <>
            <CardHeader className="pb-4 pt-6 px-6">
              <button
                type="button"
                onClick={() => { setForgotStep("otp"); setForgotError(""); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">OTP Verified</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Set New Password</h2>
              <p className="text-muted-foreground text-sm">Choose a strong password for your account</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      className="pl-10 pr-10 h-11 rounded-xl"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password" className="text-sm font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="Re-enter new password"
                      className="pl-10 h-11 rounded-xl"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                {forgotError && (
                  <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
                    {forgotError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl font-semibold text-base shadow-lg shadow-primary/20"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Reset Password <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {forgotStep === "success" && (
          <CardContent className="px-6 py-10 text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset!</h2>
            <p className="text-muted-foreground text-sm mb-6">Your password has been reset successfully. You can now sign in with your new password.</p>
            <Button
              onClick={resetForgotState}
              className="h-11 rounded-xl font-semibold px-8 shadow-lg shadow-primary/20"
            >
              Back to Sign In <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-4rem)] flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-blue-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <HeartPulse className="w-10 h-10" />
              </div>
              <span className="font-display font-bold text-4xl tracking-tight">
                MediBook
              </span>
            </div>

            <h1 className="text-3xl font-bold mb-4 leading-tight">
              Your Health,<br />Our Priority
            </h1>
            <p className="text-white/80 text-lg mb-12 max-w-md">
              Access world-class healthcare from top-rated hospitals. Book appointments with the best doctors instantly.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Verified Doctors</h3>
                  <p className="text-white/70 text-sm">All our doctors are verified with proper credentials and certifications</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Instant Booking</h3>
                  <p className="text-white/70 text-sm">Book appointments in seconds, no waiting or phone calls needed</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Top-Rated Hospitals</h3>
                  <p className="text-white/70 text-sm">Partner hospitals with the highest ratings and patient satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-b from-background to-muted/30">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
              <div className="bg-primary/10 p-2 rounded-xl">
                <HeartPulse className="w-7 h-7 text-primary" />
              </div>
              <span className="font-display font-bold text-3xl tracking-tight text-foreground">
                Medi<span className="text-primary">Book</span>
              </span>
            </div>

            {showForgotPassword ? (
              renderForgotPassword()
            ) : regStep === "otp" ? (
              renderOtpVerifyCard({
                title: "Verify Your " + (registerMode === "email" ? "Email" : "Phone"),
                subtitle: "Enter the OTP to complete registration",
                identifier: registerMode === "email" ? regEmail : regPhone,
                otpDisplay: regOtpDisplay,
                otp: regOtp,
                setOtp: setRegOtp,
                error: regError,
                loading: regLoading,
                resendTimer: regResendTimer,
                onVerify: handleVerifyRegOtp,
                onResend: handleResendRegOtp,
                onBack: resetRegState,
              })
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/60 p-1">
                  <TabsTrigger value="login" className="rounded-lg font-semibold text-sm data-[state=active]:shadow-md">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg font-semibold text-sm data-[state=active]:shadow-md">
                    Create Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <Card className="border-0 shadow-xl shadow-black/5 rounded-2xl">
                    <CardHeader className="pb-4 pt-6 px-6">
                      <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                      <p className="text-muted-foreground text-sm">Sign in to manage your appointments</p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setLoginMode("email")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                              loginMode === "email"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Mail className="w-4 h-4" /> Email
                          </button>
                          <button
                            type="button"
                            onClick={() => setLoginMode("phone")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                              loginMode === "phone"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Phone className="w-4 h-4" /> Phone
                          </button>
                        </div>

                        {loginMode === "email" ? (
                          <div className="space-y-2">
                            <Label htmlFor="login-email" className="text-sm font-medium">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="login-email"
                                type="email"
                                placeholder="you@example.com"
                                className="pl-10 h-11 rounded-xl"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="login-phone" className="text-sm font-medium">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="login-phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                className="pl-10 h-11 rounded-xl"
                                value={loginPhone}
                                onChange={(e) => setLoginPhone(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-xs text-primary font-semibold hover:underline"
                            >
                              Forgot Password?
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pl-10 pr-10 h-11 rounded-xl"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {loginError && (
                          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
                            {loginError}
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full h-11 rounded-xl font-semibold text-base shadow-lg shadow-primary/20"
                          disabled={loginLoading}
                        >
                          {loginLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Signing in...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Sign In <ArrowRight className="w-4 h-4" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="register" className="mt-6">
                  <Card className="border-0 shadow-xl shadow-black/5 rounded-2xl">
                    <CardHeader className="pb-4 pt-6 px-6">
                      <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
                      <p className="text-muted-foreground text-sm">Join MediBook to book appointments instantly</p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <form onSubmit={handleSendRegOtp} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="reg-firstname" className="text-sm font-medium">First Name *</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="reg-firstname"
                                placeholder="John"
                                className="pl-10 h-11 rounded-xl"
                                value={regFirstName}
                                onChange={(e) => setRegFirstName(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-lastname" className="text-sm font-medium">Last Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="reg-lastname"
                                placeholder="Doe"
                                className="pl-10 h-11 rounded-xl"
                                value={regLastName}
                                onChange={(e) => setRegLastName(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setRegisterMode("email")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                              registerMode === "email"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Mail className="w-4 h-4" /> Email
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegisterMode("phone")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                              registerMode === "phone"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Phone className="w-4 h-4" /> Phone
                          </button>
                        </div>

                        {registerMode === "email" ? (
                          <div className="space-y-2">
                            <Label htmlFor="reg-email" className="text-sm font-medium">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="reg-email"
                                type="email"
                                placeholder="you@example.com"
                                className="pl-10 h-11 rounded-xl"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="reg-phone" className="text-sm font-medium">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="reg-phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                className="pl-10 h-11 rounded-xl"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="reg-password" className="text-sm font-medium">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="reg-password"
                              type={showRegPassword ? "text" : "password"}
                              placeholder="Min. 6 characters"
                              className="pl-10 pr-10 h-11 rounded-xl"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="reg-confirm-password"
                              type="password"
                              placeholder="Re-enter password"
                              className="pl-10 h-11 rounded-xl"
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                            />
                          </div>
                        </div>

                        {regError && (
                          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
                            {regError}
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full h-11 rounded-xl font-semibold text-base shadow-lg shadow-primary/20"
                          disabled={regLoading}
                        >
                          {regLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending OTP...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Send OTP & Verify <ShieldCheck className="w-4 h-4" />
                            </span>
                          )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                          A 6-digit OTP will be sent to verify your {registerMode === "email" ? "email" : "phone number"}
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
