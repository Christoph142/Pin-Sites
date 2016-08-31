"use strict";

var tabStorage = {};

(function monitorPinnedTabs(){
	chrome.tabs.query({}, function(tabs){
		for(var i in tabs){
			if(tabs[i]["pinned"]) addTab(tabs[i]);
		}
	});
})();

chrome.tabs.onReplaced.addListener(function (newId, oldId){
	if(newId === oldId || typeof tabStorage[oldId] === "undefined") return;

	tabStorage[newId] = tabStorage[oldId];
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
	if(typeof tabStorage[tab.id] === "undefined") tabStorage[tab.id] = tab.url.split("\/")[2];

	chrome.webRequest.onBeforeRequest.addListener(function(details)
		{
			if(typeof tabStorage[details.tabId] !== "undefined" && details.url.indexOf( tabStorage[details.tabId] ) === -1){
				console.log(tabStorage[details.tabId], "not in", details.url,". Opening in new tab.");
				chrome.tabs.create({"url":details.url, "openerTabId":details.tabId}, function(createdTab){
					chrome.webRequest.onBeforeRequest.addListener(function(createdDetails)
						{
							// back to pinned content -> back to pinned tab
							chrome.tabs.update(createdTab.openerTabId, {"url":createdDetails.url, "highlighted":true, "active":true});
							chrome.tabs.remove(createdDetails.tabId);
						},
					    {urls: [ "*://"+tabStorage[details.tabId]+"/*" ], types: ["main_frame"], tabId: createdTab.id},
					    ["blocking"]
					);
				});
				return { redirectUrl: "javascript:/*silently cancels this request*/" };
			}
		},
	    {urls: ["<all_urls>"], types: ["main_frame"], tabId: tab.id},
	    ["blocking"]
	);

	console.log("monitoring tab", tab.id, "with", tabStorage[tab.id]);
}

function removeTab(tabId){
	console.log("stopped monitoring tab", tabId, "with", tabStorage[tabId]);
	delete tabStorage[tabId];
}
