import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { VIPPS_CONFIG, VIPPS_SCOPES } from '../config/vipps';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({
  scheme: 'your-app',
  path: 'oauth2/callback',
});

export const vippsAuth = {
  login: async () => {
    try {
      const authUrl = `${VIPPS_CONFIG.AUTH_ENDPOINT}/oauth2/auth?` +
        `client_id=${VIPPS_CONFIG.CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(VIPPS_SCOPES.join(' '))}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type === 'success') {
        const code = result.url.split('code=')[1];
        
        // Bytt ut autorisasjonskoden med access token
        const tokenResponse = await fetch(`${VIPPS_CONFIG.AUTH_ENDPOINT}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${VIPPS_CONFIG.CLIENT_ID}:${VIPPS_CONFIG.CLIENT_SECRET}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          }).toString(),
        });

        const tokenData = await tokenResponse.json();

        // Hent brukerinfo fra Vipps
        const userResponse = await fetch(`${VIPPS_CONFIG.AUTH_ENDPOINT}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();

        // Logg inn eller registrer bruker i Supabase
        // Generer et tilfeldig passord for brukere som registreres via Vipps
        const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const { data: { user }, error } = await supabase.auth.signUp({
          email: userData.email,
          password: randomPassword,
          options: {
            data: {
              name: userData.name,
              phone: userData.phoneNumber,
              avatar_url: userData.picture,
              provider: 'vipps',
            },
          },
        });

        if (error) throw error;

        return { user, userData };
      }
    } catch (error) {
      console.error('Vipps login error:', error);
      throw error;
    }
  },
};