var NodeServ = require("./lib"),
	http = require("http"),
	crypto = require("crypto");

var requestCount = 10000;

var requestsDone = 0;
var invalidResponses = 0;
var startTime = new Date().getTime(); 
var total = 0;

var host = "127.0.0.1";
var port = 9666;
//var port = 80;

var instance = new NodeServ({
	bind: [ {host: host, port: port } ],
	document_root: __dirname + "/profile/",
	index_files: "index.php;index.html;index.htm;welcome.htm",
	
	fcgi: {
		".php": {
			binary: "/usr/bin/php-cgi",
			processes: 1,
			env: {
				PHP_FCGI_CHILDREN: 3,
				PHP_FCGI_MAX_REQUESTS: 100000
			}
		}
	},

	vhosts: {
		"localhost": {
			document_root: __dirname + "/profile/localhost"
		}
	}
});

var interval = null;
var reportProgress = function() {
	var elapsedTime = new Date().getTime() - startTime;
	var seconds = elapsedTime / 1000;
	console.log("elapsed time: " + seconds + " seconds. Requests per second: " + Math.round(requestsDone / seconds) + ". Total responses: " + requestsDone + ". Invalid responses: " + invalidResponses);
	
	if((requestsDone + invalidResponses) == requestCount) {
		clearTimeout(interval);
		instance.stop();
	}
};

var startProfiling = function() {
	interval = setInterval(reportProgress, 1000);
	
	http.getAgent({host: host, port: port}).maxSockets = 500;
	for(var i = 0; i < requestCount; i++)
		profile();
};

var profile = function() {
	var hash = crypto.createHash("md5");
	hash.update(new Date().getTime() + Math.random() + "");
	var val = hash.digest("hex");

	var req = http.request({
		host: host,
		port: port,
		path: "/profile.php?val=" + val,
		method: "GET"
	}, function(res) {
		var result = "";
		res.on("data", function(chunk) {
			result += chunk.toString();
		});
		res.on("end", function() {
			if(result === val)
				requestsDone++;
			else {
				console.log("expected " + val + " and got " + result + " instead.");
				invalidResponses++;
			}
		});
	});
	req.on("error", function() { console.log("ohdear."); invalidResponses++; });
	req.end();
};

instance.start(startProfiling);

