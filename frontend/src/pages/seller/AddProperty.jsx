import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api";

const commonAmenities = [
  "Parking",
  "Pool",
  "Gym",
  "Security",
  "Water Supply",
  "Electricity",
  "Wifi",
  "Power Backup",
  "Club House",
  "Garden",
];

function AddProperties() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    city: "Dire Dawa",
    area: "",
    pincode: "",
    propertyType: "flat",
    bhk: "",
    bathrooms: "",
    areaSize: "",
    furnishing: "unfurnished",
    status: "sale",
    amenities: [],
    securityDeposit: "",
    maintenance: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmenityChange = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageChange = (e) => {
    const selectedImages = Array.from(e.target.files || []);

    imagePreviews.forEach((url) => URL.revokeObjectURL(url));

    setImages(selectedImages);
    setImagePreviews(selectedImages.map((image) => URL.createObjectURL(image)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Please log in before adding a property.");
      return;
    }

    if (images.length === 0) {
      setError("Please select at least one property image.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
      });

      images.forEach((image) => {
        data.append("images", image);
      });

      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Failed to add property.");
      }

      alert("Property added successfully!");
      navigate("/properties");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2>Add Property</h2>
      <p>List your property in Dire Dawa, Ethiopia.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Property Title *</label>
          <input
            className="form-control"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Description *</label>
          <textarea
            className="form-control"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Price (ETB) *</label>
          <input
            className="form-control"
            type="number"
            name="price"
            min="1"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">City *</label>
            <input
              className="form-control"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Neighborhood *</label>
            <select
              className="form-select"
              name="area"
              value={formData.area}
              onChange={handleChange}
              required
            >
              <option value="">Select neighborhood</option>
              <option value="Kezira">Kezira</option>
              <option value="Sabian">Sabian</option>
              <option value="Gendekore">Gendekore</option>
              <option value="Legehare">Legehare</option>
              <option value="Melka Jebdu">Melka Jebdu</option>
              <option value="City Center">City Center</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {formData.area === "Other" && (
          <div className="mb-3">
            <label className="form-label">Enter Neighborhood *</label>
            <input
              className="form-control"
              value={formData.customArea || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customArea: e.target.value,
                }))
              }
              required
            />
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Property Type *</label>
          <select
            className="form-select"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
            required
          >
            <option value="flat">Flat / Apartment</option>
            <option value="villa">House / Villa</option>
            <option value="penthouse">Penthouse</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Bedrooms</label>
            <input
              className="form-control"
              type="number"
              name="bhk"
              min="0"
              value={formData.bhk}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Bathrooms</label>
            <input
              className="form-control"
              type="number"
              name="bathrooms"
              min="0"
              value={formData.bathrooms}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Area Size (m²)</label>
            <input
              className="form-control"
              type="number"
              name="areaSize"
              min="1"
              value={formData.areaSize}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Furnishing</label>
          <select
            className="form-select"
            name="furnishing"
            value={formData.furnishing}
            onChange={handleChange}
          >
            <option value="unfurnished">Unfurnished</option>
            <option value="semi-furnished">Semi-Furnished</option>
            <option value="furnished">Fully Furnished</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Listing Type *</label>
          <select
            className="form-select"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>

        {formData.status === "rent" && (
          <>
            <div className="mb-3">
              <label className="form-label">Security Deposit (ETB)</label>
              <input
                className="form-control"
                type="number"
                name="securityDeposit"
                min="0"
                value={formData.securityDeposit}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Maintenance Fee (ETB)</label>
              <input
                className="form-control"
                type="number"
                name="maintenance"
                min="0"
                value={formData.maintenance}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        <div className="mb-3">
          <label className="form-label">Amenities</label>
          <div className="row">
            {commonAmenities.map((amenity) => (
              <div className="col-md-4 col-6" key={amenity}>
                <label className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => handleAmenityChange(amenity)}
                  />
                  <span className="form-check-label">{amenity}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Property Images *</label>
          <input
            className="form-control"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            required
          />
        </div>

        {imagePreviews.length > 0 && (
          <div className="row mb-3">
            {imagePreviews.map((src, index) => (
              <div className="col-md-3 col-6 mb-2" key={src}>
                <img
                  src={src}
                  alt={`Property preview ${index + 1}`}
                  className="img-fluid rounded"
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-success" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Add Property"}
        </button>
      </form>
    </div>
  );
}

export default AddProperties;
