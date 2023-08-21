const dyCache = 'dy-pwa-assets-0201';
const cacheName = 'pwa-assets-0201';
const toCache = [
    'https://recipinoy.onrender.com/',
    'https://recipinoy.onrender.com/home',
    'https://recipinoy.onrender.com/recipes',
    'https://recipinoy.onrender.com/saved',
    'https://recipinoy.onrender.com/mealPlan',
    'https://recipinoy.onrender.com/recommend',
    'https://recipinoy.onrender.com/grocery-list',
    'https://recipinoy.onrender.com/public/css/style.css',
    'https://recipinoy.onrender.com/public/js/script.js',
    'https://recipinoy.onrender.com/public/js/main.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css',
    'https://fonts.gstatic.com/s/rubik/v21/iJWKBXyIfDnIV7nBrXyw023e.woff2',
    'https://recipinoy.onrender.com/public/js/manifest.json',
    'https://unpkg.com/swiper@8/swiper-bundle.min.css',
    'https://unpkg.com/swiper@8/swiper-bundle.min.js',
    'https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/webfonts/fa-regular-400.woff2',
    'https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600&display=swap'
];

const precachedAssets = [
    'https://recipinoy.onrender.com/images/loader.gif',
    'https://recipinoy.onrender.com/images/logo/logo-for-nav.png',
    'https://recipinoy.onrender.com/images/logo/logo-recipinoy.png',
    'https://recipinoy.onrender.com/images/hero/home-img-1.png',
    'https://recipinoy.onrender.com/images/hero/home-img-2.png',
    'https://recipinoy.onrender.com/images/hero/home-img-3.png',
    'https://recipinoy.onrender.com/images/hero/home-img-4.png',
    "https://recipinoy.onrender.com/images/pinakbet.webp",
    "https://recipinoy.onrender.com/images/dinakdakan.webp",
    "https://recipinoy.onrender.com/images/igado.webp",
    "https://recipinoy.onrender.com/images/bagnet.webp",
    "https://recipinoy.onrender.com/images/papaitan.webp",
    "https://recipinoy.onrender.com/images/dinengdeng.webp",
    "https://recipinoy.onrender.com/images/royal_bibingka.webp",
    "https://recipinoy.onrender.com/images/bicol_express.webp",
    "https://recipinoy.onrender.com/images/laing.webp",
    "https://recipinoy.onrender.com/images/nilupak.webp",
    "https://recipinoy.onrender.com/images/pancit_bato.webp",
    "https://recipinoy.onrender.com/images/sinanglay_na_tilapia.webp",
    "https://recipinoy.onrender.com/images/chakoy.webp",
    "https://recipinoy.onrender.com/images/dinuguan_sa_gata.webp",
    "https://recipinoy.onrender.com/images/kandingga.webp",
    "https://recipinoy.onrender.com/images/sisig_kapampangan.webp",
    "https://recipinoy.onrender.com/images/bringhe.webp",
    "https://recipinoy.onrender.com/images/pulutok.webp",
    "https://recipinoy.onrender.com/images/pork_bulanglang.webp",
    "https://recipinoy.onrender.com/images/bulanglang_hipon_bangus.webp",
    "https://recipinoy.onrender.com/images/chicken_binakol.webp",
    "https://recipinoy.onrender.com/images/humba_bisaya.webp",
    "https://recipinoy.onrender.com/images/piyaya.webp",
    "https://recipinoy.onrender.com/images/cansi.webp",
    "https://recipinoy.onrender.com/images/tinuom_na_manok.webp",
    "https://recipinoy.onrender.com/images/inubarang_manok.webp",
    "https://recipinoy.onrender.com/images/suman_muron.webp",
    "https://recipinoy.onrender.com/images/laswa.webp",
    "https://recipinoy.onrender.com/images/pocherong_bisaya.webp",
    "https://recipinoy.onrender.com/images/batchoy.webp",
    "https://recipinoy.onrender.com/images/curacha.webp",
    "https://recipinoy.onrender.com/images/sinuglaw.webp",
    "https://recipinoy.onrender.com/images/pyanggang_chicken.webp",
    "https://recipinoy.onrender.com/images/tiyula.webp",
    "https://recipinoy.onrender.com/images/satti.webp",
    "https://recipinoy.onrender.com/images/biryani.webp",
    "https://recipinoy.onrender.com/images/chicken_pastil.webp",
    "https://recipinoy.onrender.com/images/pancit_canton.webp",
    "https://recipinoy.onrender.com/images/pancit_bihon_guisado.webp",
    "https://recipinoy.onrender.com/images/pancit_palabok.webp",
    "https://recipinoy.onrender.com/images/lechon.webp",
    "https://recipinoy.onrender.com/images/chicken_adobo.webp",
    "https://recipinoy.onrender.com/images/adobong_pusit.webp",
    "https://recipinoy.onrender.com/images/lumpia.webp",
    "https://recipinoy.onrender.com/images/kaldereta.webp",
    "https://recipinoy.onrender.com/images/kare_kare.webp",
    "https://recipinoy.onrender.com/images/tortang_talong.webp",
    "https://recipinoy.onrender.com/images/sinigang_na_baboy.webp",
    "https://recipinoy.onrender.com/images/sinigang_na_hipon.webp",
    "https://recipinoy.onrender.com/images/tapa.webp",
    "https://recipinoy.onrender.com/images/turon.webp",
    "https://recipinoy.onrender.com/images/crispy_pata.webp",
    "https://recipinoy.onrender.com/images/lechonkawali.webp",
    "https://recipinoy.onrender.com/images/bulalo.webp",
    "https://recipinoy.onrender.com/images/tocino.webp",
    "https://recipinoy.onrender.com/images/tinola.webp",
    "https://recipinoy.onrender.com/images/mechado.webp",
    "https://recipinoy.onrender.com/images/arroz-caldo.webp",
    "https://recipinoy.onrender.com/images/beef-pares.webp",
    "https://recipinoy.onrender.com/images/pork-menudo.webp",
    "https://recipinoy.onrender.com/images/champorado.webp",
    "https://recipinoy.onrender.com/images/bola-bola.webp",
    "https://recipinoy.onrender.com/images/afritada.webp",
    "https://recipinoy.onrender.com/images/paksiw.webp",
    "https://recipinoy.onrender.com/images/giniling.webp",
    "https://recipinoy.onrender.com/images/liempo.webp",
    "https://recipinoy.onrender.com/images/binagoongan.webp",
    "https://recipinoy.onrender.com/images/pinikpikan.webp",
    "https://recipinoy.onrender.com/images/bistek.webp",
    "https://recipinoy.onrender.com/images/nilaga.webp",
    "https://recipinoy.onrender.com/images/spaghetti.webp",
    "https://recipinoy.onrender.com/images/tupig.webp",
    "https://recipinoy.onrender.com/images/poquipoqui.webp",
    "https://recipinoy.onrender.com/images/dinardaraan.webp",
    "https://recipinoy.onrender.com/images/Sinanglaw.webp",
    "https://recipinoy.onrender.com/images/bukayo.webp",
    "https://recipinoy.onrender.com/images/ilocos_empanada.webp",
    "https://recipinoy.onrender.com/images/putobukayo.webp",
    "https://recipinoy.onrender.com/images/kinunot.webp",
    "https://recipinoy.onrender.com/images/pinangat.webp",
    "https://recipinoy.onrender.com/images/kinalas.webp",
    "https://recipinoy.onrender.com/images/sinapot.webp",
    "https://recipinoy.onrender.com/images/Sinantolan.webp",
    "https://recipinoy.onrender.com/images/balo-balo.webp",
    "https://recipinoy.onrender.com/images/morcon.webp",
    "https://recipinoy.onrender.com/images/pindangbabi.webp",
    "https://recipinoy.onrender.com/images/tibok-tibok.webp",
    "https://recipinoy.onrender.com/images/turronesdecasoy.webp",
    "https://recipinoy.onrender.com/images/chicken-inasal.webp",
    "https://recipinoy.onrender.com/images/lumpiang-ubod.webp",
    "https://recipinoy.onrender.com/images/chicken-molo-soup.webp",
    "https://recipinoy.onrender.com/images/kinilaw.webp",
    "https://recipinoy.onrender.com/images/binakol.webp",
    "https://recipinoy.onrender.com/images/otap.webp",
    "https://recipinoy.onrender.com/images/binangkal.webp",
    "https://recipinoy.onrender.com/images/shakoy.webp",
    "https://recipinoy.onrender.com/images/rosquillos.webp",
    "https://recipinoy.onrender.com/images/utan.webp",
    "https://recipinoy.onrender.com/images/rendang.webp",
    "https://recipinoy.onrender.com/images/knickerbocker.webp",
    "https://recipinoy.onrender.com/images/sampayna.webp",
    "https://recipinoy.onrender.com/images/piyalam.webp",
    "https://recipinoy.onrender.com/images/piyarengudang.webp",
    "https://recipinoy.onrender.com/images/beefkulma.webp",
    "https://recipinoy.onrender.com/images/hotsilog.webp",
    "https://recipinoy.onrender.com/images/pork_lauya.webp",
    "https://recipinoy.onrender.com/images/bananaque.webp",
    "https://recipinoy.onrender.com/images/Kalamay-hati.webp",
    "https://recipinoy.onrender.com/images/Maja-Blanca-Recipe.webp",
    "https://recipinoy.onrender.com/images/halayang-ube.webp",
    "https://recipinoy.onrender.com/images/inipitrecipe.webp",
    "https://recipinoy.onrender.com/images/filipino-brazo-de-mercedez.webp",
    "https://recipinoy.onrender.com/images/sylvanas-recipe.webp",
    "https://recipinoy.onrender.com/images/Palitaw.webp",
    "https://recipinoy.onrender.com/images/espasol.webp",
    "https://recipinoy.onrender.com/images/maruya.webp",
    "https://recipinoy.onrender.com/images/daingnabangus.webp",
    "https://recipinoy.onrender.com/images/kutsinta.webp",
    "https://recipinoy.onrender.com/images/sapin-sapin.webp",
    "https://recipinoy.onrender.com/images/cascaron.webp",
    "https://recipinoy.onrender.com/images/pancit-lomi.webp",
    "https://recipinoy.onrender.com/images/filipino-buko-pie.webp",
    "https://recipinoy.onrender.com/images/Pansit-Malabon1.webp",
    "https://recipinoy.onrender.com/images/ginataang-bilo-bilo.webp",
    "https://recipinoy.onrender.com/images/proben.webp",
    "https://recipinoy.onrender.com/images/kwek-kwek.webp",
    "https://recipinoy.onrender.com/images/sans-rival.webp",
    "https://recipinoy.onrender.com/images/puto.webp",
    "https://recipinoy.onrender.com/images/tapsilog.webp",
    "https://recipinoy.onrender.com/images/buchi.webp",
    "https://recipinoy.onrender.com/images/pichi-pichi.webp",
    "https://recipinoy.onrender.com/images/halo-halo.webp",
    "https://recipinoy.onrender.com/images/leche-flan.webp",
    "https://recipinoy.onrender.com/images/kapampangan-chicken-asado.webp",
];
//limiting cache size
const limitCache = (name, size) => {
    caches.open(name).then(cache => {
        cache.keys().then(keys => {
            if(keys.length > size){
                cache.delete(keys[0]).then(limitCache(name, size))
            }
        })
    })
}


