let filteredProjects = [];
let allProjects = [];

document.addEventListener("DOMContentLoaded", async () => {
    if (!checkSupabaseConfigured()) return;
    
    const session = await supabaseClient.auth.getSession();
    if (!session.data.session) {
        window.location.href = "../auth/student.html";
        return;
    }

    const userId = session.data.session.user.id;
    document.getElementById("userName").textContent = session.data.session.user.user_metadata?.full_name || "Student";

    await loadProjects();
    setupEventListeners();
});

async function loadProjects() {
    try {
        // Fetch all open projects with faculty details
        const { data, error } = await supabaseClient
          .from("projects_v2")
            .select(`
                id,
                title,
                description,
                department,
                category,
                skills_required,
                positions_available,
                positions_filled,
                duration,
                preferred_year,
                status,
                faculty:faculty_id (full_name, email)
            `)
            .eq("status", "open")
            .order("created_at", { ascending: false });

        if (error) throw error;

        allProjects = data || [];
        
        // Mock a project if the database is empty so the user can see the design
        if (allProjects.length === 0) {
            allProjects.push({
                id: "dummy-1",
                title: "Machine Learning for Medical Diagnosis",
                description: "Develop a deep learning model to assist in early detection of diseases from medical imaging. This project involves working with CNNs, image processing, and healthcare datasets.",
                department: "CSE",
                category: "Research",
                skills_required: ["Python", "TensorFlow", "Machine Learning", "Image Processing"],
                positions_available: 3,
                positions_filled: 1,
                duration: "6 months",
                preferred_year: "3rd Year, 4th Year",
                status: "open",
                faculty: {
                    full_name: "Dr. Sarah Johnson",
                    email: "sarah@example.com"
                }
            });
        }

        filteredProjects = [...allProjects];
        displayProjects();
        updateStats();
    } catch (err) {
        console.error("Error loading projects:", err);
        alert("Failed to load projects: " + err.message);
    }
}

function displayProjects() {
    const container = document.getElementById("projectsContainer") || document.getElementById("projectsTableBody");
    const emptyState = document.getElementById("emptyState");

    if (!container) return;

    if (filteredProjects.length === 0) {
        container.innerHTML = "";
        if (emptyState) emptyState.style.display = "block";
        return;
    }

    if (emptyState) emptyState.style.display = "none";
    container.innerHTML = filteredProjects.map(project => `
<div class="project-card">
  <div class="card-top">
    <!-- LEFT -->
    <div class="left-content">
      <div class="tags">
        <span class="status">${project.status === 'open' ? 'Open' : 'Closed'}</span>
        <span class="category">${project.category || 'Research'}</span>
      </div>
      <h1 class="project-title">${project.title}</h1>
      <p class="description">${project.description}</p>
      <div class="mentor">
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(project.faculty?.full_name || 'Faculty')}&background=random" alt="mentor">
        <div>
          <h4>${project.faculty?.full_name || "N/A"}</h4>
          <span>${project.department}</span>
        </div>
      </div>
      <div class="skills-section">
        <h3>Required Skills</h3>
        <div class="card-skills">
          ${(project.skills_required || []).length ? (project.skills_required).map(s => `<span>${s}</span>`).join("") : '<span>No specific skills</span>'}
        </div>
      </div>
      <p class="preferred">Preferred: ${project.preferred_year || 'Any Year'}</p>
    </div>
    <!-- RIGHT -->
    <div class="right-content">
      <div class="info-box">
        <div class="info-label">👥 Positions</div>
        <div class="info-value">${project.positions_filled || 0}/${project.positions_available || 1} filled</div>
      </div>
      <div class="info-box">
        <div class="info-label">📅 Duration</div>
        <div class="info-value">${project.duration || "N/A"}</div>
      </div>
    </div>
  </div>
  <!-- BUTTONS -->
  <div class="card-buttons">
    <button class="details-btn">View Details</button>
    <button class="card-apply-btn" onclick="applyProject(${project.id})">Apply Now</button>
  </div>
</div>
    `).join("");
}

function setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    const deptFilter = document.getElementById("deptFilter");
    const categoryFilter = document.getElementById("categoryFilter");

    searchInput?.addEventListener("input", filterProjects);
    deptFilter?.addEventListener("change", filterProjects);
    categoryFilter?.addEventListener("change", filterProjects);
}

function filterProjects() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const dept = document.getElementById("deptFilter").value;
    const category = document.getElementById("categoryFilter").value;

    filteredProjects = allProjects.filter(project => {
        const matchSearch = !search || 
            (project.title && project.title.toLowerCase().includes(search)) ||
            (project.description && project.description.toLowerCase().includes(search)) ||
            (project.faculty?.full_name && project.faculty.full_name.toLowerCase().includes(search));
        
        const matchDept = !dept || project.department === dept;
        const matchCategory = !category || project.category === category;

        return matchSearch && matchDept && matchCategory;
    });

    displayProjects();
}

function updateStats() {
    document.getElementById("totalProjects").textContent = allProjects.length;
    // TODO: Fetch user's application count from applications table
    document.getElementById("myApplications").textContent = "0";
}

async function applyProject(projectId) {
    const session = await supabaseClient.auth.getSession();
    const userId = session.data.session.user.id;

    // TODO: Create applications table and insert application
    alert("Application feature coming soon!");
}

function goToProfile() {
    window.location.href = "../student/applications.html";
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "../index.html";
}
