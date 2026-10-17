import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Tell the Expo shell the UI has painted so it can hide its loading screen.
requestAnimationFrame(() => (window as unknown as {ReactNativeWebView?: {postMessage(m: string): void}}).ReactNativeWebView?.postMessage('ready'));
