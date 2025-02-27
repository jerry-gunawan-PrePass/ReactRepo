self.addEventListener('push', function(event) {
    const options = {
        body: event.data.text(),
        icon: '/icon.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification('Task Reminder', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
}); 