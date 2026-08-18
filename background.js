// DevWait AI - Background Service Worker

function createContextMenus() {

    chrome.contextMenus.removeAll(() => {

        chrome.contextMenus.create({
            id: "devwait-explain",
            title: "Explain with DevWait AI",
            contexts: ["selection"]
        });

        chrome.contextMenus.create({
            id: "devwait-fix",
            title: "Fix with DevWait AI",
            contexts: ["selection"]
        });

        chrome.contextMenus.create({
            id: "devwait-debug",
            title: "Debug with DevWait AI",
            contexts: ["selection"]
        });

        console.log("DevWait AI: Context menus created");
    });
}


// Create menus when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    console.log("DevWait AI: Extension installed/updated");
    createContextMenus();
});


// Create menus when Chrome starts
chrome.runtime.onStartup.addListener(() => {
    console.log("DevWait AI: Chrome started");
    createContextMenus();
});


// Create menus immediately whenever the service worker loads
createContextMenus();


// Handle right-click context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {

    console.log("DevWait AI: Context menu clicked");
    console.log("Selected text:", info.selectionText);
    console.log("Menu item:", info.menuItemId);

    // Make sure something was selected
    if (!info.selectionText) {

        console.log("DevWait AI: No selected text");

        return;
    }


    let action = "";


    // Determine which action was selected
    if (info.menuItemId === "devwait-explain") {
        action = "explain";
    }

    else if (info.menuItemId === "devwait-fix") {
        action = "fix";
    }

    else if (info.menuItemId === "devwait-debug") {
        action = "debug";
    }


    // Safety check
    if (!action) {
        console.log("DevWait AI: Unknown menu action");
        return;
    }


    console.log("DevWait AI: Action =", action);


    // Save selected text and action
    chrome.storage.local.set(
        {
            selectedText: info.selectionText,
            action: action
        },
        () => {

            if (chrome.runtime.lastError) {

                console.error(
                    "DevWait AI: Storage error:",
                    chrome.runtime.lastError.message
                );

                return;
            }


            console.log(
                "DevWait AI: Selected text saved successfully"
            );


            // Verify storage
            chrome.storage.local.get(
                ["selectedText", "action"],
                (data) => {

                    if (chrome.runtime.lastError) {

                        console.error(
                            "DevWait AI: Storage verification error:",
                            chrome.runtime.lastError.message
                        );

                        return;
                    }


                    console.log(
                        "DevWait AI: Storage verified:",
                        data
                    );


                    // Open DevWait AI
                    chrome.tabs.create({
                        url: chrome.runtime.getURL("popup.html")
                    });

                }
            );
        }
    );
});