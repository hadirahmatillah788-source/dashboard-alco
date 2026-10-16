require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware agar frontend bisa mengirim data JSON ke backend
app.use(cors());
app.use(express.json());

// Menyajikan file statis dari folder public dengan path absolut (Penting untuk Vercel)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Fallback untuk route root '/' agar selalu mengirim portal.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// 1. Setup Koneksi ke Database PostgreSQL
const poolAlco = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin123@db:5432/web_app_db' });
const poolTreasury = new Pool({ connectionString: (process.env.DATABASE_URL || 'postgres://postgres:admin123@db:5432/web_app_db').replace('web_app_db', 'treasury_db') });
const poolIdle = new Pool({ connectionString: (process.env.DATABASE_URL || 'postgres://postgres:admin123@db:5432/web_app_db').replace('web_app_db', 'dana_idle_db') });

const getPool = (dbName) => {
    if (dbName === 'treasury') return poolTreasury;
    if (dbName === 'idle') return poolIdle;
    return poolAlco;
};

// Default pool (Alco) untuk routes yang tidak spesifik
const pool = poolAlco;

// Tes apakah berhasil terhubung ke database
poolAlco.connect().then(() => console.log('✅ Berhasil terhubung ke ALCO DB!')).catch((err) => console.error('❌ Gagal terhubung ke ALCO DB:', err.message));
poolTreasury.connect().then(() => console.log('✅ Berhasil terhubung ke Treasury DB!')).catch((err) => console.error('❌ Gagal terhubung ke Treasury DB:', err.message));
poolIdle.connect().then(() => console.log('✅ Berhasil terhubung ke Idle DB!')).catch((err) => console.error('❌ Gagal terhubung ke Idle DB:', err.message));

// ==========================================
// MIDDLEWARE: VERIFIKASI JWT (Pos Satpam)
// ==========================================
const authenticateToken = (req, res, next) => {
    // 1. Mengambil token dari header (Format standar: "Bearer TOKEN_NYA")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Jika tidak ada token sama sekali, tolak akses (401 Unauthorized)
    if (!token) {
        return res.status(401).json({ error: 'Akses ditolak. Anda harus login terlebih dahulu!' });
    }

    // 3. Verifikasi keaslian token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
        // Jika token palsu, diubah oleh hacker, atau sudah kedaluwarsa (403 Forbidden)
        if (err) {
            return res.status(403).json({ error: 'Sesi telah habis atau token tidak valid. Silakan login ulang.' });
        }

        // 4. Jika valid, simpan data user (dari dalam token) ke object "req" 
        // agar bisa dibaca oleh route selanjutnya
        req.user = decodedUser;

        // 5. Izinkan lewat ke rute tujuan
        next();
    });
};

// ==========================================
// 2. CONTOH ROUTE: INPUT DATA (Create) - HANYA UNTUK ADMIN
// ==========================================
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Akses ditolak.' });
        }

        const { nomor_keputusan, tanggal_keputusan, kategori, description, content_blocks, hyperlink } = req.body;
        const user_id = req.user.id;

        const newPost = await pool.query(
            'INSERT INTO posts (user_id, nomor_keputusan, description, tanggal_keputusan, content_blocks, hyperlink, kategori) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [user_id, nomor_keputusan, description, tanggal_keputusan, JSON.stringify(content_blocks), hyperlink, kategori || 'Umum']
        );

        res.status(201).json({ message: 'Data berhasil ditambahkan!', data: newPost.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal menyimpan data ke database' });
    }
});


