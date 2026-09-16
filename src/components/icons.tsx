type IconProps = { className?: string };

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="8" cy="8" r="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 4.2a3.2 3.2 0 0 1 0 6.2M20 19v-1a4 4 0 0 0-2.6-3.75" />
    </svg>
  );
}

export function PackageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5 12 12l8-4.5M12 12v9" />
    </svg>
  );
}

export function CreditCardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path strokeLinecap="round" d="M3 9.5h18M6 15h4" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path strokeLinecap="round" d="M3.5 9.5h17M8 3v3.4M16 3v3.4" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ClipboardCheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5V3.8A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 13 2 2 4-4.5" />
    </svg>
  );
}

export function BarChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M12 20V4M20 20v-7" />
      <path strokeLinecap="round" d="M2.5 20h19" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9.5a6 6 0 1 1 12 0c0 4 1.2 5.2 1.7 5.9.3.4 0 1-.5 1H4.8c-.5 0-.8-.6-.5-1 .5-.7 1.7-1.9 1.7-5.9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path strokeLinecap="round" d="m20 20-4.6-4.6" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
  );
}

export function UserEditIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="9" cy="8" r="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19v-1a4 4 0 0 1 4-4h3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.3 12.7-5.1 5.1-2.4.7.7-2.4 5.1-5.1a1.5 1.5 0 0 1 2.1 0l.3.3a1.5 1.5 0 0 1-.7 1.4Z" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5V6a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H10m11 0-3.2-3.2M21 12l-3.2 3.2" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="12" cy="12" r="4.2" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"
      />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 14.5a8.5 8.5 0 1 1-9-11 7 7 0 0 0 9 11Z" />
    </svg>
  );
}

export const ICONS = {
  users: UsersIcon,
  package: PackageIcon,
  "credit-card": CreditCardIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  "clipboard-check": ClipboardCheckIcon,
  "bar-chart": BarChartIcon,
  search: SearchIcon,
} as const;

export type IconName = keyof typeof ICONS;
