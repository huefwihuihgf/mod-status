
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./LidlProducts.css";

export default function LidlProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("store_products")
        .select("*")
        .eq("store", "Lidl")
        .order("category", { ascending: true });

      if (error) {
        setError("Produkte konnten nicht geladen werden.");
        console.error(error);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    loadProducts();
  }, []);

  return (
    <section className="lidl-section">
      <div className="lidl-header">
        <div>
          <span className="lidl-eyebrow">LIDL · PRODUKTWELT</span>
          <h2>Entdecke Lebensmittel</h2>
          <p>Produkte und gespeicherte Preise auf einen Blick.</p>
        </div>

        <div className="lidl-product-count">
          {products.length}
          <small>Produkte</small>
        </div>
      </div>

      {loading && <p>Produkte werden geladen ...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <div className="lidl-grid">
          {products.map((product) => (
            <article className="lidl-card" key={product.id}>
              <div className="lidl-image-area">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="lidl-image-placeholder">
                    <span>🛒</span>
                    <small>Produktbild folgt</small>
                  </div>
                )}
              </div>

              <div className="lidl-card-content">
                <span className="lidl-category">
                  {product.category || "Lebensmittel"}
                </span>

                <span className="lidl-brand">
                  {product.brand || "Lidl"}
                </span>

                <h3>{product.product_name}</h3>

                <p className="lidl-size">
                  {product.package_quantity
                    ? `${product.package_quantity} ${product.package_unit || ""}`
                    : "Packungsgröße unbekannt"}
                </p>

                <div className="lidl-price-row">
                  <strong>
                    {Number(product.price).toFixed(2).replace(".", ",")} €
                  </strong>

                  <span>
                    {product.price_type === "estimate"
                      ? "Schätzung"
                      : product.price_type === "offer"
                      ? "Angebot"
                      : "Standardpreis"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p>Noch keine Lidl-Produkte gespeichert.</p>
      )}
    </section>
  );
}