// ------------------------------------------------------ install

self.addEventListener('install', event => {
    self.skipWaiting();
  // Precache assets on install
  event.waitUntil(caches.open(cacheName).then((cache) => {
    console.log('sw installed...');
    return cache.addAll(precachedAssets);
  }));

});

// -------------------------------------------------- activate
const deleteCache = async (key) => {
    await caches.delete(key);
  };
  
const deleteOldCaches = async () => {
    const cacheKeepList = dyCache;
    const keyList = await caches.keys();
    const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
    await Promise.all(cachesToDelete.map(deleteCache));
};
  
self.addEventListener("activate", (event) => {
    event.waitUntil(deleteOldCaches());
});


// -------------------------------------------------------------------- fetch
self.addEventListener('fetch', (event) => {
    if (event.request.method !== "GET") {
        return;
    }
    else{
        // Is this one of our precached assets?
        const isPrecachedRequest = precachedAssets.includes(event.request.url);
        if (isPrecachedRequest) {
            // Grab the precached asset from the cache
            event.respondWith(caches.open(cacheName).then((cache) => {
              return cache.match(event.request.url);
            }));
        }
        else{
                    // Open the cache
            event.respondWith(caches.open(dyCache).then((cache) => {
                // Go to the network first
                return fetch(event.request).then((fetchedResponse) => {
                    if(toCache.includes(event.request.url)){
                        cache.put(event.request.url, fetchedResponse.clone());
                        return fetchedResponse;
                    }
                    else{
                        return fetchedResponse;
                    }
                }).catch(() => {
                // If the network is unavailable, get
                return cache.match(event.request.url);
                });
            }));
        } 

    }
  });