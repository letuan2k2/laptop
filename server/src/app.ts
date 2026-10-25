import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadUser } from "./middleware/auth";
import { decimalReplacer } from "./lib/http";
import { authRouter } from "./routes/auth";
import { catalogRouter } from "./routes/catalog";
import { shopRouter } from "./routes/shop";
import { accountRouter } from "./routes/account";
import { serviceRouter } from "./routes/service";
import { chatRouter } from "./routes/chat";
import { adminRouter } from "./routes/admin";
import { mediaRouter } from "./routes/media";

// Bản build của frontend React (client/dist) – có thì server phục vụ luôn, chạy chung 1 cổng
const CLIENT_DIST = fileURLToPath(new URL("../../client/dist/", import.meta.url));

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("json replacer", decimalReplacer);

  // Chỉ cần khi frontend chạy ở tên miền khác (VD: deploy React riêng); khi dev đã có proxy của Vite
  if (process.env.CLIENT_ORIGIN) {
    app.use(cors({ origin: process.env.CLIENT_ORIGIN.split(","), credentials: true }));
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(loadUser);

  app.use("/api/auth", authRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api", catalogRouter, shopRouter, serviceRouter, accountRouter);
  app.use(mediaRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Không tìm thấy API" });
  });

  if (existsSync(path.join(CLIENT_DIST, "index.html"))) {
    app.use(express.static(CLIENT_DIST, { index: false }));
    // React Router xử lý mọi đường dẫn còn lại phía trình duyệt
    app.get(/^(?!\/(api|uploads)\/).*/, (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, "index.html"));
    });
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const code = (error as { code?: string })?.code;
    if (code === "P2025") {
      res.status(404).json({ success: false, error: "Không tìm thấy dữ liệu" });
      return;
    }
    if ((error as { type?: string })?.type === "entity.parse.failed") {
      res.status(400).json({ success: false, error: "Dữ liệu gửi lên không hợp lệ" });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, error: "Đã có lỗi xảy ra, vui lòng thử lại sau" });
  });

  return app;
}
