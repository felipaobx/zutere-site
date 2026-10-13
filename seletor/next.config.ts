import type { NextConfig } from 'next';
const nextConfig: NextConfig = { basePath: '/fotos', async headers(){return [{source:'/:path*',headers:[{key:'Cache-Control',value:'private, no-store'},{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'same-origin'}]}];} };
export default nextConfig;
