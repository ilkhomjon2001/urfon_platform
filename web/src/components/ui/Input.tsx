import { useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useField } from "./Field";
import { Icon } from "./Icon";

export const controlBase =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md text-on-surface " +
  "placeholder:text-outline transition-colors outline-none " +
  "focus:border-primary focus:ring-2 focus:ring-primary/15 " +
  "disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-muted " +
  "aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/15";

function useControlProps(props: { id?: string; invalid?: boolean; "aria-describedby"?: string }) {
  const f = useField();
  const invalid = props.invalid ?? f?.invalid ?? false;
  return {
    id: props.id ?? f?.id,
    "aria-invalid": invalid || undefined,
    "aria-describedby": props["aria-describedby"] ?? f?.describedBy,
  };
}

const inputSizes = { sm: "h-8 px-2.5 text-body-sm", md: "h-10 px-3", lg: "h-12 px-4 text-body-lg" } as const;

export interface InputProps extends Omit<ComponentProps<"input">, "size"> {
  /** Chap tomondagi Material ikonka */
  icon?: string;
  /** O'ng tomondagi element (tugma, birlik "soʻm") */
  rightSlot?: ReactNode;
  invalid?: boolean;
  size?: keyof typeof inputSizes;
  wrapperClassName?: string;
}

export function Input({ icon, rightSlot, invalid, size = "md", className, wrapperClassName, ...rest }: InputProps) {
  const a11y = useControlProps({ id: rest.id, invalid, "aria-describedby": rest["aria-describedby"] });
  const input = (
    <input
      {...rest}
      {...a11y}
      className={cn(controlBase, inputSizes[size], icon && "pl-10", rightSlot != null && "pr-10", className)}
    />
  );
  if (!icon && rightSlot == null) return input;
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      {icon ? (
        <Icon name={icon} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
      ) : null}
      {input}
      {rightSlot != null ? (
        <div className="absolute inset-y-0 right-1.5 flex items-center text-on-surface-variant">{rightSlot}</div>
      ) : null}
    </div>
  );
}

/** Parol maydoni: ko'rsatish/yashirish tugmasi bilan. */
export function PasswordInput(props: Omit<InputProps, "type" | "rightSlot">) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      type={show ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
          aria-label={show ? "Parolni yashirish" : "Parolni koʻrsatish"}
          title={show ? "Parolni yashirish" : "Parolni koʻrsatish"}
        >
          <Icon name={show ? "visibility_off" : "visibility"} size={20} />
        </button>
      }
    />
  );
}

export interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, rows = 4, ...rest }: TextareaProps) {
  const a11y = useControlProps({ id: rest.id, invalid, "aria-describedby": rest["aria-describedby"] });
  return <textarea rows={rows} {...rest} {...a11y} className={cn(controlBase, "resize-y px-3 py-2.5", className)} />;
}

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<ComponentProps<"select">, "size"> {
  options?: SelectOption[];
  /** Bo'sh qiymatli birinchi variant ("Tanlang…") */
  placeholder?: string;
  invalid?: boolean;
  size?: keyof typeof inputSizes;
  wrapperClassName?: string;
}

/** Native select (mobil qulay). options yoki <option> children. */
export function Select({ options, placeholder, invalid, size = "md", className, wrapperClassName, children, ...rest }: SelectProps) {
  const a11y = useControlProps({ id: rest.id, invalid, "aria-describedby": rest["aria-describedby"] });
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <select
        {...rest}
        {...a11y}
        className={cn(controlBase, inputSizes[size], "cursor-pointer appearance-none pr-9", className)}
      >
        {placeholder != null ? <option value="">{placeholder}</option> : null}
        {options?.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      <Icon
        name="expand_more"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
    </div>
  );
}

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label?: ReactNode;
  description?: ReactNode;
}

export function Checkbox({ label, description, className, ...rest }: CheckboxProps) {
  const box = (
    <input
      type="checkbox"
      {...rest}
      className={cn("mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-outline accent-primary", !label && className)}
    />
  );
  if (!label) return box;
  return (
    <label className={cn("inline-flex cursor-pointer select-none items-start gap-2.5", className)}>
      {box}
      <span className="flex flex-col">
        <span className="text-body-md text-on-surface">{label}</span>
        {description ? <span className="text-body-sm text-on-surface-variant">{description}</span> : null}
      </span>
    </label>
  );
}
