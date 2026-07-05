window.onload = async function () {

    if (typeof supabaseClient !== 'undefined') {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session || !session.user) {

            window.location.href =
                "../auth/faculty-auth.html";

            return;
        }

        const user = session.user;
        const metadata = user.user_metadata || {};

        const userEmail = typeof resolveFacultyMasterEmail === "function"
            ? await resolveFacultyMasterEmail(user.email)
            : user.email;

        // Fetch from faculty_master
        const { data: facultyDataList } = await supabaseClient
            .from("faculty_master")
            .select("*")
            .eq("email", userEmail);

        let faculty = {};
        if (facultyDataList && facultyDataList.length > 0) {
            faculty = facultyDataList[0];
        }

        // PREFILL ALL FIELDS Dynamically

        document.getElementById("fullName").value =
            faculty.name || metadata.full_name || "";

        document.getElementById("email").value =
            faculty.email || user.email || "";

        document.getElementById("department").value = faculty.department || metadata.department || "";
        document.getElementById("designation").value = faculty.designation || metadata.designation || "";
        
        let experience = faculty.education || metadata.experience || "";
        if (experience && !experience.toLowerCase().includes("experience") && !faculty.education) {
            experience += " Experience";
        }
        document.getElementById("experience").value = experience;

        let researchDomain = metadata.research_domain || "";
        let skillsStr = metadata.skills || "";
        
        if (faculty.research_interests) {
            let interests = faculty.research_interests;
            if (typeof interests === 'string') {
                try { interests = JSON.parse(interests); } catch(e) { interests = [interests]; }
            }
            if (Array.isArray(interests) && interests.length > 0) {
                researchDomain = interests[0];
                skillsStr = interests.join(", ");
            } else if (typeof interests === 'object' && interests !== null) {
                const keys = Object.keys(interests);
                if (keys.length > 0) {
                    researchDomain = keys[0];
                    skillsStr = keys.join(", ");
                }
            }
        }
        
        document.getElementById("researchDomain").value = researchDomain;
        document.getElementById("skills").value = skillsStr;
        document.getElementById("bio").value = faculty.biography || metadata.bio || "";
        document.getElementById("linkedin").value = metadata.linkedin || "";
        document.getElementById("portfolio").value = faculty.website || metadata.portfolio || "";
    }
};

document.getElementById("facultyEditForm")
.addEventListener("submit", async function (e) {

    e.preventDefault();

    const fullName =
        document.getElementById("fullName").value;

    const bio =
        document.getElementById("bio").value;

    const department =
        document.getElementById("department").value;

    const designation =
        document.getElementById("designation").value;

    const experience =
        document.getElementById("experience").value;

    const researchDomain =
        document.getElementById("researchDomain").value;

    const skills =
        document.getElementById("skills").value;

    const linkedin =
        document.getElementById("linkedin").value;

    const portfolio =
        document.getElementById("portfolio").value;

        if (typeof supabaseClient !== 'undefined') {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session || !session.user) {
            alert("Session expired. Please log in again.");
            window.location.href = "../auth/faculty-auth.html";
            return;
        }
        const user = session.user;
        
        const userEmail = typeof resolveFacultyMasterEmail === "function"
            ? await resolveFacultyMasterEmail(user.email)
            : user.email;

        // UPDATE AUTH METADATA
        const { error } = await supabaseClient.auth.updateUser({
            data: {
                full_name: fullName,
                bio: bio,
                department: department,
                designation: designation,
                experience: experience,
                research_domain: researchDomain,
                skills: skills,
                linkedin: linkedin,
                portfolio: portfolio
            }
        });

        if (error) {
            alert("Error updating profile: " + error.message);
            return;
        }

        // Propagate name and department updates to existing projects
        const { error: projectsError } = await supabaseClient
            .from("projects_v2")
            .update({
                faculty_name: fullName,
                faculty_dept: department
            })
            .eq("faculty_id", user.id);

        if (projectsError) {
            console.error("Error updating projects:", projectsError);
        }

        // Propagate updates to faculty_master table
        let skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
        const { error: facultyMasterError } = await supabaseClient
            .from("faculty_master")
            .upsert({
                name: fullName,
                email: userEmail,
                department: department,
                designation: designation,
                education: experience,
                biography: bio,
                website: portfolio,
                research_interests: skillsArray
            }, { onConflict: "email" });

        if (facultyMasterError) {
            console.error("Error updating faculty_master:", facultyMasterError);
            
            // If upsert with email onConflict fails because email is not the primary key, try update instead
            if (facultyMasterError.code === "PGRST116" || facultyMasterError.message.includes("conflict")) {
                const { error: updateError } = await supabaseClient
                    .from("faculty_master")
                    .update({
                        name: fullName,
                        department: department,
                        designation: designation,
                        education: experience,
                        biography: bio,
                        website: portfolio,
                        research_interests: skillsArray
                    })
                    .eq("email", userEmail);
                
                if (updateError) console.error("Error with update fallback:", updateError);
            }
        }

        // Backward compatibility: keep updating the old faculty table too if it exists
        const { error: facultyTableError } = await supabaseClient
            .from("faculty")
            .update({
                full_name: fullName,
                dept: department,
                expertise: researchDomain
            })
            .eq("user_id", user.id);

        if (facultyTableError) {
            console.error("Error updating faculty table:", facultyTableError);
        }

        // Reset the sessionStorage cache to reflect the new name in details, chat, and roster pages
        sessionStorage.removeItem('current_user_profile');

        alert("Faculty profile updated successfully!");
        window.location.href = "faculty-profile.html";
    }
});

