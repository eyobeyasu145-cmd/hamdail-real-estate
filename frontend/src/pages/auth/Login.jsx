import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api";
import "./Auth.css";

export default function Auth() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { login } = useAuth();
  const [page, setPage] = useState(
    pathname === "/register"
      ? "register"
      : pathname === "/verify-email"
        ? "verify"
      : pathname.startsWith("/reset-password")
        ? "reset"
        : "login",
  );
  const [name, setName] = useState("");
  const [role, setRole] = useState("buyer");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const postAuth = async (endpoint, body) => {
    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.message || "The request could not be completed.");
      error.code = result.code;
      error.email = result.email;
      throw error;
    }
    return result;
  };

  const checkPasswordStrength = (candidate) => {
    if (candidate.length < 12) {
      return "Password must have at least 12 characters.";
    }
    if (
      !/[a-z]/.test(candidate) ||
      !/[A-Z]/.test(candidate) ||
      !/[0-9]/.test(candidate) ||
      !/[^A-Za-z0-9]/.test(candidate)
    ) {
      return "Use uppercase and lowercase letters, a number, and a symbol.";
    }
    if (new TextEncoder().encode(candidate).length > 72) {
      return "Password must be no more than 72 UTF-8 bytes.";
    }
    return null;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    setLoading(true);
    try {
      const result = await postAuth("login", { email, password });

      login(result.user, result.token);
      if (result.user.role === "seller") {
        navigate("/seller-dashboard");
      } else if (result.user.role === "buyer") {
        navigate("/properties");
      } else if (result.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setPage("verify");
        setPassword("");
      }
      setMessage(error.message || "Unable to connect to the sign-in service.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const passwordError = checkPasswordStrength(password);
    if (passwordError) {
      setMessage(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const result = await postAuth("register", { name, role, email, password });
      setEmail(result.email || email);
      setMessage(result.message);
      setCode("");
      setPage("verify");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.email) {
        setEmail(error.email);
        setPage("verify");
      }
      setMessage(error.message || "Unable to connect to the registration service.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await postAuth("verify-email", { email, code });
      setPage("login");
      setPassword("");
      setCode("");
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message || "Unable to verify your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await postAuth("resend-verification", { email });
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message || "Unable to request a verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (!resetCodeSent) {
        const result = await postAuth("forgot-password", { email });
        setResetCodeSent(true);
        setMessage(result.message);
        return;
      }

      const passwordError = checkPasswordStrength(password);
      if (passwordError) {
        setMessage(passwordError);
        return;
      }
      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }

      const result = await postAuth("reset-password", { email, code, password });
      setPage("login");
      setPassword("");
      setConfirmPassword("");
      setCode("");
      setResetCodeSent(false);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetCode = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await postAuth("forgot-password", { email });
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message || "Unable to request a password reset code.");
    } finally {
      setLoading(false);
    }
  };

  const changePage = (nextPage) => {
    setPage(nextPage);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setResetCodeSent(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <main className="auth-page container-fluid min-vh-100 d-flex align-items-center justify-content-center p-3">
      <section className="card auth-card shadow p-4">
        <Link
          to="/"
          className="auth-brand text-center text-decoration-none mb-4"
        >
          Hamdail Real Estate
        </Link>

        {/* Page selection */}
        <div className="btn-group mb-4" role="group">
          <button
            type="button"
            className={`btn ${page === "login" ? "btn-success" : "btn-outline-success"}`}
            onClick={() => changePage("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`btn ${page === "register" ? "btn-success" : "btn-outline-success"}`}
            onClick={() => changePage("register")}
          >
            Register
          </button>
          <button
            type="button"
            className={`btn ${page === "reset" ? "btn-success" : "btn-outline-success"}`}
            onClick={() => changePage("reset")}
          >
            Reset
          </button>
        </div>

        <h1 className="h4 mb-3">
          {page === "login" && "Welcome back"}
          {page === "register" && "Create an account"}
          {page === "verify" && "Verify your email"}
          {page === "reset" && "Reset password"}
        </h1>
        {message && <div className="alert alert-info">{message}</div>}

        {/* this is for Register */}
        {page === "register" && (
          <form onSubmit={handleRegister}>
            <label className="form-label">Full name</label>
            <input
              className="form-control mb-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label className="form-label">Account type</label>
            <select
              className="form-select mb-3"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>

            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="form-label">Password</label>
            <div className="input-group mb-3">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={12}
                maxLength={72}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
            <p className="form-text">At least 12 characters with uppercase and lowercase letters, a number, and a symbol. Maximum 72 UTF-8 bytes.</p>

            <label className="form-label">Confirm password</label>
            <div className="input-group mb-3">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={12}
                maxLength={72}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
            <button className="btn btn-success w-100" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {page === "verify" && (
          <form onSubmit={handleVerifyEmail}>
            <p>Enter the six-digit code sent to your email address.</p>
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="form-label">Verification code</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              className="form-control mb-3"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button className="btn btn-success w-100" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Email"}
            </button>
            <button
              type="button"
              className="btn btn-link w-100 mt-2"
              onClick={handleResendVerification}
              disabled={loading}
            >
              Resend verification code
            </button>
          </form>
        )}

        {/* this is for reset password */}
        {page === "reset" && (
          <form onSubmit={handleResetPassword}>
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {!resetCodeSent ? (
              <button className="btn btn-success w-100" type="submit" disabled={loading}>
                {loading ? "Sending code..." : "Send reset code"}
              </button>
            ) : (
              <>
                <p className="form-text">If a verified account matches this email, a reset code will be sent.</p>
                <button
                  type="button"
                  className="btn btn-link w-100 mb-2"
                  onClick={handleResendResetCode}
                  disabled={loading}
                >
                  Resend reset code
                </button>
                <label className="form-label">Six-digit reset code</label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="form-control mb-3"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <label className="form-label">New password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control mb-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={12}
                  maxLength={72}
                  required
                />
                <p className="form-text">At least 12 characters with uppercase and lowercase letters, a number, and a symbol. Maximum 72 UTF-8 bytes.</p>
                <label className="form-label">Confirm new password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control mb-3"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={12}
                  maxLength={72}
                  required
                />
              </>
            )}
            {resetCodeSent && (
              <button className="btn btn-success w-100" type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            )}
          </form>
        )}

        {/* this is for login */}
        {page === "login" && (
          <form onSubmit={handleLogin}>
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="form-label">Password</label>
            <div className="input-group mb-3">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
            <button className="btn btn-success w-100" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              className="btn btn-link w-100 mt-2"
              onClick={() => changePage("reset")}
            >
              Forgot password?
            </button>
          </form>
        )}

        <p className="small text-center text-secondary mt-4 mb-0">
          Find your place with Hamdail Real Estate.
        </p>
      </section>
    </main>
  );
}
