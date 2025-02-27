self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/icon.png',
        badge: '/badge.png'
    };

    event.waitUntil(
        self.registration.showNotification('Task Reminder', options)
    );
}); 