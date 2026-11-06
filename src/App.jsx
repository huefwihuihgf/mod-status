
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";
import Friends from "./Friends";
import LidlProducts from "./LidlProducts";
import RecipeResults from "./RecipeResults";
import RecipeGeneration from "./RecipeGeneration";
import { ImageAttribution, RecipeImage } from "./RecipeImage";
import Messages from "./Messages";
import {
  getUiSoundsEnabled,
  getUiSoundVolume,
  getUiMusicVolume,
  playUiSound,
  saveUiMusicVolume,
  setUiMusicVolume,
  setUiSoundVolume,
  setUiSoundsEnabled,
  startUiMusic,
  stopUiMusic,
} from "./uiSounds";

const navigation = [
  { id: "home", icon: "⌂", label: "Home" },
  { id: "friends", icon: "♧", label: "Freunde" },
  { id: "plan", icon: "▦", label: "Planen" },
  { id: "lists", icon: "☷", label: "Einkaufslisten" },
  { id: "messages", icon: "✉", label: "Nachrichten" },
  { id: "settings", icon: "⚙", label: "Einstellungen" },
];

const foods = [
  { name: "Chicken Nuggets", image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500" },
  { name: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500" },
  { name: "Lasagne", image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500" },
  { name: "Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
  { name: "Schnitzel", image: "https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=500" },
  { name: "Pommes", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500" },
  { name: "Nudeln", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500" },
  { name: "Pfannkuchen", image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500" },
  { name: "Fisch", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500" },
  { name: "Salat", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500" },
  { name: "Reisgerichte", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500" },
  { name: "Suppe", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500" },
  { name: "Tomaten", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=500" },
  { name: "Pilze", image: "https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=500" },
  { name: "Brokkoli", image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500" },
  { name: "Paprika", image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500" },
  { name: "Zwiebeln", image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=500" },
  { name: "Karotten", image: "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=500" },
];

const cardStyle = {
  border: "1px solid #eee",
  borderRadius: 14,
  overflow: "hidden",
  background: "#fff",
  cursor: "pointer",
  padding: 0,
  textAlign: "left",
  position: "relative",
};

function normalizeShoppingText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("de-DE");
}

function FoodSelection({ selected, onToggle }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))",
      gap: 13,
    }}>
      {foods.map((food) => {
        const active = selected.includes(food.name);

        return (
          <button
            type="button"
            key={food.name}
            onClick={() => onToggle(food.name)}
            style={{
              ...cardStyle,
              border: active ? "2px solid #f28a35" : "1px solid #eee",
              boxShadow: active ? "0 3px 12px #f28a3530" : "none",
            }}
          >
            <img
              src={food.image}
              alt={food.name}
              loading="lazy"
              style={{
                width: "100%",
                height: 105,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div style={{
              padding: "11px 9px",
              fontSize: 13,
              fontWeight: 650,
              color: "#333",
            }}>
              {food.name}
            </div>
            {active && (
              <span style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 25,
                height: 25,
                borderRadius: "50%",
                background: "#f28a35",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}>
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [showTasteProfile, setShowTasteProfile] = useState(false);

  const [activePage, setActivePage] = useState("home");
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uiSoundsEnabled, setUiSoundsEnabledState] = useState(getUiSoundsEnabled);
  const [uiSoundVolume, setUiSoundVolumeState] = useState(getUiSoundVolume);
  const [uiMusicVolume, setUiMusicVolumeState] = useState(getUiMusicVolume);
  const [uiMusicEnabled, setUiMusicEnabledState] = useState(false);
  const [musicNotice, setMusicNotice] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarNotice, setAvatarNotice] = useState("");

  const [newItem, setNewItem] = useState("");
  const [items, setItems] = useState([]);
  const [savedShoppingRecipes, setSavedShoppingRecipes] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [listSaving, setListSaving] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [savedRecipesOpen, setSavedRecipesOpen] = useState(false);
  const [openRecipeInstructions, setOpenRecipeInstructions] = useState([]);
  const [listError, setListError] = useState("");
  const [listMessage, setListMessage] = useState("");

  const [tasteStep, setTasteStep] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [recipeFeedback, setRecipeFeedback] = useState({ likes: [], dislikes: [] });
  const [savingTaste, setSavingTaste] = useState(false);
  const [tasteError, setTasteError] = useState("");
  const [avatarPath, setAvatarPath] = useState(null);
const [avatarUrl, setAvatarUrl] = useState(null);
const [avatarFile, setAvatarFile] = useState(null);

  // Planungsassistent
  const [planStep, setPlanStep] = useState(0);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [planFinished, setPlanFinished] = useState(false);
  const [recipeSearchMode, setRecipeSearchMode] = useState(false);
  const [recipeSearchPlan, setRecipeSearchPlan] = useState(null);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");
  const [recipeSearchServings, setRecipeSearchServings] = useState(2);
  const [recipeSearchBudget, setRecipeSearchBudget] = useState(15);
  const [recipeSearchLoading, setRecipeSearchLoading] = useState(false);
  const [recipeSearchError, setRecipeSearchError] = useState("");
  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [recipeGenerationLoading, setRecipeGenerationLoading] = useState(false);
  const [recipeGenerationError, setRecipeGenerationError] = useState("");
  const [refreshingDay, setRefreshingDay] = useState("");
  const [seenRecipeNamesByDay, setSeenRecipeNamesByDay] = useState({});
  const [recipeStoreNotice, setRecipeStoreNotice] = useState("");
  const [planFriends, setPlanFriends] = useState([]);
  const [planFriendsLoading, setPlanFriendsLoading] = useState(false);

  const [planData, setPlanData] = useState({
    supermarket: "REWE",
    branch: "",
    adults: 2,
    children: 0,
    days: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"],
    meals: ["Abendessen"],
    budget: 100,
    friends: [],
    diet: [],
    allergies: [],
    appliances: ["Herd", "Backofen"],
    extras: [],
  });

  useEffect(() => {
    if (activePage === "plan" && !planFinished) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [planStep, activePage, planFinished]);

  useEffect(() => () => stopUiMusic(), []);

  function updatePlan(key, value) {
    setPlanData((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function playSound(type) {
    playUiSound(type, uiSoundsEnabled, uiSoundVolume);
  }

  function toggleUiSounds() {
    const enabled = !uiSoundsEnabled;
    setUiSoundsEnabledState(enabled);
    setUiSoundsEnabled(enabled);
    if (enabled) playUiSound("success", true, uiSoundVolume);
  }

  function handleDashboardClick(event) {
    const button = event.target.closest("button, a, [role='button']");
    if (!button || button.disabled || button.dataset.noSound === "true") return;
    playSound("tap");
  }

  function toggleUiMusic() {
    if (uiMusicEnabled) {
      stopUiMusic();
      setUiMusicEnabledState(false);
      setMusicNotice("Hintergrundmusik ist ausgeschaltet.");
      return;
    }

    if (startUiMusic(uiMusicVolume)) {
      setUiMusicEnabledState(true);
      setMusicNotice("Hintergrundmusik läuft. Du kannst sie jederzeit wieder ausschalten.");
    } else {
      setMusicNotice("Dein Browser unterstützt die optionale Hintergrundmusik leider nicht.");
    }
  }

  function updateUiSoundVolume(value) {
    const volume = setUiSoundVolume(value);
    setUiSoundVolumeState(volume);
  }

  function updateUiMusicVolume(value) {
    const volume = saveUiMusicVolume(value);
    setUiMusicVolumeState(volume);
    setUiMusicVolume(volume);
  }

  async function saveAvatarChange() {
    if (!avatarFile || !user) return;
    setAvatarError("");
    setAvatarNotice("");

    const imageExtensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    if (!imageExtensions[avatarFile.type]) {
      setAvatarError("Bitte wähle ein JPEG-, PNG- oder WebP-Bild aus.");
      return;
    }
    if (avatarFile.size > 5 * 1024 * 1024) {
      setAvatarError("Das Profilbild darf höchstens 5 MB groß sein.");
      return;
    }

    setAvatarSaving(true);
    const extension = imageExtensions[avatarFile.type];
    const newPath = `${user.id}/avatar-${Date.now()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(newPath, avatarFile, {
          upsert: false,
          contentType: avatarFile.type,
        });
      if (uploadError) throw uploadError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_path: newPath })
        .eq("id", user.id);
      if (profileError) {
        const { error: cleanupError } = await supabase.storage
          .from("profile-images")
          .remove([newPath]);
        if (cleanupError) {
          console.error("Nicht verwendetes Profilbild konnte nicht entfernt werden:", cleanupError);
        }
        throw profileError;
      }

      const { data: imageData, error: signedUrlError } = await supabase.storage
        .from("profile-images")
        .createSignedUrl(newPath, 3600);
      setAvatarPath(newPath);
      setAvatarUrl(imageData?.signedUrl || null);
      setAvatarFile(null);
      if (signedUrlError) {
        setAvatarNotice("Profilbild gespeichert. Die Vorschau wird nach erneutem Laden angezeigt.");
      } else {
        setAvatarNotice("Dein Profilbild wurde aktualisiert.");
      }
    } catch (saveError) {
      setAvatarError(`Profilbild konnte nicht gespeichert werden: ${saveError.message}`);
    } finally {
      setAvatarSaving(false);
    }
  }

  function togglePlanOption(key, value) {
    setPlanData((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  async function requestRecipeSuggestions(day, excludedNames = [], searchRequest = null) {
    const requestPlan = searchRequest?.plan || planData;
    const selectedFriends = planFriends.filter((friend) =>
      requestPlan.friends.includes(friend.user_id)
    );
    const friendFavorites = selectedFriends.flatMap((friend) =>
      Array.isArray(friend.taste_profile?.favorites)
        ? friend.taste_profile.favorites
        : []
    );
    const friendDislikes = selectedFriends.flatMap((friend) =>
      Array.isArray(friend.taste_profile?.dislikes)
        ? friend.taste_profile.dislikes
        : []
    );
    const { data: storeProducts, error: productError } = await supabase
      .from("store_products")
      .select("product_name")
      .eq("store", requestPlan.supermarket)
      .limit(50);

    if (productError) {
      console.error("Produkt-Hinweise konnten nicht geladen werden:", productError);
      if (!searchRequest) {
        setRecipeStoreNotice(
          "Der Produktkatalog ist gerade nicht verfügbar. Die Rezeptideen berücksichtigen deshalb nur den ausgewählten Markt allgemein."
        );
      }
    } else if (storeProducts?.length) {
      if (!searchRequest) {
        setRecipeStoreNotice(
          `${storeProducts.length} gespeicherte Produktnamen wurden als Orientierung berücksichtigt. Das ist keine Prüfung von Preisen oder Filialbestand.`
        );
      }
    } else {
      if (!searchRequest) {
        setRecipeStoreNotice(
          `Für ${requestPlan.supermarket} liegen keine Produktnamen im Katalog vor. Der Markt dient nur als allgemeine Orientierung, nicht als Verfügbarkeitsnachweis.`
        );
      }
    }

    const { data, error } = await supabase.functions.invoke("generate-recipes", {
      body: {
        plan: {
          supermarket: requestPlan.supermarket,
          branch: requestPlan.branch,
          adults: Number(requestPlan.adults),
          children: Number(requestPlan.children),
          days: day ? [day] : requestPlan.days,
          meals: requestPlan.meals,
          budget: Number(requestPlan.budget),
          diet: requestPlan.diet,
          allergies: requestPlan.allergies,
          appliances: requestPlan.appliances,
          extras: requestPlan.extras,
          friendsCount: requestPlan.friends.length,
        },
        day,
        searchQuery: searchRequest?.query,
        taste: {
          favorites: [...new Set([...favorites, ...friendFavorites]
            .filter((value) => typeof value === "string")
            .map((value) => value.slice(0, 100)))].slice(0, 50),
          dislikes: [...new Set([...dislikes, ...friendDislikes]
            .filter((value) => typeof value === "string")
            .map((value) => value.slice(0, 100)))].slice(0, 50),
          recipeLikes: recipeFeedback.likes.slice(-50),
          recipeDislikes: recipeFeedback.dislikes.slice(-50),
        },
        storeProducts: (storeProducts || []).map((product) => product.product_name),
        excludedNames,
      },
    });

    if (error) {
      const errorResponse = error.context instanceof Response
        ? await error.context.clone().json().catch(() => null)
        : null;
      throw new Error(
        data?.error ||
          errorResponse?.error ||
          error.message ||
          "Die Rezeptideen konnten nicht erstellt werden."
      );
    }

    const recipesPerDay = Math.max(2, requestPlan.meals.length);
    const expectedCount = searchRequest
      ? 1
      : (day ? 1 : requestPlan.days.length) * recipesPerDay;
    if (!Array.isArray(data?.recipes) || data.recipes.length !== expectedCount) {
      throw new Error(searchRequest
        ? "Die KI hat kein passendes Rezept zurückgegeben. Bitte versuche es erneut."
        : "Die KI hat nicht die erwartete Anzahl an Rezepten für deine ausgewählten Mahlzeiten geliefert.");
    }

    return data.recipes;
  }

  async function finishPlanning() {
    setRecipeGenerationError("");
    setRecipeGenerationLoading(true);
    setSeenRecipeNamesByDay({});

    try {
      const suggestions = await requestRecipeSuggestions();
      setGeneratedRecipes(suggestions);
      setSeenRecipeNamesByDay(
        Object.fromEntries(
          planData.days.map((day) => [
            day,
            suggestions.filter((recipe) => recipe.day === day).map((recipe) => recipe.name),
          ])
        )
      );
      setPlanFinished(true);
    } catch (generationError) {
      console.error("KI-Rezeptvorschläge konnten nicht erstellt werden:", generationError);
      setRecipeGenerationError(generationError.message);
    } finally {
      setRecipeGenerationLoading(false);
    }
  }

  async function refreshRecipesForDay(day, currentNames) {
    if (refreshingDay) return;

    setRefreshingDay(day);
    setRecipeGenerationError("");

    const excludedNames = [
      ...new Set([
        ...(seenRecipeNamesByDay[day] || []),
        ...currentNames,
        ...generatedRecipes
          .filter((recipe) => recipe.day !== day)
          .map((recipe) => recipe.name),
      ]),
    ];

    try {
      const suggestions = await requestRecipeSuggestions(day, excludedNames);
      setGeneratedRecipes((current) => [
        ...current.filter((recipe) => recipe.day !== day),
        ...suggestions,
      ]);
      setSeenRecipeNamesByDay((current) => ({
        ...current,
        [day]: [...excludedNames, ...suggestions.map((recipe) => recipe.name)].slice(-60),
      }));
    } catch (generationError) {
      console.error(`Neue Rezeptideen für ${day} konnten nicht erstellt werden:`, generationError);
      setRecipeGenerationError(generationError.message);
    } finally {
      setRefreshingDay("");
    }
  }

  async function searchForRecipe(event) {
    event.preventDefault();
    const query = recipeSearchQuery.trim();
    if (query.length < 2) {
      setRecipeSearchError("Bitte gib mindestens zwei Zeichen für dein Gericht ein.");
      return;
    }

    const servings = Number(recipeSearchServings);
    const budget = Number(recipeSearchBudget);
    if (!Number.isInteger(servings) || servings < 1 || servings > 30) {
      setRecipeSearchError("Bitte gib eine Personenzahl zwischen 1 und 30 ein.");
      return;
    }
    if (!Number.isFinite(budget) || budget <= 0 || budget > 10000) {
      setRecipeSearchError("Bitte gib ein gültiges Budget ein.");
      return;
    }

    const searchPlan = {
      ...planData,
      adults: servings,
      children: 0,
      friends: [],
      days: ["Montag"],
      meals: ["Frühstück", "Mittagessen", "Abendessen"],
      budget,
    };

    setRecipeSearchError("");
    setRecipeSearchLoading(true);
    setRecipeGenerationError("");
    try {
      const suggestions = await requestRecipeSuggestions(undefined, [], {
        query,
        plan: searchPlan,
      });
      setRecipeSearchPlan(searchPlan);
      setGeneratedRecipes(suggestions);
      setPlanFinished(true);
    } catch (generationError) {
      console.error("Rezeptsuche konnte nicht ausgeführt werden:", generationError);
      setRecipeSearchError(generationError.message || "Das Rezept konnte nicht gefunden werden.");
    } finally {
      setRecipeSearchLoading(false);
    }
  }

async function startPlanning() {
  setActivePage("plan");
  setRecipeSearchMode(false);
  setRecipeSearchPlan(null);
  setPlanFinished(false);
  setPlanningLoading(true);
  setPlanFriendsLoading(true);

  try {
    const friendsResult = await supabase.rpc("get_my_friends");

    if (!friendsResult.error) {
      setPlanFriends(friendsResult.data || []);
    } else {
      console.error("Freunde konnten nicht geladen werden:", friendsResult.error);
      setPlanFriends([]);
    }
  } catch (err) {
    console.error("Planung konnte nicht vorbereitet werden:", err);
    setPlanFriends([]);
  } finally {
    setPlanFriendsLoading(false);
    setPlanningLoading(false);
  }
}


  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadShoppingItems() {
      if (!user) {
        setItems([]);
        setSavedShoppingRecipes([]);
        setItemsLoading(false);
        setListError("");
        return;
      }

      setItemsLoading(true);
      setListError("");

      try {
        const { data, error } = await supabase
          .from("shopping_list_items")
          .select("id, item_key, name, amount, unit, done, source")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (!active) return;
        if (error) throw error;

        setItems(data || []);

        const { data: recipes, error: recipesError } = await supabase
          .from("shopping_list_recipes")
          .select("id, recipe_key, name, description, image_url, image_credit, image_source_url, image_license, image_license_url, servings, instructions, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (recipesError) throw recipesError;

        if (!recipes?.length) {
          setSavedShoppingRecipes([]);
          return;
        }

        const { data: ingredients, error: ingredientsError } = await supabase
          .from("shopping_list_recipe_ingredients")
          .select("id, recipe_id, name, amount, unit, done, position")
          .eq("user_id", user.id)
          .order("position", { ascending: true });

        if (ingredientsError) throw ingredientsError;

        setSavedShoppingRecipes(
          recipes.map((recipe) => ({
            ...recipe,
            instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
            ingredients: (ingredients || []).filter(
              (ingredient) => ingredient.recipe_id === recipe.id
            ),
          }))
        );
      } catch (err) {
        if (!active) return;
        setListError(`Einkaufsliste oder gespeicherte Rezepte konnten nicht geladen werden: ${err.message}`);
      } finally {
        if (active) setItemsLoading(false);
      }
    }

    loadShoppingItems();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadTasteProfile() {
      if (!user) {
        setShowTasteProfile(false);
        setProfileLoading(false);
        setSavedRecipes([]);
        setRecipeFeedback({ likes: [], dislikes: [] });
        return;
      }

      setProfileLoading(true);
      setProfileError("");

      const { data, error } = await supabase
        .from("profiles")
        .select("taste_profile, taste_profile_completed, avatar_path")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (error) {
        setProfileError(error.message);
        setProfileLoading(false);
        return;
      }

      const profile = data?.taste_profile || {};

      setFavorites(profile.favorites || []);
      setSavedRecipes(profile.saved_recipes || []);
      setDislikes(profile.dislikes || []);
      setRecipeFeedback({
        likes: Array.isArray(profile.recipe_feedback?.likes)
          ? profile.recipe_feedback.likes.filter((name) => typeof name === "string").slice(-50)
          : [],
        dislikes: Array.isArray(profile.recipe_feedback?.dislikes)
          ? profile.recipe_feedback.dislikes.filter((name) => typeof name === "string").slice(-50)
          : [],
      });

      setAvatarPath(data?.avatar_path || null);

if (data?.avatar_path) {
  const { data: imageData } = await supabase.storage
    .from("profile-images")
    .createSignedUrl(data.avatar_path, 3600);

  setAvatarUrl(imageData?.signedUrl || null);
}

setShowTasteProfile(
  data?.taste_profile_completed !== true || !data?.avatar_path
);
      setProfileLoading(false);
    }

    loadTasteProfile();

    return () => {
      active = false;
    };
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (mode === "register") {
        if (username.trim().length < 3) {
          throw new Error("Dein Benutzername muss mindestens 3 Zeichen haben.");
        }

        if (password.length < 6) {
          throw new Error("Dein Passwort muss mindestens 6 Zeichen haben.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: username.trim() },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Dein Konto wurde erfolgreich erstellt!");
        } else {
          setMessage("Bitte prüfe deine E-Mails und bestätige deine Anmeldung.");
        }
        playSound("success");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        setMessage("Du bist erfolgreich angemeldet!");
        playSound("success");
      }
    } catch (err) {
      setError(err.message || "Es ist ein Fehler aufgetreten.");
      playSound("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError("Abmelden fehlgeschlagen: " + error.message);
    } else {
      stopUiMusic();
      setUiMusicEnabledState(false);
      setActivePage("home");
      setMode("login");
      setPassword("");
      setMessage("");
      setError("");
    }
  }

  async function deleteAccount() {
  const confirmation = window.confirm(
    "Möchtest du dein gesamtes EssenPlan-Konto wirklich dauerhaft löschen? Dein Profil, deine Freundschaften und deine gespeicherten Daten gehen verloren."
  );

  if (!confirmation) return;

  const secondConfirmation = window.confirm(
    "Bist du dir ganz sicher? Diese Aktion kann nicht rückgängig gemacht werden."
  );

  if (!secondConfirmation) return;

  setError("");

  try {
    // Profilbilder aus dem privaten Speicher entfernen
    const { data: files, error: listError } = await supabase.storage
      .from("profile-images")
      .list(user.id);

    if (listError) throw listError;

    if (files?.length) {
      const paths = files.map((file) => `${user.id}/${file.name}`);

      const { error: removeError } = await supabase.storage
        .from("profile-images")
        .remove(paths);

      if (removeError) throw removeError;
    }

    // Benutzerkonto serverseitig löschen
    const { error: deleteError } = await supabase.rpc("delete_my_account");

    if (deleteError) throw deleteError;

    // Lokale Anmeldung beenden
    await supabase.auth.signOut({ scope: "local" });

    setUser(null);
    setAvatarUrl(null);
    setAvatarPath(null);
    setAvatarFile(null);
    setFavorites([]);
    setSavedRecipes([]);
    setDislikes([]);
    setItems([]);
    setEmail("");
    setPassword("");
    setUsername("");
    setActivePage("home");
    setMode("register");
  } catch (err) {
    setError("Konto konnte nicht gelöscht werden: " + err.message);
  }
}

  function toggleFood(list, setList, name) {
    setList((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  async function saveTasteProfile() {
  setTasteError("");

  if (!avatarFile && !avatarPath) {
    setTasteError("Bitte wähle zuerst ein Profilbild aus.");
    return;
  }

  setSavingTaste(true);

  let finalAvatarPath = avatarPath;

  try {
    if (avatarFile) {
      const extension = avatarFile.name.split(".").pop().toLowerCase();
      const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, avatarFile, {
          upsert: false,
          contentType: avatarFile.type,
        });

      if (uploadError) throw uploadError;

      finalAvatarPath = filePath;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        taste_profile: {
          favorites,
          saved_recipes: savedRecipes,
          dislikes,
          recipe_feedback: recipeFeedback,
          updated_at: new Date().toISOString(),
        },
        taste_profile_completed: true,
        avatar_path: finalAvatarPath,
      })
      .eq("id", user.id);

    if (error) throw error;

    setAvatarPath(finalAvatarPath);

    const { data: imageData } = await supabase.storage
      .from("profile-images")
      .createSignedUrl(finalAvatarPath, 3600);

    setAvatarUrl(imageData?.signedUrl || null);
    setAvatarFile(null);
    setShowTasteProfile(false);
    setTasteStep(0);
    setActivePage("home");
  } catch (err) {
    setTasteError("Speichern fehlgeschlagen: " + err.message);
  } finally {
    setSavingTaste(false);
  }
}

  async function addItem(event) {
    event.preventDefault();
    const name = newItem.trim();
    if (!name || !user) return;

    setListError("");
    setListMessage("");

    try {
      const { data, error } = await supabase
        .from("shopping_list_items")
        .upsert(
          {
            user_id: user.id,
            item_key: normalizeShoppingText(name),
            name,
            done: false,
            source: "manual",
          },
          { onConflict: "user_id,item_key,source" }
        )
        .select("id, item_key, name, amount, unit, done, source")
        .single();

      if (error) throw error;

      setItems((current) => {
        const existingIndex = current.findIndex((item) => item.id === data.id);
        if (existingIndex < 0) return [...current, data];
        return current.map((item) => (item.id === data.id ? data : item));
      });
      setNewItem("");
      playSound("success");
    } catch (err) {
      setListError(`Artikel konnte nicht gespeichert werden: ${err.message}`);
      playSound("error");
    }
  }

  async function toggleItem(item) {
    setListError("");
    setListMessage("");
    setUpdatingItemId(item.id);

    try {
      const { data, error } = await supabase
        .from("shopping_list_items")
        .update({ done: !item.done })
        .eq("id", item.id)
        .eq("user_id", user.id)
        .select("id, item_key, name, amount, unit, done, source")
        .single();

      if (error) throw error;
      setItems((current) =>
        current.map((currentItem) => (currentItem.id === item.id ? data : currentItem))
      );
      playSound(data.done ? "success" : "tap");
    } catch (err) {
      setListError(`Artikelstatus konnte nicht gespeichert werden: ${err.message}`);
      playSound("error");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function deleteItem(id) {
    setListError("");
    setListMessage("");
    setUpdatingItemId(id);

    try {
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setItems((current) => current.filter((item) => item.id !== id));
      playSound("tap");
    } catch (err) {
      setListError(`Artikel konnte nicht gelöscht werden: ${err.message}`);
      playSound("error");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function saveRecipeShoppingList(ingredients) {
    if (!user || ingredients.length === 0) return;

    setListError("");
    setListMessage("");
    setListSaving(true);

    try {
      const { data, error } = await supabase.rpc(
        "replace_recipe_shopping_items",
        {
          p_items: ingredients.map((ingredient) => ({
            item_key: `${normalizeShoppingText(ingredient.name)}|${normalizeShoppingText(ingredient.unit)}`,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
          })),
        }
      );

      if (error) throw error;
      if (!data || data.length !== ingredients.length) {
        throw new Error("Supabase hat nicht alle Rezeptzutaten zurückgegeben.");
      }

      setItems((current) => [
        ...current.filter((item) => item.source !== "recipe"),
        ...(data || []),
      ]);
      setPlanFinished(false);
      setActivePage("lists");
      setListMessage(
        `Deine Einkaufsliste mit ${ingredients.length} zusammengefassten Zutaten wurde gespeichert.`
      );
      playSound("success");
    } catch (err) {
      setListError(`Einkaufsliste konnte nicht gespeichert werden: ${err.message}`);
      playSound("error");
    } finally {
      setListSaving(false);
    }
  }

  async function addRecipeToShoppingList(recipe, ingredients) {
    if (!user || ingredients.length === 0) {
      throw new Error("Zum Hinzufügen ist eine Anmeldung erforderlich.");
    }

    setListError("");

    const { data, error } = await supabase.rpc("save_shopping_list_recipe", {
      p_recipe: {
        recipe_key: normalizeShoppingText(recipe.name),
        name: recipe.name,
        description: recipe.description,
        image_url: recipe.image,
        image_credit: recipe.imageCredit || "",
        image_source_url: recipe.imageSourceUrl || "",
        image_license: recipe.imageLicense || "",
        image_license_url: recipe.imageLicenseUrl || "",
        servings: Math.max(
          1,
          Number(recipe.servings) ||
            Number(planData.adults || 0) +
              Number(planData.children || 0) +
              (planData.friends || []).length
        ),
        instructions: recipe.instructions,
        ingredients: ingredients.map((ingredient) => ({
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
        })),
      },
    });

    if (error) throw new Error(`Zutaten konnten nicht gespeichert werden: ${error.message}`);
    if (!data) throw new Error("Supabase hat das gespeicherte Rezept nicht bestätigt.");

    const { data: recipeRecord, error: recipeError } = await supabase
      .from("shopping_list_recipes")
      .select("id, recipe_key, name, description, image_url, image_credit, image_source_url, image_license, image_license_url, servings, instructions, created_at")
      .eq("id", data)
      .eq("user_id", user.id)
      .single();

    if (recipeError) throw new Error(`Gespeichertes Rezept konnte nicht geladen werden: ${recipeError.message}`);

    const { data: ingredientRecords, error: ingredientError } = await supabase
      .from("shopping_list_recipe_ingredients")
      .select("id, recipe_id, name, amount, unit, done, position")
      .eq("recipe_id", data)
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    if (ingredientError) throw new Error(`Rezeptzutaten konnten nicht geladen werden: ${ingredientError.message}`);
    if (!ingredientRecords || ingredientRecords.length !== ingredients.length) {
      throw new Error("Supabase hat nicht alle Rezeptzutaten gespeichert.");
    }

    setSavedShoppingRecipes((current) => [
      { ...recipeRecord, ingredients: ingredientRecords },
      ...current.filter((savedRecipe) => savedRecipe.id !== recipeRecord.id),
    ]);
    setSavedRecipesOpen(true);
    setListMessage(`${recipe.name} wurde bei deinen gespeicherten Rezepten abgelegt.`);
    playSound("success");
    setPlanFinished(false);
    setActivePage("lists");
  }

  async function toggleRecipeIngredient(ingredient) {
    setListError("");
    setUpdatingItemId(ingredient.id);

    try {
      const { data, error } = await supabase
        .from("shopping_list_recipe_ingredients")
        .update({ done: !ingredient.done })
        .eq("id", ingredient.id)
        .eq("user_id", user.id)
        .select("id, recipe_id, name, amount, unit, done, position")
        .single();

      if (error) throw error;
      setSavedShoppingRecipes((current) =>
        current.map((recipe) => ({
          ...recipe,
          ingredients: recipe.ingredients.map((item) =>
            item.id === ingredient.id ? data : item
          ),
        }))
      );
      playSound(data.done ? "success" : "tap");
    } catch (err) {
      setListError(`Zutat konnte nicht abgehakt werden: ${err.message}`);
      playSound("error");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function deleteSavedShoppingRecipe(recipeId) {
    setListError("");
    setUpdatingItemId(recipeId);

    try {
      const { error } = await supabase
        .from("shopping_list_recipes")
        .delete()
        .eq("id", recipeId)
        .eq("user_id", user.id);

      if (error) throw error;
      setSavedShoppingRecipes((current) =>
        current.filter((recipe) => recipe.id !== recipeId)
      );
      setOpenRecipeInstructions((current) =>
        current.filter((id) => id !== recipeId)
      );
      playSound("tap");
    } catch (err) {
      setListError(`Rezept konnte nicht gelöscht werden: ${err.message}`);
      playSound("error");
    } finally {
      setUpdatingItemId(null);
    }
  }

  function toggleRecipeInstructions(recipeId) {
    setOpenRecipeInstructions((current) =>
      current.includes(recipeId)
        ? current.filter((id) => id !== recipeId)
        : [...current, recipeId]
    );
  }

  async function toggleSavedRecipe(recipeName) {
    if (!user) throw new Error("Zum Speichern eines Favoriten ist eine Anmeldung erforderlich.");

    const recipeKey = normalizeShoppingText(recipeName);
    const wasSaved = savedRecipes.some(
      (savedRecipe) => normalizeShoppingText(savedRecipe) === recipeKey
    );
    const updatedRecipes = wasSaved
      ? savedRecipes.filter((savedRecipe) => normalizeShoppingText(savedRecipe) !== recipeKey)
      : [...savedRecipes, recipeName];

    const { error } = await supabase
      .from("profiles")
      .update({
        taste_profile: {
          favorites,
          saved_recipes: updatedRecipes,
          dislikes,
          recipe_feedback: recipeFeedback,
          updated_at: new Date().toISOString(),
        },
      })
      .eq("id", user.id)
      .select("id")
      .single();

    if (error) throw new Error(`Favorit konnte nicht gespeichert werden: ${error.message}`);

    setSavedRecipes(updatedRecipes);
    playSound(wasSaved ? "tap" : "success");
  }

  async function saveRecipeFeedback(recipeName, rating) {
    if (!user) throw new Error("Zum Bewerten eines Rezepts musst du angemeldet sein.");
    if (!["like", "dislike"].includes(rating)) {
      throw new Error("Diese Rezeptbewertung ist ungültig.");
    }

    const recipeKey = normalizeShoppingText(recipeName);
    const currentRating = recipeFeedback.likes.some(
      (name) => normalizeShoppingText(name) === recipeKey
    )
      ? "like"
      : recipeFeedback.dislikes.some(
          (name) => normalizeShoppingText(name) === recipeKey
        )
        ? "dislike"
        : "";
    const nextRating = currentRating === rating ? "" : rating;
    const nextFeedback = {
      likes: recipeFeedback.likes.filter(
        (name) => normalizeShoppingText(name) !== recipeKey
      ),
      dislikes: recipeFeedback.dislikes.filter(
        (name) => normalizeShoppingText(name) !== recipeKey
      ),
    };

    if (nextRating === "like") nextFeedback.likes.push(recipeName.slice(0, 120));
    if (nextRating === "dislike") nextFeedback.dislikes.push(recipeName.slice(0, 120));
    nextFeedback.likes = [...new Set(nextFeedback.likes)].slice(-50);
    nextFeedback.dislikes = [...new Set(nextFeedback.dislikes)].slice(-50);

    const { error } = await supabase
      .from("profiles")
      .update({
        taste_profile: {
          favorites,
          saved_recipes: savedRecipes,
          dislikes,
          recipe_feedback: nextFeedback,
          updated_at: new Date().toISOString(),
        },
      })
      .eq("id", user.id)
      .select("id")
      .single();

    if (error) throw new Error(`Rezeptbewertung konnte nicht gespeichert werden: ${error.message}`);
    setRecipeFeedback(nextFeedback);
    playSound(nextRating === "like" ? "like" : nextRating === "dislike" ? "dislike" : "tap");
  }

  const displayName =
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "Gast";

  const firstName = displayName.split(/[ _.-]/)[0];

  if (loading || profileLoading || submitting) {
    const loadingTitle = loading
      ? "EssenPlan startet"
      : profileLoading || user
        ? "Dein EssenPlan wird vorbereitet"
        : mode === "register"
          ? "Dein Konto wird eingerichtet"
          : "Du wirst angemeldet";

    return (
      <main className="loading-screen auth-loading-screen" aria-live="polite" aria-busy="true">
        <div className="auth-loading-orbit" aria-hidden="true">
          <span className="auth-loading-fruit">🍊</span>
          <span className="auth-loading-dot auth-loading-dot-one" />
          <span className="auth-loading-dot auth-loading-dot-two" />
          <span className="auth-loading-dot auth-loading-dot-three" />
        </div>
        <span className="small-eyebrow">ESSENPLAN</span>
        <h1>{loadingTitle}</h1>
        <p>
          {loading
            ? "Einen kleinen Moment, wir laden alles für dich."
            : profileLoading || user
              ? "Wir laden dein Profil und deine persönlichen Angaben."
              : "Einen kleinen Moment, wir verbinden dich mit deinem Konto."}
        </p>
        <div className="auth-loading-progress" role="presentation"><span /></div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <div className="auth-layout">
          <aside className="auth-showcase">
            <div className="auth-showcase-top">
              <span className="auth-logo">🍊</span>
              <span className="auth-brand">ESSEN<span>PLAN</span></span>
            </div>
            <div className="auth-showcase-copy">
              <span className="auth-showcase-eyebrow">GUT ESSEN. BESSER PLANEN.</span>
              <h2>Deine Woche schmeckt nach Lieblingsessen.</h2>
              <p>Entdecke passende Rezepte, plane gemeinsam und behalte deinen Einkauf entspannt im Blick.</p>
            </div>
            <div className="auth-showcase-note">
              <span aria-hidden="true">✦</span>
              <div><strong>Dein Geschmack zählt</strong><small>Rezepte passend zu deinen Vorlieben</small></div>
            </div>
            <span className="auth-showcase-decoration" aria-hidden="true">🥕</span>
          </aside>

          <section className="auth-card">
            <span className="small-eyebrow">
              {mode === "login" ? "WILLKOMMEN ZURÜCK" : "DEIN NEUER ESSENPLAN"}
            </span>
            <h1>
              {mode === "login" ? "Schön, dass du da bist!" : "Erstelle dein Konto"}
            </h1>
            <p className="auth-description">
              {mode === "login"
                ? "Melde dich an und plane deine nächsten Lieblingsgerichte."
                : "Registriere dich und entdecke deine persönliche Rezeptwelt."}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === "register" && (
                <label>
                  Benutzername
                  <input
                    type="text"
                    placeholder="Dein Benutzername"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    minLength={3}
                    autoComplete="username"
                  />
                </label>
              )}
              <label>
                E-Mail-Adresse
                <input
                  type="email"
                  placeholder="name@beispiel.de"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Passwort
                <input
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </label>
              {error && <div className="auth-error" role="alert">{error}</div>}
              {message && <div className="auth-success" role="status">{message}</div>}
              <button className="primary-button auth-submit" type="submit" disabled={submitting}>
                {submitting
                  ? "Einen Moment ..."
                  : mode === "login" ? "Anmelden" : "Konto erstellen"}
                {!submitting && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <div className="auth-switch">
              {mode === "login" ? (
                <>
                  Du hast noch kein Konto?
                  <button type="button" onClick={() => {
                    setMode("register");
                    setError("");
                    setMessage("");
                  }}>
                    Jetzt registrieren
                  </button>
                </>
              ) : (
                <>
                  Du hast bereits ein Konto?
                  <button type="button" onClick={() => {
                    setMode("login");
                    setError("");
                    setMessage("");
                  }}>
                    Jetzt anmelden
                  </button>
                </>
              )}
            </div>
            <p className="auth-footer">Gemeinsam planen. Lecker essen.</p>
          </section>
        </div>
      </main>
    );
  }

  if (profileError) {
    return (
      <main className="loading-screen">
        <h2>Profil konnte nicht geladen werden</h2>
        <p>{profileError}</p>
        <button className="primary-button" onClick={() => window.location.reload()}>
          Erneut versuchen
        </button>
      </main>
    );
  }

  // Persönliches Geschmacksprofil
  if (showTasteProfile) {
   const steps = [
  "Willkommen",
  "Lieblingsgerichte",
  "Mag ich nicht",
  "Profilbild",
  "Fertig"
];

    return (
      <main style={{
        minHeight: "100vh",
        background: "#faf8f5",
        padding: "30px 16px",
        boxSizing: "border-box",
      }}>
        <div style={{
          maxWidth: 850,
          margin: "0 auto",
          background: "white",
          borderRadius: 24,
          padding: "30px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.05)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 38 }}>🍊</div>
            <div style={{ fontWeight: 800, letterSpacing: 2 }}>
              ESSEN<span style={{ color: "#f28a35" }}>PLAN</span>
            </div>
            <p style={{ color: "#999", fontSize: 12, letterSpacing: 1 }}>
              DEIN PERSÖNLICHES GESCHMACKSPROFIL
            </p>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>
              {tasteStep === 0 && `Willkommen, ${firstName}!`}
              {tasteStep === 1 && "Was isst du besonders gerne?"}
              {tasteStep === 2 && "Was magst du überhaupt nicht?"}
              {tasteStep === 3 && "Dein Profil ist fertig!"}
            </h1>
            <p style={{ color: "#777", lineHeight: 1.6 }}>
              {tasteStep === 0 && "Wir möchten herausfinden, welche Gerichte dir schmecken. So können wir später bessere Rezeptvorschläge machen."}
              {tasteStep === 1 && "Wähle alle Gerichte aus, die du gerne isst. Klicke einfach auf die passenden Bilder."}
              {tasteStep === 2 && "Wähle Lebensmittel und Gerichte aus, die du nicht gerne isst."}
              {tasteStep === 3 && "Wir speichern deine Auswahl. Du kannst dein Profil später jederzeit ändern."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 7, marginBottom: 28 }}>
            {steps.map((step, index) => (
              <div key={step} style={{ flex: 1 }}>
                <div style={{
                  height: 5,
                  borderRadius: 10,
                  background: index <= tasteStep ? "#f28a35" : "#eee",
                  marginBottom: 7,
                }} />
                <div style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: index === tasteStep ? "#e77d29" : "#999",
                  fontWeight: index === tasteStep ? 700 : 400,
                }}>
                  {step}
                </div>
              </div>
            ))}
          </div>

          {tasteStep === 0 && (
            <div style={{
              background: "#fff7f0",
              padding: 22,
              borderRadius: 16,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 48 }}>🍕</div>
              <h2>Dein Geschmack zählt!</h2>
              <p style={{ color: "#777", lineHeight: 1.7 }}>
                Du wählst nur für dich selbst aus. Keine Familiengröße,
                keine anderen Personen und keine komplizierten Fragen.
              </p>
            </div>
          )}

          {tasteStep === 1 && (
            <>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 15,
                color: "#777",
                fontSize: 13,
              }}>
                <strong>Deine Lieblingsgerichte</strong>
                <span>{favorites.length} ausgewählt</span>
              </div>
              <FoodSelection
                selected={favorites}
                onToggle={(name) => toggleFood(favorites, setFavorites, name)}
              />
            </>
          )}

          {tasteStep === 2 && (
            <>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 15,
                color: "#777",
                fontSize: 13,
              }}>
                <strong>Das esse ich nicht gerne</strong>
                <span>{dislikes.length} ausgewählt</span>
              </div>
              <FoodSelection
                selected={dislikes}
                onToggle={(name) => toggleFood(dislikes, setDislikes, name)}
              />
            </>
          )}

          {tasteStep === 3 && (
  <div style={{ textAlign: "center", padding: "20px 0" }}>
    <h2>Dein persönliches Profilbild</h2>
    <p style={{ color: "#777", lineHeight: 1.6 }}>
      Wähle ein Bild von deinem Handy oder PC aus.
      Deine bestätigten Freunde können es später sehen.
    </p>

    <div style={{
      width: 150,
      height: 150,
      borderRadius: "50%",
      overflow: "hidden",
      background: "#fff0e3",
      margin: "25px auto",
      display: "grid",
      placeItems: "center",
      border: "4px solid #f28a35",
    }}>
      {avatarFile ? (
        <img
          src={URL.createObjectURL(avatarFile)}
          alt="Dein neues Profilbild"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Dein Profilbild"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <span style={{ fontSize: 55 }}>📷</span>
      )}
    </div>

    <label style={{
      display: "inline-block",
      background: "#fff1e5",
      color: "#d87527",
      padding: "14px 20px",
      borderRadius: 12,
      cursor: "pointer",
      fontWeight: 700,
    }}>
      📷 Bild auswählen
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (!file) return;

          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setTasteError("Bitte wähle ein JPG-, PNG- oder WebP-Bild.");
            return;
          }

          if (file.size > 5 * 1024 * 1024) {
            setTasteError("Das Bild darf höchstens 5 MB groß sein.");
            return;
          }

          setTasteError("");
          setAvatarFile(file);
        }}
      />
    </label>

    <p style={{ color: "#aaa", fontSize: 12, marginTop: 15 }}>
      JPG, PNG oder WebP · maximal 5 MB
    </p>
  </div>
)}

{tasteStep === 4 && (
  <div style={{ display: "grid", gap: 18 }}>
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 100,
        height: 100,
        borderRadius: "50%",
        overflow: "hidden",
        margin: "0 auto 12px",
        background: "#fff0e3",
      }}>
        {avatarFile ? (
          <img
            src={URL.createObjectURL(avatarFile)}
            alt="Profilbild"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profilbild"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </div>
      <strong>Dein Profil ist bereit!</strong>
    </div>

    <div style={{ background: "#f3fbf4", padding: 20, borderRadius: 16 }}>
      <h3>❤️ Das magst du</h3>
      <p style={{ color: "#666" }}>
        {favorites.length ? favorites.join(", ") : "Noch keine Auswahl."}
      </p>
    </div>

    <div style={{ background: "#fff4f1", padding: 20, borderRadius: 16 }}>
      <h3>🚫 Das magst du nicht</h3>
      <p style={{ color: "#666" }}>
        {dislikes.length ? dislikes.join(", ") : "Keine Abneigungen."}
      </p>
    </div>
  </div>
)}

          {tasteError && (
            <div style={{
              background: "#fff0ee",
              color: "#b94c40",
              padding: 12,
              borderRadius: 10,
              marginTop: 18,
            }}>
              {tasteError}
            </div>
          )}

          <div style={{
            display: "flex",
            gap: 10,
            marginTop: 28,
          }}>
            {tasteStep > 0 && (
              <button
                onClick={() => {
                  setTasteError("");
                  setTasteStep((step) => step - 1);
                }}
                style={{
                  flex: 1,
                  border: "1px solid #eee",
                  background: "white",
                  borderRadius: 12,
                  padding: 14,
                  cursor: "pointer",
                }}
              >
                Zurück
              </button>
            )}

            {tasteStep < 4 ? (
              <button
                className="primary-button"
                style={{ flex: 2 }}
                onClick={() => {
  setTasteError("");

  if (tasteStep === 3 && !avatarFile && !avatarPath) {
    setTasteError("Bitte wähle zuerst dein Profilbild aus.");
    return;
  }

  setTasteStep((step) => step + 1);
}}
              >
                Weiter →
              </button>
            ) : (
              <button
                className="primary-button"
                style={{ flex: 2 }}
                onClick={saveTasteProfile}
                disabled={savingTaste}
              >
                {savingTaste ? "Wird gespeichert ..." : "Profil speichern ✓"}
              </button>
            )}
          </div>

          <p style={{
            textAlign: "center",
            color: "#aaa",
            fontSize: 11,
            marginTop: 20,
          }}>
            Deine persönlichen Angaben werden in deinem Konto gespeichert.
          </p>
        </div>
      </main>
    );
  }

  function renderHome() {
    return (
      <>
        <section className="welcome-section">
          <div>
            <span className="small-eyebrow">DEIN ESSENPLAN</span>
            <h1>Hallo, {firstName}! 👋</h1>
            <p>Was möchtest du heute Leckeres essen?</p>
          </div>
          <div className="profile-avatar">
  {avatarUrl ? (
    <img
      src={avatarUrl}
      alt="Dein Profilbild"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "50%",
        display: "block",
      }}
    />
  ) : (
    firstName.charAt(0).toUpperCase()
  )}
</div>
        </section>

        <section className="hero-card">
          <div className="hero-copy">
            <span className="hero-label">DEINE ESSENSPLANUNG</span>
            <h2>Eine Woche voller leckerer Ideen.</h2>
            <p>Finde passende Rezepte und plane deine Einkäufe ganz einfach.</p>
            <button className="hero-button" onClick={startPlanning}>
              Jetzt planen <span>→</span>
            </button>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=900" alt="Nudelgericht" />
          </div>
        </section>

        <section className="section-heading">
          <div>
            <h2>Was möchtest du machen?</h2>
            <p>Deine wichtigsten Funktionen auf einen Blick.</p>
          </div>
        </section>

        <section className="quick-grid">
          <button className="quick-card" onClick={startPlanning}>
            <span className="quick-icon orange-icon">▦</span>
            <strong>Essensplan erstellen</strong>
            <small>Rezepte für deine Woche finden</small>
            <span className="quick-arrow">→</span>
          </button>
          <button className="quick-card" onClick={() => setActivePage("lists")}>
            <span className="quick-icon green-icon">☷</span>
            <strong>Einkaufsliste</strong>
            <small>Deine Einkäufe organisieren</small>
            <span className="quick-arrow">→</span>
          </button>
          <button className="quick-card" onClick={() => setActivePage("friends")}>
            <span className="quick-icon purple-icon">♧</span>
            <strong>Freunde einladen</strong>
            <small>Gemeinsam Listen teilen</small>
            <span className="quick-arrow">→</span>
          </button>
          <button className="quick-card" onClick={() => setActivePage("settings")}>
            <span className="quick-icon yellow-icon">⚙</span>
            <strong>Mein Konto</strong>
            <small>Deine persönlichen Einstellungen</small>
            <span className="quick-arrow">→</span>
          </button>
        </section>

        <section className="inspiration-section">
          <div className="section-heading">
            <div>
              <h2>Leckere Inspiration</h2>
              <p>Ein kleiner Vorgeschmack auf deine Rezeptwelt.</p>
            </div>
          </div>
          <div className="inspiration-grid">
            <article className="food-card">
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=700" alt="Pizza" />
              <div><strong>Pizza-Abend</strong><span>Eine Idee für die ganze Familie</span></div>
            </article>
            <article className="food-card">
              <img src="https://images.unsplash.com/photo-1547592180-85f173990554?w=700" alt="Salat" />
              <div><strong>Frisch & lecker</strong><span>Neue Ideen für deinen Speiseplan</span></div>
            </article>
          </div>
        </section>
      </>
    );
  }

  function renderFriends() {
  return <Friends userId={user.id} onPlaySound={playSound} />;
}

  function renderMessages() {
    return <Messages userId={user.id} />;
  }

    
function renderPlan() {
  const days = [
    "Montag", "Dienstag", "Mittwoch", "Donnerstag",
    "Freitag", "Samstag", "Sonntag",
  ];

  const supermarkets = [
    { name: "REWE", domain: "rewe.de", color: "#e52329" },
    { name: "EDEKA", domain: "edeka.de", color: "#0756a5" },
    { name: "Lidl", domain: "lidl.de", color: "#0050aa" },
    { name: "ALDI", domain: "aldi-sued.de", color: "#00529b" },
    { name: "Kaufland", domain: "kaufland.de", color: "#e32235" },
    { name: "Netto", domain: "netto-online.de", color: "#e5242b" },
    { name: "PENNY", domain: "penny.de", color: "#e32235" },
  ];

  const meals = [
    { name: "Frühstück", icon: "🥐", desc: "Gut in den Tag starten" },
    { name: "Mittagessen", icon: "🍲", desc: "Eine leckere Mittagspause" },
    { name: "Abendessen", icon: "🍝", desc: "Gemeinsam genießen" },
  ];

  const diets = [
    { name: "Keine besondere Ernährung", icon: "🍽️" },
    { name: "Vegetarisch", icon: "🥦" },
    { name: "Vegan", icon: "🌱" },
    { name: "Flexitarisch", icon: "🥗" },
    { name: "Halal", icon: "🍗" },
    { name: "Glutenfrei", icon: "🌾" },
    { name: "Laktosefrei", icon: "🥛" },
  ];

  const allergies = [
    { name: "Nüsse", icon: "🥜" },
    { name: "Erdnüsse", icon: "🥜" },
    { name: "Milch", icon: "🥛" },
    { name: "Eier", icon: "🥚" },
    { name: "Gluten", icon: "🌾" },
    { name: "Fisch", icon: "🐟" },
    { name: "Soja", icon: "🫘" },
    { name: "Sellerie", icon: "🥬" },
  ];

  const appliances = [
    { name: "Herd", icon: "🍳", desc: "Kochen auf dem Herd" },
    { name: "Backofen", icon: "♨️", desc: "Backen und Aufläufe" },
    { name: "Mikrowelle", icon: "📡", desc: "Schnell erwärmen" },
    { name: "Airfryer", icon: "🍟", desc: "Knusprig zubereiten" },
    { name: "Grill", icon: "🔥", desc: "Grillen" },
    { name: "Küchenmaschine", icon: "🥣", desc: "Mixen und Kneten" },
  ];

  const extras = [
    { name: "Schnelle Gerichte", icon: "⚡" },
    { name: "Wenig Abwasch", icon: "🫧" },
    { name: "Günstige Rezepte", icon: "💶" },
    { name: "Reste verwerten", icon: "♻️" },
    { name: "Einfache Zubereitung", icon: "👨‍🍳" },
    { name: "Neue Gerichte ausprobieren", icon: "✨" },
  ];

  const titles = [
    "Wo kaufst du ein?",
    "Für wen kochen wir?",
    "Wie sieht deine Woche aus?",
    "Was schmeckt euch?",
    "Was müssen wir beachten?",
    "Was gibt es in deiner Küche?",
  ];

  const descriptions = [
    "Wähle deinen Lieblingssupermarkt und deine bevorzugte Filiale.",
    "Stelle ein, für wie viele Personen wir planen sollen.",
    "Wähle deine Wochentage, Mahlzeiten und dein Budget.",
    "Wir berücksichtigen deine Vorlieben und die deiner Freunde.",
    "Ernährungsweisen und Allergien werden bei der Planung berücksichtigt.",
    "Wähle deine Geräte und zusätzlichen Wünsche.",
  ];

  const toggle = (key, value) => togglePlanOption(key, value);

  const sectionTitle = (title, subtitle) => (
    <div className="plan-section-title">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );

  const counter = (label, icon, value, key, description) => (
    <div className="plan-counter">
      <div className="plan-counter-info">
        <span className="plan-counter-icon">{icon}</span>
        <div>
          <strong>{label}</strong>
          <small>{description}</small>
        </div>
      </div>

      <div className="plan-counter-controls">
        <button
          type="button"
          onClick={() =>
            updatePlan(
              key,
              Math.max(key === "adults" ? 1 : 0, value - 1)
            )
          }
        >
          −
        </button>

        <strong>{value}</strong>

        <button
          type="button"
          onClick={() => updatePlan(key, Math.min(20, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );

  if (planningLoading) {
    return (
      <div className="plan-loading">
        <div className="plan-loading-content">
          <div className="plan-loading-orbit">
            <div className="plan-loading-circle">🍊</div>
          </div>

          <span className="small-eyebrow">ESSENPLAN</span>
          <h1>Deine Woche wird lecker!</h1>
          <p>
            Wir bereiten deine persönliche Essensplanung vor.
          </p>

          <div className="plan-loading-bar">
            <span />
          </div>

          <div className="plan-loading-tips">
            <span>🥗</span>
            <span>🍝</span>
            <span>🍕</span>
            <span>🥦</span>
            <span>🍓</span>
          </div>
        </div>
      </div>
    );
  }

  if (recipeGenerationLoading && !planFinished) {
    return <RecipeGeneration />;
  }

  if (recipeGenerationError && !planFinished) {
    return (
      <RecipeGeneration
        error={recipeGenerationError}
        onRetry={finishPlanning}
        retrying={recipeGenerationLoading}
      />
    );
  }

  if (planFinished) {
    return (
      <RecipeResults
        planData={recipeSearchMode ? recipeSearchPlan || planData : planData}
        recipes={generatedRecipes}
        savedRecipes={savedRecipes}
        recipeFeedback={recipeFeedback}
        onRecipeFeedback={saveRecipeFeedback}
        onPlaySound={playSound}
        singleRecipeSearch={recipeSearchMode}
        onRefresh={recipeSearchMode ? undefined : refreshRecipesForDay}
        onSaveShoppingList={saveRecipeShoppingList}
        onAddRecipeToShoppingList={addRecipeToShoppingList}
        onToggleSavedRecipe={toggleSavedRecipe}
        savingShoppingList={listSaving}
        shoppingListError={listError}
        recipeGenerationError={recipeGenerationError}
        refreshingDay={refreshingDay}
        storeCatalogNotice={recipeStoreNotice}
        onEdit={() => {
          setPlanFinished(false);
          if (!recipeSearchMode) setPlanStep(0);
        }}
      />
    );
  }

  if (recipeSearchMode) {
    if (recipeSearchLoading) {
      return (
        <RecipeGeneration
          title="Dein Wunschrezept wird gesucht"
          loadingMessage={`Gemini sucht nach „${recipeSearchQuery.trim()}“ und passt das Rezept an deine Angaben an.`}
        />
      );
    }

    return (
      <section className="page-content plan-page recipe-search-page">
        <button
          type="button"
          className="recipe-back"
          onClick={() => {
            setRecipeSearchMode(false);
            setRecipeSearchError("");
          }}
        >
          ← Zurück zur Wochenplanung
        </button>
        <div className="recipe-search-hero">
          <div className="recipe-search-illustration" aria-hidden="true">🔎🥞</div>
          <span className="small-eyebrow">DEIN WUNSCHREZEPT</span>
          <h1>Wonach hast du Appetit?</h1>
          <p>Beschreibe ein Gericht und die KI stellt ein passendes Rezept zusammen.</p>
        </div>
        <form className="recipe-search-form" onSubmit={searchForRecipe}>
          <label>
            Welches Gericht suchst du?
            <input
              autoFocus
              type="search"
              maxLength={100}
              value={recipeSearchQuery}
              onChange={(event) => setRecipeSearchQuery(event.target.value)}
              placeholder="Zum Beispiel: fluffige Pfannkuchen"
            />
          </label>
          <div className="recipe-search-fields">
            <label>
              Für wie viele Personen?
              <input
                type="number"
                min="1"
                max="30"
                value={recipeSearchServings}
                onChange={(event) => setRecipeSearchServings(event.target.value)}
              />
            </label>
            <label>
              Budget für dieses Gericht
              <span className="recipe-search-budget-input">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={recipeSearchBudget}
                  onChange={(event) => setRecipeSearchBudget(event.target.value)}
                />
                <span>€</span>
              </span>
            </label>
          </div>
          <div className="recipe-search-context">
            <span>🛒 {planData.supermarket}</span>
            <span>🥗 {planData.diet.length ? planData.diet.join(", ") : "Keine Ernährungsweise gewählt"}</span>
            <span>♨ {planData.appliances.join(", ") || "Küchenausstattung nicht angegeben"}</span>
          </div>
          {recipeSearchError && <p className="recipe-action-error" role="alert">{recipeSearchError}</p>}
          <button className="recipe-search-submit" type="submit" disabled={!recipeSearchQuery.trim()}>
            Rezept mit KI suchen <span aria-hidden="true">→</span>
          </button>
          <p className="recipe-search-note">
            Deine hinterlegten Ernährungswünsche, Allergiehinweise und Küchengeräte werden berücksichtigt.
            Prüfe Zutaten und Verpackungshinweise bei Allergien trotzdem selbst.
          </p>
        </form>
      </section>
    );
  }

  const progress = Math.round(((planStep + 1) / titles.length) * 100);

  return (
    <section className="page-content plan-page">
      <span className="small-eyebrow">ESSENPLANUNG</span>
      <div className="plan-heading">
        <h1>Dein persönlicher Essensplan</h1>
        <p>In wenigen Schritten zu leckeren Ideen für deine Woche.</p>
      </div>

      <div className="plan-welcome-banner">
        <img
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200"
          alt="Frische Zutaten für die Essensplanung"
        />
        <div className="plan-welcome-overlay">
          <span>GUT ESSEN, EINFACH PLANEN</span>
          <h2>Deine Woche wird lecker!</h2>
          <p>Wir stimmen deine Rezepte auf deinen Alltag und deine Wünsche ab.</p>
        </div>
      </div>

      <button
        type="button"
        className="plan-recipe-search-entry"
        onClick={() => {
          setRecipeSearchServings(Math.max(1, Number(planData.adults) + Number(planData.children)));
          setRecipeSearchBudget(15);
          setRecipeSearchPlan(null);
          setRecipeSearchMode(true);
          setRecipeSearchError("");
          setPlanFinished(false);
        }}
      >
        <span className="plan-recipe-search-icon">⌕</span>
        <span>
          <strong>Such lieber ein bestimmtes Rezept?</strong>
          <small>Gib ein Gericht, die Personenzahl und dein Budget ein.</small>
        </span>
        <span className="plan-recipe-search-arrow">→</span>
      </button>

      <div className="plan-progress-card">
        <div className="plan-progress-top">
          <div>
            <span>SCHRITT {planStep + 1} VON {titles.length}</span>
            <strong>{titles[planStep]}</strong>
          </div>
          <strong className="plan-progress-percent">{progress}%</strong>
        </div>
        <div className="plan-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="plan-progress-dots">
          {titles.map((title, index) => (
            <span
              key={title}
              className={index <= planStep ? "completed" : ""}
            />
          ))}
        </div>
      </div>

      <div className="plan-step-card">
        <div className="plan-step-heading">
          <span className="plan-step-number">{String(planStep + 1).padStart(2, "0")}</span>
          <div>
            <h2>{titles[planStep]}</h2>
            <p>{descriptions[planStep]}</p>
          </div>
        </div>

        {planStep === 0 && (
          <div className="plan-step-content">
            {sectionTitle(
              "Wo kaufst du ein?",
              "Wähle deinen Supermarkt und gib optional deine bevorzugte Filiale an."
            )}

            <div className="plan-supermarket-grid">
              {supermarkets.map((shop) => (
                <button
                  key={shop.name}
                  type="button"
                  className={`plan-supermarket ${
                    planData.supermarket === shop.name ? "selected" : ""
                  }`}
                  onClick={() => updatePlan("supermarket", shop.name)}
                >
                  <span className="plan-shop-logo">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${shop.domain}&sz=128`}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.nextElementSibling.style.display = "grid";
                      }}
                    />
                    <span
                      className="plan-shop-fallback"
                      style={{ color: shop.color }}
                    >
                      {shop.name.charAt(0)}
                    </span>
                  </span>
                  <strong>{shop.name}</strong>
                  {planData.supermarket === shop.name && (
                    <span className="plan-shop-check">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="plan-input-section">
              {sectionTitle(
                "Deine bevorzugte Filiale",
                "Damit wir regionale Angebote und Preise berücksichtigen können."
              )}

              <div style={{ position: "relative" }}>
                <input
                  className="plan-text-input"
                  value={planData.branch}
                  onChange={(event) =>
                    updatePlan("branch", event.target.value)
                  }
                  placeholder={`z. B. ${planData.supermarket} in Euskirchen`}
                />
              </div>

              <p style={{
                color: "#888",
                fontSize: 12,
                marginTop: 8,
              }}>
                Stadt oder Ort genügt. Eine genaue Adresse ist nicht notwendig.
              </p>
            </div>
            {planData.supermarket === "Lidl" && <LidlProducts />}
          </div>
        )}

        {planStep === 1 && (
          <div className="plan-step-content">
            {sectionTitle(
              "Wie viele Personen?",
              "Passe die Anzahl an, für die gekocht werden soll."
            )}

            {counter(
              "Erwachsene",
              "🧑",
              planData.adults,
              "adults",
              "Erwachsene Personen"
            )}

            {counter(
              "Kinder",
              "🧒",
              planData.children,
              "children",
              "Kinder"
            )}

            <div className="plan-total-people">
              <span>👨‍👩‍👧</span>
              <div>
                <small>Wir kochen insgesamt für</small>
                <strong>
                  {planData.adults + planData.children} Personen
                </strong>
              </div>
            </div>
          </div>
        )}

        {planStep === 2 && (
          <div className="plan-step-content">
            {sectionTitle(
              "Welche Wochentage?",
              "Tippe die Tage an, für die du planen möchtest."
            )}

            <div className="plan-day-grid">
              {days.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  className={`plan-day ${
                    planData.days.includes(day) ? "selected" : ""
                  }`}
                  onClick={() => toggle("days", day)}
                >
                  <small>{["MO", "DI", "MI", "DO", "FR", "SA", "SO"][index]}</small>
                  <strong>{day}</strong>
                  <span>
                    {planData.days.includes(day) ? "✓" : "+"}
                  </span>
                </button>
              ))}
            </div>

            <p className="plan-selection-hint">
              {planData.days.length} von 7 Tagen ausgewählt
            </p>

            <div className="plan-input-section">
              {sectionTitle(
                "Welche Mahlzeiten?",
                "Du kannst mehrere Mahlzeiten auswählen."
              )}

              <div className="plan-meal-grid">
                {meals.map((meal) => (
                  <button
                    key={meal.name}
                    type="button"
                    className={`plan-meal ${
                      planData.meals.includes(meal.name) ? "selected" : ""
                    }`}
                    onClick={() => toggle("meals", meal.name)}
                  >
                    <span>{meal.icon}</span>
                    <strong>{meal.name}</strong>
                    <small>{meal.desc}</small>
                    <i>
                      {planData.meals.includes(meal.name) ? "✓" : "+"}
                    </i>
                  </button>
                ))}
              </div>
            </div>

            <div className="plan-budget">
              <div>
                <span>💶</span>
                <div>
                  <strong>Dein Wochenbudget</strong>
                  <small>Wie viel möchtest du ungefähr ausgeben?</small>
                </div>
              </div>

              <div className="plan-budget-value">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={planData.budget}
                  onChange={(event) =>
                    updatePlan("budget", event.target.value)
                  }
                />
                <strong>€</strong>
              </div>
            </div>
          </div>
        )}

        {planStep === 3 && (
          <div className="plan-step-content">
            <div className="plan-profile-box">
              <div className="plan-profile-icon">❤️</div>
              <div>
                <strong>Dein persönlicher Geschmack</strong>
                <p>
                  Deine Angaben aus deinem Profil werden automatisch
                  berücksichtigt.
                </p>
              </div>
            </div>

            {sectionTitle("Das magst du", "Deine gespeicherten Lieblingsgerichte.")}

            <div className="plan-food-tags">
              {favorites.length ? favorites.map((food) => (
                <span key={food}>❤️ {food}</span>
              )) : (
                <p>Du hast noch keine Lieblingsgerichte ausgewählt.</p>
              )}
            </div>

            {sectionTitle("Das magst du nicht", "Diese Angaben werden ebenfalls berücksichtigt.")}

            <div className="plan-food-tags dislikes">
              {dislikes.length ? dislikes.map((food) => (
                <span key={food}>− {food}</span>
              )) : (
                <p>Du hast keine Abneigungen hinterlegt.</p>
              )}
            </div>

            <div className="plan-input-section">
              {sectionTitle(
                "Freunde einbeziehen",
                "Ihre Geschmacksprofile können ebenfalls berücksichtigt werden."
              )}

              {planFriendsLoading ? (
                <p>Freunde werden geladen ...</p>
              ) : planFriends.length === 0 ? (
                <div className="plan-empty-friends">
                  <span>👥</span>
                  <strong>Noch keine Freunde vorhanden</strong>
                  <p>
                    Du kannst später Freunde hinzufügen und ihre Vorlieben
                    bei der Planung berücksichtigen.
                  </p>
                </div>
              ) : (
                <div className="plan-friend-grid">
                  {planFriends.map((friend) => {
                    const selected = planData.friends.includes(friend.user_id);

                    return (
                      <button
                        key={friend.user_id}
                        type="button"
                        className={`plan-friend ${
                          selected ? "selected" : ""
                        }`}
                        onClick={() => toggle("friends", friend.user_id)}
                      >
                        <span className="plan-friend-avatar">
                          {friend.username?.charAt(0).toUpperCase()}
                        </span>
                        <strong>{friend.username}</strong>
                        <span>{selected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {planStep === 4 && (
          <div className="plan-step-content">
            {sectionTitle(
              "Ernährungsweise",
              "Welche Ernährungsweise soll berücksichtigt werden?"
            )}

            <div className="plan-option-grid">
              {diets.map((diet) => (
                <button
                  key={diet.name}
                  type="button"
                  className={`plan-option ${
                    planData.diet.includes(diet.name) ? "selected" : ""
                  }`}
                  onClick={() => toggle("diet", diet.name)}
                >
                  <span>{diet.icon}</span>
                  <strong>{diet.name}</strong>
                  <i>
                    {planData.diet.includes(diet.name) ? "✓" : "+"}
                  </i>
                </button>
              ))}
            </div>

            <div className="plan-input-section">
              {sectionTitle(
                "Allergien und Unverträglichkeiten",
                "Wähle alle zutreffenden Angaben aus."
              )}

              <div className="plan-option-grid">
                {allergies.map((allergy) => (
                  <button
                    key={allergy.name}
                    type="button"
                    className={`plan-option ${
                      planData.allergies.includes(allergy.name)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => toggle("allergies", allergy.name)}
                  >
                    <span>{allergy.icon}</span>
                    <strong>{allergy.name}</strong>
                    <i>
                      {planData.allergies.includes(allergy.name) ? "✓" : "+"}
                    </i>
                  </button>
                ))}
              </div>

              <div className="plan-allergy-notice">
                ⚠️ Allergieangaben müssen bei späteren Rezepten und
                Lebensmittelverpackungen immer sorgfältig überprüft werden.
              </div>
            </div>
          </div>
        )}

        {planStep === 5 && (
          <div className="plan-step-content">
            {sectionTitle(
              "Deine Küchengeräte",
              "Wähle aus, womit du gerne kochst."
            )}

            <div className="plan-appliance-grid">
              {appliances.map((device) => (
                <button
                  key={device.name}
                  type="button"
                  className={`plan-appliance ${
                    planData.appliances.includes(device.name) ? "selected" : ""
                  }`}
                  onClick={() => toggle("appliances", device.name)}
                >
                  <span>{device.icon}</span>
                  <strong>{device.name}</strong>
                  <small>{device.desc}</small>
                  <i>
                    {planData.appliances.includes(device.name) ? "✓" : "+"}
                  </i>
                </button>
              ))}
            </div>

            <div className="plan-input-section">
              {sectionTitle(
                "Deine zusätzlichen Wünsche",
                "Was ist dir bei deiner Essensplanung wichtig?"
              )}

              <div className="plan-extra-grid">
                {extras.map((extra) => (
                  <button
                    key={extra.name}
                    type="button"
                    className={`plan-extra ${
                      planData.extras.includes(extra.name) ? "selected" : ""
                    }`}
                    onClick={() => toggle("extras", extra.name)}
                  >
                    <span>{extra.icon}</span>
                    <strong>{extra.name}</strong>
                    <i>
                      {planData.extras.includes(extra.name) ? "✓" : "+"}
                    </i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="plan-navigation">
          <button
            type="button"
            className="plan-back-button"
            onClick={() => {
              if (planStep === 0) {
                setActivePage("home");
              } else {
                setPlanStep((step) => step - 1);
              }
            }}
          >
            ← Zurück
          </button>

          <button
            type="button"
            className="plan-next-button"
            disabled={
              recipeGenerationLoading ||
              (planStep === 2 &&
                (planData.days.length === 0 ||
                  planData.meals.length === 0 ||
                  Number(planData.budget) <= 0)) ||
              (planStep === 5 && planData.appliances.length === 0)
            }
            onClick={async () => {
              if (planStep < 5) {
                setPlanStep((step) => step + 1);
              } else {
                await finishPlanning();
              }
            }}
          >
            {recipeGenerationLoading
              ? "KI erstellt deine Rezepte ..."
              : planStep === 5
                ? recipeGenerationError ? "Erneut versuchen ↻" : "Planung abschließen ✓"
                : "Weiter zum nächsten Schritt →"}
          </button>
        </div>

        {recipeGenerationError && (
          <p className="recipe-action-error" role="alert">{recipeGenerationError}</p>
        )}

        <p className="plan-footer-note">
          Deine Planungs- und Geschmacksangaben werden über Supabase an Google
          Gemini gesendet. Namen und Konto-ID werden dabei nicht mitgesendet.
        </p>
      </div>
    </section>
  );
}


  function renderLists() {
    return (
      <section className="page-content list-page">
        <div className="section-hero list-page-hero">
          <div>
            <span className="small-eyebrow">ALLES IM BLICK</span>
            <h1>Einkaufslisten</h1>
            <p className="page-description">Dein Einkauf, deine gespeicherten Rezepte – übersichtlich an einem Ort.</p>
          </div>
          <span className="section-hero-icon" aria-hidden="true">🛒</span>
        </div>
        {listError && <p className="shopping-feedback error" role="alert">{listError}</p>}
        {listMessage && <p className="shopping-feedback success" role="status">{listMessage}</p>}
        <section className={`saved-recipes-panel ${savedRecipesOpen ? "is-open" : ""}`}>
          <div className="saved-recipes-heading">
            <div>
              <span className="small-eyebrow">DEINE REZEPTSAMMLUNG</span>
              <h2>Gespeicherte Rezepte</h2>
              <p>{savedShoppingRecipes.length} Rezepte mit Zutaten und Zubereitung</p>
            </div>
            <button
              type="button"
              className="saved-recipes-toggle"
              onClick={() => setSavedRecipesOpen((open) => !open)}
              aria-expanded={savedRecipesOpen}
            >
              {savedRecipesOpen ? "Rezepte schließen ↑" : `Rezepte ansehen · ${savedShoppingRecipes.length} →`}
            </button>
          </div>

          {savedRecipesOpen && (
            <div className="saved-recipes-content">
              {itemsLoading ? (
                <div className="empty-list"><span>🍊</span><strong>Deine Rezepte werden geladen ...</strong></div>
              ) : savedShoppingRecipes.length === 0 ? (
                <div className="empty-list saved-recipes-empty">
                  <span>🍽️</span>
                  <strong>Noch keine gespeicherten Rezepte</strong>
                  <p>Speichere ein Rezept über „Zutaten“ auf einer Rezeptkarte.</p>
                </div>
              ) : (
                <div className="saved-recipe-grid">
                  {savedShoppingRecipes.map((recipe) => {
                    const instructionsOpen = openRecipeInstructions.includes(recipe.id);
                    const checkedCount = recipe.ingredients.filter((ingredient) => ingredient.done).length;

                    return (
                      <article className="saved-recipe-card" key={recipe.id}>
                        <div className="saved-recipe-image-wrap">
                          <RecipeImage
                            src={recipe.image_url}
                            name={recipe.name}
                          />
                          <span className="saved-recipe-badge">♡ Gespeichert</span>
                        </div>
                        <ImageAttribution
                          credit={recipe.image_credit}
                          sourceUrl={recipe.image_source_url}
                          license={recipe.image_license}
                          licenseUrl={recipe.image_license_url}
                        />
                        <div className="saved-recipe-body">
                          <div className="saved-recipe-card-heading">
                            <div>
                              <span className="saved-recipe-subtitle">
                                ◷ {recipe.instructions.length} Zubereitungsschritte · {recipe.servings} Personen
                              </span>
                              <h3>{recipe.name}</h3>
                            </div>
                            <button
                              type="button"
                              className="saved-recipe-delete"
                              onClick={() => deleteSavedShoppingRecipe(recipe.id)}
                              disabled={updatingItemId === recipe.id}
                              aria-label={`${recipe.name} aus den gespeicherten Rezepten löschen`}
                              title="Rezept löschen"
                            >
                              {updatingItemId === recipe.id ? "…" : "🗑"}
                            </button>
                          </div>
                          <p className="saved-recipe-description">{recipe.description}</p>

                          <div className="saved-recipe-ingredients-heading">
                            <strong>Zutaten für deine Einkaufsliste</strong>
                            <span>{checkedCount}/{recipe.ingredients.length} erledigt</span>
                          </div>
                          <div className="saved-recipe-ingredients">
                            {recipe.ingredients.map((ingredient) => (
                              <label className="saved-recipe-ingredient" key={ingredient.id}>
                                <input
                                  type="checkbox"
                                  checked={ingredient.done}
                                  onChange={() => toggleRecipeIngredient(ingredient)}
                                  disabled={updatingItemId === ingredient.id}
                                />
                                <span className={ingredient.done ? "item-done" : ""}>
                                  {ingredient.name}
                                </span>
                                <strong>
                                  {ingredient.amount !== null && ingredient.amount !== undefined
                                    ? `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(ingredient.amount)} ${ingredient.unit || ""}`
                                    : ingredient.unit || ""}
                                </strong>
                              </label>
                            ))}
                          </div>

                          <button
                            type="button"
                            className="saved-recipe-instructions-toggle"
                            onClick={() => toggleRecipeInstructions(recipe.id)}
                            aria-expanded={instructionsOpen}
                          >
                            {instructionsOpen ? "Zubereitung ausblenden ↑" : "Alles fertig? Zubereitung steht hier ↓"}
                          </button>
                          {instructionsOpen && (
                            <ol className="saved-recipe-instructions">
                              {recipe.instructions.map((step, index) => (
                                <li key={`${recipe.id}-${index}`}>
                                  <span>{index + 1}</span>
                                  <p>{step}</p>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="feature-panel shopping-list-panel">
          <div className="shopping-list-heading">
            <div>
              <span className="small-eyebrow">DEIN EINKAUF</span>
              <h2>Eigene Einkaufsliste</h2>
              <p>Deine Liste wird mit deinem Konto gespeichert und bleibt erhalten.</p>
            </div>
            <span className="shopping-count">{items.filter((item) => !item.done).length}<small>offen</small></span>
          </div>
          <form className="add-item-form" onSubmit={addItem}>
            <input value={newItem} onChange={(event) => setNewItem(event.target.value)} placeholder="Zum Beispiel: Milch" disabled={itemsLoading} />
            <button type="submit" className="primary-button" disabled={itemsLoading || !newItem.trim()}>Hinzufügen</button>
          </form>
          {itemsLoading ? (
            <div className="empty-list"><span>🍊</span><strong>Deine Einkaufsliste wird geladen ...</strong></div>
          ) : !listError && items.length === 0 ? (
            <div className="empty-list"><span>☷</span><strong>Deine Liste ist noch leer.</strong><p>Füge deinen ersten Einkaufsartikel hinzu.</p></div>
          ) : items.length > 0 ? (
            <div className="shopping-items">
  {items.map((item) => (
    <div
      key={item.id}
      className="shopping-item"
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={() => toggleItem(item)}
        disabled={updatingItemId === item.id}
      />

      <span
        className={item.done ? "item-done" : ""}
      >
        {item.amount !== null && item.amount !== undefined
          ? `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(item.amount)} ${item.unit || ""} ${item.name}`
          : item.name}
      </span>

      <button
        type="button"
        onClick={() => deleteItem(item.id)}
        disabled={updatingItemId === item.id}
        title="Artikel löschen"
        aria-label={`${item.name} löschen`}
      >
        🗑
      </button>
    </div>
  ))}
</div>
          ) : null}
        </div>
        <div className="info-panel">
          <strong>Automatische Rezeptliste</strong>
          <p>Beim Speichern werden gleiche Zutaten mit gleicher Einheit zusammengefasst. Abweichende Einheiten bleiben getrennt. Prüfe bei Allergien weiterhin die Zutaten- und Verpackungshinweise.</p>
        </div>
      </section>
    );
  }

  function renderSettings() {
    return (
      <section className="page-content settings-page">
        <div className="section-hero settings-page-hero">
          <div>
            <span className="small-eyebrow">DEIN PROFIL</span>
            <h1>Einstellungen</h1>
            <p className="page-description">Verwalte dein Konto und deine persönlichen EssenPlan-Angaben.</p>
          </div>
          <span className="section-hero-icon" aria-hidden="true">⚙️</span>
        </div>
        <div className="profile-panel settings-profile-panel">
          <div className="profile-avatar large-avatar">
  {avatarUrl ? (
    <img
      src={avatarUrl}
      alt="Dein Profilbild"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "50%",
        display: "block",
      }}
    />
  ) : (
    firstName.charAt(0).toUpperCase()
  )}
</div>
          <div><strong>{displayName}</strong><span>{user.email}</span></div>
        </div>
        <div className="feature-panel avatar-settings-panel">
          <div className="sound-settings-copy">
            <span className="settings-icon">📷</span>
            <div>
              <h2>Profilbild</h2>
              <p>Wähle ein neues Bild für dein Profil. Deine Geschmackseinstellungen bleiben unverändert.</p>
            </div>
          </div>
          <div className="avatar-settings-actions">
            <input
              id="settings-avatar-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setAvatarFile(event.target.files?.[0] || null);
                setAvatarError("");
                setAvatarNotice("");
              }}
            />
            <label htmlFor="settings-avatar-file" className="sound-test-button">
              Bild auswählen
            </label>
            {avatarFile && (
              <span className="avatar-selected-name">{avatarFile.name}</span>
            )}
            <button
              type="button"
              className="primary-button"
              disabled={!avatarFile || avatarSaving}
              onClick={saveAvatarChange}
            >
              {avatarSaving ? "Wird gespeichert ..." : "Profilbild speichern"}
            </button>
          </div>
          {avatarError && <p className="avatar-feedback error" role="alert">{avatarError}</p>}
          {avatarNotice && <p className="avatar-feedback success" role="status">{avatarNotice}</p>}
        </div>
        <div className="settings-list">
          <div className="settings-row"><span className="settings-icon">♙</span><div><strong>Benutzername</strong><small>{displayName}</small></div></div>
          <div className="settings-row"><span className="settings-icon">✉</span><div><strong>E-Mail-Adresse</strong><small>{user.email}</small></div></div>
          <div className="settings-row"><span className="settings-icon">◎</span><div><strong>Sprache</strong><small>Deutsch</small></div></div>
        </div>

        <div className="feature-panel sound-settings-panel">
          <div className="sound-settings-copy">
            <span className="settings-icon">♫</span>
            <div>
              <h2>App-Sounds</h2>
              <p>Dezente Töne für Aktionen wie Speichern, Abhaken und Rezeptbewertungen.</p>
            </div>
          </div>
          <div className="sound-settings-actions">
            <label className="sound-toggle">
              <input
                type="checkbox"
                checked={uiSoundsEnabled}
                onChange={toggleUiSounds}
              />
              <span>{uiSoundsEnabled ? "Eingeschaltet" : "Ausgeschaltet"}</span>
            </label>
            <button
              type="button"
              className="sound-test-button"
              disabled={!uiSoundsEnabled}
              onClick={() => {
                if (!uiSoundsEnabled) return;
                playSound("success");
              }}
            >
              Probehören
            </button>
          </div>
          <label className="sound-volume-control">
            <span>Lautstärke</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={uiSoundVolume}
              onChange={(event) => updateUiSoundVolume(event.target.value)}
              aria-label="Lautstärke der App-Töne"
            />
            <small>{Math.round(uiSoundVolume * 100)}%</small>
          </label>
        </div>

        <div className="feature-panel music-settings-panel">
          <div className="sound-settings-copy">
            <span className="settings-icon">♫</span>
            <div>
              <h2>Hintergrundmusik</h2>
              <p>Eine ruhige, selbst erzeugte Melodie. Sie startet nur, wenn du sie einschaltest.</p>
            </div>
          </div>
          <div className="music-settings-actions">
            <button type="button" className="sound-test-button" onClick={toggleUiMusic}>
              {uiMusicEnabled ? "Musik ausschalten" : "Musik einschalten"}
            </button>
            <label className="sound-volume-control">
              <span>Musiklautstärke</span>
              <input
                type="range"
                min="0.02"
                max="0.35"
                step="0.01"
                value={uiMusicVolume}
                onChange={(event) => updateUiMusicVolume(event.target.value)}
                aria-label="Lautstärke der Hintergrundmusik"
              />
            </label>
          </div>
          {musicNotice && <p className="avatar-feedback" role="status">{musicNotice}</p>}
        </div>

        <div className="feature-panel">
          <h2>Mein Geschmacksprofil</h2>
          <p>Bearbeite deine Lieblingsgerichte und deine Abneigungen.</p>
          <button className="primary-button" onClick={() => {
            setTasteStep(0);
            setTasteError("");
            setShowTasteProfile(true);
          }}>
            Geschmacksprofil bearbeiten
          </button>
        </div>

        <button className="logout-button" onClick={logout}>
  Abmelden <span>→</span>
</button>

<div className="account-danger-panel">
  <h3 style={{ color: "#b94c40", marginTop: 0 }}>
    Konto löschen
  </h3>

  <p style={{
    color: "#866b66",
    fontSize: 14,
    lineHeight: 1.6,
  }}>
    Lösche dein EssenPlan-Konto dauerhaft. Dein Profil und deine
    gespeicherten Daten werden dabei entfernt.
  </p>

  <button
    onClick={deleteAccount}
    style={{
      width: "100%",
      padding: 13,
      border: "none",
      borderRadius: 11,
      background: "#c65345",
      color: "white",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    Mein Konto dauerhaft löschen
  </button>
</div>
      </section>
    );
  }

  const pageContent = {
    home: renderHome,
    friends: renderFriends,
    messages: renderMessages,
    plan: renderPlan,
    lists: renderLists,
    settings: renderSettings,
  };

  return (
    <div className="dashboard" onClickCapture={handleDashboardClick}>
      <header className="topbar">
        <button className="brand-button" onClick={() => {
          setActivePage("home");
        }}>
          <span className="brand-mark">🍊</span>
          <span>ESSEN<span>PLAN</span></span>
        </button>
        <div className="topbar-right">
          <span className="topbar-greeting">Hallo, {firstName}</span>
          <div className="small-avatar">
  {avatarUrl ? (
    <img
      src={avatarUrl}
      alt="Dein Profilbild"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "50%",
        display: "block",
      }}
    />
  ) : (
    firstName.charAt(0).toUpperCase()
  )}
</div>
        </div>
      </header>

      <main className="main-content">{pageContent[activePage]()}</main>

      <nav className="bottom-navigation">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => {
              if (item.id === "plan") {
                startPlanning();
              } else {
                setActivePage(item.id);
              }
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
