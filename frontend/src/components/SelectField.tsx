import { Children, forwardRef, isValidElement, type ChangeEvent, type SelectHTMLAttributes } from "react";
import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { className = "", id, label, children, value, onChange, disabled, required, name },
  ref,
) {
  const handleChange = (event: SelectChangeEvent<string>) => {
    if (!onChange) {
      return;
    }

    const syntheticEvent = {
      ...event,
      target: {
        ...event.target,
        value: event.target.value,
        name: name ?? id,
      },
      currentTarget: {
        ...event.target,
        value: event.target.value,
        name: name ?? id,
      },
    } as unknown as ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
  };

  return (
    <FormControl fullWidth size="small" className={className} disabled={disabled} required={required}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        label={label}
        value={String(value ?? "")}
        inputRef={ref}
        onChange={handleChange}
      >
        {Children.toArray(children).map((child, index) => {
          if (!isValidElement(child)) {
            return null;
          }

          const optionValue = (child.props as { value?: string }).value ?? "";
          const optionLabel = (child.props as { children?: string }).children ?? "";

          return (
            <MenuItem key={`${optionValue}-${index}`} value={optionValue}>
              {optionLabel}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
});

export default SelectField;
