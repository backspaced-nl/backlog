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
    filter: `px-3 py-1 rounded-md text-sm font-medium ${
      isSelected
        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
    }`,
    display: "px-3 py-1 bg-gray-50 text-indigo-800 rounded-md text-xs border border-indigo-100",
    pill: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 whitespace-nowrap"
  };

  if (onClick) {
    return (
      <button
        onClick={() => onClick(tag)}
        className={baseStyles[variant]}
      >
        {tag} {count !== undefined && `(${count})`}
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
          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200"
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