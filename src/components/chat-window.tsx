"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, User } from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export default function ChatWindow({ 
  myId, 
  otherUserId, 
  otherUserName,
  listingId 
}: { 
  myId: string, 
  otherUserId: string, 
  otherUserName: string,
  listingId?: string 
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?userId=${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.reverse()); // Show oldest first
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  }, [otherUserId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: otherUserId,
          content: newMessage,
          listingId
        }),
      });
      
      if (!res.ok) throw new Error("Failed to send");

      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message", error);
      toast.error("Mesaj göndərilmədi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">{otherUserName}</h3>
          <p className="text-xs text-green-500">Onlayn</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                isMe 
                  ? 'bg-green-600 text-white rounded-tr-none' 
                  : 'bg-gray-800 text-gray-200 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 bg-gray-950 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mesaj yazın..."
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