// ==========================================
// 3. CONTOH ROUTE: FITUR SEARCH (Read)
// ==========================================
app.get('/api/posts/search', authenticateToken, async (req, res) => {
    try {
        const q = req.query.q || '';
        const year = req.query.year || '';
        const category = req.query.category || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        let queryStr = `WHERE (p.nomor_keputusan ILIKE $1 OR p.description ILIKE $1)`;
        let countParams = [`%${q}%`];
        
        if (year) {
            countParams.push(year);
            queryStr += ` AND EXTRACT(YEAR FROM p.tanggal_keputusan) = $${countParams.length}`;
        }
        
        if (category) {
            countParams.push(category);
            queryStr += ` AND p.kategori = $${countParams.length}`;
        }
        
        const status = req.query.status || '';
        if (status) {
            countParams.push(status);
            queryStr += ` AND p.status = $${countParams.length}`;
        }

        const countQuery = await pool.query(
            `SELECT COUNT(*) FROM posts p ${queryStr}`,
            countParams
        );
        const totalItems = parseInt(countQuery.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        let selectParams = [...countParams, limit, offset];
        const posts = await pool.query(
            `SELECT p.id, p.nomor_keputusan, p.description, p.tanggal_keputusan, p.kategori, p.status, p.created_at, p.content_blocks, p.hyperlink, u.username as author 
             FROM posts p 
             JOIN users u ON p.user_id = u.id 
             ${queryStr}
             ORDER BY p.tanggal_keputusan DESC NULLS LAST, p.created_at DESC 
             LIMIT $${selectParams.length - 1} OFFSET $${selectParams.length}`,
            selectParams
        );

        res.json({
            message: 'Hasil pencarian:',
            total: totalItems,
            totalPages: totalPages,
            currentPage: page,
            data: posts.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal mencari data' });
    }
});

app.put('/api/posts/:id/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        const { status } = req.body;
        const updatedPost = await pool.query(
            'UPDATE posts SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        res.json({ message: 'Status berhasil diubah', data: updatedPost.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal merubah status' });
    }
});

