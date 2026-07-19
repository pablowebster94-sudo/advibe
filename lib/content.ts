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
  { name: "Nexa", label: "Fintech" },
  { name: "Atlas", label: "Retail" },
  { name: "Eon", label: "Health" },
  { name: "Pulse", label: "B2B" },
  { name: "Orbit", label: "Travel" },
  { name: "Lumen", label: "Tecnología" },
];

export const services: ServiceItem[] = [
  {
    title: "Meta Ads",
    description: "Campañas escalables con creatividad, segmentación y análisis continuo para elevar el ROI.",
    icon: "🚀",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Google Ads",
    description: "Estrategias centradas en resultados, conversiones y calidad de tráfico para cada etapa del embudo.",
    icon: "📈",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Inteligencia Artificial",
    description: "Automatizamos decisiones, optimizamos audiencias y creamos experiencias predictivas.",
    icon: "🤖",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Automatización de procesos",
    description: "Flujos inteligentes que reducen tareas manuales y aceleran la entrega de valor.",
    icon: "⚙️",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Desarrollo Web",
    description: "Plataformas en Next.js con diseño personalizado, rendimiento extremo y conversión integrada.",
    icon: "🌐",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Branding y Diseño gráfico",
    description: "Identidades visuales modernas,óptimas para digital y experiencias coherentes de marca.",
    icon: "🎨",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Landing Pages",
    description: "Páginas de alto impacto enfocadas en leads, velocidad y diseño premium.",
    icon: "📄",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
  {
    title: "Community Management",
    description: "Estrategias sociales con contenido poderoso y conversaciones que generan confianza.",
    icon: "💬",
    accent: "from-cyan-500/20 via-slate-900 to-slate-950",
  },
];

export const stats: StatItem[] = [
  { value: "+50", label: "Marcas atendidas" },
  { value: "Ecuador + USA", label: "Campañas activas en dos mercados" },
  { value: "$0.17", label: "Conversaciones desde" },
  { value: "+70", label: "Conversaciones generadas en campañas" },
];

export const workflow: WorkflowItem[] = [
  {
    step: "01",
    title: "Diagnóstico de marca",
    description: "Analizamos tu posicionamiento, activos actuales y oportunidad digital.",
  },
  {
    step: "02",
    title: "Estrategia personalizada",
    description: "Diseñamos un plan creativo, técnico y de automatización para generar confianza.",
  },
  {
    step: "03",
    title: "Entrega y optimización",
    description: "Implementamos, iteramos y escalamos con métricas claras y comunicación constante.",
  },
];

export const portfolio: PortfolioItem[] = [
  {
    title: "Ecommerce premium para tecnología",
    category: "UX + Performance",
    highlight: "Lanzamiento con 40% más conversiones en 45 días.",
  },
  {
    title: "Automatización B2B para ventas",
    category: "IA & CRM",
    highlight: "Reducción de gestión manual en un 75%.",
  },
  {
    title: "Campaña de marca para producto SaaS",
    category: "Paid Media",
    highlight: "Crecimiento de leads calificados con costo por adquisición optimizado.",
  },
];

export const caseStudies: CaseStudyItem[] = [
  {
    title: "Educación",
    metric: "+38%",
    result: "Captación de leads y mayor presencia institucional.",
    description: "Diseñamos una narrativa premium para academias y escuelas con foco en confianza, conversión y claridad de mensaje.",
  },
  {
    title: "Automotriz",
    metric: "+24%",
    result: "Mejor rendimiento de campañas y más oportunidades de contacto.",
    description: "Creamos experiencias de comunicación orientadas a acción, posicionamiento y seguimiento comercial.",
  },
  {
    title: "Construcción e inmobiliario",
    metric: "+31%",
    result: "Más consultas y mayor autoridad de marca para negocios locales y regionales.",
    description: "Unimos branding, web y campañas para fortalecer credibilidad y acelerar oportunidades de negocio.",
  },
];

export const clientGroups: ClientGroupItem[] = [
  {
    sector: "Educación",
    clients: [
      "High School Centro de Idiomas",
      "Unidad Educativa Santo Domingo de Guzmán",
      "Centro Infantil Chiquititos",
      "United Kingdom English Academy",
      "Centro de Capacitaciones América (antes Centro de Especialidades América)",
    ],
  },
  {
    sector: "Automotriz",
    clients: ["AM Motorsport"],
  },
  {
    sector: "Construcción e inmobiliario",
    clients: [
      "Constructora Cardagali",
      "Gonzaga Professional Builders (USA)",
      "G3L Handyman Solutions (USA)",
      "Gabriel Garrido Handyman (USA)",
      "A.V. Renew Pressure & Greenscape Designs (USA)",
      "Verónica López Arquitectura",
    ],
  },
  {
    sector: "Gastronomía",
    clients: [
      "Bears Burger",
      "Borincuba Sport & Grill",
      "La Trinidad Restaurante",
      "Santiago Cruz Restaurante",
      "Bocabell",
      "La Hueca de la Larga",
      "GastroFest Guala",
      "Balneario Los Marios",
      "Golosinas Don Pepe",
    ],
  },
  {
    sector: "Salud",
    clients: ["Medicab Consultorio Médico", "CETAD San Lucas", "Carla Molina Odontología", "MediDent"],
  },
  {
    sector: "Deportes",
    clients: ["Liga Deportiva Cantonal de Chordeleg", "Club Formativo Santa Bárbara"],
  },
  {
    sector: "Centros comerciales",
    clients: ["Nova Plaza Centro Comercial", "Multiplaza Serrano"],
  },
  {
    sector: "Moda y comercio",
    clients: ["Nostrum Jeans", "ShopFast"],
  },
  {
    sector: "Marca personal",
    clients: ["Paola Miguitama", "Byron Galarza Psicoterapia Integral"],
  },
];

export const caseStudyGroups: CaseStudyGroupItem[] = [
  {
    sector: "Educación",
    title: "Escuelas y academias con presencia premium",
    metric: "+38%",
    result: "Más contacto cualificado y mejor autoridad de marca.",
    description: "Diseñamos mensajes, identidad y experiencias digitales que elevan la percepción premium de cada institución.",
    clients: ["High School Centro de Idiomas", "United Kingdom English Academy"],
  },
  {
    sector: "Automotriz",
    title: "Marcas que convierten con claridad",
    metric: "+24%",
    result: "Mejor rendimiento de campañas y seguimiento comercial.",
    description: "Integramos creatividad publicitaria, páginas de alto impacto y automatización para generar más oportunidades.",
    clients: ["AM Motorsport"],
  },
  {
    sector: "Construcción e inmobiliario",
    title: "Negocios que transmiten confianza",
    metric: "+31%",
    result: "Más consultas y mayor autoridad de marca en mercados competitivos.",
    description: "Creamos una presencia digital sólida y elegante para negocios que necesitan demostrar experiencia real.",
    clients: ["Constructora Cardagali", "Verónica López Arquitectura"],
  },
  {
    sector: "Gastronomía",
    title: "Experiencias que se recuerdan",
    metric: "+27%",
    result: "Más demanda, mejor interacción y mayor recordación de marca.",
    description: "Combinamos branding visual, campañas y páginas diseñadas para impulsar reservas, pedidos y fidelización.",
    clients: ["Bears Burger", "La Trinidad Restaurante"],
  },
  {
    sector: "Salud",
    title: "Especialistas con presencia humana y premium",
    metric: "+19%",
    result: "Más consultas y un tono más cercano y profesional.",
    description: "Unimos estrategia de contenidos y diseño para reforzar confianza, credibilidad y conversión local.",
    clients: ["Medicab Consultorio Médico", "MediDent"],
  },
];

export const testimonials: TestimonialItem[] = [
  {
    quote: "AdVibe transformó nuestra comunicación digital con ideas estratégicas y ejecución impecable.",
    name: "Sofía Ramírez",
    role: "CEO",
    company: "Lumina Labs",
  },
  {
    quote: "Su enfoque en IA y automatización nos dio claridad y velocidad para escalar rápido.",
    name: "Martín Delgado",
    role: "Director de Marketing",
    company: "Nebula Retail",
  },
  {
    quote: "Cada proyecto se sintió premium: diseño, resultados y coordinación de primer nivel.",
    name: "Camila Torres",
    role: "Fundadora",
    company: "Pulse Studio",
  },
];

export const faq: FaqItem[] = [
  {
    question: "¿Cómo empieza un proyecto con AdVibe?",
    answer: "Iniciamos con una reunión de diagnóstico para entender tus objetivos, audiencias y desafíos.",
  },
  {
    question: "¿Qué resultados puedo esperar?",
    answer: "Trabajamos con metas medibles: conversiones, leads calificados, eficiencia operativa y presencia premium.",
  },
  {
    question: "¿Ofrecen soporte después del lanzamiento?",
    answer: "Sí, mantenemos optimizaciones continuas y acompañamiento estratégico con informes claros.",
  },
  {
    question: "¿Integran WhatsApp y chatbots?",
    answer: "Claro: diseñamos flujos conversacionales y automatizaciones para generar contacto directo y ventas.",
  },
];
