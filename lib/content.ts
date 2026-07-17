import type {
  LogoItem,
  ServiceItem,
  StatItem,
  WorkflowItem,
  PortfolioItem,
  CaseStudyItem,
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
  { value: "+320%", label: "Aumento medio en conversión" },
  { value: "18x", label: "Retorno de inversión promedio" },
  { value: "24h", label: "Implementación de campañas en tiempo real" },
  { value: "95%", label: "Procesos automatizados con IA" },
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
    title: "Escuela de innovación digital",
    metric: "+210%",
    result: "Tráfico orgánico y pago en una estrategia integrada.",
    description: "Creamos un funnel completo que multiplicó la captación de leads premium.",
  },
  {
    title: "Marca global de servicios",
    metric: "+38%",
    result: "Aumento de ventas directas a través de WhatsApp y landing pages.",
    description: "Implementamos chatbots y embudos personalizados para equipos comerciales.",
  },
  {
    title: "Producto de consumo digital",
    metric: "+460%",
    result: "Interacción de usuarios y tiempo de sesión mejorados.",
    description: "Rediseñamos la experiencia con un storytelling moderno y una identidad potente.",
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
