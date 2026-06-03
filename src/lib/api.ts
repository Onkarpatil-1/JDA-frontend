const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:3001/api/v1';

export default API_BASE;
