cat << 'EOF' > next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {},
    },
  },
}

module.exports = nextConfig
EOF