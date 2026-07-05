async function getSection(page, headingName) {

    const heading = page.getByRole("heading", {
        name: new RegExp(headingName, "i")
    });

    if (await heading.count() === 0) {

        return null;

    }

    const container = heading.locator("xpath=following-sibling::div[1]");

    // Get all <p> tags inside this section
    const paragraphs = container.locator(".field-content p");

    const count = await paragraphs.count();

    // If no <p> tags, it is probably the Profile section
    if (count === 0) {

        return (
            await container
                .locator(".field-content")
                .innerText()
        ).trim();

    }

    // Otherwise return an array
    const data = [];

    for (let i = 0; i < count; i++) {

        data.push(

            (
                await paragraphs
                    .nth(i)
                    .innerText()
            ).trim()

        );

    }

    return data;

}

async function getContactDetails(page) {

    const details = await page.locator(".contact-box-p").all();

    const contact = {
        education: "",
        phone: "",
        email: "",
        website: "",
        office: ""
    };

    for (const box of details) {

        const icon = await box.locator("i").getAttribute("class");

        if (icon.includes("graduation-cap")) {

            contact.education = await box.locator(".field-content").innerText();

        }

        else if (icon.includes("phone")) {

            contact.phone = await box.locator(".field-content").innerText();

        }

        else if (icon.includes("envelope")) {

            contact.email = await box.locator(".field-content").innerText();

        }

        else if (icon.includes("globe")) {

            contact.website = await box.locator("a").getAttribute("href");

        }

        else if (icon.includes("map-marker")) {

            contact.office = await box.locator(".field-content").innerText();

        }

    }

    return contact;

}
async function getProfileCard(page) {

    const card = page.locator(".profile-info");

    const name = await card.locator("h3 .field-content").innerText();

    const designation = await card.locator("span .field-content").innerText();

    let image = await card.locator("img").getAttribute("src");

    if (!image.startsWith("http")) {
        image = "https://iiitd.ac.in" + image;
    }

    return {
        name,
        designation,
        image
    };

}
async function scrapeProfile(browser, faculty) {

    const page = await browser.newPage();

    let profileUrl = faculty.profile;

    if (!profileUrl.startsWith("http")) {

        profileUrl = "https://iiitd.ac.in" + profileUrl;

    }

    await page.goto(profileUrl, {

        waitUntil: "networkidle"

    });

    console.log("\nOpening:", profileUrl);

    // Test ONLY the Profile heading
    const biography = await getSection(page, "Profile");

    const research = await getSection(page, "Research Interests");

    const teaching = await getSection(page, "Teaching Interests");

    const labs = await getSection(page, "Affiliated Centres & Labs");
    const contact = await getContactDetails(page);


    const profileCard = await getProfileCard(page);
    const facultyProfile = {

        // ---------- Faculty List ----------
        name: faculty.name,
        designation: faculty.designation,
        education: faculty.education,
        email: faculty.email,
        image: faculty.image,

        // ---------- Profile ----------
        profileUrl: profileUrl,
        phone: contact.phone,
        office: contact.office,
        website: contact.website,
        biography: biography,

        researchInterests: research,
        teachingInterests: teaching,
        affiliatedLabs: labs

    };


    const delay = Math.floor(Math.random() * 3000) + 2000;

    console.log(`Waiting ${delay} ms...`);

    await page.waitForTimeout(delay);
    await page.close();
    return facultyProfile;

}

module.exports = scrapeProfile;