-- 1. Membuat tabel users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Membuat tabel posts (dengan relasi ke tabel users)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    nomor_keputusan VARCHAR(255) NOT NULL,
    tanggal_keputusan DATE,
    kategori VARCHAR(255) DEFAULT 'Umum',
    description TEXT,
    content_blocks JSONB DEFAULT '[]'::jsonb,
    hyperlink VARCHAR(255),
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- 3. Membuat Index untuk mengoptimalkan fitur Search
CREATE INDEX idx_posts_nomor ON posts(nomor_keputusan);
