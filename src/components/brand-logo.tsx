import React from "react";
import { Icon } from "@/components/icon";

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
      box: "h-7 w-7 rounded-[8px]",
      iconSize: 14,
      textSize: "text-[12.5px]",
      gap: "gap-1.5",
    },
    md: {
      box: "h-8.5 w-8.5 rounded-[10px]",
      iconSize: 18,
      textSize: "text-base sm:text-lg",
      gap: "gap-2.5",
    },
    lg: {
      box: "h-10 w-10 rounded-[12px]",
      iconSize: 22,
      textSize: "text-xl sm:text-2xl",
      gap: "gap-3",
    },
    xl: {
      box: "h-12 w-12 rounded-[14px]",
      iconSize: 26,
      textSize: "text-2xl sm:text-3xl",
      gap: "gap-3.5",
    },
  }[size];

  const isIconOnly = !showText || variant === "icon-only";

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
      {/* Brand Icon Box */}
      <span
        className={`flex shrink-0 items-center justify-center font-bold transition-transform ${sizeStyles.box} ${getBoxStyles()}`}
      >
        <Icon name="building" size={sizeStyles.iconSize} strokeWidth={2.2} />
      </span>

      {/* Brand Typography */}
      {!isIconOnly && (
        <span
          className={`font-black tracking-tight leading-none whitespace-nowrap ${sizeStyles.textSize}`}
        >
          <span className={textStyles.prefix}>Zeladoria </span>
          <span className={textStyles.highlight}>Condomínio</span>
        </span>
      )}
    </div>
  );
}
