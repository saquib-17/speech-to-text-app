export const Badge = ({
  children,
  variant = "neutral",
  size = "md",
  icon: Icon,
  className = "",
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[9px] sm:text-[10px] gap-1",
    md: "px-2 py-0.5 text-[10px] sm:text-[11px] gap-1.5",
  };

  const variantStyles = {
    completed: "bg-amber-brand-light text-amber-brand border-amber-brand/25",
    processing: "bg-amber-soft-light text-amber-soft border-amber-soft/35 animate-pulse",
    uploaded: "bg-warm-ivory text-charcoal border-warm-grey",
    failed: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-warm-ivory text-stone-grey border-warm-grey",
    mono: "bg-pure-white text-charcoal font-mono border-warm-grey text-[11px]",
    amber: "bg-amber-brand text-pure-white border-amber-brand",
    brand: "bg-amber-brand-light text-amber-brand border-amber-brand/25",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shrink-0 select-none ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {variant === "completed" && !Icon && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-brand" />
      )}
      {variant === "processing" && !Icon && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-soft animate-ping" />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
