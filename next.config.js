const { version } = require("./package.json");

// Increase the max listeners from 10 to avoid memory leak warnings
require("events").EventEmitter.defaultMaxListeners = 15;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // outputs to .next/standalone for use with Docker images
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

module.exports = nextConfig;