app.put('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        
        const { nomor_keputusan, tanggal_keputusan, kategori, description, content_blocks, hyperlink } = req.body;
        
        const updatedPost = await pool.query(
            `UPDATE posts 
             SET nomor_keputusan = $1, tanggal_keputusan = $2, kategori = $3, description = $4, content_blocks = $5, hyperlink = $6
             WHERE id = $7 RETURNING *`,
            [nomor_keputusan, tanggal_keputusan, kategori || 'Umum', description, JSON.stringify(content_blocks), hyperlink, req.params.id]
        );
        
        if (updatedPost.rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan.' });
        res.json({ message: 'Data berhasil diupdate', data: updatedPost.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal mengupdate data' });
    }
});

app.delete('/api/posts/all', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        await pool.query('DELETE FROM posts');
        res.json({ message: 'Semua data berhasil dihapus' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal menghapus semua data' });
    }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
        res.json({ message: 'Data berhasil dihapus' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal menghapus data' });
    }
});

app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                c.name as kategori,
                COUNT(CASE WHEN p.status = 'published' THEN 1 END) as active_count,
                COUNT(CASE WHEN p.status != 'published' THEN 1 END) as inactive_count
            FROM categories c
            LEFT JOIN posts p ON c.name = p.kategori
            GROUP BY c.name
            ORDER BY c.name ASC
        `;
        const categories = await pool.query(query);
        res.json({ data: categories.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal mengambil kategori' });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
        const newCat = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json({ message: 'Kategori berhasil ditambahkan!', data: newCat.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Kategori sudah ada.' });
        console.error(err.message);
        res.status(500).json({ error: 'Gagal menambahkan kategori' });
    }
});

app.delete('/api/categories/:name', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        const name = req.params.name;
        const result = await pool.query('DELETE FROM categories WHERE name = $1 RETURNING *', [name]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
        }
        res.json({ message: 'Kategori berhasil dihapus!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal menghapus kategori' });
    }
});


// ==========================================
// 4. ROUTE: REGISTRASI PENGGUNA (Auth)
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        // 1. Ambil data yang dikirimkan oleh pengguna
        const { username, email, password, db } = req.body;
        const targetPool = getPool(db);

        // Validasi dasar: Pastikan semua kolom diisi
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, dan password wajib diisi!' });
        }

        // 2. Enkripsi (Hash) Password
        const saltRounds = 10; // Tingkat kerumitan enkripsi (standar industri)
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Simpan ke database
        // Kita menggunakan RETURNING agar database mengembalikan data user yang baru dibuat,
        // KECUALI password-nya (demi keamanan)
        const newUser = await targetPool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at',
            [username, email, hashedPassword]
        );

        // 4. Kirim respons berhasil
        res.status(201).json({
            message: 'Registrasi akun berhasil!',
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err.message);

        // Menangani error jika Username atau Email sudah terdaftar sebelumnya
        // (kode '23505' adalah kode error bawaan PostgreSQL untuk pelanggaran UNIQUE constraint)
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Username atau email sudah digunakan. Silakan gunakan yang lain.' });
        }

        res.status(500).json({ error: 'Terjadi kesalahan pada server saat registrasi.' });
    }
});


// ==========================================
// 4.5 HELPER & ROUTE: GENERATE CAPTCHA (Anti-Bot)
// ==========================================
function generateCaptcha() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let text = '';
    for (let i = 0; i < 5; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const width = 160;
    const height = 50;

    // Garis gangguan (noise lines)
    let lines = '';
    for (let i = 0; i < 5; i++) {
        const x1 = Math.floor(Math.random() * width);
        const y1 = Math.floor(Math.random() * height);
        const x2 = Math.floor(Math.random() * width);
        const y2 = Math.floor(Math.random() * height);
        const r = Math.floor(Math.random() * 140);
        const g = Math.floor(Math.random() * 140);
        const b = Math.floor(Math.random() * 140);
        lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(${r},${g},${b},0.35)" stroke-width="${(Math.random() * 1.5 + 1).toFixed(1)}" />`;
    }

    // Titik gangguan (noise dots)
    let dots = '';
    for (let i = 0; i < 35; i++) {
        const cx = Math.floor(Math.random() * width);
        const cy = Math.floor(Math.random() * height);
        const r = (Math.random() * 1.5 + 0.5).toFixed(1);
        dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(120,120,120,0.3)" />`;
    }

    // Karakter teks dengan rotasi dan posisi acak
    let charsSvg = '';
    const colors = ['#1e3a8a', '#047857', '#b91c1c', '#7c3aed', '#c2410c', '#0f766e', '#1d4ed8'];
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const rot = Math.floor(Math.random() * 26) - 13;
        const x = 18 + i * 27 + Math.floor(Math.random() * 4 - 2);
        const y = 35 + Math.floor(Math.random() * 6 - 3);
        const color = colors[Math.floor(Math.random() * colors.length)];
        const fontSize = Math.floor(Math.random() * 4) + 24;
        charsSvg += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="${color}" transform="rotate(${rot}, ${x}, ${y})">${char}</text>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #f3f4f6; border-radius: 6px; user-select: none; display: block;">${dots}${lines}${charsSvg}</svg>`;

    return { text, svg };
}

app.get('/api/captcha', (req, res) => {
    try {
        const { text, svg } = generateCaptcha();
        const captchaToken = jwt.sign(
            { code: text.toUpperCase() },
            process.env.JWT_SECRET || 'Sorata123*',
            { expiresIn: '5m' }
        );
        res.json({ token: captchaToken, svg: svg });
    } catch (err) {
        console.error('Error generating captcha:', err.message);
        res.status(500).json({ error: 'Gagal membuat captcha' });
    }
});

