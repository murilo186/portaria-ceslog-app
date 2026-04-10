import { forwardRef, type SelectHTMLAttributes } from "react";
import { formControlBaseClass } from "./formStyles";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { className = "", id, label, children, ...props },
  ref,
) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-700">
        {label}
      </label>

      <select ref={ref} id={id} className={`${formControlBaseClass} ${className}`.trim()} {...props}>
        {children}
      </select>
    </div>
  );
});

export default SelectField;