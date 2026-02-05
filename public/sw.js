self.addEventListener('push', event => {
  let data = { title: 'Notification', body: 'You have a new message', url: '/', tag: 'general' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    console.error('Failed to parse push event data', e);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/img/stelsenlogo.png',
    badge: data.badge || '/img/stelsenlogo.png',
    tag: data.tag || 'general',
    renotify: true,
    data: {
      url: data.url || '/',
      payload: data.payload || null
    },
    vibrate: data.vibrate || [100, 50, 100],
    actions: data.actions || []
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Try to find an open window and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  // You may want to resubscribe here and send the new subscription to your server
  console.warn('Push subscription change event detected', event);
});
