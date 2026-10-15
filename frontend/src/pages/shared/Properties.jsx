import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiAdjustments, HiSearch, HiX } from "react-icons/hi";
import PropertyCard from "../../components/common/PropertyCard";
import { API_URL } from "../../api";

const propertyTypes = ["flat", "villa", "penthouse", "commercial"];
const bhkOptions = ["1", "2", "3", "4", "5"];
const furnishingOptions = ["furnished", "semi-furnished", "unfurnished"];
const statusOptions = ["all", "sale", "rent"];

const sortOptions = [
  { label: "Latest", value: "latest" },
  { label: "Price: Low to High", value: "priceLow" },
  { label: "Price: High to Low", value: "priceHigh" },
];

const DEFAULT_MAX_PRICE = 150000000;

const Properties = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(
    searchParams.get("location") || searchParams.get("city") || "",
  );
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "all",
    propertyType: searchParams.get("propertyType")
      ? searchParams.get("propertyType").split(",")
      : [],
    bhk: [],
    furnishing: [],
    maxPrice: DEFAULT_MAX_PRICE,
  });
  const [sort, setSort] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await fetch(`${API_URL}/api/properties`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Unable to load properties.");
        }
        setProperties(result.properties || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to connect to the properties service.");
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, []);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayFilter = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter((item) => item !== value)
        : [...prev[name], value],
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      propertyType: [],
      bhk: [],
      furnishing: [],
      maxPrice: DEFAULT_MAX_PRICE,
    });
    setSearch("");
    setSort("latest");
  };

  const filteredProperties = useMemo(() => {
    let list = [...properties];

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter((property) =>
        [property.title, property.city, property.locality].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        ),
      );
    }

    if (filters.status !== "all") {
      list = list.filter((property) => property.status === filters.status);
    }

    if (filters.propertyType.length) {
      list = list.filter((property) =>
        filters.propertyType.includes(property.propertyType),
      );
    }

    if (filters.bhk.length) {
      list = list.filter((property) =>
        filters.bhk.includes(String(property.bhk)),
      );
    }

    if (filters.furnishing.length) {
      list = list.filter((property) =>
        filters.furnishing.includes(property.furnishing),
      );
    }

    list = list.filter(
      (property) => Number(property.price || 0) <= filters.maxPrice,
    );

    if (sort === "priceLow") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sort === "priceHigh") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else {
      list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    return list;
  }, [properties, search, filters, sort]);

  const hasActiveFilters =
    search.trim() !== "" ||
    filters.status !== "all" ||
    filters.propertyType.length > 0 ||
    filters.bhk.length > 0 ||
    filters.furnishing.length > 0 ||
    filters.maxPrice < DEFAULT_MAX_PRICE;

  const formatPrice = (price) => `ETB ${Number(price).toLocaleString("en-ET")}`;

  return (
    <div className="bg-light min-vh-100">
      <section className="bg-success text-white py-5">
        <div className="container">
          <h1 className="fw-bold mb-2">Find Your Property</h1>
          <p className="mb-4">
            Browse available properties and find a place that suits you.
          </p>

          <div className="input-group bg-white rounded overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0 text-success">
              <HiSearch size={20} />
            </span>
            <input
              type="search"
              className="form-control border-0 py-3"
              placeholder="Search by property name, city, or locality..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                type="button"
                className="btn btn-light border-0"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <HiX size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="container py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div
            className="btn-group flex-wrap"
            role="group"
            aria-label="Listing type"
          >
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                className={`btn ${
                  filters.status === status
                    ? "btn-success"
                    : "btn-outline-success"
                }`}
                onClick={() => updateFilter("status", status)}
              >
                {status === "all"
                  ? "All"
                  : `For ${status.charAt(0).toUpperCase()}${status.slice(1)}`}
              </button>
            ))}
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <select
              className="form-select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort properties"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`btn ${
                showFilters ? "btn-success" : "btn-outline-success"
              }`}
              onClick={() => setShowFilters((visible) => !visible)}
            >
              <HiAdjustments className="me-1" />
              Filters
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={resetFilters}
              >
                <HiX className="me-1" />
                Clear
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6 col-lg-3">
                  <h6 className="fw-bold">Property Type</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {propertyTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`btn btn-sm ${
                          filters.propertyType.includes(type)
                            ? "btn-success"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => toggleArrayFilter("propertyType", type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-md-6 col-lg-3">
                  <h6 className="fw-bold">Bedrooms (BHK)</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {bhkOptions.map((bedrooms) => (
                      <button
                        key={bedrooms}
                        type="button"
                        className={`btn btn-sm ${
                          filters.bhk.includes(bedrooms)
                            ? "btn-success"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => toggleArrayFilter("bhk", bedrooms)}
                      >
                        {bedrooms}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-md-6 col-lg-3">
                  <h6 className="fw-bold">Furnishing</h6>
                  {furnishingOptions.map((furnishing) => (
                    <div className="form-check" key={furnishing}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`furnishing-${furnishing}`}
                        checked={filters.furnishing.includes(furnishing)}
                        onChange={() =>
                          toggleArrayFilter("furnishing", furnishing)
                        }
                      />
                      <label
                        className="form-check-label text-capitalize"
                        htmlFor={`furnishing-${furnishing}`}
                      >
                        {furnishing}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="col-md-6 col-lg-3">
                  <label htmlFor="maxPrice" className="form-label fw-bold">
                    Maximum Price: {formatPrice(filters.maxPrice)}
                  </label>
                  <input
                    id="maxPrice"
                    type="range"
                    className="form-range"
                    min="500000"
                    max={DEFAULT_MAX_PRICE}
                    step="500000"
                    value={filters.maxPrice}
                    onChange={(event) =>
                      updateFilter("maxPrice", Number(event.target.value))
                    }
                  />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>ETB 500,000</span>
                    <span>{formatPrice(DEFAULT_MAX_PRICE)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-secondary mb-3">
          Showing <strong>{filteredProperties.length}</strong> properties
          {hasActiveFilters ? " (filtered)" : ""}
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <p className="text-secondary">Loading properties...</p>}

        {filteredProperties.length === 0 ? (
          <div className="card border-0 shadow-sm text-center py-5">
            <div className="card-body">
              <div className="display-4 mb-3" aria-hidden="true">
                🏠
              </div>
              <h3 className="h4 fw-bold">
                {loading ? "Loading properties" : "No properties found"}
              </h3>
              <p className="text-secondary">
                {error
                  ? "Please try again when the property service is available."
                  : "Try changing your search or filters, or check back later."}
              </p>
              <button
                type="button"
                className="btn btn-success"
                onClick={resetFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredProperties.map((property) => (
              <div
                className="col-sm-6 col-lg-4"
                key={property._id || property.id}
              >
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Properties;
