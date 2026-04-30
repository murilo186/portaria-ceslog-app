import { forwardRef, useState, type FocusEvent, type InputHTMLAttributes } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "color">;

type InputProps = NativeInputProps & {
  label: string;
  error?: string;
};

function EyeOpenIcon() {
  return <Visibility fontSize="small" />;
}

function EyeClosedIcon() {
  return <VisibilityOff fontSize="small" />;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", error, id, label, type = "text", onFocus, onBlur, ...props },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPasswordField = type === "password";
  const isDateOrTimeField = type === "date" || type === "time";
  const resolvedType = isPasswordField && showPassword ? "text" : type;
  const currentValue = props.value;
  const hasValue = typeof currentValue === "string" ? currentValue.length > 0 : currentValue != null;
  const hideNativeDateTemplate = isDateOrTimeField && !isFocused && !hasValue;

  return (
    <TextField
      inputRef={ref}
      id={id}
      className={className}
      label={label}
      type={resolvedType}
      error={Boolean(error)}
      helperText={error ?? " "}
      fullWidth
      size="small"
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event as unknown as FocusEvent<HTMLInputElement>);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event as unknown as FocusEvent<HTMLInputElement>);
      }}
      slotProps={{
        inputLabel: {
          shrink: isDateOrTimeField ? true : undefined,
        },
        input: {
          endAdornment: isPasswordField ? (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
      sx={
        isDateOrTimeField
          ? {
              "& input::-webkit-datetime-edit": {
                color: hideNativeDateTemplate ? "transparent" : "inherit",
              },
              "& input::-webkit-calendar-picker-indicator": {
                opacity: hideNativeDateTemplate ? 0.8 : 1,
              },
            }
          : undefined
      }
      {...props}
    />
  );
});

export default Input;
