const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse the request body
    const { query, selectedLanguage = 'auto' } = JSON.parse(event.body);

    if (!query || !query.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query is required' })
      };
    }

    // Step 1: Language detection and translation
    const languageModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const languagePrompt = `Analyze this text and provide language detection and translation:

Text: "${query}"

Respond in this exact JSON format:
{
    "detectedLanguage": "language_code",
    "translatedQuery": "translated_text_in_english"
}`;

    const languageResult = await languageModel.generateContent(languagePrompt);
    const languageText = languageResult.response.text();
    
    let parsedLanguageData;
    try {
      const cleanedLanguageText = cleanJsonResponse(languageText);
      parsedLanguageData = JSON.parse(cleanedLanguageText);
    } catch (parseError) {
      parsedLanguageData = {
        detectedLanguage: 'en',
        translatedQuery: query
      };
    }

    // Step 2: Legal analysis
    const outputLanguageInstruction = selectedLanguage && selectedLanguage !== 'auto' ? 
      `Write the values for "explanation" and "suggestedAction" in the language code: ${selectedLanguage}.` : 
      'Write all text values in English.';

    const legalPrompt = `As an expert in Indian law, analyze this legal query:

Query: "${parsedLanguageData.translatedQuery}"

Provide comprehensive analysis in this exact JSON format:
{
    "legalIssueType": "type of legal issue",
    "relevantLaws": ["list of relevant Indian laws, IPC sections, acts"],
    "explanation": "detailed explanation of relevant laws",
    "suggestedAction": "practical advice on next steps",
    "extractedEntities": {
        "names": ["person names if any"],
        "dates": ["dates if any"],
        "crimes": ["crimes/offenses if any"],
        "locations": ["locations if any"]
    }
}

Focus on Indian Penal Code (IPC) sections, Constitutional provisions, and practical legal advice.

Important:
- Return only valid JSON with the exact keys above.
- Do not include code fences or extra commentary.
- ${outputLanguageInstruction}`;

    const legalResult = await languageModel.generateContent(legalPrompt);
    const legalText = legalResult.response.text();
    
    let parsedLegalData;
    try {
      const cleanedLegalText = cleanJsonResponse(legalText);
      parsedLegalData = JSON.parse(cleanedLegalText);
    } catch (parseError) {
      throw new Error('Failed to parse legal analysis response');
    }

    // Return the combined result
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          originalQuery: query,
          languageAnalysis: parsedLanguageData,
          legalAnalysis: parsedLegalData
        }
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};

// Helper function to clean JSON response
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '');
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  
  // Extract JSON part
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned.trim();
}
