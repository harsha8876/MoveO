const fs = require("fs");
const path = require("path");

const patches = [
  {
    file: path.join(
      __dirname,
      "..",
      "node_modules",
      "@clerk",
      "expo",
      "src",
      "specs",
      "NativeClerkModule.ts",
    ),
    find: "export default TurboModuleRegistry?.get<Spec>('ClerkExpo') ?? null;",
    replace: "export default TurboModuleRegistry.get<Spec>('ClerkExpo');",
  },
  {
    file: path.join(
      __dirname,
      "..",
      "node_modules",
      "@clerk",
      "expo",
      "dist",
      "specs",
      "NativeClerkModule.js",
    ),
    find: "var _a, _b;\nvar NativeClerkModule_default = (_b = (_a = import_react_native.TurboModuleRegistry) == null ? void 0 : _a.get(\"ClerkExpo\")) != null ? _b : null;",
    replace:
      "var NativeClerkModule_default = import_react_native.TurboModuleRegistry.get(\"ClerkExpo\");",
  },
];

for (const patch of patches) {
  if (!fs.existsSync(patch.file)) {
    continue;
  }

  const contents = fs.readFileSync(patch.file, "utf8");

  if (!contents.includes(patch.find) || contents.includes(patch.replace)) {
    continue;
  }

  fs.writeFileSync(
    patch.file,
    contents.replace(patch.find, patch.replace),
    "utf8",
  );
}
