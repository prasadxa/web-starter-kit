import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartPulse, Mail, Phone, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Clock, Star, KeyRound, CheckCircle2 } from "lucide-react";

type ForgotStep = "request" | "verify" | "success";

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

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");
  const [forgotMode, setForgotMode] = useState<"email" | "phone">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);

    if (!regFirstName.trim()) {
      setRegError("First name is required");
      setRegLoading(false);
      return;
    }

    if (registerMode === "email" && !regEmail) {
      setRegError("Email is required");
      setRegLoading(false);
      return;
    }

    if (registerMode === "phone" && !regPhone) {
      setRegError("Phone number is required");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: registerMode === "email" ? regEmail : undefined,
          phone: registerMode === "phone" ? regPhone : undefined,
          password: regPassword,
          firstName: regFirstName,
          lastName: regLastName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Registration failed");
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

      if (data.resetToken) {
        setResetCode(data.resetToken);
      }

      setForgotStep("verify");
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    if (!resetCode) {
      setForgotError("Please enter the reset code");
      setForgotLoading(false);
      return;
    }

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
        body: JSON.stringify({ emailOrPhone, resetToken: resetCode, newPassword }),
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
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
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
              <p className="text-muted-foreground text-sm">Enter your email or phone number and we'll send you a reset code</p>
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
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send Reset Code <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {forgotStep === "verify" && (
          <>
            <CardHeader className="pb-4 pt-6 px-6">
              <button
                type="button"
                onClick={() => { setForgotStep("request"); setForgotError(""); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
              <p className="text-muted-foreground text-sm">Enter the 6-character reset code and your new password</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {resetCode && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Your reset code:</p>
                  <p className="text-2xl font-mono font-bold text-primary tracking-[0.3em] text-center">{resetCode}</p>
                  <p className="text-xs text-muted-foreground mt-1 text-center">This code expires in 30 minutes</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-code" className="text-sm font-medium">Reset Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-code"
                      placeholder="Enter 6-character code"
                      className="pl-10 h-11 rounded-xl font-mono tracking-wider uppercase"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

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
          <>
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
          </>
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
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
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
                          className="w-full h-11 rounded-xl font-semibold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
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
                      <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
                      <p className="text-muted-foreground text-sm">Start booking appointments in minutes</p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="reg-first-name" className="text-sm font-medium">First Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="reg-first-name"
                                placeholder="John"
                                className="pl-10 h-11 rounded-xl"
                                value={regFirstName}
                                onChange={(e) => setRegFirstName(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-last-name" className="text-sm font-medium">Last Name</Label>
                            <Input
                              id="reg-last-name"
                              placeholder="Doe"
                              className="h-11 rounded-xl"
                              value={regLastName}
                              onChange={(e) => setRegLastName(e.target.value)}
                            />
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
                              placeholder="Re-enter your password"
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
                          className="w-full h-11 rounded-xl font-semibold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                          disabled={regLoading}
                        >
                          {regLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating account...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Create Account <ArrowRight className="w-4 h-4" />
                            </span>
                          )}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center mt-4">
                          By creating an account, you agree to our Terms of Service and Privacy Policy
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
