import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

function Profile() {
  const { user, setUser, token } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeProfilePic, setRemoveProfilePic] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveProfilePic(false);
    setError("");
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveProfilePic(true);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });

    setImageFile(null);
    setImagePreview(null);
    setRemoveProfilePic(false);
    setError("");
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = new FormData();

      data.append("name", formData.name);
      data.append("phone", formData.phone);
      data.append("address", formData.address);

      if (imageFile) {
        data.append("profilePic", imageFile);
      }

      if (removeProfilePic) {
        data.append("removeProfilePic", "true");
      }

      const response = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile.");
      }

      setUser(result.user);
      setImageFile(null);
      setImagePreview(null);
      setRemoveProfilePic(false);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const profileImage = imagePreview || user?.profilePic || "";

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h4 className="mb-0">My Profile</h4>
            </div>

            <div className="card-body p-4">
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="text-center mb-4">
                {profileImage && !removeProfilePic ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="rounded-circle mb-3"
                    width="120"
                    height="120"
                  />
                ) : (
                  <div
                    className="rounded-circle bg-light border d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: 120, height: 120 }}
                  >
                    <span className="fs-1 text-secondary">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}

                {isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={handleImageChange}
                    />

                    {(profileImage || imageFile) && (
                      <button
                        type="button"
                        className="btn btn-link text-danger"
                        onClick={handleRemoveImage}
                      >
                        Remove profile picture
                      </button>
                    )}
                  </>
                )}
              </div>

              {!isEditing ? (
                <>
                  <p>
                    <strong>Name:</strong> {user?.name || "Not provided"}
                  </p>
                  <p>
                    <strong>Email:</strong> {user?.email || "Not provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {user?.phone || "Not provided"}
                  </p>
                  <p>
                    <strong>Address:</strong> {user?.address || "Not provided"}
                  </p>

                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-success flex-grow-1"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
