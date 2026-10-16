const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then(hash => console.log('NEW_HASH:', hash));
