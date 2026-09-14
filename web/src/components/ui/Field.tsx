import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface FieldCtx {
  id: string;
  describedBy?: string;
  invalid: boolean;
}
const FieldContext = createContext<FieldCtx | null>(null);

/** Input/Textarea/Select ichida: id, aria-invalid, aria-describedby avtomatik olinadi. */
export const useField = () => useContext(FieldContext);

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Label o'ng tomonidagi qo'shimcha (masalan "Parolni unutdingizmi?") */
  labelAction?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

/**
 *  <Field label="Telefon" error={errors.phone} required>
 *    <Input value={phone} onChange={…} />
 *  </Field>
 */
export function Field({ label, hint, error, required, labelAction, htmlFor, className, children }: FieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const msgId = `${id}-msg`;
  const hasMsg = !!error || !!hint;
  return (
    <FieldContext.Provider value={{ id, describedBy: hasMsg ? msgId : undefined, invalid: !!error }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label || labelAction ? (
          <div className="flex items-center justify-between gap-2">
            {label ? (
              <label htmlFor={id} className="font-label-md text-label-md text-on-surface">
                {label}
                {required ? <span className="ml-0.5 text-error">*</span> : null}
              </label>
            ) : (
              <span />
            )}
            {labelAction}
          </div>
        ) : null}
        {children}
        {error ? (
          <p id={msgId} className="flex items-start gap-1 text-body-sm text-error">
            <Icon name="error" size={15} className="mt-px" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p id={msgId} className="text-body-sm text-on-surface-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
