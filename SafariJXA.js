ObjC.import('AppKit');

// Improved argument parser handle various input formats
function parseArguments() {
    const args = $.NSProcessInfo.processInfo.arguments;
    const parsedArgs = {};
    for (let i = 4; i < args.count; i++) {
        const arg = ObjC.unwrap(args.objectAtIndex(i)).toLowerCase(); // Convert to lowercase
        if (arg.startsWith("-")) {
            const key = arg.substring(1);
            if (key === 'opentab') {
                parsedArgs[key] = [];
                while (i + 1 < args.count && !ObjC.unwrap(args.objectAtIndex(i + 1)).startsWith("-")) {
                    i++;
                    parsedArgs[key].push(ObjC.unwrap(args.objectAtIndex(i)));
                }
            } else {
                const value = (i + 1 < args.count && !ObjC.unwrap(args.objectAtIndex(i + 1)).startsWith("-")) 
                    ? ObjC.unwrap(args.objectAtIndex(i + 1)) 
                    : true;
                parsedArgs[key] = value;
                if (value !== true) i++; // Skip the next argument if it's a value
            }
        }
    }
    return parsedArgs;
}

// display help information
function displayHelp() {
    const helpText = `
$ osascript -l JavaScript ./safariJXA.js [options] [arguments...]

DISCOVER:
    -listTabs                    List all open tabs in Safari
    -listURLs                    List the URLs of the current active tabs in all windows
    -listWindows                 List all open Safari windows
    -listPageTitles              List the titles of the current active tabs in all windows
    -listReadingList             List Safari's reading list
    -listDownloads               List current downloads in Safari
    -listExtensions              List installed Safari extensions
    -listHistory                 List Safari's browsing history

OPEN:
    -launch                      Launch Safari with a 1x1 window
    -newWindow                   Open a new Safari window with a 1x1 size
    -mailto <email>              Open the default email client with the specified email
    -sms <number>                Open the default SMS app with the specified number
    -tel <number>                Open the default phone app with the specified number
    -openTab <url1> [url2] ...   Open one or more new tabs with the specified URLs (max 25)

MANAGE:
    -closeTab <index>            Close a tab by its index or URL
    -closeWindow <index>         Close a Safari window by its index
    -closeSafari                 Quit Safari
    -reloadTab                   Reload the current active tab
    -navigateToURL <url>         Navigate the current tab to a specified URL

EXECUTE:
    -execJS <script>             Execute JavaScript in the current tab

SEARCH:
    -searchGoogle <query>        Search Google in a new tab
    -searchDDG <query>           Search DuckDuckGo in a new tab

SETTINGS:
    -disableImages               Disable image loading in Safari

HELP:
    -help                        Display this help message
    -closeWindow <index>  Close a Safari window by its index
    `;
    
    console.log(helpText);
}

// Utility check if Safari is open
function isSafariOpen() {
    const safariApp = Application('Safari');
    safariApp.includeStandardAdditions = true;
    return safariApp.running() && safariApp.windows.length > 0;
}

// Launch Safari with a 1x1 window and return details
function launchSafari() {
    try {
        const safariApp = Application('Safari');
        safariApp.includeStandardAdditions = true;

        if (safariApp.running()) {
            console.log("Safari is already running. Did you mean to open a new window? [-newWindow].");
        } else {
            safariApp.launch();
            delay(1); // Give Safari a moment to launch
            safariApp.windows[0].bounds = {x: 0, y: 0, width: 1, height: 1};

            const safariDetails = {
                name: safariApp.name(),
                version: safariApp.version(),
                windows: safariApp.windows.length
            };

            console.log(`Safari launched: ${JSON.stringify(safariDetails, null, 2)}`);
            return safariDetails;
        }
    } catch (error) {
        console.log('Error launching Safari: ' + error);
    }
}

// handle mailto protocol.
function sendMail(email) {
    try {
        const safariApp = Application('Safari');
        safariApp.includeStandardAdditions = true;
        safariApp.doShellScript(`open "mailto:${email}"`);
        console.log(`Opened mail client for: ${email}`);
    } catch (error) {
        console.log('Error handling mailto: ' + error);
    }
}

// handle sms protocol.
function sendSms(number) {
    try {
        const safariApp = Application('Safari');
        safariApp.includeStandardAdditions = true;
        safariApp.doShellScript(`open "sms:${number}"`);
        console.log(`Opened SMS app for: ${number}`);
    } catch (error) {
        console.log('Error handling sms: ' + error);
    }
}

