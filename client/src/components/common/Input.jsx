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
        <label htmlFor={inputId} className="text-[12px] font-medium text-[#191B2B] flex items-center justify-between">
          <span>
            {label} {required && <span className="text-[#F07800]">*</span>}
          </span>
          {helperText && <span className="text-[10px] font-normal text-[#686B7A]">{helperText}</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-[#686B7A] flex items-center justify-center">
            <Icon className="w-4 h-4" />
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
          className={`w-full h-[38px] bg-white border rounded-xl py-1.5 px-3 text-xs sm:text-[13px] text-[#191B2B] placeholder:text-[#9598A8] shadow-2xs transition-all duration-150 focus:outline-none ${Icon ? "pl-9" : "pl-3"
            } ${isPassword ? "pr-9" : "pr-3"} ${error
              ? "border-[#DC4545] focus:border-[#DC4545] focus:ring-2 focus:ring-[#DC4545]/20"
              : "border-[#EBE8F0] hover:border-[#DDD8E6] focus:border-[#F07800] focus:ring-2 focus:ring-[#F07800]/20"
            } ${disabled ? "opacity-50 cursor-not-allowed bg-[#FAF9FC]" : ""} ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[#686B7A] hover:text-[#191B2B] focus:outline-none cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-[#DC4545] mt-0.5">{error}</p>}
    </div>
  );
};

export default Input;
