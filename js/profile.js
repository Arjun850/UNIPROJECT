// profile.js

const username = document.getElementById("username");
const bigImg = document.getElementById("profilePicLarge");
const bigInitial = document.getElementById("profileInitialLarge");
const uploadPic = document.getElementById("uploadPic");

const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const rollNoEl = document.getElementById("rollNo");
const deptEl = document.getElementById("dept");
const programEl = document.getElementById("program");
const yearEl = document.getElementById("year");

const domainEl = document.getElementById("domain");
const skillsList = document.getElementById("skillsList");
const bioEl = document.getElementById("bio");

let currentUserId = null;
let user = {
    name: "",
    email: "",
    rollNo: "",
    dept: "",
    program: "",
    year: "",
    profileImage: "",
    skills: [],
    domain: "",
    bio: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
    applications_count: 0,
    accepted_count: 0
};
let skills = [];

// Helper to parse student email (e.g. vinit23598@iiitd.ac.in)
function parseEmailDetails(email) {
    if (!email) return { name: "", rollNo: "" };
    const usernamePart = email.split('@')[0];
    const match = usernamePart.match(/^([a-zA-Z]+)(\d*)$/);
    if (match) {
        const namePart = match[1];
        const rollPart = match[2];
        const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        return { name: capitalizedName, rollNo: rollPart };
    }
    const capitalizedUser = usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1);
    return { name: capitalizedUser, rollNo: "" };
}

function applyUserToUI() {
    username.innerText = showField(user.name, "name");
    nameEl.innerText = showField(user.name, "name");
    emailEl.innerText = showField(user.email, "email");
    
    if (rollNoEl) {
        rollNoEl.innerText = user.rollNo ? `Roll: ${user.rollNo}` : "No Roll Number";
    }

    deptEl.innerText = showField(user.dept, "department");
    programEl.innerText = showField(user.program, "program");
    yearEl.innerText = showField(user.year, "year");

    if (user.domain) {
        const hasOption = Array.from(domainEl.options).some((option) => option.value === user.domain);
        if (!hasOption) {
            const custom = document.createElement("option");
            custom.value = user.domain;
            custom.textContent = user.domain;
            domainEl.appendChild(custom);
        }
        domainEl.value = user.domain;
    }

    bioEl.value = user.bio || "";
    
    updateSocialLinks();
    renderAvatar();
    renderSkills();
    updateStats();
}

function updateSocialLinks() {
    const githubLink = document.getElementById("githubLink");
    const linkedinLink = document.getElementById("linkedinLink");
    const portfolioLink = document.getElementById("portfolioLink");
    
    if (user.github_url) { githubLink.href = user.github_url; githubLink.classList.remove("hidden"); } else { githubLink.classList.add("hidden"); }
    if (user.linkedin_url) { linkedinLink.href = user.linkedin_url; linkedinLink.classList.remove("hidden"); } else { linkedinLink.classList.add("hidden"); }
    if (user.portfolio_url) { portfolioLink.href = user.portfolio_url; portfolioLink.classList.remove("hidden"); } else { portfolioLink.classList.add("hidden"); }
}

function updateStats() {
    const apps = JSON.parse(localStorage.getItem("applications") || "[]");
    const userApps = apps.filter((app) => app.student === user.email);
    
    // Use local storage applications if they exist, otherwise fallback to database counts
    const appsCount = userApps.length > 0 ? userApps.length : user.applications_count;
    const acceptedCount = userApps.length > 0 
        ? userApps.filter((app) => app.status?.toLowerCase() === "accepted").length 
        : user.accepted_count;
    
    document.getElementById("statApplications").innerText = appsCount;
    document.getElementById("statAccepted").innerText = acceptedCount;
    document.getElementById("statSkills").innerText = user.skills.length;
    
    // Calculate profile completion percentage
    let filled = 0;
    const totalFields = 10; // name, email, rollNo, dept, program, year, domain, bio, skills, profileImage
    if (user.name) filled++;
    if (user.email) filled++;
    if (user.rollNo) filled++;
    if (user.dept) filled++;
    if (user.program) filled++;
    if (user.year) filled++;
    if (user.domain) filled++;
    if (user.bio) filled++;
    if (user.skills && user.skills.length > 0) filled++;
    if (user.profileImage) filled++;
    
    const percentage = Math.round((filled / totalFields) * 100);
    document.getElementById("statProfileComplete").innerText = `${percentage}%`;
}

