// Contenido de advibeagencia.com/us (mercado de EE. UU.). Precios en USD.
// Las demos son proyectos de muestra: nunca se presentan como clientes reales.

export type Lang = "en" | "es";

export const US_WHATSAPP = "593984966335";

export function usWhatsAppLink(lang: Lang, extra = "") {
  const base = lang === "en"
    ? "Hi AdVibe, I'd like a free website review for my business."
    : "Hola AdVibe, quiero una revisión gratis de la web de mi negocio.";
  return `https://wa.me/${US_WHATSAPP}?text=${encodeURIComponent(extra ? `${base}\n${extra}` : base)}`;
}

type T = Record<Lang, string>;

export const usCopy = {
  nav: {
    services: { en: "Services", es: "Servicios" },
    packages: { en: "Packages", es: "Paquetes" },
    demos: { en: "Demos", es: "Demos" },
    contact: { en: "Free review", es: "Revisión gratis" },
  },
  hero: {
    kicker: { en: "Websites & lead generation · Long Island, NY", es: "Webs y captación de clientes · Long Island, NY" },
    title: { en: "Your website should bring you customers,", es: "Tu web debería traerte clientes," },
    titleAccent: { en: "not just sit there.", es: "no solo estar ahí." },
    lead: {
      en: "We redesign websites for car dealers, law firms and local businesses so more visitors call, fill out a form or message you on WhatsApp. Then we run the Meta and Google ads that send them there.",
      es: "Rediseñamos webs para concesionarios, abogados y negocios locales para que más visitantes te llamen, llenen un formulario o te escriban por WhatsApp. Y manejamos los anuncios de Meta y Google que los llevan ahí.",
    },
    cta: { en: "Get a free website review", es: "Pide una revisión gratis" },
    cta2: { en: "See the demos", es: "Ver las demos" },
    note: { en: "Bilingual: English & Spanish. Local representative on Long Island.", es: "Bilingüe: inglés y español. Representante local en Long Island." },
  },
  problem: {
    kicker: { en: "The problem", es: "El problema" },
    title: { en: "Most local businesses already have a website. Few of them sell.", es: "Casi todos los negocios ya tienen web. Pocos venden con ella." },
    items: [
      { en: "Slow or broken on mobile, where most visitors are.", es: "Lenta o rota en el celular, que es donde está la mayoría." },
      { en: "No clear button to call, text or request a quote.", es: "Sin un botón claro para llamar, escribir o pedir cotización." },
      { en: "Inventory, services or prices that are outdated.", es: "Inventario, servicios o precios desactualizados." },
      { en: "Only in English, while many customers prefer Spanish.", es: "Solo en inglés, aunque muchos clientes prefieren español." },
    ] as T[],
  },
  services: {
    kicker: { en: "What we do", es: "Qué hacemos" },
    title: { en: "Three things, done well.", es: "Tres cosas bien hechas." },
    items: [
      { title: { en: "Website redesign", es: "Rediseño de web" }, text: { en: "Fast, mobile-first websites in English and Spanish, built around one goal: getting the visitor to contact you.", es: "Webs rápidas, pensadas para el celular, en inglés y español, con un solo objetivo: que el visitante te contacte." } },
      { title: { en: "Lead capture", es: "Captación de clientes" }, text: { en: "Click-to-call, WhatsApp, quote and financing forms, and a simple report of every lead you get each month.", es: "Botón de llamada, WhatsApp, formularios de cotización y financiamiento, y un reporte simple de cada contacto del mes." } },
      { title: { en: "Meta & Google Ads", es: "Meta y Google Ads" }, text: { en: "Local campaigns that send the right people to your site, with ad spend paid directly by you to the platforms.", es: "Campañas locales que llevan a las personas correctas a tu web. El presupuesto lo pagas tú directo a las plataformas." } },
    ] as { title: T; text: T }[],
  },
  packages: {
    kicker: { en: "Packages", es: "Paquetes" },
    title: { en: "Clear prices. No surprises.", es: "Precios claros. Sin sorpresas." },
    note: {
      en: "One-time project price. Domain, hosting and ad spend are not included unless stated. Monthly care plan: from $99/month (hosting, updates, small changes and a monthly lead report).",
      es: "Precio único del proyecto. Dominio, hosting y presupuesto de anuncios no incluidos salvo que se indique. Plan de mantenimiento mensual: desde $99/mes (hosting, actualizaciones, cambios pequeños y reporte mensual de contactos).",
    },
    items: [
      {
        name: { en: "Starter", es: "Starter" }, price: "$799", tag: null as T | null,
        sub: { en: "A clean, professional site", es: "Una web limpia y profesional" },
        features: [
          { en: "Up to 5 pages", es: "Hasta 5 páginas" },
          { en: "Mobile-first design", es: "Diseño pensado para el celular" },
          { en: "Call, WhatsApp and contact form", es: "Llamada, WhatsApp y formulario" },
          { en: "Google Business Profile check", es: "Revisión de Google Business Profile" },
          { en: "2 rounds of revisions", es: "2 rondas de cambios" },
        ] as T[],
      },
      {
        name: { en: "Professional", es: "Professional" }, price: "$1,499", tag: { en: "Most popular", es: "El más elegido" } as T | null,
        sub: { en: "Built to generate leads", es: "Hecha para captar clientes" },
        features: [
          { en: "Up to 10 pages, English + Spanish", es: "Hasta 10 páginas, inglés + español" },
          { en: "Quote / financing / consultation forms", es: "Formularios de cotización, financiamiento o consulta" },
          { en: "Inventory, services or case pages", es: "Páginas de inventario, servicios o casos" },
          { en: "Meta Pixel & Google Analytics set up", es: "Meta Pixel y Google Analytics configurados" },
          { en: "Basic local SEO", es: "SEO local básico" },
          { en: "3 rounds of revisions", es: "3 rondas de cambios" },
        ] as T[],
      },
      {
        name: { en: "Premium", es: "Premium" }, price: "$2,499", tag: null as T | null,
        sub: { en: "Website + first ad campaign", es: "Web + primera campaña de anuncios" },
        features: [
          { en: "Everything in Professional", es: "Todo lo de Professional" },
          { en: "Custom design and copywriting", es: "Diseño y textos a medida" },
          { en: "Landing page for ads", es: "Página especial para anuncios" },
          { en: "First month of Meta or Google Ads management", es: "Primer mes de gestión de Meta o Google Ads" },
          { en: "Lead tracking dashboard", es: "Panel de seguimiento de contactos" },
        ] as T[],
      },
    ],
  },
  how: {
    kicker: { en: "How it works", es: "Cómo trabajamos" },
    title: { en: "Local contact. Remote team. Fast delivery.", es: "Contacto local. Equipo remoto. Entrega rápida." },
    steps: [
      { title: { en: "Free review", es: "Revisión gratis" }, text: { en: "We look at your current site and ads and tell you what is costing you customers.", es: "Revisamos tu web y tus anuncios actuales y te decimos qué te está haciendo perder clientes." } },
      { title: { en: "Proposal", es: "Propuesta" }, text: { en: "A fixed price and a clear list of what is included. No long contracts.", es: "Un precio fijo y una lista clara de lo que incluye. Sin contratos largos." } },
      { title: { en: "Build", es: "Construcción" }, text: { en: "You review a live preview link and approve before anything goes public.", es: "Revisas un link de prueba y apruebas antes de que se publique nada." } },
      { title: { en: "Grow", es: "Crecer" }, text: { en: "We launch, connect your ads and send you a simple monthly report.", es: "Publicamos, conectamos tus anuncios y te enviamos un reporte mensual simple." } },
    ] as { title: T; text: T }[],
    rep: {
      en: "Our representative on Long Island can visit your business in person. Design, development and ads are handled by our team in Ecuador, in practically the same time zone as New York.",
      es: "Nuestro representante en Long Island puede visitar tu negocio en persona. El diseño, la programación y los anuncios los hace nuestro equipo en Ecuador, prácticamente en el mismo horario que Nueva York.",
    },
  },
  demos: {
    kicker: { en: "Demo projects", es: "Proyectos de muestra" },
    title: { en: "See what your site could look like.", es: "Mira cómo podría verse tu web." },
    disclaimer: { en: "These are sample projects built by AdVibe to show our work. The businesses are fictional.", es: "Son proyectos de muestra hechos por AdVibe para mostrar nuestro trabajo. Los negocios son ficticios." },
    items: [
      { href: "/us/demo/dealer", title: { en: "Car dealer website", es: "Web para concesionario" }, text: { en: "Inventory, financing application, trade-in form and click-to-call.", es: "Inventario, solicitud de financiamiento, formulario de parte de pago y botón de llamada." } },
      { href: "/us/demo/law-firm", title: { en: "Law firm website", es: "Web para abogado" }, text: { en: "Practice areas, bilingual consultation form and trust signals.", es: "Áreas de práctica, formulario de consulta bilingüe y señales de confianza." } },
    ] as { href: string; title: T; text: T }[],
    open: { en: "Open demo", es: "Abrir demo" },
  },
  faq: {
    kicker: { en: "FAQ", es: "Preguntas frecuentes" },
    items: [
      { q: { en: "I already have a website. Do I need a new one?", es: "Ya tengo web. ¿Necesito una nueva?" }, a: { en: "Not always. Often a redesign of the key pages and a clear contact path is enough. The free review tells you which.", es: "No siempre. Muchas veces basta con rediseñar las páginas clave y dejar claro cómo contactarte. La revisión gratis te dice qué conviene." } },
      { q: { en: "Who owns the website?", es: "¿De quién es la web?" }, a: { en: "You do. Domain, accounts and content stay in your name.", es: "Tuya. El dominio, las cuentas y el contenido quedan a tu nombre." } },
      { q: { en: "How do I pay?", es: "¿Cómo pago?" }, a: { en: "50% to start and 50% at launch, by card or bank transfer. Monthly plans are billed in advance.", es: "50 % al empezar y 50 % al publicar, con tarjeta o transferencia. Los planes mensuales se pagan por adelantado." } },
      { q: { en: "Do you guarantee sales?", es: "¿Garantizan ventas?" }, a: { en: "No one honest can. We guarantee the work in your package and we report every lead so you can measure results.", es: "Nadie honesto puede. Garantizamos el trabajo de tu paquete y reportamos cada contacto para que midas los resultados." } },
    ] as { q: T; a: T }[],
  },
  contact: {
    kicker: { en: "Free website review", es: "Revisión gratis de tu web" },
    title: { en: "Tell us about your business.", es: "Cuéntanos de tu negocio." },
    text: { en: "We'll reply on WhatsApp with what we would change first. No meeting required.", es: "Te respondemos por WhatsApp con lo primero que cambiaríamos. Sin reuniones." },
    name: { en: "Your name", es: "Tu nombre" },
    business: { en: "Business name", es: "Nombre del negocio" },
    website: { en: "Current website (optional)", es: "Web actual (opcional)" },
    type: { en: "Type of business", es: "Tipo de negocio" },
    types: [
      { en: "Car dealer", es: "Concesionario" },
      { en: "Law firm", es: "Abogado" },
      { en: "Home services", es: "Servicios del hogar" },
      { en: "Health / beauty", es: "Salud / estética" },
      { en: "Other", es: "Otro" },
    ] as T[],
    send: { en: "Send on WhatsApp", es: "Enviar por WhatsApp" },
  },
  footer: {
    line: { en: "AdVibe Agency · Websites, Meta Ads & Google Ads for local businesses", es: "AdVibe Agencia · Webs, Meta Ads y Google Ads para negocios locales" },
    back: { en: "AdVibe Ecuador", es: "AdVibe Ecuador" },
  },
};
