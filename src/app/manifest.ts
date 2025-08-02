import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'T&S Bouncy Castle Hire',
    short_name: 'T&S Castles',
    description: 'Professional bouncy castle hire service in Edwinstowe and surrounding areas. Fully insured, safe, and fun inflatables for parties, events, and celebrations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#37B8D4',
    icons: [
      {
        src: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['entertainment', 'lifestyle', 'business'],
    lang: 'en-GB',
  }
}