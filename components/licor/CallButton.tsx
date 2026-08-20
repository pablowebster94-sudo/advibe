"use client";

import { trackPhoneCall } from "@/lib/licor/analytics";
import { PhoneIcon } from "./Icons";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./ui";

/**
 * `tel:` link that reports a Contact event before the dialer opens.
 * Used everywhere the "ORDER BY PHONE" path is offered.
 */
export default function CallButton({
  phone,
  label,
  variant = "primary",
  size = "md",
  className = "",
  showIcon = true,
}: {
  phone: { label: string; tel: string };
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <a
      href={`tel:${phone.tel}`}
      onClick={() => trackPhoneCall(phone.label)}
      className={buttonClass(variant, size, className)}
      // With no label the visible text is the number itself, so it already
      // makes a good accessible name.
      aria-label={label ? `${label}: ${phone.label}` : undefined}
    >
      {showIcon ? <PhoneIcon className="h-4 w-4" /> : null}
      {label ?? phone.label}
    </a>
  );
}
