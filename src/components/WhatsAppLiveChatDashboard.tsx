// src/components/WhatsAppLiveChatDashboard.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import apiClient from "../services/api";
import { X } from "lucide-react";

type WhatsAppLiveChatMessage = {
  fromPhoneNumber: string;
  customerName: string;
  message: string;
  receivedAtUtc: string;
};

type Conversation = {
  fromPhoneNumber: string;
  customerName: string;
  messages: WhatsAppLiveChatMessage[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5072/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export interface WhatsAppLiveChatDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function WhatsAppLiveChatDashboard(props: WhatsAppLiveChatDashboardProps) {
  const { isOpen, onClose } = props;
  const isModal = isOpen !== undefined;

  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [reply, setReply] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<
    "Connecting" | "Connected" | "Reconnecting" | "Disconnected" | "Failed"
  >("Connecting");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = useMemo(() => {
    if (!selectedPhone) return null;
    return conversations[selectedPhone] ?? null;
  }, [conversations, selectedPhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_ORIGIN}/hubs/whatsapp-live-chat`, {
        accessTokenFactory: () => token ?? "",
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveWhatsAppMessage", (message: WhatsAppLiveChatMessage) => {
      setConversations((current) => {
        const existing = current[message.fromPhoneNumber];
        return {
          ...current,
          [message.fromPhoneNumber]: {
            fromPhoneNumber: message.fromPhoneNumber,
            customerName: message.customerName || "Customer",
            messages: [...(existing?.messages ?? []), message],
          },
        };
      });
      setSelectedPhone((current) => current || message.fromPhoneNumber);
    });

    connection
      .start()
      .then(() => setConnectionStatus("Connected"))
      .catch(() => setConnectionStatus("Failed"));

    connection.onreconnecting(() => setConnectionStatus("Reconnecting"));
    connection.onreconnected(() => setConnectionStatus("Connected"));
    connection.onclose(() => setConnectionStatus("Disconnected"));

    return () => {
      connection.stop();
    };
  }, []);

  async function sendReply() {
    if (!selectedConversation || !reply.trim()) return;
    setIsSending(true);
    setSendError(null);

    try {
      await apiClient.post("/whatsapp/support/reply", {
        toPhoneNumber: selectedConversation.fromPhoneNumber,
        message: reply.trim(),
      });

      const supportMessage: WhatsAppLiveChatMessage = {
        fromPhoneNumber: "support",
        customerName: "Support",
        message: reply.trim(),
        receivedAtUtc: new Date().toISOString(),
      };

      setConversations((current) => {
        const existing = current[selectedConversation.fromPhoneNumber];
        return {
          ...current,
          [selectedConversation.fromPhoneNumber]: {
            ...existing,
            messages: [...(existing?.messages ?? []), supportMessage],
          },
        };
      });

      setReply("");
    } catch {
      setSendError("Failed to send reply. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendReply();
    }
  }

  const conversationList = Object.values(conversations);

  const statusColor =
    connectionStatus === "Connected"
      ? "#16a34a"
      : connectionStatus === "Reconnecting"
      ? "#d97706"
      : "#dc2626";

  const dashboardContent = (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.title}>WhatsApp Live Chat</h2>
          <span style={{ ...styles.statusBadge, background: statusColor }}>
            {connectionStatus}
          </span>
        </div>

        {conversationList.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>💬</p>
            <p style={styles.emptyText}>No active conversations yet.</p>
            <p style={styles.emptyHint}>Messages from customers will appear here.</p>
          </div>
        ) : (
          conversationList.map((conversation) => {
            const lastMsg = conversation.messages.at(-1);
            const isSelected = selectedPhone === conversation.fromPhoneNumber;
            return (
              <button
                key={conversation.fromPhoneNumber}
                onClick={() => setSelectedPhone(conversation.fromPhoneNumber)}
                style={{
                  ...styles.conversationItem,
                  ...(isSelected ? styles.conversationItemActive : {}),
                }}
              >
                <div style={styles.conversationAvatar}>
                  {(conversation.customerName || "C").charAt(0).toUpperCase()}
                </div>
                <div style={styles.conversationInfo}>
                  <strong style={styles.conversationName}>{conversation.customerName}</strong>
                  <span style={styles.conversationPhone}>{conversation.fromPhoneNumber}</span>
                  <span style={styles.conversationPreview}>
                    {lastMsg?.message?.slice(0, 50) ?? ""}
                  </span>
                </div>
                <span style={styles.conversationCount}>
                  {conversation.messages.length}
                </span>
              </button>
            );
          })
        )}
      </aside>

      <main style={styles.chatPanel}>
        {!selectedConversation ? (
          <div style={styles.placeholder}>
            <p style={{ fontSize: 48, margin: 0 }}>💬</p>
            <p style={{ color: "#6b7280", marginTop: 12 }}>Select a conversation to start replying</p>
          </div>
        ) : (
          <>
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderAvatar}>
                {(selectedConversation.customerName || "C").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong style={{ display: "block", color: "#111827" }}>
                  {selectedConversation.customerName}
                </strong>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {selectedConversation.fromPhoneNumber}
                </span>
              </div>
              <span style={styles.messageCountBadge}>
                {selectedConversation.messages.length} messages
              </span>
            </div>

            <div style={styles.messages}>
              {selectedConversation.messages.map((msg, index) => {
                const isSupport = msg.fromPhoneNumber === "support";
                return (
                  <div
                    key={`${msg.receivedAtUtc}-${index}`}
                    style={{
                      ...styles.messageBubble,
                      ...(isSupport ? styles.supportBubble : styles.customerBubble),
                    }}
                  >
                    <p style={styles.messageText}>{msg.message}</p>
                    <small style={styles.messageTime}>
                      {isSupport ? "You · " : `${msg.customerName} · `}
                      {new Date(msg.receivedAtUtc).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {sendError && <div style={styles.sendError}>{sendError}</div>}
            <div style={styles.replyBar}>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a reply... (Ctrl+Enter to send)"
                style={styles.textarea}
                rows={2}
              />
              <button
                onClick={sendReply}
                disabled={isSending || !reply.trim()}
                style={{
                  ...styles.sendButton,
                  ...(isSending || !reply.trim() ? styles.sendButtonDisabled : {}),
                }}
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );

  // Full-page mode (no modal props provided)
  if (!isModal) return dashboardContent;

  // Modal mode — ONLY render when open
  if (!isOpen) return null;

  return (
    <div style={styles.modalRoot}>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.modalWrapper} onClick={onClose}>
        <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <span style={styles.modalTitle}>WhatsApp Live Chat</span>
            <button onClick={onClose} style={styles.closeButton}>
              <X size={18} />
            </button>
          </div>
          <div style={styles.modalBody}>{dashboardContent}</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modalRoot: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
  },
  modalWrapper: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 1100,
    height: "85vh",
    background: "#ffffff",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#111827",
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 6,
    border: "none",
    background: "transparent",
    color: "#6b7280",
    cursor: "pointer",
  },
  modalBody: {
    flex: 1,
    overflow: "hidden",
  },
  page: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    height: "100%",
    overflow: "hidden",
    background: "#ffffff",
  },
  sidebar: {
    borderRight: "1px solid #e5e7eb",
    overflowY: "auto",
    background: "#f9fafb",
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: "16px 16px 12px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
  },
  statusBadge: {
    display: "inline-block",
    marginTop: 6,
    fontSize: 11,
    fontWeight: 600,
    color: "#ffffff",
    padding: "2px 8px",
    borderRadius: 999,
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    textAlign: "center",
  },
  emptyIcon: { fontSize: 36, margin: 0 },
  emptyText: { color: "#374151", fontSize: 14, fontWeight: 600, marginTop: 8 },
  emptyHint: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
  conversationItem: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    textAlign: "left",
    padding: "12px 14px",
    border: "none",
    borderBottom: "1px solid #f3f4f6",
    background: "transparent",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  conversationItemActive: {
    background: "#eff6ff",
    borderLeft: "3px solid #2563eb",
  },
  conversationAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },
  conversationInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  conversationName: {
    fontSize: 13,
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  conversationPhone: { fontSize: 11, color: "#6b7280" },
  conversationPreview: {
    fontSize: 11,
    color: "#9ca3af",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  conversationCount: {
    fontSize: 11,
    fontWeight: 700,
    color: "#2563eb",
    background: "#dbeafe",
    padding: "2px 6px",
    borderRadius: 999,
    flexShrink: 0,
  },
  chatPanel: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    background: "#ffffff",
  },
  placeholder: {
    margin: "auto",
    textAlign: "center",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 20px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },
  messageCountBadge: {
    marginLeft: "auto",
    fontSize: 11,
    color: "#6b7280",
    background: "#f3f4f6",
    padding: "3px 10px",
    borderRadius: 999,
  },
  messages: {
    flex: 1,
    padding: "16px 20px",
    overflowY: "auto",
    background: "#f3f4f6",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  messageBubble: {
    maxWidth: "72%",
    padding: "10px 14px",
    borderRadius: 12,
  },
  customerBubble: {
    background: "#ffffff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  },
  supportBubble: {
    background: "#2563eb",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageText: {
    margin: 0,
    fontSize: 14,
    whiteSpace: "pre-wrap",
    color: "inherit",
  },
  messageTime: {
    display: "block",
    marginTop: 4,
    fontSize: 10,
    opacity: 0.6,
  },
  sendError: {
    padding: "8px 20px",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: 12,
    borderTop: "1px solid #fecaca",
  },
  replyBar: {
    display: "grid",
    gridTemplateColumns: "1fr 90px",
    gap: 10,
    padding: "12px 16px",
    borderTop: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  textarea: {
    resize: "none",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 12px",
    font: "inherit",
    fontSize: 14,
    outline: "none",
    lineHeight: 1.5,
  },
  sendButton: {
    border: 0,
    borderRadius: 8,
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  sendButtonDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },
};



