import { useTitle } from "@/lib/useTitle";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { SHOWROOMS, telLink } from "@shared/site";

export default function ShowroomPage() {
  useTitle("Hệ thống showroom");
  const regions = [...new Set(SHOWROOMS.map((s) => s.region))];

  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44 pb-16 flex-1">
        <h1 className="text-3xl font-black text-zinc-900 mb-2">Hệ thống showroom</h1>
        <p className="text-zinc-500 font-medium mb-8">
          {SHOWROOMS.length} showroom trên toàn quốc – trải nghiệm máy trực tiếp, nhận hàng và bảo hành tại cửa hàng gần nhất.
        </p>

        <div className="space-y-10">
          {regions.map((region) => (
            <section key={region}>
              <h2 className="text-lg font-black text-primary uppercase tracking-widest mb-4">{region}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {SHOWROOMS.filter((s) => s.region === region).map((s) => (
                  <div key={s.name} className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-3">
                    <h3 className="font-black text-zinc-900">{s.name}</h3>
                    <p className="flex gap-2 text-sm text-zinc-600"><MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />{s.address}</p>
                    <a href={telLink(s.phone)} className="flex gap-2 text-sm font-bold text-zinc-700 hover:text-primary"><Phone className="w-4 h-4 text-primary shrink-0" />{s.phone}</a>
                    <p className="flex gap-2 text-sm text-zinc-600"><Clock className="w-4 h-4 text-primary shrink-0" />{s.hours} (tất cả các ngày)</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-black hover:bg-primary hover:text-white transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Chỉ đường
                    </a>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
