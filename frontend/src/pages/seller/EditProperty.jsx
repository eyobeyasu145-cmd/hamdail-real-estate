import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Change this path if your AuthContext is elsewhere.

const API_URL = "http://localhost:5000/api/properties";

const neighborhoods = [
  "Kezira",
  "Sabian",
  "Gendekore",
  "Legehare",
  "Melka Jebdu",
  "City Center",
  "Other",
];

const initialForm = {
  title: "",
  description: "",
  price: "",
  city: "Dire Dawa",
  area: "Kezira",
  pincode: "",
  propertyType: "house",
  bhk: "",
  bathrooms: "",
  areaSize: "",
  furnishing: "unfurnished",
  status: "sale",
  amenities: [],
  securityDeposit: "",
  maintenance: "",
};

const propertyTypes = [
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "flat", label: "Flat / Apartment" },
  { value: "commercial", label: "Commercial" },
];

const amenitiesList = [
  "Parking",
  "Security",
  "Garden",
  "Swimming Pool",
  "Gym",
  "Wi-Fi",
  "Water Supply",
  "Backup Power",
];

function toFormData(property) {
  return {
    ...initialForm,
    ...property,
    city: property.city || "Dire Dawa",
    area: property.area || property.locality || "Kezira",
    amenities: Array.isArray(property.amenities) ? property.amenities : [],
    price: property.price ?? "",
    bhk: property.bhk ?? "",
    bathrooms: property.bathrooms ?? "",
    areaSize: property.areaSize ?? "",
    securityDeposit: property.securityDeposit ?? "",
    maintenance: property.maintenance ?? "",
  };
}

export default function EditProperties() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState(initialForm);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error("Could not load this property. Please try again.");
        }

        const result = await response.json();
        const property = result.property || result.data || result;

        setFormData(toFormData(property));
        setExistingImages(
          Array.isArray(property.images) ? property.images : [],
        );
      } catch (err) {
        setError(
          err.message || "Something went wrong while loading the property.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) loadProperty();
  }, [id, token]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleAmenityChange = (amenity) => {
    setFormData((previous) => {
      const selected = previous.amenities.includes(amenity);
      return {
        ...previous,
        amenities: selected
          ? previous.amenities.filter((item) => item !== amenity)
          : [...previous.amenities, amenity],
      };
    });
  };

  const handleNewImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const availableSlots = Math.max(
      0,
      10 - existingImages.length - newImages.length,
    );
    setNewImages((previous) => [
      ...previous,
      ...selectedFiles.slice(0, availableSlots),
    ]);
    event.target.value = "";
  };

  const removeExistingImage = (imageToRemove) => {
    setExistingImages((previous) =>
      previous.filter((image) => image !== imageToRemove),
    );
  };

  const removeNewImage = (indexToRemove) => {
    setNewImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const body = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        body.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
      });

      // These names are common API conventions. Match them to your backend if needed.
      body.append("existingImages", JSON.stringify(existingImages));
      newImages.forEach((image) => body.append("images", image));

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Could not update the property.");
      }

      navigate("/my-properties");
    } catch (err) {
      setError(
        err.message || "Something went wrong while updating the property.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">Loading property...</div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: "1000px" }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="h3 mb-1">Edit Property</h1>
          <p className="text-muted mb-0">Update your property details.</p>
        </div>
        <Link to="/my-properties" className="btn btn-outline-secondary">
          Back to My Properties
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="card-header fw-semibold">Basic Information</div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label" htmlFor="title">
                Property title
              </label>
              <input
                id="title"
                className="form-control"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="form-control"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="propertyType">
                  Property type
                </label>
                <select
                  id="propertyType"
                  className="form-select"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                >
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="status">
                  Listing status
                </label>
                <select
                  id="status"
                  className="form-select"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="bhk">
                  Bedrooms (BHK)
                </label>
                <input
                  id="bhk"
                  type="number"
                  min="0"
                  className="form-control"
                  name="bhk"
                  value={formData.bhk}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="bathrooms">
                  Bathrooms
                </label>
                <input
                  id="bathrooms"
                  type="number"
                  min="0"
                  className="form-control"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="areaSize">
                  Area size
                </label>
                <input
                  id="areaSize"
                  type="number"
                  min="0"
                  className="form-control"
                  name="areaSize"
                  value={formData.areaSize}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="furnishing">
                  Furnishing
                </label>
                <select
                  id="furnishing"
                  className="form-select"
                  name="furnishing"
                  value={formData.furnishing}
                  onChange={handleInputChange}
                >
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi-furnished">Semi-furnished</option>
                  <option value="furnished">Furnished</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header fw-semibold">Price and Location</div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="price">
                  Price (ETB)
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  className="form-control"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  className="form-control"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="area">
                  Neighborhood
                </label>
                <select
                  id="area"
                  className="form-select"
                  name="area"
                  value={
                    neighborhoods.includes(formData.area)
                      ? formData.area
                      : "Other"
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormData((previous) => ({
                      ...previous,
                      area: value === "Other" ? "" : value,
                    }));
                  }}
                  required
                >
                  {neighborhoods.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                {(!neighborhoods.includes(formData.area) ||
                  formData.area === "") && (
                  <input
                    className="form-control mt-2"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="Enter neighborhood"
                    aria-label="Other neighborhood"
                    required
                  />
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="pincode">
                  Postal code (optional)
                </label>
                <input
                  id="pincode"
                  className="form-control"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                />
              </div>

              {formData.status === "rent" && (
                <>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="securityDeposit">
                      Security deposit (ETB)
                    </label>
                    <input
                      id="securityDeposit"
                      type="number"
                      min="0"
                      className="form-control"
                      name="securityDeposit"
                      value={formData.securityDeposit}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="maintenance">
                      Monthly maintenance (ETB)
                    </label>
                    <input
                      id="maintenance"
                      type="number"
                      min="0"
                      className="form-control"
                      name="maintenance"
                      value={formData.maintenance}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header fw-semibold">Amenities</div>
          <div className="card-body">
            <div className="row g-2">
              {amenitiesList.map((amenity) => (
                <div className="col-6 col-md-3" key={amenity}>
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
        </div>

        <div className="card mb-4">
          <div className="card-header fw-semibold">
            Property Images (maximum 10)
          </div>
          <div className="card-body">
            {existingImages.length + newImages.length === 0 && (
              <p className="text-muted">No images selected.</p>
            )}

            <div className="row g-3 mb-3">
              {existingImages.map((image, index) => (
                <div
                  className="col-6 col-md-3"
                  key={`existing-${image}-${index}`}
                >
                  <div className="border rounded p-2 h-100">
                    <img
                      src={image}
                      alt={`Property ${index + 1}`}
                      className="img-fluid rounded mb-2"
                      style={{
                        height: "120px",
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger w-100"
                      onClick={() => removeExistingImage(image)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {newImages.map((image, index) => (
                <div className="col-6 col-md-3" key={`${image.name}-${index}`}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-truncate mb-2">{image.name}</div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger w-100"
                      onClick={() => removeNewImage(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {existingImages.length + newImages.length < 10 && (
              <div>
                <label className="form-label" htmlFor="images">
                  Add images
                </label>
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-control"
                  onChange={handleNewImageChange}
                />
                <div className="form-text">
                  You can keep up to 10 images in total.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex gap-2 mb-5">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <Link to="/my-properties" className="btn btn-outline-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
