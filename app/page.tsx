import Link from "next/link";

export default function HomePage() {
    return (
        <div className="space-y-12">
        {/* Hero section */}
        <section className="text-center py-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
            SupportWise AI
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            An AI-powered support analytics platform with semantic ticket search,
            automated insights, and intelligent dashboards.
            </p>

            <div className="flex justify-center gap-4">
            <Link
                href="/search"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
                Try Semantic Search
            </Link>

            <Link
                href="/dashboard"
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg shadow hover:bg-slate-300 transition"
            >
                View Dashboard (Soon)
            </Link>
            </div>
        </section>

        {/* Feature blocks */}
        <section className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">Semantic Search</h3>
            <p className="text-sm text-slate-600">
                Retrieve relevant tickets using vector similarity and natural
                language queries.
            </p>
            <Link
                href="/search"
                className="inline-block mt-3 text-blue-600 text-sm"
            >
                Try now →
            </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">AI Insights</h3>
            <p className="text-sm text-slate-600">
                Gemini-powered summaries help managers understand the root causes
                and trends behind incoming tickets.
            </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">Dashboard (Coming Soon)</h3>
            <p className="text-sm text-slate-600">
                Track ticket volume, SLA performance, categories, and customer
                sentiment in real-time.
            </p>
            </div>
        </section>
        </div>
    );
}
