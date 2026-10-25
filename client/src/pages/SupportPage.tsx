import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { HelpCircle, User, ShoppingCart, CreditCard, Truck, Mail, MessageSquare } from "lucide-react";
import { Link } from "react-router";
import { Footer } from "@/components/layout/Footer";
import { SITE } from "@shared/site";

export default function SupportPage() {
  const { t } = useLanguage();

  const topics = [
    { icon: User, title: t("support.topic.account"), desc: t("support.topic.account.desc") },
    { icon: ShoppingCart, title: t("support.topic.orders"), desc: t("support.topic.orders.desc") },
    { icon: CreditCard, title: t("support.topic.payments"), desc: t("support.topic.payments.desc") },
    { icon: Truck, title: t("support.topic.shipping"), desc: t("support.topic.shipping.desc") },
  ];

  const faqs = [
    { q: t("support.faq.q1"), a: t("support.faq.a1") },
    { q: t("support.faq.q2"), a: t("support.faq.a2") },
    { q: t("support.faq.q3"), a: t("support.faq.a3") },
    { q: t("support.faq.q4"), a: t("support.faq.a4") },
    { q: t("support.faq.q5"), a: t("support.faq.a5") },
  ];

  const handleTopicClick = () => {
    const element = document.getElementById('faqs');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-44 pb-20 bg-[#F4F7FB] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-zinc-900">{t("support.title")}</h1>
          <p className="text-xl text-zinc-500 mb-8">{t("support.subtitle")}</p>
          
          <div className="max-w-2xl mx-auto relative">
            <input 
              type="text" 
              placeholder={t("support.searchPlaceholder")} 
              className="w-full bg-white border border-zinc-100 rounded-2xl py-4 px-6 pl-14 text-sm focus:ring-1 focus:ring-primary/20 transition-all outline-none shadow-sm"
            />
            <HelpCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Topics Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {topics.map((topic, i) => (
              <div 
                key={i} 
                onClick={handleTopicClick}
                className="bg-white border border-zinc-100 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group block"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <topic.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-zinc-900">{topic.title}</h3>
                <p className="text-sm text-zinc-500">{topic.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="py-20 bg-zinc-50 scroll-mt-44">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl">
          <h2 className="text-3xl font-bold mb-10 text-center text-zinc-900">{t("support.faq.title")}</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white border border-zinc-100 rounded-xl overflow-hidden group">
                <summary className="flex justify-between items-center p-6 cursor-pointer font-bold text-zinc-900 hover:text-primary transition-colors">
                  <span>{faq.q}</span>
                  <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-6 pt-0 text-sm text-zinc-600 border-t border-zinc-50">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-900">{t("support.contact.title")}</h2>
          <p className="text-lg text-zinc-500 mb-10 max-w-2xl mx-auto">
            {t("support.contact.desc")}
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href={`mailto:${SITE.email}`} 
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <Mail className="w-5 h-5" />
              {t("support.contact.button")}
            </a>
            <Link 
              to="/chat" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold hover:bg-zinc-50 transition-all shadow-sm active:scale-95"
            >
              <MessageSquare className="w-5 h-5" />
              {t("support.contact.chat")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
