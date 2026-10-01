const API_URL = '/api';

// DOM Elements
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const userNameEl = document.getElementById('user-name');
const userRoleEl = document.getElementById('user-role');
const userAvatarEl = document.getElementById('user-avatar');
const searchInput = document.getElementById('search-input');
const yearFilter = document.getElementById('year-filter');
const categoryFilter = document.getElementById('category-filter');
const searchBarContainer = document.getElementById('search-bar-container');

// Navigation
const navOverview = document.getElementById('nav-overview');
const navAll = document.getElementById('nav-all');
const navActive = document.getElementById('nav-active');
const navInactive = document.getElementById('nav-inactive');
const navCategories = document.getElementById('nav-categories');
const navUsers = document.getElementById('nav-users');

// Views
const viewOverview = document.getElementById('view-overview');
const viewMaster = document.getElementById('view-master');
const viewCategories = document.getElementById('view-categories');
const viewUsers = document.getElementById('view-users');
const viewDetail = document.getElementById('view-detail');

// Overview Elements
const tableBody = document.getElementById('table-body');

// Master Elements
const masterTableBody = document.getElementById('master-table-body');
const masterTitle = document.getElementById('master-title');
const masterSubtitle = document.getElementById('master-subtitle');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const delAllDataBtn = document.getElementById('del-all-data-btn');

// Detail Elements
const backHomeBtn = document.getElementById('back-home-btn');
const detailNomor = document.getElementById('detail-nomor');
const detailKategori = document.getElementById('detail-kategori');
const detailTanggal = document.getElementById('detail-tanggal');
const detailStatus = document.getElementById('detail-status');
const detailContentBlocks = document.getElementById('detail-content-blocks');
const detailHyperlinkContainer = document.getElementById('detail-hyperlink-container');
const detailHyperlink = document.getElementById('detail-hyperlink');

// Categories Elements
const categoriesTableBody = document.getElementById('categories-table-body');
const addCatBtn = document.getElementById('add-cat-btn');
const addCatModal = document.getElementById('add-cat-modal');
const addCatForm = document.getElementById('add-cat-form');
const closeCatModalBtn = document.getElementById('close-cat-modal-btn');
const catNameInput = document.getElementById('cat-name-input');

// Post Form Modal Elements
const addModal = document.getElementById('add-modal');
const addForm = document.getElementById('add-form');
const closeModalBtn = document.getElementById('close-modal-btn');
const postIdInput = document.getElementById('post-id');
const postKategoriSelect = document.getElementById('post-kategori');
const modalPostTitle = document.getElementById('modal-post-title');
const contentBlocksContainer = document.getElementById('content-blocks-container');
const addParagraphBtn = document.getElementById('add-paragraph-btn');
const addTableBtn = document.getElementById('add-table-btn');
const emptyBlocksText = document.getElementById('empty-blocks-text');
let contentBlocksData = [];

// User Management & Profile
const usersTableBody = document.getElementById('users-table-body');
const addUserBtn = document.getElementById('add-user-btn');
const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');
const closeUserModalBtn = document.getElementById('close-user-modal-btn');
const userModalTitle = document.getElementById('user-modal-title');
const userIdInput = document.getElementById('user-id');
const userPasswordGroup = document.getElementById('user-password-group');
const resetPasswordModal = document.getElementById('reset-password-modal');
const resetPasswordForm = document.getElementById('reset-password-form');
const closeResetModalBtn = document.getElementById('close-reset-modal-btn');
const resetUserIdInput = document.getElementById('reset-user-id');
const resetNewPasswordInput = document.getElementById('reset-new-password');
const changePwdBtn = document.getElementById('change-pwd-btn');
const profilePwdModal = document.getElementById('profile-pwd-modal');
const closeProfilePwdBtn = document.getElementById('close-profile-pwd-btn');
const profilePwdForm = document.getElementById('profile-pwd-form');

// Notification Elements
const notifDropdownWrapper = document.getElementById('notif-dropdown-wrapper');
const notifBellBtn = document.getElementById('notif-bell-btn');
const notifDropdownMenu = document.getElementById('notif-dropdown-menu');
const notifBadge = document.getElementById('notif-badge');
const notifList = document.getElementById('notif-list');

// Profile Elements
const profileDropdownWrapper = document.getElementById('profile-dropdown-wrapper');
const profileBtn = document.getElementById('profile-btn');
const profileDropdownMenu = document.getElementById('profile-dropdown-menu');

