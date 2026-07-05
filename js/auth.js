sessionStorage.clear(); // Reset tab cache for active profiles

function goHome() {
    window.location.href = "../index.html";
}

/* ================= TOGGLE ================= */

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

/* ================= SIGNUP ================= */

async function insertStudentProfile(userId, profile) {
    const { error } = await supabaseClient.from("students").insert([{ 
        user_id: userId,
        full_name: profile.name,
        email: profile.email,
        dept: profile.dept,
        program: profile.program,
        year: profile.year
    }]);
    return error;
}

async function signup() {
    if (!checkSupabaseConfigured()) return;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const pass = document.getElementById("signupPass").value.trim();
    const dept = document.getElementById("dept").value;
    const program = document.getElementById("program").value;
    const year = document.getElementById("year").value.trim();

    if (!name || !email || !pass || dept === "Select department" || program === "Select program" || !year) {
        alert("Please fill all fields properly.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password: pass
    }, {
        data: {
            full_name: name,
            role: "student"
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

    const profileError = await insertStudentProfile(userId, { name, email, dept, program, year });
    if (profileError) {
        alert("Signup succeeded but saving profile failed: " + profileError.message);
        return;
    }

    alert("Account created successfully! Please verify your email if required, then login.");
    showLogin();
}

/* ================= LOGIN ================= */

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
    if (userRole === 'faculty' || email === window.FACULTY_MASTER_DUMMY_EMAIL) {
        alert("Error: You are trying to log in with a Faculty account on the Student portal.");
        await supabaseClient.auth.signOut();
        return;
    }

    window.location.href = "../student/dashboard-new.html";
}

/* ================= LOGOUT ================= */

async function logout() {
    sessionStorage.clear(); // Clear cached profile roles for tabs
    if (checkSupabaseConfigured()) {
        await supabaseClient.auth.signOut();
    }

    window.location.href = "../index.html";
}

/* ================= GOOGLE LOGIN ================= */
async function loginWithGoogle() {
    if (!checkSupabaseConfigured()) return;

    try {
        // Dynamically resolve base path (handles local dev server paths like /ipyo/ or /ip_final/ipyo/)
        const currentPath = window.location.pathname;
        const authIndex = currentPath.indexOf('/auth/');
        const basePath = authIndex !== -1 ? currentPath.substring(0, authIndex) : '';
        const redirectUrl = window.location.origin + basePath + '/student/dashboard-new.html';

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
