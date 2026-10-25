# LAPSTORE – ReactJS (client/) + NodeJS/Express (server/)

Dự án KHÔNG còn dùng Next.js. Cấu trúc:

- `client/` – frontend ReactJS 19 + Vite + React Router 7 + Tailwind CSS 4. Gọi API qua `client/src/lib/api.ts` (`useApi`, `apiAction`, `api`); đăng nhập qua `useAuth()` trong `client/src/lib/auth.tsx`.
- `server/` – backend Express 5 + Prisma (MySQL). Router trong `server/src/routes/`, phân quyền bằng middleware `requireAuth` / `requireAdmin` (`server/src/middleware/auth.ts`), JWT trong cookie httpOnly.
- `shared/` – code dùng chung cả hai phía (không import package riêng của một phía).

Quy tắc:
- Mọi kiểm tra quyền và tính tiền làm ở server; frontend chỉ ẩn/hiện giao diện.
- Thêm API mới thì thêm test Supertest trong `server/tests/` và ghi vào `API_DOCUMENTATION.md`.
- Kiểm tra trước khi xong: `npm run typecheck`, `npm test`, `npm run lint`.
- Ngữ cảnh chi tiết: `project_template.md`.