// ==========================================
// 5. ROUTE: LOGIN PENGGUNA (Auth)
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, db, captchaToken, captchaInput } = req.body;
        const targetPool = getPool(db);

        // 1. Validasi input dasar
        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password wajib diisi!' });
        }

        // 2. Validasi Captcha (Anti-Bot)
        if (!captchaToken || !captchaInput) {
            return res.status(400).json({ error: 'Kode captcha wajib diisi!' });
        }

        try {
            const decoded = jwt.verify(captchaToken, process.env.JWT_SECRET || 'Sorata123*');
            if (captchaInput.trim().toUpperCase() !== decoded.code) {
                return res.status(400).json({ error: 'Kode captcha tidak cocok. Silakan coba lagi.' });
            }
        } catch (err) {
            return res.status(400).json({ error: 'Kode captcha telah kedaluwarsa. Silakan muat ulang captcha.' });
        }

        // 2. Cari pengguna berdasarkan email di database
        const userResult = await targetPool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            // Gunakan pesan error umum demi keamanan (jangan beritahu "email tidak ditemukan")
            return res.status(401).json({ error: 'Email atau password salah.' });
        }

        const user = userResult.rows[0];

        // 3. Bandingkan password yang diinput dengan password_hash di database
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email atau password salah.' });
        }

        // 4. Generate JWT Token jika login sukses
        // Token ini menyimpan ID dan Role user. Jangan simpan data sensitif seperti password di sini!
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token akan hangus/kedaluwarsa dalam 1 jam
        );

        // 5. Kirim token ke frontend
        res.json({
            message: 'Login berhasil!',
            token: token, // Frontend akan menyimpan token ini (misal di localStorage)
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
    }
});

// ==========================================
// 6. ROUTE: MANAJEMEN USER (Admin Only)
// ==========================================

// GET: Ambil daftar semua user (khusus role 'user')
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        const targetPool = getPool(req.query.db);
        
        const users = await targetPool.query("SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC");
        res.json({ data: users.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal mengambil data pengguna.' });
    }
});

// PUT: Update data user (contoh update username dan email)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        
        const { id } = req.params;
        const { username, email, db } = req.body;
        const targetPool = getPool(db);
        
        // Kita juga bisa tambahkan fitur update password di sini jika diinginkan
        const updatedUser = await targetPool.query(
            "UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email",
            [username, email, id]
        );
        
        if (updatedUser.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan atau bukan viewer.' });
        
        res.json({ message: 'User berhasil diupdate!', data: updatedUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') return res.status(400).json({ error: 'Username atau email sudah digunakan.' });
        res.status(500).json({ error: 'Gagal mengupdate pengguna.' });
    }
});

// PUT: Reset Password User Viewer
app.put('/api/users/:id/reset-password', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        const { id } = req.params;
        const { newPassword, db } = req.body;
        const targetPool = getPool(db);

        if (!newPassword || newPassword.length < 6) {
             return res.status(400).json({ error: 'Password baru harus minimal 6 karakter.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await targetPool.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id",
            [hashedPassword, id]
        );

        if (updatedUser.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan atau bukan viewer.' });
        res.json({ message: 'Password berhasil direset!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal mereset password pengguna.' });
    }
});

// PUT: Ganti Password Profil Sendiri (Khusus Admin)
app.put('/api/profile/password', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya admin yang dapat mengubah password.' });
        
        const { currentPassword, newPassword, db } = req.body;
        const user_id = req.user.id;
        const targetPool = getPool(db);

        const userResult = await targetPool.query('SELECT password_hash FROM users WHERE id = $1', [user_id]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan.' });

        const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!isValidPassword) return res.status(401).json({ error: 'Password saat ini salah.' });

        if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await targetPool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user_id]);

        res.json({ message: 'Password berhasil diubah!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal merubah password profil.' });
    }
});

// DELETE: Hapus user
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        
        const { id } = req.params;
        const { db } = req.query; // Because DELETE request might pass db in query
        const targetPool = getPool(db);
        
        const deletedUser = await targetPool.query(
            "DELETE FROM users WHERE id = $1 RETURNING id",
            [id]
        );
        
        if (deletedUser.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan atau bukan viewer.' });
        
        res.json({ message: 'User berhasil dihapus!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal menghapus pengguna.' });
    }
});

// Menjalankan Server (hanya saat dijalankan langsung, bukan sebagai module Vercel)
if (require.main === module) {
    app.listen(port, () => {
        console.log(`🚀 Server berjalan di http://localhost:${port}`);
    });
}

// Export untuk Vercel Serverless Function
module.exports = app;