// State
let currentUser = null;
let currentToken = null;
let currentPostPage = 1;
let totalPostPages = 1;
let currentSearchQuery = '';
let currentYearFilter = '';
let currentCategoryFilter = '';
let currentStatusFilter = ''; 
let currentActiveView = 'overview'; // tracks which list view was open before detail view
let isViewingDetail = false;

// Dropdown Logic
notifBellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdownMenu.classList.toggle('hidden');
    profileDropdownMenu.classList.add('hidden');
});

profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdownMenu.classList.toggle('hidden');
    notifDropdownMenu.classList.add('hidden');
    
    // Rotate chevron
    const chevron = profileBtn.querySelector('.fa-chevron-down');
    if(profileDropdownMenu.classList.contains('hidden')) {
        chevron.style.transform = 'rotate(0deg)';
    } else {
        chevron.style.transform = 'rotate(180deg)';
    }
});

document.addEventListener('click', (e) => {
    if (notifDropdownWrapper && !notifDropdownWrapper.contains(e.target)) {
        notifDropdownMenu.classList.add('hidden');
    }
    if (profileDropdownWrapper && !profileDropdownWrapper.contains(e.target)) {
        profileDropdownMenu.classList.add('hidden');
        profileBtn.querySelector('.fa-chevron-down').style.transform = 'rotate(0deg)';
    }
});

// Helper for rendering badges
function renderBadge(status) {
    const isAktif = status === 'published' || status === 'Aktif';
    const text = isAktif ? 'Aktif' : 'Tidak Berlaku';
    const classes = isAktif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200';
    return `<span class="badge ${classes}">${text}</span>`;
}

// Initialize
function init() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1990; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearFilter.appendChild(option);
    }

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginContainer.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
}

function showDashboard() {
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    
    userNameEl.textContent = currentUser.username;
    userRoleEl.textContent = currentUser.role === 'admin' ? 'Administrator' : 'Viewer';
    userAvatarEl.textContent = currentUser.username.charAt(0).toUpperCase();
    
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    
    if (currentUser.role === 'admin') {
        navAll.style.display = 'flex';
        adminOnlyElements.forEach(el => el.style.display = '');
        document.getElementById('change-pwd-btn').style.display = 'flex';
    } else {
        navAll.style.display = 'none';
        adminOnlyElements.forEach(el => el.style.display = 'none');
        document.getElementById('change-pwd-btn').style.display = 'none';
    }
    
    // Viewers can access Active and Inactive
    navActive.style.display = 'flex';
    navInactive.style.display = 'flex';
    
    fetchCategories();
    switchView('overview');
}

// Navigation Logic
navOverview.addEventListener('click', (e) => { e.preventDefault(); switchView('overview'); });
navAll.addEventListener('click', (e) => { e.preventDefault(); switchView('all'); });
navActive.addEventListener('click', (e) => { e.preventDefault(); switchView('active'); });
navInactive.addEventListener('click', (e) => { e.preventDefault(); switchView('inactive'); });
navCategories.addEventListener('click', (e) => { e.preventDefault(); switchView('categories'); });
navUsers.addEventListener('click', (e) => { e.preventDefault(); switchView('users'); });

document.getElementById('view-all-btn').addEventListener('click', () => switchView('all'));

