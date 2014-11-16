"use strict";

document.addEventListener("DOMContentLoaded", function(){
	chrome.tabs.query({currentWindow:true, active:true}, function(tabs){
		document.getElementById("match").value = localStorage[tabs[0].id];
		document.getElementById("match").addEventListener("change", function(e){
			localStorage[tabs[0].id] = e.target.value;
		}, false);
	})
});