// handle tel protocol.
function handleTel(number) {
    try {
        const safariApp = Application('Safari');
        safariApp.includeStandardAdditions = true;
        safariApp.doShellScript(`open "tel:${number}"`);
        console.log(`Opened phone app for: ${number}`);
    } catch (error) {
        console.log('Error handling tel: ' + error);
    }
}

// fetch Safari tabs using JXA.
function tabs() {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            let tabInfo = [];

            // Retrieve the current tabs in Safari.
            safariApp.windows().forEach(window => {
                window.tabs().forEach(tab => {
                    tabInfo.push({
                        url: tab.url(),
                        title: tab.name()
                    });
                });
            });

            console.log(JSON.stringify(tabInfo, null, 2));
            return tabInfo;
        } else {
            console.log("Safari is not open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error fetching tabs: ' + error);
    }
}

// get the URL of the current active tab.
function getCurrentURL() {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            const currentWindow = safariApp.windows[0];
            const currentTab = currentWindow.currentTab();
            const currentURL = currentTab.url();
            console.log(currentURL);
            return currentURL;
        } else {
            const message = "Safari is not open. Please launch Safari first.";
            console.log(message);
            return message;
        }
    } catch (error) {
        console.log('Error getting current URL: ' + error);
    }
}

// navigate the current tab to a specified URL.
function navigateToURL(url) {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            const validatedUrl = validateAndFormatURL(url);

            const currentWindow = safariApp.windows[0];
            if (currentWindow.tabs.length > 0) {
                const currentTab = currentWindow.currentTab();
                currentTab.url = validatedUrl;
                console.log(`Navigated to ${validatedUrl}`);
            } else {
                console.log("No tabs are open. Please open a tab first.");
            }
        } else {
            console.log("Safari is not open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error navigating to URL: ' + error);
    }
}

// open a new tab and navigate to a URL in Safari.
function openTab(...urls) {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            const window = safariApp.windows[0];
            const windowIndex = 0; // Using the first window by default

            let successCount = 0;
            let failureCount = 0;

            urls.forEach((url, index) => {
                if (index >= 25) {
                    console.log(`Reached maximum limit of 25 tabs. Ignoring remaining URLs.`);
                    return;
                }

                try {
                    const validatedUrl = validateAndFormatURL(url);
                    const newTab = safariApp.Tab({ url: validatedUrl });
                    window.tabs.push(newTab);
                    
                    // Check if the tab was actually created
                    if (newTab.exists()) {
                        console.log(`Opened new tab with URL: ${validatedUrl} in window ${windowIndex}`);
                        successCount++;
                    } else {
                        throw new Error("Failed to create tab");
                    }
                } catch (error) {
                    console.log(`Error opening tab for URL ${url}: ${error.message}`);
                    failureCount++;
                }
            });

            if (successCount > 0) {
                window.currentTab = window.tabs[window.tabs.length - 1];
            }

            console.log(`Summary: Successfully opened ${successCount} tab(s), failed to open ${failureCount} tab(s).`);
        } else {
            console.log("Safari is not open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error opening tab(s): ' + error);
    }
}

// validate and format a URL.
function validateAndFormatURL(url) {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    if (!urlPattern.test(url)) {
        if (!/^([a-z][a-z\d+\-.]*:)?\/\//i.test(url)) {
            // Check if the URL has a valid domain structure
            const domainPattern = /^[\da-z]+([\-\.]{1}[\da-z]+)*\.[a-z]{2,6}$/i;
            if (domainPattern.test(url)) {
                return 'https://' + url;
            } else {
                throw new Error(`Invalid URL: ${url}`);
            }
        }
    }
    return url;
}

// list all open Safari windows and their tabs.
function listWindows() {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            let windowInfo = [];

            safariApp.windows().forEach((window, index) => {
                let tabs = [];
                window.tabs().forEach(tab => {
                    tabs.push({
                        url: tab.url(),
                        title: tab.name()
                    });
                });
                windowInfo.push({
                    windowIndex: index,
                    tabs: tabs
                });
            });

            console.log(JSON.stringify(windowInfo, null, 2));
            return windowInfo;
        } else {
            console.log("No Safari windows are open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error listing windows: ' + error);
    }
}

// list all open tabs in all Safari windows.
function listTabs() {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            let allTabs = [];

            safariApp.windows().forEach(window => {
                window.tabs().forEach(tab => {
                    allTabs.push({
                        url: tab.url(),
                        title: tab.name()
                    });
                });
            });

            console.log(JSON.stringify(allTabs, null, 2));
            return allTabs;
        } else {
            console.log("Safari is not open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error listing tabs: ' + error);
    }
}

