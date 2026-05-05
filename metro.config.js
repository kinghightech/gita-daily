const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add 'MOV' to the list of supported asset extensions
config.resolver.assetExts.push('MOV', 'mov');

module.exports = withNativeWind(config, { input: "./global.css" });