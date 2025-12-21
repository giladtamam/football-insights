import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { apolloClient } from './lib/apollo'
import App from './App'
import { LandingPage } from './pages/LandingPage'
import './index.css'

// Google OAuth Client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<App />} />
          </Routes>
        </BrowserRouter>
      </ApolloProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
