// API endpoint for the backend function
const API_ENDPOINT = '/.netlify/functions/analyze-legal';

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

// Check API status on page load
window.addEventListener('DOMContentLoaded', function() {
    apiStatus.innerHTML = '<div class="status-success">✅ Legal Assistant Ready - No API key needed!</div>';
});

// API key actions (now hidden since we don't need user API keys)
if (saveKeyBtn) {
    saveKeyBtn.style.display = 'none';
}
if (clearKeyBtn) {
    clearKeyBtn.style.display = 'none';
}
if (apiKeyInput) {
    apiKeyInput.style.display = 'none';
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
                        <strong>Detected Language:</strong> ${analysis.detectedLanguage}<br>
                        <strong>Translation:</strong> ${analysis.translatedQuery}
                    </div>
                ` : ''}
            </div>

            <div class="result-section">
                <h3>Legal Issue Type</h3>
                <span class="issue-type">${analysis.legalIssueType}</span>
            </div>

            <div class="result-section">
                <h3>Relevant Laws & IPC Sections</h3>
                ${safeRelevantLaws.map(law => `
                    <div class="law-item">${law}</div>
                `).join('')}
            </div>

            <div class="result-section">
                <h3>Legal Explanation</h3>
                <div class="explanation">${analysis.explanation}</div>
            </div>

            <div class="result-section">
                <h3>Suggested Action</h3>
                <div class="suggested-action">${analysis.suggestedAction}</div>
            </div>

            ${hasEntities ? `
                <div class="result-section">
                    <h3>Extracted Information</h3>
                    <div class="entities-grid">
                        ${Array.isArray(entities.names) && entities.names.length > 0 ? `
                            <div class="entity-box names">
                                <h4>Names</h4>
                                <ul>
                                    ${entities.names.map(name => `<li>${name}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${Array.isArray(entities.dates) && entities.dates.length > 0 ? `
                            <div class="entity-box dates">
                                <h4>Dates</h4>
                                <ul>
                                    ${entities.dates.map(date => `<li>${date}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${Array.isArray(entities.crimes) && entities.crimes.length > 0 ? `
                            <div class="entity-box crimes">
                                <h4>Crimes/Offenses</h4>
                                <ul>
                                    ${entities.crimes.map(crime => `<li>${crime}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${Array.isArray(entities.locations) && entities.locations.length > 0 ? `
                            <div class="entity-box locations">
                                <h4>Locations</h4>
                                <ul>
                                    ${entities.locations.map(location => `<li>${location}</li>`).join('')}
                                </ul>
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

    showLoading();
    hideError();
    results.classList.add('hidden');

    try {
        const selectedLanguage = (languageSelect?.value || 'auto');
        
        // Call our backend API
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                selectedLanguage: selectedLanguage
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Analysis failed');
        }

        // Display the results
        displayResults(result.data.legalAnalysis);
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Analysis failed: ${error.message}`);
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
