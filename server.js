const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Application = require('./models/Application');

dotenv.config();

const app = express();
// CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://carpet-website-sigma.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Setup for File Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  // Limit ko 10MB se badhakar 50MB kar diya gaya hai
  limits: { fileSize: 50 * 1024 * 1024 } 
});

// Define fields expected from frontend
const fileFields = upload.fields([
  { name: 'aadharCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'productsImage', maxCount: 1 },
  { name: 'brochure', maxCount: 1 },
  { name: 'socialMediaImage', maxCount: 1 },
  { name: 'otherDocs', maxCount: 1 }
]);

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch(err => console.log("MongoDB Connection Error: ", err));

// --- API ROUTE ---
// --- API ROUTE WITH MULTER ERROR HANDLING ---
app.post('/api/applications', (req, res, next) => {
  // Pehle multer middleware run karo error pakadne ke liye
  fileFields(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Agar file size limit se zyada hai
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: "Error: File size is too large! Maximum allowed size is 50MB." });
      }
      return res.status(400).json({ success: false, message: `Upload Error: ${err.message}` });
    } else if (err) {
      // Koi unknown error aayi toh
      return res.status(500).json({ success: false, message: err.message });
    }
    
    // Agar sab theek hai, toh aage bado
    next();
  });
}, async (req, res) => {
  try {
    const data = req.body;
    const files = req.files;

    // Helper to get file path if it exists
    const getFilePath = (fieldName) => {
      return files && files[fieldName] ? `/uploads/${files[fieldName][0].filename}` : null;
    };

    // Parsing arrays (Frontend sends them as stringified JSON in FormData)
    const parsedDocs = data.companyDocumentsAvailable ? JSON.parse(data.companyDocumentsAvailable) : [];
    const parsedNeeds = data.trainingNeeds ? JSON.parse(data.trainingNeeds) : [];

    const newApplication = new Application({
      ownerName: data.ownerName,
      mobileNo: data.mobileNo,
      district: data.district,
      organisationName: data.organisationName,
      orgType: data.orgType,
      exportSituation: data.exportSituation,
      productionCapacity: data.productionCapacity,
      employees: data.employees,
      workingProcess: data.workingProcess,
      valueAddedProducts: data.valueAddedProducts,
      socialMediaOrGI: data.socialMediaOrGI,
      companyDocumentsAvailable: parsedDocs,
      trainingNeeds: parsedNeeds,
      files: {
        aadharCard: getFilePath('aadharCard'),
        panCard: getFilePath('panCard'),
        productsImage: getFilePath('productsImage'),
        brochure: getFilePath('brochure'),
        socialMediaImage: getFilePath('socialMediaImage'),
        otherDocs: getFilePath('otherDocs'),
      }
    });

    await newApplication.save();

    res.status(201).json({ 
      success: true, 
      message: "Application submitted successfully!",
      applicationId: newApplication._id
    });

  } catch (error) {
    console.error("Submission Error: ", error);
    res.status(500).json({ success: false, message: "Server error while saving data", error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});