function showField(value, label) {
    const text = (value || "").toString().trim();
    return text || `Enter ${label}`;
}

function renderAvatar() {
    bigImg.classList.add("hidden");
    bigInitial.classList.add("hidden");

    if (user.profileImage) {
        bigImg.src = user.profileImage;
        bigImg.classList.remove("hidden");
        return;
    }

    bigInitial.innerText = (user.name || "U")[0].toUpperCase();
    bigInitial.classList.remove("hidden");
}

function renderSkills() {
    if (!skills.length) {
        skillsList.innerHTML = "<p style='color:var(--muted)'>Enter skills in edit/save flow.</p>";
        return;
    }

    skillsList.innerHTML = skills
        .map((skill, index) => `<div class="skill" onclick="removeSkill(${index})">${skill} ✕</div>`)
        .join("");
}

function addSkill() {
    const input = document.getElementById("skillInput");
    const value = input.value.trim();
    if (!value) return;

    skills.push(value);
    input.value = "";
    renderSkills();
    saveProfile();
}

function removeSkill(index) {
    skills.splice(index, 1);
    renderSkills();
    saveProfile();
}

async function loadApplications() {
    const box = document.getElementById("applications");
    let userApps = [];

    // Try fetching from database first
    if (typeof supabaseClient !== 'undefined' && currentUserId) {
        try {
            const { data, error } = await supabaseClient
                .from('applications_v2')
                .select('*')
                .eq('student_id', currentUserId)
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                userApps = data.map(app => ({
                    id: app.id,
                    project: app.project_title,
                    status: app.status ? (app.status.charAt(0).toUpperCase() + app.status.slice(1)) : "Pending",
                    cvName: app.cv_name,
                    cvUrl: app.cv_url
                }));
            }
        } catch (err) {
            console.warn("Could not load applications from Supabase in profile.js:", err);
        }
    }

    // Fallback to local storage if database returned empty or is not loaded
    if (userApps.length === 0) {
        const apps = JSON.parse(localStorage.getItem("applications") || "[]");
        userApps = apps.filter((app) => app.student === user.email);
    }

    // Update the applications count statistic dynamically
    if (document.getElementById("statApplications")) {
        document.getElementById("statApplications").innerText = userApps.length;
    }

    if (!userApps.length) {
        box.innerHTML = `
            <div class="application-card">
                <div>
                    <h4>No Applications Yet</h4>
                    <p>Start exploring projects</p>
                </div>
            </div>
        `;
        return;
    }

    box.innerHTML = userApps
        .map((app) => {
            let statusClass = "pending";
            if (app.status?.toLowerCase() === "accepted" || app.status?.toLowerCase() === "approved") statusClass = "accepted";
            if (app.status?.toLowerCase() === "rejected") statusClass = "rejected";

            let cvHtml = '';
            if (app.cvName) {
                const cvLink = app.cvUrl ? `<a href="${app.cvUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">${app.cvName}</a>` : app.cvName;
                cvHtml = `<p style="font-size:10px; color:#4f46e5; margin-top:4px; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 3px;">📎</span> CV: ${cvLink}
                </p>`;
            }

            return `
                <div class="application-card">
                    <div>
                        <h4>${app.project}</h4>
                        <p>Applied Project Request</p>
                        ${cvHtml}
                    </div>
                    <div class="status ${statusClass}">${app.status || "Pending"}</div>
                </div>
            `;
        })
        .join("");
}

async function saveSocials() {
    user.github_url = document.getElementById("githubInput").value.trim();
    user.linkedin_url = document.getElementById("linkedinInput").value.trim();
    user.portfolio_url = document.getElementById("portfolioInput").value.trim();
    updateSocialLinks();
    await saveProfile();
}

