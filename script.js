// Global JS - Multi-Page Handlers
document.addEventListener('DOMContentLoaded', () => {
    
    // Simulate logged in Officer ID
    const currentOfficerId = 'OFC-001';

    // Top Right Timer update
    setInterval(() => {
        const timeEl = document.getElementById('currentTime');
        if(timeEl) {
            timeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        }
    }, 1000);

    // --- MOCK DATA STORE ---
    // Start with an empty list. New complaints assigned by admin will be added here.
    let mockComplaints = [];

    const mockOfficer = {
        name: 'Officer Raj',
        officerId: 'OFC-001',
        photoUrl: 'https://ui-avatars.com/api/?name=Officer+Raj&background=0D8ABC&color=fff'
    };
    
    const getStats = () => {
        let stats = { new_complaints: 0, in_progress: 0, overdue: 0, resolved: 0 };
        mockComplaints.forEach(c => {
            if(c.status === 'New') stats.new_complaints++;
            else if(c.status === 'In Progress') stats.in_progress++;
            else if(c.status === 'Overdue') stats.overdue++;
            else if(c.status === 'Resolved') stats.resolved++;
        });
        return stats;
    };

    // --- UTILITIES ---

    // Common Profile Population
    const populateProfile = (officer) => {
        ['navPhoto', 'sidePhoto'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.src = officer.photoUrl;
        });
        const navName = document.getElementById('navName');
        if(navName) navName.innerHTML = `${officer.name.split(' ')[0]} <i class="fa-solid fa-caret-down"></i>`;
        
        ['sideName', 'sideId', 'welcomeText'].forEach(id => {
             const el = document.getElementById(id);
             if(el) {
                 if(id === 'sideName') el.innerText = officer.name;
                 if(id === 'sideId') el.innerText = `ID: ${officer.officerId}`;
                 if(id === 'welcomeText' && el.innerText.includes('Welcome')) el.innerText = `Welcome, Officer ${officer.name.split(' ').pop()}!`;
             }
        });
    };

    const parseDate = (dateObj) => new Date(dateObj); // Since mock returns ISO string

    const timeAgo = (dateStr) => {
        const date = parseDate(dateStr);
        const seconds = Math.max(0, Math.floor((new Date() - date) / 1000));
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return Math.floor(seconds || 0) + " secs ago";
    };

    const getIconForType = (type) => {
        switch(type) {
            case 'Garbage': return 'fa-trash';
            case 'Water Supply': return 'fa-faucet-drip';
            case 'Electricity': return 'fa-lightbulb';
            case 'Roads': return 'fa-road';
            case 'Drainage': return 'fa-water';
            default: return 'fa-circle-exclamation';
        }
    };

    // Global context mock
    const fetchOfficerContext = async () => {
        populateProfile(mockOfficer);
        return {
            officer: mockOfficer,
            stats: getStats(),
            recentComplaints: mockComplaints.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        };
    };

    // PAGE ROUTING
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'index.html' || currentPage === '') {
        initDashboard();
    } else if (currentPage === 'complaints.html') {
        initComplaints();
    } else if (currentPage === 'analytics.html') {
        initAnalytics();
    } else if (currentPage === 'workflow.html') {
        initWorkflow();
    }

    // --- DASHBOARD LOGIC ---
    async function initDashboard() {
        const data = await fetchOfficerContext();

        // Stats
        const stats = data.stats;
        document.getElementById('statNew').innerText = stats.new_complaints;
        document.getElementById('statProgress').innerText = stats.in_progress;
        document.getElementById('statOverdue').innerText = stats.overdue;
        document.getElementById('statResolved').innerText = stats.resolved;
        const total = stats.new_complaints + stats.in_progress + stats.overdue + stats.resolved;
        const pct = total === 0 ? 0 : Math.round((stats.resolved / total) * 100);
        document.getElementById('statProgressBar').style.width = pct + '%';

        // Lists
        const listEl = document.getElementById('complaints-list');
        listEl.innerHTML = '';
        data.recentComplaints.forEach(c => {
            listEl.insertAdjacentHTML('beforeend', `
                <div class="complaint-item">
                    <div class="item-left">
                        <div class="item-icon"><i class="fa-solid ${getIconForType(c.type)}"></i></div>
                        <div class="item-info"><h4>${c.title}</h4><p>${c.location}</p></div>
                    </div>
                    <div class="item-right">
                        <p>${timeAgo(c.createdAt)}</p>
                        <span class="status ${c.status.replace(' ', '-')}">${c.status}</span>
                    </div>
                </div>`);
        });

        const wfEl = document.getElementById('mini-workflow-list');
        wfEl.innerHTML = '';
        data.recentComplaints.slice(0,3).forEach(c => {
            wfEl.insertAdjacentHTML('beforeend', `
                <div class="complaint-item" style="border-bottom:none; padding-bottom:5px;">
                    <div class="item-info"><h4 style="font-size:0.85rem">${c.title}</h4></div>
                    <div class="item-right"><span class="status ${c.status.replace(' ', '-')}">${c.status}</span></div>
                </div>`);
        });

        // Initialize Map
        if(document.getElementById('main-map')) {
            const mainMap = L.map('main-map').setView([23.1765, 75.7885], 12);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mainMap);
            data.recentComplaints.forEach(c => {
                const lat = 23.1765 + (Math.random() - 0.5) * 0.1;
                const lng = 75.7885 + (Math.random() - 0.5) * 0.1;
                L.marker([lat, lng]).addTo(mainMap).bindPopup(`<b>${c.title}</b><br>${c.location}`);
            });
        }

        // Initialize Mini Chart
        const ctxEl = document.getElementById('dashboardChart');
        if(ctxEl) {
            new Chart(ctxEl.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['New', 'In Progress', 'Overdue', 'Resolved'],
                    datasets: [{ data: [stats.new_complaints, stats.in_progress, stats.overdue, stats.resolved], backgroundColor: ['#f97316', '#0ea5e9', '#e11d48', '#10b981'], borderWidth: 0}]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '70%'}
            });
        }
    }

    // --- COMPLAINTS PAGE LOGIC ---
    async function initComplaints() {
        await fetchOfficerContext();
        renderComplaintsTable(mockComplaints);

        // Setup filter tabs
        document.querySelectorAll('.tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                const filter = e.target.dataset.filter;
                if(filter === 'All') renderComplaintsTable(mockComplaints);
                else renderComplaintsTable(mockComplaints.filter(c => c.status === filter));
            });
        });
    }

    function renderComplaintsTable(data) {
        const tbody = document.getElementById('complaintsTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No complaints found for this view.</td></tr>`;
            return;
        }

        data.forEach(c => {
            const parsedDate = parseDate(c.createdAt);
            const dateStr = parsedDate.toLocaleDateString();
            const timeAgoStr = timeAgo(c.createdAt);
            
            // Buttons logic
            let buttons = '';
            if(c.status !== 'Resolved') {
                if(c.status === 'New' || c.status === 'Overdue') {
                    buttons += `<button class="btn-sm btn-warning" onclick="updateStatus('${c.complaintId}', 'In Progress')">Start</button>`;
                }
                buttons += `<button class="btn-sm btn-success" onclick="updateStatus('${c.complaintId}', 'Resolved')"><i class="fa-solid fa-check"></i> Resolve</button>`;
            }

            const row = `
                <tr>
                    <td>
                        <div class="complaint-title-cell">
                            <div class="type-icon"><i class="fa-solid ${getIconForType(c.type)}"></i></div>
                            <div class="title-text">
                                <h4>${c.title}</h4>
                                <p>${c.complaintId} • ${c.type}</p>
                            </div>
                        </div>
                    </td>
                    <td><i class="fa-solid fa-map-pin" style="color:var(--primary)"></i> ${c.location}</td>
                    <td>${dateStr}<br><small style="color:#64748b">${timeAgoStr}</small></td>
                    <td><span class="status ${c.status.replace(' ', '-')}">${c.status}</span></td>
                    <td class="action-buttons">${buttons || '<span style="color:#64748b; font-size:0.85rem;">Completed</span>'}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    }

    // Expose update handler globally
    window.updateStatus = async (compId, newStatus) => {
        const complaint = mockComplaints.find(c => c.complaintId === compId);
        if(complaint) {
            complaint.status = newStatus;
            initComplaints(); // Reload table
        }
    };

    // --- ANALYTICS PAGE LOGIC ---
    async function initAnalytics() {
        await fetchOfficerContext();
        
        const typeCounts = {};
        mockComplaints.forEach(c => {
            typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
        });

        const typeLabels = Object.keys(typeCounts);
        const typeData = Object.values(typeCounts);
        const stats = getStats();
        const statusData = [stats.new_complaints, stats.in_progress, stats.overdue, stats.resolved];

        const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];
        
        // Chart 1
        new Chart(document.getElementById('typeChart').getContext('2d'), {
            type: 'pie',
            data: {
                labels: typeLabels.length ? typeLabels : ['No Data'],
                datasets: [{ data: typeData.length ? typeData : [1], backgroundColor: colors, borderWidth: 1, borderColor: '#fff' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });

        // Chart 2
        new Chart(document.getElementById('statusChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['New', 'In Progress', 'Overdue', 'Resolved'],
                datasets: [{ 
                    label: 'Complaints by Status',
                    data: statusData, 
                    backgroundColor: ['#f97316', '#0ea5e9', '#e11d48', '#10b981'],
                    borderRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });

        // Chart 3 (Mock Trend)
        new Chart(document.getElementById('trendChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    { label: 'Received', data: [0, 0, 0, 0, 0, 0, 0], borderColor: '#0ea5e9', fill:false, tension:0.4 },
                    { label: 'Resolved', data: [0, 0, 0, 0, 0, 0, 0], borderColor: '#10b981', fill:false, tension:0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }


    // --- WORKFLOW PAGE LOGIC ---
    async function initWorkflow() {
        await fetchOfficerContext();
        
        const tl = document.getElementById('workflowTimeline');
        if(!tl) return;
        tl.innerHTML = '';
        
        // Filter out resolved, order by Overdue -> In Progress -> New
        const active = mockComplaints.filter(c => c.status !== 'Resolved').sort((a,b) => {
            const weight = { 'Overdue': 3, 'In Progress': 2, 'New': 1 };
            return weight[b.status] - weight[a.status];
        });

        if(active.length === 0) {
             tl.innerHTML = `<div class="timeline-item"><div class="timeline-content"><h3>No active tasks!</h3><p>Your workflow is clear.</p></div></div>`;
        }

        active.forEach(c => {
            let btn = c.status === 'Overdue' || c.status === 'New' 
                 ? `<button class="btn-sm btn-warning" onclick="window.location.href='complaints.html'">Start Review</button>`
                 : `<button class="btn-sm btn-success" onclick="updateStatusWorkflow('${c.complaintId}', 'Resolved')">Mark Resolved</button>`;
                 
            tl.insertAdjacentHTML('beforeend', `
                <div class="timeline-item">
                    <div class="timeline-icon ${c.status.replace(' ', '-')}"><i class="fa-solid ${getIconForType(c.type)}"></i></div>
                    <div class="timeline-content">
                        <h3>${c.title} <span class="badge ${c.status.replace(' ', '-')}">${c.status}</span></h3>
                        <p>${c.description}</p>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                            <span class="timeline-date"><i class="fa-solid fa-map-pin"></i> ${c.location} &nbsp;|&nbsp; <i class="fa-regular fa-clock"></i> Assigned ${timeAgo(c.createdAt)}</span>
                            ${btn}
                        </div>
                    </div>
                </div>
            `);
        });
    }

    // Special handler for resolving inside the workflow page to reload properly
    window.updateStatusWorkflow = async (compId, newStatus) => {
        const complaint = mockComplaints.find(c => c.complaintId === compId);
        if(complaint) {
            complaint.status = newStatus;
            initWorkflow();
        }
    };
});
