const fetch = global.fetch || require('node-fetch');
(async () => {
  const endpoints = [
    'http://localhost/stelsen_monitoring/backend/send_test_push.php',
    'http://127.0.0.1/stelsen_monitoring/backend/send_test_push.php',
    'http://localhost/backend/send_test_push.php',
    'http://127.0.0.1/backend/send_test_push.php'
  ];
  for (const ep of endpoints) {
    try {
      console.log('Trying', ep);
      const res = await fetch(ep, { method: 'POST' });
      console.log('Status', res.status);
      const txt = await res.text();
      console.log('Response:', txt.substring(0, 1000));
      process.exit(0);
    } catch (e) {
      console.warn('Failed', ep, e.message);
    }
  }
  console.error('All attempts failed. Ensure Apache/XAMPP is running and the site is served at one of the above URLs.');
  process.exit(2);
})();
