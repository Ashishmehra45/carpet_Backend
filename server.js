const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const Application = require("./models/Application");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Contact = require("./models/Contact");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://carpet-website-sigma.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Cloudinary Config (Hamesha .env use karein)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === "application/pdf";

    return {
      folder: "carpet_accelerator",
      resource_type: isPdf ? "raw" : "image",
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp','pdf'],
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const fileFields = upload.fields([
  { name: "aadharCard", maxCount: 1 },
  { name: "panCard", maxCount: 1 },
  { name: "productsImage", maxCount: 1 },
  { name: "brochure", maxCount: 1 },
  { name: "socialMediaImage", maxCount: 1 },
  { name: "otherDocs", maxCount: 1 },
]);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.log("MongoDB Connection Error: ", err));

// --- API ROUTE ---
app.post(
  "/api/applications",
  (req, res, next) => {
    fileFields(req, res, function (err) {
      if (err)
        return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      const data = req.body;
      const files = req.files;

      // Cloudinary se milne wala secure_url save karenge
      const getFileUrl = (fieldName) => {
        return files && files[fieldName] ? files[fieldName][0].path : null;
      };

      const parsedDocs = data.companyDocumentsAvailable
        ? JSON.parse(data.companyDocumentsAvailable)
        : [];
      const parsedNeeds = data.trainingNeeds
        ? JSON.parse(data.trainingNeeds)
        : [];

      const newApplication = new Application({
        ownerName: data.ownerName,
        mobileNo: data.mobileNo,
        district: data.district,
        organisationName: data.organisationName,
        orgType: data.orgType,
        exportSituation: data.exportSituation,
        productionCapacity: data.productionCapacity,
        employees: data.employees,
        // Nayi fields yahan map ho gayi
        isExporting: data.isExporting,
        exportCountries: data.exportCountries,
        workingProcess: data.workingProcess,
        valueAddedProducts: data.valueAddedProducts,
        socialMediaOrGI: data.socialMediaOrGI,
        companyDocumentsAvailable: parsedDocs,
        trainingNeeds: parsedNeeds,
        files: {
          aadharCard: getFileUrl("aadharCard"),
          panCard: getFileUrl("panCard"),
          productsImage: getFileUrl("productsImage"),
          brochure: getFileUrl("brochure"),
          socialMediaImage: getFileUrl("socialMediaImage"),
          otherDocs: getFileUrl("otherDocs"),
        },
      });

      await newApplication.save();
      res
        .status(201)
        .json({
          success: true,
          message: "Application submitted successfully!",
        });
    } catch (error) {
      console.error("Submission Error: ", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

app.get("/api/applications", async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching data" });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, number, message } = req.body;

    // Basic Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the required fields.",
      });
    }

    // New lead/query creation
    const newQuery = new Contact({
      name,
      email,
      subject,
      number,
      message,
    });

    // Database me save karein
    await newQuery.save();

    return res.status(201).json({
      success: true,
      message: "Query submitted successfully! We will get back to you soon.",
      data: newQuery,
    });
  } catch (error) {
    console.error("Backend Contact Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
