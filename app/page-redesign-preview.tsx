import Navbar from "@/components/Navbar";
import AIChatbot from "@/components/AIChatbot";
import StickyDesktopCTA from "@/components/StickyDesktopCTA";
import Footer from "@/components/Footer";
import RedesignShowcase from "@/components/RedesignShowcase";

export default function RedesignPreview() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      <StickyDesktopCTA />
      <main className="relative overflow-hidden pb-24">
        <Navbar />
        <RedesignShowcase />
        <Footer />
      </main>
      <AIChatbot />
    </div>
  );
}