function switchView(view) {
    isViewingDetail = false;
    viewOverview.classList.add('hidden');
    viewMaster.classList.add('hidden');
    viewCategories.classList.add('hidden');
    viewUsers.classList.add('hidden');
    viewDetail.classList.add('hidden');
    
    navOverview.classList.remove('active');
    navAll.classList.remove('active');
    navActive.classList.remove('active');
    navInactive.classList.remove('active');
    navCategories.classList.remove('active');
    navUsers.classList.remove('active');

    currentActiveView = view;

    if (view === 'overview') {
        navOverview.classList.add('active');
        viewOverview.classList.remove('hidden');
        searchBarContainer.style.display = 'flex';
        currentStatusFilter = '';
        fetchPosts(false); 
        updateDashboardStats();
    } else if (view === 'all') {
        navAll.classList.add('active');
        viewMaster.classList.remove('hidden');
        searchBarContainer.style.display = 'flex';
        masterTitle.textContent = "Semua Keputusan";
        masterSubtitle.textContent = "Kelola seluruh data keputusan";
        currentStatusFilter = '';
        fetchPosts(true); 
    } else if (view === 'active') {
        navActive.classList.add('active');
        viewMaster.classList.remove('hidden');
        searchBarContainer.style.display = 'flex';
        masterTitle.textContent = "Keputusan Aktif";
        masterSubtitle.textContent = "Data keputusan yang masih berlaku";
        currentStatusFilter = 'published';
        fetchPosts(true); 
    } else if (view === 'inactive') {
        navInactive.classList.add('active');
        viewMaster.classList.remove('hidden');
        searchBarContainer.style.display = 'flex';
        masterTitle.textContent = "Keputusan Tidak Berlaku";
        masterSubtitle.textContent = "Data keputusan yang sudah dicabut/arsip";
        currentStatusFilter = 'inactive';
        fetchPosts(true); 
    } else if (view === 'categories') {
        navCategories.classList.add('active');
        viewCategories.classList.remove('hidden');
        searchBarContainer.style.display = 'none';
        renderCategoriesView();
    } else if (view === 'users') {
        navUsers.classList.add('active');
        viewUsers.classList.remove('hidden');
        searchBarContainer.style.display = 'none';
        fetchUsers();
    }
}

// Authentication
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    btn.disabled = true;
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentToken = data.token;
            currentUser = data.user;
            loginError.textContent = '';
            loginError.classList.add('hidden');
            loginForm.reset();
            showDashboard();
        } else {
            loginError.textContent = data.error || 'Login gagal';
            loginError.classList.remove('hidden');
        }
    } catch (err) {
        loginError.textContent = 'Gagal menghubungi server';
        loginError.classList.remove('hidden');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentToken = null;
    currentUser = null;
    showLogin();
});

// Categories Management
let categoriesCache = [];
async function fetchCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        const data = await res.json();
        categoriesCache = data.data || [];
        
        categoryFilter.innerHTML = '<option value="">Semua Kategori</option>';
        postKategoriSelect.innerHTML = '<option value="">Pilih Kategori...</option>';
        
        categoriesCache.forEach(cat => {
            const opt1 = document.createElement('option');
            opt1.value = cat; opt1.textContent = cat;
            categoryFilter.appendChild(opt1);
            
            const opt2 = document.createElement('option');
            opt2.value = cat; opt2.textContent = cat;
            postKategoriSelect.appendChild(opt2);
        });
        
        if (currentActiveView === 'categories' && !isViewingDetail) {
            renderCategoriesView();
        }
    } catch(err) { console.error('Error fetching categories:', err); }
}

