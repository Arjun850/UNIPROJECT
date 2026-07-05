const SUPABASE_URL = "https://ycsazxvgxnosetgiqrja.supabase.co/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljc2F6eHZneG5vc2V0Z2lxcmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MjIxNDAsImV4cCI6MjA5NDM5ODE0MH0.v9El7TeFQdNgfzQgTCw6Ggoqz6LZn1ZcCkhmGHYipIk";
const FACULTY_MASTER_DUMMY_EMAIL = "test_prof@iiitd.ac.in";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: window.sessionStorage,
        persistSession: true,
        detectSessionInUrl: true
    }
});

let facultyMasterLocalDatasetPromise = null;

function normalizeFacultyMasterRecord(record) {
    if (!record) {
        return null;
    }

    return {
        id: record.id ?? null,
        name: record.name ?? "",
        email: (record.email || "").trim().toLowerCase(),
        designation: record.designation ?? "",
        department: record.department ?? "",
        photo_url: record.photo_url ?? record.image ?? "",
        education: record.education ?? "",
        phone: record.phone ?? "",
        office: record.office ?? "",
        website: record.website ?? "",
        profile: record.profile ?? record.profileUrl ?? "",
        research_interests: record.research_interests ?? record.researchInterests ?? [],
        teaching_interests: record.teaching_interests ?? record.teachingInterests ?? [],
        labs: record.labs ?? record.affiliatedLabs ?? [],
        publications: record.publications ?? [],
        last_scraped: record.last_scraped ?? null,
        created_at: record.created_at ?? null,
        updated_at: record.updated_at ?? null,
        biography: record.biography ?? ""
    };
}

async function getLocalFacultyMasterDataset() {
    if (Array.isArray(window.FACULTY_MASTER_LOCAL_DATA) && window.FACULTY_MASTER_LOCAL_DATA.length > 0) {
        return window.FACULTY_MASTER_LOCAL_DATA;
    }

    if (!facultyMasterLocalDatasetPromise) {
        facultyMasterLocalDatasetPromise = fetch("../scraper/faculty.json")
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Unable to load local faculty dataset: ${response.status}`);
                }
                return response.json();
            })
            .catch((error) => {
                console.error("Local faculty dataset fallback failed:", error);
                return [];
            });
    }

    return facultyMasterLocalDatasetPromise;
}

async function getFacultyMasterEmailFallback(authEmail) {
    const normalizedEmail = (authEmail || "").trim().toLowerCase();
    const localFaculty = await getLocalFacultyMasterDataset();

    if (!Array.isArray(localFaculty) || localFaculty.length === 0) {
        return authEmail;
    }

    if (normalizedEmail === FACULTY_MASTER_DUMMY_EMAIL) {
        const firstFaculty = normalizeFacultyMasterRecord(localFaculty[0]);
        if (firstFaculty && firstFaculty.email) {
            return firstFaculty.email;
        }
    }

    const matchedFaculty = localFaculty.find((faculty) => (faculty.email || "").trim().toLowerCase() === normalizedEmail);
    if (matchedFaculty && matchedFaculty.email) {
        return matchedFaculty.email;
    }

    const nameMatch = localFaculty.find((faculty) => (faculty.name || "").toLowerCase().includes("subramanyam"));
    if (normalizedEmail === FACULTY_MASTER_DUMMY_EMAIL && nameMatch && nameMatch.email) {
        return nameMatch.email.trim().toLowerCase();
    }

    return authEmail;
}

function checkSupabaseConfigured() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("YOUR_PROJECT_REF") || SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY")) {
        alert("Supabase is not configured yet. Please update js/supabase.js with your Supabase project URL and anon key.");
        return false;
    }
    return true;
}

async function resolveFacultyMasterEmail(authEmail) {
    const normalizedEmail = (authEmail || "").trim().toLowerCase();

    if (!normalizedEmail) {
        return authEmail;
    }

    if (normalizedEmail === FACULTY_MASTER_DUMMY_EMAIL) {
        const { data, error } = await supabaseClient
            .from("faculty_master")
            .select("email")
            .order("id", { ascending: true })
            .limit(1);

        if (!error && data && data.length > 0 && data[0].email) {
            sessionStorage.setItem("current_faculty_master_email", data[0].email);
            return data[0].email;
        }

        const fallbackEmail = await getFacultyMasterEmailFallback(authEmail);
        if (fallbackEmail) {
            sessionStorage.setItem("current_faculty_master_email", fallbackEmail);
            return fallbackEmail;
        }
    }

    const cachedEmail = sessionStorage.getItem("current_faculty_master_email");
    const cachedAuthEmail = sessionStorage.getItem("current_faculty_auth_email");
    if (cachedEmail && cachedAuthEmail === normalizedEmail) {
        return cachedEmail;
    }

    sessionStorage.setItem("current_faculty_master_email", authEmail);
    sessionStorage.setItem("current_faculty_auth_email", normalizedEmail);
    return authEmail;
}

async function resolveFacultyMasterProfile(authEmail) {
    const resolvedEmail = await resolveFacultyMasterEmail(authEmail);

    if (!resolvedEmail) {
        return null;
    }

    const { data, error } = await supabaseClient
        .from("faculty_master")
        .select("*")
        .eq("email", resolvedEmail)
        .maybeSingle();

    if (!error && data) {
        return data;
    }

    const localFaculty = await getLocalFacultyMasterDataset();
    const matchedFaculty = Array.isArray(localFaculty)
        ? localFaculty.find((faculty) => (faculty.email || "").trim().toLowerCase() === String(resolvedEmail).trim().toLowerCase())
        : null;

    return normalizeFacultyMasterRecord(matchedFaculty);
}

window.FACULTY_MASTER_DUMMY_EMAIL = FACULTY_MASTER_DUMMY_EMAIL;
window.resolveFacultyMasterEmail = resolveFacultyMasterEmail;
window.resolveFacultyMasterProfile = resolveFacultyMasterProfile;
