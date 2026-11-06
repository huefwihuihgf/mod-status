import { useEffect, useState } from "react";
import "./RecipeGeneration.css";

const progressMessages = [
  "Wir analysieren deine Wünsche ...",
  "Wir suchen passende Rezeptideen ...",
  "Wir stimmen Zutaten und Küchenausstattung ab ...",
  "Wir suchen passende Rezeptbilder ...",
];

export default function RecipeGeneration({
  compact = false,
  error = "",
  onRetry,
  retrying = false,
  title,
  loadingMessage,
}) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (compact || error) return undefined;

    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % progressMessages.length);
    }, 2400);

    return () => window.clearInterval(intervalId);
  }, [compact, error]);

  return (
    <div
      className={`recipe-generation ${compact ? "is-compact" : ""} ${error ? "has-error" : ""}`}
      role={error ? undefined : "status"}
      aria-live={error ? undefined : "polite"}
    >
      <div className="recipe-cooking-art" aria-hidden="true">
        <span className="recipe-art-spark spark-one">✦</span>
        <span className="recipe-art-spark spark-two">✦</span>
        <div className="recipe-art-steam"><i /><i /><i /></div>
        <div className="recipe-art-pot">
          <div className="recipe-art-pot-rim" />
          <div className="recipe-art-food">
            <span>🥕</span>
            <span>🥦</span>
            <span>🍅</span>
          </div>
          <div className="recipe-art-pot-body"><span>🍊</span></div>
          <div className="recipe-art-pot-handle left" />
          <div className="recipe-art-pot-handle right" />
        </div>
        <div className="recipe-art-shadow" />
      </div>

      <span className="recipe-generation-eyebrow">ESSENPLAN · REZEPTKÜCHE</span>
      <h2>
        {error ? "Das hat leider nicht geklappt" : title || "Deine Rezepte werden zusammengestellt"}
      </h2>
      <p className="recipe-generation-message">
        {error || loadingMessage || progressMessages[messageIndex]}
      </p>

      {error ? (
        <button
          type="button"
          className="recipe-generation-retry"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? "Wir versuchen es erneut ..." : "Erneut versuchen"}
        </button>
      ) : (
        <div className="recipe-generation-progress" aria-label="Rezeptvorschläge werden geladen">
          <span />
          <span />
          <span />
        </div>
      )}

      {!compact && !error && (
        <p className="recipe-generation-footnote">
          Die Rezeptbilder sind lizenzierte Fundstücke mit Quellenangabe. Preise und
          Filialbestände werden nicht live geprüft.
        </p>
      )}
    </div>
  );
}
