interface PartnerSelectProps {
  value: string;
  onChange: (value: string) => void;
  partners: string[];
  className?: string;
}

export function PartnerSelect({
  value,
  onChange,
  partners,
  className = ""
}: PartnerSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full sm:w-48 px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] appearance-none transition-colors"
      >
        <option value="">All Partners</option>
        {partners.map(partner => (
          <option key={partner} value={partner}>
            {partner}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
        <svg className="h-5 w-5 text-[var(--foreground-muted)]" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}
