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
  { name: "Paola Migitama", label: "Marca personal" },
  { name: "Medicab", label: "Salud" },
  { name: "Borincuba Sport & Grill", label: "Gastronomía" },
];

export const services: ServiceItem[] = [
  { title: "Meta Ads y Adquisición de Clientes", description: "Campañas publicitarias orientadas a generar mensajes, leads y oportunidades comerciales.", icon: "01", accent: "from-blue-500/20 via-slate-950 to-violet-950/20" },
  { title: "Producción Audiovisual", description: "Contenido audiovisual con dirección creativa y estándar premium para comunicar mejor lo que hace tu negocio.", icon: "02", accent: "from-violet-500/20 via-slate-950 to-blue-950/20" },
  { title: "Fotografía Profesional", description: "Fotografía pensada para mostrar productos, servicios, espacios y personas con una presentación profesional.", icon: "03", accent: "from-cyan-500/15 via-slate-950 to-blue-950/20" },
  { title: "Desarrollo Web", description: "Sitios web rápidos, modernos y orientados a presentar la propuesta de valor y convertir visitas en oportunidades.", icon: "04", accent: "from-blue-500/20 via-slate-950 to-cyan-950/20" },
  { title: "Landing Pages", description: "Páginas de alto impacto enfocadas en campañas, captación de leads y conversión.", icon: "05", accent: "from-indigo-500/20 via-slate-950 to-violet-950/20" },
  { title: "Branding e Identidad Visual", description: "Diseño de identidad visual y piezas de marca cuando el proyecto necesita construir o renovar su presencia.", icon: "06", accent: "from-violet-500/20 via-slate-950 to-fuchsia-950/20" },
  { title: "Gestión Estratégica de Redes Sociales", description: "Contenido y planificación para mantener una comunicación constante, profesional y alineada con los objetivos del negocio.", icon: "07", accent: "from-cyan-500/15 via-slate-950 to-indigo-950/20" },
  { title: "Inteligencia Artificial", description: "Aplicaciones de IA para apoyar atención, análisis, creación de contenido y procesos comerciales.", icon: "08", accent: "from-blue-500/20 via-slate-950 to-violet-950/20" },
  { title: "Automatización", description: "Flujos que reducen tareas repetitivas y ayudan a responder y dar seguimiento a oportunidades con mayor velocidad.", icon: "09", accent: "from-violet-500/20 via-slate-950 to-blue-950/20" },
  { title: "CRM", description: "Organización y seguimiento de prospectos para que las oportunidades no se pierdan después de recibir un mensaje o lead.", icon: "10", accent: "from-cyan-500/15 via-slate-950 to-blue-950/20" },
  { title: "Chatbots", description: "Conversaciones automatizadas para responder preguntas frecuentes y orientar a los prospectos hacia el siguiente paso.", icon: "11", accent: "from-blue-500/20 via-slate-950 to-indigo-950/20" },
  { title: "Cobertura de Eventos", description: "Registro audiovisual profesional de eventos corporativos y sociales con entrega ágil y de alta calidad.", icon: "12", accent: "from-violet-500/20 via-slate-950 to-cyan-950/20" },
  { title: "Consultoría Estratégica", description: "Diagnóstico y planificación para empresas que necesitan ordenar su comunicación, captación y presencia digital.", icon: "13", accent: "from-blue-500/20 via-slate-950 to-violet-950/20" },
];

export const stats: StatItem[] = [
  { value: "+50", label: "Empresas atendidas" },
  { value: "Ecuador + EE. UU.", label: "Mercados" },
  { value: "9+", label: "Sectores" },
  { value: "360°", label: "Soluciones digitales" },
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
  { title: "Paola Migitama", category: "Marca personal · Contenido + Publicidad", highlight: "Desarrollo de contenido y apoyo publicitario para fortalecer la comunicación digital y generar oportunidades comerciales." },
];

export const caseStudies: CaseStudyItem[] = [
  { title: "Educación", metric: "Contenido + campañas", result: "Comunicación digital enfocada en generar consultas.", description: "Para United Kingdom English Academy trabajamos contenido y campañas publicitarias orientadas a comunicar su oferta educativa y atraer potenciales estudiantes." },
  { title: "Automotriz", metric: "Contenido + leads", result: "Creatividades y campañas para generar conversaciones de venta.", description: "En AM Motorsport desarrollamos contenido audiovisual y campañas publicitarias enfocadas en mensajes, leads y oportunidades comerciales." },
  { title: "Salud", metric: "Branding + campañas", result: "Identidad y comunicación digital para una institución de salud.", description: "En CETAD San Lucas realizamos el logo e identidad visual y posteriormente trabajamos contenido, mensajes y generación de leads durante distintas etapas de colaboración." },
];

export const clientGroups: ClientGroupItem[] = [
  { sector: "Educación", clients: ["United Kingdom English Academy"] },
  { sector: "Automotriz", clients: ["AM Motorsport"] },
  { sector: "Salud", clients: ["CETAD San Lucas", "Medicab"] },
  { sector: "Marca personal", clients: ["Paola Migitama"] },
  { sector: "Deportes", clients: ["Pikchus FC", "Liga Deportiva Cantonal de Chordeleg"] },
  { sector: "Gastronomía", clients: ["Borincuba Sport & Grill", "La Trinidad Restaurante", "Bocabell"] },
];

export const caseStudyGroups: CaseStudyGroupItem[] = [
  { sector: "Educación", title: "Contenido que comunica y campañas que generan consultas", metric: "Contenido + Meta Ads", result: "Comunicación de la oferta educativa y generación de oportunidades.", description: "Trabajo de contenido y campañas publicitarias para United Kingdom English Academy.", clients: ["United Kingdom English Academy"] },
  { sector: "Automotriz", title: "Contenido para vender vehículos", metric: "Audiovisual + Publicidad", result: "Más herramientas para comunicar inventario y generar conversaciones.", description: "Producción de contenido y campañas publicitarias para AM Motorsport, con foco en mensajes, leads y oportunidades de venta.", clients: ["AM Motorsport"] },
  { sector: "Salud", title: "De la identidad visual a la captación", metric: "Logo + Contenido + Leads", result: "Una identidad creada y acompañada por comunicación digital.", description: "Para CETAD San Lucas realizamos el logo y parte de la identidad visual, además de contenido y campañas durante diferentes etapas de colaboración.", clients: ["CETAD San Lucas"] },
  { sector: "Marca personal", title: "Contenido para una presencia profesional", metric: "Contenido + Publicidad", result: "Comunicación digital enfocada en oportunidades.", description: "Trabajo de contenido y apoyo publicitario para Paola Migitama.", clients: ["Paola Migitama"] },
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
