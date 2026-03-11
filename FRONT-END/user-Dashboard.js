/* ==============================
   COMPLAINT DATA STORE
============================== */
let complaints = [
  { id: "CC1023", title: "Street Light Not Working", location: "Vijayawada", category: "Street Light", status: "In Progress", date: "2024-03-09", priority: "High" },
  { id: "CC1024", title: "Garbage Overflow Near Market", location: "Guntur", category: "Garbage", status: "Pending", date: "2024-03-08", priority: "Medium" },
  { id: "CC1025", title: "Road Pothole on Main Street", location: "Hyderabad", category: "Road Issue", status: "Resolved", date: "2024-03-07", priority: "High" },
  { id: "CC1026", title: "Water Supply Disruption", location: "Vijayawada", category: "Water Supply", status: "Pending", date: "2024-03-06", priority: "High" },
  { id: "CC1027", title: "Blocked Drainage", location: "Nellore", category: "Drainage", status: "In Progress", date: "2024-03-05", priority: "Medium" },
];

let currentFilter = "all";

/* ==============================
   SECTION SWITCH
============================== */
function showSection(section, linkEl) {
  ["dashboard","submit","complaints","profile"].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = "none";
  });

  const target = document.getElementById(section);
  if (target) { target.style.display = "block"; }

  document.querySelectorAll(".nav-link").forEach(a => a.classList.remove("active"));
  if (linkEl) linkEl.classList.add("active");

  const titles = { dashboard:"Dashboard", submit:"Submit Complaint", complaints:"My Complaints", profile:"My Profile" };
  document.getElementById("pageTitle").textContent = titles[section] || "Dashboard";

  if (section === "complaints") renderComplaints();
  if (section === "dashboard") initCharts();
  if (section === "submit") setTimeout(() => { if (map) map.invalidateSize(); }, 300);

  closeSidebar();
}

/* ==============================
   MOBILE SIDEBAR
============================== */
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("mobileOverlay").classList.add("show");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("mobileOverlay").classList.remove("show");
}

/* ==============================
   RENDER COMPLAINTS
============================== */
function renderComplaints(filter) {
  if (filter !== undefined) currentFilter = filter;
  const grid = document.getElementById("complaintsGrid");
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";

  let filtered = complaints.filter(c => {
    const matchesFilter = currentFilter === "all" || c.status === currentFilter;
    const matchesSearch = c.id.toLowerCase().includes(search) || c.title.toLowerCase().includes(search) || c.location.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });

  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
      <i class="fa fa-inbox" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.4"></i>
      No complaints found.
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(c => {
    const statusClass = c.status === "Pending" ? "pending-card" : c.status === "In Progress" ? "progress-card" : "resolved-card";
    const badgeClass = c.status === "Pending" ? "pending-status" : c.status === "In Progress" ? "progress-status" : "resolved-status";
    const priColor = c.priority === "High" ? "#ef4444" : c.priority === "Medium" ? "#f59e0b" : "#22c55e";
    return `
    <div class="complaint-card ${statusClass}" id="card-${c.id}">
      <div class="card-top">
        <span class="complaint-id">#${c.id}</span>
        <div class="card-actions">
          <button class="action-btn edit-btn" onclick="openEdit('${c.id}')" title="Edit"><i class="fa fa-pen"></i></button>
          <button class="action-btn delete-btn" onclick="deleteComplaint('${c.id}')" title="Delete"><i class="fa fa-trash"></i></button>
        </div>
      </div>
      <div class="complaint-title">${c.title}</div>
      <div class="complaint-meta">
        <span><i class="fa fa-map-marker-alt"></i>${c.location}</span>
        <span><i class="fa fa-tag"></i>${c.category}</span>
        <span><i class="fa fa-calendar-alt"></i>${c.date}</span>
        <span><i class="fa fa-flag" style="color:${priColor}"></i><span style="color:${priColor}">${c.priority} Priority</span></span>
      </div>
      <div class="card-footer">
        <span class="status ${badgeClass}">${c.status}</span>
        <button class="track-btn" onclick="trackComplaint('${c.id}')"><i class="fa fa-search"></i> Track</button>
      </div>
    </div>`;
  }).join("");
}

/* ==============================
   FILTER COMPLAINTS
============================== */
function filterComplaints(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderComplaints();
}

function filterByStatus(status) {
  showSection('complaints', document.querySelector('.nav-link:nth-child(3)'));
  filterComplaints(status, null);
  const btns = document.querySelectorAll(".filter-btn");
  btns.forEach(b => {
    b.classList.remove("active");
    if (b.textContent.trim() === status || (status === "all" && b.textContent.trim() === "All")) b.classList.add("active");
  });
}

/* ==============================
   SEARCH
============================== */
function searchComplaint() { renderComplaints(); }

