"use client";
/**
 * src/ui/components/ChonDiem.tsx
 *
 * Component chọn điểm đến / điểm khởi hành thả xuống chuẩn Accessibility (ARIA).
 * Tuân thủ AGENTS.md:
 * - Chỉ nhận props, không tự gọi API.
 * - Icon SVG (lucide-react), tuyệt đối không dùng emoji.
 * - Bo góc, màu sắc, khoảng cách 100% từ Design Tokens (src/design/tokens.json).
 * - Bàn phím: Mũi tên lên/xuống, Enter để chọn, Esc để đóng.
 * - Có thể gõ để lọc nhưng CHỈ chọn trong danh sách.
 * - Mục đã chọn ở ô kia bị vô hiệu (disabledOptionTen).
 */

import React, { useState, useRef, useEffect, useId } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import type { DiemDen } from "@/contracts";

export interface ChonDiemProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: DiemDen | null;
  onChange: (val: DiemDen | null) => void;
  options: DiemDen[];
  disabledOptionTen?: string | null;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  icon?: React.ReactNode;
}

function boDau(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function ChonDiem({
  id: propId,
  label,
  placeholder = "Chọn địa điểm...",
  value,
  onChange,
  options,
  disabledOptionTen,
  disabled = false,
  error = false,
  errorMessage,
  icon,
}: ChonDiemProps) {
  const generatedId = useId();
  const inputId = propId || `chon-diem-${generatedId}`;
  const listboxId = `listbox-${inputId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value?.ten || "");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Đồng bộ searchTerm khi value từ ngoài thay đổi
  useEffect(() => {
    setSearchTerm(value?.ten || "");
  }, [value]);

  // Lọc danh sách theo từ khoá
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = boDau(searchTerm);
    const tenNorm = boDau(opt.ten);
    const quocGiaNorm = boDau(opt.quocGia);
    return tenNorm.includes(term) || quocGiaNorm.includes(term);
  });

  // Đóng khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        // Khôi phục giá trị đã chọn (chỉ được chọn trong danh sách)
        setSearchTerm(value?.ten || "");
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [value]);

  // Cuộn đến mục đang được highlight
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const isOptionDisabled = (opt: DiemDen): boolean => {
    if (!disabledOptionTen) return false;
    return (
      boDau(opt.ten) === boDau(disabledOptionTen) ||
      opt.ten.toLowerCase() === disabledOptionTen.toLowerCase()
    );
  };

  const handleSelect = (opt: DiemDen) => {
    if (isOptionDisabled(opt)) return;
    onChange(opt);
    setSearchTerm(opt.ten);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev + 1;
        while (
          next < filteredOptions.length &&
          isOptionDisabled(filteredOptions[next])
        ) {
          next++;
        }
        return next < filteredOptions.length ? next : prev;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && isOptionDisabled(filteredOptions[next])) {
          next--;
        }
        return next >= 0 ? next : prev;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        highlightedIndex >= 0 &&
        highlightedIndex < filteredOptions.length
      ) {
        const target = filteredOptions[highlightedIndex];
        if (!isOptionDisabled(target)) {
          handleSelect(target);
        }
      } else if (filteredOptions.length === 1 && !isOptionDisabled(filteredOptions[0])) {
        handleSelect(filteredOptions[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm(value?.ten || "");
      setHighlightedIndex(-1);
    } else if (e.key === "Tab") {
      setIsOpen(false);
      setSearchTerm(value?.ten || "");
      setHighlightedIndex(-1);
    }
  };

  const activeDescendantId =
    isOpen && highlightedIndex >= 0
      ? `${inputId}-option-${highlightedIndex}`
      : undefined;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: "var(--color-text)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {icon || <MapPin size={16} color="var(--color-primary-main)" />}
          <span>{label}</span>
        </label>
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          borderRadius: "var(--r-md)",
          border: error
            ? "1px solid var(--color-status-errBorder)"
            : isOpen
            ? "1px solid var(--color-primary-main)"
            : "1px solid var(--color-border)",
          background: disabled
            ? "var(--color-surface-hover)"
            : "var(--color-surface)",
          boxShadow: isOpen
            ? "0 0 0 3px var(--color-primary-tint)"
            : "none",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          aria-invalid={error}
          disabled={disabled}
          value={searchTerm}
          placeholder={placeholder}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            height: 44,
            padding: "0 36px 0 14px",
            fontSize: "var(--font-size-base)",
            color: "var(--color-text)",
            background: "transparent",
            border: "none",
            outline: "none",
            borderRadius: "var(--r-md)",
            cursor: disabled ? "not-allowed" : "text",
          }}
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label={isOpen ? "Đóng danh sách" : "Mở danh sách"}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }
          }}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            padding: 4,
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-sub)",
          }}
        >
          <ChevronDown
            size={18}
            style={{
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </div>

      {error && errorMessage && (
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-status-errText)",
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </span>
      )}

      {/* Danh sách thả xuống */}
      {isOpen && !disabled && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={label || placeholder}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: 240,
            overflowY: "auto",
            margin: 0,
            padding: "6px 0",
            listStyle: "none",
            borderRadius: "var(--r-md)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12)",
          }}
        >
          {filteredOptions.length === 0 ? (
            <li
              style={{
                padding: "10px 14px",
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-sub)",
                textAlign: "center",
              }}
            >
              Không tìm thấy địa điểm phù hợp trong danh sách
            </li>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isDisabled = isOptionDisabled(opt);
              const isSelected = value?.ten === opt.ten;
              const isHighlighted = highlightedIndex === idx;

              return (
                <li
                  key={`${opt.ten}-${idx}`}
                  id={`${inputId}-option-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) handleSelect(opt);
                  }}
                  onMouseEnter={() => {
                    if (!isDisabled) setHighlightedIndex(idx);
                  }}
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "var(--font-size-sm)",
                    color: isDisabled
                      ? "var(--color-text-sub)"
                      : isSelected
                      ? "var(--color-primary-main)"
                      : "var(--color-text)",
                    background: isDisabled
                      ? "transparent"
                      : isHighlighted
                      ? "var(--color-surface-hover)"
                      : isSelected
                      ? "var(--color-primary-tint)"
                      : "transparent",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.45 : 1,
                    transition: "background 0.1s ease",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: isSelected ? 600 : 500 }}>
                      {opt.ten}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-sub)",
                      }}
                    >
                      {opt.quocGia}
                      {isDisabled && " (đã chọn ở ô còn lại)"}
                    </span>
                  </div>

                  {isSelected && (
                    <Check size={16} color="var(--color-primary-main)" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
