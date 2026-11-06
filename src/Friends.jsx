
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

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

function Avatar({ url, username, size = 48 }) {
  return (
    <div style={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: "50%",
      overflow: "hidden",
      background: "#fff0e3",
      color: "#d87527",
      display: "grid",
      placeItems: "center",
      fontSize: size * 0.42,
      fontWeight: 800,
    }}>
      {url ? (
        <img
          src={url}
          alt={`Profilbild von ${username}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        username?.charAt(0).toUpperCase() || "?"
      )}
    </div>
  );
}

function FoodPhoto({ name }) {
  const food = foods.find((item) => item.name === name);

  return (
    <div style={{
      overflow: "hidden",
      borderRadius: 13,
      background: "#f5f1ec",
    }}>
      {food ? (
        <img
          src={food.image}
          alt={name}
          loading="lazy"
          style={{
            display: "block",
            width: "100%",
            height: 115,
            objectFit: "cover",
          }}
        />
      ) : (
        <div style={{
          height: 115,
          display: "grid",
          placeItems: "center",
          color: "#999",
        }}>
          🍽️
        </div>
      )}
      <div style={{
        padding: "9px 8px",
        fontSize: 13,
        fontWeight: 650,
        background: "white",
      }}>
        {name}
      </div>
    </div>
  );
}

function FoodSection({ title, items, emptyText }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 17, marginBottom: 12 }}>{title}</h3>
      {items?.length ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))",
          gap: 12,
        }}>
          {items.map((name) => (
            <FoodPhoto key={name} name={name} />
          ))}
        </div>
      ) : (
        <p style={{ color: "#999", fontSize: 14 }}>{emptyText}</p>
      )}
    </section>
  );
}

export default function Friends({ userId, onPlaySound }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    const [friendResult, requestResult] = await Promise.all([
      supabase.rpc("get_my_friends"),
      supabase.rpc("get_friend_requests"),
    ]);

    if (friendResult.error || requestResult.error) {
      setError(
        friendResult.error?.message ||
        requestResult.error?.message ||
        "Die Freundesliste konnte nicht geladen werden."
      );
      setLoading(false);
      return;
    }

    const friendsWithImages = await Promise.all(
      (friendResult.data || []).map(async (friend) => {
        if (!friend.avatar_path) return { ...friend, avatarUrl: null };

        const { data } = await supabase.storage
          .from("profile-images")
          .createSignedUrl(friend.avatar_path, 3600);

        return {
          ...friend,
          avatarUrl: data?.signedUrl || null,
        };
      })
    );

    setFriends(friendsWithImages);
    setRequests(requestResult.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [userId]);

  async function searchUsers(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResults([]);

    if (search.trim().length < 2) {
      setError("Bitte gib mindestens 2 Zeichen ein.");
      return;
    }

    setSearching(true);

    const { data, error } = await supabase.rpc("search_users", {
      search_username: search.trim(),
    });

    setSearching(false);

    if (error) {
      setError(error.message);
      onPlaySound?.("error");
      return;
    }

    setResults(data || []);
    onPlaySound?.("tap");

    if (!data?.length) {
      setMessage("Keine passenden Nutzer gefunden.");
    }
  }

  async function sendRequest(targetId) {
    setBusyId(targetId);
    setError("");
    setMessage("");

    const { error } = await supabase.rpc("send_friend_request", {
      target_user_id: targetId,
    });

    setBusyId(null);

    if (error) {
      setError(error.message);
      onPlaySound?.("error");
      return;
    }

    setResults((current) =>
      current.filter((person) => person.user_id !== targetId)
    );
    setMessage("Freundschaftsanfrage wurde verschickt!");
    onPlaySound?.("success");
    await loadData();
  }

  async function removeFriend(friend) {
    const confirmed = window.confirm(
      `Möchtest du ${friend.username} wirklich aus deiner Freundesliste entfernen?`
    );

    if (!confirmed) return;

    setBusyId(friend.user_id);
    setError("");
    setMessage("");

    const { error } = await supabase.rpc("remove_friend", {
      target_user_id: friend.user_id,
    });

    setBusyId(null);

    if (error) {
      setError("Freund konnte nicht entfernt werden: " + error.message);
      onPlaySound?.("error");
      return;
    }

    setSelectedFriend(null);
    setMessage(`${friend.username} wurde aus deiner Freundesliste entfernt.`);
    onPlaySound?.("tap");
    await loadData();
  }

  async function respondToRequest(requestId, accept) {
    setBusyId(requestId);
    setError("");
    setMessage("");

    const { error } = await supabase.rpc("respond_friend_request", {
      request_id: requestId,
      accept,
    });

    setBusyId(null);

    if (error) {
      setError(error.message);
      onPlaySound?.("error");
      return;
    }

    setMessage(
      accept
        ? "Ihr seid jetzt miteinander befreundet!"
        : "Die Anfrage wurde abgelehnt."
    );
    onPlaySound?.(accept ? "success" : "tap");

    await loadData();
  }

  const incoming = requests.filter((request) => request.incoming);
  const outgoing = requests.filter((request) => !request.incoming);

  return (
    <section className="friends-page">
      <header className="section-hero friends-page-hero">
        <div>
          <span className="small-eyebrow">GEMEINSAM PLANEN</span>
          <h1>Deine Freunde</h1>
          <p>Entdecke Lieblingsgerichte und plant eure nächste Mahlzeit gemeinsam.</p>
        </div>
        <span className="section-hero-icon" aria-hidden="true">♧</span>
      </header>

      {error && <div className="friends-message friends-error" role="alert">{error}</div>}
      {message && <div className="friends-message friends-success" role="status">{message}</div>}

      <section className="friends-panel friends-search-panel">
        <div className="friends-panel-heading">
          <span className="friends-panel-icon">⌕</span>
          <div>
            <h2>Freunde finden</h2>
            <p>Suche nach dem Benutzernamen einer Person.</p>
          </div>
        </div>
        <form onSubmit={searchUsers} className="friends-search-form">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Benutzername eingeben ..."
            aria-label="Benutzername suchen"
          />
          <button type="submit" disabled={searching} className="friends-primary-button">
            {searching ? "Suche ..." : "Suchen"}
          </button>
        </form>
        {results.length > 0 && (
          <div className="friends-results">
            {results.map((person) => (
              <div className="friend-result-row" key={person.user_id}>
                <Avatar username={person.username} />
                <strong>{person.username}</strong>
                <button
                  type="button"
                  className="friends-secondary-button"
                  disabled={busyId === person.user_id}
                  onClick={() => sendRequest(person.user_id)}
                >
                  {busyId === person.user_id ? "Wird gesendet ..." : "＋ Hinzufügen"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="friends-loading"><span>🍊</span>Freundesliste wird geladen ...</div>
      ) : (
        <div className="friends-content-grid">
          <div className="friends-stack">
            {incoming.length > 0 && (
              <section className="friends-panel">
                <div className="friends-panel-heading">
                  <span className="friends-panel-icon">✉</span>
                  <div><h2>Eingehende Anfragen</h2><p>{incoming.length} warten auf deine Antwort</p></div>
                </div>
                {incoming.map((request) => (
                  <div className="friend-request-row" key={request.request_id}>
                    <Avatar username={request.username} />
                    <strong>{request.username}</strong>
                    <div className="friend-request-actions">
                      <button
                        type="button"
                        className="friends-primary-button"
                        disabled={busyId === request.request_id}
                        onClick={() => respondToRequest(request.request_id, true)}
                      >
                        Annehmen
                      </button>
                      <button
                        type="button"
                        className="friends-secondary-button"
                        disabled={busyId === request.request_id}
                        onClick={() => respondToRequest(request.request_id, false)}
                      >
                        Ablehnen
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
            {outgoing.length > 0 && (
              <section className="friends-panel">
                <div className="friends-panel-heading">
                  <span className="friends-panel-icon">◷</span>
                  <div><h2>Ausstehende Anfragen</h2><p>Deine gesendeten Einladungen</p></div>
                </div>
                {outgoing.map((request) => (
                  <div className="friend-outgoing-row" key={request.request_id}>
                    <span>{request.username}</span><strong>✓ Anfrage gesendet</strong>
                  </div>
                ))}
              </section>
            )}
          </div>

          <section className="friends-panel friends-list-panel">
            <div className="friends-panel-heading">
              <span className="friends-panel-icon">♡</span>
              <div><h2>Deine Freundesliste</h2><p>{friends.length} EssenPlan-Freunde</p></div>
            </div>
            {friends.length === 0 ? (
              <div className="friends-empty">
                <span>♧</span>
                <strong>Noch keine Freunde</strong>
                <p>Suche oben nach einem Benutzernamen und füge deine Freunde hinzu.</p>
              </div>
            ) : (
              <div className="friends-list">
                {friends.map((friend) => (
                  <button
                    className="friend-card"
                    key={friend.user_id}
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <Avatar url={friend.avatarUrl} username={friend.username} size={54} />
                    <span><strong>{friend.username}</strong><small>Dein EssenPlan-Freund</small></span>
                    <span className="friend-card-arrow">›</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {selectedFriend && (
        <div className="friend-modal-backdrop" onClick={() => setSelectedFriend(null)}>
          <section
            className="friend-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Profil von ${selectedFriend.username}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="friend-modal-close"
              onClick={() => setSelectedFriend(null)}
              aria-label="Profil schließen"
            >
              ×
            </button>
            <div className="friend-modal-profile">
              <Avatar url={selectedFriend.avatarUrl} username={selectedFriend.username} size={100} />
              <h2>{selectedFriend.username}</h2>
              <span>✓ Dein Freund</span>
              <p>Persönliches Geschmacksprofil</p>
            </div>
            <div className="friend-modal-tastes">
              <FoodSection
                title="❤️ Lieblingsgerichte"
                items={selectedFriend.taste_profile?.favorites || []}
                emptyText="Hier wurden noch keine Lieblingsgerichte ausgewählt."
              />
              <FoodSection
                title="🚫 Das mag ich nicht"
                items={selectedFriend.taste_profile?.dislikes || []}
                emptyText="Hier wurden noch keine Abneigungen ausgewählt."
              />
            </div>
            <button
              type="button"
              className="friend-remove-button"
              onClick={() => removeFriend(selectedFriend)}
              disabled={busyId === selectedFriend.user_id}
            >
              {busyId === selectedFriend.user_id ? "Wird entfernt ..." : "Freund entfernen"}
            </button>
            <button
              type="button"
              className="friends-primary-button friend-modal-done"
              onClick={() => setSelectedFriend(null)}
            >
              Schließen
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
