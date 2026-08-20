import Link from "next/link";
import { activeCategories, countByCategory } from "@/lib/licor/catalog";
import { route } from "@/lib/licor/config";
import { Section, SectionHeading } from "./ui";

/** Horizontal, swipeable category picker — the primary catalog entry point. */
export default function CategoryRail({ id = "categories" }: { id?: string }) {
  const categories = activeCategories();
  const counts = countByCategory();

  return (
    <Section id={id} className="py-12 sm:py-16">
      <SectionHeading
        eyebrow="Shop by category"
        title="Categories"
        copy="Whiskey, tequila, vodka, cognac, beer and everything else — all in one place."
        action={
          <Link
            href={route("/shop")}
            className="inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:text-white"
          >
            View all →
          </Link>
        }
      />

      <div className="-mx-4 mt-7 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3 sm:grid sm:min-w-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.map((category) => (
            <li key={category.id} className="w-36 shrink-0 sm:w-auto">
              <Link
                href={`${route("/shop")}?category=${category.id}`}
                className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition duration-300 hover:border-[#D4AF37]/45 hover:bg-white/[0.06]"
              >
                <span
                  aria-hidden
                  className="mb-4 block h-11 w-11 rounded-lg transition duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(150deg, ${category.palette.liquid}, ${category.palette.base})`,
                  }}
                />
                <span>
                  <span className="block text-sm font-black uppercase tracking-[0.08em] text-white">
                    {category.name}
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-white/45">
                    {category.blurb}
                  </span>
                  <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                    {counts[category.id] ?? 0} products
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
