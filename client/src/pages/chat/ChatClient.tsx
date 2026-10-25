import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Send,
  Search,
  User,
  Laptop,
  ArrowLeft,
  Store,
  Loader2,
  Check,
  CheckCheck
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Navbar } from "@/components/layout/Navbar";
import { SITE } from "@shared/site";

export default function ChatClient({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeId = searchParams.get("id");

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isStarting, setIsStarting] = useState(false);
  const [search, setSearch] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const userId = user?.id;
  const isAdmin = user?.role === "ADMIN";

  // Khách bắt đầu hội thoại chung với cửa hàng (không gắn sản phẩm)
  const startShopConversation = async () => {
    setIsStarting(true);
    try {
      const conv = await api<{ id: string }>("/api/chat/conversations", { method: "POST", body: {} });
      await fetchConversations();
      navigate(`${pathname}?id=${conv.id}`);
    } catch {
      // Không tạo được hội thoại: giữ nguyên màn hình
    }
    setIsStarting(false);
  };

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    try {
      setConversations(await api<any[]>("/api/chat/conversations"));
    } catch {
      // Lỗi mạng tạm thời: lần làm mới sau sẽ tải lại
    }
    setIsLoading(false);
  };

  // 2. Fetch Messages
  const fetchMessages = async (id: string) => {
    try {
      setMessages(await api<any[]>(`/api/chat/conversations/${id}/messages`));
    } catch {
      // Lỗi mạng tạm thời: lần làm mới sau sẽ tải lại
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
      const interval = setInterval(() => fetchMessages(activeId), 5000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [activeId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeId || isSending) return;

    setIsSending(true);
    const content = input.trim();
    setInput("");

    try {
      const newMessage = await api(`/api/chat/conversations/${activeId}/messages`, { method: "POST", body: { content } });
      setMessages((prev) => [...prev, newMessage]);
      fetchConversations(); // Cập nhật tin cuối ở danh sách bên trái
    } catch {
      setInput(content); // gửi lỗi: trả lại nội dung để gửi lại
    }
    setIsSending(false);
  };

  const activeConversation = conversations.find(c => c.id === activeId);
  // Admin thấy tên khách, khách thấy tên cửa hàng
  const partnerName = (conv: any) => (isAdmin ? conv.user.name : `${SITE.name} - Hỗ trợ khách hàng`);
  const otherUser = activeConversation ? { name: partnerName(activeConversation) } : null;
  const visibleConversations = conversations.filter((c) =>
    !search.trim() ||
    `${c.user?.name} ${c.user?.email} ${c.product?.name || ""} ${c.lastMessage || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white ${embedded ? "h-[calc(100vh-10rem)] rounded-3xl border border-zinc-200 overflow-hidden" : "h-screen"}`}>
      {!embedded && <Navbar />}

      <div className={`flex-1 flex overflow-hidden ${embedded ? "" : "pt-40 md:pt-44"}`}>
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen || !activeId ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-80 lg:w-96 border-r border-zinc-100 bg-zinc-50/30 overflow-hidden`}>
          <div className="p-6 border-b border-zinc-100 bg-white">
            <h2 className="text-xl font-black text-zinc-900 mb-4 uppercase tracking-tighter">
              {isAdmin ? "Tin nhắn khách hàng" : "Hỗ trợ trực tuyến"}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm hội thoại..."
                className="w-full bg-zinc-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            {!isAdmin && (
              <button
                onClick={startShopConversation}
                disabled={isStarting}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-black hover:bg-primary-dark transition-all disabled:opacity-60"
              >
                {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
                Nhắn tin cho cửa hàng
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {visibleConversations.length === 0 ? (
              <div className="p-10 text-center text-zinc-400">
                <p className="text-sm font-bold uppercase tracking-widest">Chưa có tin nhắn nào</p>
              </div>
            ) : (
              visibleConversations.map((conv) => {
                const partner = { name: partnerName(conv) };
                const isActive = conv.id === activeId;
                const unreadCount = conv.unreadCount || 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      navigate(`${pathname}?id=${conv.id}`);
                      setSidebarOpen(false);
                    }}
                    className={`w-full p-4 flex gap-4 transition-all border-b border-zinc-100/50 hover:bg-white relative ${
                      isActive ? "bg-white shadow-sm border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                      {partner.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-zinc-900 truncate">{partner.name}</h4>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          {format(new Date(conv.lastMsgAt), "HH:mm", { locale: vi })}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${unreadCount > 0 ? "text-zinc-900 font-bold" : "text-zinc-500 font-medium"}`}>
                        {conv.lastMessage || "Bắt đầu cuộc trò chuyện..."}
                      </p>
                      {conv.product && (
                        <div className="flex items-center gap-1 mt-1 text-[9px] font-black text-primary uppercase tracking-tighter">
                          <Laptop className="w-2.5 h-2.5" />
                          <span className="truncate">{conv.product.name}</span>
                        </div>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute right-4 bottom-4 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        {unreadCount}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <main className={`${
          !activeId ? "hidden md:flex" : "flex"
        } flex-1 flex-col bg-white overflow-hidden relative`}>
          {activeId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 md:p-6 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      navigate(pathname);
                      setSidebarOpen(true);
                    }}
                    className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-900"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                    {otherUser?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-zinc-900 leading-none">{otherUser?.name}</h3>
                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Đang trực tuyến
                    </p>
                  </div>
                </div>

                {activeConversation?.product && (
                  <div className="hidden sm:flex items-center gap-3 p-2 pr-4 bg-zinc-50 rounded-2xl border border-zinc-100 max-w-xs group cursor-pointer" onClick={() => navigate(`/products/${activeConversation.product.id}`)}>
                    <div className="w-10 h-10 bg-white rounded-lg border border-zinc-100 flex items-center justify-center shrink-0">
                      <Laptop className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Sản phẩm đang hỏi</p>
                      <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-primary transition-colors">{activeConversation.product.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-zinc-50/20"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                      <Send className="w-8 h-8 text-primary opacity-20" />
                    </div>
                    <h4 className="font-black text-zinc-900 mb-2">Bắt đầu trò chuyện</h4>
                    <p className="text-sm text-zinc-400 font-medium max-w-xs">
                      {isAdmin
                        ? "Khách hàng chưa gửi tin nhắn nào."
                        : "Hãy hỏi nhân viên tư vấn về cấu hình, tồn kho, bảo hành hoặc thời gian giao hàng."}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    // Với admin, mọi tin không phải của khách đều là tin của cửa hàng
                    const isMine = isAdmin ? msg.senderId !== activeConversation?.userId : msg.senderId === userId;
                    const showDate = i === 0 || format(new Date(messages[i-1].createdAt), "dd/MM") !== format(new Date(msg.createdAt), "dd/MM");

                    return (
                      <div key={msg.id} className="space-y-4">
                        {showDate && (
                          <div className="flex justify-center my-8">
                            <span className="px-4 py-1 bg-white border border-zinc-100 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest shadow-sm">
                              {format(new Date(msg.createdAt), "dd MMMM, yyyy", { locale: vi })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] md:max-w-[70%] group ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                            <div className={`px-5 py-3.5 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm ${
                              isMine
                                ? "bg-primary text-white rounded-tr-none"
                                : "bg-white text-zinc-900 rounded-tl-none border border-zinc-100"
                            }`}>
                              {msg.content}
                            </div>
                            <div className={`flex items-center gap-1.5 mt-2 px-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                               <span className="text-[9px] font-bold text-zinc-400 uppercase">
                                 {format(new Date(msg.createdAt), "HH:mm")}
                               </span>
                               {isMine && (
                                 msg.isRead ? <CheckCheck className="w-3 h-3 text-primary" /> : <Check className="w-3 h-3 text-zinc-300" />
                               )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-zinc-100">
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-4 bg-zinc-50 p-2 rounded-[24px] border border-zinc-100 focus-within:border-primary/30 transition-all"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-transparent border-none py-3 px-4 text-sm outline-none font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isSending}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      input.trim() ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95" : "bg-zinc-200 text-zinc-400"
                    }`}
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center mt-4 italic">
                  Hotline hỗ trợ: {SITE.hotline} ({SITE.workingHours})
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50/30 p-10 text-center">
              <div className="w-24 h-24 bg-white rounded-[40px] shadow-xl flex items-center justify-center mb-8 border border-zinc-100">
                <User className="w-10 h-10 text-primary opacity-20" />
              </div>
              <h3 className="text-2xl font-black text-zinc-900 mb-3 tracking-tighter uppercase">Chọn một hội thoại</h3>
              <p className="text-zinc-500 font-medium max-w-sm">
                {isAdmin
                  ? "Chọn một hội thoại bên trái để trả lời khách hàng."
                  : "Nhân viên tư vấn của cửa hàng luôn sẵn sàng hỗ trợ bạn chọn laptop phù hợp."}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
