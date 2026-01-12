import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "体質診断 | 漢方セルフケアAIアプリ",
  description:
    "あなたの体質を診断し、漢方的な視点からセルフケアの方向性を提案します。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
