import Link from "next/link";

const VEHICLES = [
  {
    slug: "mini-cooper",
    name: "Mini Cooper S 2023",
    price: "$41.500",
    specs: "2.0 Turbo · 178 HP · 17.000 km aprox.",
    image: "/images/1.png",
  },
  {
    slug: "ford-f150",
    name: "Ford F-150 2013",
    price: "$18.700",
    specs: "3.7 V6 · Automática · 124.000 km aprox.",
    image: "/images/2.png",
  },
  {
    slug: "peugeot-208",
    name: "Peugeot 208 2022",
    price: "$16.800",
    specs: "1.2 Turbo · Automático · 29.000 km aprox.",
    image: "/images/3.png",
  },
];

export default function DrivePage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <div className="tracking-[0.25em] text-sm font-black">AM MOTORSPORT</div>
          <div className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold">DRIVE</div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/45">AM MOTORSPORT · VEHÍCULOS</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Encuentra tu próximo vehículo.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
          Conoce nuestras unidades disponibles, revisa sus características y solicita información directamente con AM Motorsport.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {VEHICLES.map((vehicle) => (
            <Link
              key={vehicle.slug}
              href={`/drive/${vehicle.slug}`}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] transition hover:border-white/25 hover:bg-white/[0.08]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-black">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <p className="text-2xl font-black">{vehicle.name}</p>
                <p className="mt-3 text-sm text-white/55">{vehicle.specs}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">{vehicle.price}</span>
                  <span className="text-sm font-bold text-white/70">Ver vehículo →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-white/35">
        AM Motorsport · Drive
      </footer>
    </main>
  );
}
