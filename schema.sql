-- 1. Membuat tabel users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.5 Membuat tabel categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name) VALUES ('Umum'), ('Likuiditas'), ('Suku Bunga'), ('Kredit') ON CONFLICT DO NOTHING;

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

-- 4. Insert Default Admin User (Password: admin123)
INSERT INTO users (id, username, email, password_hash, role) 
VALUES ('53eafe32-2f8f-4ad8-b5de-1c81f3509ff3', 'Superadmin', 'admin@dashboard.com', '$2b$10$Tln78TP7xoouK5fTDs7fC.AGv102oc.Omrjbc4tCpIYRiNV/BrR6m', 'admin')
ON CONFLICT (email) DO NOTHING;
