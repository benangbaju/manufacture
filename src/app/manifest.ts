import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Manufaktur & Cashflow System',
    short_name: 'Manufaktur',
    description: 'Sistem internal manajemen manufaktur garmen, tracking inventori reject & cashflow',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0c0f17',
    theme_color: '#0c0f17',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

