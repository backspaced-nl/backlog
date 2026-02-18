interface TagDisplayProps {
  tag: string;
  count?: number;
  isSelected?: boolean;
  onClick?: (tag: string) => void;
  onRemove?: (tag: string) => void;
  variant?: 'filter' | 'pill';
}

export function TagDisplay({ 
  tag, 
  count, 
  isSelected, 
  onClick, 
  onRemove,
  variant = 'pill' 
}: TagDisplayProps) {
  const baseStyles = {
    filter: `px-3 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-colors ${
      isSelected
        ? 'bg-[var(--accent-muted)] text-[var(--accent-foreground)] border border-[var(--border)]'
        : 'bg-[var(--bg)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
    }`,
    pill: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-muted)] text-[var(--accent-foreground)] whitespace-nowrap border border-transparent"
  };

  if (onClick) {
    return (
      <button
        onClick={() => onClick(tag)}
        className={baseStyles[variant]}
      >
        {tag} {count !== undefined && count > 0 && `(${count})`}
      </button>
    );
  }

  if (onRemove) {
    return (
      <span className={baseStyles[variant]}>
        {tag}
        <button
          type="button"
          onClick={() => onRemove(tag)}
          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[var(--accent)]/10 text-[var(--accent)]"
        >
          ×
        </button>
      </span>
    );
  }

  return (
    <span className={baseStyles[variant]}>
      {tag}
    </span>
  );
}
