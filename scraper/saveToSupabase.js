const fs = require("fs");

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(

    "https://dwmuhrhnmlyticoodbgn.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bXVocmhubWx5dGljb29kYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTY1NDEsImV4cCI6MjA5NDQ5MjU0MX0.kulR8-0v9cDgapxCTxK6Jq6VpjjHBTGHqP8NEiD4FTk"
);

const faculty = JSON.parse(

    fs.readFileSync(
        "scraper/faculty.json",
        "utf8"
    )

);

console.log(`Loaded ${faculty.length} faculty`);
async function uploadAll() {

    for (let i = 0; i < faculty.length; i++) {

        const f = faculty[i];

        console.log(`(${i + 1}/${faculty.length}) Uploading ${f.name}`);

        const { error } = await supabase

            .from("faculty_master")

            .upsert({

                name: f.name,
                email: f.email,
                designation: f.designation,

                // Extract department from designation
                department:
                    f.designation.match(/\((.*?)\)/)?.[1] || "",

                photo_url: f.image,

                education: f.education,

                phone: f.phone,

                office: f.office,

                website: f.website,

                profile: f.profileUrl,

                biography: f.biography,

                research_interests: f.researchInterests,

                teaching_interests: f.teachingInterests,

                labs: f.affiliatedLabs,

                last_scraped: new Date().toISOString(),

                updated_at: new Date().toISOString()

            }, {

                onConflict: "email"

            });

        if (error) {

            console.log(`❌ ${f.name}`);
            console.log(error);

        }

        else {

            console.log(`✅ ${f.name}`);

        }

    }

    console.log("\n=================================");
    console.log("All Faculty Uploaded Successfully!");
    console.log("=================================");

}
uploadAll();