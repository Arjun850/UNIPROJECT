const fs = require("fs");
const { chromium } = require("playwright");

const getFacultyList = require("./getFacultyList");

const scrapeProfile = require("./scrapeProfile");

async function main() {

    const browser = await chromium.launch({

        headless: false

    });

    const page = await browser.newPage();

    await page.goto("https://iiitd.ac.in/people/faculty", {

        waitUntil: "networkidle"

    });

    await page.mouse.wheel(0, 2500);

    await page.waitForTimeout(2000);

    const facultyList = await getFacultyList(page);

    let allFaculty = [];

    // If faculty.json already exists, load it
    if (fs.existsSync("scraper/faculty.json")) {

        allFaculty = JSON.parse(
            fs.readFileSync("scraper/faculty.json")
        );

        console.log(`Loaded ${allFaculty.length} existing faculty.`);

    }

    for (let i = 0; i < facultyList.length; i++) {

        const faculty = facultyList[i];

        // Skip already scraped faculty
        if (
            allFaculty.some(f => f.email === faculty.email)
        ) {

            console.log(`Skipping ${faculty.name}`);

            continue;

        }

        console.log(
            `\n(${i + 1}/${facultyList.length}) Scraping ${faculty.name}`
        );

        try {

            if (faculty.name !== "Pankaj Jalote") {
                continue;
            }
            console.log(faculty.profile);
            const facultyData = await scrapeProfile(
                browser,
                faculty
            );

            allFaculty.push(facultyData);

            // Save immediately
            fs.writeFileSync(
                "scraper/faculty.json",
                JSON.stringify(allFaculty, null, 4)
            );

            console.log("Saved.");

        }

        catch (err) {

            console.log(`Error scraping ${faculty.name}`);

            console.log(err.message);

        }

    }
    fs.writeFileSync(

        "scraper/faculty.json",

        JSON.stringify(allFaculty, null, 4)

    );

    console.log("\n====================================");
    console.log("All faculty saved!");
    console.log(`Total Faculty: ${allFaculty.length}`);
    console.log("File: scraper/faculty.json");
    console.log("====================================");
    await browser.close();

}

main();