import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const base = [...compat.extends("next/core-web-vitals")];

/** Keep household and auth vertically separated — integrate through `lib/` and `components/`. */
const featureBoundaries = [
  {
    files: ["src/features/auth/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/household", "@/features/household/*"],
              message:
                "Auth must not import the household feature directly. Prefer lib/ or components/ for shared code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/household/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/auth", "@/features/auth/*"],
              message:
                "Household must not import the auth feature directly. Prefer lib/ or components/ for shared primitives.",
            },
          ],
        },
      ],
    },
  },
];

const ignoreBuild = [{ ignores: [".next/**", "node_modules/**", "out/**"] }];

const eslintConfig = [...ignoreBuild, ...base, ...featureBoundaries];

export default eslintConfig;
