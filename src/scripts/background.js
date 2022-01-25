// import ext from "./utils/ext";

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.action && request.action === "perform-save") {
      console.log("Extension Type: ", "/* @echo extension */");
      console.log("PERFORM AJAX", request.data);

      sendResponse({ action: "saved" });
    }
  }
);