/* ==============================
   DELETE COMPLAINT
============================== */
function deleteComplaint(id) {
  if (!confirm(`Delete complaint ${id}?`)) return;
  const card = document.getElementById("card-" + id);
  if (card) { card.style.transform = "scale(0.9)"; card.style.opacity = "0"; card.style.transition = "all 0.3s"; }
  setTimeout(() => {
    complaints = complaints.filter(c => c.id !== id);
    renderComplaints();
    updateDashboardStats();
    showToast(`Complaint ${id} deleted`, "error");
  }, 300);
}

/* ==============================
   EDIT COMPLAINT
============================== */
function openEdit(id) {
  const c = complaints.find(c => c.id === id);
  if (!c) return;
  document.getElementById("editTitle").value = c.title;
  document.getElementById("editLocation").value = c.location;
  document.getElementById("editCategory").value = c.category;
  document.getElementById("editId").value = id;
  document.getElementById("editModal").classList.add("show");
}

function closeEdit() { document.getElementById("editModal").classList.remove("show"); }

function saveEdit() {
  const id = document.getElementById("editId").value;
  const c = complaints.find(c => c.id === id);
  if (c) {
    c.title = document.getElementById("editTitle").value;
    c.location = document.getElementById("editLocation").value;
    c.category = document.getElementById("editCategory").value;
    renderComplaints();
    showToast(`Complaint ${id} updated successfully`);
  }
  closeEdit();
}

/* ==============================
   TRACK COMPLAINT POPUP
============================== */
function trackComplaint(id) {
  document.getElementById("trackingModal").classList.add("show");
  document.getElementById("trackID").innerText = id;
  resetSteps();

  const c = complaints.find(c => c.id === id);
  const status = c ? c.status : "Pending";
  let message = "";

  if (status === "Pending") {
    activateStep(1); setProgress(20); setStatus("Pending");
    message = "Your complaint is waiting for department verification.";
  } else if (status === "In Progress") {
    activateStep(1); activateStep(2); activateStep(3);
    setProgress(55); setStatus("Processing");
    message = "The maintenance team is currently working on the issue.";
  } else if (status === "Resolved") {
    activateStep(1); activateStep(2); activateStep(3); activateStep(4);
    setProgress(100); setStatus("Resolved");
    message = "✅ Complaint successfully resolved. Thank you for reporting!";
  }
  document.getElementById("officialMessage").innerText = message;
}

function activateStep(step) {
  document.getElementById("step" + step)?.classList.add("completed");
  const line = document.getElementById("progressLine" + (step > 1 ? step - 1 : ""));
  if (line) setTimeout(() => { line.style.width = "100%"; }, step * 150);
}

function setProgress(percent) {
  const line = document.getElementById("progressLine");
  if (line) setTimeout(() => { line.style.width = percent + "%"; }, 200);
}

function setStatus(text) {
  const el = document.getElementById("trackStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "status-progress";
  if (text === "Pending") el.classList.add("pending");
  if (text === "Processing") el.classList.add("processing");
  if (text === "Resolved") el.classList.add("resolved");
}

function resetSteps() {
  for (let i = 1; i <= 4; i++) document.getElementById("step" + i)?.classList.remove("completed");
  ["progressLine", "progressLine2", "progressLine3"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.width = "0%";
  });
}

function closeTracking() { document.getElementById("trackingModal").classList.remove("show"); }

/* ==============================
   ANIMATED COUNTERS
============================== */
function animateCounters() {
  document.querySelectorAll(".counter").forEach(counter => {
    const target = parseInt(counter.dataset.target);
    let count = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      counter.textContent = count;
      if (count >= target) clearInterval(timer);
    }, 40);
  });
}

function updateDashboardStats() {
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === "Pending").length;
  const inProg = complaints.filter(c => c.status === "In Progress").length;
  const resolved = complaints.filter(c => c.status === "Resolved").length;
  const targets = [total, pending, inProg, resolved];
  document.querySelectorAll(".counter").forEach((el, i) => {
    el.dataset.target = targets[i];
    el.textContent = targets[i];
  });
}

/* ==============================
   CHARTS
============================== */
let doughnutChartInst, barChartInst, categoryChartInst;

