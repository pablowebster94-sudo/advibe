export type Landing = {
  slug: string;
  /** Lo que la gente escribe en Google. */
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  problemTitle: string;
  problems: string[];
  offerTitle: string;
  offer: { title: string; text: string }[];
  reelIds: string[];
  faq: { question: string; answer: string }[];
  whatsappText: string;
};

export const landings: Landing[] = [
  {
    slug: "agencia-de-marketing-gualaceo",
    keyword: "agencia de marketing en Gualaceo",
    metaTitle: "Agencia de Marketing en Gualaceo | AdVibe Agencia",
    metaDescription:
      "Agencia de marketing digital en Gualaceo, Azuay. Videos, contenido para redes y Meta Ads para negocios locales que quieren más clientes por WhatsApp.",
    eyebrow: "Agencia de marketing · Gualaceo, Azuay",
    h1: "Agencia de marketing en Gualaceo para negocios que quieren vender más.",
    intro:
      "Estamos en Gualaceo y trabajamos con negocios del cantón y de todo el Azuay. Grabamos tu contenido, lo publicamos con estrategia y manejamos tus anuncios en Facebook e Instagram para que los mensajes lleguen a tu WhatsApp.",
    problemTitle: "Si te pasa algo de esto, podemos ayudarte",
    problems: [
      "Publicas en redes, pero casi nadie escribe para preguntar o comprar.",
      "Pagas anuncios y no sabes si de verdad te traen clientes.",
      "Tus fotos y videos no muestran lo bueno que es tu producto.",
      "No tienes tiempo para crear contenido todas las semanas.",
    ],
    offerTitle: "Qué hacemos por tu negocio",
    offer: [
      { title: "Contenido y video", text: "Grabamos en tu local: producto, equipo, clientes y sketches que la gente sí ve hasta el final." },
      { title: "Meta Ads", text: "Campañas en Facebook e Instagram dirigidas a personas de tu zona, pensadas para generar conversaciones por WhatsApp." },
      { title: "Redes sociales", text: "Plan de publicaciones, textos y seguimiento para que tu cuenta se mantenga activa y con un mensaje claro." },
      { title: "Web y Google", text: "Página web y ficha de Google para que te encuentren cuando buscan lo que vendes." },
    ],
    reelIds: ["kamauto", "restaurante", "muebles", "rocys"],
    faq: [
      { question: "¿Dónde está AdVibe Agencia?", answer: "Estamos en Gualaceo, Azuay, y atendemos negocios de Gualaceo, Cuenca, Paute, Chordeleg, Sígsig y el resto de la provincia." },
      { question: "¿Graban en mi local?", answer: "Sí. Vamos a tu negocio a grabar producto, equipo y clientes, y también podemos hacer sketches con guion." },
      { question: "¿Cómo empiezo?", answer: "Escríbenos por WhatsApp o pide el diagnóstico gratuito. Revisamos tus redes y anuncios actuales y te decimos qué conviene hacer primero." },
    ],
    whatsappText: "Hola, tengo un negocio en el Azuay y quiero información sobre sus servicios de marketing.",
  },
  {
    slug: "produccion-de-video-cuenca",
    keyword: "producción de video en Cuenca",
    metaTitle: "Producción de Video para Negocios en Cuenca | AdVibe Agencia",
    metaDescription:
      "Producción de videos y reels para negocios en Cuenca y el Azuay: sketches, videos de producto, institucionales y contenido para TikTok e Instagram.",
    eyebrow: "Producción audiovisual · Cuenca y Azuay",
    h1: "Producción de video para negocios en Cuenca y el Azuay.",
    intro:
      "Hacemos videos verticales pensados para redes: cortos, con gancho en el primer segundo y con subtítulos. Desde sketches con guion hasta videos de producto e institucionales, grabados en tu negocio.",
    problemTitle: "Un buen video hace que se detengan a mirar",
    problems: [
      "Muchas personas deciden en los primeros segundos si siguen mirando un video.",
      "Un video grabado sin plan suele verse bien, pero no vende.",
      "Las redes premian el contenido corto, constante y con personas reales.",
    ],
    offerTitle: "Tipos de video que producimos",
    offer: [
      { title: "Sketches comerciales", text: "Historias cortas con humor y un mensaje de venta claro, como el que hicimos para Kamauto." },
      { title: "Videos de producto", text: "Tomas que muestran el detalle, la textura y el uso de lo que vendes: autos, muebles, joyas, comida." },
      { title: "Institucionales", text: "Videos que presentan tu empresa, tus instalaciones y a tu equipo." },
      { title: "Cobertura de eventos", text: "Lanzamientos, inauguraciones, eventos deportivos y celebraciones." },
    ],
    reelIds: ["kamauto", "am-mini-cooper", "cetad", "aa-school"],
    faq: [
      { question: "¿Graban en Cuenca?", answer: "Sí. Grabamos en Cuenca, Gualaceo y otros cantones del Azuay." },
      { question: "¿Los videos sirven para TikTok, Reels y anuncios?", answer: "Sí. Los entregamos en formato vertical, listos para TikTok, Instagram Reels, Facebook y campañas de Meta Ads." },
      { question: "¿Ustedes escriben el guion?", answer: "Sí. Proponemos la idea y el guion, y lo ajustamos contigo antes de grabar." },
    ],
    whatsappText: "Hola, quiero cotizar la producción de videos para mi negocio.",
  },
  {
    slug: "meta-ads-azuay",
    keyword: "Meta Ads en el Azuay",
    metaTitle: "Publicidad en Facebook e Instagram (Meta Ads) en el Azuay | AdVibe Agencia",
    metaDescription:
      "Manejo de anuncios en Facebook e Instagram para negocios de Cuenca, Gualaceo y el Azuay. Campañas enfocadas en conversaciones por WhatsApp y clientes reales.",
    eyebrow: "Meta Ads · Facebook e Instagram",
    h1: "¿Tus anuncios gastan, pero no venden?",
    intro:
      "Manejamos tus campañas en Facebook e Instagram para negocios del Azuay. Unimos el contenido con la publicidad: creamos el video del anuncio, lo mostramos a las personas correctas de tu zona y medimos cuántas conversaciones genera.",
    problemTitle: "Errores comunes que encarecen tus anuncios",
    problems: [
      "Usar el botón de \"promocionar\" sin una estrategia ni un público claro.",
      "Anuncios con imágenes o videos que no detienen a nadie.",
      "Medir solo \"me gusta\" en lugar de mensajes y ventas.",
      "Mostrar el anuncio a todo el país cuando tus clientes están en tu ciudad.",
    ],
    offerTitle: "Cómo trabajamos tus campañas",
    offer: [
      { title: "Diagnóstico", text: "Revisamos tus anuncios actuales y te mostramos dónde se está yendo el dinero." },
      { title: "Creatividades", text: "Producimos los videos y textos del anuncio pensando en tu cliente ideal." },
      { title: "Campañas a WhatsApp", text: "Configuramos campañas para que las personas te escriban directamente." },
      { title: "Optimización", text: "Revisamos los resultados y ajustamos público, presupuesto y anuncios." },
    ],
    reelIds: ["am-mini-cooper", "aa-school", "rocys", "muebles"],
    faq: [
      { question: "¿Cuánto debo invertir en anuncios?", answer: "Depende de tu negocio y tu zona. En el diagnóstico gratuito te recomendamos un presupuesto inicial realista para empezar a medir resultados." },
      { question: "¿El pago de anuncios está incluido en su servicio?", answer: "No. La inversión en anuncios se paga directamente a Meta; nuestro servicio es la estrategia, el contenido y el manejo de las campañas." },
      { question: "¿En cuánto tiempo veo resultados?", answer: "Las primeras conversaciones pueden empezar a llegar en los primeros días de campaña, y los ajustes semanales ayudan a mejorar los resultados con el tiempo." },
    ],
    whatsappText: "Hola, quiero que revisen mis anuncios de Facebook e Instagram.",
  },
  {
    slug: "videos-para-restaurantes",
    keyword: "videos para restaurantes",
    metaTitle: "Videos y Marketing para Restaurantes en Cuenca y Gualaceo | AdVibe Agencia",
    metaDescription:
      "Videos de comida, contenido para redes y anuncios para restaurantes y cafeterías en Cuenca, Gualaceo y el Azuay. Haz que tu comida se vea tan bien como sabe.",
    eyebrow: "Contenido para restaurantes · Azuay",
    h1: "Hacemos que tu comida se vea tan bien como sabe.",
    intro:
      "Grabamos platos, preparación y ambiente de tu restaurante en video vertical para redes y anuncios. Contenido pensado para que la gente lo guarde, lo comparta y vaya a tu local.",
    problemTitle: "Por qué el video importa en un restaurante",
    problems: [
      "La gente elige dónde comer viendo fotos y videos en redes.",
      "Un plato bien grabado provoca antojo; uno mal grabado espanta.",
      "Los videos de preparación y detrás de cámaras generan mucha interacción.",
    ],
    offerTitle: "Qué hacemos para tu restaurante",
    offer: [
      { title: "Videos de platos", text: "Tomas cercanas, luz cuidada y movimiento para mostrar cada plato del menú." },
      { title: "Detrás de cámaras", text: "Cocina, preparación y equipo: el contenido que más conecta." },
      { title: "Anuncios locales", text: "Campañas para que gente cerca de tu local te escriba o reserve." },
      { title: "Fotos para menú y delivery", text: "Imágenes para tu carta, apps de delivery y ficha de Google." },
    ],
    reelIds: ["restaurante", "kamauto", "muebles", "rocys"],
    faq: [
      { question: "¿Graban en horario de atención?", answer: "Coordinamos contigo el mejor horario para no interrumpir a tus clientes; muchas veces grabamos antes de abrir." },
      { question: "¿Cuántos videos salen de una grabación?", answer: "Depende del plan. En una jornada se puede grabar material para varias semanas de contenido." },
      { question: "¿Trabajan con cafeterías y heladerías?", answer: "Sí, con cualquier negocio de comida: restaurantes, cafeterías, panaderías, heladerías y food trucks." },
    ],
    whatsappText: "Hola, tengo un restaurante y quiero información sobre videos y contenido.",
  },
];

export const getLanding = (slug: string) => landings.find((landing) => landing.slug === slug);