async function saveProfile() {
    user.skills = skills;
    user.domain = domainEl.value;
    user.bio = bioEl.value.trim();

    if (!checkSupabaseConfigured()) {
        alert("Supabase not configured.");
        return;
    }

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const session = sessionData.session;
    if (!session) {
        window.location.href = "../auth/student.html";
        return;
    }

    const uid = session.user.id;

    let { error: studentsError } = await supabaseClient
        .from("students")
        .upsert([
            {
                user_id: uid,
                full_name: user.name || "",
                email: user.email || session.user.email,
                dept: user.dept || "",
                program: user.program || "",
                year: user.year || "",
                roll_number: user.rollNo || ""
            }
        ], { onConflict: "user_id" });

    // Fallback if roll_number column doesn't exist yet in students table
    if (studentsError && studentsError.message?.toLowerCase().includes("roll_number")) {
        const { error: fallbackErr } = await supabaseClient
            .from("students")
            .upsert([
                {
                    user_id: uid,
                    full_name: user.name || "",
                    email: user.email || session.user.email,
                    dept: user.dept || "",
                    program: user.program || "",
                    year: user.year || ""
                }
            ], { onConflict: "user_id" });
        studentsError = fallbackErr;
    }

    // Try with bio and roll_number first
    let { error: profileError } = await supabaseClient
        .from("student_profiles")
        .upsert([
            {
                user_id: uid,
                full_name: user.name || "",
                email: user.email || session.user.email,
                dept: user.dept || "",
                program: user.program || "",
                year: user.year || "",
                profile_image: user.profileImage || null,
                skills: skills,
                domain: user.domain || "",
                bio: user.bio || "",
                github_url: user.github_url || null,
                linkedin_url: user.linkedin_url || null,
                portfolio_url: user.portfolio_url || null,
                roll_number: user.rollNo || null
            }
        ], { onConflict: "user_id" });

    // Fallback if roll_number column doesn't exist yet in student_profiles
    if (profileError && profileError.message?.toLowerCase().includes("roll_number")) {
        let fallback = await supabaseClient
            .from("student_profiles")
            .upsert([
                {
                    user_id: uid,
                    full_name: user.name || "",
                    email: user.email || session.user.email,
                    dept: user.dept || "",
                    program: user.program || "",
                    year: user.year || "",
                    profile_image: user.profileImage || null,
                    skills: skills,
                    domain: user.domain || "",
                    bio: user.bio || "",
                    github_url: user.github_url || null,
                    linkedin_url: user.linkedin_url || null,
                    portfolio_url: user.portfolio_url || null
                }
            ], { onConflict: "user_id" });
        profileError = fallback.error;
    }

    // Fallback for old table schema without bio
    if (profileError && profileError.message?.toLowerCase().includes("bio")) {
        const fallback = await supabaseClient
            .from("student_profiles")
            .upsert([
                {
                    user_id: uid,
                    full_name: user.name || "",
                    email: user.email || session.user.email,
                    dept: user.dept || "",
                    program: user.program || "",
                    year: user.year || "",
                    profile_image: user.profileImage || null,
                    skills: skills,
                    domain: user.domain || ""
                }
            ], { onConflict: "user_id" });
        profileError = fallback.error;
    }

    if (studentsError || profileError) {
        console.error("studentsError:", studentsError, "profileError:", profileError);
        alert("Profile save failed. Check table/RLS settings.");
        return;
    }
}

