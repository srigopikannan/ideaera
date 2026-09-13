import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <section className="py-24 bg-primary text-primary-foreground text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start building?</h2>
            <p className="text-lg opacity-90 mb-10 max-w-2xl mx-auto">
              Join thousands of innovators, developers, and designers who are turning their ideas into reality.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-slate-100 transition-colors">
                Find Teammates Now
              </button>
              <button className="bg-transparent border border-white/30 px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors">
                Explore Projects
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
