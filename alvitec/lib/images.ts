import type { StaticImageData } from "next/image";
import hero from "@/public/images/hero-casa-vidrio.jpg";
import fachadaVidrio from "@/public/images/fachada-vidrio.jpg";
import torresVidrio from "@/public/images/torres-vidrio.jpg";
import revestimiento from "@/public/images/revestimiento-paneles.jpg";
import casaCorredizas from "@/public/images/casa-corredizas.jpg";
import casaPiscina from "@/public/images/casa-piscina.jpg";
import interiorVidrio from "@/public/images/interior-vidrio.jpg";
import oficinaDivisiones from "@/public/images/oficina-divisiones.jpg";
import oficinaPasillo from "@/public/images/oficina-pasillo.jpg";
import salaAcristalada from "@/public/images/sala-acristalada.jpg";
import salaEstar from "@/public/images/sala-estar.jpg";
import salaVentanales from "@/public/images/sala-ventanales.jpg";
import edificioBlanco from "@/public/images/edificio-blanco.jpg";
import edificioResidencial from "@/public/images/edificio-residencial.jpg";
import torresReflectivas from "@/public/images/torres-reflectivas.jpg";
import volumenBlanco from "@/public/images/volumen-blanco.jpg";
import lobbyVidrio from "@/public/images/lobby-vidrio.jpg";

// Todas las fotografías son referenciales (banco de imágenes Unsplash).
// No son obras de ALVITEC: reemplazar por fotos autorizadas de proyectos propios.

export const images = {
  hero,
  fachadaVidrio,
  revestimiento,
  casaCorredizas,
  interiorVidrio,
  oficinaDivisiones,
  oficinaPasillo,
  salaAcristalada,
  salaEstar,
};

export type GalleryItem = { src: StaticImageData; alt: string; label: string };

export const gallery: GalleryItem[] = [
  { src: torresVidrio, alt: "Torres con fachada de vidrio vistas desde la calle", label: "Fachadas de vidrio" },
  { src: edificioBlanco, alt: "Edificio blanco de volúmenes apilados con ventanas", label: "Ventanas de aluminio" },
  { src: salaVentanales, alt: "Sala de doble altura con ventanales de piso a techo", label: "Ventanales residenciales" },
  { src: oficinaDivisiones, alt: "Oficina con divisiones de vidrio y perfilería oscura", label: "Divisiones de oficina" },
  { src: fachadaVidrio, alt: "Edificio comercial con fachada curva de vidrio", label: "Piel de vidrio" },
  { src: casaPiscina, alt: "Casa contemporánea con barandas de vidrio junto a una piscina", label: "Vidrio en exteriores" },
  { src: interiorVidrio, alt: "Comedor separado por un cerramiento de vidrio con marco oscuro", label: "Cerramientos interiores" },
  { src: edificioResidencial, alt: "Edificio residencial con fachada revestida y balcones", label: "Revestimiento de fachada" },
  { src: lobbyVidrio, alt: "Espacio de trabajo con frente acristalado y vegetación", label: "Frentes acristalados" },
  { src: torresReflectivas, alt: "Torres de vidrio reflectivo bajo un cielo nublado", label: "Fachadas corporativas" },
  { src: casaCorredizas, alt: "Casa con puertas corredizas de vidrio hacia el patio", label: "Puertas corredizas" },
  { src: volumenBlanco, alt: "Edificio de volúmenes blancos con cubierta acristalada", label: "Cubiertas y fachadas" },
];
