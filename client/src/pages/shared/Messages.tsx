import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Send } from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";

interface Conversation {
  _id: string;
  customerId?: {
    _id: string;
    name?: string;
    profileImage?: string;
  };
  providerId?: {
    _id: string;
    userId?: {
      _id: string;
      name?: string;
      profileImage?: string;
    };
  };
  bookingId?: string;
  lastMessageAt?: string;
  createdAt?: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  bookingId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [params] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  // Lets the socket handler below always read the *current* active conversation
  // without needing to reconnect the socket every time it changes.
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // --------------------------------------------------
  // SOCKET CONNECTION — connect once on mount, not on every conversation switch
  // --------------------------------------------------

  useEffect(() => {
    const token = localStorage.getItem("lsf_token");

    if (!token) {
      console.warn("⚠️ No authentication token found.");
      return;
    }

    const socketUrl =
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
      "http://localhost:5000";

    console.log("🔌 Connecting Socket.IO:", socketUrl);

    const socket = io(socketUrl, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("new_message", (msg: Message) => {
      console.log("📩 New socket message:", msg);

      // Only add message for the currently active conversation
      if (msg.conversationId !== activeIdRef.current) {
        return;
      }

      setMessages((prev) => {
        const alreadyExists = prev.some((item) => item._id === msg._id);
        if (alreadyExists) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      console.log("🔌 Disconnecting socket...");
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // --------------------------------------------------
  // LOAD CONVERSATIONS — guarded against React 18 dev-mode double-invoke
  // --------------------------------------------------

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    loadConversations();
  }, []);

  async function loadConversations() {
    setLoading(true);

    try {
      console.log("📋 Loading conversations...");

      const res = await api.get("/chat/conversations");
      console.log("✅ Conversations response:", res.data);

      const list: Conversation[] = res.data?.data || [];
      setConversations(list);

      const providerParam = params.get("provider");

      if (providerParam) {
        console.log("👤 Starting conversation with provider:", providerParam);

        const startRes = await api.post("/chat/conversations", {
          providerId: providerParam,
        });

        console.log("✅ Conversation created:", startRes.data);

        const newConversation: Conversation = startRes.data.data;

        setConversations((prev) => {
          const exists = prev.some((c) => c._id === newConversation._id);
          if (exists) {
            return prev.map((c) => (c._id === newConversation._id ? newConversation : c));
          }
          return [newConversation, ...prev];
        });

        setActiveId(newConversation._id);
      } else if (list.length > 0) {
        setActiveId(list[0]._id);
      } else {
        setActiveId(null);
      }
    } catch (error: any) {
      console.error("❌ Conversation error:", error);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
      console.error("URL:", error.config?.url);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // LOAD MESSAGES
  // --------------------------------------------------

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        console.log("📨 Loading messages for:", activeId);

        const res = await api.get(`/chat/conversations/${activeId}/messages`);
        console.log("✅ Messages response:", res.data);

        setMessages(res.data?.data || []);

        socketRef.current?.emit("join_conversation", activeId);
        console.log("👥 Joined conversation:", activeId);
      } catch (error: any) {
        console.error("❌ Messages error:", error);
        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
        console.error("URL:", error.config?.url);
      }
    }

    loadMessages();
  }, [activeId]);

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------

  async function send() {
    if (sending) return;

    const messageText = text.trim();
    if (!messageText) return;

    if (!activeId) {
      console.warn("❌ Cannot send message: no active conversation.");
      return;
    }

    if (!user?.id) {
      console.warn("❌ Cannot send message: user not logged in.");
      return;
    }

    const conv = conversations.find((c) => c._id === activeId);

    if (!conv) {
      console.error("❌ Active conversation not found:", activeId);
      console.error("Available conversations:", conversations);
      return;
    }

    console.log("💬 Active conversation:", conv);
    console.log("👤 Current user:", user);
    console.log("👤 Current user role:", user.role);

    // CUSTOMER: conversation.providerId = ProviderProfile, .providerId.userId = User
    // PROVIDER: conversation.customerId = User
    let receiverId: string | undefined;

    if (user.role === "PROVIDER") {
      receiverId = conv.customerId?._id;
    } else {
      receiverId = conv.providerId?.userId?._id;
    }

    console.log("📤 Receiver ID:", receiverId);
    console.log("📝 Message:", messageText);

    if (!receiverId) {
      console.error("❌ Receiver ID is missing.");
      console.error("Conversation object:", conv);
      alert("Unable to send message. Receiver information is missing.");
      return;
    }

    try {
      setSending(true);
      console.log("📤 Sending message...");

      const res = await api.post(`/chat/conversations/${activeId}/messages`, {
        receiverId,
        message: messageText,
      });

      console.log("✅ Message sent successfully:", res.data);

      const newMessage: Message = res.data.data;

      setMessages((prev) => {
        const exists = prev.some((m) => m._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });

      setText("");

      setConversations((prev) =>
        prev.map((c) => (c._id === activeId ? { ...c, lastMessageAt: newMessage.createdAt } : c))
      );

      // The backend does NOT broadcast this over the socket itself — sendMessage
      // only saves it and returns via REST. We have to relay it ourselves so the
      // other person sees it live.
      socketRef.current?.emit("send_message", {
        conversationId: activeId,
        message: newMessage,
      });
    } catch (error: any) {
      console.error("❌ Send message error:", error);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
      console.error("URL:", error.config?.url);

      alert(error.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading messages..." />;
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-10 grid md:grid-cols-3 gap-6 h-[70vh]">
      <div className="card p-0 overflow-y-auto md:col-span-1">
        {conversations.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No conversations" subtitle="Message a provider from their profile to start chatting." />
          </div>
        ) : (
          conversations.map((c) => {
            const name = user?.role === "PROVIDER" ? c.customerId?.name : c.providerId?.userId?.name;
            return (
              <button
                key={c._id}
                onClick={() => setActiveId(c._id)}
                className={`w-full text-left p-4 border-b border-border hover:bg-surface-alt ${
                  activeId === c._id ? "bg-primary-light" : ""
                }`}
              >
                <p className="font-semibold text-sm">{name || "User"}</p>
              </button>
            );
          })
        )}
      </div>

      <div className="card p-0 md:col-span-2 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-text-secondary">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = String(m.senderId) === String(user?.id);
              return (
                <div
                  key={m._id}
                  className={`max-w-[70%] px-4 py-2 rounded-xl text-sm ${
                    isMine ? "bg-primary text-white ml-auto" : "bg-surface-alt text-text-primary"
                  }`}
                >
                  {m.message}
                </div>
              );
            })
          )}
        </div>

        {activeId && (
          <div className="flex gap-2 p-4 border-t border-border">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type a message..."
              disabled={sending}
              className="input-field"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="bg-primary text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}