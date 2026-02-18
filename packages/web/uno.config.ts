import { defineConfig, presetUno, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  theme: {
    colors: {
      primary: '#1976D2',
      'primary-light': '#90CAF9',
      'primary-dark': '#0D47A1',
      background: {
        light: '#F5F5F5',
        dark: '#121212',
      },
    },
  },
  shortcuts: {
    'btn-primary':
      'bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors',
    card: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
  },
});
