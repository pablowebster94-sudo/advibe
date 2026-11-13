// Datos confirmados de ALVITEC. No agregar aquí nada que el cliente no haya entregado.

const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = envUrl || (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

export const WHATSAPP_NUMBER = "593991962374";

export const site = {
  name: "ALVITEC",
  legalName: "ALVITEC — Técnica en Aluminio y Vidrio",
  tagline: "Técnica en Aluminio y Vidrio",
  slogan: "Técnica, arte y belleza con aluminio, vidrio y mucho más",
  description:
    "ALVITEC: fachadas de vidrio, alucobond, policarbonato, puertas y ventanas de aluminio, vidrio templado y laminado, divisiones, vitrinas y modulares en Guayaquil. Solicita tu cotización por WhatsApp.",
  address: {
    street: "Yaguachi #414 y Huancavilca",
    city: "Guayaquil",
    region: "Guayas",
    country: "Ecuador",
    countryCode: "EC",
  },
  whatsappDisplay: "+593 99 196 2374",
  instagram: { handle: "@alvitec1986", url: "https://www.instagram.com/alvitec1986/" },
  // El cliente entregó el nombre de la página, no su URL: se enlaza a la búsqueda por nombre.
  facebook: {
    name: "ALVITEC Técnica en aluminio y vidrio",
    url: "https://www.facebook.com/search/pages/?q=" + encodeURIComponent("ALVITEC Técnica en aluminio y vidrio"),
  },
  hours: [
    { label: "Lunes a viernes", value: "09:00–18:00", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
    { label: "Sábados", value: "10:30–14:30", days: ["Saturday"], opens: "10:30", closes: "14:30" },
  ],
  coverage: ["Guayaquil", "Samborondón", "Milagro", "Santa Elena", "La Libertad"],
  aluminumLines: ["Línea 20", "Línea 25", "Línea 4000"],
} as const;

export const MAPS_QUERY = `${site.address.street}, ${site.address.city}, ${site.address.country}`;
export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&z=17&hl=es&output=embed`;
export const MAPS_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;

export const nav = [
  { href: "#servicios", label: "Servicios" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#materiales", label: "Materiales" },
  { href: "#galeria", label: "Galería" },
  { href: "#proceso", label: "Proceso" },
  { href: "#contacto", label: "Contacto" },
] as const;

export const serviceNames = [
  "Fachadas de vidrio",
  "Alucobond",
  "Policarbonato",
  "Puertas y ventanas de aluminio",
  "Vidrio templado y laminado",
  "Divisiones",
  "Vitrinas",
  "Modulares",
] as const;

export const processSteps = [
  { title: "Medimos", text: "Revisamos las dimensiones y características del espacio." },
  { title: "Cotizamos", text: "Definimos materiales, cantidades y alcance del trabajo." },
  { title: "Fabricamos", text: "Preparamos los elementos de acuerdo con lo acordado." },
  { title: "Instalamos", text: "Coordinamos la instalación del proyecto." },
] as const;

export const faqs = [
  {
    q: "¿Cómo solicito una cotización?",
    a: "Escríbenos por WhatsApp o usa el configurador de esta página. Indica el tipo de trabajo, las medidas aproximadas y la ubicación; si hace falta más información, te la pediremos en la misma conversación.",
  },
  {
    q: "¿Qué servicios ofrece ALVITEC?",
    a: "Fachadas de vidrio, alucobond, policarbonato, puertas y ventanas de aluminio, vidrio templado y laminado, divisiones, vitrinas y modulares.",
  },
  {
    q: "¿Qué líneas de aluminio trabajan?",
    a: "Trabajamos con Línea 20, Línea 25 y Línea 4000. Si no sabes cuál corresponde a tu proyecto, selecciona «Por definir» en el configurador y lo revisamos contigo.",
  },
  {
    q: "¿Qué tipos de vidrio puedo consultar?",
    a: "Vidrio templado y vidrio laminado. La elección depende de la aplicación y de las características de cada proyecto.",
  },
  {
    q: "¿En qué zonas atienden?",
    a: "Guayaquil, Samborondón, Milagro, Santa Elena y La Libertad. Si tu proyecto está en otra localidad, consúltanos por WhatsApp.",
  },
  {
    q: "¿Cuál es el horario de atención?",
    a: "Lunes a viernes de 09:00 a 18:00 y sábados de 10:30 a 14:30, en Yaguachi #414 y Huancavilca, Guayaquil.",
  },
] as const;
