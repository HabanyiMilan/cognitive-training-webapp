import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app.jsx'
import {GoogleOAuthProvider} from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";

const CLIENT_ID = "94726350428-7d2p30p8hr8s8kis1bj3u2rh5suebf3o.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
