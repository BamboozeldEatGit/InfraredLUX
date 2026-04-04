// Create a custom service worker that includes our config
const customSWContent = `
// Load Ultraviolet bundle
importScripts('/uv/uv.bundle.js');

// Set up config for our prefix
self.__uv$config = {
  prefix: '/uv/',
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: '/uv/uv.handler.js',
  client: '/uv/uv.client.js',
  bundle: '/uv/uv.bundle.js',
  config: '/uv/uv.config.js',
  sw: '/uv/uv.sw.js',
};

// Load the actual service worker
importScripts('/uv/uv.sw.js');
`;

// Register our custom service worker
if ('serviceWorker' in navigator) {
  // Create a blob with our custom service worker
  const blob = new Blob([customSWContent], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);

  navigator.serviceWorker.register(url, { scope: '/uv/' })
    .then(registration => {
      console.log('Custom Ultraviolet SW registered:', registration.scope);
    })
    .catch(error => {
      console.error('Custom Ultraviolet SW registration failed:', error);
    });
}

// Load Ultraviolet bundle for client-side use
const script = document.createElement('script');
script.src = '/uv/uv.bundle.js';
script.onload = function() {
  console.log('Ultraviolet client loaded successfully');
  // Set the same config for client-side use
  window.__uv$config = {
    prefix: '/uv/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
  };
};
script.onerror = function() {
  console.error('Failed to load Ultraviolet client');
};
document.head.appendChild(script);