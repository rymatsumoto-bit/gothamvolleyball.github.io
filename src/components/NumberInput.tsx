import { useEffect, useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  /** Receives the raw text; the caller parses it the way that field needs. */
  onChange: (text: string) => void;
};

/**
 * A number field that keeps what the user is typing (for example "1." or "") while the model holds a number.
 * It re-syncs from `value` only when the model changes to something the typed text doesn't already mean.
 */
export function NumberInput({ value, onChange, ...rest }: Props) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText((t) => ((parseFloat(t) || 0) === value ? t : String(value)));
  }, [value]);
  return (
    <input
      type="number"
      value={text}
      onChange={(e) => { setText(e.target.value); onChange(e.target.value); }}
      {...rest}
    />
  );
}
