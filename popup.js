// ========================================
// DevWait AI - Popup Script
// ========================================


// ========================================
// CONFIGURATION
// ========================================

const API_URL =
    "https://devwait-ai.onrender.com/ai";

// TEMPORARY TEST KEY ONLY
// DO NOT commit a real key to GitHub.
const DEVWAIT_API_KEY =
    "7fK9vQ2mX8rL4pN6sT1wZ3cH5jD0aB9eG2uY6";


// ========================================
// DOM ELEMENTS
// ========================================

const askBtn =
    document.getElementById("askBtn");

const promptInput =
    document.getElementById("prompt");

const responseBox =
    document.getElementById("response");

const status =
    document.getElementById("status");

const selectedTextBox =
    document.getElementById("selectedText");


// ========================================
// STORE ORIGINAL AI RESPONSE
// ========================================

let lastAIResponse = "";


// ========================================
// GET SELECTED TEXT
// ========================================

async function getSelectedText() {

    try {

        const data =
            await chrome.storage.local.get([
                "selectedText"
            ]);

        console.log(
            "DevWait AI: getSelectedText:",
            data
        );

        return data.selectedText || "";

    } catch (error) {

        console.error(
            "DevWait AI: Error reading selected text:",
            error
        );

        return "";
    }
}


// ========================================
// LOAD SELECTED TEXT + ACTION
// ========================================

async function loadSelectedText() {

    try {

        const data =
            await chrome.storage.local.get([
                "selectedText",
                "action"
            ]);

        console.log(
            "DevWait AI: Loaded storage:",
            data
        );

        const text =
            data.selectedText || "";

        const action =
            data.action || "";


        // ------------------------------------
        // SHOW SELECTED TEXT
        // ------------------------------------

        selectedTextBox.textContent =
            text || "No text selected.";


        // ------------------------------------
        // NO TEXT
        // ------------------------------------

        if (!text) {

            promptInput.value = "";

            return;
        }


        // ------------------------------------
        // EXPLAIN
        // ------------------------------------

        if (action === "explain") {

            promptInput.value =
                `Explain this code clearly for a developer:\n\n${text}`;
        }


        // ------------------------------------
        // FIX
        // ------------------------------------

        else if (action === "fix") {

            promptInput.value =
                `Find the errors and provide corrected code:\n\n${text}`;
        }


        // ------------------------------------
        // DEBUG
        // ------------------------------------

        else if (action === "debug") {

            promptInput.value =
                `Debug this code. Explain the root cause and provide a solution:\n\n${text}`;
        }


        // ------------------------------------
        // DEFAULT
        // ------------------------------------

        else {

            promptInput.value = text;
        }

    } catch (error) {

        console.error(
            "DevWait AI: Error loading selected text:",
            error
        );

        selectedTextBox.textContent =
            "Unable to load selected text.";

        status.textContent =
            "Error loading selected text ❌";
    }
}


// ========================================
// WATCH STORAGE CHANGES
// ========================================

chrome.storage.onChanged.addListener(
    (changes, areaName) => {

        if (areaName !== "local") {
            return;
        }

        if (changes.selectedText) {

            const newText =
                changes.selectedText.newValue || "";

            selectedTextBox.textContent =
                newText || "No text selected.";

            if (newText) {

                promptInput.value =
                    `Explain this code clearly for a developer:\n\n${newText}`;
            }
        }
    }
);


// ========================================
// FORMAT AI RESPONSE
// ========================================

function formatAIResponse(text) {

    if (!text) {
        return "";
    }

    // Escape HTML
    const escaped =
        text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    // Convert Markdown code blocks
    return escaped
        .replace(
            /```(\w+)?\n?([\s\S]*?)```/g,
            (match, language, code) => {

                const lang =
                    language || "code";

                return `
                    <div class="code-block">

                        <div class="code-header">

                            <span>${lang}</span>

                            <button
                                class="copy-block-btn"
                                data-code="${encodeURIComponent(code.trim())}"
                            >
                                📋 Copy
                            </button>

                        </div>

                        <pre><code>${code.trim()}</code></pre>

                    </div>
                `;
            }
        )
        .replace(/\n/g, "<br>");
}


// ========================================
// ASK AI
// ========================================

