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
app.use(express.static(path.join(__dirname, 'public')));

// Fallback untuk route root '/' agar selalu mengirim index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 1. Setup Koneksi ke Database PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Tes apakah berhasil terhubung ke database
pool.connect()
    .then(() => console.log('✅ Berhasil terhubung ke database PostgreSQL!'))
    .catch((err) => console.error('❌ Gagal terhubung ke database:', err.message));

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
        const categories = await pool.query('SELECT DISTINCT kategori FROM posts WHERE kategori IS NOT NULL ORDER BY kategori ASC');
        res.json({ data: categories.rows.map(row => row.kategori) });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal mengambil kategori' });
    }
});



// ==========================================
// 4. ROUTE: REGISTRASI PENGGUNA (Auth)
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        // 1. Ambil data yang dikirimkan oleh pengguna
        const { username, email, password } = req.body;

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
        const newUser = await pool.query(
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
// 5. ROUTE: LOGIN PENGGUNA (Auth)
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validasi input dasar
        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password wajib diisi!' });
        }

        // 2. Cari pengguna berdasarkan email di database
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

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
        
        const users = await pool.query("SELECT id, username, email, role, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC");
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
        const { username, email } = req.body;
        
        // Kita juga bisa tambahkan fitur update password di sini jika diinginkan
        const updatedUser = await pool.query(
            "UPDATE users SET username = $1, email = $2 WHERE id = $3 AND role = 'user' RETURNING id, username, email",
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
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
             return res.status(400).json({ error: 'Password baru harus minimal 6 karakter.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await pool.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2 AND role = 'user' RETURNING id",
            [hashedPassword, id]
        );

        if (updatedUser.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan atau bukan viewer.' });
        res.json({ message: 'Password berhasil direset!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal mereset password pengguna.' });
    }
});

// DELETE: Hapus user
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak.' });
        
        const { id } = req.params;
        const deletedUser = await pool.query(
            "DELETE FROM users WHERE id = $1 AND role = 'user' RETURNING id",
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