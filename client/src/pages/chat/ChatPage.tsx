import { useTitle } from "@/lib/useTitle";
import ChatClient from "./ChatClient";

export default function ChatPage() {
  useTitle("Tin nhắn");
  return <ChatClient />;
}