function initCharts() {
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  Chart.defaults.color = textColor;

  // Doughnut
  const dc = document.getElementById("doughnutChart");
  if (dc) {
    if (doughnutChartInst) doughnutChartInst.destroy();
    doughnutChartInst = new Chart(dc, {
      type: "doughnut",
      data: {
        labels: ["Pending", "In Progress", "Resolved"],
        datasets: [{ data: [4, 5, 3], backgroundColor: ["#f59e0b","#3b82f6","#22c55e"], borderWidth: 0, hoverOffset: 8 }]
      },
      options: {
        cutout: "72%",
        plugins: { legend: { position: "bottom", labels: { padding: 14, usePointStyle: true, pointStyle: "circle" } } },
        animation: { animateRotate: true, animateScale: true }
      }
    });
  }

  // Bar
  const bc = document.getElementById("barChart");
  if (bc) {
    if (barChartInst) barChartInst.destroy();
    barChartInst = new Chart(bc, {
      type: "bar",
      data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        datasets: [{
          label: "Complaints",
          data: [8,12,7,15,9,11,14,6,13,10,8,12],
          backgroundColor: "rgba(56,189,248,0.6)",
          borderColor: "#38bdf8",
          borderWidth: 2, borderRadius: 6
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { font: { size: 11 } } },
          y: { grid: { color: gridColor }, beginAtZero: true }
        },
        animation: { duration: 1000 }
      }
    });
  }

  // Category
  const cc = document.getElementById("categoryChart");
  if (cc) {
    if (categoryChartInst) categoryChartInst.destroy();
    categoryChartInst = new Chart(cc, {
      type: "polarArea",
      data: {
        labels: ["Road Issue","Garbage","Street Light","Water Supply","Drainage"],
        datasets: [{ data: [5, 3, 2, 4, 1], backgroundColor: ["rgba(239,68,68,0.6)","rgba(245,158,11,0.6)","rgba(56,189,248,0.6)","rgba(34,197,94,0.6)","rgba(129,140,248,0.6)"], borderWidth: 0 }]
      },
      options: {
        plugins: { legend: { position: "bottom", labels: { padding: 10, usePointStyle: true, font: { size: 11 } } } },
        scales: { r: { grid: { color: gridColor }, ticks: { display: false } } }
      }
    });
  }
}

/* ==============================
   NOTIFICATION SYSTEM
============================== */
function toggleNotifications() {
  const dd = document.getElementById("notifDropdown");
  dd.classList.toggle("show");
  document.getElementById("notifBadge").style.display = "none";
}

function clearNotifications() {
  document.getElementById("notifList").innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">No new notifications</div>`;
  document.getElementById("notifBadge").style.display = "none";
  document.getElementById("notifDropdown").classList.remove("show");
}

document.addEventListener("click", function(e) {
  const wrap = document.getElementById("notifWrap");
  if (wrap && !wrap.contains(e.target)) document.getElementById("notifDropdown")?.classList.remove("show");
});

/* ==============================
   DARK / LIGHT MODE TOGGLE
============================== */
function toggleDarkMode() {
  const html = document.documentElement;
  const isLight = html.getAttribute("data-theme") === "light";
  html.setAttribute("data-theme", isLight ? "dark" : "light");
  document.getElementById("themeLabel").innerHTML = isLight
    ? '<i class="fa fa-moon"></i> Dark Mode'
    : '<i class="fa fa-sun"></i> Light Mode';
  setTimeout(initCharts, 100);
}

/* ==============================
   IMAGE PREVIEW
============================== */
document.getElementById("imageUpload")?.addEventListener("change", function(e) {
  const file = e.target.files[0];
  const preview = document.getElementById("preview");
  if (file) { preview.src = URL.createObjectURL(file); preview.style.display = "block"; }
});

/* ==============================
   DRAG & DROP UPLOAD
============================== */
const uploadZone = document.getElementById("uploadZone");
if (uploadZone) {
  uploadZone.addEventListener("dragover", e => { e.preventDefault(); uploadZone.style.borderColor = "#38bdf8"; });
  uploadZone.addEventListener("dragleave", () => { uploadZone.style.borderColor = ""; });
  uploadZone.addEventListener("drop", e => {
    e.preventDefault(); uploadZone.style.borderColor = "";
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      document.getElementById("preview").src = URL.createObjectURL(file);
      document.getElementById("preview").style.display = "block";
    }
  });
}

