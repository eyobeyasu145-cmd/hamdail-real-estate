import { useEffect, useRef, useState } from "react";
import {
  HiChevronLeft,
  HiOutlineTrash,
  HiPaperAirplane,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";

export default function ChatMessages({
  user,
  chats = [],
  activeChat,
  setActiveChat,
  messages = [],
  onSendMessage,
  onDeleteMessage,
  getChatPartner,
}) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = newMessage.trim();

    if (!text || !activeChat) return;

    onSendMessage?.(activeChat._id, text);
    setNewMessage("");
  };

  const handleDeleteMessage = (chatId, messageId) => {
    if (window.confirm("Delete this message?")) {
      onDeleteMessage?.(chatId, messageId);
    }
  };

  return (
    <div className="d-flex flex-column h-100">
      {activeChat ? (
        <>
          <div className="d-flex align-items-center gap-2 p-3 border-bottom">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setActiveChat(null)}
              aria-label="Back to conversations"
            >
              <HiChevronLeft size={22} />
            </button>

            <div
              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 40, height: 40 }}
            >
              {getChatPartner?.(activeChat)?.profilePic ? (
                <img
                  className="rounded-circle w-100 h-100 object-fit-cover"
                  src={getChatPartner(activeChat).profilePic}
                  alt=""
                />
              ) : (
                getChatPartner?.(activeChat)?.name?.charAt(0) || "?"
              )}
            </div>

            <div className="fw-semibold">
              {getChatPartner?.(activeChat)?.name || "Conversation"}
            </div>
          </div>

          <div className="flex-grow-1 overflow-auto p-3">
            {messages.map((msg) => {
              const senderId = msg.sender?._id || msg.sender;
              const isOwnMessage = senderId === user?._id;

              return (
                <div
                  key={msg._id}
                  className={`d-flex mb-3 ${
                    isOwnMessage
                      ? "justify-content-end"
                      : "justify-content-start"
                  }`}
                >
                  <div
                    className={`p-2 rounded-3 ${
                      isOwnMessage ? "bg-primary text-white" : "bg-light border"
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Property reference"
                        className="img-fluid rounded mb-2"
                      />
                    )}

                    {msg.text && <div>{msg.text}</div>}

                    <div className="d-flex justify-content-between align-items-center gap-3 mt-1">
                      <small
                        className={
                          isOwnMessage ? "text-white-50" : "text-muted"
                        }
                      >
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </small>

                      {isOwnMessage && (
                        <button
                          type="button"
                          className="btn btn-sm p-0 text-white"
                          onClick={() =>
                            handleDeleteMessage(activeChat._id, msg._id)
                          }
                          title="Delete message"
                          aria-label="Delete message"
                        >
                          <HiOutlineTrash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="d-flex gap-2 p-3 border-top"
            onSubmit={handleSendMessage}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              aria-label="Message"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newMessage.trim()}
              aria-label="Send message"
            >
              <HiPaperAirplane />
            </button>
          </form>
        </>
      ) : (
        <div className="d-flex flex-column align-items-center justify-content-center text-center h-100 p-4">
          <HiOutlineChatBubbleLeftRight
            size={44}
            className="text-secondary mb-3"
          />
          <h3 className="h5">Your Messages</h3>
          <p className="text-muted mb-0">
            Select a conversation to start chatting.
          </p>
          {chats.length === 0 && (
            <small className="text-muted mt-2">No conversations yet.</small>
          )}
        </div>
      )}
    </div>
  );
}
