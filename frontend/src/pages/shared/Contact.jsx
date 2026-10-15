import { useEffect, useState } from "react";
import {
  HiPhone,
  HiMail,
  HiLocationMarker,
  HiCheckCircle,
  HiChatAlt2,
  HiClock,
  HiPaperAirplane,
} from "react-icons/hi";
import { FaTelegram } from "react-icons/fa";
import { API_URL } from "../../api";

const CONTACT_INFO = {
  phone: "+251914907073",
  email: "eyobeyasu@gmail.com",
  telegram: "nove_363",
  address: "Dire Dawa, Ethiopia",
  hours: "Mon – Sat: 9:00 AM – 6:00 PM",
};

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sent) return;

    const timer = setTimeout(() => setSent(false), 5000);
    return () => clearTimeout(timer);
  }, [sent]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to submit your message.");
      }
      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (submitError) {
      setError(submitError.message || "Unable to connect to the contact service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="bg-success text-white text-center py-5">
        <div className="container">
          <HiChatAlt2 size={40} className="mb-3" />
          <h1 className="fw-bold">Get In Touch</h1>
          <p className="mb-0">
            Have a question or want to schedule a property visit? We're here to
            help.
          </p>
        </div>
      </section>

      <div className="container py-5">
        <div className="row g-4 mb-5">
          <div className="col-12 col-md-4">
            <a
              href={`tel:${CONTACT_INFO.phone}`}
              className="card h-100 p-4 text-decoration-none text-dark"
            >
              <HiPhone size={28} className="text-success mb-3" />
              <h2 className="h6 text-uppercase text-secondary">Call Us</h2>
              <p className="fw-semibold mb-1">{CONTACT_INFO.phone}</p>
              <small className="text-muted">Mon–Sat, 9 AM–6 PM</small>
            </a>
          </div>

          <div className="col-12 col-md-4">
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="card h-100 p-4 text-decoration-none text-dark"
            >
              <HiMail size={28} className="text-primary mb-3" />
              <h2 className="h6 text-uppercase text-secondary">Email Us</h2>
              <p className="fw-semibold mb-1 text-break">
                {CONTACT_INFO.email}
              </p>
              <small className="text-muted">Send us your questions</small>
            </a>
          </div>

          <div className="col-12 col-md-4">
            <a
              href={`https://t.me/${CONTACT_INFO.telegram}`}
              target="_blank"
              rel="noreferrer"
              className="card h-100 p-4 text-decoration-none text-dark"
            >
              <FaTelegram size={28} className="text-info mb-3" />
              <h2 className="h6 text-uppercase text-secondary">Telegram</h2>
              <p className="fw-semibold mb-1">@{CONTACT_INFO.telegram}</p>
              <small className="text-muted">Chat with us</small>
            </a>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h2 className="h4 fw-bold">Send Us a Message</h2>
                <p className="text-muted">
                  Fill out the form and we'll get back to you.
                </p>

                {sent ? (
                  <div className="alert alert-success" role="status">
                    <HiCheckCircle className="me-2" />
                    Message submitted successfully.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="name" className="form-label">
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          className="form-control"
                          placeholder="Your name"
                          value={form.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="phone" className="form-label">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          className="form-control"
                          placeholder="+251 9xx xxx xxx"
                          value={form.phone}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="email" className="form-label">
                          Email Address
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className="form-control"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="message" className="form-label">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          className="form-control"
                          rows="5"
                          placeholder="How can we help you?"
                          value={form.message}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn btn-success"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                aria-hidden="true"
                              />
                              Sending...
                            </>
                          ) : (
                            <>
                              <HiPaperAirplane className="me-2" />
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card bg-success text-white border-0 mb-3">
              <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-4">Contact Information</h2>
                <p>
                  <HiPhone className="me-2" />
                  <a className="text-white" href={`tel:${CONTACT_INFO.phone}`}>
                    {CONTACT_INFO.phone}
                  </a>
                </p>
                <p>
                  <HiMail className="me-2" />
                  <a
                    className="text-white"
                    href={`mailto:${CONTACT_INFO.email}`}
                  >
                    {CONTACT_INFO.email}
                  </a>
                </p>
                <p>
                  <FaTelegram className="me-2" />
                  <a
                    className="text-white"
                    href={`https://t.me/${CONTACT_INFO.telegram}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{CONTACT_INFO.telegram}
                  </a>
                </p>
                <p>
                  <HiLocationMarker className="me-2" />
                  {CONTACT_INFO.address}
                </p>
                <p className="mb-0">
                  <HiClock className="me-2" />
                  {CONTACT_INFO.hours}
                </p>
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h2 className="h5 fw-bold">Quick Connect</h2>
                <div className="d-grid gap-2">
                  <a
                    className="btn btn-outline-success"
                    href={`tel:${CONTACT_INFO.phone}`}
                  >
                    <HiPhone className="me-2" /> Call Now
                  </a>
                  <a
                    className="btn btn-outline-info"
                    href={`https://t.me/${CONTACT_INFO.telegram}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaTelegram className="me-2" /> Open Telegram
                  </a>
                  <a
                    className="btn btn-outline-primary"
                    href={`mailto:${CONTACT_INFO.email}`}
                  >
                    <HiMail className="me-2" /> Send Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
