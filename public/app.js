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
const navUsers = document.getElementById('nav-users');
const navMaster = document.getElementById('nav-master');
const viewOverview = document.getElementById('view-overview');
const viewUsers = document.getElementById('view-users');
const viewDetail = document.getElementById('view-detail');
const viewMaster = document.getElementById('view-master');

// Overview Elements
const tableBody = document.getElementById('table-body');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

// Master Data Elements
const masterTableBody = document.getElementById('master-table-body');
const addDataBtn = document.getElementById('add-data-btn');
const delAllDataBtn = document.getElementById('del-all-data-btn');

// Post Form Modal Elements
const addModal = document.getElementById('add-modal');
const addForm = document.getElementById('add-form');
const closeModalBtn = document.getElementById('close-modal-btn');
const postIdInput = document.getElementById('post-id');
const categoryList = document.getElementById('category-list');
const modalPostTitle = document.getElementById('modal-post-title');

// Content Blocks for Adding Posts
const contentBlocksContainer = document.getElementById('content-blocks-container');
const addParagraphBtn = document.getElementById('add-paragraph-btn');
const addTableBtn = document.getElementById('add-table-btn');
let contentBlocksData = [];

// Detail Elements
const backHomeBtn = document.getElementById('back-home-btn');
const detailNomor = document.getElementById('detail-nomor');
const detailKategori = document.getElementById('detail-kategori');
const detailTanggal = document.getElementById('detail-tanggal');
const detailContentBlocks = document.getElementById('detail-content-blocks');
const detailHyperlinkContainer = document.getElementById('detail-hyperlink-container');
const detailHyperlink = document.getElementById('detail-hyperlink');

// User Management Elements
const usersTableBody = document.getElementById('users-table-body');
const addUserBtn = document.getElementById('add-user-btn');
const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');
const closeUserModalBtn = document.getElementById('close-user-modal-btn');
const userModalTitle = document.getElementById('user-modal-title');
const userIdInput = document.getElementById('user-id');
const userPasswordGroup = document.getElementById('user-password-group');

// Reset Password Elements
const resetPasswordModal = document.getElementById('reset-password-modal');
const resetPasswordForm = document.getElementById('reset-password-form');
const closeResetModalBtn = document.getElementById('close-reset-modal-btn');
const resetUserIdInput = document.getElementById('reset-user-id');
const resetNewPasswordInput = document.getElementById('reset-new-password');

// State
let currentUser = null;
let currentToken = null;
let currentPostPage = 1;
let totalPostPages = 1;
let currentSearchQuery = '';
let currentYearFilter = '';
let currentCategoryFilter = '';
let allPostsCache = []; // For master data which might not need pagination, or we use the same fetch

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
    userRoleEl.textContent = currentUser.role;
    userAvatarEl.textContent = currentUser.username.charAt(0).toUpperCase();
    
    if (currentUser.role === 'admin') {
        navUsers.style.display = 'block';
        navMaster.style.display = 'block';
    } else {
        navUsers.style.display = 'none';
        navMaster.style.display = 'none';
    }
    
    fetchCategories();
    switchView('overview');
}

// Navigation Logic
navOverview.addEventListener('click', (e) => { e.preventDefault(); switchView('overview'); });
navUsers.addEventListener('click', (e) => { e.preventDefault(); switchView('users'); });
navMaster.addEventListener('click', (e) => { e.preventDefault(); switchView('master'); });
backHomeBtn.addEventListener('click', () => { switchView('overview'); });

function switchView(view) {
    viewOverview.classList.add('hidden');
    viewUsers.classList.add('hidden');
    viewDetail.classList.add('hidden');
    viewMaster.classList.add('hidden');
    
    navOverview.classList.remove('active');
    navUsers.classList.remove('active');
    navMaster.classList.remove('active');

    if (view === 'overview') {
        navOverview.classList.add('active');
        viewOverview.classList.remove('hidden');
        searchBarContainer.style.display = 'flex';
        fetchPosts();
    } else if (view === 'users') {
        navUsers.classList.add('active');
        viewUsers.classList.remove('hidden');
        searchBarContainer.style.display = 'none';
        fetchUsers();
    } else if (view === 'master') {
        navMaster.classList.add('active');
        viewMaster.classList.remove('hidden');
        searchBarContainer.style.display = 'flex'; // Use same search bar for master data
        fetchPosts(true); // pass true to render master table instead
    } else if (view === 'detail') {
        navOverview.classList.add('active'); // Keep overview active visually
        viewDetail.classList.remove('hidden');
        searchBarContainer.style.display = 'none';
    }
}

