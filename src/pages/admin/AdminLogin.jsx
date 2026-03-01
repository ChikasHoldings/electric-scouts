import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle, Mail, KeyRound } from "lucide-react";

export default function AdminLogin() {
  const { login, isAuthenticated, profile, isLoadingAuth, isLoadingProfile } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset flow state: "login" | "request" | "verify" | "newpassword" | "success"
  const [resetStep, setResetStep] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState(["", "", "", "", "", ""]);
  const [verificationToken, setVerificationToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const codeInputRefs = useRef([]);

  // If already logged in as admin, redirect
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingProfile && isAuthenticated && ["admin", "editor", "viewer"].includes(profile?.role)) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, profile, isLoadingAuth, isLoadingProfile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      // login() now fetches profile before returning
      // The useEffect above will handle the redirect once profile is set
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
      setIsLoading(false);
    }
  };

  // ─── Reset Flow Handlers ──────────────────────────────────────

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      const resp = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email: resetEmail }),
      });
      const data = await resp.json();

      if (resp.ok && data.success) {
        setResetStep("verify");
        setResetSuccess("A 6-digit code has been sent to your email.");
      } else {
        setResetError(data.error || "Failed to send reset code.");
      }
    } catch (err) {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...resetCode];
    newCode[index] = digit;
    setResetCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !resetCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...resetCode];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || "";
    }
    setResetCode(newCode);
    if (pasted.length >= 6) {
      codeInputRefs.current[5]?.focus();
    } else {
      codeInputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    const code = resetCode.join("");
    if (code.length !== 6) {
      setResetError("Please enter the full 6-digit code.");
      setResetLoading(false);
      return;
    }

    try {
      const resp = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email: resetEmail, code }),
      });
      const data = await resp.json();

      if (resp.ok && data.success) {
        setVerificationToken(data.verification_token);
        setResetStep("newpassword");
        setResetSuccess("");
      } else {
        setResetError(data.error || "Invalid code. Please try again.");
      }
    } catch (err) {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setResetError("");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setResetError("Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);

    try {
      const resp = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          email: resetEmail,
          verification_token: verificationToken,
          new_password: newPassword,
        }),
      });
      const data = await resp.json();

      if (resp.ok && data.success) {
        setResetStep("success");
      } else {
        setResetError(data.error || "Failed to update password.");
      }
    } catch (err) {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setResetStep("login");
    setResetEmail("");
    setResetCode(["", "", "", "", "", ""]);
    setVerificationToken("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetSuccess("");
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Reset Flow: Request Code ─────────────────────────────────
  if (resetStep === "request") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#0A3A5C] to-[#0A5C8C] px-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <Mail className="w-7 h-7 text-[#0A5C8C]" />
            </div>
            <CardTitle className="text-xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your admin email to receive a 6-digit verification code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestReset} className="space-y-4">
              {resetError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset-email">Admin Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="admin@electricscouts.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={resetLoading}
                className="w-full h-11 bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={handleBackToLogin}
                className="text-sm text-gray-500 hover:text-[#0A5C8C] transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Reset Flow: Verify Code ──────────────────────────────────
  if (resetStep === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#0A3A5C] to-[#0A5C8C] px-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-[#0A5C8C]" />
            </div>
            <CardTitle className="text-xl">Enter Verification Code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to <strong>{resetEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {resetSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}
              {resetError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                {resetCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (codeInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <Button
                type="submit"
                disabled={resetLoading || resetCode.join("").length !== 6}
                className="w-full h-11 bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={handleRequestReset}
                disabled={resetLoading}
                className="text-sm text-gray-500 hover:text-[#0A5C8C] transition-colors"
              >
                Didn't receive it? Resend code
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={handleBackToLogin}
                className="text-sm text-gray-500 hover:text-[#0A5C8C] transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Reset Flow: Set New Password ─────────────────────────────
  if (resetStep === "newpassword") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#0A3A5C] to-[#0A5C8C] px-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <CardTitle className="text-xl">Set New Password</CardTitle>
            <CardDescription>
              Create a strong new password for your admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              {resetError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Aa1! — 8+ chars, upper, lower, number, symbol"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={resetLoading}
                className="w-full h-11 bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Reset Flow: Success ──────────────────────────────────────
  if (resetStep === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#0A3A5C] to-[#0A5C8C] px-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Password Updated</h2>
            <p className="text-sm text-gray-600 mb-6">
              Your admin password has been successfully updated. You can now sign in with your new password.
            </p>
            <Button
              onClick={handleBackToLogin}
              className="w-full h-11 bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
            >
              Sign In with New Password
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Default: Login Form ──────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#0A3A5C] to-[#0A5C8C] px-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <img
              src="/images/logo-header.png"
              alt="Electric Scouts"
              className="h-10 w-auto mx-auto"
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-xl">Admin Login</CardTitle>
          </div>
          <CardDescription>
            Sign in with your administrator credentials
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@electricscouts.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep("request");
                    setResetEmail(email);
                  }}
                  className="text-xs text-[#0A5C8C] hover:text-[#084a6f] font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-[#0A5C8C] transition-colors"
            >
              &larr; Back to website
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
