import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api";

export default function AdminContacts() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Unable to load contact messages.");
        }
        setMessages(result.messages || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to connect to the contact inbox.");
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [token]);

  return (
    <section className="container py-4">
      <h1 className="h3 fw-bold mb-1">Contact Inbox</h1>
      <p className="text-secondary mb-4">Messages submitted through the contact form.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <p className="text-secondary">Loading messages...</p>
      ) : messages.length ? (
        <div className="row g-3">
          {messages.map((message) => (
            <article className="col-12" key={message._id || message.id}>
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between gap-2">
                    <h2 className="h5 mb-1">{message.name}</h2>
                    <small className="text-secondary">
                      {new Date(message.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <p className="small mb-3">
                    <a href={`mailto:${message.email}`}>{message.email}</a>
                    {" · "}
                    <a href={`tel:${message.phone}`}>{message.phone}</a>
                  </p>
                  <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                    {message.message}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="alert alert-light border">No contact messages yet.</div>
      )}
    </section>
  );
}
