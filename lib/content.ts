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
  { name: "Cardagali", label: "Construcción" },
  { name: "Medicab", label: "Salud" },
  { name: "Borincuba Sport & Grill", label: "Gastronomía" },
  { name: "Constructora Cardagali", label: "Inmobiliario" },
];

export const services: ServiceItem[] = [
  { title: "Meta Ads y Adquisición de Clientes", description: "Sistemas de captación diseñados con estrategia, creatividad y datos para generar crecimiento medible.", icon: "01", accent: "from-blue-500/20 via-slate-950 to-violet-950/20" },
  { title: "Producción Audiovisual", description: "Contenido audiovisual con dirección creativa y estándar premium para elevar la percepción de marca.", icon: "02", accent: "from-violet-500/20 via-slate-950 to-blue-950/20" },
  { title: "Fotografía Profesional", description: "Sesiones fotográficas de alto nivel que comunican calidad y credibilidad en cada punto de contacto.", icon: "03", accent: "from-cyan-500/15 via-slate-950 to-blue-950/20" },
  { title: "Desarrollo Web", description: "Plataformas en Next.js con diseño a medida, rendimiento extremo y conversión integrada desde el diseño.", icon: "04", accent: "from-blue-500/20 via-slate-950 to-cyan-950/20" },
  { title: "Landing Pages", description: "Páginas de alto impacto orientadas a captar leads con velocidad, claridad y diseño premium.", icon: "05", accent: "from-indigo-500/20 via-slate-950 to-violet-950/20" },
  { title: "Branding e Identidad Visual", description: "Sistemas de marca coherentes que posicionan a la empresa como una opción premium en su categoría.", icon: "06", accent: "from-violet-500/20 via-slate-950 to-fuchsia-950/20" },
  { title: "Gestión Estratégica de Redes Sociales", description: "Manejo profesional de redes con contenido que construye autoridad y conversación real con la audiencia.", icon: "07", accent: "from-cyan-500/15 via-slate-950 to-indigo-950/20" },
  { title: "Inteligencia Artificial", description: "Integramos IA en procesos de venta y atención para tomar mejores decisiones y escalar sin fricción.", icon: "08", accent: "from-blue-500/20 via-slate-950 to-violet-950/20" },
  { title: "Automatización", description: "Flujos inteligentes que eliminan tareas manuales y aceleran cada etapa del proceso comercial.", icon: "09", accent: "from-violet-500/20 via-slate-950 to-blue-950/20" },
  { title: "CRM", description: "Infraestructura comercial para organizar prospectos, automatizar el seguimiento y aumentar la conversión de oportunidades de negocio.", icon: "10", accent: "from-cyan-500/15 via-slate-950 to-blue-950/20" },
  { title: "Chatbots", description: "Automatizamos conversaciones mediante inteligencia artificial para responder, calificar prospectos y acelerar el proceso comercial.", icon: "11", accent: "from-blue-500/20 via-slate-950 to-indigo-950/20" },
  { title: "Cobertura de Eventos", description: "Registro audiovisual profesional de eventos corporativos y sociales con entrega ágil y de alta calidad.", icon: "12", accent: "from-violet-500/20 via-slate-950 to-cyan-950/20" },
  { title: "Consultoría Estratégica", description: "Diagnóstico y planificación para empresas que buscan crecer con decisiones basadas en estrategia, datos y tecnología.", icon: "13", accent: "from-blue-500/20 via-slate-950 to-violet-950/20" },
];

export const stats: StatItem[] = [
  { value: "+50", label: "Empresas atendidas" },
  { value: "Ecuador + EE. UU.", label: "Mercados" },
  { value: "9+", label: "Sectores" },
  { value: "360°", label: "Sistema de crecimiento" },
];

export const workflow: WorkflowItem[] = [
  { step: "01", title: "Diagnóstico estratégico", description: "Analizamos tu marca, tu mercado y tus procesos actuales para identificar el camino de crecimiento más claro." },
  { step: "02", title: "Diseño del sistema", description: "Construimos una estrategia integral que conecta creatividad, tecnología y automatización con tus objetivos de negocio." },
  { step: "03", title: "Optimización continua", description: "Medimos, analizamos y optimizamos continuamente cada estrategia para convertir los resultados iniciales en crecimiento sostenido." },
];

export const portfolio: PortfolioItem[] = [
  { title: "AM Motorsport", category: "Automotriz · Meta Ads + Audiovisual", highlight: "Contenido, campañas y estrategia comercial para una marca automotriz que necesita convertir atención en oportunidades reales." },
  { title: "United Kingdom English Academy", category: "Educación · Meta Ads + Contenido", highlight: "Comunicación digital orientada a captar estudiantes y comunicar una propuesta educativa clara, cercana y confiable." },
  { title: "Constructora Cardagali", category: "Construcción · Marca + Digital", highlight: "Presencia digital diseñada para comunicar confianza, profesionalismo y valor en proyectos de construcción." },
];

