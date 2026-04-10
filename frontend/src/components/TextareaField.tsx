import { forwardRef, type TextareaHTMLAttributes } from "react";
import { formControlBaseClass } from "./formStyles";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  { className = "", id, label, ...props },
  ref,
) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-700">
        {label}
      </label>

      <textarea ref={ref} id={id} className={`${formControlBaseClass} ${className}`.trim()} {...props} />
    </div>
  );
});

export default TextareaField;