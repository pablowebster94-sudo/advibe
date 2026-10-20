// Datos y textos de la landing de Latin Eagle Multiservices.
// Solo datos confirmados por el cliente. Lo que falta queda en constantes marcadas con TODO.

export type Lang = "es" | "en";
export type ServiceId = "colombia" | "ecuador" | "compras" | "giros" | "productos" | "farmacia";

export const BUSINESS = {
  name: "Latin Eagle Multiservices",
  street: "294 E Main St",
  city: "Patchogue",
  region: "NY",
  postalCode: "11772",
  country: "US",
  address: "294 E Main St, Patchogue, NY 11772",
  whatsappDisplay: "(631) 505-7092",
  whatsappNumber: "16315057092",
  phone: "+16315057092",
  secondaryPhoneDisplay: "(631) 730-5868",
  secondaryPhone: "+16317305868",
  instagram: "latineagle_multiservices",
  facebookPageId: "1305480965973274",
};

// URL pública. Si compran dominio propio, basta con definir NEXT_PUBLIC_LATIN_EAGLE_URL
// (y NEXT_PUBLIC_LATIN_EAGLE_HOSTS para que middleware.ts sirva esta ruta en la raíz de ese dominio).
export const SITE_URL = (process.env.NEXT_PUBLIC_LATIN_EAGLE_URL || "https://www.advibeagencia.com/latin-eagle").replace(/\/$/, "");

// TODO confirmar con Pablo: coordenadas exactas del local (lat, lng) para el JSON-LD.
export const GEO: { latitude: number; longitude: number } | null = null;

// TODO confirmar con Pablo: horario de atención. Mientras sea null se muestra "consúltanos por WhatsApp".
export const HOURS: { es: string; en: string } | null = null;

// Promoción Colombia: 50 lb por $95, válida hasta el 1 de noviembre de 2026 inclusive (hora de Nueva York).
export const COLOMBIA_PROMO = { pounds: 50, price: 95, endsAt: "2026-11-02T00:00:00-05:00" };
export const isColombiaPromoActive = (now = new Date()) => now < new Date(COLOMBIA_PROMO.endsAt);

// TODO confirmar con Pablo: precio y ciudad de retiro de "Compra en EE. UU., recibe en Ecuador".
// Oferta de referencia: 8 lb por $28, 13 días laborables. Mientras price sea null se muestra "Cotiza por WhatsApp".
export const COMPRAS_ECUADOR: { pounds: number; price: number | null; businessDays: number; pickupCity: string | null } = {
  pounds: 8,
  price: null,
  businessDays: 13,
  pickupCity: null,
};

export const MAPS_QUERY = encodeURIComponent(BUSINESS.address);
export const MAPS_EMBED = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`;
export const MAPS_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}`;
export const INSTAGRAM_URL = `https://www.instagram.com/${BUSINESS.instagram}/`;
export const FACEBOOK_URL = `https://www.facebook.com/${BUSINESS.facebookPageId}`;

export const waLink = (text: string) => `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(text)}`;

// Mensaje predefinido distinto por servicio, para saber qué servicio genera más conversaciones.
// Se mantiene en español en ambos idiomas: lo lee el equipo del local.
export const WA_MESSAGES: Record<ServiceId | "general", string> = {
  general: "Hola Latin Eagle, quiero información sobre sus servicios.",
  colombia: "Hola, quiero enviar un paquete a Colombia.",
  ecuador: "Hola, quiero cotizar un envío de paquete a Ecuador.",
  compras: "Hola, quiero comprar en EE. UU. y recibir en Ecuador.",
  giros: "Hola, quiero enviar dinero (giro).",
  productos: "Hola, quiero saber qué productos latinos tienen disponibles.",
  farmacia: "Hola, quiero consultar por productos de farmacia.",
};

export const GIROS_COUNTRIES = ["Ecuador", "Colombia", "Perú", "Venezuela", "México", "El Salvador", "Honduras", "Nicaragua", "Costa Rica"];

