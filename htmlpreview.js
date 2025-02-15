(function () {
	
	var previewForm = document.getElementById('previewform');

	var url = location.search.substring(1).replace(/\/\/github\.com/, '//raw.githubusercontent.com').replace(/\/blob\//, '/'); //Get URL of the raw file
 
	var replaceAssets = function () {
		var frame, a, link, links = [], script, scripts = [], i, href, src, root, rootFavicon, favType, favRel;
		//Framesets
		if (document.querySelectorAll('frameset').length)
			return; //Don't replace CSS/JS if it's a frameset, because it will be erased by document.write()
		//Frames
		frame = document.querySelectorAll('iframe[src],frame[src]');
		for (i = 0; i < frame.length; ++i) {
			src = frame[i].src; //Get absolute URL
			if (src.indexOf('//raw.githubusercontent.com') > 0 || src.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
				frame[i].src = '//' + location.hostname + location.pathname + '?' + src; //Then rewrite URL so it can be loaded using CORS proxy
			}
		}
		//Links
		a = document.querySelectorAll('a[href]');
		for (i = 0; i < a.length; ++i) {
			href = a[i].href; //Get absolute URL
			if (href.indexOf('#') > 0) { //Check if it's an anchor
				a[i].href = '//' + location.hostname + location.pathname + location.search + '#' + a[i].hash.substring(1); //Then rewrite URL with support for empty anchor
			} else if ((href.indexOf('//raw.githubusercontent.com') > 0 || href.indexOf('//bitbucket.org') > 0) && (href.indexOf('.html') > 0 || href.indexOf('.htm') > 0)) { //Check if it's from raw.github.com or bitbucket.org and to HTML files
				a[i].href = '//' + location.hostname + location.pathname + '?' + href; //Then rewrite URL so it can be loaded using CORS proxy
			}
		}
		//Stylesheets
		link = document.querySelectorAll('link[rel=stylesheet]');
		for (i = 0; i < link.length; ++i) {
			href = link[i].href; //Get absolute URL
			if (href.indexOf('//raw.githubusercontent.com') > 0 || href.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
				links.push(fetchProxy(href, null, 0)); //Then add it to links queue and fetch using CORS proxy
			}
		}
		Promise.all(links).then(function (res) {
			for (i = 0; i < res.length; ++i) {
				loadCSS(res[i]);
			}
		});
		//Scripts
		script = document.querySelectorAll('script[type="text/htmlpreview"]');
		for (i = 0; i < script.length; ++i) {
			src = script[i].src; //Get absolute URL
			if (src.indexOf('//raw.githubusercontent.com') > 0 || src.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
				scripts.push(fetchProxy(src, null, 0)); //Then add it to scripts queue and fetch using CORS proxy
			} else {
				script[i].removeAttribute('type');
				scripts.push(script[i].innerHTML); //Add inline script to queue to eval in order
			}
		}
		Promise.all(scripts).then(function (res) {
			for (i = 0; i < res.length; ++i) {
				loadJS(res[i]);
			}
			document.dispatchEvent(new Event('DOMContentLoaded', {bubbles: true, cancelable: true})); //Dispatch DOMContentLoaded event after loading all scripts
		});
	};
 var hasFavicon = 0;
 var checkFavicon = function (fav) {
 // Replace favicon with github favicon if not found.
 root = url.replace(url.substr(url.lastIndexOf("/") + 1), "");
 rootFavicon = root + "favicon." + fav;
 var xmlhttp = new XMLHttpRequest();
 xmlhttp.open("HEAD", rootFavicon, false);
 xmlhttp.send();
 if (hasFavicon == 0) {
  if (xmlhttp.status == "404") {
   hasFavicon = 0;
   rootFavicon = "";
   favRel = "external icon";	  
   } else {
   hasFavicon = 1;
   favType = fav;
   favRel = "icon";
   }    
  }
 };
	var loadHTML = function (data) {
		if (data) {
   try {
    checkFavicon("ico");
    if (hasFavicon == 0) { checkFavicon("png"); }
   }
   catch(err) {
    console.log("gitHub favicon");    
   }
   if (hasFavicon != 1) {    
    rootFavicon = "https://github.githubassets.com/favicons/favicon.png";
    favType = "png";
   }  
   // Add <base> just after <head>, replace <script type="text/javascript"> with <script type="text/htmlpreview">, and add favicon.
   data = data.replace(/<head([^>]*)>/i, '<head$1><base href="' + url + '"><link id ="externalIcon" rel="external icon" type="image/' + favType + '" href="' + rootFavicon + '">')
    .replace(/<script(\s*src=["'][^"']*["'])?(\s*type=["'](text|application)\/javascript["'])?/gi, '<script type="text/htmlpreview"$1'); 
			setTimeout(function () {
				document.open();
				document.write(data);    
				document.close();
				replaceAssets();
			}, 10); //Delay updating document to have it cleared before
   // Reapply the rel attribute to link with favicon.   
   setTimeout(function () {
    var externalIcon = document.getElementById("externalIcon");
    externalIcon.setAttribute("rel", favRel);
   }, 1000);
		}
	};

	var loadCSS = function (data) {
		if (data) {
			var style = document.createElement('style');
			style.innerHTML = data;
			document.head.appendChild(style);
		}
	};

	var loadJS = function (data) {
		if (data) {
			var script = document.createElement('script');
			script.innerHTML = data;
			document.body.appendChild(script);
		}
	};
	
	var fetchProxy = function (url, options, i) {
		var proxy = [
			'', // try without proxy first
			'https://api.codetabs.com/v1/proxy/?quest='
		];
		return fetch(proxy[i] + url, options).then(function (res) {
			if (!res.ok) throw new Error('Cannot load ' + url + ': ' + res.status + ' ' + res.statusText);
			return res.text();
		}).catch(function (error) {
			if (i === proxy.length - 1)
				throw error;
			return fetchProxy(url, options, i + 1);
		})
	};

	if (url && url.indexOf(location.hostname) < 0)
		fetchProxy(url, null, 0).then(loadHTML).catch(function (error) {
			console.error(error);
			previewForm.style.display = 'block';
			previewForm.innerText = error;
		});
	else
		previewForm.style.display = 'block';

})()
