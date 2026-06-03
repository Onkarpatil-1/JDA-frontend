const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://65.0.23.203:3001/api/v1';

export default API_BASE;
