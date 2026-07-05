window.onload = async function () {

    if (typeof supabaseClient !== 'undefined') {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session || !session.user) {
            window.location.href = "../auth/faculty-auth.html";
            return;
        }

        const user = session.user;
        const metadata = user.user_metadata || {};

        const userEmail = typeof resolveFacultyMasterEmail === "function"
            ? await resolveFacultyMasterEmail(user.email)
            : user.email;

        const facultyProfile = typeof resolveFacultyMasterProfile === 'function'
            ? await resolveFacultyMasterProfile(user.email)
            : null;

        let faculty = facultyProfile || {};

        const name =
            faculty.name ||
            metadata.full_name ||
            "Faculty";

        const email =
            faculty.email ||
            userEmail ||
            "faculty@gmail.com";

        const avatar =
            faculty.photo_url ||
            metadata.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;

        // SET USER DATA

        document.getElementById("facultyNameNav").textContent = name;
        document.getElementById("facultyNameHero").textContent = name;
        document.getElementById("facultyEmail").textContent = email;

        document.getElementById("facultyImage").src = avatar;
        document.getElementById("facultyProfileImage").src = avatar;

        // DYNAMIC PROFILE DATA LOAD
        const bio = faculty.biography || metadata.bio;
        if (bio) {
            document.getElementById("facultyBio").textContent = bio;
        }

        const department = faculty.department || metadata.department;
        if (department) {
            document.getElementById("facultyDepartment").textContent = department;
        }

        const designation = faculty.designation || metadata.designation;
        if (designation) {
            document.getElementById("facultyDesignation").textContent = designation;
        }

        const experience = faculty.education || metadata.experience;
        if (experience) {
            let exp = experience;
            if (!exp.toLowerCase().includes("experience") && !faculty.education) {
                exp += " Experience";
            }
            document.getElementById("facultyExperience").textContent = exp;
        }

        // Handle JSONB fields (research_interests, etc.)
        let researchDomain = "";
        let skills = [];

        if (faculty.research_interests) {
            let interests = faculty.research_interests;
            if (typeof interests === 'string') {
                try { interests = JSON.parse(interests); } catch (e) { interests = [interests]; }
            }
            if (Array.isArray(interests) && interests.length > 0) {
                researchDomain = interests[0];
                skills = interests;
            } else if (typeof interests === 'object' && interests !== null) {
                const keys = Object.keys(interests);
                if (keys.length > 0) {
                    researchDomain = keys[0];
                    skills = keys;
                }
            }
        } else if (metadata.research_domain) {
            researchDomain = metadata.research_domain;
        }

        if (researchDomain) {
            document.getElementById("facultyResearch").textContent = researchDomain;
        }

        if (skills.length === 0 && metadata.skills) {
            skills = metadata.skills.split(",").map(s => s.trim()).filter(s => s.length > 0);
        }

        const skillsWrapper = document.getElementById("skillsWrapper");
        if (skillsWrapper && skills.length > 0) {
            skillsWrapper.innerHTML = "";
            skills.forEach(skill => {
                const chip = document.createElement("span");
                chip.className = "skill-chip";
                chip.textContent = skill;
                skillsWrapper.appendChild(chip);
            });
        }

        // PUBLICATIONS
        let publicationsList = [];
        if (faculty.publications) {
            let pubs = faculty.publications;
            if (typeof pubs === 'string') {
                try { pubs = JSON.parse(pubs); } catch(e) {}
            }
            if (Array.isArray(pubs)) {
                publicationsList = pubs;
            }
        }

        const researchPapersEl = document.getElementById("researchPapers");
        if (researchPapersEl) {
            researchPapersEl.textContent = publicationsList.length > 0 ? publicationsList.length : 0;
        }

        const pubListContainer = document.querySelector(".publication-list");
        if (pubListContainer && publicationsList.length > 0) {
            pubListContainer.innerHTML = "";
            publicationsList.slice(0, 3).forEach(pub => {
                // If pub is an object, try to extract title and year/publisher
                let title = pub.title || pub.name || (typeof pub === 'string' ? pub : "Publication");
                let detail = pub.publisher || pub.year || pub.journal || "Research Publication";
                
                const card = document.createElement("div");
                card.className = "publication-card";
                card.innerHTML = `
                    <h3>${title}</h3>
                    <p>${detail}</p>
                `;
                pubListContainer.appendChild(card);
            });
        }

        // PROJECT COUNT

        const { data: projects } = await supabaseClient
            .from("projects_v2")
            .select("*")
            .eq("faculty_id", user.id);

        document.getElementById("totalProjects").textContent =
            projects ? projects.length : 0;

        // STUDENT COUNT

        let students = 0;

        if (projects) {
            projects.forEach(project => {
                students += project.students_needed || 0;
            });
        }

        document.getElementById("totalStudents").textContent = students;
    }
};

async function logout() {
    if (typeof supabaseClient !== 'undefined') {
        await supabaseClient.auth.signOut();
    }
    sessionStorage.removeItem('current_user_profile');
    sessionStorage.removeItem('current_faculty_master_email');
    sessionStorage.removeItem('current_faculty_auth_email');
    window.location.href = "../index.html";
}