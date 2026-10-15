import { Link, useNavigate } from "react-router-dom";
import { HiUserCircle } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dashboardPath =
    user?.role === "admin"
      ? "/admin-dashboard"
      : user?.role === "seller"
        ? "/seller-dashboard"
        : "/properties";

  return (
    <nav
      className=" navbar navbar-expand-lg navbar-light shadow-sm sticky-top "
      style={{
        backgroundImage:
          "linear-gradient(rgba(6, 78, 59, 0.50), rgba(6, 78, 59, 0.40)), url('/real-estate/nav-barss.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="container-fluid px-3">
        <Link
          className="navbar-brand d-flex align-items-center me-auto gap-2"
          to="/"
        >
          <img
            src="/real-estate/hamdail-icon.png"
            alt="Hamdail Real Estate logo"
            style={{
              width: "30px",
              height: "30px",
              objectFit: "cover",
              borderRadius: "32px",
            }}
          />

          <span className="fw-bold fs-5">Hamdail Real Estate</span>
        </Link>

        {/* Bootstrap JavaScript controls the mobile menu. */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMenu"
          aria-controls="navbarMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation menu */}
        <div
          id="navbarMenu"
          className="collapse navbar-collapse justify-content-end"
        >
          <ul className="navbar-nav align-items-lg-center gap-lg-3 ">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/properties">
                Properties
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/contact">
                Contact
              </Link>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    {user.name || "My profile"}
                  </Link>
                </li>
                {user.role !== "buyer" && (
                  <li className="nav-item">
                    <Link className="nav-link" to={dashboardPath}>
                      Dashboard
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    className="btn btn-link nav-link"
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    Sign out
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item border-start ps-lg-3 ms-lg-2">
                <Link
                  className="nav-link d-flex align-items-center gap-2"
                  to="/login"
                  style={{ color: "#0d9488" }}
                >
                  <HiUserCircle className="fs-4" />
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
