import { WA_DEFAULT, waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./icons";

export function WhatsAppFloat() {
  return (
    <a
      href={waLink(WA_DEFAULT)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir a ALVITEC por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F7A41] text-white shadow-[0_10px_30px_rgba(16,36,58,0.35)] transition-transform duration-200 hover:scale-105 sm:bottom-7 sm:right-7"
    >
      <WhatsAppIcon width={28} height={28} />
    </a>
  );
}
