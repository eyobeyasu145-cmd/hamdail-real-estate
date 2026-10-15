import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";
import "./Auth.css";

export default function Auth() {
  const navigate = useNavigate();
  const [page, setPage] = useState("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  // Demo login: redirect users according to their account role.
  // Replace this with your backend login request when your API is ready.
  const handleLogin = (event) => {
    event.preventDefault();
    setMessage("");

    const demoAccounts = {
      "buyer@demo.com": { role: "buyer", name: "Demo Buyer" },
      "seller@demo.com": { role: "seller", name: "Demo Seller" },
      "admin@demo.com": { role: "admin", name: "Demo Admin" },
    };

    const account = demoAccounts[email.trim().toLowerCase()];

    if (!account || password !== "demo1234") {
      setMessage("Invalid email or password. Use one of the demo accounts.");
      return;
    }

    // Store demo user information so the app can read the signed-in role.
    localStorage.setItem("user", JSON.stringify(account));
    localStorage.setItem("role", account.role);

    if (account.role === "seller") {
      navigate("/seller-dashboard");
    } else if (account.role === "buyer") {
      navigate("/properties");
    } else if (account.role === "admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  };

  // this is for Register
  const handleRegister = (event) => {
    event.preventDefault();
    if (password.length < 6) {
      setMessage("Password must have at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setMessage("Demo registration complete. Please sign in.");
    setPage("login");
    setPassword("");
    setConfirmPassword("");
  };

  // this is for reset password
  const handleResetPassword = (event) => {
    event.preventDefault();
    if (password.length < 6) {
      setMessage("New password must have at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setMessage(
      "Demo reset complete. Connect a backend to change a real password.",
    );
    setPage("login");
    setPassword("");
    setConfirmPassword("");
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
                minLength={6}
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
                minLength={6}
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
            <button className="btn btn-success w-100" type="submit">
              Create Account
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
                minLength={6}
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
                minLength={6}
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
            <button className="btn btn-success w-100" type="submit">
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
            <button className="btn btn-success w-100" type="submit">
              Sign In
            </button>
            <button
              type="button"
              className="btn btn-link w-100 mt-2"
              onClick={() => changePage("reset")}
            >
              Forgot password?
            </button>
            <p className="small text-secondary mt-3 mb-0">
              Demo accounts: buyer@demo.com, seller@demo.com, admin@demo.com
              <br />
              Password: demo1234
            </p>
          </form>
        )}

        <p className="small text-center text-secondary mt-4 mb-0">
          Find your place with Hamdail Real Estate.
        </p>
      </section>
    </main>
  );
}
