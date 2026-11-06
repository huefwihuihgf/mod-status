import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import "./Messages.css";

function formatTime(value) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export default function Messages({ userId }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadFriends() {
      const { data, error: friendsError } = await supabase.rpc("get_my_friends");
      if (!active) return;
      if (friendsError) {
        setError(`Freunde konnten nicht geladen werden: ${friendsError.message}`);
      } else {
        setFriends(data || []);
      }
      setLoadingFriends(false);
    }

    loadFriends();
    return () => {
      active = false;
    };
  }, []);

  const loadMessages = useCallback(async (friendId) => {
    const { data, error: messagesError } = await supabase
      .from("friend_messages")
      .select("id, sender_id, recipient_id, content, recipe, created_at")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (messagesError) {
      setError(`Nachrichten konnten nicht geladen werden: ${messagesError.message}`);
    } else {
      setMessages(data || []);
    }
    setLoadingMessages(false);
  }, [userId]);

  useEffect(() => {
    if (!selectedFriend) {
      return undefined;
    }

    const channel = supabase
      .channel(`friend-messages-${userId}-${selectedFriend.user_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "friend_messages" },
        (payload) => {
          const message = payload.new;
          if (
            (message.sender_id === userId && message.recipient_id === selectedFriend.user_id) ||
            (message.sender_id === selectedFriend.user_id && message.recipient_id === userId)
          ) {
            setMessages((current) =>
              current.some((item) => item.id === message.id) ? current : [...current, message]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFriend, userId]);

  useEffect(() => {
    if (!selectedFriend) return;
    let active = true;

    async function loadRecipes() {
      const { data, error: recipeError } = await supabase
        .from("shopping_list_recipes")
        .select("id, recipe_key, name, description, image_url, servings, instructions")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (recipeError) {
        setError(`Gespeicherte Rezepte konnten nicht geladen werden: ${recipeError.message}`);
        return;
      }

      setSavedRecipes(data || []);
    }

    loadRecipes();
    return () => {
      active = false;
    };
  }, [selectedFriend, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendText(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedFriend || sending) return;
    if (content.length > 2000) {
      setError("Eine Nachricht darf höchstens 2.000 Zeichen lang sein.");
      return;
    }

    setSending(true);
    setError("");
    setNotice("");
    const { error: sendError } = await supabase.from("friend_messages").insert({
      sender_id: userId,
      recipient_id: selectedFriend.user_id,
      content,
    });

    if (sendError) {
      setError(`Nachricht konnte nicht gesendet werden: ${sendError.message}`);
    } else {
      setDraft("");
      setNotice("Nachricht gesendet.");
      await loadMessages(selectedFriend.user_id);
    }
    setSending(false);
  }

  async function shareRecipe(recipeId) {
    if (!selectedFriend || sending) return;
    setSending(true);
    setError("");
    setNotice("");

    try {
      const recipe = savedRecipes.find((item) => item.id === recipeId);
      if (!recipe) throw new Error("Dieses gespeicherte Rezept wurde nicht gefunden.");

      const { data: ingredients, error: ingredientsError } = await supabase
        .from("shopping_list_recipe_ingredients")
        .select("name, amount, unit")
        .eq("recipe_id", recipe.id)
        .eq("user_id", userId)
        .order("position", { ascending: true });

      if (ingredientsError) throw ingredientsError;
      if (!ingredients?.length) throw new Error("Das Rezept enthält keine gespeicherten Zutaten.");

      const { error: shareError } = await supabase.from("friend_messages").insert({
        sender_id: userId,
        recipient_id: selectedFriend.user_id,
        recipe: {
          name: recipe.name,
          description: recipe.description,
          image_url: recipe.image_url,
          servings: recipe.servings,
          ingredients,
          instructions: recipe.instructions,
        },
      });

      if (shareError) throw shareError;
      setNotice(`„${recipe.name}“ wurde geteilt.`);
      await loadMessages(selectedFriend.user_id);
    } catch (shareError) {
      setError(`Rezept konnte nicht geteilt werden: ${shareError.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="page-content messages-page">
      <div className="section-hero messages-hero">
        <div>
          <span className="small-eyebrow">GEMEINSAM GENIESSEN</span>
          <h1>Nachrichten</h1>
          <p className="page-description">Schreib deinen Freunden oder teile ein gespeichertes Rezept.</p>
        </div>
        <span className="section-hero-icon" aria-hidden="true">💬</span>
      </div>

      <div className="messages-layout">
        <aside className="messages-friends-panel">
          <h2>Deine Freunde</h2>
          {loadingFriends ? (
            <p className="messages-muted">Freunde werden geladen ...</p>
          ) : friends.length ? (
            <div className="messages-friend-list">
              {friends.map((friend) => (
                <button
                  type="button"
                  className={`messages-friend ${selectedFriend?.user_id === friend.user_id ? "active" : ""}`}
                  key={friend.user_id}
                  onClick={() => {
                    setSelectedFriend(friend);
                    setLoadingMessages(true);
                    setNotice("");
                    setError("");
                    loadMessages(friend.user_id);
                  }}
                >
                  <span className="messages-friend-avatar">
                    {friend.username?.charAt(0).toUpperCase() || "?"}
                  </span>
                  <span><strong>{friend.username}</strong><small>Chat öffnen</small></span>
                  <span className="messages-friend-arrow" aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="messages-muted">Füge zuerst Freunde hinzu, um Nachrichten auszutauschen.</p>
          )}
        </aside>

        <div className="messages-chat-panel">
          {selectedFriend ? (
            <>
              <header className="messages-chat-header">
                <span className="messages-friend-avatar">
                  {selectedFriend.username?.charAt(0).toUpperCase() || "?"}
                </span>
                <div><strong>{selectedFriend.username}</strong><small>Dein EssenPlan-Freund</small></div>
              </header>

              <div className="messages-thread" aria-live="polite">
                {loadingMessages ? (
                  <p className="messages-muted">Nachrichten werden geladen ...</p>
                ) : messages.length ? (
                  messages.map((message) => (
                    <article
                      className={`message-bubble ${message.sender_id === userId ? "sent" : "received"}`}
                      key={message.id}
                    >
                      {message.content && <p>{message.content}</p>}
                      {message.recipe && (
                        <div className="shared-recipe-card">
                          {message.recipe.image_url && (
                            <img src={message.recipe.image_url} alt={message.recipe.name} loading="lazy" />
                          )}
                          <div className="shared-recipe-content">
                            <span className="small-eyebrow">GETEILTES REZEPT</span>
                            <strong>{message.recipe.name}</strong>
                            {message.recipe.description && <p>{message.recipe.description}</p>}
                            <small>Für {message.recipe.servings} Personen · {message.recipe.ingredients?.length || 0} Zutaten</small>
                            <details>
                              <summary>Zutaten und Zubereitung</summary>
                              <ul>
                                {(message.recipe.ingredients || []).map((ingredient, index) => (
                                  <li key={`${ingredient.name}-${index}`}>
                                    {[ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean).join(" ")}
                                  </li>
                                ))}
                              </ul>
                              <ol>
                                {(message.recipe.instructions || []).map((step, index) => (
                                  <li key={index}>{typeof step === "string" ? step : step.text || step.description}</li>
                                ))}
                              </ol>
                            </details>
                          </div>
                        </div>
                      )}
                      <time>{formatTime(message.created_at)}</time>
                    </article>
                  ))
                ) : (
                  <div className="messages-empty">
                    <span aria-hidden="true">🥕</span>
                    <strong>Der Chat ist bereit</strong>
                    <p>Schick {selectedFriend.username} eine Nachricht oder ein gespeichertes Rezept.</p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {error && <p className="messages-feedback error" role="alert">{error}</p>}
              {notice && <p className="messages-feedback success" role="status">{notice}</p>}

              <div className="messages-compose">
                <form onSubmit={sendText}>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Nachricht an ${selectedFriend.username} ...`}
                    aria-label="Nachricht"
                    maxLength={2000}
                    rows={2}
                  />
                  <button className="primary-button" type="submit" disabled={!draft.trim() || sending}>
                    {sending ? "Senden ..." : "Senden"} <span aria-hidden="true">→</span>
                  </button>
                </form>
                <label className="share-recipe-select">
                  <span>🍽️ Rezept teilen</span>
                  <select
                    defaultValue=""
                    disabled={sending || !savedRecipes.length}
                    onChange={(event) => {
                      const recipeId = event.target.value;
                      if (recipeId) shareRecipe(recipeId);
                      event.target.value = "";
                    }}
                  >
                    <option value="">
                      {savedRecipes.length ? "Gespeichertes Rezept auswählen" : "Noch keine gespeicherten Rezepte"}
                    </option>
                    {savedRecipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          ) : (
            <div className="messages-empty messages-no-selection">
              <span aria-hidden="true">💌</span>
              <strong>Wähl einen Freund aus</strong>
              <p>Deine persönlichen Nachrichten und geteilten Rezepte findest du hier.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
