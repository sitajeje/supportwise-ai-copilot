import "./globals.css";
import Link from "next/link";

export const metadata = {
    title: "SupportWise AI",
    description: "AI-powered support analytics and semantic ticket search",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className="bg-slate-50 text-slate-900 antialiased">
            <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="text-lg font-bold text-blue-600">
                SupportWise AI
                </Link>

                <div className="flex items-center gap-6 text-sm font-medium">
                <Link href="/search" className="hover:text-blue-600 transition">
                    Semantic Search
                </Link>
                <Link href="/dashboard" className="hover:text-blue-600 transition">
                    Dashboard
                </Link>
                <Link href="/chat" className="hover:text-blue-600 transition">
                    Chat
                </Link>
                </div>
            </nav>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-10">{children}</main>
        </body>
        </html>
    );
}