function renderCategoriesView() {
    categoriesTableBody.innerHTML = '';
    if (categoriesCache.length === 0) {
        categoriesTableBody.innerHTML = `<tr><td colspan="2" class="text-center py-8 text-gray-500">Tidak ada kategori</td></tr>`;
        return;
    }
    categoriesCache.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="font-medium text-gray-900"><i class="fa-solid fa-tag text-gray-400 mr-2 text-xs"></i> ${cat}</td>
            <td class="text-right">
                <button class="btn-secondary filter-cat-btn !text-xs !py-1.5" data-cat="${cat}"><i class="fa-solid fa-filter"></i> Lihat Keputusan</button>
            </td>
        `;
        tr.querySelector('.filter-cat-btn').addEventListener('click', (e) => {
            currentCategoryFilter = e.currentTarget.dataset.cat;
            categoryFilter.value = currentCategoryFilter;
            switchView('all');
        });
        categoriesTableBody.appendChild(tr);
    });
}

addCatBtn.addEventListener('click', () => {
    addCatForm.reset();
    addCatModal.classList.remove('hidden');
});
closeCatModalBtn.addEventListener('click', () => { addCatModal.classList.add('hidden'); });

addCatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            body: JSON.stringify({ name: catNameInput.value })
        });
        if (res.ok) {
            addCatModal.classList.add('hidden');
            fetchCategories();
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal menambahkan kategori');
        }
    } catch (err) { alert('Terjadi kesalahan.'); }
});

// Stats Update & Notifications
async function updateDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/posts/search?limit=1000`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        const data = await res.json();
        const allPosts = data.data || [];
        
        const total = data.total;
        const active = allPosts.filter(p => p.status === 'published').length;
        const inactive = allPosts.filter(p => p.status !== 'published').length;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const updatedThisMonth = allPosts.filter(p => {
            const d = new Date(p.created_at || p.tanggal_keputusan);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
        
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-active').textContent = active;
        document.getElementById('stat-inactive').textContent = inactive;
        document.getElementById('stat-month').textContent = updatedThisMonth;
        document.getElementById('stat-categories').textContent = categoriesCache.length;
        
        // Update Notifications (Simulate using the 3 most recently updated items)
        const recentUpdates = allPosts.slice(0, 3);
        let readNotifs = JSON.parse(localStorage.getItem('readNotifs') || '[]');
        let hasUnread = false;
        
        if (recentUpdates.length > 0) {
            notifList.innerHTML = '';
            recentUpdates.forEach(post => {
                const isRead = readNotifs.includes(post.id);
                if (!isRead) hasUnread = true;
                
                const div = document.createElement('div');
                div.className = `p-4 border-b border-gray-50 hover:bg-gray-100 cursor-pointer transition-colors ${isRead ? 'opacity-60' : 'bg-blue-50/50'}`;
                div.innerHTML = `
                    <div class="flex items-start gap-3 relative">
                        ${!isRead ? '<span class="absolute -left-2 top-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>' : ''}
                        <div class="mt-1 flex-shrink-0 ${isRead ? 'text-gray-400' : 'text-blue-500'}"><i class="fa-solid fa-circle-info"></i></div>
                        <div>
                            <p class="text-xs font-semibold ${isRead ? 'text-gray-600' : 'text-gray-900'}">${post.nomor_keputusan || post.title}</p>
                            <p class="text-[10px] text-gray-500 mt-0.5 line-clamp-1">Baru saja ditambahkan/diperbarui</p>
                        </div>
                    </div>
                `;
                div.addEventListener('click', () => {
                    // Tandai dibaca
                    if (!readNotifs.includes(post.id)) {
                        readNotifs.push(post.id);
                        localStorage.setItem('readNotifs', JSON.stringify(readNotifs));
                        updateDashboardStats(); // Refresh UI notifikasi
                    }
                    notifDropdownMenu.classList.add('hidden');
                    openDetailView(post);
                });
                notifList.appendChild(div);
            });
            
            if (hasUnread) {
                notifBadge.classList.remove('hidden');
            } else {
                notifBadge.classList.add('hidden');
            }
        } else {
            notifBadge.classList.add('hidden');
            notifList.innerHTML = '<div class="p-4 text-center text-xs text-gray-500">Tidak ada notifikasi</div>';
        }
        
    } catch(err) { console.error(err); }
}

// Posts Logic
let searchTimeout;
async function fetchPosts(isMasterView = false, query = currentSearchQuery, year = currentYearFilter, cat = currentCategoryFilter, page = currentPostPage) {
    currentSearchQuery = query;
    currentYearFilter = year;
    currentCategoryFilter = cat;
    currentPostPage = page;
    
    try {
        const statusQuery = currentStatusFilter ? `&status=${currentStatusFilter}` : '';
        const res = await fetch(`${API_URL}/posts/search?q=${query}&year=${year}&category=${cat}&page=${page}${statusQuery}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (res.status === 401 || res.status === 403) return logoutBtn.click();
        
        const data = await res.json();
        const posts = data.data || [];
        
        if (isMasterView) renderMasterTable(posts);
        else renderOverviewTable(posts); 
        
        totalPostPages = data.totalPages || 1;
        if(isMasterView) {
            pageInfo.textContent = `Halaman ${currentPostPage} dari ${totalPostPages}`;
            prevPageBtn.disabled = currentPostPage <= 1;
            nextPageBtn.disabled = currentPostPage >= totalPostPages;
            prevPageBtn.style.opacity = prevPageBtn.disabled ? '0.5' : '1';
            nextPageBtn.style.opacity = nextPageBtn.disabled ? '0.5' : '1';
        }
        
    } catch (err) { console.error('Error fetching data:', err); }
}

function renderOverviewTable(posts) {
    tableBody.innerHTML = '';
    const recentPosts = posts.slice(0, 5);
    if (recentPosts.length === 0) { tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-500">Tidak ada data ditemukan</td></tr>`; return; }
    
    recentPosts.forEach(post => {
        const tr = document.createElement('tr');
        const dateObj = new Date(post.tanggal_keputusan || post.created_at);
        tr.innerHTML = `
            <td class="font-medium">${post.nomor_keputusan || post.title}</td>
            <td class="text-sm">${post.description ? post.description : '-'}</td>
            <td class="text-xs text-gray-500">${dateObj.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'})}</td>
            <td>${renderBadge(post.status)}</td>
            <td class="text-center">${post.hyperlink ? `<a href="${post.hyperlink}" target="_blank" class="text-gray-400 hover:text-navy-900 transition-colors" title="Buka Link"><i class="fa-solid fa-link text-lg"></i></a>` : '-'}</td>
            <td class="text-right">
                <button class="px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 hover:text-navy-900 transition-colors text-xs font-medium view-detail-btn">Lihat Detail</button>
            </td>
        `;
        tr.querySelector('.view-detail-btn').addEventListener('click', () => openDetailView(post));
        tableBody.appendChild(tr);
    });
}

function renderMasterTable(posts) {
    masterTableBody.innerHTML = '';
    if (posts.length === 0) { masterTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-500">Tidak ada data ditemukan</td></tr>`; return; }
    
    posts.forEach(post => {
        const tr = document.createElement('tr');
        const dateObj = new Date(post.tanggal_keputusan || post.created_at);
        const isAdmin = currentUser.role === 'admin';
        
        const statusActionIcon = post.status === 'published' ? 'fa-clock-rotate-left' : 'fa-circle-check';
        const statusActionLabel = post.status === 'published' ? 'Nonaktifkan' : 'Aktifkan';
        
        let actionButtons = `<button class="px-2 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 hover:text-navy-900 transition-colors text-xs font-medium view-detail-btn" title="Lihat Detail"><i class="fa-solid fa-eye"></i></button>`;
        if (isAdmin) {
            actionButtons += `
                <button class="px-2 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors text-xs font-medium edit-post-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="px-2 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 hover:text-orange-600 transition-colors text-xs font-medium toggle-status-btn" data-status="${post.status === 'published' ? 'inactive' : 'published'}" title="${statusActionLabel}"><i class="fa-solid ${statusActionIcon}"></i></button>
                <button class="px-2 py-1.5 border border-red-200 rounded text-red-500 hover:bg-red-50 transition-colors text-xs font-medium del-post-btn" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
            `;
        }
        
        tr.innerHTML = `
            <td class="font-medium">${post.nomor_keputusan || post.title}</td>
            <td class="text-sm">${post.description ? post.description : '-'}</td>
            <td class="text-xs text-gray-500">${dateObj.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'})}</td>
            <td>${renderBadge(post.status)}</td>
            <td class="text-center">${post.hyperlink ? `<a href="${post.hyperlink}" target="_blank" class="text-gray-400 hover:text-navy-900 transition-colors" title="Buka Link"><i class="fa-solid fa-link text-lg"></i></a>` : '-'}</td>
            <td class="text-right"><div class="flex justify-end gap-1.5">${actionButtons}</div></td>
        `;
        
        tr.querySelector('.view-detail-btn').addEventListener('click', () => openDetailView(post));
        
        if (isAdmin) {
            tr.querySelector('.edit-post-btn').addEventListener('click', () => openEditModal(post));
            tr.querySelector('.toggle-status-btn').addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                if(confirm(`Ubah status menjadi ${btn.dataset.status}?`)) {
                    await fetch(`${API_URL}/posts/${post.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` }, body: JSON.stringify({ status: btn.dataset.status }) });
                    fetchPosts(true); updateDashboardStats();
                }
            });
            tr.querySelector('.del-post-btn').addEventListener('click', async () => {
                if(confirm('Hapus data secara permanen?')) {
                    await fetch(`${API_URL}/posts/${post.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${currentToken}` } });
                    fetchPosts(true); fetchCategories(); updateDashboardStats();
                }
            });
        }
        masterTableBody.appendChild(tr);
    });
}

