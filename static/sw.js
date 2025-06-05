/**
 * Service Worker for Neural Assistant - AVA
 * Copyright: Ervin Remus Radosavlevici (© ervin210@icloud.com)
 * Watermark: radosavlevici210@icloud.com
 * Contact: radosavlevici210@icloud.com
 * 
 * Enables offline functionality and app installation on iPhone
 */

const CACHE_NAME = 'neural-assistant-ava-v1.0.0';
const COPYRIGHT_OWNER = 'Ervin Remus Radosavlevici (© ervin210@icloud.com, radosavlevici210@icloud.com)';
const CONTACT_EMAIL = 'ervin210@icloud.com, radosavlevici210@icloud.com';

// Files to cache for offline functionality
const urlsToCache = [
    '/',
    '/static/black_theme.css',
    '/static/water_effects.css',
    '/static/interactive_water_effects.js',
    '/static/manifest.json',
    'https://cdn.socket.io/4.7.5/socket.io.min.js',
    'https://unpkg.com/feather-icons'
];

// Install event - cache essential files
self.addEventListener('install', event => {
    console.log('[SW] Installing Neural Assistant Service Worker');
    console.log('[SW] Copyright:', COPYRIGHT_OWNER);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.log('[SW] Caching failed:', error);
                // Continue without caching if network fails
                return Promise.resolve();
            })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Neural Assistant Service Worker');
    console.log('[SW] Copyright Owner:', COPYRIGHT_OWNER);
    console.log('[SW] Contact:', CONTACT_EMAIL);
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim all clients immediately
    self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Handle API requests differently
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // If online, return the response
                    return response;
                })
                .catch(() => {
                    // If offline, return a custom offline response for API calls
                    return new Response(
                        JSON.stringify({
                            success: false,
                            offline: true,
                            message: 'Neural Assistant is offline. Voice features will resume when connection is restored.',
                            copyright: COPYRIGHT_OWNER,
                            contact: CONTACT_EMAIL
                        }),
                        {
                            status: 503,
                            statusText: 'Service Unavailable - Offline',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Copyright': COPYRIGHT_OWNER,
                                'X-Contact': CONTACT_EMAIL
                            }
                        }
                    );
                })
        );
        return;
    }
    
    // Handle regular requests with cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response for caching
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // If both cache and network fail, return offline page
                        if (event.request.destination === 'document') {
                            return caches.match('/');
                        }
                        
                        // For other resources, return empty response
                        return new Response('', {
                            status: 503,
                            statusText: 'Service Unavailable - Offline'
                        });
                    });
            })
    );
});

// Handle background sync for offline actions
self.addEventListener('sync', event => {
    console.log('[SW] Background sync triggered:', event.tag);
    
    if (event.tag === 'voice-commands') {
        event.waitUntil(syncVoiceCommands());
    }
});

async function syncVoiceCommands() {
    try {
        // Sync any pending voice commands when connection is restored
        const pendingCommands = await getStoredCommands();
        
        for (const command of pendingCommands) {
            try {
                await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(command)
                });
                
                // Remove command from storage after successful sync
                await removeStoredCommand(command.id);
            } catch (error) {
                console.log('[SW] Failed to sync command:', error);
            }
        }
    } catch (error) {
        console.log('[SW] Background sync failed:', error);
    }
}

async function getStoredCommands() {
    // Implementation would retrieve commands from IndexedDB
    return [];
}

async function removeStoredCommand(commandId) {
    // Implementation would remove command from IndexedDB
    return Promise.resolve();
}

// Handle push notifications for voice responses
self.addEventListener('push', event => {
    console.log('[SW] Push notification received');
    
    const options = {
        body: 'AVA has a response for you',
        icon: '/static/icon-192.png',
        badge: '/static/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1,
            copyright: COPYRIGHT_OWNER
        },
        actions: [
            {
                action: 'open-app',
                title: 'Open AVA',
                icon: '/static/icon-open.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/static/icon-close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Neural Assistant - AVA', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'open-app') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling for communication with main app
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_COPYRIGHT') {
        event.ports[0].postMessage({
            copyright: COPYRIGHT_OWNER,
            contact: CONTACT_EMAIL,
            watermark: 'radosavlevici210@icloud.com'
        });
    }
});

console.log('[SW] Neural Assistant Service Worker loaded');
console.log('[SW] Copyright:', COPYRIGHT_OWNER);
console.log('[SW] Contact:', CONTACT_EMAIL);