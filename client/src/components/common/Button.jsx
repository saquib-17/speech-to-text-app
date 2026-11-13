import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type = "button",
  onClick,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#F07800]/25 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    xs: "h-[28px] px-2.5 py-0.5 text-[11px] font-medium gap-1",
    sm: "h-[32px] px-3 py-1 text-xs font-semibold gap-1.5",
    md: "h-[38px] px-4 py-1.5 text-[13px] font-semibold gap-2",
    lg: "h-[40px] px-4.5 py-2 text-[13.5px] font-semibold gap-2",
  };

  const variantStyles = {
    primary:
      "bg-[#F07800] hover:bg-[#D96B00] active:bg-[#BF5E00] text-white shadow-xs border border-[#F07800]",
    secondary:
      "bg-white hover:bg-[#FAF9FC] active:bg-[#FFF1E2] text-[#191B2B] border border-[#EBE8F0] hover:border-[#DDD8E6] shadow-2xs",
    purple:
      "bg-[#7138B8] hover:bg-[#602DA2] active:bg-[#50228C] text-white shadow-xs border border-[#7138B8]",
    studio:
      "bg-[#F07800] hover:bg-[#D96B00] active:bg-[#BF5E00] text-white shadow-xs border border-[#F07800]",
    ghost:
      "bg-transparent hover:bg-[#FFF1E2] text-[#191B2B] hover:text-[#F07800] border border-transparent",
    danger:
      "bg-[#FDECEC] hover:bg-[#FBD5D5] active:bg-[#F8BDBD] text-[#DC4545] border border-[#F8BDBD] shadow-2xs",
  };

  return (
    <motion.button
      type={type}
      whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
};

export default Button;