askBtn.addEventListener(
    "click",
    async () => {

        const prompt =
            promptInput.value.trim();


        // ------------------------------------
        // EMPTY PROMPT
        // ------------------------------------

        if (!prompt) {

            status.textContent =
                "Please enter a question.";

            return;
        }


        // ------------------------------------
        // CHECK TEST KEY
        // ------------------------------------

        if (
            !DEVWAIT_API_KEY ||
                DEVWAIT_API_KEY === "YOUR_DEVWAIT_API_KEY"

        ) {

            status.textContent =
                "DevWait API key is not configured ❌";

            responseBox.textContent =
                "Please configure your DevWait API key.";

            return;
        }


        // ------------------------------------
        // LOADING
        // ------------------------------------

        status.textContent =
            "🤖 Gemini is thinking...";

        responseBox.innerHTML = "";

        askBtn.disabled = true;


        try {

            // --------------------------------
            // CALL RENDER BACKEND
            // --------------------------------

            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "X-DevWait-Key":
                                DEVWAIT_API_KEY
                        },

                        body: JSON.stringify({
                            prompt: prompt
                        })
                    }
                );


            // --------------------------------
            // READ RESPONSE
            // --------------------------------

            let data = {};

            try {

                data =
                    await response.json();

            } catch (jsonError) {

                data = {};
            }


            // --------------------------------
            // AUTH ERROR
            // --------------------------------

            if (response.status === 401) {

                throw new Error(
                    "Invalid or missing DevWait API key."
                );
            }


            // --------------------------------
            // GEMINI TEMPORARY ERROR
            // --------------------------------

            if (response.status === 503) {

                throw new Error(
                    "Gemini is temporarily unavailable. Please try again shortly."
                );
            }


            // --------------------------------
            // OTHER API ERROR
            // --------------------------------

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    `API request failed (${response.status})`
                );
            }


            // --------------------------------
            // SAVE ORIGINAL RESPONSE
            // --------------------------------

            lastAIResponse =
                data.response || "";


            // --------------------------------
            // EMPTY AI RESPONSE
            // --------------------------------

            if (!lastAIResponse) {

                throw new Error(
                    "AI returned an empty response."
                );
            }


            // --------------------------------
            // DISPLAY RESPONSE
            // --------------------------------

            responseBox.innerHTML =
                formatAIResponse(
                    lastAIResponse
                );


            status.textContent =
                "Done ✅";

        } catch (error) {

            console.error(
                "DevWait AI:",
                error
            );


            status.textContent =
                "Request failed ❌";


            responseBox.textContent =
                "🔴 " +
                error.message;

        } finally {

            askBtn.disabled =
                false;
        }
    }
);


// ========================================
// EXPLAIN BUTTON
// ========================================

document
    .getElementById("explainBtn")
    .addEventListener(
        "click",
        async () => {

            const text =
                await getSelectedText();


            if (!text) {

                status.textContent =
                    "Please select some code first.";

                return;
            }


            promptInput.value =
                `Explain this code clearly for a developer:\n\n${text}`;


            status.textContent =
                "Explain prompt ready.";
        }
    );


// ========================================
// FIX BUTTON
// ========================================

document
    .getElementById("fixBtn")
    .addEventListener(
        "click",
        async () => {

            const text =
                await getSelectedText();


            if (!text) {

                status.textContent =
                    "Please select some code first.";

                return;
            }


            promptInput.value =
                `Find the errors and provide corrected code:\n\n${text}`;


            status.textContent =
                "Fix prompt ready.";
        }
    );


// ========================================
// DEBUG BUTTON
// ========================================

document
    .getElementById("debugBtn")
    .addEventListener(
        "click",
        async () => {

            const text =
                await getSelectedText();


            if (!text) {

                status.textContent =
                    "Please select some code first.";

                return;
            }


            promptInput.value =
                `Debug this code. Explain the root cause and provide a solution:\n\n${text}`;


            status.textContent =
                "Debug prompt ready.";
        }
    );


// ========================================
// COPY COMPLETE AI RESPONSE
// ========================================

document
    .getElementById("copyBtn")
    .addEventListener(
        "click",
        async () => {

            const response =
                responseBox.textContent.trim();


            if (!response) {

                status.textContent =
                    "Nothing to copy.";

                return;
            }


            try {

                await navigator.clipboard.writeText(
                    response
                );


                status.textContent =
                    "Response copied ✅";

            } catch (error) {

                console.error(
                    "Copy response error:",
                    error
                );

                status.textContent =
                    "Copy failed ❌";
            }
        }
    );


// ========================================
// COPY CODE ONLY
// ========================================

const copyCodeBtn =
    document.getElementById("copyCodeBtn");


if (copyCodeBtn) {

    copyCodeBtn.addEventListener(
        "click",
        async () => {

            if (!lastAIResponse) {

                status.textContent =
                    "Nothing to copy.";

                return;
            }


            const codeBlocks =
                lastAIResponse.match(
                    /```(?:\w+)?\s*([\s\S]*?)```/g
                );


            if (
                !codeBlocks ||
                codeBlocks.length === 0
            ) {

                status.textContent =
                    "No code block found.";

                return;
            }


            const code =
                codeBlocks
                    .map(block =>
                        block
                            .replace(
                                /^```(?:\w+)?\s*/,
                                ""
                            )
                            .replace(
                                /```\s*$/,
                                ""
                            )
                            .trim()
                    )
                    .join("\n\n");


            try {

                await navigator.clipboard.writeText(
                    code
                );


                status.textContent =
                    "Code copied ✅";

            } catch (error) {

                console.error(
                    "Copy code error:",
                    error
                );

                status.textContent =
                    "Copy failed ❌";
            }
        }
    );
}


// ========================================
// COPY INDIVIDUAL CODE BLOCK
// ========================================

responseBox.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".copy-block-btn"
            );


        if (!button) {
            return;
        }


        try {

            const code =
                decodeURIComponent(
                    button.dataset.code
                );


            await navigator.clipboard.writeText(
                code
            );


            button.textContent =
                "✅ Copied";


            setTimeout(
                () => {

                    button.textContent =
                        "📋 Copy";

                },
                1500
            );

        } catch (error) {

            console.error(
                "Copy code block error:",
                error
            );

            status.textContent =
                "Copy failed ❌";
        }
    }
);


// ========================================
// INITIALIZE POPUP
// ========================================

loadSelectedText();