console.log("DevWait AI content script loaded");

document.addEventListener("mouseup", () => {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText) {
        chrome.storage.local.set({
            selectedText: selectedText
        });

        console.log("DevWait AI selected text:", selectedText);
    }
});