// Full Page Detail Renderer
function openDetailView(post) {
    isViewingDetail = true;
    // Hide all current list views
    viewOverview.classList.add('hidden');
    viewMaster.classList.add('hidden');
    viewCategories.classList.add('hidden');
    viewUsers.classList.add('hidden');
    
    // Show detail view
    viewDetail.classList.remove('hidden');
    
    detailNomor.textContent = post.nomor_keputusan || post.title;
    detailKategori.textContent = post.kategori || 'Umum';
    detailStatus.innerHTML = renderBadge(post.status);
    
    const dateObj = new Date(post.tanggal_keputusan || post.created_at);
    detailTanggal.innerHTML = `<i class="fa-regular fa-calendar"></i> ${dateObj.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year:'numeric'})}`;
    
    detailContentBlocks.innerHTML = '';
    if (post.description) {
        const descP = document.createElement('p');
        descP.className = "text-gray-600 font-medium mb-8 text-lg text-justify break-words";
        descP.textContent = post.description;
        detailContentBlocks.appendChild(descP);
    }
    
    if (post.content_blocks && Array.isArray(post.content_blocks) && post.content_blocks.length > 0) {
        post.content_blocks.forEach(block => {
            if (block.type === 'paragraph') {
                const p = document.createElement('p');
                p.textContent = block.content;
                p.className = "leading-relaxed mb-5 text-gray-700 text-justify break-words";
                detailContentBlocks.appendChild(p);
            } else if (block.type === 'table') {
                const tableContainer = document.createElement('div');
                tableContainer.className = "overflow-x-auto my-8";
                const table = document.createElement('table');
                table.className = "min-w-full table-auto border-collapse border border-gray-300";
                
                const thead = document.createElement('thead');
                const trHead = document.createElement('tr');
                if (block.content.headers) {
                    block.content.headers.forEach(header => {
                        const th = document.createElement('th');
                        th.textContent = header;
                        th.className = "px-5 py-4 text-center text-xs font-bold text-gray-900 uppercase tracking-wider bg-gray-50 border border-gray-300";
                        trHead.appendChild(th);
                    });
                }
                thead.appendChild(trHead);
                table.appendChild(thead);
                
                const tbody = document.createElement('tbody');
                tbody.className = "bg-white";
                if (block.content.rows) {
                    block.content.rows.forEach(row => {
                        const tr = document.createElement('tr');
                        row.forEach(cell => {
                            const td = document.createElement('td');
                            td.textContent = cell;
                            td.className = "px-5 py-4 text-sm text-gray-900 border border-gray-300";
                            tr.appendChild(td);
                        });
                        tbody.appendChild(tr);
                    });
                }
                table.appendChild(tbody);
                tableContainer.appendChild(table);
                detailContentBlocks.appendChild(tableContainer);
            }
        });
    }
    
    if (post.hyperlink) {
        detailHyperlinkContainer.style.display = 'block';
        detailHyperlink.href = post.hyperlink;
    } else {
        detailHyperlinkContainer.style.display = 'none';
    }
}

