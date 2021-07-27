import request from 'superagent';

const vapidKey = process.env.REACT_APP_PUBLIC_VAPID;


async function run() {
    const registration = await navigator.serviceWorker
        .register(`/notify-service-worker.js`, {
            scope: '/'
        });
    await navigator.serviceWorker.ready;


    const subscription = await registration.pushManager
        .subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });

    await request
        .post(process.env.REACT_APP_SERVER + '/subscribe')
        .send(subscription.toJSON());
    
    return subscription;
}

// Not my code :)
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default { run };