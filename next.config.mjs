/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',   // Google avatars
      'avatars.githubusercontent.com', // GitHub avatars
      'graph.facebook.com',           // Facebook avatars
      'static-cdn.jtvnw.net',        // Twitch avatars
    ],
  },
};

export default nextConfig;
