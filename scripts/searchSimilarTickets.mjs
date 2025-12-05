// scripts/searchSimilarTickets.mjs

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

let embedderPromise = null;
async function getEmbedder() {
    if (!embedderPromise) {
        console.log("Loading embedding model...");
        embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    return embedderPromise;
}

export async function semanticSearch(query, k = 5) {
    const embedder = await getEmbedder();

    // generate query embedding
    const output = await embedder(query, { pooling: "mean", normalize: true });
    const queryEmbedding = Array.from(output.data); // length 384

    // Call pgvector search
    const { data, error } = await supabase.rpc("match_tickets", {
        query_embedding: queryEmbedding,
        match_count: k
    });

    if (error) {
        console.error("Search error:", error);
        throw error;
    }

    return data;
}

// Run directly from CLI
if (process.argv[2]) {
    const query = process.argv.slice(2).join(" ");
    console.log("Searching for:", query);

    semanticSearch(query, 5)
        .then((results) => {
            console.log("\nTop Matches:");
            if (!results || results.length === 0) {
                console.log('No matches found.');
            } else {
                console.table(results);
            }
        })
        .catch((err) => {
            // Prevent UnhandledPromiseRejection
            console.error('\nFatal error in semanticSearch CLI:', err);
            process.exit(1);
        });
}
