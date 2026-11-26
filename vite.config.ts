import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { tokenHex } from './src/styles/tokens.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // @ts-expect-error babel exists in the plugin but may not be typed correctly
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', { target: '19' }]
        ]
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'logo.png', 'assets/*.mp4', 'assets/*.png'],
      manifest: {
        name: 'Hyecuts: The Studio',
        short_name: 'The Studio',
        description: 'Premium Barbershop Loyalty & Booking',
        // The manifest is JSON, so it takes literal colours rather than CSS variables.
        theme_color: tokenHex.studioBlack,
        background_color: tokenHex.studioWhite,
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Pinned to the market's timezone so date handling is deterministic and
    // the BK-016 local-vs-UTC guards actually bite. On a UTC runner the two
    // are indistinguishable and those tests would pass while broken.
    env: { TZ: 'Asia/Kuala_Lumpur' }
  }
})
