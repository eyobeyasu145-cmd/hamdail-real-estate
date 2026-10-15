import { useNavigate } from "react-router-dom";
import { HiLocationMarker, HiHome, HiArrowsExpand } from "react-icons/hi";
import "./PropertyCard.css";

// Format property prices in Ethiopian birr (ETB)
const formatPrice = (price, status) => {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return "Price on request";

  const formatted = new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: 2,
  }).format(amount);

  return status === "rent" ? `${formatted} ETB/month` : `${formatted} ETB`;
};

const PropertyCard = ({ property }) => {
  const navigate = useNavigate();

  if (!property) return null;

  const {
    _id,
    title = "Property listing",
    images = [],
    status = "sale",
    propertyType = "property",
    locality = "",
    city = "Dire Dawa",
    bhk,
    bathrooms,
    areaSize,
    price,
  } = property;

  const type = String(propertyType || "property").toLowerCase();
  const listingStatus = String(status || "sale").toLowerCase();

  const statusOptions = {
    rent: {
      className: "text-bg-info",
      label: "For Rent",
    },
    sale: {
      className: "text-bg-success",
      label: "For Sale",
    },
    sold: {
      className: "text-bg-secondary",
      label: "Sold",
    },
  };

  const currentStatus = statusOptions[listingStatus] || {
    className: "text-bg-light",
    label: "Other",
  };

  const statusClass = currentStatus.className;
  const statusLabel = currentStatus.label;

  const location = [locality, city].filter(Boolean).join(", ");
  return (
    <article className="card property-card h-100">
      {/* Property image */}
      <img
        src={images?.[0] || "/real-estate/Real-estate.png"}
        alt={title}
        className="card-img-top property-image"
        loading="lazy"
      />

      <div className="card-body d-flex flex-column">
        {/* Property type and status */}
        <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
          <span className="badge property-type text-capitalize">{type}</span>

          <span className={`badge ${statusClass}`}>{statusLabel}</span>
        </div>

        {/* Title */}
        <h5 className="card-title fw-bold">{title}</h5>

        {/* Location */}
        <p className="text-secondary small mb-3">
          <HiLocationMarker className="me-1" />
          {location || "Location available on request"}
        </p>

        {/* Property specifications */}
        <div className="property-specs d-flex justify-content-between gap-2 py-3 mb-3">
          {type !== "commercial" && (
            <>
              <div className="small">
                <HiHome className="property-icon me-1" />
                {bhk != null ? `${bhk} Beds` : "Beds —"}
              </div>

              <div className="small">
                {bathrooms != null ? `${bathrooms} Baths` : "Baths —"}
              </div>
            </>
          )}

          <div className="small">
            <HiArrowsExpand className="property-icon me-1" />
            {areaSize != null ? `${areaSize} m²` : "Area —"}
          </div>
        </div>

        {/* Price and details */}
        <div className="mt-auto d-flex justify-content-between align-items-center gap-2">
          <strong className="property-price">
            {formatPrice(price, listingStatus)}
          </strong>

          <button
            type="button"
            className="btn btn-property btn-sm"
            disabled={!_id}
            onClick={() => navigate(`/property/${_id}`)}
          >
            Details
          </button>
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;
