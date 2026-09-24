import type { Metadata } from "next";
import "../../common/styles/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "仓库库存台",
  description: "本地电商耗材库存管理工具",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
