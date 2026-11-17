/* Shared product page behavior: one controller keeps all 30 detail routes consistent. */
const productClient =
  window.RAHA_SUPABASE_CLIENT ||
  supabase.createClient(RAHA_SUPABASE_URL, RAHA_SUPABASE_ANON_KEY);
window.RAHA_SUPABASE_CLIENT = productClient;
const productSeed = window.RAHA_PRODUCT_SEED;
const escProduct = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const productMoney = (value) => `$${Number(value || 0).toFixed(0)}`;
let product = productSeed;
let cartItems = JSON.parse(localStorage.getItem("raha-cart") || "[]");
let selectedRating = 0;

async function loadProduct() {
  const { data } = await productClient
    .from("perfumes")
    .select("*")
    .eq("slug", productSeed.slug)
    .limit(1);
  if (data?.[0]) product = data[0];
  renderProduct();
  await loadComments();
}

function renderProduct() {
  const image =
    product.image_url ||
    product.image ||
    `/media/perfumes/webp/${product.slug}.webp`;
  const soldOut = Number(product.stock) <= 0;
  document.title = `RAHA — ${product.name}`;
  document.querySelector('meta[name="description"]').content =
    `${product.name} — ${product.tagline}. ${product.notes}.`;
  document.querySelector("#product-kicker").textContent =
    `Eau de parfum / ${String(productSeed.index).padStart(2, "0")}`;
  document.querySelector("#product-name").textContent = product.name;
  document.querySelector("#product-tagline").textContent = product.tagline;
  document.querySelector("#product-notes").textContent = product.notes;
  document.querySelector("#product-price").textContent = productMoney(
    product.price,
  );
  document.querySelector("#product-stock").textContent = soldOut
    ? "Currently unavailable"
    : `${product.stock} in the studio`;
  document.querySelector("#product-image").src = image;
  document.querySelector("#product-image").alt =
    `${product.name} perfume bottle`;
  document
    .querySelector("#product-image")
    .setAttribute("fetchpriority", "high");
  document.querySelector("#product-add").disabled = soldOut;
  document.querySelector("#product-add").innerHTML = soldOut
    ? "Sold out"
    : "Add to bag <span>↗</span>";
  document
    .querySelector("#product-add")
    .setAttribute(
      "aria-label",
      soldOut ? `${product.name} sold out` : `Add ${product.name} to bag`,
    );
  const favoriteButton = document.querySelector("#product-favorite");
  if (favoriteButton) {
    const liked = window.RAHA_FAVORITES?.isFavorite(product.id);
    favoriteButton.classList.toggle("is-favorite", !!liked);
    favoriteButton.setAttribute("aria-pressed", String(!!liked));
    favoriteButton.setAttribute(
      "aria-label",
      `${liked ? "Remove" : "Add"} ${product.name} ${liked ? "from" : "to"} favourites`,
    );
    favoriteButton.textContent = liked ? "♥" : "♡";
  }
  document.querySelector("#comment-product-name").textContent = product.name;
  updateCart();
}

async function loadComments() {
  const comments = document.querySelector("#comments-list");
  if (!product.id) {
    comments.innerHTML =
      '<p class="body-copy">Comments will appear as this composition gathers its first traces.</p>';
    return;
  }
  const { data, error } = await productClient
    .from("reviews")
    .select("title,body,rating,created_at")
    .eq("perfume_id", product.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data?.length) {
    comments.innerHTML =
      '<p class="body-copy">Be the first to leave a trace.</p>';
    return;
  }
  comments.innerHTML = data
    .map(
      (comment) =>
        `<article class="comment-card"><div class="comment-stars" aria-label="${comment.rating} out of 5">${"★".repeat(Number(comment.rating))}${"☆".repeat(5 - Number(comment.rating))}</div><h3>${escProduct(comment.title)}</h3><p>${escProduct(comment.body)}</p></article>`,
    )
    .join("");
}