export const caseStudies: CaseStudyItem[] = [
  { title: "Educación", metric: "Más claridad comercial", result: "Una propuesta educativa más fácil de entender y convertir.", description: "Construimos narrativas y campañas que conectan la propuesta de valor con las necesidades reales de estudiantes y familias." },
  { title: "Automotriz", metric: "Más oportunidades", result: "Contenido y campañas alineados con el proceso comercial.", description: "Integramos producción audiovisual, publicidad y seguimiento para que la atención se convierta en conversaciones de venta." },
  { title: "Construcción", metric: "Más autoridad", result: "Una presencia digital a la altura del negocio.", description: "Ordenamos identidad, comunicación y experiencia digital para transmitir confianza desde el primer contacto." },
];

export const clientGroups: ClientGroupItem[] = [
  { sector: "Educación", clients: ["United Kingdom English Academy", "CETAD San Lucas"] },
  { sector: "Automotriz", clients: ["AM Motorsport"] },
  { sector: "Construcción e inmobiliario", clients: ["Constructora Cardagali", "Verónica López Arquitectura", "Muebles Ideal"] },
  { sector: "Deportes", clients: ["Pikchus FC", "Liga Deportiva Cantonal de Chordeleg"] },
  { sector: "Salud", clients: ["Medicab"] },
  { sector: "Gastronomía", clients: ["Borincuba Sport & Grill", "La Trinidad Restaurante", "Bocabell"] },
];

export const caseStudyGroups: CaseStudyGroupItem[] = [
  { sector: "Educación", title: "Marcas educativas que inspiran confianza", metric: "Claridad + conversión", result: "Una comunicación más clara para captar y orientar nuevos estudiantes.", description: "Estrategia, contenido y campañas pensadas para comunicar valor educativo sin perder cercanía.", clients: ["United Kingdom English Academy"] },
  { sector: "Automotriz", title: "Atención que se convierte en oportunidad", metric: "Contenido + adquisición", result: "Campañas y piezas audiovisuales alineadas con el proceso comercial.", description: "Integramos creatividad, Meta Ads y seguimiento para generar conversaciones con intención de compra.", clients: ["AM Motorsport"] },
  { sector: "Construcción e inmobiliario", title: "Presencia digital que transmite valor", metric: "Marca + experiencia", result: "Mayor claridad y autoridad desde el primer punto de contacto.", description: "Construimos una presencia digital profesional para negocios donde la confianza es parte esencial de la decisión.", clients: ["Constructora Cardagali", "Verónica López Arquitectura"] },
  { sector: "Deportes", title: "Comunidades con identidad digital", metric: "Visibilidad + comunidad", result: "Una comunicación más consistente y reconocible.", description: "Contenido y estrategia para fortalecer identidad, participación y presencia digital.", clients: ["Pikchus FC", "Liga Deportiva Cantonal de Chordeleg"] },
  { sector: "Salud", title: "Profesionales con presencia confiable", metric: "Marca + cercanía", result: "Comunicación profesional para generar confianza.", description: "Una experiencia digital humana, clara y coherente con el nivel del servicio.", clients: ["Medicab"] },
];

export const testimonials: TestimonialItem[] = [];

export const faq: FaqItem[] = [
  { question: "¿Qué diferencia a AdVibe de una agencia de marketing tradicional?", answer: "No vendemos servicios sueltos, diseñamos sistemas de crecimiento que integran estrategia, creatividad, tecnología y automatización para generar resultados sostenibles." },
  { question: "¿Cómo se inicia un proyecto con AdVibe?", answer: "Con un diagnóstico estratégico de tu marca, tu mercado y tus procesos actuales, para diseñar un plan de crecimiento adaptado a tus objetivos." },
  { question: "¿Trabajan con empresas fuera de Ecuador?", answer: "Sí, operamos con clientes en Ecuador y Estados Unidos, adaptando cada estrategia al mercado y la audiencia correspondiente." },
  { question: "¿Qué resultados puedo esperar al trabajar con AdVibe?", answer: "Trabajamos con objetivos claros: más leads calificados, más ventas, procesos más eficientes y una marca con posicionamiento premium." },
  { question: "¿Cómo se integra la inteligencia artificial en las estrategias?", answer: "Usamos IA para automatizar conversaciones de venta, calificar leads y optimizar decisiones dentro de las campañas y el proceso comercial." },
  { question: "¿Ofrecen acompañamiento después del lanzamiento?", answer: "Sí, damos seguimiento continuo con optimización constante, reportes claros y una relación de socio estratégico, no de proveedor puntual." },
  { question: "¿Incluyen automatización de WhatsApp y CRM?", answer: "Sí, diseñamos sistemas de chatbots y CRM que ordenan el proceso comercial y aceleran la conversión de cada conversación en venta." },
  { question: "¿Trabajan con empresas pequeñas o grandes?", answer: "Trabajamos con empresas que buscan crecer. Adaptamos cada estrategia al tamaño, objetivos y etapa de cada negocio." },
];
