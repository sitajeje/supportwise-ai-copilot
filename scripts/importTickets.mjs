//scripts/importTickets.mjs

// Load env variables from .env
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Basic safety check
if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.');
    process.exit(1);
}

// Create Supabase client with service role key (server-side only)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Upsert a customer by email and return the row.
 */
async function upsertCustomer(ticket) {
    const { customer_name, customer_email } = ticket;
    const { data, error } = await supabase
        .from('customers')
        .upsert(
            {
                external_id: customer_email, // we reuse email as external_id for now
                name: customer_name,
                email: customer_email
            },{
                onConflict: 'email' // requires unique constraint on customers.email
            }
        )
        .select()
        .single();

    if (error) {
        console.error('Error upserting customer:', error.message, ticket);
        throw error;
    }
    return data;
}

/**
 * Insert one ticket row linked to the given customer id.
 */
async function insertTicket(ticket, customerId) {
    const {
        ticket_id,
        subject,
        description,
        status,
        priority,
        channel,
        tags,
        created_at,
        updated_at,
        first_response_time_minutes,
        resolution_time_minutes,
        sla_met,
        sentiment
    } = ticket

    const { error } = await supabase.from('tickets').insert({
        ticket_id,
        customer_id: customerId,
        subject,
        description,
        status,
        priority,
        channel,
        tags,
        created_at,
        updated_at,
        first_response_time_minutes,
        resolution_time_minutes,
        sla_met,
        sentiment
    });

    if (error) {
        // If you re-run the script, you may want to ignore duplicates later
        console.error('Error inserting ticket:', error.message, ticket_id);
        throw error;
    }

}

/**
 * Main import function.
 */
async function main() {
    console.log('Reading tickets_seed.json...');
    const jsonPath = new URL('../data/raw/tickets_seed.json', import.meta.url);
    const raw = await fs.readFile(jsonPath, 'utf-8');
    const tickets = JSON.parse(raw);

    console.log(`Loaded ${tickets.length} tickets from JSON file.`);

    let successCount = 0;
    let failedCount = 0;

    for (const ticket of tickets) {
        try {
            // 1) Upsert customer by email
            const customer = await upsertCustomer(ticket);

            // 2) Insert ticket linked to that customer
            await insertTicket(ticket, customer.id);

            successCount++;

            if (successCount % 20 === 0) {
                console.log(`Imported ${successCount} tickets so far...`);

            }
    } catch (err) {
            failedCount++;
            //Error already logged inside helper functions
        }
    }
    console.log(`Done. Success: ${successCount}, Failed: ${failedCount}`);
}

main()
    .then(() => {
        console.log('Import finished.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Fatal error during import:', err);
        process.exit(1);
    });