// scripts/generateTicketEmbeddingsLocal.mjs

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// We'll use a small, efficient sentence embedding model
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const BATCH_SIZE = 10;

// cache for the pipeline instance
let embedderPromise = null;

// Lazy-load the model (first call will download it)
async function getEmbedder() {
    if (!embedderPromise) {
        console.log(`Loading embedding model: ${MODEL_NAME} ...`);
        embedderPromise = pipeline('feature-extraction', MODEL_NAME);
    }
    return embedderPromise;
}

// Simple sleep helper
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a batch of tickets to embed.
 * For now we just fetch first N tickets that do not yet have an embedding.
 * 
 * NOTE: This version assumes ticket_embeddings is initially empty.
 * Later we can join tickets & ticket_embeddings to find missing ones.
 */
async function fetchTickets(limit = 200) {
    const { data, error } = await supabase
        .from('tickets')
        .select('id, subject, description')
        .limit(limit);

    if (error) {
        console.error('Error fetching tickets:', error);
        throw error;
    }

    return data;
}

/**
 * Generate a single embedding vector for a given text using the local model.
 * We take the first token's vector (CLS-like) as the sentence embedding.
 */
async function generateEmbeddingForText(text, embedder) {
    // The model returns a tensor [sequence_length, hidden_size]
    const output = await embedder(text, {
        pooling: "mean",
        normalize: true
    });
    // output.data is a nested array: [seq_len, dim]
    const tokenEmbeddings = output.data;
    //const firstToken = tokenEmbeddings[0]; // shape [dim=384]

    // Ensure it's a plain JS array of numbers
    return Array.from(tokenEmbeddings);
}

/**
 * Insert a batch of embeddings into ticket_embeddings table.
 */
async function insertEmbeddings(rows, vectors) {
    const payload = rows.map((row, idx) => ({
        ticket_id: row.id,
        source: 'subject+description',
        embedding: vectors[idx],
    }));

    const { error } = await supabase.from('ticket_embeddings').insert(payload);

    if (error) {
        console.error('Error inserting embeddings:', error);
        throw error;
    }
}

/**
 * Main pipeline: fetch → split into batches → embed → insert
 */
async function main() {
    console.log('Fetching tickets to embed (local model)...');

    const tickets = await fetchTickets(200);

    if (!tickets || tickets.length === 0) {
        console.log('No tickets found.');
        return;
    }

    console.log(`Total tickets to embed: ${tickets.length}`);

    const embedder = await getEmbedder();

    let processed = 0;

    while (processed < tickets.length) {
    const slice = tickets.slice(processed, processed + BATCH_SIZE);
    console.log(
        `Generating local embeddings for tickets ${processed + 1} → ${
            processed + slice.length
        }`
    );

    const vectors = [];
    for (const t of slice) {
        const text = `${t.subject || ''}\n\n${t.description || ''}`;
        const vec = await generateEmbeddingForText(text, embedder);
        //console.log("Embedding vector length:", vec.length);
        vectors.push(vec);
    }

    await insertEmbeddings(slice, vectors);

    processed += slice.length;
    console.log(`Batch done. Processed total: ${processed}`);

    // Small delay between batches (not strictly necessary for local model, but OK)
    await sleep(200);
    }

    console.log('\n🎉 Local embeddings generation completed!');
}

main().catch((err) => {
    console.error('Fatal error in local embedding script:', err);
    process.exit(1);
});