backHomeBtn.addEventListener('click', () => { switchView(currentActiveView); });

// Filters & Pagination Handlers
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { fetchPosts(currentActiveView !== 'overview', e.target.value, currentYearFilter, currentCategoryFilter, 1); }, 300); 
});
yearFilter.addEventListener('change', (e) => { fetchPosts(currentActiveView !== 'overview', currentSearchQuery, e.target.value, currentCategoryFilter, 1); });
categoryFilter.addEventListener('change', (e) => { fetchPosts(currentActiveView !== 'overview', currentSearchQuery, currentYearFilter, e.target.value, 1); });
prevPageBtn.addEventListener('click', () => { if (currentPostPage > 1) fetchPosts(true, currentSearchQuery, currentYearFilter, currentCategoryFilter, currentPostPage - 1); });
nextPageBtn.addEventListener('click', () => { if (currentPostPage < totalPostPages) fetchPosts(true, currentSearchQuery, currentYearFilter, currentCategoryFilter, currentPostPage + 1); });

// Add / Edit Modal Logic
document.querySelectorAll('.add-data-btn').forEach(btn => {
    btn.addEventListener('click', () => { 
        modalPostTitle.innerHTML = 'Form Keputusan Baru';
        addForm.reset();
        postIdInput.value = '';
        contentBlocksData = [];
        renderContentBlocksEditor();
        addModal.classList.remove('hidden'); 
    });
});

function openEditModal(post) {
    modalPostTitle.innerHTML = 'Edit Keputusan';
    addForm.reset();
    postIdInput.value = post.id;
    document.getElementById('post-nomor').value = post.nomor_keputusan || post.title;
    document.getElementById('post-kategori').value = post.kategori || '';
    
    if (post.tanggal_keputusan) document.getElementById('post-tanggal').value = new Date(post.tanggal_keputusan).toISOString().split('T')[0];
    else document.getElementById('post-tanggal').value = new Date(post.created_at).toISOString().split('T')[0];
    
    document.getElementById('post-desc').value = post.description || '';
    document.getElementById('post-link').value = post.hyperlink || '';
    
    contentBlocksData = post.content_blocks && Array.isArray(post.content_blocks) ? post.content_blocks : [];
    renderContentBlocksEditor();
    
    addModal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => { addModal.classList.add('hidden'); });

