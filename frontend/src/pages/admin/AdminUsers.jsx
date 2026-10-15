import { useEffect, useMemo, useRef, useState } from "react";

const initialUsers = [
  {
    id: 1,
    name: "Abel Tesfaye",
    email: "abel@example.com",
    phone: "+251 911 123 456",
    role: "buyer",
    status: "Active",
  },
  {
    id: 2,
    name: "Hana Mohammed",
    email: "hana@example.com",
    phone: "+251 922 234 567",
    role: "seller",
    status: "Active",
  },
  {
    id: 3,
    name: "Dawit Bekele",
    email: "dawit@example.com",
    phone: "+251 933 345 678",
    role: "buyer",
    status: "Inactive",
  },
  {
    id: 4,
    name: "Mekdes Ali",
    email: "mekdes@example.com",
    phone: "+251 944 456 789",
    role: "admin",
    status: "Active",
  },
];

export default function AdminUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const filterRef = useRef(null);

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
        user.phone.toLowerCase().includes(search);

      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchTerm]);

  const toggleStatus = (userId) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "Active" ? "Inactive" : "Active",
            }
          : user,
      ),
    );
  };

  const deleteUser = (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this user?",
    );
    if (!confirmed) return;

    setUsers((currentUsers) =>
      currentUsers.filter((user) => user.id !== userId),
    );
  };

  const roleLabel = (role) => role.charAt(0).toUpperCase() + role.slice(1);

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
                    {["all", "buyer", "seller", "admin"].map((role) => (
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
                    <tr key={user.id}>
                      <td>
                        <div className="fw-semibold">{user.name}</div>
                        <small className="text-secondary">ID: {user.id}</small>
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
                            user.status === "Active"
                              ? "text-bg-success"
                              : "text-bg-secondary"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              user.status === "Active"
                                ? "btn-outline-warning"
                                : "btn-outline-success"
                            }`}
                            onClick={() => toggleStatus(user.id)}
                          >
                            {user.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteUser(user.id)}
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
                      No users match your search or selected role.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="small text-secondary mt-3 mb-0">
        Demo data only: changes are kept in component state and will reset when
        the page reloads. Connect this component to your backend to manage real
        user accounts.
      </p>
    </div>
  );
}
