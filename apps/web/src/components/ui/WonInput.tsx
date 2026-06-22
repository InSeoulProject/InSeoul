import { forwardRef, type InputHTMLAttributes } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  unit?: string;
}

const WonInput = forwardRef<HTMLInputElement, Props>(({ label, error, unit = "만원", className = "", ...rest }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <div className="relative">
      <input
        ref={ref}
        type="number"
        min={0}
        className={`w-full rounded-xl border border-gray-300 px-3 py-2 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${error ? "border-red-400" : ""} ${className}`}
        {...rest}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
    </div>
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
));
WonInput.displayName = "WonInput";
export default WonInput;
