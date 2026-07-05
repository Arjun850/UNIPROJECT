sessionStorage.clear(); // Reset tab cache for active profiles

function goBack() {
    window.location.href = "../index.html";
}

/* TOGGLE */
function showLogin() {
    document.getElementById("loginBox").classList.add("active");
    document.getElementById("signupBox").classList.remove("active");

    document.getElementById("loginTab").classList.add("active");
    document.getElementById("signupTab").classList.remove("active");
}

function showSignup() {
    document.getElementById("signupBox").classList.add("active");
    document.getElementById("loginBox").classList.remove("active");

    document.getElementById("signupTab").classList.add("active");
    document.getElementById("loginTab").classList.remove("active");
}

async function insertFacultyProfile(userId, profile) {
    const { error } = await supabaseClient.from("faculty").insert([{ 
        user_id: userId,
        full_name: profile.name,
        email: profile.email,
        dept: profile.dept,
        expertise: profile.expertise
    }]);
    return error;
}

/* SIGNUP */
async function signup() {
    if (!checkSupabaseConfigured()) return;

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const pass = document.getElementById("signupPass").value.trim();
    const dept = document.getElementById("department").value;
    const exp = document.getElementById("expertise").value.trim();

    if (!name || !email || !pass || dept === "Select department") {
        alert("Please fill all fields properly.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password: pass
    }, {
        data: {
            full_name: name,
            role: "faculty"
        }
    });

    if (error) {
        alert(error.message);
        return;
    }

    const userId = data.user?.id;
    if (!userId) {
        alert("Signup failed to create a user.");
        return;
    }

    const profileError = await insertFacultyProfile(userId, { name, email, dept, expertise: exp });
    if (profileError) {
        alert("Signup succeeded but saving profile failed: " + profileError.message);
        return;
    }

    alert("Account created successfully! Please verify your email if required, then login.");
    showLogin();
}

/* LOGIN */
async function login() {
    if (!checkSupabaseConfigured()) return;

    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPass").value.trim();

    if (!email || !pass) {
        alert("Please enter email and password.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password: pass
    });

    if (error) {
        alert(error.message);
        return;
    }

    if (!data.session) {
        alert("Unable to sign in. Please try again.");
        return;
    }

    const userRole = data.user?.user_metadata?.role;
    if (userRole === 'student' || email.startsWith('dummy')) {
        alert("Error: You are trying to log in with a Student account on the Faculty portal.");
        await supabaseClient.auth.signOut();
        return;
    }

    const resolvedEmail = typeof resolveFacultyMasterEmail === "function"
        ? await resolveFacultyMasterEmail(data.user?.email || email)
        : (data.user?.email || email);

    const facultyProfile = typeof resolveFacultyMasterProfile === "function"
        ? await resolveFacultyMasterProfile(data.user?.email || email)
        : null;

    if (facultyProfile) {
        const initials = (facultyProfile.name || "Faculty")
            .split(' ')
            .map(part => part[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        sessionStorage.removeItem('current_user_profile');

        sessionStorage.setItem('current_user_profile', JSON.stringify({
            id: data.user?.id,
            name: facultyProfile.name || data.user?.user_metadata?.full_name || "Faculty",
            role: "Professor",
            initials: initials,
            color: 'bg-[#4F46E5]',
            avatarImg: facultyProfile.photo_url || null,
            email: resolvedEmail || data.user?.email || email
        }));
    }

    window.location.href = "../faculty/dashboard-new.html";
}

/* GOOGLE LOGIN */
async function loginWithGoogle() {
    if (!checkSupabaseConfigured()) return;

    try {
        // Dynamically resolve base path (handles local dev server paths like /ipyo/ or /ip_final/ipyo/)
        const currentPath = window.location.pathname;
        const authIndex = currentPath.indexOf('/auth/');
        const basePath = authIndex !== -1 ? currentPath.substring(0, authIndex) : '';
        const redirectUrl = window.location.origin + basePath + '/faculty/dashboard-new.html';

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    hd: 'iiitd.ac.in', // Force selector to only show iiitd.ac.in accounts
                    prompt: 'select_account'
                }
            }
        });

        if (error) {
            alert("Google Sign-In failed: " + error.message);
        }
    } catch (e) {
        console.error("Google Sign-In Exception: ", e);
        alert("An error occurred during Google Sign-In.");
    }
}
