import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Bắt lỗi gọi hook sai thứ tự / thiếu dependency
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Dữ liệu API đa dạng, cho phép any ở mức cảnh báo
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