function renderContentBlocksEditor() {
    contentBlocksContainer.innerHTML = '';
    if(contentBlocksData.length === 0) { emptyBlocksText.style.display = 'block'; } 
    else {
        emptyBlocksText.style.display = 'none';
        contentBlocksData.forEach((block, index) => {
            const div = document.createElement('div');
            div.className = 'bg-white border border-gray-200 rounded-md p-4 relative shadow-sm';
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            delBtn.className = 'absolute top-3 right-3 text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded text-xs';
            delBtn.onclick = () => { contentBlocksData.splice(index, 1); renderContentBlocksEditor(); };

            if (block.type === 'paragraph') {
                div.innerHTML = `<h5 class="text-xs font-bold text-gray-700 mb-2"><i class="fa-solid fa-align-left"></i> Paragraf</h5>
                <textarea class="w-full text-sm p-2 border border-gray-300 rounded focus:border-navy-900 outline-none" rows="3" onchange="updateBlock(${index}, 'content', this.value)">${block.content}</textarea>`;
            } else if (block.type === 'table') {
                div.innerHTML = `<h5 class="text-xs font-bold text-gray-700 mb-1"><i class="fa-solid fa-table"></i> Tabel</h5>
                <p class="text-[10px] text-gray-500 mb-2">Pisahkan kolom dengan titik koma (;). Baris pertama akan menjadi header.</p>`;
                const textarea = document.createElement('textarea');
                textarea.className = "w-full text-sm p-2 border border-gray-300 rounded focus:border-navy-900 outline-none font-mono text-xs";
                textarea.rows = 4;
                let csvStr = '';
                if (block.content.headers) {
                    csvStr += block.content.headers.join(';') + '\n';
                    if(block.content.rows) block.content.rows.forEach(r => { csvStr += r.join(';') + '\n'; });
                }
                textarea.value = csvStr;
                textarea.onchange = (e) => {
                    const lines = e.target.value.split('\n').filter(l => l.trim() !== '');
                    if (lines.length > 0) {
                        const headers = lines[0].split(';').map(s => s.trim());
                        const rows = lines.slice(1).map(l => l.split(';').map(s => s.trim()));
                        contentBlocksData[index].content = { headers, rows };
                    } else contentBlocksData[index].content = { headers: [], rows: [] };
                };
                div.appendChild(textarea);
            }
            div.appendChild(delBtn);
            contentBlocksContainer.appendChild(div);
        });
    }
}

addParagraphBtn.addEventListener('click', () => { contentBlocksData.push({ type: 'paragraph', content: '' }); renderContentBlocksEditor(); });
addTableBtn.addEventListener('click', () => { contentBlocksData.push({ type: 'table', content: { headers: [], rows: [] } }); renderContentBlocksEditor(); });
window.updateBlock = function(index, field, value) { contentBlocksData[index][field] = value; };

addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = postIdInput.value;
    const body = {
        nomor_keputusan: document.getElementById('post-nomor').value,
        kategori: document.getElementById('post-kategori').value,
        tanggal_keputusan: document.getElementById('post-tanggal').value,
        description: document.getElementById('post-desc').value,
        hyperlink: document.getElementById('post-link').value,
        content_blocks: contentBlocksData
    };

    const isEdit = id !== '';
    const url = isEdit ? `${API_URL}/posts/${id}` : `${API_URL}/posts`;
    
    try {
        const res = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            addModal.classList.add('hidden');
            fetchPosts(currentActiveView !== 'overview');
            updateDashboardStats();
        } else {
            const data = await res.json(); alert(data.error || 'Gagal menyimpan data');
        }
    } catch (err) { alert('Gagal menghubungi server'); } 
});

