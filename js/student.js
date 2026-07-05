const email = localStorage.getItem("currentUser");
const user = JSON.parse(localStorage.getItem(email));

document.getElementById("username").innerText = user.name;
function goHome() {
    window.location.href = "../index.html";
}
/* LOAD PROJECTS */
function loadProjects() {
    let projects = JSON.parse(localStorage.getItem("projects")) || [];

    const container = document.getElementById("projectContainer");
    container.innerHTML = "";

    document.getElementById("totalProjects").innerText = projects.length;

    const search = document.getElementById("search").value.toLowerCase();
    const status = document.getElementById("statusFilter").value;
    const category = document.getElementById("categoryFilter").value;

    projects
        .filter(p =>
            (p.title.toLowerCase().includes(search) ||
             p.description.toLowerCase().includes(search)) &&
            (!status || p.status === status) &&
            (!category || p.category === category)
        )
        .forEach((p, index) => {
            const div = document.createElement("div");
            div.className = "project-card";

            div.innerHTML = `
                <h3>${p.title}</h3>
                <p>${p.description}</p>
                <p><b>${p.faculty}</b> • ${p.department}</p>
                <p>Duration: ${p.duration}</p>

                <div class="tags">
                    ${p.skills.map(s => `<span>${s}</span>`).join("")}
                </div>

                <div class="buttons">
                    <button onclick="viewDetails(${index})">View Details</button>
                    <button class="apply" onclick="applyProject(${index})">Apply</button>
                </div>
            `;

            container.appendChild(div);
        });
}

/* APPLY */
function applyProject(index) {
    let apps = JSON.parse(localStorage.getItem("applications")) || [];
    let projects = JSON.parse(localStorage.getItem("projects"));

    apps.push({
        student: user.email,
        project: projects[index].title,
        status: "Pending"
    });

    localStorage.setItem("applications", JSON.stringify(apps));

    alert("Applied!");
    updateStats();
}

/* STATS */
function updateStats() {
    let apps = JSON.parse(localStorage.getItem("applications")) || [];

    let userApps = apps.filter(a => a.student === user.email);

    document.getElementById("totalApp").innerText = userApps.length;
    document.getElementById("pending").innerText =
        userApps.filter(a => a.status === "Pending").length;
    document.getElementById("approved").innerText =
        userApps.filter(a => a.status === "Approved").length;
}

/* NOTIFICATIONS */
function showNotifications() {
    let box = document.getElementById("notifBox");
    box.classList.toggle("hidden");

    let apps = JSON.parse(localStorage.getItem("applications")) || [];
    let approved = apps.filter(a => a.student === user.email && a.status === "Approved");

    box.innerHTML = approved.length
        ? approved.map(a => `<p>✅ Accepted: ${a.project}</p>`).join("")
        : "<p>No notifications</p>";
}

/* PROFILE DROPDOWN */
function toggleProfileMenu() {
    document.getElementById("profileMenu").classList.toggle("hidden");
}

/* CLOSE DROPDOWN ON OUTSIDE CLICK */
document.addEventListener("click", function (e) {
    const menu = document.getElementById("profileMenu");
    const profile = document.querySelector(".profile-wrapper");

    if (!profile.contains(e.target)) {
        menu.classList.add("hidden");
    }
});
function goProfile() {
    window.location.href = "applications.html";
}
/* NAVIGATION */
function goApplications() {
     alert("Applications page coming soon");
}



function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "../index.html";
}

/* EVENTS */
document.getElementById("search").addEventListener("input", loadProjects);
document.getElementById("statusFilter").addEventListener("change", loadProjects);
document.getElementById("categoryFilter").addEventListener("change", loadProjects);


/* INIT */
loadProjects();
updateStats();

/* SKILLS */
let skills = user.skills || [];

function renderSkills() {
    const box = document.getElementById("skillsList");
    box.innerHTML = skills.map((s, i) =>
        `<span onclick="removeSkill(${i})">${s} ✖</span>`
    ).join("");
}

function addSkill() {
    const input = document.getElementById("skillInput");

    if (!input.value.trim()) return;

    skills.push(input.value.trim());
    input.value = "";
    renderSkills();
}

function removeSkill(index) {
    skills.splice(index, 1);
    renderSkills();
}

/* SAVE PROFILE */
function saveProfile() {
    user.skills = skills;
    user.domain = document.getElementById("domain").value;

    localStorage.setItem(email, JSON.stringify(user));
    alert("Profile saved!");
}

/* RESUME (basic placeholder) */
function uploadResume() {
    alert("Resume upload feature (backend needed later)");
}

/* INIT */
renderSkills();