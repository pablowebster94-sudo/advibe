export type CaseStudy = {
  slug: string;
  number: string;
  client: string;
  sector: string;
  services: string[];
  title: string;
  summary: string;
  challenge: string;
  solution: string;
  outcome: string;
  featured?: boolean;
  accent: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "am-motorsport", number: "01", client: "AM Motorsport", sector: "Automotriz",
    services: ["Producción audiovisual", "Contenido", "Meta Ads"],
    title: "Hacer que un vehículo excepcional se sienta imposible de ignorar.",
    summary: "Dirección audiovisual y contenido comercial para el lanzamiento del Polaris Slingshot Roush Edition.",
    challenge: "Presentar un vehículo de alto impacto visual y convertir esa atención en interés comercial.",
    solution: "Concepto creativo, producción de fotografía y video, piezas verticales y adaptación del contenido para distribución digital y campañas.",
    outcome: "Un sistema de contenido preparado para redes y performance, con la creatividad trabajando como parte de la estrategia comercial.",
    featured: true, accent: "from-lime-300/25 via-emerald-400/10 to-transparent",
  },
  {
    slug: "uk-english-academy", number: "02", client: "United Kingdom English Academy", sector: "Educación",
    services: ["Diseño publicitario", "Contenido", "Meta Ads"],
    title: "Convertir una oferta educativa en conversaciones.",
    summary: "Creatividad y campañas digitales para comunicar una promoción y atraer potenciales estudiantes.",
    challenge: "Dar visibilidad a una oferta concreta y llevar a personas interesadas desde el anuncio hasta una conversación.",
    solution: "Diseño de piezas publicitarias, mensajes orientados a acción, segmentación y optimización de campañas enfocadas en conversaciones.",
    outcome: "Una campaña construida alrededor de una oferta clara, creatividad de respuesta directa y un recorrido simple hacia WhatsApp.",
    featured: true, accent: "from-cyan-300/20 via-blue-500/10 to-transparent",
  },
  {
    slug: "kamauto", number: "03", client: "Kamauto", sector: "Automotriz",
    services: ["Fotografía", "Video", "Contenido"],
    title: "Contenido automotriz con presencia de marca.",
    summary: "Producción de contenido visual para comunicar vehículos y productos con una estética comercial consistente.",
    challenge: "Destacar productos automotrices en un entorno donde la atención compite con decenas de ofertas similares.",
    solution: "Dirección visual, fotografía comercial, video corto y piezas adaptadas a los formatos de redes sociales.",
    outcome: "Un banco de contenido visual listo para alimentar comunicación orgánica y futuras campañas.",
    featured: true, accent: "from-orange-300/20 via-red-500/10 to-transparent",
  },
  {
    slug: "muebles-ideal", number: "04", client: "Muebles Ideal", sector: "Retail",
    services: ["Fotografía", "Video", "Contenido"],
    title: "Mostrar producto para hacerlo deseable.",
    summary: "Contenido comercial para presentar productos y fortalecer la comunicación digital de la marca.",
    challenge: "Transformar productos físicos en contenido capaz de comunicar calidad, estilo y valor a través de canales digitales.",
    solution: "Fotografía de producto, videos cortos y planificación de piezas para una comunicación más consistente.",
    outcome: "Una biblioteca de contenido reutilizable para redes, promociones y comunicación comercial.",
    featured: true, accent: "from-amber-200/20 via-yellow-500/10 to-transparent",
  },
  {
    slug: "g3l", number: "05", client: "G3L", sector: "Servicios",
    services: ["Producción", "Edición", "Gestión de contenido"],
    title: "Convertir producción constante en un sistema.",
    summary: "Flujo de trabajo de alto volumen para mantener una presencia digital activa y consistente.",
    challenge: "Sostener una producción frecuente sin sacrificar velocidad, consistencia ni calidad de edición.",
    solution: "Flujo estructurado de recepción, edición, adaptación, revisión y programación de contenido.",
    outcome: "Un proceso repetible para transformar material de producción en piezas publicables de forma continua.",
    accent: "from-violet-300/20 via-fuchsia-500/10 to-transparent",
  },
  {
    slug: "cetad-san-lucas", number: "06", client: "CETAD San Lucas", sector: "Salud",
    services: ["Branding", "Contenido", "Publicidad"],
    title: "Comunicar confianza en un sector sensible.",
    summary: "Identidad, contenido y comunicación digital desarrollados para una institución especializada.",
    challenge: "Construir una comunicación clara, profesional y humana para una audiencia que necesita confianza.",
    solution: "Dirección visual, piezas de comunicación y contenidos adaptados a distintas etapas de la colaboración.",
    outcome: "Una presencia digital más coherente y un sistema de comunicación preparado para informar y conectar.",
    accent: "from-sky-300/20 via-teal-500/10 to-transparent",
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((item) => item.slug === slug);
}
