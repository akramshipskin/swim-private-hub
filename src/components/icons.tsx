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

export const ICONS = {
  users: UsersIcon,
  package: PackageIcon,
  "credit-card": CreditCardIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  "clipboard-check": ClipboardCheckIcon,
} as const;

export type IconName = keyof typeof ICONS;