// SYNC PROFILE FROM IIIT DELHI WEBSITE LOGIC
document.getElementById("syncBtn").addEventListener("click", async function () {
    const syncUrlInput = document.getElementById("syncUrl");
    const syncStatus = document.getElementById("syncStatus");
    const syncBtn = document.getElementById("syncBtn");

    const url = syncUrlInput.value.trim();
    if (!url) {
        alert("Please enter a IIIT Delhi faculty profile URL first.");
        return;
    }

    if (!url.toLowerCase().includes("iiitd.ac.in") && !url.toLowerCase().includes("iiitd.edu.in")) {
        alert("Please enter a valid IIIT Delhi faculty profile URL (containing iiitd.ac.in).");
        return;
    }

    // Disable button & show loading status
    syncBtn.disabled = true;
    syncStatus.textContent = "⌛ Fetching profile from IIIT Delhi directory...";
    syncStatus.className = "text-[11px] mt-2 font-semibold text-indigo-600 block";

    try {
        // Use allorigins CORS proxy to fetch the raw html
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error("Failed to fetch webpage contents.");
        }

        const htmlText = await response.text();
        
        // Parse the HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // 1. Full Name
        const nameEl = doc.querySelector(".profile-info h3 .field-content") || 
                       doc.querySelector(".profile-info h3") || 
                       doc.querySelector(".pane-node-title .pane-content");
        if (nameEl) {
            const name = nameEl.textContent.trim();
            if (name) document.getElementById("fullName").value = name;
        }

        // 2. Designation & Department
        const desgEl = doc.querySelector(".profile-info span .field-content") || 
                       doc.querySelector(".profile-info span");
        if (desgEl) {
            const text = desgEl.textContent.trim(); // e.g. "Professor (CSE)"
            const match = text.match(/^([^(]+)(?:\(([^)]+)\))?/);
            if (match) {
                const designation = match[1].trim();
                document.getElementById("designation").value = designation;
                
                if (match[2]) {
                    const deptCode = match[2].trim().toUpperCase();
                    const deptMap = {
                        'CSE': 'Computer Science and Engineering',
                        'CSAI': 'Computer Science and Artificial Intelligence',
                        'ECE': 'Electronics and Communication Engineering',
                        'CB': 'Computational Biology',
                        'SSH': 'Social Sciences and Humanities',
                        'HCD': 'Human-Centered Design',
                        'MTH': 'Mathematics',
                        'CSSS': 'Computer Science and Social Sciences',
                        'CSAM': 'Computer Science and Applied Mathematics',
                        'CSD': 'Computer Science and Design',
                        'CSB': 'Computer Science and Biosciences'
                    };
                    document.getElementById("department").value = deptMap[deptCode] || deptCode;
                }
            }
        }

        // 3. Email
        const emailIcon = doc.querySelector(".fa-envelope");
        if (emailIcon) {
            const contactBox = emailIcon.closest(".contact-box-p");
            if (contactBox) {
                const emailEl = contactBox.querySelector(".field-content");
                if (emailEl) {
                    const email = emailEl.textContent.trim();
                    if (email) {
                        // Email is read-only, but we show it as updated/synced if needed
                        document.getElementById("email").value = email;
                    }
                }
            }
        }

        // 4. Bio
        const bioEl = doc.querySelector(".about .field-content") || doc.querySelector(".about");
        let parsedBio = "";
        if (bioEl) {
            const paras = Array.from(bioEl.querySelectorAll("p")).map(p => p.textContent.trim()).filter(t => t.length > 0);
            if (paras.length > 0) {
                parsedBio = paras.join("\n\n");
            } else {
                parsedBio = bioEl.textContent.trim();
            }
            if (parsedBio) document.getElementById("bio").value = parsedBio;
        }

        // 5. Research Expertise & Domain
        const headers = Array.from(doc.querySelectorAll("h2.rit-titl"));
        const researchHeader = headers.find(h => h.textContent.includes("Research Interests"));
        if (researchHeader) {
            let nextEl = researchHeader.nextElementSibling;
            while (nextEl && !nextEl.classList.contains("work-exp")) {
                nextEl = nextEl.nextElementSibling;
            }
            if (nextEl) {
                const paras = Array.from(nextEl.querySelectorAll("p")).map(p => p.textContent.trim()).filter(t => t.length > 0);
                if (paras.length > 0) {
                    document.getElementById("skills").value = paras.join(", ");
                    document.getElementById("researchDomain").value = paras[0] || "";
                } else {
                    const skillsStr = nextEl.textContent.trim().replace(/\n+/g, ", ");
                    document.getElementById("skills").value = skillsStr;
                    document.getElementById("researchDomain").value = skillsStr.split(",")[0]?.trim() || "";
                }
            }
        }

        // 6. Experience (Auto-calculate from Bio)
        if (parsedBio) {
            const joinMatch = parsedBio.match(/joined IIIT[- ]?Delhi in (\d{4})/i) || 
                              parsedBio.match(/joined the institute in (\d{4})/i) ||
                              parsedBio.match(/joined IIITD in (\d{4})/i);
            if (joinMatch) {
                const joinYear = parseInt(joinMatch[1]);
                const currentYear = new Date().getFullYear();
                const years = currentYear - joinYear;
                if (years > 0) {
                    document.getElementById("experience").value = `${years} Years`;
                }
            }
        }

        // 7. Portfolio
        const globeIcon = doc.querySelector(".fa-globe");
        if (globeIcon) {
            const contactBox = globeIcon.closest(".contact-box-p");
            if (contactBox) {
                const linkEl = contactBox.querySelector("a");
                if (linkEl) {
                    const urlVal = linkEl.getAttribute("href") || "";
                    if (urlVal) document.getElementById("portfolio").value = urlVal;
                }
            }
        }

        // Feedback success
        syncStatus.textContent = "✅ Profile synced successfully! Please review the fields and click 'Save Changes' to update.";
        syncStatus.className = "text-[11px] mt-2 font-semibold text-emerald-600 block";

    } catch (error) {
        console.error("Error syncing profile:", error);
        syncStatus.textContent = "❌ Failed to sync profile. Please check the URL and try again.";
        syncStatus.className = "text-[11px] mt-2 font-semibold text-rose-600 block";
    } finally {
        syncBtn.disabled = false;
    }
});

