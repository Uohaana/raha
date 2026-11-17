/* Collection controller: catalog loading, filters, reviews, favourites, cart, and checkout. */

const client =
  window.RAHA_SUPABASE_CLIENT ||
  supabase.createClient(RAHA_SUPABASE_URL, RAHA_SUPABASE_ANON_KEY);
window.RAHA_SUPABASE_CLIENT = client;
const grid = document.querySelector("#collection-grid"),
  reviewStats = {};
let products = [],
  cartItems = JSON.parse(localStorage.getItem("raha-cart") || "[]"),
  selectedRating = 0;
const money = (value) => `$${Number(value || 0).toFixed(0)}`;
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[char],
  );
const isUUID = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || "",
  );
async function loadReviews() {
  try {
    const result = await Promise.race([
      client
        .from("reviews")
        .select("perfume_id,rating")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(200),
      new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 1800)),
    ]);
    (result.data || []).forEach((review) => {
      reviewStats[review.perfume_id] ??= { sum: 0, count: 0 };
      reviewStats[review.perfume_id].sum += review.rating;
      reviewStats[review.perfume_id].count += 1;
    });
  } catch (_) {}
}
function persist() {
  localStorage.setItem("raha-cart", JSON.stringify(cartItems));
  renderCart();
}
function ratingMarkup(stat) {
  if (!stat.count)
    return '<span class="rating-summary is-new">New composition</span>';
  const average = (stat.sum / stat.count).toFixed(1);
  return `<span class="rating-summary" aria-label="Rated ${average} out of 5 from ${stat.count} reviews"><span class="stars" aria-hidden="true">★★★★★</span> ${average} · ${stat.count} review${stat.count === 1 ? "" : "s"}</span>`;
}
let activeFilter = "all";
const filterTerms = {
  all: "",
  amber: "amber resin saffron honey cognac",
  wood: "wood cedar oud sandal sandalwood vetiver incense leather",
  floral: "rose petal iris violet blossom",
  mineral: "mineral stone salt musk rain mist",
};
function visibleProducts() {
  const query =
    document.querySelector("#collection-search")?.value.trim().toLowerCase() ||
    "";
  const terms = filterTerms[activeFilter] || "";
  return products.filter((product) => {
    const haystack =
      `${product.name} ${product.tagline} ${product.notes}`.toLowerCase();
    return (
      (!query || haystack.includes(query)) &&
      (!terms || terms.split(" ").some((term) => haystack.includes(term)))
    );
  });
}
function renderProducts() {
  const visible = visibleProducts();
  grid.innerHTML = visible.length
    ? visible
        .map((product) => {
          const stat = reviewStats[product.id] || { sum: 0, count: 0 };
          const image =
            product.image_url ||
            product.image ||
            `/media/perfumes/webp/${product.slug}.webp`;
          const soldOut = Number(product.stock) <= 0;
          return `<article class="perfume-card" data-product="${escapeHTML(product.id || product.slug)}"><div class="perfume-image"><img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)} perfume bottle" loading="lazy" decoding="async"><span>${escapeHTML(product.notes || "Limited edition")}</span>${soldOut ? '<b class="stock-flag">SOLD OUT</b>' : ""}</div><div class="perfume-meta"><div><p class="eyebrow">${escapeHTML(product.tagline)}</p><h2><a class="product-title-link" href="/products/${escapeHTML(product.slug)}.html">${escapeHTML(product.name)}</a></h2></div><strong>${money(product.price)}</strong></div><p class="card-note">${escapeHTML(product.notes || "")}</p><div class="card-actions">${ratingMarkup(stat)}<button class="favorite-button ${window.RAHA_FAVORITES?.isFavorite(product.id) ? "is-favorite" : ""}" data-favorite="${escapeHTML(product.id || product.slug)}" type="button" aria-label="${window.RAHA_FAVORITES?.isFavorite(product.id) ? "Remove" : "Add"} ${escapeHTML(product.name)} ${window.RAHA_FAVORITES?.isFavorite(product.id) ? "from" : "to"} favourites" aria-pressed="${window.RAHA_FAVORITES?.isFavorite(product.id) ? "true" : "false"}">♡</button><button class="text-link add-button" data-add="${escapeHTML(product.id || product.slug)}" type="button" ${soldOut ? "disabled" : ""}>${soldOut ? "Sold out" : "Add to bag"} <span>↗</span></button><button class="text-link review-button" data-review="${escapeHTML(product.id || product.slug)}" type="button">Review</button></div></article>`;
        })
        .join("")
    : '<p class="collection-empty">No fragrance matches that trace.</p>';
  grid.querySelectorAll("[data-add]").forEach((button) =>
    button.addEventListener("click", () => {
      const product = products.find(
        (item) => (item.id || item.slug) === button.dataset.add,
      );
      if (!product) return;
      const existing = cartItems.find((item) => item.id === product.id);
      existing
        ? (existing.quantity += 1)
        : cartItems.push({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.image_url || product.image,
            quantity: 1,
          });
      persist();
      openCart();
    }),
  );
  grid
    .querySelectorAll("[data-review]")
    .forEach((button) =>
      button.addEventListener("click", () => openReview(button.dataset.review)),
    );
  grid.querySelectorAll("[data-favorite]").forEach((button) =>
    button.addEventListener("click", async () => {
      button.disabled = true;
      const result = await window.RAHA_FAVORITES?.toggleFavorite(
        button.dataset.favorite,
      );
      button.disabled = false;
      if (!result?.error && result?.signedIn !== false) {
        button.classList.toggle("is-favorite", result.isFavorite);
        button.setAttribute("aria-pressed", String(result.isFavorite));
        button.setAttribute(
          "aria-label",
          `${result.isFavorite ? "Remove" : "Add"} ${products.find((item) => (item.id || item.slug) === button.dataset.favorite)?.name || "scent"} ${result.isFavorite ? "from" : "to"} favourites`,
        );
      }
    }),
  );
}
function renderCart() {
  document.querySelector("#cart-count").textContent = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  document.querySelector("#cart-items").innerHTML = cartItems.length
    ? cartItems
        .map(
          (item) =>
            `<div class="cart-item"><img src="${escapeHTML(item.image || `/media/perfumes/webp/${item.slug}.webp`)}" alt=""><div><strong>${escapeHTML(item.name)}</strong><small>${money(item.price)} · qty ${item.quantity}</small></div><button class="text-link" data-remove="${escapeHTML(item.id)}" type="button" aria-label="Remove ${escapeHTML(item.name)}">×</button></div>`,
        )
        .join("")
    : '<p class="body-copy">Your bag is waiting for a first trace.</p>';
  document.querySelector("#cart-total").textContent = money(
    cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0,
    ),
  );
  document.querySelectorAll("[data-remove]").forEach((button) =>
    button.addEventListener("click", () => {
      cartItems = cartItems.filter((item) => item.id !== button.dataset.remove);
      persist();
    }),
  );
}
function openCart() {
  document.querySelector("#cart").classList.add("is-open");
  document.querySelector("#cart").setAttribute("aria-hidden", "false");
}
document.querySelector(".bag-link")?.addEventListener("click", (event) => {
  event.preventDefault();
  openCart();
});
document.querySelector("#cart-close").addEventListener("click", () => {
  document.querySelector("#cart").classList.remove("is-open");
  document.querySelector("#cart").setAttribute("aria-hidden", "true");
});
function openReview(id) {
  document.querySelector("#review-modal").hidden = false;
  document.querySelector("#review-perfume-id").value = id;
  selectedRating = 0;
  document
    .querySelectorAll("[data-rating]")
    .forEach((button) => button.classList.remove("selected"));
  document.querySelector("#review-message").textContent = "";
}
document
  .querySelector("#review-close")
  .addEventListener(
    "click",
    () => (document.querySelector("#review-modal").hidden = true),
  );
