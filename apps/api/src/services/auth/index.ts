/**
 * Authentication Service
 * Handles password hashing, JWT tokens, and Google OAuth
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

// Types
export interface JWTPayload {
  userId: number
  email: string
  iat?: number
  exp?: number
}

export interface GoogleUserInfo {
  email: string
  name: string
  picture: string
  googleId: string
  emailVerified: boolean
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT Token management
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}

// Google OAuth verification - supports both ID token and access token
export async function verifyGoogleToken(token: string): Promise<GoogleUserInfo | null> {
  try {
    // First, try to verify as ID token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      })
      
      const payload = ticket.getPayload()
      
      if (payload?.email) {
        return {
          email: payload.email,
          name: payload.name || '',
          picture: payload.picture || '',
          googleId: payload.sub,
          emailVerified: payload.email_verified || false,
        }
      }
    } catch {
      // Not an ID token, try as access token
    }

    // Try to use as access token (implicit flow)
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      console.error('Google userinfo request failed:', response.status)
      return null
    }

    const userInfo = await response.json()
    
    if (!userInfo.email) {
      return null
    }

    return {
      email: userInfo.email,
      name: userInfo.name || '',
      picture: userInfo.picture || '',
      googleId: userInfo.sub,
      emailVerified: userInfo.email_verified || false,
    }
  } catch (error) {
    console.error('Google token verification failed:', error)
    return null
  }
}

// Session token generation (for database storage)
export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Calculate session expiry (7 days from now)
export function getSessionExpiry(): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 7)
  return expiry
}

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const authService = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  decodeToken,
  verifyGoogleToken,
  generateSessionToken,
  getSessionExpiry,
  validatePassword,
  validateEmail,
}

