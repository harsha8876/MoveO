const appJson = require("./app.json");

const googleIosClientId = process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID;
const explicitGoogleIosUrlScheme =
  process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME;

const deriveGoogleIosUrlScheme = (clientId) => {
  if (!clientId) return undefined;

  const suffix = ".apps.googleusercontent.com";

  if (!clientId.endsWith(suffix)) {
    return undefined;
  }

  return `com.googleusercontent.apps.${clientId.slice(0, -suffix.length)}`;
};

const googleIosUrlScheme =
  explicitGoogleIosUrlScheme || deriveGoogleIosUrlScheme(googleIosClientId);

if (googleIosUrlScheme && !process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME) {
  process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME = googleIosUrlScheme;
}

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      ...(googleIosUrlScheme
        ? {
            EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME: googleIosUrlScheme,
          }
        : {}),
    },
  },
};
