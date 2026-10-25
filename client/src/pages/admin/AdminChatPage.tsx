import { useTitle } from "@/lib/useTitle";
import ChatClient from "../chat/ChatClient";

export default function AdminChatPage() {
  useTitle("Tin nhắn khách hàng");
  return <ChatClient embedded />;
}
