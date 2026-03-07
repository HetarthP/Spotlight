import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "VPP — Virtual Product Placement",
    description:
        "AI-powered virtual product placement. Detect 3D ad slots in video and overlay photorealistic brand assets using Cloudinary.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                {/* ── Navbar ─────────────────────────────── */}
                <nav className="navbar">
                    <div className="container">
                        <a href="/" className="navbar-brand">
                            ▶ VPP
                        </a>
                        <ul className="navbar-links">
                            <li>
                                <a href="/">Discover</a>
                            </li>
                            <li>
                                <a href="/dashboard">Creator</a>
                            </li>
                            <li>
                                <a href="/brand">Brand</a>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* ── Page Content ───────────────────────── */}
                <main className="container page">{children}</main>
            </body>
        </html>
    );
}
