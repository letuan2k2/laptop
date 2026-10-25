import { Link, useParams } from "react-router";
import { ChevronRight, FileText } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { POLICIES, getPolicy } from "@/lib/policies";
import { useTitle } from "@/lib/useTitle";
import NotFoundPage from "./NotFoundPage";

export default function PolicyPage() {
  const { slug = "" } = useParams();
  const policy = getPolicy(slug);
  useTitle(policy?.title ?? "Không tìm thấy trang");
  if (!policy) return <NotFoundPage />;

  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44 pb-16 flex-1">
        <nav className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 mb-6">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-900">{policy.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-zinc-100 p-3 lg:sticky lg:top-44">
              <p className="px-3 py-2 text-xs font-black uppercase tracking-widest text-zinc-400">Chính sách & hướng dẫn</p>
              {POLICIES.map((p) => (
                <Link
                  key={p.slug}
                  to={`/chinh-sach/${p.slug}`}
                  className={`block px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    p.slug === policy.slug ? "bg-primary text-white" : "text-zinc-600 hover:bg-zinc-50 hover:text-primary"
                  }`}
                >
                  {p.title}
                </Link>
              ))}
            </div>
          </aside>

          <article className="lg:col-span-9 bg-white rounded-3xl border border-zinc-100 p-6 md:p-10 space-y-8">
            <header className="flex items-start gap-4 pb-6 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-zinc-900">{policy.title}</h1>
                <p className="text-zinc-500 font-medium mt-1">{policy.summary}</p>
              </div>
            </header>

            {policy.sections.map((section) => (
              <section key={section.heading} className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900">{section.heading}</h2>
                {section.paragraphs?.map((p, i) => (
                  <p key={i} className="text-zinc-600 leading-relaxed">{p}</p>
                ))}
                {section.bullets && (
                  <ul className="space-y-2">
                    {section.bullets.map((b, i) => (
                      <li key={i} className="flex gap-3 text-zinc-600 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>
        </div>
      </div>
      <Footer />
    </main>
  );
}
