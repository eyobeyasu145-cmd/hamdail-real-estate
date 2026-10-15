import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOfficeBuilding,
  HiHome,
  HiShieldCheck,
  HiLightningBolt,
  HiCurrencyDollar,
  HiVideoCamera,
  HiArrowRight,
} from "react-icons/hi";

import mockProperties from "../../data/properties";
import PropertyCard from "../../components/common/PropertyCard";
import "./LandingPage.css";

const categories = [
  { name: "Modern Flats", type: "flat", icon: <HiOfficeBuilding /> },
  { name: "Luxury Villas", type: "villa", icon: <HiHome /> },
  { name: "Penthouse", type: "penthouse", icon: <HiOfficeBuilding /> },
  { name: "Commercial", type: "commercial", icon: <HiOfficeBuilding /> },
];

const features = [
  {
    title: "Verified Trust",
    desc: "Listings checked for ownership, condition, and legality.",
    icon: <HiShieldCheck />,
  },
  {
    title: "Smart Search",
    desc: "Find properties that match your preferences.",
    icon: <HiLightningBolt />,
  },
  {
    title: "Best Value",
    desc: "Explore competitive prices and direct-owner listings.",
    icon: <HiCurrencyDollar />,
  },
  {
    title: "Virtual Tours",
    desc: "Explore properties from the comfort of your home.",
    icon: <HiVideoCamera />,
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");

  const featured = mockProperties.filter((p) => p.featured);

  const search = (e) => {
    e.preventDefault();
    navigate(
      `/properties${location.trim() ? `?location=${encodeURIComponent(location.trim())}` : ""}`,
    );
  };

  return (
    <main>
      {/* Hero */}
      <section className="hero text-white text-center">
        <div className="container py-5">
          <h1 className="display-4 fw-bold mb-4">Find Your Dream Home Today</h1>
          <p className="lead mb-5">
            Find a house, apartment, or property that feels like home with
            Hamdail Real Estate.
          </p>

          <form
            className="search-box d-flex gap-2 p-2 mx-auto"
            onSubmit={search}
          >
            <input
              className="form-control border-0"
              placeholder="Search by city or area"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button className="btn btn-brand px-4">Search</button>
          </form>

          <div className="row justify-content-center g-4 mt-4">
            {[
              ["6+", "Properties Listed"],
              ["4", "Cities"],
              ["100%", "Verified"],
            ].map(([number, label]) => (
              <div className="col-4 col-md-2" key={label}>
                <h2 className="fw-bold">{number}</h2>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-5">
        <h2 className="section-title">Browse by Category</h2>
        <div className="row g-4">
          {categories.map((cat) => (
            <div className="col-6 col-lg-3" key={cat.type}>
              <button
                className="category-card w-100 h-100"
                onClick={() => navigate(`/properties?type=${cat.type}`)}
              >
                <span className="category-icon">{cat.icon}</span>
                <h5>{cat.name}</h5>
                <small>
                  {
                    mockProperties.filter((p) => p.propertyType === cat.type)
                      .length
                  }{" "}
                  listings →
                </small>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      <section className="bg-white py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title mb-0">Featured Properties</h2>
            <button
              className="btn btn-outline-brand"
              onClick={() => navigate("/properties")}
            >
              View All <HiArrowRight />
            </button>
          </div>

          <div className="row g-4">
            {featured.map((property) => (
              <div className="col-12 col-md-6 col-lg-4" key={property._id}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-5">
        <h2 className="section-title">Why Choose Hamdail Real Estate?</h2>
        <div className="row g-4">
          {features.map((feature) => (
            <div className="col-12 col-md-6 col-lg-3" key={feature.title}>
              <article className="feature-card h-100 p-4">
                <div className="feature-icon">{feature.icon}</div>
                <h5 className="fw-bold">{feature.title}</h5>
                <p className="text-secondary mb-0">{feature.desc}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="cta text-center text-white py-5">
        <div className="container">
          <h2 className="fw-bold">Ready to Find Your Home?</h2>
          <p className="mb-4">
            Explore properties and discover your next home.
          </p>
          <button
            className="btn btn-light btn-lg"
            onClick={() => navigate("/properties")}
          >
            Browse Properties <HiArrowRight />
          </button>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
