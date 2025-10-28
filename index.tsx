import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './ToastContext';
import { SessionProvider } from './hooks/useSession';
import { SubscriptionProvider } from './hooks/useSubscription';

performance.mark('app-load-start');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Render the app immediately. Data initialization is now handled within the App component
// to show a loading screen to the user faster.
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
