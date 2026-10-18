import { Navigate, Routes, Route } from "react-router-dom";

// Components
import Navbar from "./components/common/Navbar";

// Pages
import LandingPage from "./pages/shared/LandingPage";
import Properties from "./pages/shared/Properties";
import PropertyDetails from "./pages/shared/PropertyDetails";
import Contact from "./pages/shared/Contact";
import SellerDashboard from "./pages/seller/SellerDashboard";
import AddProperty from "./pages/seller/AddProperty";
import EditProperty from "./pages/seller/EditProperty";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminContacts from "./pages/admin/AdminContacts";
import Profile from "./pages/shared/Profile";
import { useAuth } from "./context/AuthContext";

// Authentication
import Login from "./pages/auth/Login";

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin-dashboard" : user.role === "seller" ? "/seller-dashboard" : "/properties"}
        replace
      />
    );
  }
  return children;
}

function App() {
  return (
    <Routes>
      {/* Authentication pages - no Navbar */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      <Route path="/verify-email" element={<Login />} />
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
                <Route
                  path="/profile"
                  element={
                    <RequireRole roles={["buyer", "seller", "admin"]}>
                      <Profile />
                    </RequireRole>
                  }
                />

                {/* Property details */}
                <Route path="/property/:id" element={<PropertyDetails />} />

                {/* Contact page */}
                <Route path="/contact" element={<Contact />} />

                {/* Seller dashboard */}
                <Route
                  path="/seller-dashboard"
                  element={
                    <RequireRole roles={["seller", "admin"]}>
                      <SellerDashboard />
                    </RequireRole>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <RequireRole roles={["seller", "admin"]}>
                      <SellerDashboard />
                    </RequireRole>
                  }
                />
                <Route
                  path="/my-properties"
                  element={
                    <RequireRole roles={["seller", "admin"]}>
                      <SellerDashboard />
                    </RequireRole>
                  }
                />
                <Route
                  path="/admin/properties"
                  element={
                    <RequireRole roles={["admin"]}>
                      <SellerDashboard isAdmin />
                    </RequireRole>
                  }
                />
                <Route
                  path="/add-property"
                  element={
                    <RequireRole roles={["seller", "admin"]}>
                      <AddProperty />
                    </RequireRole>
                  }
                />
                <Route
                  path="/edit-property/:id"
                  element={
                    <RequireRole roles={["seller", "admin"]}>
                      <EditProperty />
                    </RequireRole>
                  }
                />

                {/* Admin pages */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminDashboard />
                    </RequireRole>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminUsers />
                    </RequireRole>
                  }
                />
                <Route
                  path="/admin-users"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminUsers />
                    </RequireRole>
                  }
                />
                <Route
                  path="/admin/contacts"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminContacts />
                    </RequireRole>
                  }
                />

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
