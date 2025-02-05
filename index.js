import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from 'multer';
import path from 'path';
import processImageQuestion from './solveAlgebra.js';
const app = express();
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');  
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

app.post('/solve', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }
    console.log(`${req.file}`);
    const solution = await processImageQuestion(`${req.file.path}`)
    res.send(solution);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});