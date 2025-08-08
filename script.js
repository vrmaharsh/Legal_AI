// API Key storage helpers (stored locally in the browser)
const STORAGE_KEY = 'gemini_api_key';
const getApiKey = () => localStorage.getItem(STORAGE_KEY) || '';
const setApiKey = (key) => localStorage.setItem(STORAGE_KEY, key.trim());
const clearApiKey = () => localStorage.removeItem(STORAGE_KEY);

// DOM Elements
const form = document.getElementById('legal-form');
const queryInput = document.getElementById('query');
const submitBtn = document.getElementById('submit-btn');
const errorDisplay = document.getElementById('error-display');
const errorText = document.getElementById('error-text');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const apiStatus = document.getElementById('api-status');
const languageSelect = document.getElementById('language');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const clearKeyBtn = document.getElementById('clear-key-btn');

// Check API key on page load
window.addEventListener('DOMContentLoaded', function() {
    const key = getApiKey();
    if (key) {
        apiStatus.innerHTML = '<div class="status-success">✅ API Key Configured - Ready to analyze legal queries</div>';
    } else {
        apiStatus.innerHTML = '<div class="status-error">⚠️ API Key Missing - Add your Gemini API key above and click Save</div>';
    }
});

// API key actions
if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
        const key = (apiKeyInput?.value || '').trim();
        if (!key) {
            showError('Please paste a valid Gemini API key');
            return;
        }
        setApiKey(key);
        hideError();
        apiStatus.innerHTML = '<div class="status-success">✅ API Key Saved - Ready to analyze legal queries</div>';
        apiKeyInput.value = '';
    });
}

if (clearKeyBtn) {
    clearKeyBtn.addEventListener('click', () => {
        clearApiKey();
        hideError();
        apiStatus.innerHTML = '<div class="status-error">⚠️ API Key Cleared - Please add your Gemini API key above</div>';
    });
}

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

// Show error
function showError(message) {
    errorText.textContent = message;
    errorDisplay.classList.remove('hidden');
}

// Hide error
function hideError() {
    errorDisplay.classList.add('hidden');
}

// Show loading
function showLoading() {
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing...';
}

// Hide loading
function hideLoading() {
    loading.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Get Legal Guidance';
}