async function initProfile() {
    // Always render non-loading fallback first.
    applyUserToUI();

    if (typeof checkSupabaseConfigured !== "function" || typeof supabaseClient === "undefined") {
        return;
    }

    if (!checkSupabaseConfigured()) return;

    // Legacy fallback for old localStorage-based logins.
    const legacyEmail = localStorage.getItem("currentUser");
    if (legacyEmail) {
        const legacyRaw = localStorage.getItem(legacyEmail);
        if (legacyRaw) {
            try {
                const legacy = JSON.parse(legacyRaw);
                user.name = legacy.name || user.name;
                user.email = legacy.email || user.email;
                user.dept = legacy.dept || user.dept;
                user.program = legacy.program || user.program;
                user.year = legacy.year || user.year;
                applyUserToUI();
            } catch {
                // ignore malformed legacy data
            }
        }
    }

    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    const session = sessionData?.session;
    if (sessionError || !session) {
        return;
    }

    const authUser = session.user;
    currentUserId = authUser.id;

    // Show auth data immediately, then hydrate from DB.
    user.name = authUser.user_metadata?.full_name || user.name;
    user.email = authUser.email || user.email;
    
    // Parse email for auto pre-fills as early fallback
    const parsed = parseEmailDetails(user.email);
    if (!user.name) user.name = parsed.name;
    user.rollNo = parsed.rollNo;
    applyUserToUI();

    // Fetch from students table (with roll_number fallback)
    let studentData = null;
    try {
        const { data, error } = await supabaseClient
            .from("students")
            .select("full_name, email, dept, program, year, roll_number")
            .eq("user_id", currentUserId)
            .single();
        if (!error) {
            studentData = data;
        } else {
            const { data: fallbackData } = await supabaseClient
                .from("students")
                .select("full_name, email, dept, program, year")
                .eq("user_id", currentUserId)
                .single();
            studentData = fallbackData;
        }
    } catch (e) {
        console.error("Error loading students data:", e);
    }

    // Fetch from student_profiles table (with roll_number fallback)
    let extrasData = null;
    try {
        const extrasWithBio = await supabaseClient
            .from("student_profiles")
            .select("*, roll_number")
            .eq("user_id", currentUserId)
            .single();

        if (!extrasWithBio.error) {
            extrasData = extrasWithBio.data;
        } else {
            const extrasFallback = await supabaseClient
                .from("student_profiles")
                .select("*")
                .eq("user_id", currentUserId)
                .single();
            if (!extrasFallback.error) {
                extrasData = extrasFallback.data;
            }
        }
    } catch (e) {
        console.error("Error loading student_profiles data:", e);
    }

    user.name = extrasData?.full_name || studentData?.full_name || authUser.user_metadata?.full_name || parsed.name || user.name;
    user.email = extrasData?.email || studentData?.email || authUser.email || user.email;
    user.rollNo = extrasData?.roll_number || studentData?.roll_number || parsed.rollNo || "";
    user.dept = extrasData?.dept || studentData?.dept || "";
    user.program = extrasData?.program || studentData?.program || "";
    user.year = extrasData?.year || studentData?.year || "";

    user.profileImage = extrasData?.profile_image || "";
    user.skills = Array.isArray(extrasData?.skills) ? extrasData.skills : [];
    user.domain = extrasData?.domain || "";
    user.bio = extrasData?.bio || "";
    user.github_url = extrasData?.github_url || "";
    user.linkedin_url = extrasData?.linkedin_url || "";
    user.portfolio_url = extrasData?.portfolio_url || "";
    user.applications_count = extrasData?.applications_count || 0;
    user.accepted_count = extrasData?.accepted_count || 0;

    skills = [...user.skills];

    applyUserToUI();
    await loadApplications();
}

function goDashboard() {
    window.location.href = "./dashboard-new.html";
}

async function logout() {
    if (checkSupabaseConfigured()) {
        await supabaseClient.auth.signOut();
    }
    window.location.href = "../index.html";
}

uploadPic?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        user.profileImage = reader.result;
        renderAvatar();
    };
    reader.readAsDataURL(file);
});

initProfile();

document.getElementById("portfolioInput")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") saveSocials();
});

document.getElementById("uploadPic")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (!userId) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        let { error: uploadError } = await supabaseClient.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabaseClient.storage
            .from('avatars')
            .getPublicUrl(filePath);

        user.profileImage = data.publicUrl;
        
        await saveProfile();
        renderAvatar();
    } catch (err) {
        console.error("Error uploading image:", err.message);
        alert("Failed to upload image. Please check your storage bucket settings.");
    }
});
