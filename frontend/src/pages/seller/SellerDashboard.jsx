import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../api";
import SellerSidebar from "../../components/SellerSidebar";
import {
  HiOutlineEye,
  HiOutlineUserGroup,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowPath,
} from "react-icons/hi2";

const formatPrice = (price) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "Price not set";
  return `ETB ${amount.toLocaleString()}`;
};

const getLocation = (property) => {
  const area = property.area || property.locality || "";
  const city = property.city || "";
  return [area, city].filter(Boolean).join(", ") || "Location not set";
};

const getStatusClass = (status) => {
  switch ((status || "").toLowerCase()) {
    case "sale":
    case "rent":
    case "active":
      return "bg-success-subtle text-success";
    case "sold":
    case "rented":
      return "bg-primary-subtle text-primary";
    case "pending":
      return "bg-warning-subtle text-warning-emphasis";
    default:
      return "bg-secondary-subtle text-secondary";
  }
};

export default function SellerDashboard({ isAdmin = false }) {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalInquiries: 0,
    activeListings: 0,
    soldProperties: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Could not load properties (HTTP ${response.status}).`);
      }

      const result = await response.json();

      // Supports either an array response or common API response shapes.
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result.properties)
          ? result.properties
          : Array.isArray(result.data)
            ? result.data
            : [];

      setProperties(list);

      // Use backend stats when provided; otherwise calculate what we can
      // from the properties returned by the API.
      const calculatedStats = {
        totalViews: list.reduce((sum, p) => sum + (Number(p.views) || 0), 0),
        totalInquiries: list.reduce(
          (sum, p) => sum + (Number(p.inquiriesCount ?? p.totalInquiries) || 0),
          0,
        ),
        activeListings: list.filter((p) =>
          ["sale", "rent", "active"].includes((p.status || "").toLowerCase()),
        ).length,
        soldProperties: list.filter((p) =>
          ["sold", "rented"].includes((p.status || "").toLowerCase()),
        ).length,
      };

      setStats({
        ...calculatedStats,
        ...(result.stats && typeof result.stats === "object"
          ? result.stats
          : {}),
      });
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the server. Check that your backend is running.",
      );
      setProperties([]);
      setStats({
        totalViews: 0,
        totalInquiries: 0,
        activeListings: 0,
        soldProperties: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Load once when the dashboard opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProperties = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return properties
      .filter((property) => {
        const matchesSearch = [
          property.title,
          property.city,
          property.area,
          property.locality,
          property.propertyType,
          property.status,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search),
        );

        const matchesStatus =
          statusFilter === "all" ||
          String(property.status || "").toLowerCase() === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
  }, [properties, searchTerm, statusFilter]);

  const handleExport = () => {
    const headers = [
      "Title",
      "Location",
      "Type",
      "Price (ETB)",
      "Status",
      "Views",
    ];

    const escapeCsv = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredProperties.map((property) => [
      property.title || "",
      getLocation(property),
      property.propertyType || "",
      property.price ?? "",
      property.status || "",
      Number(property.views) || 0,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hamdail_property_listings.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (property) => {
    const id = property._id || property.id;
    if (!id) {
      setError("This property does not have an ID, so it cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${property.title || "this property"}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/api/properties/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Delete failed (HTTP ${response.status}).`);
      }

      setProperties((current) =>
        current.filter((item) => (item._id || item.id) !== id),
      );
      setNotice("Property deleted successfully.");
    } catch (err) {
      setError(
        err.message ||
          "Could not delete this property. Check your backend delete route.",
      );
    }
  };

  const statCards = [
    {
      title: "Total Views",
      value: Number(stats.totalViews || 0).toLocaleString(),
      icon: HiOutlineEye,
    },
    {
      title: "Active Leads",
      value: Number(stats.totalInquiries || 0).toLocaleString(),
      icon: HiOutlineUserGroup,
    },
    {
      title: "Live Listings",
      value: Number(stats.activeListings || 0).toLocaleString(),
      icon: HiOutlineBuildingOffice2,
    },
    {
      title: "Properties Sold",
      value: Number(stats.soldProperties || 0).toLocaleString(),
      icon: HiOutlineCheckCircle,
    },
  ];

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-secondary">Loading seller dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container mb-4">
        <SellerSidebar />
      </div>
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">
              {isAdmin ? "Property Management" : "Seller Dashboard"}
            </h1>
            <p className="text-secondary mb-0">
              {isAdmin
                ? "Review and manage all property listings."
                : "Manage your property listings in Dire Dawa."}
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={loadDashboard}
            >
              <HiOutlineArrowPath className="me-2" />
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={handleExport}
              disabled={filteredProperties.length === 0}
            >
              <HiOutlineArrowDownTray className="me-2" />
              Export CSV
            </button>
            <Link to="/add-property" className="btn btn-success">
              <HiOutlinePlus className="me-2" />
              Add Property
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <div className="fw-semibold">Something went wrong</div>
            <div>{error}</div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger mt-2"
              onClick={loadDashboard}
            >
              Try again
            </button>
          </div>
        )}

        {notice && (
          <div className="alert alert-success" role="status">
            {notice}
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
                      <h2 className="h3 fw-bold mb-0">{card.value}</h2>
                    </div>
                    <div
                      className="rounded-3 p-3 bg-success-subtle text-success"
                      aria-hidden="true"
                    >
                      <Icon size={25} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 pt-4 px-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h2 className="h5 fw-bold mb-1">
                  {isAdmin ? "All Properties" : "Your Properties"}
                </h2>
                <p className="text-secondary small mb-0">
                  Showing {filteredProperties.length} of {properties.length}{" "}
                  listings
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <div className="input-group" style={{ minWidth: "230px" }}>
                  <span className="input-group-text bg-white">
                    <HiOutlineMagnifyingGlass />
                  </span>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search properties..."
                    aria-label="Search properties"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <select
                  className="form-select"
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  style={{ minWidth: "145px" }}
                >
                  <option value="all">All statuses</option>
                  <option value="sale">For sale</option>
                  <option value="rent">For rent</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-5 px-3">
                <HiOutlineBuildingOffice2
                  size={42}
                  className="text-secondary mb-3"
                />
                <h3 className="h6 fw-bold">
                  {properties.length === 0
                    ? "You have no property listings yet"
                    : "No properties match your search"}
                </h3>
                <p className="text-secondary mb-3">
                  {properties.length === 0
                    ? "Add your first property to start managing your listings."
                    : "Try another search term or change the status filter."}
                </p>
                {properties.length === 0 && (
                  <Link to="/add-property" className="btn btn-success">
                    <HiOutlinePlus className="me-2" />
                    Add your first property
                  </Link>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4">Property</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Views</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((property) => {
                      const id = property._id || property.id;
                      const image = Array.isArray(property.images)
                        ? property.images[0]
                        : property.images;

                      return (
                        <tr key={id || property.title}>
                          <td className="px-4">
                            <div className="d-flex align-items-center gap-3">
                              {image ? (
                                <img
                                  src={image}
                                  alt={property.title || "Property"}
                                  style={{
                                    width: "64px",
                                    height: "52px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                  }}
                                />
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-body-secondary rounded"
                                  style={{ width: "64px", height: "52px" }}
                                >
                                  <HiOutlineBuildingOffice2 size={24} />
                                </div>
                              )}
                              <div>
                                <div className="fw-semibold">
                                  {property.title || "Untitled property"}
                                </div>
                                <small className="text-secondary">
                                  {property.bhk ? `${property.bhk} BHK` : ""}
                                  {property.areaSize
                                    ? ` · ${property.areaSize}`
                                    : ""}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>{getLocation(property)}</td>
                          <td className="text-capitalize">
                            {property.propertyType || "—"}
                          </td>
                          <td className="fw-semibold">
                            {formatPrice(property.price)}
                          </td>
                          <td>
                            <span
                              className={`badge rounded-pill ${getStatusClass(property.status)}`}
                            >
                              {property.status || "Unknown"}
                            </span>
                          </td>
                          <td>
                            {Number(property.views || 0).toLocaleString()}
                          </td>
                          <td className="text-end pe-4">
                            <div className="d-inline-flex gap-2">
                              <Link
                                to={id ? `/edit-property/${id}` : "#"}
                                className={`btn btn-sm btn-outline-success ${id ? "" : "disabled"}`}
                                aria-label={`Edit ${property.title || "property"}`}
                                title="Edit property"
                              >
                                <HiOutlinePencilSquare />
                              </Link>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(property)}
                                aria-label={`Delete ${property.title || "property"}`}
                                title="Delete property"
                              >
                                <HiOutlineTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <p className="small text-secondary text-center mt-4 mb-0">
          Hamdail Real Estate · Seller Dashboard
        </p>
      </div>
    </div>
  );
}
