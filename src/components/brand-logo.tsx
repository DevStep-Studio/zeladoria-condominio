import React from "react";

export function BrandLogo({
  size = "md",
  className = "",
  showText = true,
  variant = "default",
  height,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  variant?: "default" | "white" | "black" | "icon-only";
  height?: number;
}) {
  const sizeStyles = {
    sm: {
      imgHeight: 44,
      iconHeight: 40,
    },
    md: {
      imgHeight: 56,
      iconHeight: 50,
    },
    lg: {
      imgHeight: 74,
      iconHeight: 64,
    },
    xl: {
      imgHeight: 96,
      iconHeight: 84,
    },
  }[size];

  const isIconOnly = !showText || variant === "icon-only";
  const finalHeight = height ?? (isIconOnly ? sizeStyles.iconHeight : sizeStyles.imgHeight);

  // Se for apenas o ícone
  if (isIconOnly) {
    const iconSrc = variant === "white" ? "/icon-white.png?v=5" : "/favicon.png?v=5";
    return (
      <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt="Zeladoria Condomínio"
          style={{ height: finalHeight, width: "auto" }}
          className="object-contain shrink-0"
          loading="eager"
        />
      </div>
    );
  }

  // Versão branca para fundos escuros
  if (variant === "white") {
    return (
      <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-white.png?v=5"
          alt="Zeladoria Condomínio"
          style={{ height: finalHeight, width: "auto" }}
          className="object-contain shrink-0"
          loading="eager"
        />
      </div>
    );
  }

  // Versão padrão colorida oficial
  return (
    <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-principal.png?v=5"
        alt="Zeladoria Condomínio"
        style={{ height: finalHeight, width: "auto" }}
        className="object-contain shrink-0"
        loading="eager"
      />
    </div>
  );
}
