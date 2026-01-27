// Polyfill for CommonJS 'module' object used by long.js and other dependencies
// This must run before any TensorFlow imports
if (typeof window !== 'undefined') {
  // Create module object if it doesn't exist
  if (typeof (window as any).module === 'undefined') {
    (window as any).module = { exports: {} };
  }
  // Also define it globally for Node.js-style modules
  if (typeof (globalThis as any).module === 'undefined') {
    (globalThis as any).module = { exports: {} };
  }
}

