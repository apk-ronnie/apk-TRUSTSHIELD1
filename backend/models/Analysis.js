const mongoose = require('mongoose');

/**
 * Analysis Model
 * STRICT PRIVACY COMPLIANCE:
 * Under organizational privacy protocols (GDPR/HIPAA/SOC2),
 * raw and redacted textual contents are analyzed in ephemeral memory
 * and NEVER persisted to the database. Only anonymized security metrics
 * and metadata are logged.
 */
const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    originalLength: {
      type: Number,
      required: true,
      min: 1
    },
    threatScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true
    },
    threatType: {
      type: String,
      required: true,
      enum: [
        'Safe',
        'Phishing',
        'Social Engineering',
        'Data Extortion',
        'Credential Harvesting',
        'Malware Link',
        'Sensitive Data Exposure',
        'Unknown Threat'
      ],
      default: 'Safe',
      index: true
    },
    piiEntitiesCount: {
      type: Number,
      default: 0
    },
    processingTimeMs: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Analysis', analysisSchema);

