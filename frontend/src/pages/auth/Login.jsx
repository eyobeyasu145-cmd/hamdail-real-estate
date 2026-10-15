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
      : pathname.startsWith("/reset-password")
        ? "reset"
        : "login",
  );
  const [name, setName] = useState("");
  const [role, setRole] = useState("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to sign in.");
      }

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
      setMessage(error.message || "Unable to connect to the sign-in service.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setMessage("Password must have at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to create your account.");
      }

      setMessage("Your account was created. Please sign in.");
      setPage("login");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error.message || "Unable to connect to the registration service.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (event) => {
    event.preventDefault();
    setMessage("Password reset is not configured yet. Please contact the administrator.");
  };

  const changePage = (nextPage) => {
    setPage(nextPage);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
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
                minLength={8}
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

            <label className="form-label">Confirm password</label>
            <div className="input-group mb-3">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
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

            <label className="form-label">New password</label>
            <div className="input-group mb-3">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
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

            <label className="form-label">Confirm new password</label>
            <div className="input-group mb-3">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
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
              Reset Password
            </button>
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
