import { useState } from "react";

const toCssSize = (size) => (typeof size === "number" ? `${size}px` : size);

export const FruitImage = ({ src, alt = "", fallback = "🍍", size = 120, style, className = "" }) => {
  const [hasError, setHasError] = useState(false);

  const boxStyle = {
    width: toCssSize(size),
    height: toCssSize(size),
    ...style,
  };

  if (hasError || !src) {
    const numericSize = typeof size === "number" ? size : 120;
    return (
      <div
        className={`fruit-image-fallback ${className}`}
        style={{ ...boxStyle, fontSize: `${Math.max(18, Math.round(numericSize * 0.34))}px` }}
        title={alt}
        role="img"
        aria-label={alt}
      >
        <span>{fallback}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={`fruit-image ${className}`}
      style={boxStyle}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

export default FruitImage;