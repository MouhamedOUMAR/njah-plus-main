import type { MetadataRoute } from 'next'
import { APP_DESCRIPTION, APP_ICON_192, APP_ICON_512, APP_NAME } from '@/constants'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             APP_NAME,
    short_name:       APP_NAME,
    description:      APP_DESCRIPTION,
    start_url:        '/',
    display:          'standalone',
    orientation:      'portrait',
    background_color: '#F2FFF9',
    theme_color:      '#0E7490',
    icons: [
      {
        src:   APP_ICON_192,
        sizes: '192x192',
        type:  'image/png',
      },
      {
        src:     APP_ICON_512,
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
