import { useEffect, useState } from "react";
import {
  HiOutlineUserGroup,
  HiOutlineBuildingLibrary,
  HiOutlineTicket,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineCircleStack,
  HiOutlinePhoto,
  HiOutlineShieldCheck,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import { API_URL } from "../../api";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    activeListings: 0,
    soldProperties: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load dashboard totals from the backend.
  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(
          `Could not load admin statistics (HTTP ${response.status}).`,
        );
      }

      const data = await response.json();
      const result = data.stats || data.data || data;

      setStats({
        totalUsers: Number(result.totalUsers) || 0,
        totalProperties: Number(result.totalProperties) || 0,
        activeListings: Number(result.activeListings) || 0,
        soldProperties: Number(result.soldProperties) || 0,
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to load dashboard statistics. Check that your backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: HiOutlineUserGroup,
      color: "#0d9488",
      bg: "#ccfbf1",
    },
    {
      title: "Total Properties",
      value: stats.totalProperties,
      icon: HiOutlineBuildingLibrary,
      color: "#f59e0b",
      bg: "#fef3c7",
    },
    {
      title: "Active Listings",
      value: stats.activeListings,
      icon: HiOutlineTicket,
      color: "#3b82f6",
      bg: "#dbeafe",
    },
    {
      title: "Sold Properties",
      value: stats.soldProperties,
      icon: HiOutlineCheckCircle,
      color: "#10b981",
      bg: "#dcfce7",
    },
  ];

  // These are informational placeholders until real health-check APIs exist.
  const services = [
    {
      name: "Database",
      description: "Stores user accounts and property listings",
      icon: HiOutlineCircleStack,
    },
    {
      name: "Media Storage",
      description: "Stores property photos",
      icon: HiOutlinePhoto,
    },
    {
      name: "Auth Service",
      description: "Handles sign-in and account access",
      icon: HiOutlineShieldCheck,
    },
    {
      name: "API Gateway",
      description: "Connects the frontend to backend services",
      icon: HiOutlineGlobeAlt,
    },
  ];

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container mb-4">
        <AdminSidebar />
      </div>
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">Admin Dashboard</h1>
            <p className="text-secondary mb-0">
              Overview of Hamdail Real Estate.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-success"
            onClick={loadStats}
            disabled={loading}
          >
            <HiOutlineArrowPath className="me-2" />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="alert alert-warning" role="alert">
            <strong>Statistics unavailable.</strong> {error}
            <div className="small mt-1">
              Confirm the API URL and make sure your backend provides this
              endpoint.
            </div>
          </div>
        )}

        <div className="row g-3 mb-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div className="col-12 col-sm-6 col-xl-3" key={card.title}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-secondary mb-2">{card.title}</p>
                      <h2 className="h3 fw-bold mb-0">
                        {loading ? "—" : card.value.toLocaleString()}
                      </h2>
                    </div>
                    <div
                      className="rounded-3 p-3"
                      style={{ backgroundColor: card.bg, color: card.color }}
                    >
                      <Icon size={26} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 px-4 pt-4">
                <h2 className="h5 fw-bold mb-1">Platform Overview</h2>
                <p className="text-secondary small mb-0">
                  Current totals returned by your backend.
                </p>
              </div>

              <div className="card-body px-4">
                <div className="d-flex justify-content-between py-3 border-bottom">
                  <span className="text-secondary">Registered users</span>
                  <strong>
                    {loading ? "—" : stats.totalUsers.toLocaleString()}
                  </strong>
                </div>
                <div className="d-flex justify-content-between py-3 border-bottom">
                  <span className="text-secondary">All properties</span>
                  <strong>
                    {loading ? "—" : stats.totalProperties.toLocaleString()}
                  </strong>
                </div>
                <div className="d-flex justify-content-between py-3 border-bottom">
                  <span className="text-secondary">Active listings</span>
                  <strong>
                    {loading ? "—" : stats.activeListings.toLocaleString()}
                  </strong>
                </div>
                <div className="d-flex justify-content-between py-3">
                  <span className="text-secondary">Sold properties</span>
                  <strong>
                    {loading ? "—" : stats.soldProperties.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 px-4 pt-4">
                <h2 className="h5 fw-bold mb-1">System Services</h2>
                <p className="text-secondary small mb-0">
                  Service health needs to be connected to backend checks.
                </p>
              </div>

              <div className="card-body px-4">
                {services.map((service) => {
                  const Icon = service.icon;

                  return (
                    <div
                      key={service.name}
                      className="d-flex align-items-start gap-3 py-3 border-bottom"
                    >
                      <div className="rounded-3 bg-body-secondary p-2">
                        <Icon size={22} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{service.name}</div>
                        <div className="small text-secondary">
                          {service.description}
                        </div>
                        <span className="badge bg-secondary-subtle text-secondary mt-2">
                          Health check not connected
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-secondary small mt-4 mb-0">
          Hamdail Real Estate · Admin Dashboard
        </p>
      </div>
    </div>
  );
}
