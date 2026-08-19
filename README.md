# 🤖 DevWait AI

AI-powered Chrome extension for developers.

DevWait AI helps developers understand, fix, and debug code directly from their browser using AI.

## ✨ Features

- 🔍 Explain selected code
- 🛠️ Fix coding errors
- 🐛 Debug code
- 🤖 AI-powered developer assistance
- 📋 Copy AI responses
- 📋 Copy generated code
- 🖱️ Right-click context menu
- ⚡ FastAPI backend
- 🧠 Google Gemini integration

## 🏗️ Architecture

```text
Chrome Extension
       │
       ├── Popup UI
       │
       ├── Context Menu
       │
       └── Content Script
              │
              ▼
        FastAPI Backend
              │
              ▼
        Google Gemini API
