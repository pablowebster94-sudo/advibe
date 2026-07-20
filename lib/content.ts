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
  { name: "Nostrum Jeans", label: "Moda" },
  { name: "Cardagali", label: "Construcción" },
  { name: "Unidad Educativa Santo Domingo de Guzmán", label: "Educación" },
  { name: "Medicab", label: "Salud" },
  { name: "Borincuba Sport & Grill", label: "Gastronomía" },
];

export const services: ServiceItem[] = [
  {
    title: "Meta Ads y Adquisición de Clientes",
    description: "Sistemas de captación diseñados con estrategia, creatividad y datos para generar crecimiento medible.",
    icon: "🚀",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Producción Audiovisual",
    description: "Contenido audiovisual con dirección creativa y estándar premium para elevar la percepción de marca.",
    icon: "🎬",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Fotografía Profesional",
    description: "Sesiones fotográficas de alto nivel que comunican calidad y credibilidad en cada punto de contacto.",
    icon: "📸",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Desarrollo Web",
    description: "Plataformas en Next.js con diseño a medida, rendimiento extremo y conversión integrada desde el diseño.",
    icon: "🌐",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Landing Pages",
    description: "Páginas de alto impacto orientadas a captar leads con velocidad, claridad y diseño premium.",
    icon: "📄",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Branding e Identidad Visual",
    description: "Sistemas de marca coherentes que posicionan a la empresa como una opción premium en su categoría.",
    icon: "🎨",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Gestión Estratégica de Redes Sociales",
    description: "Manejo profesional de redes con contenido que construye autoridad y conversación real con la audiencia.",
    icon: "💬",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Inteligencia Artificial",
    description: "Integramos IA en procesos de venta y atención para tomar mejores decisiones y escalar sin fricción.",
    icon: "🤖",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Automatización",
    description: "Flujos inteligentes que eliminan tareas manuales y aceleran cada etapa del proceso comercial.",
    icon: "⚙️",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "CRM",
    description: "Infraestructura comercial para organizar prospectos, automatizar el seguimiento y aumentar la conversión de oportunidades de negocio.",
    icon: "📊",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Chatbots",
    description: "Automatizamos conversaciones mediante inteligencia artificial para responder, calificar prospectos y acelerar el proceso comercial.",
    icon: "🤝",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Cobertura de Eventos",
    description: "Registro audiovisual profesional de eventos corporativos y sociales con entrega ágil y de alta calidad.",
    icon: "🎥",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Consultoría Estratégica",
    description: "Diagnóstico y planificación para empresas que buscan crecer con decisiones basadas en estrategia, datos y tecnología.",
    icon: "🧭",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
];

export const stats: StatItem[] = [
  { value: "+50", label: "Empresas atendidas" },
  { value: "Ecuador + EE. UU.", label: "Presencia en dos mercados" },
  { value: "9+", label: "Sectores atendidos" },
  { value: "360°", label: "Sistemas de crecimiento" },
];

export const workflow: WorkflowItem[] = [
  {
    step: "01",
    title: "Diagnóstico estratégico",
    description: "Analizamos tu marca, tu mercado y tus procesos actuales para identificar el camino de crecimiento más claro.",
  },
  {
    step: "02",
    title: "Diseño del sistema",
    description: "Construimos una estrategia integral que conecta creatividad, tecnología y automatización con tus objetivos de negocio.",
  },
  {
    step: "03",
    title: "Optimización Continua",
    description: "Medimos, analizamos y optimizamos continuamente cada estrategia para convertir los resultados iniciales en un crecimiento sostenido.",
  },
];

export const portfolio: PortfolioItem[] = [
  {
    title: "AM Motorsport",
    category: "Meta Ads + Producción Audiovisual",
    highlight: "Sistema de campañas y contenido para fortalecer la marca en el sector automotriz.",
  },
  {
    title: "Nostrum Jeans",
    category: "Desarrollo Web + Meta Ads",
    highlight: "Catálogo digital y campañas de mensajería para impulsar conversaciones de venta.",
  },
  {
    title: "Unidad Educativa Santo Domingo de Guzmán",
    category: "Branding + Community Manager",
    highlight: "Presencia digital premium para reforzar la autoridad institucional.",
  },
];

export const caseStudies: CaseStudyItem[] = [
  {
    title: "Educación",
    metric: "Más contacto cualificado",
    result: "Mayor captación de leads y presencia institucional premium.",
    description: "Diseñamos una narrativa clara para instituciones educativas, con foco en confianza, conversión y posicionamiento de marca.",
  },
  {
    title: "Automotriz",
    metric: "Mejor rendimiento comercial",
    result: "Más oportunidades de contacto y seguimiento comercial estructurado.",
    description: "Integramos campañas, contenido audiovisual y automatización para generar más oportunidades de negocio.",
  },
  {
    title: "Moda y comercio",
    metric: "Crecimiento sostenido",
    result: "Más conversaciones de venta a través de canales digitales.",
    description: "Combinamos desarrollo web, campañas y automatización para acelerar el proceso de compra del cliente.",
  },
];

export const clientGroups: ClientGroupItem[] = [
  {
    sector: "Educación",
    clients: [
      "Unidad Educativa Santo Domingo de Guzmán",
      "United Kingdom English Academy",
      "CETAD San Lucas",
    ],
  },
  {
    sector: "Automotriz",
    clients: ["AM Motorsport"],
  },
  {
    sector: "Moda y comercio",
    clients: ["Nostrum Jeans"],
  },
  {
    sector: "Muebles y retail",
    clients: ["Muebles Ideal"],
  },
  {
    sector: "Deportes",
    clients: ["Pikchus FC", "Liga Deportiva Cantonal de Chordeleg"],
  },
  {
    sector: "Construcción e Inmobiliario",
    clients: ["Constructora Cardagali", "Verónica López Arquitectura"],
  },
  {
    sector: "Salud",
    clients: ["Medicab"],
  },
  {
    sector: "Gastronomía",
    clients: ["Borincuba Sport & Grill", "La Trinidad Restaurante", "Bocabell"],
  },
];

export const caseStudyGroups: CaseStudyGroupItem[] = [
  {
    sector: "Educación",
    title: "Instituciones con presencia premium",
    metric: "Más contacto cualificado",
    result: "Mayor autoridad de marca y captación de leads institucionales.",
    description: "Diseñamos identidad, contenido y estrategia digital para instituciones educativas que buscan proyectar confianza y prestigio.",
    clients: ["Unidad Educativa Santo Domingo de Guzmán", "United Kingdom English Academy"],
  },
  {
    sector: "Automotriz",
    title: "Marcas que convierten con claridad",
    metric: "Mejor rendimiento comercial",
    result: "Más oportunidades de contacto y seguimiento estructurado.",
    description: "Integramos campañas publicitarias, producción audiovisual y automatización para generar oportunidades reales de negocio.",
    clients: ["AM Motorsport"],
  },
  {
    sector: "Moda y comercio",
    title: "Marcas que venden a través de conversaciones",
    metric: "Crecimiento sostenido",
    result: "Más conversaciones de venta y catálogo digital activo.",
    description: "Unimos desarrollo web, Meta Ads y automatización de WhatsApp para acortar el camino entre el interés y la compra.",
    clients: ["Nostrum Jeans"],
  },
  {
    sector: "Deportes",
    title: "Instituciones deportivas con presencia digital",
    metric: "Mayor visibilidad",
    result: "Comunidad más activa y presencia digital consistente.",
    description: "Desarrollamos estrategias de contenido y comunicación para fortalecer la identidad de clubes y ligas deportivas.",
    clients: ["Pikchus FC", "Liga Deportiva Cantonal de Chordeleg"],
  },
  {
    sector: "Salud",
    title: "Especialistas con presencia confiable",
    metric: "Más consultas",
    result: "Mayor cercanía y credibilidad frente a nuevos pacientes.",
    description: "Reforzamos la comunicación digital de consultorios y clínicas con un enfoque profesional y humano.",
    clients: ["Medicab"],
  },
];

export const testimonials: TestimonialItem[] = [];

export const faq: FaqItem[] = [
  {
    question: "¿Qué diferencia a AdVibe de una agencia de marketing tradicional?",
    answer: "No vendemos servicios sueltos, diseñamos sistemas de crecimiento que integran estrategia, creatividad, tecnología y automatización para generar resultados sostenibles.",
  },
  {
    question: "¿Cómo se inicia un proyecto con AdVibe?",
    answer: "Con un diagnóstico estratégico de tu marca, tu mercado y tus procesos actuales, para diseñar un plan de crecimiento adaptado a tus objetivos.",
  },
  {
    question: "¿Trabajan con empresas fuera de Ecuador?",
    answer: "Sí, operamos con clientes en Ecuador y Estados Unidos, adaptando cada estrategia al mercado y la audiencia correspondiente.",
  },
  {
    question: "¿Qué resultados puedo esperar al trabajar con AdVibe?",
    answer: "Trabajamos con objetivos claros: más leads calificados, más ventas, procesos más eficientes y una marca con posicionamiento premium.",
  },
  {
    question: "¿Cómo se integra la inteligencia artificial en las estrategias?",
    answer: "Usamos IA para automatizar conversaciones de venta, calificar leads y optimizar decisiones dentro de las campañas y el proceso comercial.",
  },
  {
    question: "¿Ofrecen acompañamiento después del lanzamiento?",
    answer: "Sí, damos seguimiento continuo con optimización constante, reportes claros y una relación de socio estratégico, no de proveedor puntual.",
  },
  {
    question: "¿Incluyen automatización de WhatsApp y CRM?",
    answer: "Sí, diseñamos sistemas de chatbots y CRM que ordenan el proceso comercial y aceleran la conversión de cada conversación en venta.",
  },
  {
    question: "¿Trabajan con empresas pequeñas o grandes?",
    answer: "Trabajamos con empresas que buscan crecer. Adaptamos cada estrategia al tamaño, objetivos y etapa de cada negocio.",
  },
];