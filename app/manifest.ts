import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdVibe Agencia",
    short_name: "AdVibe",
    description: "Marketing, contenido audiovisual, desarrollo web, inteligencia artificial y automatización para empresas.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070b",
    theme_color: "#05070b",
    lang: "es-EC",
  };
}
