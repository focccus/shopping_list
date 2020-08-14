'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "9134406b0999e1ba8693e74b2a1312b9",
"assets/assets/undraw_empty.png": "ca7af876bad3a81cacddfa3d6b77cc09",
"assets/FontManifest.json": "439e76ffae5fc4c91e4b36731c091f98",
"assets/fonts/MaterialIcons-Regular.otf": "a68d2a28c526b3b070aefca4bac93d25",
"assets/fonts/MaterialIcons-Regular.ttf": "56d3ffdef7a25659eab6a68a3fbfaf16",
"assets/LICENSE": "e9b733434a873930d9f4d59613d956ff",
"assets/LiquidIcons.ttf": "231c34dd27bba6b43abe0f66b9dcd5a0",
"assets/NOTICES": "6a48bb68fb4e2560692cd6c1deb293ac",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "9a62a954b81a1ad45a58b9bcea89b50b",
"assets/packages/fluix/fonts/Lato-Black.ttf": "1233fdf19c04333c7f58af4eb8698452",
"assets/packages/fluix/fonts/Lato-BlackItalic.ttf": "e0d428e2113a119814da366401ad3362",
"assets/packages/fluix/fonts/Lato-Bold.ttf": "eb9532033c2adf99b1314611b5e9cd0e",
"assets/packages/fluix/fonts/Lato-BoldItalic.ttf": "01577cc25f44d5cd3451a5e0da715917",
"assets/packages/fluix/fonts/Lato-Hairline.ttf": "a2e8f8eef2ec2047a32e2d6a152a0311",
"assets/packages/fluix/fonts/Lato-HairlineItalic.ttf": "2bbb788763716d2d716cfcb5bc3e92f1",
"assets/packages/fluix/fonts/Lato-Heavy.ttf": "093466c99afdd5e38cfe3062dbcbba6b",
"assets/packages/fluix/fonts/Lato-HeavyItalic.ttf": "bafcb4e83847db36fa96602c4abca98d",
"assets/packages/fluix/fonts/Lato-Italic.ttf": "e0867c8fb91d45453b9d3a578b66dca8",
"assets/packages/fluix/fonts/Lato-Light.ttf": "90e1d3559ac52f7f0f77a86e1bfd632d",
"assets/packages/fluix/fonts/Lato-LightItalic.ttf": "7e9668b13f86893fb0a4a6e35965c107",
"assets/packages/fluix/fonts/Lato-Medium.ttf": "863b7dcd5ec2c3923122af25ce0f7e4c",
"assets/packages/fluix/fonts/Lato-MediumItalic.ttf": "ba4dbd0809f13b78b621a042efaed7d5",
"assets/packages/fluix/fonts/Lato-Regular.ttf": "3b9b99039cc0a98dd50c3cbfac57ccb2",
"assets/packages/fluix/fonts/Lato-Semibold.ttf": "3c6cfb1aebd888a0eb4c8fba94140fa6",
"assets/packages/fluix/fonts/Lato-SemiboldItalic.ttf": "c969278938eaacc998eab23bce2a1d0c",
"assets/packages/fluix/fonts/Lato-Thin.ttf": "eb1635403cd764912ca1e0af78735797",
"assets/packages/fluix/fonts/Lato-ThinItalic.ttf": "29f53f3450c6691e4195d082647aa8ca",
"assets/packages/fluix/fonts/LiquidIcons.ttf": "231c34dd27bba6b43abe0f66b9dcd5a0",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"index.html": "5f6f120a9d3072bc104686059683373d",
"/": "5f6f120a9d3072bc104686059683373d",
"main.dart.js": "1d7128584cb4940efafebf6889ceda31",
"manifest.json": "0ceccd831badde5b973e7af798d27ec1"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      // Provide a 'reload' param to ensure the latest version is downloaded.
      return cache.addAll(CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#')) {
    key = '/';
  }
  // If the URL is not the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache. Ensure the resources are not cached
        // by the browser for longer than the service worker expects.
        var modifiedRequest = new Request(event.request, {'cache': 'reload'});
        return response || fetch(modifiedRequest).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    return self.skipWaiting();
  }

  if (event.message === 'downloadOffline') {
    downloadOffline();
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
