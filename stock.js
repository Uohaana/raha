/* Stock controller: authenticated inventory loading, filtering, and updates. */

const client = supabase.createClient(RAHA_SUPABASE_URL, RAHA_SUPABASE_ANON_KEY);
const login = document.querySelector("#login-panel");
const dashboard = document.querySelector("#stock-dashboard");
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
let products = [];
const showError = (message) => {
  errorMessage.textContent = message;
};
document.querySelector("#reset-button").addEventListener("click", async () => {
  const { error } = await client.auth.resetPasswordForEmail(
    emailInput.value.trim(),
    { redirectTo: `${location.origin}/stock.html` },
  );
  showError(error ? error.message : "Password reset email sent.");
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
    await loadStock();
  });
async function loadStock() {
  const { data, error } = await client
    .from("perfumes")
    .select("id,name,slug,tagline,notes,price,stock,status")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return showError(error.message);
  products = data || [];
  login.hidden = true;
  dashboard.hidden = false;
  render();
}
function render() {
  const query = document
    .querySelector("#stock-search")
    .value.trim()
    .toLowerCase();
  const filter = document.querySelector("#stock-filter").value;
  const rows = products.filter((p) => {
    const hay = `${p.name} ${p.tagline} ${p.notes}`.toLowerCase();
    return (
      (!query || hay.includes(query)) &&
      (filter === "all" ||
        (filter === "low" && Number(p.stock) < 15) ||
        (filter === "out" && Number(p.stock) <= 0))
    );
  });
  document.querySelector("#sku-count").textContent = products.filter(
    (p) => p.status === "published",
  ).length;
  document.querySelector("#stock-count").textContent = products.reduce(
    (sum, p) => sum + Number(p.stock || 0),
    0,
  );
  document.querySelector("#low-count").textContent = products.filter(
    (p) => Number(p.stock) < 15,
  ).length;
  document.querySelector("#stock-rows").innerHTML =
    rows
      .map(
        (p) =>
          `<tr class="${Number(p.stock) < 15 ? "is-low" : ""}"><td><strong>${esc(p.name)}</strong><small>${esc(p.notes)}</small></td><td>${esc(p.status)}</td><td>$${Number(p.price).toFixed(0)}</td><td><input class="stock-input" data-stock-id="${esc(p.id)}" type="number" min="0" max="9999" value="${Number(p.stock)}" aria-label="${esc(p.name)} units"></td><td><span class="reorder-badge ${Number(p.stock) < 15 ? "needs-reorder" : ""}">${Number(p.stock) < 15 ? "Review" : "Healthy"}</span></td><td><button class="save-row" data-save-id="${esc(p.id)}" type="button">Save</button></td></tr>`,
      )
      .join("") || '<tr><td colspan="6">No products match that view.</td></tr>';
  document
    .querySelectorAll("[data-save-id]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        saveStock(button.dataset.saveId, button),
      ),
    );
}
async function saveStock(id, button) {
  const input = document.querySelector(`[data-stock-id="${CSS.escape(id)}"]`);
  const stock = Math.max(0, Math.min(9999, Number(input.value) || 0));
  button.disabled = true;
  const { error } = await client
    .from("perfumes")
    .update({ stock })
    .eq("id", id);
  button.disabled = false;
  if (error)
    return (document.querySelector("#stock-message").textContent =
      error.message);
  const product = products.find((p) => p.id === id);
  if (product) product.stock = stock;
  document.querySelector("#stock-message").textContent =
    `${product?.name || "Stock"} updated to ${stock} units.`;
  render();
}
document.querySelector("#stock-search").addEventListener("input", render);
document.querySelector("#stock-filter").addEventListener("change", render);
document.querySelector("#logout").addEventListener("click", async () => {
  await client.auth.signOut();
  location.reload();
});
client.auth.getSession().then(({ data }) => {
  if (data.session) loadStock();
});
