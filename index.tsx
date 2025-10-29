import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './ToastContext';
import { SessionProvider } from './hooks/useSession';
import { SubscriptionProvider } from './hooks/useSubscription';
import { initData } from './services/storageService';

performance.mark('app-load-start');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Initialize data before rendering the app to ensure all components have access to it.
initData().then(() => {
  root.render(
    <React.StrictMode>
      <ToastProvider>
        <SessionProvider>
          <SubscriptionProvider>
            <App />
          </SubscriptionProvider>
        </SessionProvider>
      </ToastProvider>
    </React.StrictMode>
  );
});