import Image from "next/image";

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
  // Determine which image file from public to use
  let src = "/6.png"; // Full color logo
  if (variant === "white") {
    src = showText ? "/4.png" : "/9.png";
  } else if (variant === "black") {
    src = showText ? "/5.png" : "/10.png";
  } else if (!showText || variant === "icon-only") {
    src = "/8.png";
  }

  // Dimensions based on size
  let height = 36;
  let width = showText && variant !== "icon-only" ? 140 : 36;

  if (size === "sm") {
    height = 28;
    width = showText && variant !== "icon-only" ? 110 : 28;
  } else if (size === "lg") {
    height = 46;
    width = showText && variant !== "icon-only" ? 180 : 46;
  } else if (size === "xl") {
    height = 56;
    width = showText && variant !== "icon-only" ? 220 : 56;
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Zeladoria Condomínio"
        style={{
          height: `${height}px`,
          width: "auto",
          maxWidth: `${width * 1.5}px`,
          objectFit: "contain",
        }}
        className="shrink-0 transition-opacity"
      />
    </div>
  );
}
