self.addEventListener('push', ev => {
    const data = ev.data.json();
    self.registration.showNotification('New cases near you', {
        body: `New Locations today: \n${data.join('\n')}`,
        actions: [
            {
                action: 'view',
                title: 'View more',
            }
        ],
        icon: 'https://cdn.pixabay.com/photo/2020/04/29/07/54/coronavirus-5107715_960_720.png',
        vibrate: [100, 100, 100],
        data: { url: self.location.origin }
    });
});

self.addEventListener('notificationclick', event => {
    const appURL = new URL(self.location.origin).href;

    event.notification.close();

    event.waitUntil(
        clients
            .matchAll({
                type: 'window',
                includeUncontrolled: true
            })
            .then((windowClients) => {
                let matchingClient = null;

                for (let i = 0; i < windowClients.length; i++) {
                    const windowClient = windowClients[i];
                    if (windowClient.url === appURL) {
                        matchingClient = windowClient;
                        break;
                    }
                }
                if (matchingClient) {
                    return matchingClient.focus();
                } else {
                    return clients.openWindow(appURL);
                }
            })
    );
});

self.addEventListener('pushsubscriptionchange', function (event) {
    event.waitUntil(
        fetch('https://api.nswcases.com/subscribe/resub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                oldEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : null,
                newSub: {
                    newEndpoint: event.newSubscription ? event.newSubscription.endpoint : null,
                    newP256dh: event.newSubscription ? event.newSubscription.toJSON().keys.p256dh : null,
                    newAuth: event.newSubscription ? event.newSubscription.toJSON().keys.auth : null
                }
            })
        })
    );
});