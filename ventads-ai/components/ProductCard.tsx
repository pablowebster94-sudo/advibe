import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog/categories";

const STATUS_LABEL: Record<string, string> = {
  READY: "Listo",
  PENDING: "Generando",
  FAILED: "Con errores",
};

export function ProductCard({
  href,
  title,
  category,
  imageUrl,
  status,
}: {
  href: string;
  title: string;
  category: string;
  imageUrl: string | null;
  status: string | null;
}) {
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface transition-colors hover:border-accent-strong"
    >
      <div className="relative aspect-[4/3] w-full bg-surface-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill sizes="360px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-faint">
            Sin foto
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted">{categoryLabel}</span>
        <span className="text-sm font-medium text-foreground line-clamp-1">{title}</span>
        {status && (
          <span className="mt-1 w-fit rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-muted">
            {STATUS_LABEL[status] ?? status}
          </span>
        )}
      </div>
    </Link>
  );
}
