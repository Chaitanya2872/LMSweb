// ======================
// Complete script.js with all dashboard functions
// ======================

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:3000/api';

// Global state
let currentUser = null;
let currentRole = null;
let authToken = null;
let allLeads = [];
let allUsers = [];


let currentDateFilter = 'all';
let customStartDate = null;
let customEndDate = null;

// Utility Functions
function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}

async function apiRequest(endpoint, options = {}) {
    const config = {
        headers: getAuthHeaders(),
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message || 'An error occurred', 'error');
        throw error;
    }
}

function applyDateFilter() {
    const filter = document.getElementById('dateFilter').value;
    const customRange = document.getElementById('customDateRange');

    if (filter === 'custom') {
        customRange.style.display = 'flex';
    } else {
        customRange.style.display = 'none';
        currentDateFilter = filter;
        loadDashboardData();
    }
}

function applyCustomDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (startDate && endDate) {
        currentDateFilter = 'custom';
        customStartDate = startDate;
        customEndDate = endDate;
        loadDashboardData();
    }
}

function filterLeadsByDate(leads) {
    if (currentDateFilter === 'all') return leads;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return leads.filter(lead => {
        const leadDate = new Date(lead.date || lead.Date);
        if (isNaN(leadDate)) return false;

        switch (currentDateFilter) {
            case 'today':
                return leadDate >= today;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return leadDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return leadDate >= monthAgo;
            case 'quarter':
                const quarterAgo = new Date(today);
                quarterAgo.setMonth(quarterAgo.getMonth() - 3);
                return leadDate >= quarterAgo;
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return leadDate >= yearAgo;
            case 'custom':
                const startDate = new Date(customStartDate);
                const endDate = new Date(customEndDate);
                return leadDate >= startDate && leadDate <= endDate;
            default:
                return true;
        }
    });
}

// Add to DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
    simulateRealTimeUpdates();

    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') login();
        });
    }

    // Inject enhanced date filter UI into the right of .nav-tabs
    const header = document.querySelector('.nav-tabs');
    if (header) {
        const dateFilterContainer = document.createElement('div');
        dateFilterContainer.style.marginLeft = 'auto';
        dateFilterContainer.style.display = 'flex';
        dateFilterContainer.style.alignItems = 'center';
        dateFilterContainer.style.gap = '8px';
        dateFilterContainer.style.padding = '4px 10px';
        dateFilterContainer.style.borderRadius = '6px';
        dateFilterContainer.style.backgroundColor = 'rgba(255,255,255,0.08)';

        dateFilterContainer.innerHTML = `
            <label for="dateFilter" class="date-filter-label">⏳ Filter by:
</label>
            <select id="dateFilter" class="date-filter-select" onchange="applyDateFilter()">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
            </select>
            <div id="customDateRange" class="date-filter-custom">
                <input type="date" id="startDate" onchange="applyCustomDateFilter()">
                <input type="date" id="endDate" onchange="applyCustomDateFilter()">
            </div>
        `;

        header.appendChild(dateFilterContainer);
    }
});


function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'flex';
}

function showLogin() {
  document.getElementById('loginForm').style.display = 'flex';
  document.getElementById('registerForm').style.display = 'none';
}

async function verifyOTP() {
  const fullName = document.getElementById('regFullName').value.trim();
  const mobile = document.getElementById('regMobile').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const role = document.getElementById('regRole').value.trim();
  const otp = document.getElementById('regOTP').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!fullName || !mobile || !email || !role || !otp || !password) {
    return showNotification('All fields are required for verification', 'error');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, mobile, email, role, otp, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    sessionStorage.setItem('authToken', data.token);
    sessionStorage.setItem('currentUser', data.user.name);
    sessionStorage.setItem('currentRole', data.user.role);
    sessionStorage.setItem('currentUserId', data.user.id);

    showNotification('Registration & Login successful', 'success');
    location.reload();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

window.verifyOTP = verifyOTP;


async function sendOTP() {
  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const mobile = document.getElementById('regMobile').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const role = document.getElementById('regRole').value.trim();

  if (!fullName || !email || !mobile || !password || !role) {
    return showNotification('Please fill in all fields', 'error');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, mobile, password, role })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send OTP');
    }

    document.getElementById('otpSection').style.display = 'block';
    showNotification('OTP sent successfully', 'success');
  } catch (err) {
    showNotification(err.message || 'Failed to send OTP', 'error');
  }
}

// ✅ Attach to global window object so HTML onclick can find it
window.sendOTP = sendOTP;







// Authentication Functions
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    if (!username || !password || !role) {
        showNotification('Please enter username, password, and role.', 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const data = await res.json();

        if (data.error) {
            showNotification(data.error, 'error');
            return;
        }

        // ✅ Correctly capture user info
        authToken = data.token;
        currentUser = data.user.name;
        currentRole = data.user.role;

        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', currentUser);
        localStorage.setItem('currentRole', currentRole);

        // ✅ Fix: correct the element IDs
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';
        document.getElementById('userInfo').style.display = 'block';

        document.getElementById('userBadge').textContent = `${currentUser} (${currentRole})`;

        // Show/hide manager-only buttons
        const managerTabs = document.querySelectorAll('#managerTabs, #managerTabs2');
        managerTabs.forEach(tab => {
            tab.style.display = currentRole === 'manager' ? 'block' : 'none';
        });

        // Toggle My Leads tab visibility
        const myLeadsTab = document.querySelector('.nav-tab[onclick="showTab(\'leads\')"]');
        const myLeadsContent = document.getElementById('leadsTab');
        if (currentRole === 'manager') {
            if (myLeadsTab) myLeadsTab.style.display = 'none';
            if (myLeadsContent) myLeadsContent.style.display = 'none';
        } else {
            if (myLeadsTab) myLeadsTab.style.display = 'inline-block';
            if (myLeadsContent) myLeadsContent.style.display = 'block';
        }

        await loadDashboardData();

    } catch (error) {
        console.error('Login failed:', error);
        showNotification('Login request failed.', 'error');
    }
}

