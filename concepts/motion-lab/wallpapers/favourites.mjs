export const favouritesKey = 'dannysimas-wallpaper-favourites-v1';
const validId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);

export function createFavourites(getStorage) {
  let ids = new Set(), persistent = true;
  function reload() {
    try {
      const raw = getStorage().getItem(favouritesKey);
      const data = raw ? JSON.parse(raw) : {version: 1, ids: []};
      ids = new Set(data?.version === 1 && Array.isArray(data.ids) ? data.ids.filter(validId).slice(0, 10000) : []);
      persistent = true;
    } catch { persistent = false; }
  }
  reload();
  return {
    has: id => ids.has(id),
    reload,
    get persistent() { return persistent; },
    toggle(id) {
      if (!validId(id)) throw new Error('Invalid wallpaper ID');
      if (ids.has(id)) ids.delete(id); else ids.add(id);
      try {
        getStorage().setItem(favouritesKey, JSON.stringify({version: 1, ids: [...ids]}));
        persistent = true;
      } catch { persistent = false; }
      return {saved: ids.has(id), persistent};
    }
  };
}
