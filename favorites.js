/* RAHA shared account affordances: authenticated admin navigation and favourites. */
(() => {
  if (!window.supabase || !window.RAHA_SUPABASE_URL) return;
  const client = window.RAHA_SUPABASE_CLIENT || window.supabase.createClient(window.RAHA_SUPABASE_URL, window.RAHA_SUPABASE_ANON_KEY);
  window.RAHA_SUPABASE_CLIENT = client;
  let session = null;
  let favoriteIds = new Set();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function addAdminLink() {
    if (!document.querySelector('.raha-admin-link')) {
      const link = document.createElement('a');
      link.className = 'raha-admin-link'; link.href = '/studio-vault-9x.html'; link.title = 'Admin'; link.setAttribute('aria-label', 'Admin');
      link.innerHTML = '<span>Admin</span>';
      document.querySelector('.icon-nav')?.append(link);
      const mobile = document.querySelector('.mobile-menu');
      if (mobile) { const mobileLink = link.cloneNode(true); mobileLink.className = 'raha-admin-link'; mobile.append(mobileLink); }
    }
  }
  async function refreshAdminNav(currentSession = session) {
    if (!currentSession) return;
    const { data } = await client.from('admin_profiles').select('role').eq('id', currentSession.user.id).limit(1);
    if (data?.some(row => ['admin','editor'].includes(row.role))) addAdminLink();
  }
  async function loadFavorites(currentSession = session) {
    if (!currentSession) { favoriteIds = new Set(); return favoriteIds; }
    const { data } = await client.from('favorites').select('perfume_id').eq('user_id', currentSession.user.id).limit(100);
    favoriteIds = new Set((data || []).map(row => row.perfume_id));
    return favoriteIds;
  }
  async function toggleFavorite(perfumeId) {
    if (!session) { location.href = `/account.html?return=${encodeURIComponent(location.pathname)}`; return { signedIn: false }; }
    const isFavorite = favoriteIds.has(perfumeId);
    const result = isFavorite
      ? await client.from('favorites').delete().eq('user_id', session.user.id).eq('perfume_id', perfumeId)
      : await client.from('favorites').insert({ user_id: session.user.id, perfume_id: perfumeId });
    if (!result.error) { isFavorite ? favoriteIds.delete(perfumeId) : favoriteIds.add(perfumeId); }
    return { signedIn: true, isFavorite: !isFavorite, error: result.error };
  }
  window.RAHA_FAVORITES = {
    client,
    get session() { return session; },
    get ids() { return favoriteIds; },
    ready: (async () => {
      const timeout = new Promise(resolve => setTimeout(() => resolve({ data: { session: null } }), 2500));
      const result = await Promise.race([client.auth.getSession(), timeout]);
      session = result.data.session;
      if (session) await Promise.race([Promise.all([refreshAdminNav(), loadFavorites()]), new Promise(resolve => setTimeout(resolve, 2000))]);
      return { session, favoriteIds };
    })(),
    loadFavorites,
    toggleFavorite,
    isFavorite: id => favoriteIds.has(id),
    escape: esc
  };
  client.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    if (nextSession) { refreshAdminNav(nextSession); loadFavorites(nextSession); }
    else { favoriteIds = new Set(); document.querySelectorAll('.raha-admin-link').forEach(link => link.remove()); }
  });
})();
