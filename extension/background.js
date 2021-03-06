"use strict";

(function monitorPinnedTabs(){
	localStorage.clear();
	
	chrome.tabs.query({}, function(tabs){
		for(var i in tabs){
			if(tabs[i]["pinned"]) addTab(tabs[i]);
		}
	});
})();

chrome.tabs.onReplaced.addListener(function (newId, oldId){
	if(newId === oldId || typeof localStorage[oldId] === "undefined") return;

	localStorage[newId] = localStorage[oldId];
	removeTab(oldId);

	console.log(oldId, "replaced by", newId);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab)
{
	if		(typeof changeInfo.pinned === "undefined") 	return;
	else if (changeInfo.pinned) 						addTab(tab);
	else 												removeTab(tabId);
});

function addTab(tab){
	if(typeof localStorage[tab.id] === "undefined") localStorage[tab.id] = tab.url.split("\/")[2];

	chrome.webRequest.onBeforeRequest.addListener(function(details)
		{
			if(typeof localStorage[details.tabId] !== "undefined" && details.url.indexOf( localStorage[details.tabId] ) === -1){
				console.log(localStorage[details.tabId], "not in", details.url,". Opening in new tab.");
				chrome.tabs.create({"url":details.url, "openerTabId":details.tabId}, function(createdTab){
					chrome.webRequest.onBeforeRequest.addListener(function(createdDetails)
						{
							// back to pinned content -> back to pinned tab
							chrome.tabs.update(createdTab.openerTabId, {"url":createdDetails.url, "highlighted":true, "active":true});
							chrome.tabs.remove(createdDetails.tabId);
						},
					    {urls: [ "*://"+localStorage[details.tabId]+"/*" ], types: ["main_frame"], tabId: createdTab.id},
					    ["blocking"]
					);
				});
				return { redirectUrl: "javascript:/*silently cancels this request*/" };
			}
		},
	    {urls: ["<all_urls>"], types: ["main_frame"], tabId: tab.id},
	    ["blocking"]
	);

	console.log("monitoring tab", tab.id, "with", localStorage[tab.id]);
}

function removeTab(tabId){
	console.log("stopped monitoring tab", tabId, "with", localStorage[tabId]);
	delete localStorage[tabId];
}
