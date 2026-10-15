import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HiArrowLeft, HiLocationMarker } from "react-icons/hi";
import mockProperties from "../../data/properties";

const formatPrice = (price) =>
  `ETB ${Number(price || 0).toLocaleString("en-ET")}`;

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    const found = mockProperties.find((item) => String(item._id) === id);
    setProperty(found || null);
    window.scrollTo(0, 0);
  }, [id]);

  if (!property) {
    return (
      <div className="container py-5 text-center">
        <h2>Property Not Found</h2>
        <p className="text-secondary">This property could not be found.</p>
        <button
          className="btn btn-success"
          onClick={() => navigate("/properties")}
        >
          Browse Properties
        </button>
      </div>
    );
  }

  const area = Number(property.areaSize || 0);
  const pricePerSquareMeter =
    area > 0 ? Math.round(Number(property.price || 0) / area) : null;

  return (
    <div className="bg-light min-vh-100">
      <div className="bg-white border-bottom py-3">
        <div className="container">
          <Link to="/properties" className="text-success text-decoration-none">
            <HiArrowLeft className="me-1" />
            Back to Properties
          </Link>
          <span className="text-secondary ms-3">
            {property.city}
            {property.locality ? ` › ${property.locality}` : ""}
          </span>
        </div>
      </div>

      <main className="container py-4">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="img-fluid w-100 rounded mb-4"
            style={{ maxHeight: "420px", objectFit: "cover" }}
          />
        ) : (
          <div className="bg-secondary-subtle rounded p-5 text-center mb-4">
            No image available
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-8">
            <section className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge text-bg-success">
                    For {property.status || "sale"}
                  </span>
                  {property.propertyType && (
                    <span className="badge text-bg-secondary text-capitalize">
                      {property.propertyType}
                    </span>
                  )}
                </div>

                <h1 className="h3 fw-bold">{property.title}</h1>
                <p className="text-secondary">
                  <HiLocationMarker className="text-success me-1" />
                  {property.locality}, {property.city}
                </p>

                <hr />

                <div className="row text-center g-3">
                  <div className="col">
                    <div className="fw-bold fs-5">{property.bhk ?? "—"}</div>
                    <div className="text-secondary small">Bedrooms</div>
                  </div>
                  <div className="col border-start">
                    <div className="fw-bold fs-5">
                      {property.bathrooms ?? "—"}
                    </div>
                    <div className="text-secondary small">Bathrooms</div>
                  </div>
                  <div className="col border-start">
                    <div className="fw-bold fs-5">{area.toLocaleString()}</div>
                    <div className="text-secondary small">m²</div>
                  </div>
                </div>

                <hr />

                <h2 className="h5 fw-bold">Description</h2>
                <p className="text-secondary mb-0">
                  {property.description || "No description available."}
                </p>

                {property.amenities?.length > 0 && (
                  <>
                    <hr />
                    <h2 className="h5 fw-bold">Amenities</h2>
                    <ul className="list-group list-group-flush">
                      {property.amenities.map((amenity, index) => (
                        <li
                          className="list-group-item px-0"
                          key={`${amenity}-${index}`}
                        >
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>
          </div>

          <aside className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="text-secondary small mb-2">
                  {property.status === "rent" ? "Monthly Rent" : "Price"}
                </div>
                <div className="h3 fw-bold text-success">
                  {formatPrice(property.price)}
                </div>

                {pricePerSquareMeter !== null && (
                  <p className="text-secondary small mb-0">
                    ETB {pricePerSquareMeter.toLocaleString("en-ET")} / m²
                    {property.status === "rent" ? " / month" : ""}
                  </p>
                )}

                <hr />

                <h2 className="h6 fw-bold">Contact Seller</h2>
                <p className="mb-2">
                  {property.seller?.name || "Property Seller"}
                </p>
                {property.seller?.phone && (
                  <a
                    className="btn btn-success w-100 mb-2"
                    href={`tel:${property.seller.phone}`}
                  >
                    Call Seller
                  </a>
                )}
                {property.seller?.email && (
                  <a
                    className="btn btn-outline-success w-100"
                    href={`mailto:${property.seller.email}`}
                  >
                    Email Seller
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetails;
