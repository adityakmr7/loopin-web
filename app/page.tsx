import { SiteHeader } from "@/components/layout/site-header";
import { Hero } from "@/components/landing/hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 selection:bg-indigo-500/30">
      <SiteHeader />
      <main>
        <Hero />
        {/* Features section can be added here later */}
      </main>
      
      <footer className="py-12 border-t border-slate-900 bg-slate-950 text-center text-slate-500">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Loopin. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