// get the URL of the current active tab in all windows.
function listURLs() {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            let urls = [];

            safariApp.windows().forEach(window => {
                const currentTab = window.currentTab();
                urls.push(currentTab.url());
            });

            console.log(JSON.stringify(urls, null, 2));
            return urls;
        } else {
            const message = "Safari is not open. Please launch Safari first.";
            console.log(message);
            return message;
        }
    } catch (error) {
        console.log('Error getting current URLs: ' + error);
    }
}

// get the page titles of the current active tabs in all windows.
function listPageTitles() {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            let titles = [];

            safariApp.windows().forEach(window => {
                const currentTab = window.currentTab();
                titles.push(currentTab.name());
            });

            console.log(JSON.stringify(titles, null, 2));
            return titles;
        } else {
            console.log("Safari is not open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error getting page titles: ' + error);
    }
}

// close a tab by index in a specific window.
function closeTab(windowIndex, tabIndex) {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            const window = safariApp.windows[windowIndex];
            window.tabs[tabIndex].close();
            console.log(`Closed tab ${tabIndex} in window ${windowIndex}.`);
        } else {
            console.log("Safari is not open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error closing tab: ' + error);
    }
}

// Placeholder for reloading the current tab.
function reloadTab() {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            const currentWindow = safariApp.windows[0];
            const currentTab = currentWindow.currentTab();
            currentTab.reload();
            console.log("Current tab reloaded.");
        } else {
            console.log("Safari is not open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error reloading tab: ' + error);
    }
}

// get the page title of the current active tab.
function getPageTitle() {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            const currentWindow = safariApp.windows[0];
            const currentTab = currentWindow.currentTab();
            const pageTitle = currentTab.name();
            console.log(`Page title: ${pageTitle}`);
            return pageTitle;
        } else {
            console.log("Safari is not open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error getting page title: ' + error);
    }
}

// get Safari's reading list.
function listReadingList() {
    try {
        const safariApp = Application('Safari');
        safariApp.includeStandardAdditions = true;

        // Access the reading list (Note: This is a placeholder; actual access may vary)
        const readingList = safariApp.documents.whose({name: "Reading List"}).tabs;

        let items = [];
        readingList.forEach(item => {
            items.push({
                title: item.name(),
                url: item.url()
            });
        });

        console.log(JSON.stringify(items, null, 2));
        return items;
    } catch (error) {
        console.log('Error getting reading list: ' + error);
    }
}


// list installed Safari extensions.
function listExtensions() {
    try {
        console.log("Function getExtensions is not yet implemented.");
    } catch (error) {
        console.log('Error getting extensions: ' + error);
    }
}

// execute commands based on the parsed arguments.
function executeCommands(commands) {
    const functionMap = {
        listtabs: listTabs,
        launch: launchSafari,
        opentab: openTab,
        mailto: sendMail,
        sms: sendSms,
        tel: handleTel,
        listurls: listURLs, // Renamed from getCurrentURLs
        closetab: closeTab,
        reloadtab: reloadTab,
        listwindows: listWindows,
        navigatetourl: navigateToURL,
        listpagetitles: listPageTitles, // Renamed from getPageTitles
        listreadinglist: listReadingList, // Renamed from getReadingList
        listdownloads: listDownloads,
        listextensions: listExtensions, // Renamed from getExtensions
        listhistory: listHistory, // Renamed from getHistory
        newwindow: openNewWindow,
        closesafari: closeSafari,
        closewindow: closeWindow
    };

    Object.keys(commands).forEach(cmd => {
        const lowerCmd = cmd.toLowerCase();
        if (functionMap.hasOwnProperty(lowerCmd)) {
            const value = commands[cmd];
            if (lowerCmd === 'opentab') {
                // Handle multiple URLs for openTab
                const urls = Array.isArray(value) ? value : [value];
                functionMap[lowerCmd](...urls);
            } else {
                functionMap[lowerCmd](value);
            }
        } else {
            console.log(`Unknown command: ${cmd}`);
        }
    });
}

// open a new Safari window with a 1x1 size.
function openNewWindow() {
    try {
        const safariApp = Application('Safari');
        safariApp.includeStandardAdditions = true;

        safariApp.Document().make(); // Open a new document (window)
        delay(1); // Allow time for the window to open

        const newWindow = safariApp.windows[0];
        newWindow.bounds = {x: 0, y: 0, width: 1, height: 1};
        newWindow.index = safariApp.windows.length; // Move to the background

        console.log("Opened a new Safari window with a 1x1 size and moved it to the background.");
    } catch (error) {
        console.log('Error opening new window: ' + error);
    }
}

