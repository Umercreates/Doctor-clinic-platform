"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Input } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/api";
import { email as validateEmail, required } from "@/lib/validation/common";

/**
 * Staff sign-in form. Posts to /api/v1/auth/login; sessions are implemented
 * in the backend phase, so the API currently responds with a clear message.
 */
export function LoginForm() {
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const emailError = validateEmail(values.email);
    if (emailError) nextErrors.email = emailError;
    const passwordError = required(values.password, "Password");
    if (passwordError) nextErrors.password = passwordError;
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setStatus("submitting");
    setMessage("");
    try {
      await api.login(values);
      setStatus("success");
    } catch (error) {
      if (error.details) setErrors(error.details);
      setMessage(error.message || "Sign-in failed. Please try again.");
      setStatus(error.code === "NOT_IMPLEMENTED" ? "unavailable" : "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {message && (
        <Alert tone={status === "unavailable" ? "info" : "error"} title={status === "unavailable" ? "Sign-in not yet enabled" : "Sign-in failed"}>
          {message}
        </Alert>
      )}
      <Input
        id="login-email"
        label="Email address"
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        placeholder="you@clinic.com"
        value={values.email}
        onChange={update("email")}
        error={errors.email}
        required
      />
      <div className="relative">
        <Input
          id="login-password"
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          value={values.password}
          onChange={update("password")}
          error={errors.password}
          inputClassName="pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute right-3 top-[2.05rem] inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex items-center gap-2 text-slate-600">
          <input type="checkbox" name="remember" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          Remember me
        </label>
        <span className="text-slate-400">Forgot password? Contact an administrator.</span>
      </div>
      <Button type="submit" size="lg" fullWidth leftIcon={LogIn} loading={status === "submitting"}>
        Sign in
      </Button>
    </form>
  );
}
