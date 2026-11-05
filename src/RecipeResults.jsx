
import { useMemo, useState } from "react";
import RecipeGeneration from "./RecipeGeneration";
import { ImageAttribution, RecipeImage } from "./RecipeImage";
import "./RecipeResults.css";

function normalize(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("de-DE");
}

function formatAmount(amount) {
  const value = Number(amount);
  return Number.isInteger(value) ? value : value.toFixed(1).replace(".", ",");
}

export default function RecipeResults({
  planData,
  recipes = [],
  savedRecipes = [],
  onEdit,
  onRefresh,
  onSaveShoppingList,
  onAddRecipeToShoppingList,
  onToggleSavedRecipe,
  savingShoppingList = false,
  shoppingListError = "",
  recipeGenerationError = "",
  refreshingDay = "",
  storeCatalogNotice = "",
}) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeDay, setActiveDay] = useState("Alle");
  const [addingRecipeId, setAddingRecipeId] = useState(null);
  const [savingFavoriteId, setSavingFavoriteId] = useState(null);
  const [recipeActionMessage, setRecipeActionMessage] = useState("");
  const [recipeActionError, setRecipeActionError] = useState("");
  const [favoriteActionError, setFavoriteActionError] = useState("");

  const people = Math.max(
    1,
    Number(planData.adults || 0) +
      Number(planData.children || 0) +
      (planData.friends || []).length
  );
  const days = useMemo(() => planData.days || [], [planData.days]);
  const schedule = useMemo(
    () => recipes.map((recipe) => ({ day: recipe.day, meal: recipe.meal, recipe })),
    [recipes]
  );

  const visibleSchedule =
    activeDay === "Alle"
      ? schedule
      : schedule.filter((item) => item.day === activeDay);

  const shoppingIngredients = [];
  const ingredientIndexes = new Map();

  schedule.forEach(({ recipe }) => {
    recipe.ingredients.forEach(({ name, amount, unit }) => {
      const key = `${normalize(name)}|${normalize(unit)}`;
      const existingIndex = ingredientIndexes.get(key);
      const scaledAmount = Number(amount);

      if (existingIndex === undefined) {
        ingredientIndexes.set(key, shoppingIngredients.length);
        shoppingIngredients.push({ name, amount: scaledAmount, unit });
      } else {
        shoppingIngredients[existingIndex].amount += scaledAmount;
      }
    });
  });

  shoppingIngredients.forEach((ingredient) => {
    ingredient.amount = Number(ingredient.amount.toFixed(3));
  });

  const savedRecipeMatches = new Set(savedRecipes.map(normalize));

  function isFavorite(recipe) {
    return savedRecipeMatches.has(normalize(recipe.name));
  }

  async function addRecipeToShoppingList(recipe) {
    setAddingRecipeId(recipe.id);
    setRecipeActionError("");
    setRecipeActionMessage("");

    try {
      await onAddRecipeToShoppingList?.(
        recipe,
        recipe.ingredients.map(({ name, amount, unit }) => ({
          name,
          amount: Number(Number(amount).toFixed(3)),
          unit,
        }))
      );
      setRecipeActionMessage(`${recipe.name} wurde zur Einkaufsliste hinzugefügt.`);
    } catch (error) {
      setRecipeActionError(error.message || "Das Rezept konnte nicht hinzugefügt werden.");
    } finally {
      setAddingRecipeId(null);
    }
  }

  async function toggleSavedRecipe(recipe) {
    setSavingFavoriteId(recipe.id);
    setFavoriteActionError("");

    try {
      await onToggleSavedRecipe?.(recipe.name);
    } catch (error) {
      setFavoriteActionError(error.message || "Das Rezept konnte nicht gespeichert werden.");
    } finally {
      setSavingFavoriteId(null);
    }
  }

  function showOtherRecipes(day) {
    const currentNames = schedule
      .filter((item) => item.day === day)
      .map((item) => item.recipe.name);
    onRefresh?.(day, currentNames);
  }

  if (selectedRecipe) {
    return (
      <section className="page-content recipe-page">
        <button
          className="recipe-back"
          onClick={() => setSelectedRecipe(null)}
        >
          ← Zurück zu deinen Rezepten
        </button>

        <div className="recipe-detail-card">
          <RecipeImage
            className="recipe-detail-image"
            src={selectedRecipe.image}
            name={selectedRecipe.name}
          />
          <ImageAttribution
            credit={selectedRecipe.imageCredit}
            sourceUrl={selectedRecipe.imageSourceUrl}
            license={selectedRecipe.imageLicense}
            licenseUrl={selectedRecipe.imageLicenseUrl}
          />

          <div className="recipe-detail-content">
            <span className="recipe-eyebrow">DEIN REZEPT</span>
            <h1>{selectedRecipe.name}</h1>
            <p>{selectedRecipe.description}</p>

            <div className="recipe-meta">
              <span>◷ {selectedRecipe.time} Minuten</span>
              <span>♧ {people} Personen</span>
              {selectedRecipe.equipment?.length > 0 && (
                <span>♨ Zubereitung mit: {selectedRecipe.equipment.join(", ")}</span>
              )}
            </div>

            <div className="recipe-actions">
              <button
                type="button"
                className="recipe-favorite-button"
                onClick={() => toggleSavedRecipe(selectedRecipe)}
                disabled={savingFavoriteId === selectedRecipe.id}
              >
                {isFavorite(selectedRecipe) ? "♥ Gespeichert" : "♡ Als Favorit speichern"}
              </button>
              <button
                type="button"
                className="recipe-add-shopping-button"
                onClick={() => addRecipeToShoppingList(selectedRecipe)}
                disabled={addingRecipeId === selectedRecipe.id}
              >
                {addingRecipeId === selectedRecipe.id
                  ? "Wird hinzugefügt ..."
                  : "Zutaten zur Einkaufsliste"}
              </button>
            </div>
            {recipeActionMessage && <p className="recipe-action-message" role="status">{recipeActionMessage}</p>}
            {recipeActionError && <p className="recipe-action-error" role="alert">{recipeActionError}</p>}
            {favoriteActionError && <p className="recipe-action-error" role="alert">{favoriteActionError}</p>}

            <h2>Zutaten für {people} Personen</h2>
            <div className="recipe-ingredients">
              {selectedRecipe.ingredients.map((ingredient, index) => (
                <div className="recipe-ingredient" key={index}>
                  <span>{ingredient.name}</span>
                  <strong>
                    {formatAmount(ingredient.amount)} {ingredient.unit}
                  </strong>
                </div>
              ))}
            </div>

            <h2>Zubereitung</h2>
            <div className="recipe-instructions">
              {selectedRecipe.instructions.map((step, index) => (
                <div className="recipe-instruction" key={index}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>

            <div className="recipe-safety-note">
              Bitte prüfe bei Allergien immer auch die Zutatenliste und
              Hinweise auf der Lebensmittelverpackung. Eine Rezeptfilterung
              kann Spuren oder abweichende Produktzutaten nicht ausschließen.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-content recipe-page">
      <div className="recipe-results-header">
        <div>
          <span className="small-eyebrow">DEIN ESSENPLAN</span>
          <h1>Deine Rezeptideen 🍊</h1>
          <p className="page-description">
            Deine Vorschläge wurden passend zu deinen Angaben mit KI erstellt.
          </p>
        </div>

        <button className="recipe-edit-button" onClick={onEdit}>
          Angaben bearbeiten
        </button>
      </div>

      {recipeGenerationError && (
        <p className="recipe-action-error" role="alert">{recipeGenerationError}</p>
      )}
      {storeCatalogNotice && (
        <p className="recipe-shortage-note" role="status">{storeCatalogNotice}</p>
      )}

      <div className="recipe-shopping-save">
        <div>
          <strong>Alles für deinen Essensplan auf einmal einkaufen</strong>
          <p>
            {shoppingIngredients.length} Zutaten · gleiche Zutaten und Einheiten
            werden zusammengezählt
          </p>
        </div>
        <button
          type="button"
          className="recipe-shopping-save-button"
          onClick={() => onSaveShoppingList?.(shoppingIngredients)}
          disabled={savingShoppingList || shoppingIngredients.length === 0}
        >
          {savingShoppingList ? "Wird gespeichert ..." : "Einkaufsliste speichern"}
        </button>
        {shoppingListError && (
          <p className="recipe-shopping-save-error" role="alert">
            {shoppingListError}
          </p>
        )}
      </div>
      {recipeActionMessage && (
        <p className="recipe-action-message" role="status">{recipeActionMessage}</p>
      )}
      {recipeActionError && (
        <p className="recipe-action-error" role="alert">{recipeActionError}</p>
      )}
      {favoriteActionError && (
        <p className="recipe-action-error" role="alert">{favoriteActionError}</p>
      )}

      <div className="recipe-overview">
        <div>
          <strong>{schedule.length}</strong>
          <span>geplante Mahlzeiten</span>
        </div>
        <div>
          <strong>{people}</strong>
          <span>Personen</span>
        </div>
        <div>
          <strong>{planData.supermarket}</strong>
          <span>ausgewählter Markt</span>
        </div>
      </div>

      <div className="recipe-day-filter">
        <button
          className={activeDay === "Alle" ? "active" : ""}
          onClick={() => setActiveDay("Alle")}
        >
          Alle Tage
        </button>
        {days.map((day) => (
          <button
            key={day}
            className={activeDay === day ? "active" : ""}
            onClick={() => setActiveDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      {visibleSchedule.length === 0 ? (
        <div className="recipe-empty">
          <span>🥗</span>
          <h2>Hier brauchen wir noch mehr Rezeptideen.</h2>
          <p>
            Für diese Kombination haben wir momentan keine passenden Rezepte.
            Ändere deine Auswahl oder deine Filter.
          </p>
          <button className="recipe-edit-button" onClick={onEdit}>
            Auswahl bearbeiten
          </button>
        </div>
      ) : (
        <div className="recipe-day-sections">
          {(activeDay === "Alle" ? days : [activeDay]).map((day) => {
            const dayRecipes = visibleSchedule.filter((item) => item.day === day);

            return (
              <section className="recipe-day-section" key={day}>
                <div className="recipe-day-heading">
                  <div>
                    <span className="small-eyebrow">DEIN TAG</span>
                    <h2>{day}</h2>
                    <p>{dayRecipes.length} von 2 Rezeptideen</p>
                  </div>
                  <button
                    type="button"
                    className="recipe-refresh-button"
                    onClick={() => showOtherRecipes(day)}
                    disabled={Boolean(refreshingDay)}
                  >
                    {refreshingDay === day
                      ? "Neue Ideen werden erstellt ..."
                      : "↻ Andere Rezepte anzeigen"}
                  </button>
                </div>
                {refreshingDay === day && (
                  <RecipeGeneration compact />
                )}
                <div className="recipe-grid">
                  {dayRecipes.map((item) => (
                    <article
                      className="recipe-card"
                      key={`${item.day}-${item.recipe.id}`}
                    >
                      <div className="recipe-card-image-wrap">
                        <RecipeImage
                          src={item.recipe.image}
                          name={item.recipe.name}
                          className="recipe-card-image"
                        />
                        <span className="recipe-category">{item.recipe.category}</span>
                        {isFavorite(item.recipe) && (
                          <span className="recipe-favorite">Dein Favorit</span>
                        )}
                      </div>
                      <ImageAttribution
                        credit={item.recipe.imageCredit}
                        sourceUrl={item.recipe.imageSourceUrl}
                        license={item.recipe.imageLicense}
                        licenseUrl={item.recipe.imageLicenseUrl}
                      />

                      <div className="recipe-card-content">
                        <div className="recipe-card-day">{item.day} · {item.meal}</div>
                        <h2>{item.recipe.name}</h2>
                        <p>{item.recipe.description}</p>
                        {item.recipe.equipment?.length > 0 && (
                          <p className="recipe-card-equipment">
                            ♨ {item.recipe.equipment.join(", ")}
                          </p>
                        )}

                        <div className="recipe-card-bottom">
                          <span>◷ {item.recipe.time} Min.</span>
                          <button
                            type="button"
                            onClick={() => setSelectedRecipe(item.recipe)}
                          >
                            Rezept ansehen →
                          </button>
                        </div>
                        <div className="recipe-card-actions">
                          <button
                            type="button"
                            className="recipe-favorite-button"
                            onClick={() => toggleSavedRecipe(item.recipe)}
                            disabled={savingFavoriteId === item.recipe.id}
                          >
                            {isFavorite(item.recipe) ? "♥ Favorit" : "♡ Favorit"}
                          </button>
                          <button
                            type="button"
                            className="recipe-add-shopping-button"
                            onClick={() => addRecipeToShoppingList(item.recipe)}
                            disabled={addingRecipeId === item.recipe.id}
                          >
                            {addingRecipeId === item.recipe.id
                              ? "Wird hinzugefügt ..."
                              : "🛒 Zutaten"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="recipe-disclaimer">
        KI-Vorschläge können Fehler enthalten. Preise und Filialverfügbarkeit
        werden nicht live geprüft. Bei Allergien bitte Zutaten und Verpackungshinweise
        selbst prüfen; eine KI-Filterung garantiert keine Allergiesicherheit.
      </div>
    </section>
  );
}
