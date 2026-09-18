const cache = new Map();

const CACHE_TTL = 5000; // 5 seconds

const getCache = (key) => {
    const cachedItem = cache.get(key);

    // Nothing stored for this key
    if (!cachedItem) {
        return null;
    }

    // Check whether cache has expired
    if (Date.now() > cachedItem.expiresAt) {
        cache.delete(key);

        console.log("[LEADS CACHE EXPIRED]", key);

        return null;
    }

    console.log("[LEADS CACHE HIT]", key);

    return cachedItem.data;
};


const setCache = (key, data) => {
    cache.set(key, {
        data,
        expiresAt: Date.now() + CACHE_TTL
    });

    console.log("[LEADS CACHE SET]", key);
};


const clearCache = () => {
    cache.clear();

    console.log("[LEADS CACHE CLEARED]");
};


module.exports = {
    getCache,
    setCache,
    clearCache
};