type IconProps = { className?: string };

const base = "h-5 w-5";

function svg(path: React.ReactNode, className?: string, filled = false) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? base}
    >
      {path}
    </svg>
  );
}

export const HomeIcon = ({ className }: IconProps) =>
  svg(<path d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" />, className);

export const ShopIcon = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M4 8h16l-1.2 11a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8Z" />
      <path d="M9 8V6.2A3 3 0 0 1 12 3a3 3 0 0 1 3 3.2V8" />
    </>,
    className,
  );

export const DealsIcon = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0l-6.4-6.4a2 2 0 0 1-.6-1.6l.5-6.1a2 2 0 0 1 1.8-1.8l6.1-.5a2 2 0 0 1 1.6.6l6.4 6.4a2 2 0 0 1 0 2.8Z" />
      <circle cx="8.5" cy="8.5" r="1.4" />
    </>,
    className,
  );

export const CartIcon = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M2.5 3.5h2.2l2.2 11.3a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4l1.4-7.1H6" />
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
    </>,
    className,
  );

export const AccountIcon = ({ className }: IconProps) =>
  svg(
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5c.9-3.7 3.9-5.8 7.5-5.8s6.6 2.1 7.5 5.8" />
    </>,
    className,
  );

export const SearchIcon = ({ className }: IconProps) =>
  svg(
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>,
    className,
  );

export const PhoneIcon = ({ className }: IconProps) =>
  svg(
    <path d="M6.2 3.5h3l1.5 4-2 1.4a12.5 12.5 0 0 0 6.4 6.4l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />,
    className,
  );

export const MenuIcon = ({ className }: IconProps) =>
  svg(<path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />, className);

export const CloseIcon = ({ className }: IconProps) =>
  svg(<path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />, className);

export const PlusIcon = ({ className }: IconProps) =>
  svg(<path d="M12 5.5v13M5.5 12h13" />, className);

export const MinusIcon = ({ className }: IconProps) =>
  svg(<path d="M5.5 12h13" />, className);

export const TrashIcon = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.8 6.5 7.8 20a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4l1-13.5" />
    </>,
    className,
  );

export const CheckIcon = ({ className }: IconProps) =>
  svg(<path d="m5 12.5 4.5 4.5L19 7" />, className);

export const ChevronRightIcon = ({ className }: IconProps) =>
  svg(<path d="m9 5 7 7-7 7" />, className);

export const ChevronDownIcon = ({ className }: IconProps) =>
  svg(<path d="m5 9 7 7 7-7" />, className);

export const TruckIcon = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.2v3.3h-7z" />
      <circle cx="7" cy="18.5" r="1.8" />
      <circle cx="17" cy="18.5" r="1.8" />
    </>,
    className,
  );

export const ClockIcon = ({ className }: IconProps) =>
  svg(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 2" />
    </>,
    className,
  );

export const ShieldIcon = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M12 3 5 5.8v5.4c0 4.3 2.9 8.1 7 9.3 4.1-1.2 7-5 7-9.3V5.8Z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </>,
    className,
  );

export const SparkIcon = ({ className }: IconProps) =>
  svg(
    <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.4l-1.9-5.6L4.5 11l5.6-1.9Z" />,
    className,
  );

export const FilterIcon = ({ className }: IconProps) =>
  svg(<path d="M3.5 6h17M6.5 12h11M10 18h4" />, className);

export const ICONS = {
  home: HomeIcon,
  shop: ShopIcon,
  deals: DealsIcon,
  cart: CartIcon,
  account: AccountIcon,
} as const;
