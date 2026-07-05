let currentUserId = null;
let currentEmail = "";
let existingProfileImage = null;

// Helper to parse student email (e.g. vinit23598@iiitd.ac.in)
function parseEmailDetails(email) {
    if (!email) return { name: "", rollNo: "" };
    const usernamePart = email.split('@')[0]; // "vinit23598"
    // Match alphabetical prefix and numeric suffix
    const match = usernamePart.match(/^([a-zA-Z]+)(\d*)$/);
    if (match) {
        const namePart = match[1];
        const rollPart = match[2];
        // Capitalize first letter
        const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        return { name: capitalizedName, rollNo: rollPart };
    }
    // Fallback if format is different
    const capitalizedUser = usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1);
    return { name: capitalizedUser, rollNo: "" };
}

async function initEdit() {
    if (!checkSupabaseConfigured()) return;

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const session = sessionData.session;
    if (!session) {
        window.location.href = "../auth/student.html";
        return;
    }

    currentUserId = session.user.id;
    currentEmail = session.user.email || "";

    // 1. Try to load student record (with roll_number column if it exists)
    let student = null;
    try {
        const { data, error } = await supabaseClient
            .from("students")
            .select("full_name, email, dept, program, year, roll_number")
            .eq("user_id", currentUserId)
            .single();
        if (!error) {
            student = data;
        } else {
            // Retry without roll_number column for backward compatibility
            const { data: fallbackData } = await supabaseClient
                .from("students")
                .select("full_name, email, dept, program, year")
                .eq("user_id", currentUserId)
                .single();
            student = fallbackData;
        }
    } catch (e) {
        console.error("Error fetching students:", e);
    }

    // 2. Try to load student profile record
    let extras = null;
    try {
        const withRoll = await supabaseClient
            .from("student_profiles")
            .select("*, roll_number")
            .eq("user_id", currentUserId)
            .single();

        if (!withRoll.error) {
            extras = withRoll.data;
        } else {
            const fallback = await supabaseClient
                .from("student_profiles")
                .select("*")
                .eq("user_id", currentUserId)
                .single();
            if (!fallback.error) extras = fallback.data;
        }
    } catch (e) {
        console.error("Error fetching student_profiles:", e);
    }

    // 3. Auto-parse email for Name and Roll Number if empty
    const parsed = parseEmailDetails(currentEmail);

    document.getElementById("fullName").value = extras?.full_name || student?.full_name || session.user.user_metadata?.full_name || parsed.name || "";
    document.getElementById("emailInput").value = extras?.email || student?.email || currentEmail;
    document.getElementById("rollNoInput").value = extras?.roll_number || student?.roll_number || parsed.rollNo || "";
    document.getElementById("deptInput").value = extras?.dept || student?.dept || "";
    document.getElementById("programInput").value = extras?.program || student?.program || "";
    document.getElementById("yearInput").value = extras?.year || student?.year || "";
    document.getElementById("domainInput").value = extras?.domain || "";
    document.getElementById("skillsInput").value = (extras?.skills || []).join(", ");
    document.getElementById("bioInput").value = extras?.bio || "";
    document.getElementById("githubEditInput").value = extras?.github_url || "";
    document.getElementById("linkedinEditInput").value = extras?.linkedin_url || "";
    document.getElementById("portfolioEditInput").value = extras?.portfolio_url || "";

    existingProfileImage = extras?.profile_image || null;

    document.getElementById("uploadEditPic").addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function () {
            existingProfileImage = reader.result;
        };
        reader.readAsDataURL(file);
    });

    document.getElementById("saveBtn").addEventListener("click", saveAllChanges);
    document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "./applications.html";
    });
}