// Fotos de productos del local (public/latin-eagle/productos/, 720x720). Sin precios.
type Label = { es: string; en: string };
const same = (name: string): Label => ({ es: name, en: name });
export const PRODUCT_GROUPS: { id: string; title: Label; items: { file: string; name: Label }[] }[] = [
  { id: "bebidas", title: { es: "Bebidas", en: "Drinks" }, items: [
    { file: "pony-malta-coca-cola", name: same("Pony Malta y Coca-Cola") },
    { file: "vive100", name: same("Vive100") },
    { file: "220v-guitig", name: { es: "220V y agua Güitig", en: "220V and Güitig water" } },
    { file: "pulp", name: { es: "Néctar Pulp", en: "Pulp nectar" } },
    { file: "toni-yogurt", name: { es: "Bebida láctea Toni", en: "Toni dairy drink" } },
  ] },
  { id: "dulces", title: { es: "Galletas y dulces", en: "Cookies and sweets" }, items: [
    { file: "galletas-amor", name: { es: "Galletas Amor", en: "Amor cookies" } },
    { file: "galletas-dulces", name: same("Festival, Oreo, Monstruosas y más") },
    { file: "bon-o-bon", name: same("Bon o Bon") },
    { file: "gelatoni", name: same("GelaToni") },
  ] },
  { id: "despensa", title: { es: "Despensa", en: "Pantry" }, items: [
    { file: "panela-valdez", name: same("Panela Valdez") },
    { file: "chocolate-ambateno", name: same("Chocolate Ambateño") },
    { file: "la-vaquita", name: { es: "Leche La Vaquita", en: "La Vaquita milk" } },
    { file: "maicena-royal", name: same("Maicena Royal") },
    { file: "higos-chochos-harina", name: { es: "Higos, chochos y harina", en: "Figs, chochos and flour" } },
    { file: "sambolon", name: { es: "Bolones Sambolón", en: "Sambolón bolones" } },
  ] },
  { id: "hogar", title: { es: "Hogar y cuidado personal", en: "Home and personal care" }, items: [
    { file: "axion", name: same("Axion") },
    { file: "protex-ales-ajax", name: same("Protex, Ales y Ajax") },
  ] },
];

const promoEndLabel = { es: "1 de noviembre de 2026", en: "November 1, 2026" };

