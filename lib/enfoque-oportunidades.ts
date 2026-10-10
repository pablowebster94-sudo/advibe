// Productos de la campaña de carrusel de Enfoque Visual (octubre 2026).
// Página estática: no depende de Supabase, así funciona aunque el catálogo esté vacío.
// Datos tomados de los anuncios de Meta y de las fichas enviadas por Pablo (10-10-2026).

export type Oportunidad={id:string;kind:"propiedad"|"vehiculo"|"negocio";title:string;price:number;place:string;images:string[];specs:string[];description:string;seller:string};

// WhatsApp que recibe los contactos de esta página (solo dígitos, con 593). Vacío = se usa NEXT_PUBLIC_WHATSAPP_NUMBER.
export const OPORTUNIDADES_WHATSAPP="";

export const OPORTUNIDADES:Oportunidad[]=[
  {id:"casa-gualaceo",kind:"propiedad",title:"Casa remodelada de 2 plantas",price:190000,place:"Gualaceo · Divina Misericordia",seller:"Venta directa con el propietario",images:[],
    specs:["223,96 m² de terreno","223,04 m² de construcción","Garaje para 2–3 vehículos","Habitación máster con walk-in clóset"],
    description:"A media cuadra de la iglesia Divina Misericordia. Planta baja: garaje, sala, cocina, comedor, 1 habitación y baño social; atrás, lavandería, zona de barbacoa, patio y cuarto adicional. Planta alta: habitación máster con baño privado, hall amplio y 1 habitación más con baño compartido. Losa de hormigón armado, recién remodelada y lista para habitar."},
  {id:"casa-tasqui",kind:"propiedad",title:"Casa de campo en Tasqui",price:165000,place:"Tasqui · a 5 min de Sígsig",seller:"Constructora Peralta",
    images:[6,1,7,8,9,2,3,4,5].map(n=>`/enfoque-visual/oportunidades/casa-tasqui-${n}.jpg`),
    specs:["3.189 m² de terreno","Aprox. 100 m² de construcción","4 dormitorios · 1 baño","Garaje"],
    description:"Rodeada de naturaleza, con espacio para tu familia, tu huerto y tus animales. Ideal para vivir tranquilo, para fines de semana o como inversión. Precio negociable según la forma de pago."},
  {id:"linea-bus",kind:"negocio",title:"Línea de bus + buseta",price:150000,place:"Santiago de Gualaceo",seller:"Venta directa",images:[],
    specs:["Línea de bus","Línea de buseta","Participación en el terreno de TEDASA","Paquete completo"],
    description:"Oportunidad para invertir en transporte: se venden la línea de bus y la línea de buseta de Santiago de Gualaceo. Al ser socio participas también del terreno donde opera TEDASA en Gualaceo."},
  {id:"toyota-gt86",kind:"vehiculo",title:"Toyota GT86 Limited 2013",price:38000,place:"AM Motorsport",images:["/enfoque-visual/oportunidades/toyota-gt86.jpg"],seller:"AM Motorsport",
    specs:["67.000 km aprox.","2.0 L Boxer + supercargador Edelbrock","Aros Niche 18\"","Traspaso directo"],
    description:"Computadora Link, llantas Maxxis, asientos en cuero y gamuza, láminas de seguridad, A/C, vidrios eléctricos, mandos al volante, radio Android, cámara de reversa, escape inoxidable y tratamiento cerámico de dos años. Dos llaves y manual. Dígito de placa L. Documentos al día, directo a notaría."},
  {id:"hyundai-i10",kind:"vehiculo",title:"Hyundai i10 de circuito",price:28000,place:"AM Motorsport",images:["/enfoque-visual/oportunidades/hyundai-i10.jpg"],seller:"AM Motorsport",
    specs:["Computadora Haltech","Suspensión Bilstein","Jaula de competencia","Diferencial autoblocante"],
    description:"Preparado para pista: toma de aire de alto flujo, piñones españoles de 3.ª a 5.ª, shift light Autometer, espárragos de aluminio, volante OMP Superleggera, embrague metálico, asiento Sparco, llantas Davanti de circuito, recuperador de aceite, header y escape, ITVS de 38 mm y alivianado."},
];
