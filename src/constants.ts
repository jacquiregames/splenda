// src/constants.ts
const host = window.location.hostname;
const port = import.meta.env.VITE_PORT || '3000';

export const SERVER_URL = `ws://${host}:${port}/ws`;
export const API_URL    = `http://${host}:${port}`;
export const IMAGE_BASE_URL = `${API_URL}/static`;

export const COLORS = ["white", "blue", "green", "red", "brown"];

export const getAssetUrl = (path: string, type: 'token' | 'card', style: 'original' | 'new' = 'original') => {
  const ext = style === 'new' ? 'png' : 'jpg';

  if (type === 'token') {
      const c = path.charAt(0).toUpperCase() + path.slice(1);
      return `${IMAGE_BASE_URL}/images/${style}/tokens/${c}Token.${ext}`;
  } 
  
  if (path.includes('back')) {
      const filename = path.split('/').pop()?.split('.')[0];
      return `${IMAGE_BASE_URL}/images/${style}/${filename}.${ext}`;
  }

  const parts = path.split('/'); 
  if (parts.length < 3) return `${IMAGE_BASE_URL}/${path}`; 

  const folder = parts[1];
  const filename = parts[2].split('.')[0];
  
  return `${IMAGE_BASE_URL}/images/${style}/${folder}/${filename}.${ext}`;
};

export const getTokenImage = (color: string) => getAssetUrl(color, 'token', 'original');