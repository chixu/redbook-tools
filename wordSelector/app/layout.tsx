import type { Metadata } from "next";
import "../../common/styles/index.css";
import "./globals.css";

export const metadata: Metadata = { title: "单词挑选 · Word Selector", description: "从词表中挑选单词，自动保存选择。" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
