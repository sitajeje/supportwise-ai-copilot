// scripts/generateTicketEmbeddings.mjs

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

if (!openaiApiKey) {
    console.error('Missing OPENAI_API_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 10;
const SLEEP_BETWEEN_BATCH = 1500;
const EMBEDDING_DIM = 1536; // Dimension for text-embedding-3-small

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTickets(limit = 200) {
    const { data, error } = await supabase
        .from('tickets')
        .select('id, subject, description')
        .limit(limit);

    if (error) throw error;
    return data;
}

async function generateEmbeddings(texts) {
    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: texts
        });
        return response.data.map(d => d.embedding);
    } catch (err) {
        console.error('OpenAI Error (one batch):',err?.error?.message || err);
        throw err;
    }
}
async function insertEmbeddings(rows, vectors) {
    const payload = rows.map((row, idx) => ({
        ticket_id: row.id,
        source: 'subject+description',
        embedding: vectors[idx]
    }));
    const { error } = await supabase
        .from('ticket_embeddings')
        .insert(payload);
    if (error) {
        console.error('Error inserting embeddings:', error.message);
        throw error;
    }
}
async function main() {
    console.log("Fetching tickets…"); 
    const tickets = await fetchTickets(200);
    let processed = 0;

    while (processed < tickets.length) {
        const slice = tickets.slice(processed, processed + BATCH_SIZE);

        console.log(
            `Generating embeddings for tickets ${processed + 1} → ${
            processed + slice.length
            }`
        );

        const texts = slice.map(
            (t) => `${t.subject || ""}\n\n${t.description || ""}`
        );

        try {
            const vectors = await generateEmbeddings(texts);
            await insertEmbeddings(slice, vectors);
        } catch (err) {
            console.error("Retrying this batch after 5 seconds...");
            await sleep(5000);
            continue; // Retry the same batch
        }

        processed += slice.length;

        console.log(`Batch done. Processed total: ${processed}`);
        
        await sleep(SLEEP_BETWEEN_BATCH);
    }
    console.log("All embeddings completed!");
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});

/**
 * Fetch tickets that do NOT yet have embeddings
 */
/* async function fetchTicketsWithoutEmbeddings(limit = 100) {
    const { data, error } = await supabase
        .from('tickets')
        .select('id, subject, description')
        .limit(limit);
    if (error) {
        console.error('Error fetching tickets:', error.message);
        throw error;
    }
    return data;
} */

/**
 * Create embeddings for a batch of texts
 */
/* async function createEmbeddingsBatch(texts) {
    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts
    });
    return response.data.map((item) => item.embedding);
} */

/**
 * Insert embeddings into ticket_embeddings table
 */
/* async function insertEmbeddings(rows, embeddings) {
    const payload = rows.map((row, idx) => ({
        ticket_id: row.id,
        source: 'subject+description',
        embedding: embeddings[idx]
    }));
    const { error } = await supabase.from('ticket_embeddings').insert(payload);
    if (error) {
        console.error('Error inserting embeddings:', error.message);
        throw error;
    }
}

async function main() {
    console.log('Fetching tickets to embed...');

    const tickets = await fetchTicketsWithoutEmbeddings(100);
    if (!tickets || tickets.length === 0) {
        console.log('No tickets found (or all already embedded).');
        return;
    }
    
    console.log(`Creating embeddings for ${tickets.length} tickets...`);

    const texts = tickets.map(t => {
        const subject = t.subject || '';
        const description = t.description || '';
        return `${subject}\n\n${description}`;
    });

    const embeddings = await createEmbeddingsBatch(texts);

    console.log('Inserting embeddings into database...');
    await insertEmbeddings(tickets, embeddings);

    console.log('Done generating embeddings.');
} */

/* main()
    .then(() => {
        console.log('Embedding script finished.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Fatal error in embedding script:', err);
        process.exit(1);
    }); */