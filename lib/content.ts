import type {
  LogoItem,
  ServiceItem,
  StatItem,
  WorkflowItem,
  PortfolioItem,
  CaseStudyItem,
  ClientGroupItem,
  CaseStudyGroupItem,
  TestimonialItem,
  FaqItem,
} from "@/types/content";

export const logos: LogoItem[] = [
  { name: "AM Motorsport", label: "Automotriz" },
  { name: "United Kingdom English Academy", label: "Educación" },
  { name: "CETAD San Lucas", label: "Salud" },
  { name: "Paola Miguitama", label: "Marca personal" },
  { name: "Muebles Ideal", label: "Retail" },
  { name: "Club Santa Bárbara", label: "Deportes" },
  { name: "Kamauto", label: "Automotriz" },
  { name: "Medicab", label: "Salud" },
  { name: "Borincuba Sport & Grill", label: "Gastronomía" },
];

export const services: ServiceItem[] = [
  { title: "Anuncios en Facebook e Instagram", description: "Campañas que llevan a las personas de tu zona directo a tu WhatsApp. Te reportamos cuántas conversaciones entraron y cuánto costó cada una.", icon: "01", accent: "from-blue-500/20 via-slate-950 to-violet-950/20" },
  { title: "Contenido y video para redes", description: "Planificamos, grabamos y editamos reels, fotos y piezas para tus redes, pensados para que la gente se detenga y te escriba.", icon: "02", accent: "from-violet-500/20 via-slate-950 to-blue-950/20" },
  { title: "Páginas web y landing pages", description: "Sitios rápidos que explican lo que vendes y convierten visitas en mensajes, con medición conectada a tus anuncios.", icon: "03", accent: "from-cyan-500/15 via-slate-950 to-blue-950/20" },
];

export const otherServices: string[] = [
  "Fotografía de producto",
  "Branding e identidad visual",
  "Cobertura de eventos",
  "Chatbots y automatización de WhatsApp",
  "CRM y seguimiento de prospectos",
  "Inteligencia artificial aplicada",
  "Consultoría estratégica",
];

export const stats: StatItem[] = [
  { value: "+2.800", label: "Conversaciones por WhatsApp generadas con anuncios" },
  { value: "$0,54", label: "Costo promedio por conversación" },
  { value: "250", label: "Campañas gestionadas" },
  { value: "Ecuador + EE. UU.", label: "Mercados" },
];

export const workflow: WorkflowItem[] = [
  { step: "01", title: "Diagnóstico estratégico", description: "Analizamos tu situación actual para identificar qué acciones tienen más sentido para tu negocio." },
  { step: "02", title: "Producción y ejecución", description: "Creamos contenido, campañas y activos digitales según los objetivos definidos." },
  { step: "03", title: "Optimización continua", description: "Medimos mensajes, leads, campañas y contenido para mejorar lo que funciona y corregir lo que no." },
];

export const portfolio: PortfolioItem[] = [
  { title: "AM Motorsport", category: "Automotriz · Contenido + Publicidad", highlight: "Producción de contenido audiovisual y campañas publicitarias enfocadas en generar mensajes, leads y oportunidades de venta." },
  { title: "United Kingdom English Academy", category: "Educación · Contenido + Meta Ads", highlight: "Creación de contenido y campañas publicitarias para comunicar la oferta educativa y generar consultas de potenciales estudiantes." },
  { title: "CETAD San Lucas", category: "Salud · Branding + Contenido + Publicidad", highlight: "Diseño de identidad visual y logo, además de contenido y campañas orientadas a generar mensajes y leads durante las etapas de trabajo con la institución." },
  { title: "Paola Miguitama", category: "Marca personal · Contenido + Publicidad", highlight: "Desarrollo de contenido y apoyo publicitario para fortalecer la comunicación digital y generar oportunidades comerciales." },
];

export const caseStudies: CaseStudyItem[] = [
  { title: "Educación", metric: "Contenido + campañas", result: "Comunicación digital enfocada en generar consultas.", description: "Para United Kingdom English Academy trabajamos contenido y campañas publicitarias orientadas a comunicar su oferta educativa y atraer potenciales estudiantes." },
  { title: "Automotriz", metric: "Contenido + leads", result: "Creatividades y campañas para generar conversaciones de venta.", description: "En AM Motorsport desarrollamos contenido audiovisual y campañas publicitarias enfocadas en mensajes, leads y oportunidades comerciales." },
  { title: "Salud", metric: "Branding + campañas", result: "Identidad y comunicación digital para una institución de salud.", description: "En CETAD San Lucas realizamos el logo e identidad visual y posteriormente trabajamos contenido, mensajes y generación de leads durante distintas etapas de colaboración." },
];

