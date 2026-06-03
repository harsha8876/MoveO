const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Packages that are Node-only (used in +api.ts routes, not client code).
const NODE_ONLY_PREFIXES = [
  "firebase-admin",
  "@google-cloud/",
  "google-gax",
  "proto3-json-serializer",
];

// Packages that are native-only (no web support). Stubbed on web.
const NATIVE_ONLY_PREFIXES = [
  "@stripe/stripe-react-native",
  "react-native-maps",
];

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isNodeOnly = NODE_ONLY_PREFIXES.some(
    (prefix) => moduleName === prefix || moduleName.startsWith(prefix + "/")
  );

  // Expo Router API routes bundle with environment=node — those need the real
  // module. Everything else (client RN/web bundles) gets an empty stub.
  const isServerBundle =
    platform === "server" ||
    context.customResolverOptions?.environment === "node";

  if (isNodeOnly && !isServerBundle) {
    return { type: "empty" };
  }

  // Native-only packages get stubbed on web.
  const isNativeOnly = NATIVE_ONLY_PREFIXES.some(
    (prefix) => moduleName === prefix || moduleName.startsWith(prefix + "/")
  );
  if (isNativeOnly && platform === "web") {
    return { type: "empty" };
  }

  // For the server bundle, Metro's ESM resolver picks firebase-admin's ESM
  // re-export wrappers (lib/esm/**) which break CJS interop. Force it to the
  // CJS lib/ path directly so named exports survive the transform.
  if (isServerBundle && moduleName.startsWith("firebase-admin/")) {
    const subpath = moduleName.slice("firebase-admin/".length);
    const cjsPath = path.join(
      __dirname,
      "node_modules/firebase-admin/lib",
      subpath,
      "index.js"
    );
    return { type: "sourceFile", filePath: cjsPath };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