function persistCart() {
  localStorage.setItem("raha-cart", JSON.stringify(cartItems));
  updateCart();
}
function updateCart() {
  document.querySelector("#cart-count").textContent = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  document.querySelector("#cart-items").innerHTML = cartItems.length
    ? cartItems
        .map(
          (item) =>
            `<div class="cart-item"><img src="${escProduct(item.image)}" alt=""><div><strong>${escProduct(item.name)}</strong><small>${productMoney(item.price)} · qty ${item.quantity}</small></div><button class="text-link" data-remove="${escProduct(item.id || item.slug)}" type="button" aria-label="Remove ${escProduct(item.name)}">×</button></div>`,
        )
        .join("")
    : '<p class="body-copy">Your bag is waiting for a first trace.</p>';
  document.querySelector("#cart-total").textContent = productMoney(
    cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0,
    ),
  );
  document.querySelectorAll("[data-remove]").forEach((button) =>
    button.addEventListener("click", () => {
      cartItems = cartItems.filter(
        (item) => (item.id || item.slug) !== button.dataset.remove,
      );
      persistCart();
    }),
  );
}
function openCart() {
  document.querySelector("#cart").classList.add("is-open");
  document.querySelector("#cart").setAttribute("aria-hidden", "false");
}
function addCurrentProduct() {
  if (Number(product.stock) <= 0) return;
  const key = product.id || product.slug;
  const existing = cartItems.find((item) => (item.id || item.slug) === key);
  if (existing) existing.quantity = Math.min(10, existing.quantity + 1);
  else
    cartItems.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image_url || product.image,
      quantity: 1,
    });
  persistCart();
  openCart();
}

async function submitComment(event) {
  event.preventDefault();
  const message = document.querySelector("#comment-message");
  const {
    data: { session },
  } = await productClient.auth.getSession();
  if (!session) {
    location.href = `/account.html?return=product&slug=${encodeURIComponent(product.slug)}`;
    return;
  }
  if (!selectedRating) {
    message.textContent = "Choose a rating first.";
    return;
  }
  const { error } = await productClient.from("reviews").insert({
    perfume_id: product.id,
    user_id: session.user.id,
    rating: selectedRating,
    title: document.querySelector("#comment-title").value.trim(),
    body: document.querySelector("#comment-body").value.trim(),
    status: "pending",
  });
  message.textContent = error
    ? error.message
    : "Thank you — your comment is awaiting approval.";
  if (!error) {
    event.target.reset();
    selectedRating = 0;
    document
      .querySelectorAll("[data-comment-rating]")
      .forEach((button) => button.classList.remove("selected"));
  }
}

async function submitCheckout(event) {
  event.preventDefault();
  const message = document.querySelector("#checkout-message");
  const {
    data: { session },
  } = await productClient.auth.getSession();
  if (!session) {
    location.href = `/account.html?return=product&slug=${encodeURIComponent(product.slug)}`;
    return;
  }
  if (!cartItems.length) {
    message.textContent = "Add a fragrance before checking out.";
    return;
  }
  const items = cartItems
    .filter((item) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        item.id || "",
      ),
    )
    .map((item) => ({
      perfume_id: item.id,
      quantity: Math.min(10, Math.max(1, Number(item.quantity) || 1)),
    }));
  if (items.length !== cartItems.length) {
    message.textContent = "Refresh this page to update your bag.";
    return;
  }
  const { data, error } = await productClient.rpc("place_order", {
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
  persistCart();
  event.target.reset();
  message.textContent = `Order ${order.order_id.slice(0, 8)} placed. We’ll be in touch.`;
}

document
  .querySelector("#product-add")
  .addEventListener("click", addCurrentProduct);
document
  .querySelector("#product-favorite")
  ?.addEventListener("click", async () => {
    const button = document.querySelector("#product-favorite");
    button.disabled = true;
    const result = await window.RAHA_FAVORITES?.toggleFavorite(product.id);
    button.disabled = false;
    if (result?.signedIn !== false && !result?.error) {
      button.classList.toggle("is-favorite", result.isFavorite);
      button.setAttribute("aria-pressed", String(result.isFavorite));
      button.setAttribute(
        "aria-label",
        `${result.isFavorite ? "Remove" : "Add"} ${product.name} ${result.isFavorite ? "from" : "to"} favourites`,
      );
      button.textContent = result.isFavorite ? "♥" : "♡";
    }
  });
document.querySelector(".bag-link").addEventListener("click", (event) => {
  event.preventDefault();
  openCart();
});
document.querySelector("#cart-close").addEventListener("click", () => {
  document.querySelector("#cart").classList.remove("is-open");
  document.querySelector("#cart").setAttribute("aria-hidden", "true");
});
document
  .querySelector("#comment-form")
  .addEventListener("submit", submitComment);
document
  .querySelector("#checkout-form")
  .addEventListener("submit", submitCheckout);
document.querySelectorAll("[data-comment-rating]").forEach((button) =>
  button.addEventListener("click", () => {
    selectedRating = Number(button.dataset.commentRating);
    document
      .querySelectorAll("[data-comment-rating]")
      .forEach((item) =>
        item.classList.toggle(
          "selected",
          Number(item.dataset.commentRating) <= selectedRating,
        ),
      );
  }),
);
loadProduct();
window.RAHA_FAVORITES?.ready.then(() => renderProduct());
