/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['psycopg2', 'scikit-learn', 'joblib', 'nltk', 'Sastrawi'],
  },
  rewrites: async () => {
    return [
      {
        source: '/api/py/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8082/api/py/:path*'
            : '/api/index.py',
      },
    ]
  },
}

module.exports = nextConfig
