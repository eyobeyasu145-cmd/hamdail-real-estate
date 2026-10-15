import { Routes, Route } from "react-router-dom";

// Components
import Navbar from "./components/common/Navbar";

// Pages
import LandingPage from "./pages/shared/LandingPage";
import Properties from "./pages/shared/Properties";
import PropertyDetails from "./pages/shared/PropertyDetails";
import Contact from "./pages/shared/Contact";
import SellerDashboard from "./pages/seller/SellerDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import Profile from "./pages/shared/Profile";

// Authentication
import Login from "./pages/auth/Login";

function App() {
  return (
    <Routes>
      {/* Authentication pages - no Navbar */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      <Route path="/reset-password" element={<Login />} />

      {/* Main website - with Navbar */}
      <Route
        path="/*"
        element={
          <div className="d-flex flex-column min-vh-100">
            <Navbar />

            <main className="flex-grow-1">
              <Routes>
                {/* Home page */}
                <Route path="/" element={<LandingPage />} />

                {/* Property listings */}
                <Route path="/properties" element={<Properties />} />
                <Route path="/profile" element={<Profile />} />

                {/* Property details */}
                <Route path="/property/:id" element={<PropertyDetails />} />

                {/* Contact page */}
                <Route path="/contact" element={<Contact />} />

                {/* Seller dashboard */}
                <Route path="/seller-dashboard" element={<SellerDashboard />} />

                {/* Admin users */}
                <Route path="/admin-users" element={<AdminUsers />} />

                {/* Unknown page */}
                <Route
                  path="*"
                  element={
                    <div className="container py-5 text-center">
                      <h1 className="display-5 fw-bold">Page Not Found</h1>
                      <p className="text-muted">
                        The page you're looking for doesn't exist or is still
                        under construction.
                      </p>
                    </div>
                  }
                />
              </Routes>
            </main>

            <footer className="text-center py-3 border-top">
              <small className="text-muted">
                © {new Date().getFullYear()} Hamdail Real Estate. All rights
                reserved.
              </small>
            </footer>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