/* ==============================
   PRIORITY BUTTON
============================== */
function setPriority(btn) {
  document.querySelectorAll(".prio-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("priorityInput").value = btn.dataset.prio;
}

/* ==============================
   COMPLAINT FORM SUBMIT
============================== */
document.getElementById("complaintForm")?.addEventListener("submit", function(e) {
  e.preventDefault();
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  const complaintID = "CC" + year + "-" + random;

  const newComplaint = {
    id: complaintID,
    title: document.getElementById("titleInput").value,
    location: `${parseFloat(currentLat).toFixed(4)}, ${parseFloat(currentLng).toFixed(4)}`,
    category: document.getElementById("categoryInput").value,
    status: "Pending",
    date: new Date().toISOString().split("T")[0],
    priority: document.getElementById("priorityInput").value
  };

  complaints.unshift(newComplaint);
  updateDashboardStats();

  if (map) {
    L.marker([currentLat, currentLng])
      .addTo(map)
      .bindPopup(`<b>${complaintID}</b><br>${newComplaint.title}`)
      .openPopup();
  }

  showToast(`✅ Complaint submitted! ID: ${complaintID}`);
  this.reset();
  document.getElementById("preview").style.display = "none";
  document.getElementById("priorityInput").value = "Medium";
  document.querySelectorAll(".prio-btn").forEach(b => b.classList.toggle("active", b.dataset.prio === "Medium"));

  // Add notification
  addNotification(complaintID, "Your complaint has been submitted.");
});

/* ==============================
   ADD NOTIFICATION
============================== */
function addNotification(id, msg) {
  const list = document.getElementById("notifList");
  const item = document.createElement("div");
  item.className = "notif-item unread";
  item.innerHTML = `<i class="fa fa-plus-circle" style="color:#38bdf8"></i><div><p><b>${id}</b> — ${msg}</p><small>Just now</small></div>`;
  list.prepend(item);
  const badge = document.getElementById("notifBadge");
  badge.style.display = "flex";
  badge.textContent = parseInt(badge.textContent || 0) + 1;
}

/* ==============================
   MAP INITIALIZATION
============================== */
let map, marker;
let currentLat = 20.5937, currentLng = 78.9629;

if (document.getElementById("map")) {
  map = L.map('map').setView([currentLat, currentLng], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(map);

  // Add existing complaint pins
  complaints.forEach(c => {
    if (!c.lat) return;
    L.marker([c.lat, c.lng]).addTo(map).bindPopup(`<b>${c.id}</b><br>${c.title}<br><i>${c.status}</i>`);
  });

  navigator.geolocation?.getCurrentPosition(pos => {
    currentLat = pos.coords.latitude;
    currentLng = pos.coords.longitude;
    map.setView([currentLat, currentLng], 15);
    marker = L.marker([currentLat, currentLng]).addTo(map).bindPopup("Your Location").openPopup();
    document.getElementById("latitude").value = currentLat.toFixed(6);
    document.getElementById("longitude").value = currentLng.toFixed(6);
  });

  map.on('click', e => {
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    currentLat = e.latlng.lat;
    currentLng = e.latlng.lng;
    document.getElementById("latitude").value = currentLat.toFixed(6);
    document.getElementById("longitude").value = currentLng.toFixed(6);
  });
}

/* ==============================
   EXPORT CSV
============================== */
function exportCSV() {
  const headers = ["ID", "Title", "Location", "Category", "Status", "Priority", "Date"];
  const rows = complaints.map(c => [c.id, `"${c.title}"`, c.location, c.category, c.status, c.priority, c.date]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  downloadFile("complaints.csv", "text/csv", csv);
  showToast("📄 Complaints exported as CSV");
}

/* ==============================
   EXPORT PDF (Plain Text)
============================== */
function exportPDF() {
  const win = window.open("", "_blank");
  const rows = complaints.map(c =>
    `<tr><td>${c.id}</td><td>${c.title}</td><td>${c.location}</td><td>${c.category}</td>
     <td>${c.status}</td><td>${c.priority}</td><td>${c.date}</td></tr>`
  ).join("");
  win.document.write(`<html><head><title>Complaints Report</title>
  <style>body{font-family:Arial;padding:24px}h1{color:#0ea5e9}table{width:100%;border-collapse:collapse}
  th{background:#0ea5e9;color:white;padding:10px;text-align:left}
  td{padding:8px;border-bottom:1px solid #ddd}tr:nth-child(even){background:#f9fafb}</style></head>
  <body><h1>CitizenConnect — Complaints Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <table><tr><th>ID</th><th>Title</th><th>Location</th><th>Category</th><th>Status</th><th>Priority</th><th>Date</th></tr>
  ${rows}</table></body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
  showToast("🖨️ Print dialog opened for PDF");
}

function downloadFile(name, type, content) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

/* ==============================
   PROFILE
============================== */
function updateProfile() {}

function saveProfile() {
  const name = document.getElementById("profileName").value;
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  document.getElementById("profileAvatar").textContent = initials;
  document.getElementById("topAvatar").textContent = initials;
  document.getElementById("topUser").textContent = name;
  showToast("✅ Profile updated successfully");
}

function changeAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  ["profileAvatar","topAvatar"].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<img src="${url}" alt="avatar">`;
  });
  showToast("Profile photo updated");
}

/* ==============================
   TOAST NOTIFICATION
============================== */
function showToast(msg, type) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.borderColor = type === "error" ? "#ef4444" : "#38bdf8";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

/* ==============================
   INIT ON LOAD
============================== */
window.addEventListener("DOMContentLoaded", () => {
  animateCounters();
  initCharts();
  renderComplaints();
});