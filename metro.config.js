const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Force every import of 'three' (and any three.js build file) to resolve to
// the single CJS build.  three.module.js imports ./three.core.js (ESM),
// which would create a second THREE instance and cause NaN bounding spheres.
const threeCJS = path.resolve(__dirname, "node_modules/three/build/three.cjs");
const threeBuildDir = path.resolve(__dirname, "node_modules/three/build");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "three") {
    return { filePath: threeCJS, type: "sourceFile" };
  }
  const result = context.resolveRequest(context, moduleName, platform);
  // Redirect any other three.js build file (three.module.js, three.core.js, etc.)
  // to three.cjs so only one THREE instance ever exists in the bundle.
  if (
    result.type === "sourceFile" &&
    typeof result.filePath === "string" &&
    result.filePath.startsWith(threeBuildDir) &&
    result.filePath !== threeCJS
  ) {
    return { filePath: threeCJS, type: "sourceFile" };
  }
  return result;
};

// Add 'MOV' to the list of supported asset extensions
config.resolver.assetExts.push("MOV", "mov");

module.exports = withNativeWind(config, { input: "./global.css" });
