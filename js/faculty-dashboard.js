function goHome() {
    window.location.href = "../index.html";
}

/* PROFILE MENU */
function toggleMenu() {
    const menu = document.getElementById("menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

/* LOGOUT */
function logout() {
    sessionStorage.removeItem('current_user_profile');
    sessionStorage.removeItem('current_faculty_master_email');
    sessionStorage.removeItem('current_faculty_auth_email');
    localStorage.clear();
    window.location.href = "../index.html";
}

/* LOAD PROFILE IMAGE */
function loadProfilePic() {
    const pic = localStorage.getItem("profilePic");
    const nav = document.getElementById("navPic");

    if (pic) {
        nav.src = pic;
        nav.style.display = "block";
    }
}

/* ADD PROJECT */
function addProject() {
    const title = prompt("Enter project title:");
    if (!title) return;

    let projects = JSON.parse(localStorage.getItem("projects")) || [];

    projects.push({ title });
    localStorage.setItem("projects", JSON.stringify(projects));

    loadProjects();
}

/* LOAD PROJECTS */
function loadProjects() {
    const list = document.getElementById("projectList");
    const projects = JSON.parse(localStorage.getItem("projects")) || [];

    if (projects.length === 0) return;

    list.innerHTML = "";

    projects.forEach(p => {
        const div = document.createElement("div");
        div.innerText = p.title;
        list.appendChild(div);
    });

    document.getElementById("totalProjects").innerText = projects.length;
}

loadProjects();
loadProfilePic();