/* Studio controller: authenticated catalog, order, and review overview. */

const client = supabase.createClient(RAHA_SUPABASE_URL, RAHA_SUPABASE_ANON_KEY);
const login = document.querySelector("#login-panel");
const dashboard = document.querySelector("#dashboard");
const errorMessage = document.querySelector("#login-error");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
const showError = (message) => {
  errorMessage.textContent = message;
};
document.querySelector("#reset-button").addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) return showError("Enter your admin email first.");
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/studio-vault-9x.html`,
  });
  showError(
    error
      ? error.message
      : "Password reset email sent. Check the inbox for the admin account.",
  );
});
document
  .querySelector("#login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const { error } = await client.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });
    if (error) return showError(error.message);
    passwordInput.value = "";
    await showDashboard();
  });
async function showDashboard() {
  login.hidden = true;
  dashboard.hidden = false;
  const { data, error } = await client
    .from("perfumes")
    .select("id,name,tagline,price,stock,status")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return showError(error.message);
  const rows = data || [];
  document.querySelector("#sku-count").textContent = rows.filter(
    (row) => row.status === "published",
  ).length;
  document.querySelector("#stock-count").textContent = rows.reduce(
    (total, row) => total + Number(row.stock || 0),
    0,
  );
  document.querySelector("#low-count").textContent = rows.filter(
    (row) => Number(row.stock) < 15,
  ).length;
  document.querySelector("#product-rows").innerHTML = rows
    .map(
      (product) =>
        `<tr><td><strong>${esc(product.name)}</strong><small>${esc(product.tagline)}</small></td><td>${esc(product.status)}</td><td>$${Number(product.price).toFixed(0)}</td><td>${Number(product.stock)}</td><td><a class="save-row" href="/stock.html">Manage</a></td></tr>`,
    )
    .join("");
  await loadOperations();
}
async function loadOperations() {
  const [{ data: orders }, { data: reviews }] = await Promise.all([
    client
      .from("orders")
      .select("id,email,total,status")
      .order("created_at", { ascending: false })
      .limit(50),
    client
      .from("reviews")
      .select("id,title,rating,status,perfumes(name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  document.querySelector("#order-rows").innerHTML =
    (orders || [])
      .map(
        (order) =>
          `<tr><td><strong>${esc(order.id.slice(0, 8))}</strong><small>${esc(order.email)}</small></td><td>${esc(order.status)}</td><td>$${Number(order.total).toFixed(0)}</td></tr>`,
      )
      .join("") || '<tr><td colspan="3">No orders yet.</td></tr>';
  document.querySelector("#review-rows").innerHTML =
    (reviews || [])
      .map(
        (review) =>
          `<tr><td><strong>${esc(review.title)}</strong><small>${esc(review.perfumes?.name || "RAHA")} · ${Number(review.rating)}/5</small></td><td>${esc(review.status)}</td><td><a class="save-row" href="/stock.html">Open</a></td></tr>`,
      )
      .join("") || '<tr><td colspan="3">No reviews yet.</td></tr>';
}
document.querySelector("#logout").addEventListener("click", async () => {
  await client.auth.signOut();
  location.reload();
});
client.auth.getSession().then(({ data }) => {
  if (data.session) showDashboard();
});