delAllDataBtn?.addEventListener('click', async () => {
    if(confirm('PERINGATAN! Anda yakin ingin menghapus SEMUA data keputusan? Aksi ini tidak dapat dibatalkan!')) {
        try {
            await fetch(`${API_URL}/posts/all`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${currentToken}` } });
            fetchPosts(true); fetchCategories(); updateDashboardStats();
        } catch (err) { alert('Gagal menghapus semua data'); }
    }
});

// USER MANAGEMENT
async function fetchUsers() {
    try {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (!res.ok) return; 
        const data = await res.json();
        usersTableBody.innerHTML = '';
        if ((data.data || []).length === 0) { usersTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-500">Tidak ada user viewer</td></tr>`; return; }
        
        data.data.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-medium">${user.username}</td>
                <td>${user.email}</td>
                <td class="text-gray-500">${new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                <td class="text-right">
                    <button class="px-2 py-1 border border-gray-200 rounded text-blue-600 hover:bg-gray-50 transition-colors text-xs font-medium edit-user-btn" data-id="${user.id}" data-username="${user.username}" data-email="${user.email}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="px-2 py-1 border border-gray-200 rounded text-orange-600 hover:bg-gray-50 transition-colors text-xs font-medium reset-pwd-btn" data-id="${user.id}" title="Reset Password"><i class="fa-solid fa-key"></i></button>
                    <button class="px-2 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50 transition-colors text-xs font-medium del-user-btn" data-id="${user.id}" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            usersTableBody.appendChild(tr);
        });
        setupUserActionButtons();
    } catch (err) { console.error(err); }
}

function setupUserActionButtons() {
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            userModalTitle.innerHTML = 'Edit Viewer'; userIdInput.value = e.currentTarget.dataset.id;
            document.getElementById('user-username').value = e.currentTarget.dataset.username;
            document.getElementById('user-email').value = e.currentTarget.dataset.email;
            document.getElementById('user-password').removeAttribute('required');
            userPasswordGroup.style.display = 'none'; userModal.classList.remove('hidden');
        });
    });
    document.querySelectorAll('.reset-pwd-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            resetUserIdInput.value = e.currentTarget.dataset.id; resetPasswordForm.reset(); resetPasswordModal.classList.remove('hidden');
        });
    });
    document.querySelectorAll('.del-user-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm('Apakah Anda yakin ingin menghapus viewer ini?')) {
                try {
                    const res = await fetch(`${API_URL}/users/${e.currentTarget.dataset.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${currentToken}` } });
                    if(res.ok) fetchUsers();
                } catch(err) {}
            }
        });
    });
}

addUserBtn.addEventListener('click', () => {
    userModalTitle.innerHTML = 'Tambah Viewer'; userIdInput.value = '';
    document.getElementById('user-password').setAttribute('required', 'true');
    userPasswordGroup.style.display = 'block'; userForm.reset(); userModal.classList.remove('hidden');
});
closeUserModalBtn.addEventListener('click', () => { userModal.classList.add('hidden'); });
closeResetModalBtn.addEventListener('click', () => { resetPasswordModal.classList.add('hidden'); });

userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = userIdInput.value; const isEdit = id !== '';
    const url = isEdit ? `${API_URL}/users/${id}` : `${API_URL}/register`;
    const body = isEdit ? { username: document.getElementById('user-username').value, email: document.getElementById('user-email').value } : { username: document.getElementById('user-username').value, email: document.getElementById('user-email').value, password: document.getElementById('user-password').value };
    try {
        const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` }, body: JSON.stringify(body) });
        if (res.ok) { userModal.classList.add('hidden'); fetchUsers(); } else { const data = await res.json(); alert(data.error); }
    } catch (err) { alert('Gagal menyimpan'); }
});

resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/users/${resetUserIdInput.value}/reset-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` }, body: JSON.stringify({ newPassword: resetNewPasswordInput.value }) });
        if (res.ok) { alert('Password direset!'); resetPasswordModal.classList.add('hidden'); }
    } catch (err) {}
});

changePwdBtn.addEventListener('click', () => { profilePwdForm.reset(); profilePwdModal.classList.remove('hidden'); });
closeProfilePwdBtn.addEventListener('click', () => { profilePwdModal.classList.add('hidden'); });

profilePwdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/profile/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` }, body: JSON.stringify({ currentPassword: document.getElementById('profile-current-pwd').value, newPassword: document.getElementById('profile-new-pwd').value }) });
        if (res.ok) { alert('Password profil berhasil diubah!'); profilePwdModal.classList.add('hidden'); } else { const data = await res.json(); alert(data.error); }
    } catch (err) {}
});

// Start
init();