// Display results
function displayResults(analysis) {
    const safeRelevantLaws = Array.isArray(analysis.relevantLaws) ? analysis.relevantLaws : [];
    const entities = analysis.extractedEntities && typeof analysis.extractedEntities === 'object' ? analysis.extractedEntities : { names: [], dates: [], crimes: [], locations: [] };
    const hasEntities = Object.values(entities).some(arr => Array.isArray(arr) && arr.length > 0);

    const resultsHTML = `
        <div class="results-header">
            <h2>Legal Analysis Results</h2>
        </div>
        <div class="results-content">
            <div class="result-section">
                <h3>Original Query</h3>
                <div class="original-query">${analysis.originalQuery}</div>
                ${analysis.detectedLanguage !== 'en' ? `
                    <div class="translation">
                        <strong>Detected Language:</strong> ${analysis.detectedLanguage}
                        <br><strong>Translation:</strong> ${analysis.translatedQuery}
                    </div>
                ` : ''}
            </div>
            
            <div class="result-section">
                <h3>Legal Issue Type</h3>
                <div class="issue-type">${analysis.legalIssueType || 'General Legal Query'}</div>
            </div>
            
            <div class="result-section">
                <h3>Relevant Laws & IPC Sections</h3>
                <div class="laws-list">
                    ${safeRelevantLaws.map(law => `<div class="law-item">• ${law}</div>`).join('')}
                </div>
            </div>
            
            <div class="result-section">
                <h3>Legal Explanation</h3>
                <div class="explanation">${analysis.explanation || 'No explanation available.'}</div>
            </div>
            
            <div class="result-section">
                <h3>Suggested Action</h3>
                <div class="suggested-action">${analysis.suggestedAction || 'Please consult a qualified lawyer for specific advice.'}</div>
            </div>
            
            ${hasEntities ? `
                <div class="result-section">
                    <h3>Extracted Information</h3>
                    <div class="entities-grid">
                        ${entities.names && entities.names.length > 0 ? `
                            <div class="entity-box names">
                                <h4>Names</h4>
                                <ul>${entities.names.map(name => `<li>${name}</li>`).join('')}</ul>
                            </div>
                        ` : ''}
                        ${entities.dates && entities.dates.length > 0 ? `
                            <div class="entity-box dates">
                                <h4>Dates</h4>
                                <ul>${entities.dates.map(date => `<li>${date}</li>`).join('')}</ul>
                            </div>
                        ` : ''}
                        ${entities.crimes && entities.crimes.length > 0 ? `
                            <div class="entity-box crimes">
                                <h4>Crimes/Offenses</h4>
                                <ul>${entities.crimes.map(crime => `<li>${crime}</li>`).join('')}</ul>
                            </div>
                        ` : ''}
                        ${entities.locations && entities.locations.length > 0 ? `
                            <div class="entity-box locations">
                                <h4>Locations</h4>
                                <ul>${entities.locations.map(location => `<li>${location}</li>`).join('')}</ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    results.innerHTML = resultsHTML;
    results.classList.remove('hidden');
}

// Main analysis function
async function analyzeLegalQuery(query) {
    if (!query.trim()) {
        showError('Please enter a legal query');
        return;
    }

    const API_KEY = getApiKey();
    if (!API_KEY) {
        showError('Please add your Gemini API key using the input above and click Save');
        return;
    }

    showLoading();
    hideError();
    results.classList.add('hidden');

    try {
        // Step 1: Language detection and translation
        const languageResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Analyze this text and provide language detection and translation:

Text: "${query}"

Respond in this exact JSON format:
{
    "detectedLanguage": "language_code",
    "translatedQuery": "translated_text_in_english"
}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const languageData = await languageResponse.json();
        const languageText = languageData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
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
        const selectedLanguage = (languageSelect?.value || 'auto');
        const outputLanguageInstruction = selectedLanguage && selectedLanguage !== 'auto' ? `
Write the values for "explanation" and "suggestedAction" in the language code: ${selectedLanguage}.` : 'Write all text values in English.';

        const legalResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `As an expert in Indian law, analyze this legal query:

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
- ${outputLanguageInstruction}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            })
        });

        const legalData = await legalResponse.json();
        const legalText = legalData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        let parsedLegalData;
        try {
            const cleanedLegalText = cleanJsonResponse(legalText);
            parsedLegalData = JSON.parse(cleanedLegalText);
        } catch (parseError) {
            parsedLegalData = {
                legalIssueType: "General Legal Query",
                relevantLaws: ["Please consult a lawyer for specific legal advice"],
                explanation: "Unable to parse legal analysis. Please try rephrasing your query.",
                suggestedAction: "Consult with a qualified lawyer for detailed legal advice.",
                extractedEntities: {
                    names: [],
                    dates: [],
                    crimes: [],
                    locations: []
                }
            };
        }

        // Combine results
        const analysis = {
            originalQuery: query,
            detectedLanguage: parsedLanguageData.detectedLanguage,
            translatedQuery: parsedLanguageData.translatedQuery,
            ...parsedLegalData
        };

        displayResults(analysis);

    } catch (error) {
        console.error('Error:', error);
        showError('Failed to analyze your query. Please try again.');
    } finally {
        hideLoading();
    }
}

// Form submission
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = queryInput.value.trim();
    analyzeLegalQuery(query);
});

// Clear results when typing
queryInput.addEventListener('input', function() {
    if (!results.classList.contains('hidden')) {
        results.classList.add('hidden');
    }
    hideError();
});
