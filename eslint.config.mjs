import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: ["public/sw.js", "public/sw.js.map"]
  },
  ...nextVitals,
  ...nextTs
];

export default eslintConfig;
