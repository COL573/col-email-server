import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Firebase Auth verification helper
export async function verifyFirebaseToken(idToken) {
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Invalid Firebase token');
  }

  const data = await response.json();
  const user = data.users?.[0];

  if (!user || user.localId == null || user.email == null) {
    throw new Error('Invalid Firebase user data');
  }

  return {
    uid: user.localId,
    email: user.email
  };
}
