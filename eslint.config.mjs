import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["src/components/**/*.{ts,tsx}", "src/lib/client/**/*.{ts,tsx}", "src/lib/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: ["@/lib/db/*", "@/lib/db/**", "@/lib/server/*", "@/lib/server/**"]
      }]
    }
  }
];

export default eslintConfig;
