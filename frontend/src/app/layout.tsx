import type { Metadata } from "next";
import "./globals.css";
import ChatPanel from "@/components/ChatPanel";

export const metadata: Metadata = {
    title: "VPP — Virtual Product Placement",
    description:
        "AI-powered virtual product placement. Detect 3D ad slots in video and overlay photorealistic brand assets.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                {/* ── Page Content ───────────────────────── */}
                <main className="container page">{children}</main>

                {/* ── Floating Chat Panel ────────────────── */}
                <ChatPanel />
            </body>
        </html>
    );
}
