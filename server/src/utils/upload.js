const multer = require('multer');

// Files land in memory (req.file.buffer) rather than on disk — mediaStorage.js then decides
// whether to persist them to Supabase Storage or fall back to the local /uploads folder.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image uploads are allowed'));
  },
});

module.exports = { upload };