// Authentication
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
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
            loginForm.reset();
            showDashboard();
        } else {
            loginError.textContent = data.error || 'Login gagal';
        }
    } catch (err) {
        loginError.textContent = 'Gagal menghubungi server';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentToken = null;
    currentUser = null;
    showLogin();
});

// ==========================================
// CATEGORIES LOGIC
// ==========================================
async function fetchCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        const data = await res.json();
        const categories = data.data || [];
        
        // Update filter dropdown
        categoryFilter.innerHTML = '<option value="">Semua Kategori</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categoryFilter.appendChild(opt);
        });
        
        // Update datalist for form
        categoryList.innerHTML = '';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            categoryList.appendChild(opt);
        });
    } catch(err) { console.error('Error fetching categories:', err); }
}

// ==========================================
// POSTS (KEPUTUSAN) LOGIC
// ==========================================
async function fetchPosts(isMasterView = false, query = currentSearchQuery, year = currentYearFilter, cat = currentCategoryFilter, page = currentPostPage) {
    currentSearchQuery = query;
    currentYearFilter = year;
    currentCategoryFilter = cat;
    currentPostPage = page;
    try {
        const res = await fetch(`${API_URL}/posts/search?q=${query}&year=${year}&category=${cat}&page=${page}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (res.status === 401 || res.status === 403) return logoutBtn.click();
        
        const data = await res.json();
        const posts = data.data || [];
        
        if (viewMaster.classList.contains('hidden') && !isMasterView) {
            renderOverviewTable(posts);
        } else {
            renderMasterTable(posts);
        }
        
        totalPostPages = data.totalPages || 1;
        pageInfo.textContent = `Halaman ${currentPostPage} dari ${totalPostPages}`;
        prevPageBtn.disabled = currentPostPage <= 1;
        nextPageBtn.disabled = currentPostPage >= totalPostPages;
        
    } catch (err) { console.error('Error fetching data:', err); }
}

function renderOverviewTable(posts) {
    tableBody.innerHTML = '';
    if (posts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">Tidak ada data ditemukan</td></tr>`;
        return;
    }
    
    // Overview shows only public active posts or all if admin? We'll show all but indicate status
    posts.forEach(post => {
        const tr = document.createElement('tr');
        
        const dateObj = new Date(post.tanggal_keputusan || post.created_at);
        const yearStr = dateObj.getFullYear();
        
        tr.innerHTML = `
            <td><strong>${post.nomor_keputusan || post.title}</strong></td>
            <td><span class="badge" style="background:var(--primary); color:white;">${post.kategori || 'Umum'}</span></td>
            <td>${post.description ? post.description.substring(0, 50) + '...' : '-'}</td>
            <td>${yearStr}</td>
            <td>
                <button class="btn-primary view-detail-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;"><i class="fa-solid fa-eye"></i> Lihat</button>
            </td>
        `;
        
        const viewBtn = tr.querySelector('.view-detail-btn');
        viewBtn.addEventListener('click', () => openDetailView(post));
        
        tableBody.appendChild(tr);
    });
}

function renderMasterTable(posts) {
    masterTableBody.innerHTML = '';
    if (posts.length === 0) {
        masterTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">Tidak ada data ditemukan</td></tr>`;
        return;
    }
    
    posts.forEach(post => {
        const tr = document.createElement('tr');
        
        const statusLabel = post.status === 'published' ? 'Nonaktifkan' : 'Aktifkan';
        const statusColor = post.status === 'published' ? '#f59e0b' : '#10b981';
        
        const dateObj = new Date(post.tanggal_keputusan || post.created_at);
        
        tr.innerHTML = `
            <td><strong>${post.nomor_keputusan || post.title}</strong></td>
            <td>${post.kategori || 'Umum'}</td>
            <td><span class="badge" style="background:${post.status === 'published' ? '#dcfce7' : '#fef08a'}; color:${post.status === 'published' ? '#166534' : '#854d0e'};">${post.status}</span></td>
            <td>${dateObj.toLocaleDateString('id-ID')}</td>
            <td>
                <button class="btn-secondary edit-post-btn" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-color:var(--primary); color:var(--primary);"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-secondary toggle-status-btn" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-color:${statusColor}; color:${statusColor};" data-status="${post.status === 'published' ? 'inactive' : 'published'}"><i class="fa-solid fa-power-off"></i></button>
                <button class="btn-secondary del-post-btn" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-color:#ef4444; color:#ef4444;"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        
        tr.querySelector('.edit-post-btn').addEventListener('click', () => openEditModal(post));
        
        tr.querySelector('.toggle-status-btn').addEventListener('click', async (e) => {
            const newStatus = e.currentTarget.dataset.status;
            if(confirm(`Yakin ingin mengubah status menjadi ${newStatus}?`)) {
                await fetch(`${API_URL}/posts/${post.id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
                    body: JSON.stringify({ status: newStatus })
                });
                fetchPosts(true);
            }
        });
        
        tr.querySelector('.del-post-btn').addEventListener('click', async () => {
            if(confirm('Yakin ingin menghapus data ini secara permanen?')) {
                await fetch(`${API_URL}/posts/${post.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                });
                fetchPosts(true);
                fetchCategories();
            }
        });

        masterTableBody.appendChild(tr);
    });
}

delAllDataBtn.addEventListener('click', async () => {
    if(confirm('PERINGATAN! Anda yakin ingin menghapus SEMUA data keputusan? Aksi ini tidak dapat dibatalkan!')) {
        try {
            await fetch(`${API_URL}/posts/all`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            fetchPosts(true);
            fetchCategories();
        } catch (err) { alert('Gagal menghapus semua data'); }
    }
});

// Detail View Renderer
function openDetailView(post) {
    switchView('detail');
    detailNomor.textContent = post.nomor_keputusan || post.title;
    detailKategori.textContent = post.kategori || 'Umum';
    
    const dateObj = new Date(post.tanggal_keputusan || post.created_at);
    detailTanggal.innerHTML = `<i class="fa-regular fa-calendar"></i> Tanggal Keputusan: ${dateObj.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year:'numeric'})}`;
    
    detailContentBlocks.innerHTML = '';
    
    if (post.content_blocks && Array.isArray(post.content_blocks) && post.content_blocks.length > 0) {
        post.content_blocks.forEach(block => {
            if (block.type === 'paragraph') {
                const p = document.createElement('p');
                p.textContent = block.content;
                p.style.marginBottom = '1rem';
                detailContentBlocks.appendChild(p);
            } else if (block.type === 'table') {
                const tableContainer = document.createElement('div');
                tableContainer.style.overflowX = 'auto';
                
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.marginBottom = '1.5rem';
                table.style.borderCollapse = 'collapse';
                
                const thead = document.createElement('thead');
                const trHead = document.createElement('tr');
                trHead.style.backgroundColor = 'var(--bg-light)';
                
                if (block.content.headers && block.content.headers.length > 0) {
                    block.content.headers.forEach(header => {
                        const th = document.createElement('th');
                        th.textContent = header;
                        th.style.border = '1px solid #ddd';
                        th.style.padding = '10px';
                        th.style.textAlign = 'left';
                        trHead.appendChild(th);
                    });
                }
                thead.appendChild(trHead);
                table.appendChild(thead);
                
                const tbody = document.createElement('tbody');
                if (block.content.rows && block.content.rows.length > 0) {
                    block.content.rows.forEach(row => {
                        const tr = document.createElement('tr');
                        row.forEach(cell => {
                            const td = document.createElement('td');
                            td.textContent = cell;
                            td.style.border = '1px solid #ddd';
                            td.style.padding = '10px';
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
    } else {
        const p = document.createElement('p');
        p.textContent = post.description || 'Tidak ada konten detail.';
        detailContentBlocks.appendChild(p);
    }
    
    if (post.hyperlink) {
        detailHyperlinkContainer.style.display = 'block';
        detailHyperlink.href = post.hyperlink;
    } else {
        detailHyperlinkContainer.style.display = 'none';
        detailHyperlink.href = '#';
    }
}

// Event Listeners for Filters
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const isMaster = !viewMaster.classList.contains('hidden');
        fetchPosts(isMaster, e.target.value, currentYearFilter, currentCategoryFilter, 1);
    }, 300); 
});

yearFilter.addEventListener('change', (e) => {
    const isMaster = !viewMaster.classList.contains('hidden');
    fetchPosts(isMaster, currentSearchQuery, e.target.value, currentCategoryFilter, 1);
});

categoryFilter.addEventListener('change', (e) => {
    const isMaster = !viewMaster.classList.contains('hidden');
    fetchPosts(isMaster, currentSearchQuery, currentYearFilter, e.target.value, 1);
});

prevPageBtn.addEventListener('click', () => {
    const isMaster = !viewMaster.classList.contains('hidden');
    if (currentPostPage > 1) fetchPosts(isMaster, currentSearchQuery, currentYearFilter, currentCategoryFilter, currentPostPage - 1);
});

nextPageBtn.addEventListener('click', () => {
    const isMaster = !viewMaster.classList.contains('hidden');
    if (currentPostPage < totalPostPages) fetchPosts(isMaster, currentSearchQuery, currentYearFilter, currentCategoryFilter, currentPostPage + 1);
});

// Modals for Adding / Editing Post
addDataBtn.addEventListener('click', () => { 
    modalPostTitle.innerHTML = '<i class="fa-solid fa-plus"></i> Tambah Keputusan Baru';
    addForm.reset();
    postIdInput.value = '';
    contentBlocksData = [];
    renderContentBlocksEditor();
    addModal.classList.remove('hidden'); 
});

function openEditModal(post) {
    modalPostTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Keputusan';
    addForm.reset();
    postIdInput.value = post.id;
    document.getElementById('post-nomor').value = post.nomor_keputusan || post.title;
    document.getElementById('post-kategori').value = post.kategori || 'Umum';
    
    // Format date to YYYY-MM-DD for input type="date"
    if (post.tanggal_keputusan) {
        document.getElementById('post-tanggal').value = new Date(post.tanggal_keputusan).toISOString().split('T')[0];
    } else {
        document.getElementById('post-tanggal').value = new Date(post.created_at).toISOString().split('T')[0];
    }
    
    document.getElementById('post-desc').value = post.description || '';
    document.getElementById('post-link').value = post.hyperlink || '';
    
    contentBlocksData = post.content_blocks && Array.isArray(post.content_blocks) ? post.content_blocks : [];
    renderContentBlocksEditor();
    
    addModal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => { addModal.classList.add('hidden'); });

// Block Editor Logic
function renderContentBlocksEditor() {
    contentBlocksContainer.innerHTML = '';
    contentBlocksData.forEach((block, index) => {
        const div = document.createElement('div');
        div.className = 'glass-card block-item';
        div.style.marginBottom = '1rem';
        div.style.padding = '1rem';
        div.style.position = 'relative';

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        delBtn.className = 'btn-secondary';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '10px';
        delBtn.style.right = '10px';
        delBtn.style.borderColor = '#ef4444';
        delBtn.style.color = '#ef4444';
        delBtn.style.padding = '0.3rem 0.6rem';
        delBtn.onclick = () => {
            contentBlocksData.splice(index, 1);
            renderContentBlocksEditor();
        };

        if (block.type === 'paragraph') {
            div.innerHTML = `<h4><i class="fa-solid fa-align-left"></i> Paragraf</h4><textarea style="width: 100%; margin-top: 10px; padding: 10px;" rows="4" onchange="updateBlock(${index}, 'content', this.value)">${block.content}</textarea>`;
        } else if (block.type === 'table') {
            div.innerHTML = `<h4><i class="fa-solid fa-table"></i> Tabel</h4><p style="font-size: 0.8rem; color: #666; margin-top:5px;">Isi baris dengan dipisahkan titik koma (;). Baris pertama otomatis menjadi header.</p>`;
            const textarea = document.createElement('textarea');
            textarea.style.width = '100%';
            textarea.style.marginTop = '10px';
            textarea.style.padding = '10px';
            textarea.rows = 5;
            
            let csvStr = '';
            if (block.content.headers) {
                csvStr += block.content.headers.join(';') + '\n';
                if(block.content.rows) {
                    block.content.rows.forEach(r => { csvStr += r.join(';') + '\n'; });
                }
            }
            textarea.value = csvStr;
            textarea.onchange = (e) => {
                const lines = e.target.value.split('\n').filter(l => l.trim() !== '');
                if (lines.length > 0) {
                    const headers = lines[0].split(';').map(s => s.trim());
                    const rows = lines.slice(1).map(l => l.split(';').map(s => s.trim()));
                    contentBlocksData[index].content = { headers, rows };
                } else {
                    contentBlocksData[index].content = { headers: [], rows: [] };
                }
            };
            div.appendChild(textarea);
        }
        
        div.appendChild(delBtn);
        contentBlocksContainer.appendChild(div);
    });
}

addParagraphBtn.addEventListener('click', () => {
    contentBlocksData.push({ type: 'paragraph', content: '' });
    renderContentBlocksEditor();
});

addTableBtn.addEventListener('click', () => {
    contentBlocksData.push({ type: 'table', content: { headers: [], rows: [] } });
    renderContentBlocksEditor();
});

window.updateBlock = function(index, field, value) {
    contentBlocksData[index][field] = value;
};

// Form Submit
addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = postIdInput.value;
    const nomor_keputusan = document.getElementById('post-nomor').value;
    const kategori = document.getElementById('post-kategori').value;
    const tanggal_keputusan = document.getElementById('post-tanggal').value;
    const description = document.getElementById('post-desc').value;
    const hyperlink = document.getElementById('post-link').value;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;
    
    const isEdit = id !== '';
    const url = isEdit ? `${API_URL}/posts/${id}` : `${API_URL}/posts`;
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            body: JSON.stringify({ nomor_keputusan, tanggal_keputusan, kategori, description, content_blocks: contentBlocksData, hyperlink })
        });
        
        if (res.ok) {
            addModal.classList.add('hidden');
            addForm.reset();
            contentBlocksData = [];
            
            fetchCategories(); // Refresh categories
            const isMaster = !viewMaster.classList.contains('hidden');
            fetchPosts(isMaster, currentSearchQuery, currentYearFilter, currentCategoryFilter, currentPostPage);
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal menyimpan data');
        }
    } catch (err) { alert('Gagal menghubungi server'); } 
    finally { btn.innerHTML = originalText; btn.disabled = false; }
});

// ==========================================
// USER MANAGEMENT LOGIC
// ==========================================
async function fetchUsers() {
    try {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (res.status === 401 || res.status === 403) return; 
        
        const data = await res.json();
        renderUsersTable(data.data || []);
    } catch (err) { console.error('Error fetching users:', err); }
}

function renderUsersTable(users) {
    usersTableBody.innerHTML = '';
    if (users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem;">Tidak ada user</td></tr>`;
        return;
    }
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td>${new Date(user.created_at).toLocaleDateString('id-ID')}</td>
            <td>
                <button class="btn-secondary edit-user-btn" style="padding: 0.4rem 0.8rem; font-size:0.8rem; border-color:var(--primary); color:var(--primary);" 
                    data-id="${user.id}" data-username="${user.username}" data-email="${user.email}"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-secondary reset-pwd-btn" style="padding: 0.4rem 0.8rem; font-size:0.8rem; border-color:#f59e0b; color:#f59e0b;" 
                    data-id="${user.id}"><i class="fa-solid fa-key"></i></button>
                <button class="btn-secondary del-user-btn" style="padding: 0.4rem 0.8rem; font-size:0.8rem; border-color:#ef4444; color:#ef4444;" 
                    data-id="${user.id}"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        usersTableBody.appendChild(tr);
    });

    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            userModalTitle.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Viewer';
            userIdInput.value = e.currentTarget.dataset.id;
            document.getElementById('user-username').value = e.currentTarget.dataset.username;
            document.getElementById('user-email').value = e.currentTarget.dataset.email;
            
            document.getElementById('user-password').removeAttribute('required');
            userPasswordGroup.style.display = 'none'; 
            
            userModal.classList.remove('hidden');
        });
    });

    document.querySelectorAll('.reset-pwd-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            resetUserIdInput.value = e.currentTarget.dataset.id;
            resetPasswordForm.reset();
            resetPasswordModal.classList.remove('hidden');
        });
    });

    document.querySelectorAll('.del-user-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm('Apakah Anda yakin ingin menghapus viewer ini?')) {
                const id = e.currentTarget.dataset.id;
                try {
                    const res = await fetch(`${API_URL}/users/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${currentToken}` }
                    });
                    if(res.ok) fetchUsers();
                    else alert('Gagal menghapus user');
                } catch(err) { alert('Terjadi kesalahan'); }
            }
        });
    });
}

