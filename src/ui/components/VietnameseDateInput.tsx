"use client";

import { useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import styles from "./VietnameseDateInput.module.css";

function isoDate(text: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return "";
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number(year) > 0 && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : "";
}

export function VietnameseDateInput({ value, name, min, required, onValueChange, "aria-label": label, "aria-invalid": invalid, "aria-describedby": describedBy }: {
  value?: string;
  name?: string;
  min?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const iso = value ?? selected;

  function update(next: string) {
    setSelected(next);
    onValueChange?.(next);
  }

  return (
    <span className={styles.control}>
      <input ref={textInput} className={styles.text} type="text" aria-label={label}
        aria-invalid={invalid} aria-describedby={describedBy}
        placeholder="dd/mm/yyyy" inputMode="numeric" required={required} maxLength={10}
        value={draft ?? iso.split("-").reverse().join("/")}
        onChange={(event) => {
          const text = event.target.value;
          const next = isoDate(text);
          setDraft(text);
          event.target.setCustomValidity(text && (!next || (min && next < min)) ? "Vui lòng nhập ngày hợp lệ theo dạng dd/mm/yyyy." : "");
          update(next);
        }}
      />
      {name && <input type="hidden" name={name} value={iso} />}
      <span className={styles.picker}>
        <CalendarDays size={18} aria-hidden="true" />
        <input type="date" aria-label={label ? `Mở lịch: ${label}` : "Mở lịch"}
          value={iso} min={min}
          onChange={(event) => {
            textInput.current?.setCustomValidity("");
            setDraft(null);
            update(event.target.value);
          }}
          onClick={(event) => {
            const input = event.currentTarget;
            if (typeof input.showPicker === "function") input.showPicker();
          }}
        />
      </span>
    </span>
  );
}
