"use client";
import React, { useEffect, useRef, useState } from "react";
import type { ProgressPlace } from "@/core/tripProgress";
import { Check, Copy, ExternalLink, X } from "lucide-react";

interface B9ChiDuongPopoverProps {
  place: ProgressPlace | null;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function B9ChiDuongPopover({ place, onClose, position }: B9ChiDuongPopoverProps) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng khi bấm phím Escape & trap focus
  useEffect(() => {
    if (!place) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [place, onClose]);

  if (!place) return null;

  const diaChi = place.diaChi || place.ten;
  const googleMapsUrl =
    place.mapsUrls?.chiDuong ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(diaChi)}`;
  const appleMapsUrl =
    place.mapsUrls?.apple ||
    `http://maps.apple.com/?daddr=${encodeURIComponent(diaChi)}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(diaChi);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = diaChi;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const popStyle: React.CSSProperties = position
    ? {
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
      };

  return (
    <>
      {/* Dim backdrop to close when clicked outside */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(31, 42, 68, 0.18)",
          backdropFilter: "blur(2px)",
          zIndex: 9998,
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Exact Popover styling from user wireframe */}
      <div
        ref={containerRef}
        className="Pop"
        style={popStyle}
        role="dialog"
        aria-label="Chỉ đường địa điểm"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="PopTitle">{place.ten}</div>
            <div className="PopSub">{diaChi}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#5C6B88",
              padding: 4,
            }}
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="PopItem"
          onClick={() => {
            window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
            onClose();
          }}
        >
          Mở bằng Google Maps
        </div>

        <div
          className="PopItem"
          onClick={() => {
            window.open(appleMapsUrl, "_blank", "noopener,noreferrer");
            onClose();
          }}
        >
          Mở bằng Apple Maps
        </div>

        <div className="PopItem" onClick={handleCopy}>
          {copied ? "✓ Đã sao chép địa chỉ!" : "Sao chép địa chỉ"}
        </div>
      </div>
    </>
  );
}

export default B9ChiDuongPopover;
