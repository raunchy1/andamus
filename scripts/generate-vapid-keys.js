const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\nAdd these to your .env.local and .env.example files.\n');