window.login = login;  // ✅ Ensure it's exposed globally






function logout() {
    currentUser = null;
    currentRole = null;
    authToken = null;
    allLeads = [];

    sessionStorage.clear();

    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';

    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('role').value = '';
}

async function checkExistingSession() {
    authToken = localStorage.getItem('authToken');
    currentUser = localStorage.getItem('currentUser');
    currentRole = localStorage.getItem('currentRole');

    if (authToken && currentUser && currentRole) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('userBadge').textContent = `${currentUser} (${currentRole})`;

        const managerTabs = document.querySelectorAll('#managerTabs, #managerTabs2');
        managerTabs.forEach(tab => {
            tab.style.display = currentRole === 'manager' ? 'block' : 'none';
        });

        const myLeadsTab = document.querySelector('.nav-tab[onclick="showTab(\'leads\')"]');
        const myLeadsContent = document.getElementById('leadsTab');
        if (currentRole === 'manager') {
            if (myLeadsTab) myLeadsTab.style.display = 'none';
            if (myLeadsContent) myLeadsContent.style.display = 'none';
        } else {
            if (myLeadsTab) myLeadsTab.style.display = 'inline-block';
            if (myLeadsContent) myLeadsContent.style.display = 'block';
        }

        await loadDashboardData();
    }
}



