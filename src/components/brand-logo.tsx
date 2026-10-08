import React from "react";

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
      iconHeight: 26,
    },
    md: {
      imgHeight: 36,
      iconHeight: 32,
    },
    lg: {
      imgHeight: 46,
      iconHeight: 40,
    },
    xl: {
      imgHeight: 56,
      iconHeight: 48,
    },
  }[size];

  const isIconOnly = !showText || variant === "icon-only";

  // Se for apenas o ícone
  if (isIconOnly) {
    return (
      <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.png"
          alt="Zeladoria Condomínio"
          style={{ height: sizeStyles.iconHeight, width: "auto" }}
          className="object-contain shrink-0"
          loading="eager"
        />
      </div>
    );
  }

  // Versão branca para fundos escuros (4.png)
  if (variant === "white") {
    return (
      <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-white.png"
          alt="Zeladoria Condomínio"
          style={{ height: sizeStyles.imgHeight, width: "auto" }}
          className="object-contain shrink-0"
          loading="eager"
        />
      </div>
    );
  }

  // Versão preta monocromática (5.png)
  if (variant === "black") {
    return (
      <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-black.png"
          alt="Zeladoria Condomínio"
          style={{ height: sizeStyles.imgHeight, width: "auto" }}
          className="object-contain shrink-0"
          loading="eager"
        />
      </div>
    );
  }

  // Versão padrão colorida oficial (6.png)
  return (
    <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
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
