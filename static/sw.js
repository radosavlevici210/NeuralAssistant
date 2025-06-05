/**
 * AVA CORE™ Service Worker
 * Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.
 * Watermark: radosavlevici210@icloud.com
 * 
 * Provides offline functionality, background sync, and push notifications
 */

const CACHE_NAME = 'ava-core-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_FILES = [
    '/',
    '/monitor',
    '/static/style.css',
    '/static/script.js',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-512x512.png',
    '/manifest.json',
    OFFLINE_URL
];

// Install event - cache essential files
self.addEventListener('install', event => {
    console.log('[AVA CORE™] Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[AVA CORE™] Caching app files');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                console.log('[AVA CORE™] Service Worker installed successfully');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('[AVA CORE™] Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[AVA CORE™] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[AVA CORE™] Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    // Handle navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.open(CACHE_NAME)
                        .then(cache => {
                            return cache.match(OFFLINE_URL);
                        });
                })
        );
        return;
    }
    
    // Handle API requests with cache-first strategy for static assets
    if (event.request.url.includes('/static/')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request)
                        .then(response => {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                            return response;
                        });
                })
        );
        return;
    }
    
    // Handle other requests with network-first strategy
    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('[AVA CORE™] Background sync triggered:', event.tag);
    
    if (event.tag === 'background-chat') {
        event.waitUntil(syncOfflineChats());
    }
    
    if (event.tag === 'background-audio') {
        event.waitUntil(syncOfflineAudio());
    }
});

// Push notification handler
self.addEventListener('push', event => {
    console.log('[AVA CORE™] Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'AVA CORE™ notification',
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/icon-72x72.png',
        tag: 'ava-core-notification',
        data: {
            url: '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: 'Open AVA CORE™'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        silent: false,
        requireInteraction: false
    };
    
    event.waitUntil(
        self.registration.showNotification('AVA CORE™', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('[AVA CORE™] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handler for communication with main app
self.addEventListener('message', event => {
    console.log('[AVA CORE™] Message received:', event.data);
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        event.waitUntil(updateCache());
    }
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Sync offline chat messages
async function syncOfflineChats() {
    try {
        const db = await openIndexedDB();
        const offlineChats = await getOfflineChats(db);
        
        for (const chat of offlineChats) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(chat)
                });
                
                if (response.ok) {
                    await removeOfflineChat(db, chat.id);
                }
            } catch (error) {
                console.error('[AVA CORE™] Failed to sync chat:', error);
            }
        }
    } catch (error) {
        console.error('[AVA CORE™] Background sync failed:', error);
    }
}

// Sync offline audio recordings
async function syncOfflineAudio() {
    try {
        console.log('[AVA CORE™] Syncing offline audio recordings...');
        // Implementation for audio sync
    } catch (error) {
        console.error('[AVA CORE™] Audio sync failed:', error);
    }
}

// Update cache with new content
async function updateCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(CACHE_FILES);
        console.log('[AVA CORE™] Cache updated successfully');
    } catch (error) {
        console.error('[AVA CORE™] Cache update failed:', error);
    }
}

// IndexedDB helper functions
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AVACoreDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('offlineChats')) {
                const store = db.createObjectStore('offlineChats', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('offlineAudio')) {
                const store = db.createObjectStore('offlineAudio', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

function getOfflineChats(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['offlineChats'], 'readonly');
        const store = transaction.objectStore('offlineChats');
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function removeOfflineChat(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['offlineChats'], 'readwrite');
        const store = transaction.objectStore('offlineChats');
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// Performance monitoring
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'GET_PERFORMANCE') {
        const performanceData = {
            cacheSize: 0,
            lastSync: localStorage.getItem('lastSync'),
            offlineCapable: true,
            version: '1.0.0'
        };
        
        caches.open(CACHE_NAME).then(cache => {
            cache.keys().then(keys => {
                performanceData.cacheSize = keys.length;
                event.ports[0].postMessage(performanceData);
            });
        });
    }
});

console.log('[AVA CORE™] Service Worker loaded - Enterprise ready');