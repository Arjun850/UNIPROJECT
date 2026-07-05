const getFacultyList = async (page) => {

   
    const facultyCards = page.locator(".post-card");

console.log(await page.locator(".post-card").count());
console.log(await page.locator(".post-card-1").count());
console.log(await page.locator(".team-item").count());
console.log(await page.locator(".views-row").count());

    const total = await facultyCards.count();

    console.log(`Found ${total} faculty members\n`);

    const facultyList = [];

    for (let i = 0; i < total; i++) {

        const card = facultyCards.nth(i);

        const name = await card.locator(".team-title").innerText();

        const designation = await card.locator(".team-subtitle").innerText();

        const education = await card.locator(".team-description p").first().innerText();

        const email = await card.locator(".team-description a").innerText();

        const image = await card.locator(".post-img img").getAttribute("src");

        const profile = await card.locator(".team-title a").getAttribute("href");

        facultyList.push({

            name,
            designation,
            education,
            email,
            image,
            profile

        });

    }

    return facultyList;

};

module.exports = getFacultyList;