// Dashboard Functions
async function loadDashboardData() {
    try {
        await Promise.all([
    loadStats(),
    loadRecentActivities(),
    currentRole !== 'salesperson' ? loadMyLeads() : Promise.resolve(),
    loadAllLeads()
]);

        
        // Load users for manager
        if (currentRole === 'manager') {
            await loadUsers();
            await populateUserSelector();
            createUserLeadsTab();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadStats() {
    try {
        const stats = await apiRequest('/dashboard-stats');
        const leads = await apiRequest('/qualified-leads');
        
        // Apply date filter to leads
        const filteredLeads = filterLeadsByDate(leads);
        
        // Calculate filtered stats
        const totalLeads = filteredLeads.length;
        const assignedLeads = filteredLeads.filter(lead => lead.assignedTo).length;
        const pendingLeads = filteredLeads.filter(lead => !lead.assignedTo).length;
        const contactedToday = filteredLeads.filter(lead => {
            const today = new Date().toDateString();
            const leadDate = new Date(lead.date || lead.Date).toDateString();
            return leadDate === today;
        }).length;
        
        document.getElementById('totalLeads').textContent = totalLeads;
        document.getElementById('assignedLeads').textContent = assignedLeads;
        document.getElementById('pendingLeads').textContent = pendingLeads;
        document.getElementById('contactedToday').textContent = contactedToday;
        
        // Update charts
        updateCharts();
        
    } catch (error) {
        console.error('Error loading stats:', error);
        // Set default values on error
        document.getElementById('totalLeads').textContent = '0';
        document.getElementById('assignedLeads').textContent = '0';
        document.getElementById('pendingLeads').textContent = '0';
        document.getElementById('contactedToday').textContent = '0';
    }
}


function updateCharts() {
  if (!allLeads || allLeads.length === 0) return;

  const pieCtx = document.getElementById('statusPieChart').getContext('2d');
  const barCtx = document.getElementById('salespersonBarChart').getContext('2d');

  if (window.statusPie) window.statusPie.destroy();
  if (window.salesBar) window.salesBar.destroy();

  if (currentRole === 'manager') {
    // Manager Charts
    const sourceCounts = allLeads.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    window.statusPie = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: Object.keys(sourceCounts),
        datasets: [{
          data: Object.values(sourceCounts),
          backgroundColor: ['#60a5fa', '#fbbf24', '#34d399', '#f87171']
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } }
      }
    });

    const qualifiedCounts = {};
    allLeads.forEach(lead => {
      const dateKey = new Date(lead.date).toLocaleDateString();
      qualifiedCounts[dateKey] = (qualifiedCounts[dateKey] || 0) + 1;
    });

    window.salesBar = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(qualifiedCounts),
        datasets: [{
          label: 'Qualified Leads',
          data: Object.values(qualifiedCounts),
          backgroundColor: '#3b82f6'
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  if (currentRole === 'salesperson') {

    document.querySelector('.stats-grid').style.display = 'none';

    const statusCounts = allLeads.reduce((acc, lead) => {
        const status = (lead.status || 'unknown').toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    window.statusPie = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#c084fc']
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });

    const dateCounts = {};
    allLeads.forEach(lead => {
      const date = new Date(lead.date);
      let label = '';
      switch (currentDateFilter) {
        case 'today':
          label = date.toLocaleDateString();
          break;
        case 'week':
          label = `Week ${getWeekNumber(date)}`;
          break;
        case 'month':
          label = `${date.getMonth() + 1}-${date.getFullYear()}`;
          break;
        default:
          label = date.toLocaleDateString();
      }
      dateCounts[label] = (dateCounts[label] || 0) + 1;
    });

    window.salesBar = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(dateCounts),
        datasets: [{
          label: 'My Leads',
          data: Object.values(dateCounts),
          backgroundColor: '#fbbf24'
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

async function loadRecentActivities() {
    try {
        const activities = await apiRequest('/qualified-leads');
        const recentActivities = activities.slice(-5).reverse(); // Get last 5 activities
        const container = document.getElementById('recentActivities');

        if (recentActivities.length === 0) {
            container.innerHTML = '<p>No recent activities</p>';
            return;
        }

        container.innerHTML = recentActivities.map(lead => {
    const name = lead['Full Name'] || lead.name || 'Client';
    const property = lead['Property Type'] || lead.propertyType || 'property';
    const location = lead['Project Location'] || lead.location || 'unspecified location';
    const timeline = lead['Expected Timeline'] || lead.timeline || 'unspecified timeline';
    const budgetMatch = lead['Pre-Sales Remarks']?.match(/₹[\d–]+ lakhs?/i);
    const budget = budgetMatch ? budgetMatch[0] : 'budget not disclosed';
    const status = lead['Response'] || lead.status || 'No status';

    return `<div class="activity-item">
        ${name} expressed interest in a ${property} at ${location} — Move-in by ${timeline}, ${budget}. Status: ${status}.
    </div>`;
}).join('');

        
    } catch (error) {
        console.error('Error loading recent activities:', error);
        document.getElementById('recentActivities').innerHTML = '<p>Error loading activities</p>';
    }
}


function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function stats() {
    document.getElementById('salesperson').style.display = 'none';

    if (currentRole === 'salesperson') {
        // Hide stats grid for salesperson
        const statsGrid = document.getElementById('stats-grid');
        if (statsGrid) statsGrid.style.display = 'none';
    } else {
        // Show stats grid for managers or others
        const statsGrid = document.getElementById('stats-grid');
        if (statsGrid) statsGrid.style.display = 'grid'; // Or 'flex' depending on your CSS
    }
}





async function loadMyLeads() {
    try {
        const leads = await apiRequest('/qualified-leads');
        allLeads = leads;

        const currentUserId = sessionStorage.getItem('currentUserId');
        console.log('Current User ID:', currentUserId);
        console.log('Fetched Leads:', leads);

        const myLeads = currentRole === 'manager'
            ? leads
            : leads.filter(lead =>
                (lead.assignedToId || '').trim() === currentUserId
            );

        console.log('Filtered My Leads:', myLeads);

        const container = document.getElementById('myLeadsList');

        if (myLeads.length === 0) {
            container.innerHTML = '<p>No leads assigned to you</p>';
            return;
        }

        container.innerHTML = myLeads.map(lead => `
            <div class="lead-item">
                <div class="lead-header">
                    <strong>${lead.name}</strong>
                    <span class="lead-status ${lead.status}">${lead.status}</span>
                </div>
                <div class="lead-details">
                    <p><strong>Phone:</strong> ${lead.phone}</p>
                    <p><strong>Email:</strong> ${lead.email}</p>
                    <p><strong>Property:</strong> ${lead.propertyType} in ${lead.location}</p>
                    <p><strong>Timeline:</strong> ${lead.timeline}</p>
                    ${lead.remarks ? `<p><strong>Remarks:</strong> ${lead.remarks}</p>` : ''}
                </div>
                <div class="lead-actions">
                    <button class="btn btn-primary" onclick="viewLeadDetails('${lead.id}')">View Details</button>
                    <button class="btn btn-secondary" onclick="updateRemarks('${lead.id}')">Update Remarks</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading my leads:', error);
        document.getElementById('myLeadsList').innerHTML = '<p>Error loading leads</p>';
    }
}



async function loadAllLeads() {
    if (currentRole !== 'manager') return;

    try {
        const leads = await apiRequest('/qualified-leads');
        allLeads = leads;

        const assignedLeads = leads.filter(lead => lead.assignedTo);

        const container = document.getElementById('allLeadsList');

        if (assignedLeads.length === 0) {
            container.innerHTML = '<p>No assigned leads available</p>';
            return;
        }

        container.innerHTML = assignedLeads.map(lead => `
            <div class="lead-item">
                <div class="lead-header">
                    <strong>${lead.name}</strong>
                    <span class="lead-status ${lead.status}">${lead.status}</span>
                </div>
                <div class="lead-details">
                    <p><strong>ID:</strong> ${lead.id}</p>
                    <p><strong>Phone:</strong> ${lead.phone}</p>
                    <p><strong>Email:</strong> ${lead.email}</p>
                    <p><strong>Property:</strong> ${lead.propertyType} in ${lead.location}</p>
                    <p><strong>Assigned To:</strong> ${lead.assignedTo || 'Unassigned'}</p>
                    ${lead.remarks ? `<p><strong>Remarks:</strong> ${lead.remarks}</p>` : ''}
                </div>
                <div class="lead-actions">
                    <button class="btn btn-primary" onclick="viewLeadDetails('${lead.id}')">View Details</button>
                    <button class="btn btn-secondary" onclick="updateRemarks('${lead.id}')">Update Remarks</button>
                    <button class="btn btn-warning" onclick="reassignLead('${lead.id}')">Reassign</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading assigned leads:', error);
        document.getElementById('allLeadsList').innerHTML = '<p>Error loading leads</p>';
    }
}


async function loadUsers() {
    if (currentRole !== 'manager') return;
    
    try {
        const users = await apiRequest('/users');
        allUsers = users;
        
        // Populate salesperson dropdown
        const salespersonSelect = document.getElementById('salespersonSelect');
        const filterSalesperson = document.getElementById('filterSalesperson');
        
        if (salespersonSelect) {
            salespersonSelect.innerHTML = '<option value="">Select Salesperson</option>';
            users.filter(user => user.role === 'salesperson').forEach(user => {
                const option = document.createElement('option');
                option.value = user.name;
                option.textContent = user.name;
                salespersonSelect.appendChild(option);
            });
        }
        
        if (filterSalesperson) {
            filterSalesperson.innerHTML = '<option value="">All Salespersons</option>';
            users.filter(user => user.role === 'salesperson').forEach(user => {
                const option = document.createElement('option');
                option.value = user.name;
                option.textContent = user.name;
                filterSalesperson.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}


async function loadUnassignedLeads() {
    if (currentRole !== 'manager') return;
    
    const salesperson = document.getElementById('salespersonSelect').value;
    if (!salesperson) {
        showNotification('Please select a salesperson first', 'error');
        return;
    }
    
    try {
        const leads = await apiRequest('/qualified-leads');
        const unassignedLeads = leads.filter(lead => !lead.assignedTo);
        
        const container = document.getElementById('unassignedLeads');
        
        if (unassignedLeads.length === 0) {
            container.innerHTML = '<p>No unassigned leads available</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="assign-actions">
                <button class="btn btn-success" onclick="assignSelectedLeads()">Assign Selected Leads</button>
                <button class="btn btn-secondary" onclick="selectAllLeads()">Select All</button>
            </div>
            ${unassignedLeads.map(lead => `
                <div class="lead-item">
                    <div class="lead-header">
                        <input type="checkbox" class="lead-checkbox" value="${lead.id}">
                        <strong>${lead.name}</strong>
                        <span class="lead-status ${lead.status}">${lead.status}</span>
                    </div>
                    <div class="lead-details">
                        <p><strong>ID:</strong> ${lead.id}</p>
                        <p><strong>Phone:</strong> ${lead.phone}</p>
                        <p><strong>Email:</strong> ${lead.email}</p>
                        <p><strong>Property:</strong> ${lead.propertyType} in ${lead.location}</p>
                        <p><strong>Timeline:</strong> ${lead.timeline}</p>
                    </div>
                </div>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading unassigned leads:', error);
        document.getElementById('unassignedLeads').innerHTML = '<p>Error loading unassigned leads</p>';
    }
}

function reassignLead(leadId) {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }

    document.getElementById('reassignLeadInfo').innerHTML = `
        <p><strong>Lead ID:</strong> ${lead.id}</p>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Currently Assigned To:</strong> ${lead.assignedTo || 'Unassigned'}</p>
    `;

    // Populate dropdown
    const dropdown = document.getElementById('reassignSalesperson');
    dropdown.innerHTML = '<option value="">Select Salesperson</option>';
    allUsers.filter(u => u.role === 'salesperson').forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        dropdown.appendChild(option);
    });

    document.getElementById('reassignModal').dataset.leadId = leadId;
    document.getElementById('reassignModal').style.display = 'block';
}

async function confirmReassign() {
    const leadId = document.getElementById('reassignModal').dataset.leadId;
    const salespersonId = document.getElementById('reassignSalesperson').value;

    if (!salespersonId) {
        showNotification('Please select a salesperson', 'error');
        return;
    }

    const salespersonUser = allUsers.find(u => u.id === salespersonId);
    if (!salespersonUser) {
        showNotification('Selected salesperson not found', 'error');
        return;
    }

    try {
        // ✅ Reassign API which already sends WhatsApp in server
        await apiRequest('/assign-leads', {
            method: 'POST',
            body: JSON.stringify({
                leadIds: [leadId],
                salesperson: salespersonUser.name,
                salespersonId: salespersonUser.id
            })
        });

        showNotification(`Lead reassigned to ${salespersonUser.name} and WhatsApp message sent.`, 'success');
        closeReassignModal();
        await loadDashboardData();

    } catch (error) {
        console.error('Error during reassignment', error);
        showNotification('Failed to reassign lead.', 'error');
    }
}

async function sendWhatsAppMessage(salesperson, leadId) {
    try {
        const lead = allLeads.find(l => l.id === leadId);
        if (!lead) return;

        const message = `Hi ${salesperson.name}, you have been reassigned a lead:\n\n` +
                        `Lead Name: ${lead.name}\n` +
                        `Phone: ${lead.phone}\n` +
                        `Email: ${lead.email}\n` +
                        `Location: ${lead.location || 'N/A'}\n` +
                        `Remarks: ${lead.remarks || 'No remarks yet.'}`;

        // Send WhatsApp Message via backend API
        await apiRequest('/send-whatsapp', {
            method: 'POST',
            body: JSON.stringify({
                mobile: salesperson.mobile,
                message: message
            })
        });

        console.log('WhatsApp message sent to', salesperson.mobile);

    } catch (error) {
        console.error('Failed to send WhatsApp message', error);
    }
}


function closeReassignModal() {
    document.getElementById('reassignModal').style.display = 'none';
}



// 5. ADD NEW FUNCTION - Import Qualified Leads (add this after loadUnassignedLeads)
async function importQualifiedLeads() {
    if (currentRole !== 'manager') return;
    
    try {
        showNotification('Importing qualified leads...', 'info');
        await apiRequest('/import-qualified-leads', { method: 'POST' });
        showNotification('Qualified leads imported successfully', 'success');
        await loadDashboardData();
    } catch (error) {
        showNotification('Error importing qualified leads', 'error');
    }
}

// Lead Management Functions
async function assignSelectedLeads() {
    const salesperson = document.getElementById('salespersonSelect').value;
    if (!salesperson) {
        showNotification('Please select a salesperson', 'error');
        return;
    }

    const salespersonUser = allUsers.find(u => u.name === salesperson);
    if (!salespersonUser) {
        showNotification('Selected salesperson not found', 'error');
        return;
    }

    const selectedLeads = Array.from(document.querySelectorAll('.lead-checkbox:checked')).map(cb => cb.value);
    if (selectedLeads.length === 0) {
        showNotification('Please select at least one lead', 'error');
        return;
    }

    try {
        await apiRequest('/assign-leads', {
            method: 'POST',
            body: JSON.stringify({
                leadIds: selectedLeads,
                salesperson: salespersonUser.name,
                salespersonId: salespersonUser.id
            })
        });

        showNotification(`${selectedLeads.length} leads assigned to ${salespersonUser.name}`, 'success');
        await loadDashboardData();
        loadUnassignedLeads();
    } catch (error) {
        showNotification('Error assigning leads', 'error');
    }
}


function selectAllLeads() {
    const checkboxes = document.querySelectorAll('.lead-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
}

async function assignLead(leadId) {
    const salesperson = prompt('Enter salesperson name:');
    if (!salesperson) return;

    const salespersonUser = allUsers.find(u => u.name === salesperson);
    if (!salespersonUser) {
        showNotification('Salesperson not found', 'error');
        return;
    }

    try {
        await apiRequest('/assign-leads', {
            method: 'POST',
            body: JSON.stringify({
                leadIds: [leadId],
                salesperson: salespersonUser.name,
                salespersonId: salespersonUser.id
            })
        });

        showNotification('Lead assigned successfully', 'success');
        await loadDashboardData();
    } catch (error) {
        showNotification('Error assigning lead', 'error');
    }
}

async function saveRemarks() {
  const modal = document.getElementById('updateRemarksModal');
  const leadId = modal.dataset.leadId;

  const remarks = document.getElementById('newRemarks').value.trim();
  const status = document.getElementById('remarksStatus').value;
  const nextFollowUp = document.getElementById('nextFollowUp').value;

  if (!remarks && !status && !nextFollowUp) {
    showNotification('Please enter remarks, status, or follow-up date', 'error');
    return;
  }

  try {
    // Update backend
    await apiRequest(`/leads/${leadId}/remarks`, {
      method: 'PUT',
      body: JSON.stringify({ remarks, status, nextFollowUp })
    });

    showNotification('Remarks updated successfully', 'success');

    // Close update modal
    closeRemarksModal();

    // ✅ Refresh dashboard data and modal
    await loadDashboardData();
    await new Promise(r => setTimeout(r, 300)); // allow for sync delay
    await viewLeadDetails(leadId); // refresh lead details modal

  } catch (error) {
    showNotification('Failed to save remarks', 'error');
  }
}


async function updateRemarks(leadId) {
    try {
        const lead = await apiRequest(`/leads/${leadId}`);

        document.getElementById('remarksLeadInfo').innerHTML = `
            <p><strong>Name:</strong> ${lead['Full Name']}</p>
            <p><strong>Phone:</strong> ${lead['Phone Number']}</p>
            <p><strong>Email:</strong> ${lead['Email']}</p>
            <p><strong>Property:</strong> ${lead['Property Type']} in ${lead['Project Location']}</p>
        `;

        document.getElementById('currentRemarks').textContent = lead['Remarks'] || 'No remarks available';
        document.getElementById('newRemarks').value = '';
        document.getElementById('remarksStatus').value = '';
        document.getElementById('nextFollowUp').value = '';

        const modal = document.getElementById('updateRemarksModal');
        modal.dataset.leadId = leadId;
        modal.style.display = 'block';
    } catch (err) {
        showNotification('Failed to load lead details', 'error');
    }
}

function closeRemarksModal() {
    document.getElementById('updateRemarksModal').style.display = 'none';
}


async function viewLeadDetails(leadId) {
  try {
    await new Promise(r => setTimeout(r, 300));

    const lead = await apiRequest(`/leads/${leadId}`);

    document.getElementById('modalTitle').textContent = `Lead Details - ${lead['Full Name'] || lead.name}`;
    document.getElementById('modalContent').innerHTML = `
      <div class="lead-details-modal">
        <p><strong>Lead ID:</strong> ${lead['Lead ID'] || lead.id}</p>
        <p><strong>Name:</strong> ${lead['Full Name'] || lead.name}</p>
        <p><strong>Phone:</strong> ${lead['Phone Number'] || lead.phone}</p>
        <p><strong>Email:</strong> ${lead['Email'] || lead.email}</p>
        <p><strong>Source:</strong> ${lead['Source'] || lead.source}</p>
        <p><strong>Property Type:</strong> ${lead['Property Type'] || lead.propertyType}</p>
        <p><strong>Location:</strong> ${lead['Project Location'] || lead.location}</p>
        <p><strong>Timeline:</strong> ${lead['Timeline'] || lead.timeline}</p>
        <p><strong>Assigned To:</strong> ${lead['Assigned To'] || lead.assignedTo || 'Unassigned'}</p>
        <p><strong>Remarks:</strong> ${lead['Remarks'] || lead.remarks || 'None'}</p>
        <p><strong>Date:</strong> ${lead['Date'] || lead.date || 'Not Available'}</p>
      </div>
    `;

    document.getElementById('leadModal').style.display = 'block';

  } catch (error) {
    showNotification('Error loading lead details', 'error');
  }
}




// Search and Filter Functions
function searchLeads() {
    const searchTerm = document.getElementById('searchLeads').value.toLowerCase();
    const leadItems = document.querySelectorAll('#allLeadsList .lead-item');
    
    leadItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

function searchMyLeads() {
    const searchTerm = document.getElementById('searchMyLeads').value.toLowerCase();
    const leadItems = document.querySelectorAll('#myLeadsList .lead-item');
    
    leadItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

function filterLeads() {
    const selectedSalesperson = document.getElementById('filterSalesperson').value;
    const leadItems = document.querySelectorAll('#allLeadsList .lead-item');
    
    leadItems.forEach(item => {
        const assignedTo = item.querySelector('.lead-details').textContent;
        const showItem = !selectedSalesperson || assignedTo.includes(selectedSalesperson);
        item.style.display = showItem ? 'block' : 'none';
    });
}

// Sync Function
async function syncAllRemarks() {
    if (currentRole !== 'manager') return;
    
    try {
        showNotification('Syncing remarks...', 'info');
        await apiRequest('/sync-remarks', { method: 'POST' });
        showNotification('Remarks synced successfully', 'success');
        await loadDashboardData();
    } catch (error) {
        showNotification('Error syncing remarks', 'error');
    }
}

// Function to load leads for a specific user by ID
async function loadUserLeadsById(userId) {
    try {
        const response = await apiRequest(`/user/${userId}/leads`);
        return response;
    } catch (error) {
        console.error('Error loading user leads:', error);
        throw error;
    }
}

// Function to load leads for a specific user by name
async function loadUserLeadsByName(userName) {
    try {
        const response = await apiRequest(`/user-leads/${userName}`);
        return response;
    } catch (error) {
        console.error('Error loading user leads:', error);
        throw error;
    }
}

// Function to display user leads in a container
async function displayUserLeads(userId, containerId) {
    try {
        const data = await loadUserLeadsById(userId);
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error(`Container with id ${containerId} not found`);
            return;
        }

        if (data.leads.length === 0) {
            container.innerHTML = `<p>No leads found for ${data.user}</p>`;
            return;
        }

        container.innerHTML = `
            <h3>Leads for ${data.user} (${data.totalCount} total)</h3>
            <div class="leads-container">
                ${data.leads.map(lead => `
                    <div class="lead-item">
                        <div class="lead-header">
                            <strong>${lead.name}</strong>
                            <span class="lead-status ${lead.status}">${lead.status}</span>
                        </div>
                        <div class="lead-details">
                            <p><strong>ID:</strong> ${lead.id}</p>
                            <p><strong>Phone:</strong> ${lead.phone}</p>
                            <p><strong>Email:</strong> ${lead.email}</p>
                            <p><strong>Property:</strong> ${lead.propertyType} in ${lead.location}</p>
                            <p><strong>Timeline:</strong> ${lead.timeline}</p>
                            <p><strong>Source:</strong> ${lead.source}</p>
                            ${lead.preSalesRemarks ? `<p><strong>Pre-Sales Remarks:</strong> ${lead.preSalesRemarks}</p>` : ''}
                            ${lead.remarks ? `<p><strong>Remarks:</strong> ${lead.remarks}</p>` : ''}
                            ${lead.response ? `<p><strong>Response:</strong> ${lead.response}</p>` : ''}
                            ${lead.month ? `<p><strong>Month:</strong> ${lead.month}</p>` : ''}
                            ${lead.notified ? `<p><strong>Notified:</strong> ${lead.notified}</p>` : ''}
                        </div>
                        <div class="lead-actions">
                            <button class="btn btn-primary" onclick="viewLeadDetails('${lead.id}')">View Details</button>
                            <button class="btn btn-secondary" onclick="updateRemarks('${lead.id}')">Update Remarks</button>
                            ${currentRole === 'manager' ? `<button class="btn btn-info" onclick="updateLeadResponse('${lead.id}')">Update Response</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<p class="error">Error loading leads: ${error.message}</p>`;
        }
    }
}

// Function to update lead response (for managers)
async function updateLeadResponse(leadId) {
    if (currentRole !== 'manager') {
        showNotification('Access denied', 'error');
        return;
    }

    const response = prompt('Enter lead response:');
    if (response === null) return;

    try {
        await apiRequest(`/leads/${leadId}/response`, {
            method: 'PUT',
            body: JSON.stringify({ response })
        });
        
        showNotification('Response updated successfully', 'success');
        await loadDashboardData();
    } catch (error) {
        showNotification('Error updating response', 'error');
    }
}

// Enhanced assign leads function with better feedback
async function assignSelectedLeadsEnhanced() {
    const salesperson = document.getElementById('salespersonSelect').value;
    if (!salesperson) {
        showNotification('Please select a salesperson', 'error');
        return;
    }
    
    const selectedLeads = Array.from(document.querySelectorAll('.lead-checkbox:checked')).map(cb => cb.value);
    if (selectedLeads.length === 0) {
        showNotification('Please select at least one lead', 'error');
        return;
    }
    
    try {
        showNotification('Assigning leads...', 'info');
        const response = await apiRequest('/assign-leads', {
            method: 'POST',
            body: JSON.stringify({
                leadIds: selectedLeads,
                salesperson: salesperson
            })
        });
        
        let message = `${response.assignedCount} leads assigned to ${salesperson}`;
        if (response.addedToUserSheet) {
            message += ` (${response.addedToUserSheet} added to user sheet)`;
        }
        if (response.skippedDuplicates > 0) {
            message += ` (${response.skippedDuplicates} duplicates skipped)`;
        }
        
        showNotification(message, 'success');
        await loadDashboardData();
        loadUnassignedLeads();
    } catch (error) {
        showNotification('Error assigning leads', 'error');
    }
}

// Function to create a user leads dashboard tab
function createUserLeadsTab() {
    if (currentRole !== 'manager') return;

    const tabContainer = document.querySelector('.tab-nav');
    if (!tabContainer) return;

    // Add tab button
    const userLeadsTab = document.createElement('button');
    userLeadsTab.className = 'nav-tab';
    userLeadsTab.textContent = 'User Leads';
    userLeadsTab.onclick = () => showTab('userLeads');
    tabContainer.appendChild(userLeadsTab);

    // Add tab content
    const tabContent = document.createElement('div');
    tabContent.id = 'userLeadsTab';
    tabContent.className = 'tab-content';
    tabContent.innerHTML = `
        <div class="tab-header">
            <h2>User Leads Management</h2>
            <div class="user-selector">
                <select id="userLeadsSelect" onchange="loadSelectedUserLeads()">
                    <option value="">Select a user</option>
                </select>
                <button class="btn btn-primary" onclick="loadSelectedUserLeads()">Load Leads</button>
            </div>
        </div>
        <div id="selectedUserLeads"></div>
    `;
    
    document.querySelector('.tab-content').parentNode.appendChild(tabContent);
}

// Function to load selected user leads
async function loadSelectedUserLeads() {
    const selectedUserId = document.getElementById('userLeadsSelect').value;
    if (!selectedUserId) {
        showNotification('Please select a user', 'error');
        return;
    }

    await displayUserLeads(selectedUserId, 'selectedUserLeads');
}

// Function to populate user selector
async function populateUserSelector() {
    if (currentRole !== 'manager') return;

    try {
        const users = await apiRequest('/users');
        const userSelect = document.getElementById('userLeadsSelect');
        
        if (userSelect) {
            userSelect.innerHTML = '<option value="">Select a user</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.name} (${user.role})`;
                userSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading users for selector:', error);
    }
}


// Tab Management
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to clicked nav tab
    event.target.classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'assign') {
        // Only load unassigned leads if salesperson is selected
        const salesperson = document.getElementById('salespersonSelect').value;
        if (salesperson) {
            loadUnassignedLeads();
        }
    } else if (tabName === 'manage') {
        loadAllLeads();
    } else if (tabName === 'leads') {
        loadMyLeads();
    }
}

// Modal Functions
function closeModal() {
    document.getElementById('leadModal').style.display = 'none';
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '300px';
    notification.style.padding = '10px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'info':
            notification.style.backgroundColor = '#17a2b8';
            break;
        default:
            notification.style.backgroundColor = '#6c757d';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Real-time Updates
function simulateRealTimeUpdates() {
    setInterval(() => {
        if (authToken) {
            loadDashboardData();
        }
    }, 30000); // Update every 30 seconds
}

// Date Filter Functions
function applyDateFilter() {
    const filter = document.getElementById('dateFilter').value;
    const customRange = document.getElementById('customDateRange');
    
    if (filter === 'custom') {
        customRange.style.display = 'flex';
    } else {
        customRange.style.display = 'none';
        currentDateFilter = filter;
        loadDashboardData();
    }
}

function applyCustomDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        currentDateFilter = 'custom';
        customStartDate = startDate;
        customEndDate = endDate;
        loadDashboardData();
    }
}

function filterLeadsByDate(leads) {
    if (currentDateFilter === 'all') return leads;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return leads.filter(lead => {
        const leadDate = new Date(lead.date || lead.Date);
        if (isNaN(leadDate)) return false;
        
        switch (currentDateFilter) {
            case 'today':
                return leadDate >= today;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return leadDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return leadDate >= monthAgo;
            case 'quarter':
                const quarterAgo = new Date(today);
                quarterAgo.setMonth(quarterAgo.getMonth() - 3);
                return leadDate >= quarterAgo;
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return leadDate >= yearAgo;
            case 'custom':
                const startDate = new Date(customStartDate);
                const endDate = new Date(customEndDate);
                return leadDate >= startDate && leadDate <= endDate;
            default:
                return true;
        }
    });
}

// Chart Functions
let statusPieChart = null;
let salespersonBarChart = null;

function createStatusPieChart(leads) {
    const ctx = document.getElementById('statusPieChart').getContext('2d');
    
    if (statusPieChart) {
        statusPieChart.destroy();
    }
    
    const statusCounts = {};
    leads.forEach(lead => {
        const status = lead.status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    
    statusPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createSalespersonBarChart(leads) {
    const ctx = document.getElementById('salespersonBarChart').getContext('2d');
    
    if (salespersonBarChart) {
        salespersonBarChart.destroy();
    }
    
    const salespersonCounts = {};
    leads.forEach(lead => {
        const salesperson = lead.assignedTo || 'Unassigned';
        salespersonCounts[salesperson] = (salespersonCounts[salesperson] || 0) + 1;
    });
    
    const labels = Object.keys(salespersonCounts);
    const data = Object.values(salespersonCounts);
    
    salespersonBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Leads',
                data: data,
                backgroundColor: '#36A2EB',
                borderColor: '#2196F3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateCharts() {
    if (allLeads.length > 0) {
        const filteredLeads = filterLeadsByDate(allLeads);
        createStatusPieChart(filteredLeads);
        createSalespersonBarChart(filteredLeads);
    }
}

// 3. ADD THESE JAVASCRIPT FUNCTIONS FOR MY LEADS DATE FILTERING

function applyMyLeadsDateFilter() {
    const filterValue = document.getElementById('myLeadsDateFilter').value;
    const customDateRange = document.getElementById('myLeadsCustomDateRange');
    
    if (filterValue === 'custom') {
        customDateRange.style.display = 'flex';
    } else {
        customDateRange.style.display = 'none';
        filterMyLeadsByDate(filterValue);
    }
}

function applyMyLeadsCustomDateFilter() {
    const startDate = document.getElementById('myLeadsStartDate').value;
    const endDate = document.getElementById('myLeadsEndDate').value;
    
    if (startDate && endDate) {
        filterMyLeadsByDate('custom', startDate, endDate);
    }
}

function filterMyLeadsByDate(filterType, startDate = null, endDate = null) {
    // This function would filter your leads based on date
    // You'll need to implement this based on your data structure
    console.log('Filtering My Leads by date:', filterType, startDate, endDate);
    
    // Example implementation:
    // const filteredLeads = allMyLeads.filter(lead => {
    //     const leadDate = new Date(lead.dateCreated);
    //     return isDateInRange(leadDate, filterType, startDate, endDate);
    // });
    // displayMyLeads(filteredLeads);
}

// Helper function to check if date is in range
function isDateInRange(date, filterType, startDate = null, endDate = null) {
    const today = new Date();
    const leadDate = new Date(date);
    
    switch (filterType) {
        case 'today':
            return leadDate.toDateString() === today.toDateString();
        case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return leadDate >= weekAgo;
        case 'month':
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            return leadDate >= monthAgo;
        case 'quarter':
            const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
            return leadDate >= quarterAgo;
        case 'year':
            const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            return leadDate >= yearAgo;
        case 'custom':
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                return leadDate >= start && leadDate <= end;
            }
            return true;
        default:
            return true;
    }
}

// 4. UPDATE CHART RESPONSIVENESS
// Add this function to handle chart responsiveness
function updateChartResponsiveness() {
    const charts = document.querySelectorAll('canvas');
    charts.forEach(chart => {
        if (chart.chart) {
            chart.chart.resize();
        }
    });
}

// Call this function when window is resized
window.addEventListener('resize', updateChartResponsiveness);

// 5. IMPROVE EXISTING applyDateFilter FUNCTION
// Update your existing function to handle chart updates
function applyDateFilter() {
    const filterValue = document.getElementById('dateFilter').value;
    const customDateRange = document.getElementById('customDateRange');
    
    if (filterValue === 'custom') {
        customDateRange.style.display = 'flex';
    } else {
        customDateRange.style.display = 'none';
        // Filter data and update charts
        filterDataAndUpdateCharts(filterValue);
    }
}

function filterDataAndUpdateCharts(filterType, startDate = null, endDate = null) {
    // Filter your data based on date
    // Then update the charts with filtered data
    
    // Example for updating charts:
    // updateStatusPieChart(filteredData);
    // updateSalespersonBarChart(filteredData);
    
    console.log('Filtering data and updating charts:', filterType, startDate, endDate);
}

async function saveRemarks() {
    const leadId = document.getElementById('updateRemarksModal').dataset.leadId;
    const remarks = document.getElementById('newRemarks').value.trim();
    const status = document.getElementById('remarksStatus').value;
    const nextFollowUp = document.getElementById('nextFollowUp').value;

    if (!remarks) {
        showNotification('Please enter remarks before saving', 'error');
        return;
    }

    try {
        await apiRequest(`/leads/${leadId}/remarks`, {
            method: 'PUT',
            body: JSON.stringify({ remarks, status, nextFollowUp })
        });

        showNotification('Remarks updated successfully', 'success');
        closeRemarksModal();
        await loadDashboardData();
    } catch (err) {
        showNotification('Failed to update remarks', 'error');
    }
}




// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
    simulateRealTimeUpdates();

    // Add enter key support for login
    document.getElementById('password').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('leadModal');
        if (event.target == modal) {
            closeModal();
        }
    }
});