export const T = {
  es: {
    skip: "Saltar al contenido",
    navServices: "Servicios",
    navLocation: "Ubicación",
    langSwitch: "EN",
    langSwitchLabel: "View in English",
    eyebrow: "Patchogue, Nueva York",
    heroTitle: "Tu tienda latina de confianza en Patchogue",
    heroText: "Envíos a Ecuador y Colombia, giros de dinero, productos de nuestra tierra y farmacia de venta libre. Todo en un solo lugar y en español.",
    ctaWhatsapp: "Escríbenos por WhatsApp",
    ctaDirections: "Cómo llegar",
    trust: ["Atención en español", "Pagos en efectivo", "Todo en un solo lugar"],
    promoBadge: "Promoción",
    promoTitle: `Colombia por carga aérea: ${COLOMBIA_PROMO.pounds} lb por $${COLOMBIA_PROMO.price}`,
    promoUntil: `Válida hasta el ${promoEndLabel.es}.`,
    promoCta: "Aprovechar la promoción",
    servicesTitle: "¿En qué te ayudamos hoy?",
    servicesText: "Elige el servicio y escríbenos. Te respondemos por WhatsApp.",
    quote: "Cotiza por WhatsApp",
    serviceCta: "Escribir por WhatsApp",
    services: {
      colombia: {
        title: "Envíos de paquetes a Colombia",
        text: "Manda tus cajas a Colombia por carga aérea, desde nuestro local en Patchogue.",
        promo: `Promo: ${COLOMBIA_PROMO.pounds} lb por $${COLOMBIA_PROMO.price} hasta el ${promoEndLabel.es}`,
      },
      ecuador: {
        title: "Envíos de paquetes a Ecuador",
        text: "Envía tus paquetes a tu familia en Ecuador desde Patchogue. Te damos el precio por WhatsApp.",
      },
      compras: {
        title: "Compra en EE. UU., recibe en Ecuador",
        text: "Compra en Amazon, Shein, Nike, Adidas y más. Tu pedido llega a nuestro local y nosotros lo enviamos a Ecuador.",
        detail: (d: number) => `Entrega aproximada: ${d} días laborables.`,
        pickup: (city: string) => `Retiro en oficina en ${city}.`,
      },
      giros: {
        title: "Envíos de dinero",
        text: "Tu dinero llega a los que más quieres. Atención en español y pagos en efectivo.",
        countries: "Enviamos a:",
      },
      productos: {
        title: "Productos ecuatorianos y latinos",
        text: "Productos de nuestra tierra, más cerca de ti: panela, galletas Amor, Tapioca, gelatina Royal, Pony Malta, Vive100, néctares y más.",
      },
      farmacia: {
        title: "Farmacia de venta libre",
        text: "Productos latinos de venta libre para el cuidado de toda la familia: gripe, estómago y más. Pregúntanos qué tenemos disponible.",
      },
    },
    productsTitle: "Productos de nuestra tierra, más cerca de ti",
    productsText: "Tus marcas favoritas de Ecuador y Latinoamérica, y productos para el hogar, en un solo lugar en Patchogue. Estos son algunos:",
    productsMore: "¿Buscas algo que no ves aquí? Pregúntanos.",
    productsCta: "Preguntar por un producto",
    promoAlt: `Promoción de envíos a Colombia por carga aérea: ${COLOMBIA_PROMO.pounds} libras por $${COLOMBIA_PROMO.price}, hasta el ${promoEndLabel.es}`,
    locationTitle: "Visítanos en Patchogue",
    addressLabel: "Dirección",
    hoursLabel: "Horario",
    hoursPending: "Consúltanos por WhatsApp",
    phoneLabel: "Teléfonos",
    whatsappLabel: "WhatsApp",
    otherPhone: "Otro teléfono",
    openMaps: "Abrir en Google Maps",
    call: "Llamar",
    mapTitle: "Mapa de Latin Eagle Multiservices en 294 E Main St, Patchogue, NY",
    followUs: "Síguenos",
    footerTagline: "Envíos, giros y productos latinos en Patchogue, NY.",
    credit: "Sitio por AdVibe Agencia",
    floating: "WhatsApp",
    floatingLabel: "Escríbenos por WhatsApp",
    logoAlt: "Logo de Latin Eagle Multiservices",
  },
  en: {
    skip: "Skip to content",
    navServices: "Services",
    navLocation: "Location",
    langSwitch: "ES",
    langSwitchLabel: "Ver en español",
    eyebrow: "Patchogue, New York",
    heroTitle: "Your trusted Latin store in Patchogue",
    heroText: "Package shipping to Ecuador and Colombia, money transfers, products from home and an over-the-counter pharmacy. All in one place, and we speak Spanish.",
    ctaWhatsapp: "Message us on WhatsApp",
    ctaDirections: "Get directions",
    trust: ["We speak Spanish", "Cash payments", "All in one place"],
    promoBadge: "Special offer",
    promoTitle: `Colombia by air cargo: ${COLOMBIA_PROMO.pounds} lb for $${COLOMBIA_PROMO.price}`,
    promoUntil: `Valid through ${promoEndLabel.en}.`,
    promoCta: "Get the offer",
    servicesTitle: "How can we help you today?",
    servicesText: "Pick a service and message us. We reply on WhatsApp.",
    quote: "Get a quote on WhatsApp",
    serviceCta: "Message on WhatsApp",
    services: {
      colombia: {
        title: "Package shipping to Colombia",
        text: "Send your boxes to Colombia by air cargo, right from our store in Patchogue.",
        promo: `Offer: ${COLOMBIA_PROMO.pounds} lb for $${COLOMBIA_PROMO.price} through ${promoEndLabel.en}`,
      },
      ecuador: {
        title: "Package shipping to Ecuador",
        text: "Send your packages to your family in Ecuador from Patchogue. We'll give you the price on WhatsApp.",
      },
      compras: {
        title: "Shop in the US, receive in Ecuador",
        text: "Shop on Amazon, Shein, Nike, Adidas and more. Your order arrives at our store and we ship it to Ecuador.",
        detail: (d: number) => `Approximate delivery: ${d} business days.`,
        pickup: (city: string) => `Pick up at our office in ${city}.`,
      },
      giros: {
        title: "Money transfers",
        text: "Your money reaches the people you love. Service in Spanish and cash payments.",
        countries: "We send to:",
      },
      productos: {
        title: "Ecuadorian and Latin products",
        text: "Products from home, closer to you: panela, Amor cookies, Tapioca, Royal gelatin, Pony Malta, Vive100, nectars and more.",
      },
      farmacia: {
        title: "Over-the-counter pharmacy",
        text: "Latin over-the-counter products for the whole family: colds, stomach care and more. Ask us what's in stock.",
      },
    },
    productsTitle: "Products from home, closer to you",
    productsText: "Your favorite brands from Ecuador and Latin America, plus home essentials, all in one place in Patchogue. Here are a few:",
    productsMore: "Looking for something you don't see here? Just ask.",
    productsCta: "Ask about a product",
    promoAlt: `Air cargo shipping offer to Colombia: ${COLOMBIA_PROMO.pounds} pounds for $${COLOMBIA_PROMO.price}, through ${promoEndLabel.en}`,
    locationTitle: "Visit us in Patchogue",
    addressLabel: "Address",
    hoursLabel: "Hours",
    hoursPending: "Ask us on WhatsApp",
    phoneLabel: "Phones",
    whatsappLabel: "WhatsApp",
    otherPhone: "Other phone",
    openMaps: "Open in Google Maps",
    call: "Call",
    mapTitle: "Map of Latin Eagle Multiservices at 294 E Main St, Patchogue, NY",
    followUs: "Follow us",
    footerTagline: "Shipping, money transfers and Latin products in Patchogue, NY.",
    credit: "Site by AdVibe Agencia",
    floating: "WhatsApp",
    floatingLabel: "Message us on WhatsApp",
    logoAlt: "Latin Eagle Multiservices logo",
  },
};

export type Copy = (typeof T)["es"];
