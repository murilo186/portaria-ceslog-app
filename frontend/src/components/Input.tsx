import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", error, id, label, ...props },
  ref,
) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-700">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={`w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${className}`.trim()}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
});

export default Input;
