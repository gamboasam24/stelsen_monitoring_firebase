import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { installFirebaseBackendShim } from './api/firebaseBackendShim'

// Install Firebase backend shim to intercept API calls
installFirebaseBackendShim();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
  
import { GoogleOAuthProvider } from '@react-oauth/google';
<GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
  <App />
</GoogleOAuthProvider>