document.querySelectorAll("[data-rating]").forEach((button) =>
  button.addEventListener("click", () => {
    selectedRating = Number(button.dataset.rating);
    document
      .querySelectorAll("[data-rating]")
      .forEach((item) =>
        item.classList.toggle(
          "selected",
          Number(item.dataset.rating) <= selectedRating,
        ),
      );
  }),
);
document
  .querySelector("#review-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#review-message");
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) {
      location.href = "/account.html?return=collection";
      return;
    }
    if (!selectedRating) {
      message.textContent = "Choose a rating first.";
      return;
    }
    const { error } = await client.from("reviews").insert({
      perfume_id: document.querySelector("#review-perfume-id").value,
      user_id: session.user.id,
      rating: selectedRating,
      title: document.querySelector("#review-title-input").value.trim(),
      body: document.querySelector("#review-body").value.trim(),
      status: "pending",
    });
    message.textContent = error
      ? error.message
      : "Thank you — your review is awaiting approval.";
    if (!error) event.target.reset();
  });
document
  .querySelector("#checkout-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#checkout-message");
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) {
      location.href = "/account.html?return=collection";
      return;
    }
    if (!cartItems.length) {
      message.textContent = "Add a fragrance before checking out.";
      return;
    }
    const items = cartItems
      .filter((item) => isUUID(item.id))
      .map((item) => ({
        perfume_id: item.id,
        quantity: Math.min(10, Math.max(1, Number(item.quantity) || 1)),
      }));
    if (items.length !== cartItems.length) {
      message.textContent = "Refresh the collection to update your bag.";
      return;
    }
    const { data, error } = await client.rpc("place_order", {
      p_items: items,
      p_shipping: {
        name: document.querySelector("#checkout-name").value.trim(),
        address: document.querySelector("#checkout-address").value.trim(),
      },
    });
    if (error) {
      message.textContent = error.message.replace(/^.*?ERROR:\s*/, "");
      return;
    }
    const order = Array.isArray(data) ? data[0] : data;
    cartItems = [];
    persist();
    event.target.reset();
    message.textContent = `Order ${order.order_id.slice(0, 8)} placed. We’ll be in touch.`;
  });
document
  .querySelector("#collection-search")
  ?.addEventListener("input", renderProducts);
document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((item) => item.classList.toggle("is-active", item === button));
    renderProducts();
  }),
);
(async () => {
  const productRequest = Promise.race([
    rahaFetchProducts(),
    new Promise((resolve) =>
      setTimeout(() => resolve(window.RAHA_PRODUCTS || []), 1800),
    ),
  ]);
  const [, loadedProducts] = await Promise.all([loadReviews(), productRequest]);
  products = loadedProducts;
  cartItems = cartItems.filter((item) =>
    products.some((product) => product.id === item.id),
  );
  renderProducts();
  renderCart();
  window.RAHA_FAVORITES?.ready.then(() => renderProducts());
})();
