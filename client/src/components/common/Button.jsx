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
    "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-brand/25 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-xs sm:text-sm gap-1.5",
    lg: "px-4 py-2 text-sm gap-2",
  };

  const variantStyles = {
    primary:
      "bg-amber-brand hover:bg-amber-brand-hover active:bg-amber-brand-active text-pure-white shadow-xs border border-amber-brand",
    secondary:
      "bg-pure-white hover:bg-warm-ivory active:bg-warm-grey text-charcoal border border-warm-grey hover:border-warm-grey-strong shadow-2xs",
    studio:
      "bg-amber-brand hover:bg-amber-brand-hover active:bg-amber-brand-active text-pure-white shadow-sm border border-amber-brand",
    ghost:
      "bg-transparent hover:bg-warm-ivory text-charcoal hover:text-charcoal-strong border border-transparent",
    danger:
      "bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 shadow-2xs",
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
