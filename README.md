# Legal Assistant India 🏛️

A simple legal assistant using HTML, CSS, and JavaScript that provides AI-powered legal guidance for Indian citizens.

## Features
- 🌍 Multi-language support (10+ Indian languages)
- 🔍 Auto language detection
- ⚖️ IPC sections and legal analysis
- 📱 Mobile responsive
- 🚀 Simple and lightweight
- 🔒 Secure API key handling

## Tech Stack
- **HTML**: Structure and content
- **CSS**: Styling and layout
- **JavaScript**: Logic and API calls
- **Gemini AI**: Legal analysis

## Setup (Secure)

### For Development:
1. **Copy `script.template.js` to `script.js`**
2. **Replace `YOUR_API_KEY_HERE` with your actual Gemini API key**
3. **Open `index.html` in your browser**

### For Production (Netlify):
1. **Set environment variable `GEMINI_API_KEY` in Netlify dashboard**
2. **Deploy to Netlify** - the build process will automatically inject the API key

## Security
- ✅ API key is never committed to GitHub
- ✅ Uses environment variables in production
- ✅ Template file for safe development
- ✅ Build process handles key injection

## How It Works
1. User types a legal query in any Indian language
2. JavaScript detects the language and translates to English
3. AI analyzes the query and provides legal guidance with IPC sections
4. Results are displayed in a clean, organized format

## Test Queries
- Hindi: `मुझे चोरी का मामला दर्ज करना है`
- Tamil: `என் சொத்தை யாரோ ஆக்கிரமித்துள்ளனர்`
- English: `My neighbor is harassing me`

