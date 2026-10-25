import { Link } from "react-router";
import { Laptop, Phone, Mail, MapPin, Truck, MessageCircle, Clock, CreditCard } from "lucide-react";
import { SITE, BRANDS, brandSlug, SHOWROOMS, SUPPORT_LINKS, SERVICE_LINKS, SUPPORT_TEAMS, telLink, zaloLink } from "@shared/site";

export function Footer() {
  const regions = [...new Set(SHOWROOMS.map((s) => s.region))];

  return (
    <footer className="mt-auto">
      {/* Kênh mua hàng */}
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 md:px-12 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black uppercase text-sm">Bán hàng online toàn quốc</p>
              <p className="text-xs text-white/80">{SITE.onlineHours} · Miễn phí giao hàng toàn quốc</p>
              <a href={telLink(SITE.hotline)} className="text-lg font-black text-yellow-300">{SITE.hotline}</a>
            </div>
          </div>
          {SUPPORT_TEAMS.map((team) => (
            <div key={team.title} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="font-black uppercase text-sm">Bộ phận {team.title.toLowerCase()}</p>
                <p className="text-xs text-white/80 truncate">{team.email}</p>
                <div className="flex items-center gap-3">
                  <a href={telLink(team.phone)} className="font-black">{team.phone}</a>
                  <a href={zaloLink()} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-md text-[11px] font-bold hover:bg-white/25">
                    <MessageCircle className="w-3 h-3" /> Chat Zalo
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0b1f3a] text-zinc-300 pt-12 pb-8">
        <div className="container mx-auto px-4 md:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="space-y-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <Laptop className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">{SITE.name}</span>
            </Link>
            <p className="text-sm leading-relaxed text-zinc-400">{SITE.slogan}. Cam kết sản phẩm chính hãng 100%, bảo hành tận tâm.</p>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> {SITE.email}</li>
              <li className="flex gap-2"><Clock className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> {SITE.workingHours}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.href}><Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4">Trung tâm dịch vụ</h4>
            <ul className="space-y-2 text-sm">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}><Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mt-6 mb-3">Thương hiệu</h4>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((b) => (
                <Link key={b} to={`/products?brand=${brandSlug(b)}`} className="px-2 py-1 rounded-md bg-white/5 text-xs hover:bg-white/15 hover:text-white">
                  {b}
                </Link>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4">Hệ thống showroom</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {regions.map((region) => (
                <div key={region}>
                  <p className="text-xs font-black text-primary uppercase mb-2">{region}</p>
                  <ul className="space-y-2">
                    {SHOWROOMS.filter((s) => s.region === region).map((s) => (
                      <li key={s.name} className="flex gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        <span>
                          {s.address}
                          <a href={telLink(s.phone)} className="block text-xs text-zinc-400 hover:text-white">{s.phone}</a>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link to="/he-thong-showroom" className="inline-block mt-4 text-sm font-bold text-primary hover:underline">Xem tất cả showroom →</Link>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-12 mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <span>© {new Date().getFullYear()} {SITE.name}. Bảo lưu mọi quyền.</span>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {["COD", "VNPAY", "MoMo", "Visa / Master", "Trả góp 0%"].map((m) => (
              <span key={m} className="px-2 py-1 rounded bg-white/5 text-zinc-300 font-bold">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
