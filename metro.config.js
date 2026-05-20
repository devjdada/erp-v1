// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Mock node-specific dependencies for the web build
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'https-proxy-agent': config.resolver.emptyModulePath,
};

module.exports = config;

