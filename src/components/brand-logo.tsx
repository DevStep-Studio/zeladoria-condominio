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
  let src = "/6.png"; // Full color official logo (Blue + Yellow building)
  if (variant === "white") {
    src = showText ? "/4.png" : "/9.png";
  } else if (variant === "black") {
    src = showText ? "/5.png" : "/10.png";
  } else if (!showText || variant === "icon-only") {
    src = "/8.png";
  }

  let height = 34;
  let width = showText && variant !== "icon-only" ? 140 : 34;

  if (size === "sm") {
    height = 26;
    width = showText && variant !== "icon-only" ? 110 : 26;
  } else if (size === "lg") {
    height = 42;
    width = showText && variant !== "icon-only" ? 170 : 42;
  } else if (size === "xl") {
    height = 52;
    width = showText && variant !== "icon-only" ? 210 : 52;
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
