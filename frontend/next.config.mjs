/** @type {import('next').NextConfig} */
const nextConfig = {
  // Включаем standalone-сборку для Docker
  output: 'standalone',
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },
  
  // Разрешаем импорты по алиасу @/
  typedRoutes: false,
}

export default nextConfig