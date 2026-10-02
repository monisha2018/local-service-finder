import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = "", ...rest }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>}
    <input
      ref={ref}
      className={`w-full px-4 py-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
        error ? "border-error" : "border-border"
      } ${className}`}
      {...rest}
    />
    {error && <p className="text-error text-xs mt-1">{error}</p>}
  </div>
));
Input.displayName = "Input";
export default Input;
