import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  output:'standalone',
  poweredByHeader:false,
  webpack(config,{webpack}){
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^cloudflare:workers$/,(resource:{request:string})=>{
      resource.request=path.resolve(process.cwd(),'lib/node-database.mjs');
    }));
    config.plugins.push(new webpack.DefinePlugin({
      __WRTBU_PUBLIC_HOST__:'true',
      'import.meta.env.DEV':'false'
    }));
    return config;
  }
};

export default nextConfig;
