/* Account controller: authentication, password reset, order history, and favourites dashboard. */

const client =
  window.RAHA_SUPABASE_CLIENT ||
  supabase.createClient(RAHA_SUPABASE_URL, RAHA_SUPABASE_ANON_KEY);
window.RAHA_SUPABASE_CLIENT = client;
let mode = "signin";
const form = document.querySelector("#account-form"),
  msg = document.querySelector("#account-message"),
  title = document.querySelector("#account-title"),
  submit = document.querySelector("#account-submit"),
  googleButton = document.querySelector("#google-button"),
  resetButton = document.querySelector("#account-reset"),
  signedIn = document.querySelector("#signed-in");
const setMode = (next) => {
  mode = next;
  document
    .querySelector("#signin-tab")
    .classList.toggle("active", mode === "signin");
  document
    .querySelector("#signup-tab")
    .classList.toggle("active", mode === "signup");
  title.innerHTML =
    mode === "signin"
      ? "Stay<br><em>close.</em>"
      : "Begin<br><em>the trace.</em>";
  submit.innerHTML =
    mode === "signin"
      ? "Sign in <span>↗</span>"
      : "Create account <span>↗</span>";
  googleButton.hidden = mode === "signup";
  resetButton.hidden = mode === "signup";
  msg.textContent = "";
};
document.querySelector("#signin-tab").onclick = () => setMode("signin");
document.querySelector("#signup-tab").onclick = () => setMode("signup");
resetButton.onclick = async () => {
  const email = document.querySelector("#account-email").value.trim();
  if (!email) {
    msg.textContent = "Enter your account email first.";
    return;
  }
  resetButton.disabled = true;
  resetButton.textContent = "Sending…";
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/account.html`,
  });
  resetButton.disabled = false;
  resetButton.textContent = "Forgot password?";
  msg.textContent = error
    ? error.message
    : "Password reset email sent. Check your inbox.";
};
form.onsubmit = async (e) => {
  e.preventDefault();
  msg.textContent = "";
  submit.disabled = true;
  submit.classList.add("is-loading");
  submit.innerHTML = mode === "signin" ? "Signing in…" : "Creating account…";
  const email = document.querySelector("#account-email").value.trim(),
    password = document.querySelector("#account-password").value;
  const result =
    mode === "signin"
      ? await client.auth.signInWithPassword({ email, password })
      : await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: location.origin + "/account.html" },
        });
  submit.disabled = false;
  submit.classList.remove("is-loading");
  submit.innerHTML =
    mode === "signin"
      ? "Sign in <span>↗</span>"
      : "Create account <span>↗</span>";
  if (result.error) {
    msg.textContent = result.error.message;
    return;
  }
  if (mode === "signup") {
    msg.textContent = "Check your email to confirm your RAHA account.";
  } else showSignedIn(result.data.session?.user);
};
googleButton.onclick = async () => {
  msg.textContent = "Connecting to Google…";
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${location.origin}/account.html` },
  });
  if (error)
    msg.textContent =
      "Google sign-in is not enabled yet. Please use email sign-in or ask the site administrator to enable Google in Supabase Auth.";
};
async function loadOrders(user) {
  const { data, error } = await client
    .from("orders")
    .select("id,total,status,created_at,order_items(product_name,quantity)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const box = document.querySelector("#order-history");
  if (error || !data?.length) {
    box.innerHTML =
      '<p class="body-copy">No orders yet. Your first trace is waiting in the collection.</p>';
    return;
  }
  box.innerHTML = data
    .map(
      (o) =>
        `<article class="order-row"><div><strong>Order ${o.id.slice(0, 8)}</strong><small>${new Date(o.created_at).toLocaleDateString()} · ${(o.order_items || []).map((i) => `${i.product_name} × ${i.quantity}`).join(", ")}</small></div><span>${o.status}</span><b>$${Number(o.total).toFixed(0)}</b></article>`,
    )
    .join("");
}
async function loadFavorites(user) {
  const box = document.querySelector("#favorite-history");
  const { data, error } = await client
    .from("favorites")
    .select(
      "perfume_id,created_at,perfumes(id,slug,name,tagline,price,image_url,notes)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    box.innerHTML =
      '<p class="body-copy">Favourites are temporarily unavailable. Please try again.</p>';
    return;
  }
  if (!data?.length) {
    box.innerHTML =
      '<p class="body-copy">No favourites yet. Tap the heart on any composition to keep it close.</p>';
    return;
  }
  box.innerHTML = data
    .map((row) => {
      const p = row.perfumes;
      if (!p) return "";
      return `<article class="favorite-card"><a href="/products/${encodeURIComponent(p.slug)}.html"><img src="${window.RAHA_FAVORITES.escape(p.image_url || `/media/perfumes/webp/${p.slug}.webp`)}" alt="${window.RAHA_FAVORITES.escape(p.name)} perfume bottle" loading="lazy"><div><p class="eyebrow">${window.RAHA_FAVORITES.escape(p.tagline)}</p><h3>${window.RAHA_FAVORITES.escape(p.name)}</h3><span>${window.RAHA_FAVORITES.escape(p.notes || "")}</span></div></a><button class="text-link remove-favorite" data-favorite-id="${p.id}" type="button">Remove</button></article>`;
    })
    .join("");
  box.querySelectorAll(".remove-favorite").forEach(
    (button) =>
      (button.onclick = async () => {
        button.disabled = true;
        await window.RAHA_FAVORITES.toggleFavorite(button.dataset.favoriteId);
        await loadFavorites(user);
      }),
  );
}
async function showSignedIn(user) {
  if (!user) {
    msg.textContent = "Your session expired. Please sign in again.";
    return;
  }
  form.hidden = true;
  document.querySelector(".account-tabs").hidden = true;
  signedIn.hidden = false;
  await window.RAHA_FAVORITES?.ready;
  await Promise.all([loadOrders(user), loadFavorites(user)]);
}
setMode("signin");
window.RAHA_FAVORITES?.ready.then(
  ({ session }) => session && showSignedIn(session),
);
document.querySelector("#account-signout").onclick = async () => {
  await client.auth.signOut();
  location.reload();
};
