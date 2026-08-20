import { COMMERCE } from "@/lib/licor/config";

/**
 * Honesty banner. Visible while COMMERCE.demoPricing is true so nobody
 * mistakes the placeholder catalog pricing for the store's real prices.
 * Set `demoPricing: false` in lib/licor/config.ts once real pricing is loaded.
 */
export default function DemoDataNotice({ className = "" }: { className?: string }) {
  if (!COMMERCE.demoPricing) return null;

  return (
    <p
      className={`rounded-xl border border-dashed border-[#D4AF37]/35 bg-[#D4AF37]/[0.06] px-4 py-3 text-[11px] leading-relaxed text-[#E7C766] ${className}`.trim()}
    >
      <strong className="font-black uppercase tracking-[0.16em]">Demo catalog</strong>{" "}
      — products, prices and stock levels on this site are placeholder sample data
      for setup purposes. They are not confirmed {" "}
      <span className="whitespace-nowrap">Licor Store 24</span> prices. Confirm any
      order by phone.
    </p>
  );
}