addUserBtn.addEventListener('click', () => {
    userModalTitle.innerHTML = '<i class="fa-solid fa-user-plus"></i> Tambah Viewer';
    userIdInput.value = '';
    document.getElementById('user-password').setAttribute('required', 'true');
    userPasswordGroup.style.display = 'block';
    userForm.reset();
    userModal.classList.remove('hidden');
});

closeUserModalBtn.addEventListener('click', () => { userModal.classList.add('hidden'); });
closeResetModalBtn.addEventListener('click', () => { resetPasswordModal.classList.add('hidden'); });

userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = userIdInput.value;
    const username = document.getElementById('user-username').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    
    const isEdit = id !== '';
    const url = isEdit ? `${API_URL}/users/${id}` : `${API_URL}/register`;
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit ? { username, email } : { username, email, password };
    
    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            body: JSON.stringify(body)
        });
        
        if (res.ok) {
            userModal.classList.add('hidden');
            fetchUsers();
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal menyimpan user');
        }
    } catch (err) { alert('Gagal menghubungi server'); }
});

resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = resetUserIdInput.value;
    const newPassword = resetNewPasswordInput.value;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/users/${id}/reset-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            body: JSON.stringify({ newPassword })
        });
        
        if (res.ok) {
            alert('Password berhasil direset!');
            resetPasswordModal.classList.add('hidden');
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal mereset password');
        }
    } catch (err) { alert('Gagal menghubungi server'); }
    finally { btn.innerHTML = originalText; btn.disabled = false; }
});

// ==========================================
// CHANGE PROFILE PASSWORD LOGIC
// ==========================================
const changePwdBtn = document.getElementById('change-pwd-btn');
const profilePwdModal = document.getElementById('profile-pwd-modal');
const closeProfilePwdBtn = document.getElementById('close-profile-pwd-btn');
const profilePwdForm = document.getElementById('profile-pwd-form');

changePwdBtn.addEventListener('click', () => {
    profilePwdForm.reset();
    profilePwdModal.classList.remove('hidden');
});

closeProfilePwdBtn.addEventListener('click', () => {
    profilePwdModal.classList.add('hidden');
});

profilePwdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('profile-current-pwd').value;
    const newPassword = document.getElementById('profile-new-pwd').value;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/profile/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (res.ok) {
            alert('Password berhasil diubah!');
            profilePwdModal.classList.add('hidden');
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal mengubah password');
        }
    } catch (err) { alert('Gagal menghubungi server'); }
    finally { btn.innerHTML = originalText; btn.disabled = false; }
});

// Start
init();