export const clientGroups: ClientGroupItem[] = [
  { sector: "Educación", clients: ["United Kingdom English Academy"] },
  { sector: "Automotriz", clients: ["AM Motorsport", "Kamauto"] },
  { sector: "Retail", clients: ["Muebles Ideal"] },
  { sector: "Salud", clients: ["CETAD San Lucas", "Medicab"] },
  { sector: "Marca personal", clients: ["Paola Miguitama"] },
  { sector: "Deportes", clients: ["Club Santa Bárbara", "Pikchus FC", "Liga Deportiva Cantonal de Chordeleg"] },
  { sector: "Gastronomía", clients: ["Borincuba Sport & Grill", "La Trinidad Restaurante", "Bocabell"] },
];

export const caseStudyGroups: CaseStudyGroupItem[] = [
  { sector: "Educación", title: "Contenido que comunica y campañas que generan consultas", metric: "Contenido + Meta Ads", result: "Comunicación de la oferta educativa y generación de oportunidades.", description: "Trabajo de contenido y campañas publicitarias para United Kingdom English Academy.", clients: ["United Kingdom English Academy"] },
  { sector: "Automotriz", title: "Contenido para vender vehículos", metric: "Audiovisual + Publicidad", result: "Más herramientas para comunicar inventario y generar conversaciones.", description: "Producción de contenido y campañas publicitarias para AM Motorsport, con foco en mensajes, leads y oportunidades de venta.", clients: ["AM Motorsport"] },
  { sector: "Salud", title: "De la identidad visual a la captación", metric: "Logo + Contenido + Leads", result: "Una identidad creada y acompañada por comunicación digital.", description: "Para CETAD San Lucas realizamos el logo y parte de la identidad visual, además de contenido y campañas durante diferentes etapas de colaboración.", clients: ["CETAD San Lucas"] },
  { sector: "Marca personal", title: "Contenido para una presencia profesional", metric: "Contenido + Publicidad", result: "Comunicación digital enfocada en oportunidades.", description: "Trabajo de contenido y apoyo publicitario para Paola Miguitama.", clients: ["Paola Miguitama"] },
];

export const testimonials: TestimonialItem[] = [];

export const faq: FaqItem[] = [
  { question: "¿Qué diferencia a AdVibe de una agencia de marketing tradicional?", answer: "Combinamos producción de contenido, publicidad digital, desarrollo web y soluciones tecnológicas según lo que realmente necesita cada negocio." },
  { question: "¿Cómo se inicia un proyecto con AdVibe?", answer: "Con un diagnóstico de la situación actual y de los objetivos del negocio para definir qué acciones tienen más sentido." },
  { question: "¿Trabajan con empresas fuera de Ecuador?", answer: "Sí, trabajamos con proyectos en Ecuador y Estados Unidos, adaptando contenido y campañas a cada mercado." },
  { question: "¿Qué resultados puedo esperar al trabajar con AdVibe?", answer: "Depende del proyecto. Trabajamos para generar contenido de calidad, consultas, mensajes, leads y oportunidades comerciales, sin prometer resultados que todavía no hayan sido medidos." },
  { question: "¿Cómo se integra la inteligencia artificial?", answer: "Podemos utilizar IA para apoyar atención, análisis, contenido y automatización de procesos cuando aporta valor real al proyecto." },
  { question: "¿Ofrecen acompañamiento después del lanzamiento?", answer: "Sí. Podemos continuar con contenido, campañas, optimización y soporte según las necesidades del negocio." },
  { question: "¿Incluyen automatización de WhatsApp y CRM?", answer: "Sí, cuando el proyecto lo requiere, podemos diseñar flujos de seguimiento, CRM y automatizaciones para ordenar el proceso comercial." },
  { question: "¿Trabajan con empresas pequeñas o grandes?", answer: "Trabajamos con negocios y profesionales que necesitan mejorar su presencia digital, contenido o captación de clientes." },
];
