import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api";

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [agentForm, setAgentForm] = useState({ name: "", email: "", phone: "" });
  const [creatingAgent, setCreatingAgent] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load users.");
        setUsers(result.users || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to connect to the user service.");
      } finally {
        setLoading(false);
      }
    };
    if (token) loadUsers();
    else {
      setError("Sign in as an admin to manage users.");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setOpenFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        String(user.phone || "").toLowerCase().includes(search);

      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchTerm]);

  const toggleStatus = async (user) => {
    setError("");
    setNotice("");
    const status = user.status === "active" ? "inactive" : "active";
    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${encodeURIComponent(user._id || user.id)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update user.");
      setUsers((current) =>
        current.map((item) => (item._id === user._id ? result.user : item)),
      );
      setNotice("User status updated.");
    } catch (updateError) {
      setError(updateError.message || "Unable to update user.");
    }
  };

  const deleteUser = async (user) => {
    const confirmed = window.confirm(
      `Remove ${user.name}? Users who own listings cannot be deleted.`,
    );
    if (!confirmed) return;

    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${encodeURIComponent(user._id || user.id)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to delete user.");
      setUsers((current) =>
        current.filter((item) => (item._id || item.id) !== (user._id || user.id)),
      );
      setNotice("User deleted.");
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete user.");
    }
  };

  const createAgent = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setCreatingAgent(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/users/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(agentForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create agent account.");
      setUsers((current) => [result.user, ...current]);
      setAgentForm({ name: "", email: "", phone: "" });
      setNotice(result.message || "Agent account created.");
    } catch (createError) {
      setError(createError.message || "Unable to create agent account.");
    } finally {
      setCreatingAgent(false);
    }
  };

  const roleLabel = (role) => {
    if (role === "seller") return "Owner";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="h3 mb-1">Manage Users</h2>
          <p className="text-secondary mb-0">
            View and manage Hamdail Real Estate user accounts.
          </p>
        </div>
        <span className="badge text-bg-light border fs-6">
          {filteredUsers.length} users
        </span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <form className="card border-0 shadow-sm mb-4" onSubmit={createAgent}>
        <div className="card-body">
          <h3 className="h5 fw-bold">Add an employee agent</h3>
          <p className="text-secondary">
            Only admins can create agent accounts. After creation, the agent can use Forgot password to set their own password.
          </p>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="agent-name">Name</label>
              <input
                id="agent-name"
                className="form-control"
                value={agentForm.name}
                onChange={(event) => setAgentForm({ ...agentForm, name: event.target.value })}
                maxLength={120}
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="agent-email">Email</label>
              <input
                id="agent-email"
                type="email"
                className="form-control"
                value={agentForm.email}
                onChange={(event) => setAgentForm({ ...agentForm, email: event.target.value })}
                maxLength={254}
                required
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label" htmlFor="agent-phone">Phone (optional)</label>
              <input
                id="agent-phone"
                type="tel"
                className="form-control"
                value={agentForm.phone}
                onChange={(event) => setAgentForm({ ...agentForm, phone: event.target.value })}
                maxLength={40}
              />
            </div>
            <div className="col-12 col-md-1 d-flex align-items-end">
              <button className="btn btn-success w-100" disabled={creatingAgent}>
                {creatingAgent ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-center mb-3">
            <div className="col-12 col-md">
              <input
                type="search"
                className="form-control"
                placeholder="Search name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search users"
              />
            </div>

            <div className="col-12 col-md-auto" ref={filterRef}>
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-outline-secondary dropdown-toggle w-100"
                  onClick={() => setOpenFilter((open) => !open)}
                  aria-expanded={openFilter}
                >
                  Role: {roleLabel(roleFilter)}
                </button>

                {openFilter && (
                  <div className="dropdown-menu show position-absolute">
                    {["all", "buyer", "seller", "agent", "admin"].map((role) => (
                      <button
                        type="button"
                        className={`dropdown-item ${
                          roleFilter === role ? "active" : ""
                        }`}
                        key={role}
                        onClick={() => {
                          setRoleFilter(role);
                          setOpenFilter(false);
                        }}
                      >
                        {roleLabel(role)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">User Info</th>
                  <th scope="col">Role</th>
                  <th scope="col">Contact Details</th>
                  <th scope="col">Account Status</th>
                  <th scope="col" className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id || user.id}>
                      <td>
                        <div className="fw-semibold">{user.name}</div>
                        <small className="text-secondary">ID: {user._id || user.id}</small>
                      </td>
                      <td>
                        <span className="badge text-bg-light border">
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <div>{user.email}</div>
                        <small className="text-secondary">{user.phone}</small>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            user.status === "active"
                              ? "text-bg-success"
                              : "text-bg-secondary"
                          }`}
                        >
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              user.status === "active"
                                ? "btn-outline-warning"
                                : "btn-outline-success"
                            }`}
                            onClick={() => toggleStatus(user)}
                          >
                            {user.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteUser(user)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-secondary py-5">
                      {loading ? "Loading users..." : "No users match your search or selected role."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
