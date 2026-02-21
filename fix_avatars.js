const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qdnctbupmlqhzubwigjn.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmN0YnVwbWxxaHp1YndpZ2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTQ0MjEsImV4cCI6MjA3Njk5MDQyMX0.kwfDMX0cGOQ3embdFnQnMNJT27CKi8Krf_Ew8uPgLrU"

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAvatars() {
    const updates = [
        { id: "c38", image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800" }, // Maria
        { id: "c42", image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800" }, // Gabby
        { id: "c36", image_url: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80&w=800" }, // Celine
        { id: "c41", image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800" }  // Danny
    ];

    for (const update of updates) {
        const { error } = await supabase.from('companions').update({ image_url: update.image_url }).eq('id', update.id);
        if (error) {
            console.error(`Failed to update ${update.id}:`, error);
        } else {
            console.log(`Successfully updated ${update.id}`);
        }
    }
}

fixAvatars();
