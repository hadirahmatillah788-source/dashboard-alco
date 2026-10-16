const bcrypt = require('bcrypt');
const hash = '$2b$10$zrKhJRO4yvs0VKECxQiOsOiC1xFemd0e26SUB1Dav2SRzD3orW1eu';
const passwords = ['Adm1n123_GiTh', 'RahasiaSangatKuat123!', 'TerserAnda123*', 'TR345ury1*', 'admin', 'admin123'];

passwords.forEach(async p => {
    const match = await bcrypt.compare(p, hash);
    if (match) {
        console.log('MATCH FOUND:', p);
    }
});