// access Safari's browsing history.
function listHistory() {
    try {
        const homeDir = ObjC.unwrap($.NSHomeDirectory());
        const historyDbPath = `${homeDir}/Library/Safari/History.db`;

        if ($.NSFileManager.defaultManager.fileExistsAtPath(historyDbPath)) {
            console.log(`History database found at: ${historyDbPath}`);
            // Further processing would require SQLite access, which JXA doesn't natively support.
        } else {
            console.log("Safari history database not found.");
        }
    } catch (error) {
        console.log('Error accessing history: ' + error);
    }
}

// list files in the Downloads directory.
function listDownloads() {
    try {
        const homeDir = ObjC.unwrap($.NSHomeDirectory());
        const downloadsPath = `${homeDir}/Downloads`;

        const fileManager = $.NSFileManager.defaultManager;
        const files = ObjC.deepUnwrap(fileManager.contentsOfDirectoryAtPathError(downloadsPath, $()));

        console.log("Files in Downloads:");
        files.forEach(file => {
            console.log(file);
        });

        return files;
    } catch (error) {
        console.log('Error accessing Downloads: ' + error);
    }
}

// quit Safari
function closeSafari() {
    try {
        const safariApp = Application('Safari');
        safariApp.includeStandardAdditions = true;

        if (safariApp.running()) {
            safariApp.quit();
            console.log("Safari has been closed.");
        } else {
            console.log("Safari is not running.");
        }
    } catch (error) {
        console.log('Error closing Safari: ' + error);
    }
}

// close multiple Safari windows by their indices
function closeWindow(...windowIndices) {
    try {
        if (isSafariOpen()) {
            const safariApp = Application('Safari');
            safariApp.includeStandardAdditions = true;

            const windows = safariApp.windows;
            const totalWindows = windows.length;
            let closedWindows = 0;

            // Sort indices in descending order to avoid shifting issues when closing windows
            windowIndices.sort((a, b) => b - a);

            windowIndices.forEach((index, i) => {
                if (i >= 25) {
                    console.log(`Reached maximum limit of 25 windows. Ignoring remaining indices.`);
                    return;
                }

                if (index >= 0 && index < totalWindows) {
                    windows[index].close();
                    closedWindows++;
                    console.log(`Closed window at index ${index}.`);
                } else {
                    console.log(`Invalid window index: ${index}. Skipping.`);
                }
            });

            console.log(`Closed ${closedWindows} window(s). ${totalWindows - closedWindows} window(s) remaining.`);
        } else {
            console.log("Safari is not open. Please launch Safari first.");
        }
    } catch (error) {
        console.log('Error closing window(s): ' + error);
    }
}

// Main execute the script based on parsed arguments.
function main() {
    try {
        const commands = parseArguments();
        if (Object.keys(commands).length === 0 || commands.help) {
            displayHelp();
            return;
        }
        executeCommands(commands);
    } catch (error) {
        console.log('An error occurred: ' + error);
    }
}

// determine if the script is being run directly
function isRunningDirectly() {
    ObjC.import('Foundation');
    const mainBundle = $.NSBundle.mainBundle;
    const isRunningInOSAX = mainBundle.bundleIdentifier.js === "com.apple.ScriptEditor.id.safariJXA";
    const isRunningFromCommandLine = $.NSProcessInfo.processInfo.processName.js === "osascript";
    return isRunningInOSAX || isRunningFromCommandLine;
}

// Check if the script is being run directly or imported as a module
if (isRunningDirectly()) {
    main();
} else {
    // Export functions for import when used as a module
    this.closeTab = closeTab;
    this.closeSafari = closeSafari;
    this.sendMail = sendMail;
    this.sendSms = sendSms;
    this.handleTel = handleTel;
    this.launchSafari = launchSafari;
    this.listDownloads = listDownloads;
    this.listExtensions = listExtensions;
    this.listHistory = listHistory;
    this.listPageTitles = listPageTitles;
    this.listReadingList = listReadingList;
    this.listTabs = listTabs;
    this.listURLs = listURLs;
    this.listWindows = listWindows;
    this.navigateToURL = navigateToURL;
    this.openNewWindow = openNewWindow;
    this.openTab = openTab;
    this.reloadTab = reloadTab;
    this.closeWindow = closeWindow;
}
