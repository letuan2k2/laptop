import { describe, expect, it } from "vitest";
import { cn, discountPercent, formatVND, shortOrderId } from "./utils";

describe("cn", () => {
  it("gộp class Tailwind bị trùng, giữ class sau", () => {
    expect(cn("px-2 py-2", "px-4")).toBe("py-2 px-4");
    expect(cn("text-sm bg-red-500", "text-lg", "bg-blue-500", "px-4")).toBe("text-lg bg-blue-500 px-4");
  });

  it("bỏ qua giá trị falsy, hỗ trợ mảng và object của clsx", () => {
    expect(cn("px-2", true && "py-2", false && "m-2", null, undefined)).toBe("px-2 py-2");
    expect(cn(["flex", "items-center"], { "font-bold": true, hidden: false }, "rounded-md")).toBe(
      "flex items-center font-bold rounded-md"
    );
  });
});

describe("định dạng giá", () => {
  it("formatVND hiển thị tiền Việt", () => {
    expect(formatVND(15990000).replace(/\s/g, " ")).toBe("15.990.000 ₫");
    expect(formatVND(null).replace(/\s/g, " ")).toBe("0 ₫");
  });

  it("discountPercent làm tròn % giảm, không giảm thì 0", () => {
    expect(discountPercent(15000000, 20000000)).toBe(25);
    expect(discountPercent(15000000, null)).toBe(0);
    expect(discountPercent(15000000, 14000000)).toBe(0);
  });

  it("shortOrderId lấy 8 ký tự đầu, viết hoa", () => {
    expect(shortOrderId("a1b2c3d4-0000-0000")).toBe("A1B2C3D4");
  });
});
