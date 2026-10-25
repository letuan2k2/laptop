import { useTitle } from "@/lib/useTitle";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FeedbackForm } from "./FeedbackForm";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { SITE, SUPPORT_TEAMS, telLink, zaloLink } from "@shared/site";

export default function FeedbackPage() {
  useTitle("Góp ý, khiếu nại");
  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44 pb-16 flex-1">
        <h1 className="text-3xl font-black text-zinc-900 mb-2">Góp ý, khiếu nại</h1>
        <p className="text-zinc-500 font-medium mb-8">
          Mọi ý kiến của bạn đều được bộ phận chăm sóc khách hàng tiếp nhận và phản hồi trong vòng 24 giờ làm việc.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <FeedbackForm />
          </div>
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-4">
              <h2 className="font-black text-zinc-900">Liên hệ nhanh</h2>
              <a href={telLink(SITE.hotline)} className="flex items-center gap-3 text-sm font-bold text-zinc-700 hover:text-primary">
                <Phone className="w-4 h-4 text-primary" /> Hotline: {SITE.hotline}
              </a>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 text-sm font-bold text-zinc-700 hover:text-primary">
                <Mail className="w-4 h-4 text-primary" /> {SITE.email}
              </a>
              <a href={zaloLink()} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-bold text-zinc-700 hover:text-primary">
                <MessageCircle className="w-4 h-4 text-primary" /> Chat Zalo
              </a>
            </div>
            {SUPPORT_TEAMS.map((team) => (
              <div key={team.title} className="bg-white rounded-3xl border border-zinc-100 p-6">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">{team.title}</p>
                <a href={telLink(team.phone)} className="block font-black text-secondary">{team.phone}</a>
                <p className="text-sm text-zinc-500">{team.email}</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  );
}
