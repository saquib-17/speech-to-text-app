import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const Input = ({
  label,
  error,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  icon: Icon,
  className = "",
  containerClassName = "",
  helperText,
  id,
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input_${label?.toLowerCase().replace(/\s+/g, "_") || Math.random().toString(36).substr(2, 5)}`;
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-charcoal flex items-center justify-between">
          <span>
            {label} {required && <span className="text-amber-brand">*</span>}
          </span>
          {helperText && <span className="text-[10px] font-normal text-stone-grey">{helperText}</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-stone-grey flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}

        <input
          id={inputId}
          type={actualType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-pure-white border rounded-lg py-1.5 sm:py-2 text-xs sm:text-sm text-charcoal placeholder:text-stone-grey-light shadow-2xs transition-all duration-150 focus:outline-none ${
            Icon ? "pl-9" : "pl-3"
          } ${isPassword ? "pr-9" : "pr-3"} ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
              : "border-warm-grey hover:border-warm-grey-strong focus:border-amber-brand focus:ring-2 focus:ring-amber-brand/20"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-warm-ivory" : ""} ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-stone-grey hover:text-charcoal transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
};

export default Input;
