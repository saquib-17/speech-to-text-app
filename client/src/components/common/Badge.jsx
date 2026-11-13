export const Badge = ({
  children,
  variant = "neutral",
  size = "md",
  icon: Icon,
  className = "",
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10.5px] gap-1 font-medium",
    md: "px-2.5 py-0.5 text-[11.5px] gap-1.5 font-medium",
  };

  const variantStyles = {
    completed: "bg-[#E8F7EF] text-[#269B62] border-[#269B62]/20",
    processing: "bg-[#FFF1E2] text-[#F07800] border-[#F07800]/30 animate-pulse",
    uploaded: "bg-[#FAF9FC] text-[#191B2B] border-[#EBE8F0]",
    failed: "bg-[#FDECEC] text-[#DC4545] border-[#F8BDBD]",
    neutral: "bg-[#FAF9FC] text-[#686B7A] border-[#EBE8F0]",
    mono: "bg-white text-[#191B2B] font-mono border-[#EBE8F0] text-[11px]",
    orange: "bg-[#F07800] text-white border-transparent",
    orangeLight: "bg-[#FFF1E2] text-[#F07800] border-[#F07800]/20",
    purple: "bg-[#F3EBFC] text-[#7138B8] border-[#7138B8]/20",
    brand: "bg-[#FFF1E2] text-[#F07800] border-[#F07800]/20",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shrink-0 select-none ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {variant === "completed" && !Icon && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#269B62]" />
      )}
      {variant === "processing" && !Icon && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#F07800] animate-ping" />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
