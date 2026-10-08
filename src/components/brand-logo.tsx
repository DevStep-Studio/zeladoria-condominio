import React from "react";
import Image from "next/image";

export function BrandIconSvg({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer Building Arch */}
      <rect
        x="4.75"
        y="3.5"
        width="14.5"
        height="17"
        rx="2.75"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom Entrance Doorway Arch */}
      <path
        d="M9.5 20.5v-3a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2v3"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sparkle Window Stars (6 in 2 columns) */}
      {/* Left Column */}
      <polygon
        points="8.5,6.3 8.85,7.15 9.7,7.5 8.85,7.85 8.5,8.7 8.15,7.85 7.3,7.5 8.15,7.15"
        fill="currentColor"
      />
      <polygon
        points="8.5,9.8 8.85,10.65 9.7,11 8.85,11.35 8.5,12.2 8.15,11.35 7.3,11 8.15,10.65"
        fill="currentColor"
      />
      <polygon
        points="8.5,13.3 8.85,14.15 9.7,14.5 8.85,14.85 8.5,15.7 8.15,14.85 7.3,14.5 8.15,14.15"
        fill="currentColor"
      />

      {/* Right Column */}
      <polygon
        points="15.5,6.3 15.85,7.15 16.7,7.5 15.85,7.85 15.5,8.7 15.15,7.85 14.3,7.5 15.15,7.15"
        fill="currentColor"
      />
      <polygon
        points="15.5,9.8 15.85,10.65 16.7,11 15.85,11.35 15.5,12.2 15.15,11.35 14.3,11 15.15,10.65"
        fill="currentColor"
      />
      <polygon
        points="15.5,13.3 15.85,14.15 16.7,14.5 15.85,14.85 15.5,15.7 15.15,14.85 14.3,14.5 15.15,14.15"
        fill="currentColor"
      />
    </svg>
  );
}

export function BrandLogo({
  size = "md",
  className = "",
  showText = true,
  variant = "default",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  variant?: "default" | "white" | "black" | "icon-only";
}) {
  const sizeStyles = {
    sm: {
      imgHeight: 28,
      imgWidth: 191,
      box: "h-7 w-7 rounded-[8px]",
      iconSize: 15,
      textSize: "text-[13px] tracking-tight",
      gap: "gap-1.5",
    },
    md: {
      imgHeight: 36,
      imgWidth: 246,
      box: "h-9 w-9 rounded-[10px]",
      iconSize: 19,
      textSize: "text-lg sm:text-[19px] tracking-tight",
      gap: "gap-2.5",
    },
    lg: {
      imgHeight: 44,
      imgWidth: 300,
      box: "h-11 w-11 rounded-[12px]",
      iconSize: 23,
      textSize: "text-xl sm:text-2xl tracking-tight",
      gap: "gap-3",
    },
    xl: {
      imgHeight: 52,
      imgWidth: 355,
      box: "h-13 w-13 rounded-[15px]",
      iconSize: 28,
      textSize: "text-2xl sm:text-3xl tracking-tight",
      gap: "gap-3.5",
    },
  }[size];

  const isIconOnly = !showText || variant === "icon-only";

  // Se for o caso padrão com texto, usa a imagem oficial recortada e transparente
  if (variant === "default" && !isIconOnly) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Zeladoria Condomínio"
          style={{ height: sizeStyles.imgHeight, width: "auto" }}
          className="object-contain shrink-0"
          loading="eager"
        />
      </div>
    );
  }

  // Se for apenas o ícone no formato default
  if (variant === "default" && isIconOnly) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.png"
          alt="Zeladoria Condomínio"
          style={{ height: sizeStyles.imgHeight, width: sizeStyles.imgHeight }}
          className="object-contain shrink-0 rounded-[10px]"
          loading="eager"
        />
      </div>
    );
  }

  const getBoxStyles = () => {
    if (variant === "white") {
      return "bg-white text-[#0055D4] shadow-sm";
    }
    if (variant === "black") {
      return "bg-slate-900 text-white shadow-xs";
    }
    return "bg-[#0055D4] text-white shadow-xs";
  };

  const getTextStyles = () => {
    if (variant === "white") {
      return {
        prefix: "text-white",
        highlight: "text-[#FFD000]",
      };
    }
    if (variant === "black") {
      return {
        prefix: "text-slate-900",
        highlight: "text-slate-600",
      };
    }
    return {
      prefix: "text-[#0F172A]",
      highlight: "text-[#0055D4]",
    };
  };

  const textStyles = getTextStyles();

  return (
    <div className={`inline-flex items-center ${sizeStyles.gap} select-none ${className}`}>
      {/* Brand Squircle Icon */}
      <span
        className={`flex shrink-0 items-center justify-center font-bold transition-transform ${sizeStyles.box} ${getBoxStyles()}`}
      >
        <BrandIconSvg size={sizeStyles.iconSize} />
      </span>

      {/* Brand Typography */}
      {!isIconOnly && (
        <span
          className={`font-black leading-none whitespace-nowrap ${sizeStyles.textSize}`}
        >
          <span className={textStyles.prefix}>Zeladoria </span>
          <span className={textStyles.highlight}>Condomínio</span>
        </span>
      )}
    </div>
  );
}
