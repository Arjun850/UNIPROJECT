const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ycsazxvgxnosetgiqrja.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljc2F6eHZneG5vc2V0Z2lxcmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MjIxNDAsImV4cCI6MjA5NDM5ODE0MH0.v9El7TeFQdNgfzQgTCw6Ggoqz6LZn1ZcCkhmGHYipIk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    try {
        console.log("Fetching applications from applications_v2 table...");
        const { data, error } = await supabase
            .from('applications_v2')
            .select('*');

        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Fetched records successfully!");
            console.log("Total records:", data.length);
            console.log("Records detail:", JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Exception caught:", err);
    }
}

testFetch();
