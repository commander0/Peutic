import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanions() {
    console.log("Fetching companions from Supabase...");
    const { data, error } = await supabase.from('companions').select('*');
    if (error) {
        console.error("Error fetching connecting to supabase:", error);
        return;
    }

    console.log(`Total companions in DB: ${data.length}`);
    const missingImages = data.filter(c => !c.image_url || c.image_url.trim() === '');
    console.log(`Companions missing image_url: ${missingImages.length} ->`, missingImages.map(c => c.name));

    const danny = data.find(c => c.name.toLowerCase() === 'danny');
    console.log(`Danny found:`, danny ? true : false, danny ? danny.specialty : '');

    const marias = data.filter(c => c.name.toLowerCase() === 'maria');
    console.log("Maria details: ", marias.map(m => ({ name: m.name, specialty: m.specialty, img: m.image_url })));

    // Try finding the 'Women's Health' specialty
    const womens = data.filter(c => c.specialty.toLowerCase().includes('women'));
    console.log("Women's specialty found: ", womens.map(m => ({ name: m.name, specialty: m.specialty, img: m.image_url })));
}

checkCompanions();
