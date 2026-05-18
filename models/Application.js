const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Step 1: Basic Info
  ownerName: { type: String, required: true },
  mobileNo: { type: String, required: true },
  district: { type: String, required: true },

  // Step 2: Business Profile
  organisationName: { type: String },
  orgType: { type: String, required: true },
  exportSituation: { type: String, required: true },
  productionCapacity: { type: String, required: true },
  employees: { type: Number },
  workingProcess: { type: String, required: true },
  valueAddedProducts: { type: String },
  socialMediaOrGI: { type: String },
  isExporting: { type: String },
exportCountries: { type: String },

  // Step 3: Checkboxes (Arrays)
  companyDocumentsAvailable: [{ type: String }],
  trainingNeeds: [{ type: String }],

  // Files (Storing file paths from Multer)
  files: {
    aadharCard: { type: String, required: true }, // URL or path
    panCard: { type: String },
    productsImage: { type: String },
    brochure: { type: String },
    socialMediaImage: { type: String },
    otherDocs: { type: String } // PDF
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);