import { Icon } from "./Icon";
import { Input, type InputProps } from "./Input";

export interface SearchInputProps extends Omit<InputProps, "value" | "onChange" | "icon" | "rightSlot" | "type"> {
  value: string;
  onValueChange: (value: string) => void;
}

/** Qidiruv maydoni (tozalash tugmasi bilan). Server so'rovi uchun useDebouncedValue bilan ishlating. */
export function SearchInput({ value, onValueChange, placeholder = "Qidirish…", ...rest }: SearchInputProps) {
  return (
    <Input
      type="search"
      icon="search"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
      rightSlot={
        value ? (
          <button
            type="button"
            onClick={() => onValueChange("")}
            className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
            aria-label="Tozalash"
          >
            <Icon name="close" size={18} />
          </button>
        ) : null
      }
      {...rest}
    />
  );
}
