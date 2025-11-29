// TODO: Legg til dine Vipps-verdier fra Vipps utviklerportal
export const VIPPS_CONFIG = {
  CLIENT_ID: 'YOUR_VIPPS_CLIENT_ID',
  CLIENT_SECRET: 'YOUR_VIPPS_CLIENT_SECRET',
  REDIRECT_URI: 'your-app://oauth2/callback',
  AUTH_ENDPOINT: 'https://api.vipps.no/access-management-1.0/access/',
};

export const VIPPS_SCOPES = [
  'name',
  'email',
  'phoneNumber',
  'address',
];