async function saveAllChanges() {
    const fullName = document.getElementById("fullName").value.trim();
    const dept = document.getElementById("deptInput").value.trim();
    const program = document.getElementById("programInput").value.trim();
    const year = document.getElementById("yearInput").value.trim();
    const rollNo = document.getElementById("rollNoInput").value.trim();

    const domain = document.getElementById("domainInput").value.trim();
    const bio = document.getElementById("bioInput").value.trim();
    const github_url = document.getElementById("githubEditInput").value.trim();
    const linkedin_url = document.getElementById("linkedinEditInput").value.trim();
    const portfolio_url = document.getElementById("portfolioEditInput").value.trim();
    const skills = document.getElementById("skillsInput").value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const picFile = document.getElementById("uploadEditPic").files[0];

    // Disable button or show loading
    const saveBtn = document.getElementById("saveBtn");
    const originalBtnText = saveBtn.innerText;
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    if (picFile) {
        try {
            const fileExt = picFile.name.split('.').pop();
            const fileName = `${currentUserId}_${Date.now()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            let { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(filePath, picFile);

            if (uploadError) throw uploadError;

            const { data } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(filePath);

            existingProfileImage = data.publicUrl;
        } catch (err) {
            console.error("Image upload failed:", err.message);
            alert("Image upload failed. Please make sure the 'avatars' bucket exists and is public.");
            saveBtn.innerText = originalBtnText;
            saveBtn.disabled = false;
            return;
        }
    }

    // Save to students table
    let { error: studentsError } = await supabaseClient
        .from("students")
        .upsert([
            {
                user_id: currentUserId,
                full_name: fullName || "",
                email: currentEmail,
                dept: dept || "",
                program: program || "",
                year: year || "",
                roll_number: rollNo || ""
            }
        ], { onConflict: "user_id" });

    // Fallback if roll_number column doesn't exist in students table yet
    if (studentsError && studentsError.message?.toLowerCase().includes("roll_number")) {
        const { error: fallbackErr } = await supabaseClient
            .from("students")
            .upsert([
                {
                    user_id: currentUserId,
                    full_name: fullName || "",
                    email: currentEmail,
                    dept: dept || "",
                    program: program || "",
                    year: year || ""
                }
            ], { onConflict: "user_id" });
        studentsError = fallbackErr;
    }

    // Save to student_profiles table
    let { error: profileError } = await supabaseClient
        .from("student_profiles")
        .upsert([
            {
                user_id: currentUserId,
                full_name: fullName || "",
                email: currentEmail,
                dept: dept || "",
                program: program || "",
                year: year || "",
                profile_image: existingProfileImage,
                skills,
                domain: domain || "",
                bio: bio || "",
                github_url: github_url || null,
                linkedin_url: linkedin_url || null,
                portfolio_url: portfolio_url || null,
                roll_number: rollNo || null
            }
        ], { onConflict: "user_id" });

    // Fallback if roll_number column doesn't exist in student_profiles table yet
    if (profileError && profileError.message?.toLowerCase().includes("roll_number")) {
        let fallback = await supabaseClient
            .from("student_profiles")
            .upsert([
                {
                    user_id: currentUserId,
                    full_name: fullName || "",
                    email: currentEmail,
                    dept: dept || "",
                    program: program || "",
                    year: year || "",
                    profile_image: existingProfileImage,
                    skills,
                    domain: domain || "",
                    bio: bio || "",
                    github_url: github_url || null,
                    linkedin_url: linkedin_url || null,
                    portfolio_url: portfolio_url || null
                }
            ], { onConflict: "user_id" });
        profileError = fallback.error;
    }

    // Fallback if bio column doesn't exist either
    if (profileError && profileError.message?.toLowerCase().includes("bio")) {
        const fallback = await supabaseClient
            .from("student_profiles")
            .upsert([
                {
                    user_id: currentUserId,
                    full_name: fullName || "",
                    email: currentEmail,
                    dept: dept || "",
                    program: program || "",
                    year: year || "",
                    profile_image: existingProfileImage,
                    skills,
                    domain: domain || ""
                }
            ], { onConflict: "user_id" });
        profileError = fallback.error;
    }

    if (studentsError || profileError) {
        console.error("studentsError:", studentsError, "profileError:", profileError);
        alert("Profile save failed. Check console.");
        saveBtn.innerText = originalBtnText;
        saveBtn.disabled = false;
        return;
    }

    window.location.href = "applications.html";
}

async function logout() {
    if (checkSupabaseConfigured()) await supabaseClient.auth.signOut();
    window.location.href = "../index.html";
}

initEdit();
