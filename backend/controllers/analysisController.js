const { z } = require('zod');
const storageService = require('../services/storageService');
const { analyzeAndRedactText } = require('../services/aiService');

// Zod Validation Schema for incoming text submission
const scanTextSchema = z.object({
  text: z
    .string()
    .trim()
    .min(5, 'Text must be at least 5 characters long for meaningful threat analysis.')
    .max(30000, 'Text cannot exceed 30,000 characters.')
});

/**
 * @route   POST /api/analysis/scan
 * @desc    Submit text for AI threat detection & PII redaction
 * @access  Private (JWT Required)
 */
const scanText = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { text } = req.body;
    const userId = req.user.id;

    // Call Gemini AI service
    const aiResult = await analyzeAndRedactText(text);

    // Calculate metadata
    const processingTimeMs = Date.now() - startTime;
    const redactedOccurrences = (aiResult.redactedText.match(/\[REDACTED\]/g) || []).length;

    // STRICT PRIVACY COMPLIANCE:
    // Persist ONLY anonymous threat metadata, never the original or redacted content.
    const record = await storageService.createAnalysis({
      userId,
      originalLength: text.length,
      threatScore: aiResult.threatScore,
      threatType: aiResult.threatType,
      piiEntitiesCount: redactedOccurrences,
      processingTimeMs
    });

    // Return the full AI evaluation + redacted text to the authenticated client
    return res.status(200).json({
      success: true,
      data: {
        id: record._id || record.id,
        threatScore: aiResult.threatScore,
        threatType: aiResult.threatType,
        explanation: aiResult.explanation,
        redactedText: aiResult.redactedText,
        metrics: {
          originalLength: text.length,
          redactedLength: aiResult.redactedText.length,
          piiEntitiesCount: redactedOccurrences,
          processingTimeMs,
          analyzedAt: record.createdAt
        }
      },
      message: 'Text successfully analyzed and redacted.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analysis/metrics
 * @desc    Fetch aggregated threat & privacy metrics for dashboard visualization
 * @access  Private (JWT Required)
 */
const getMetrics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Retrieve user's historical scan records
    const scans = await storageService.getUserScans(userId);

    const totalScans = scans.length;

    if (totalScans === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalScans: 0,
          averageScore: 0,
          highRiskCount: 0,
          piiRedactedTotal: 0,
          threatTypeBreakdown: [],
          timeline: [],
          recentScans: []
        }
      });
    }

    // Compute key statistics
    const sumScore = scans.reduce((acc, curr) => acc + curr.threatScore, 0);
    const averageScore = Math.round(sumScore / totalScans);
    const highRiskCount = scans.filter((s) => s.threatScore >= 70).length;
    const piiRedactedTotal = scans.reduce((acc, curr) => acc + (curr.piiEntitiesCount || 0), 0);

    // Group by threatType for PieChart / BarChart
    const typeCounts = {};
    scans.forEach((scan) => {
      typeCounts[scan.threatType] = (typeCounts[scan.threatType] || 0) + 1;
    });

    const threatTypeBreakdown = Object.keys(typeCounts).map((type) => ({
      name: type,
      value: typeCounts[type]
    }));

    // Timeline data for Recharts (e.g., last 20 scans)
    const timeline = scans.slice(-20).map((scan, index) => ({
      index: index + 1,
      scanId: scan._id || scan.id,
      date: new Date(scan.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      threatScore: scan.threatScore,
      threatType: scan.threatType,
      piiCount: scan.piiEntitiesCount || 0
    }));

    // Recent 10 scans for audit table
    const recentScans = scans
      .slice(-10)
      .reverse()
      .map((s) => ({
        id: s._id || s.id,
        threatScore: s.threatScore,
        threatType: s.threatType,
        originalLength: s.originalLength,
        piiEntitiesCount: s.piiEntitiesCount || 0,
        createdAt: s.createdAt
      }));

    return res.status(200).json({
      success: true,
      data: {
        totalScans,
        averageScore,
        highRiskCount,
        piiRedactedTotal,
        threatTypeBreakdown,
        timeline,
        recentScans
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analysis/history
 * @desc    Fetch paginated scan history for the user
 * @access  Private (JWT Required)
 */
const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { items, total } = await storageService.getUserHistory(userId, skip, limit);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanText,
  getMetrics,
  getHistory,
  scanTextSchema
};
