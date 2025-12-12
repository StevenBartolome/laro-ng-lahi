const CACHE_NAME = 'laro-ng-lahi-v1';
const ASSETS_TO_CACHE = [
    './',
    'index.php',
    'start_menu.php',
    'login.php',
    'register.php',
    'game_select.php',
    'assets/css/start_menu.css',
    'assets/css/settings_modal.css',
    'assets/css/game_select.css',
    'assets/js/AudioManager.js',
    'assets/js/SettingsModal.js',
    'assets/js/auth.js',
    'assets/js/firebase-config.js',
    'assets/startmenu/screen_title.png',
    'assets/startmenu/start_button.png',
    'assets/startmenu/fact_button.png',
    'assets/startmenu/achievements_button.png',
    'assets/startmenu/settings_button.png',
    'assets/startmenu/back_button.png',
    'assets/startmenu/select_game_title.png',
    'assets/startmenu/patintero_gamecard.png',
    'assets/startmenu/jolen_gamecard.png',
    'assets/startmenu/luksong_baka_gamecard.png',
    'assets/bgmusic/startmenuMusic.mp3',
    'assets/game_sfx/button_click_sound.mp3'
];

// Install Event - Cache Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event - Serve from Cache, fall back to Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }
                // Otherwise fetch from network
                return fetch(event.request).catch(() => {
                    // Optional: Return offline page if fetch fails and not in cache
                });
            })
    );
});
