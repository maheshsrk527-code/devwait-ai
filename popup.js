// ========================================
// DevWait AI - Popup Script
// ========================================


// ========================================
// DOM ELEMENTS
// ========================================

const askBtn = document.getElementById("askBtn");
const promptInput = document.getElementById("prompt");
const responseBox = document.getElementById("response");
const status = document.getElementById("status");
const selectedTextBox = document.getElementById("selectedText");


// Store the original AI response.
// This is important for Copy Code.
let lastAIResponse = "";


// ========================================
// GET SELECTED TEXT FROM STORAGE
// ========================================

async function getSelectedText() {

    try {

        const data = await chrome.storage.local.get([
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

        const data = await chrome.storage.local.get([
            "selectedText",
            "action"
        ]);

        console.log(
            "DevWait AI: Loaded storage:",
            data
        );


        const text = data.selectedText || "";
        const action = data.action || "";


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
// WATCH FOR STORAGE CHANGES
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


    // Escape HTML characters first
    const escaped = text
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
        // LOADING
        // ------------------------------------

        status.textContent =
            "🤖 Gemini is thinking...";


        responseBox.innerHTML = "";


        askBtn.disabled = true;


        try {

            // --------------------------------
            // CALL BACKEND
            // --------------------------------

            const response = await fetch(
                "http://127.0.0.1:8000/ai",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        prompt: prompt
                    })
                }
            );


            // --------------------------------
            // READ RESPONSE
            // --------------------------------

            const data =
                await response.json();


            // --------------------------------
            // ERROR RESPONSE
            // --------------------------------

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "API request failed"
                );
            }


            // --------------------------------
            // SAVE ORIGINAL RESPONSE
            // --------------------------------

            lastAIResponse =
                data.response || "";


            // --------------------------------
            // DISPLAY FORMATTED RESPONSE
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
        "Backend connection failed ❌";

    responseBox.textContent =
        "🔴 DevWait AI backend is not running.\n\n" +
        "Please start your FastAPI server and try again.";

} finally {

            askBtn.disabled = false;
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

            // ------------------------------
            // Make sure AI responded
            // ------------------------------

            if (!lastAIResponse) {

                status.textContent =
                    "Nothing to copy.";

                return;
            }


            // ------------------------------
            // Find Markdown code blocks
            // ------------------------------

            const codeBlocks =
                lastAIResponse.match(
                    /```(?:\w+)?\s*([\s\S]*?)```/g
                );


            if (!codeBlocks ||
                codeBlocks.length === 0) {

                status.textContent =
                    "No code block found.";

                return;
            }


            // ------------------------------
            // Extract code
            // ------------------------------

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


            // ------------------------------
            // Copy
            // ------------------------------

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