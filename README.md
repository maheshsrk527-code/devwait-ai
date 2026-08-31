# 🤖 DevWait AI

> AI-powered Chrome extension that helps developers **understand, fix, and debug code directly from the browser**.

DevWait AI is a developer-assistance Chrome extension powered by a FastAPI backend and Google Gemini. It provides AI-assisted code explanation, fixing, and debugging without requiring developers to leave their browser workflow.

---

## ✨ Features

- 🔍 **Explain Code** — understand what code does
- 🛠️ **Fix Code** — identify and correct common coding errors
- 🐛 **Debug Code** — analyze code and identify logic/runtime problems
- 🤖 **AI Developer Assistant** — send coding requests to the AI backend
- 📋 **Copy AI Response** — quickly copy generated explanations
- 📋 **Copy Generated Code** — copy suggested code
- 🖱️ **Right-Click Context Menu** — work with selected code from the browser
- ⚡ **FastAPI Backend** — lightweight Python API service
- 🧠 **Google Gemini Integration** — AI-powered code assistance
- 🔐 **API Authentication** — protected backend requests using a DevWait API key
- 🚀 **Cloud Deployment** — backend deployed on Render

---

## 🏗️ Architecture

```text
                    Developer
                        │
                        ▼
                Chrome Extension
                        │
            ┌───────────┼───────────┐
            │           │           │
        Popup UI   Content Script  Context Menu
            │           │           │
            └───────────┼───────────┘
                        │
                        ▼
               FastAPI Backend
                        │
                 Authentication
                        │
                 Request Validation
                        │
                        ▼
                Google Gemini API
                        │
                        ▼
                   AI Response
                        │
                        ▼
                Chrome Extension
