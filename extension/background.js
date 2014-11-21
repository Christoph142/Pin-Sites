"use strict";

(function monitorPinnedTabs(){
	chrome.tabs.query({}, function(tabs){
		for(var i in tabs){
			if(tabs[i]["pinned"]) addTab(tabs[i]);
		}
	});
})();

chrome.tabs.onReplaced.addListener(function (newId, oldId){
	if(typeof localStorage[oldId] === "undefined") return;

	addTab(newId);
	removeTab(oldId);

	console.log(oldId, "replaced by", newId);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab)
{
	if		(typeof changeInfo.pinned === "undefined") 	return;
	else if (changeInfo.pinned) 						addTab(tab);
	else 												removeTab(tab);
});

function addTab(tab){
	if(typeof localStorage[tab.id] === "undefined") localStorage[tab.id] = tab.url.split("\/")[2];

	chrome.webRequest.onBeforeRequest.addListener(function(details)
		{
			if(typeof localStorage[details.tabId] !== "undefined" && details.url.indexOf( localStorage[details.tabId] ) === -1){
				console.log(localStorage[details.tabId], "not in", details.url,". Opening in new tab.");
				chrome.tabs.create({"url":details.url});
				return { redirectUrl: "javascript:/*silently cancels this request*/" };
			}
		},
	    {urls: ["<all_urls>"], types: ["main_frame"], tabId: tab.id},
	    ["blocking"]
	);

	console.log("monitoring tab", tab.id, "with", localStorage[tab.id]);
}

function removeTab(tab){
	console.log("stopped monitoring tab", tab.id, "with", localStorage[tab.id]);
	delete localStorage[tab.id];
}