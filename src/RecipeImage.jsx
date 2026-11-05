import { useState } from "react";
import "./RecipeImage.css";

export function RecipeImage({ src, name, className = "" }) {
  const [imageState, setImageState] = useState({ src, failed: !src });
  const failed = imageState.src === src ? imageState.failed : !src;

  if (failed || !src) {
    return (
      <div
        className={`recipe-image-fallback ${className}`}
        role="img"
        aria-label={`Kein passendes Foto für ${name} verfügbar`}
      >
        <span aria-hidden="true">🍽️</span>
        <small>Für dieses Rezept wurde kein passendes Foto gefunden.</small>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Foto für ${name}`}
      className={className}
      loading="lazy"
      onError={() => setImageState({ src, failed: true })}
    />
  );
}

export function ImageAttribution({
  credit,
  sourceUrl,
  license,
  licenseUrl,
}) {
  if (!sourceUrl) return null;

  return (
    <p className="recipe-image-attribution">
      <a href={sourceUrl} target="_blank" rel="noreferrer">
        Bildnachweis: {credit || "Wikimedia Commons"}
      </a>
      {license && (
        <>
          <span aria-hidden="true"> · </span>
          {licenseUrl ? (
            <a href={licenseUrl} target="_blank" rel="noreferrer">
              {license}
            </a>
          ) : (
            <span>{license}</span>
          )}
        </>
      )}
    </p>
  );
}
