const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * High-fidelity fallback heuristic analyzer used when GEMINI_API_KEY is not configured
 * or during network/service degradation. Ensures zero application downtime.
 */
function localFallbackAnalysis(inputText) {
  let redacted = inputText;
  let piiCount = 0;

  // Redact Email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  redacted = redacted.replace(emailRegex, () => {
    piiCount++;
    return '[REDACTED]';
  });

  // Redact Social Security Numbers (SSN: XXX-XX-XXXX)
  const ssnRegex = /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g;
  redacted = redacted.replace(ssnRegex, () => {
    piiCount++;
    return '[REDACTED]';
  });

  // Redact Phone numbers (international and US formats)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  redacted = redacted.replace(phoneRegex, () => {
    piiCount++;
    return '[REDACTED]';
  });

  // Redact Credit card / account numbers
  const ccRegex = /\b(?:\d{4}[- ]?){3}\d{4}\b/g;
  redacted = redacted.replace(ccRegex, () => {
    piiCount++;
    return '[REDACTED]';
  });

  // Heuristic threat score calculation
  const lower = inputText.toLowerCase();
  let score = 5;
  let threatType = 'Safe';
  const indicators = [];

  const phishingPatterns = [
    { regex: /urgent|immediately|within 24 hours|action required/i, weight: 25, reason: 'High urgency language detected' },
    { regex: /verify your account|confirm your password|log in here|update payment/i, weight: 35, reason: 'Credential verification solicitation' },
    { regex: /wire transfer|gift card|crypto|bitcoin|wallet address/i, weight: 30, reason: 'Suspicious financial / fund transfer request' },
    { regex: /suspended|terminated|unauthorized access|security breach/i, weight: 20, reason: 'Account penalty or security scare tactics' },
    { regex: /http[s]?:\/\/[^\s]+/i, weight: 15, reason: 'External links requiring caution' }
  ];

  for (const item of phishingPatterns) {
    if (item.regex.test(lower)) {
      score += item.weight;
      indicators.push(item.reason);
    }
  }

  if (score >= 70) {
    threatType = lower.includes('wire') || lower.includes('crypto') ? 'Data Extortion' : 'Phishing';
  } else if (score >= 40) {
    threatType = 'Social Engineering';
  } else if (piiCount > 2) {
    threatType = 'Sensitive Data Exposure';
  } else {
    threatType = 'Safe';
  }

  score = Math.min(100, Math.max(0, score));

  const explanation = indicators.length > 0
    ? `Identified risk factors: ${indicators.join(', ')}. Analyzed via heuristic rule engine.`
    : 'No significant phishing or social engineering patterns detected. Content appears benign.';

  return {
    threatScore: score,
    threatType,
    explanation,
    redactedText: redacted
  };
}

/**
 * Primary AI Analysis Service powered by Google Gemini API
 * Strictly instructed to return structured JSON without markdown wrappers
 * 
 * @param {string} inputText - User submitted text to analyze
 * @returns {Promise<{threatScore: number, threatType: string, explanation: string, redactedText: string}>}
 */
async function analyzeAndRedactText(inputText) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback to local heuristic engine if API key is not yet configured by the user
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.warn('[AI Service] GEMINI_API_KEY is not configured. Utilizing high-fidelity local security heuristics.');
    return localFallbackAnalysis(inputText);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash or gemini-2.0-flash which supports fast JSON generation
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const prompt = `
You are an expert Cyber Threat Intelligence Engine and Privacy Redaction Specialist for TrustShield AI.
Analyze the following input text for cybersecurity threats (e.g., Phishing, Social Engineering, Data Extortion, Credential Harvesting, Malware Delivery) and redact all Personally Identifiable Information (PII).

CRITICAL OUTPUT REQUIREMENTS:
1. Return a JSON object ONLY (no markdown formatting, no backticks, no text before or after).
2. The JSON object must strictly have exactly these four fields:
   - "threatScore": An integer between 0 and 100 representing threat severity (0 = completely harmless/safe, 100 = critical threat/active attack).
   - "threatType": A string categorizing the threat. Must be one of: "Safe", "Phishing", "Social Engineering", "Data Extortion", "Credential Harvesting", "Malware Link", "Sensitive Data Exposure".
   - "explanation": A brief, professional reasoning of why this threat score and type were assigned, citing specific suspicious patterns or confirming safety.
   - "redactedText": The original text where ALL Personally Identifiable Information (PII) - specifically personal full names, email addresses, telephone numbers, and Social Security Numbers (SSNs) or identification numbers - are strictly replaced with "[REDACTED]". Keep all non-PII text, line breaks, and punctuation intact.

INPUT TEXT TO ANALYZE:
"""
${inputText}
"""
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Strip markdown code block fences if present
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(text);

    // Validate fields and structure
    const threatScore = typeof parsed.threatScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.threatScore)))
      : 0;

    const threatType = parsed.threatType || (threatScore > 50 ? 'Phishing' : 'Safe');
    const explanation = parsed.explanation || 'Analysis completed.';
    const redactedText = parsed.redactedText || inputText;

    return {
      threatScore,
      threatType,
      explanation,
      redactedText
    };
  } catch (error) {
    console.error('[AI Service Error]: Gemini API request failed:', error.message);
    // Graceful fallback so user request still succeeds with high-fidelity local analysis
    console.warn('[AI Service] Falling back to local heuristic analysis engine due to API error.');
    return localFallbackAnalysis(inputText);
  }
}

module.exports = {
  analyzeAndRedactText,
  localFallbackAnalysis
};
