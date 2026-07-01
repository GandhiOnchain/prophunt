import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Patch Element.prototype.requestPointerLock to prevent uncaught exceptions when elements are unmounted or removed from the DOM
if (typeof Element !== 'undefined' && Element.prototype.requestPointerLock) {
  const originalRequestPointerLock = Element.prototype.requestPointerLock;
  Element.prototype.requestPointerLock = function (this: Element, options?: any): any {
    if (!this.isConnected) {
      console.warn("requestPointerLock bypassed: Element is not connected to the DOM.");
      return Promise.resolve();
    }
    try {
      const result = originalRequestPointerLock.call(this, options);
      if (result && typeof result.catch === 'function') {
        return result.catch((err: any) => {
          if (err && (err.message?.includes('removed from DOM') || err.name === 'InvalidStateError' || err.message?.includes('pointer lock'))) {
            console.warn("Pointer lock request promise rejected safely:", err.message);
          } else {
            console.warn("Pointer lock request rejected:", err);
          }
        });
      }
      return result;
    } catch (err: any) {
      if (err && (err.message?.includes('removed from DOM') || err.name === 'InvalidStateError' || err.message?.includes('pointer lock'))) {
        console.warn("Pointer lock request caught safely:", err.message);
        return Promise.resolve();
      } else {
        throw err;
      }
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
