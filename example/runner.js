var NodeServ = require("../lib");

var instance = new NodeServ({
	bind: [ {host: "localhost", port: 9666}, {port: 1234} ],
	document_root: require('path').resolve(__dirname + "/../profile/"),
	index_files: "index.php;index.html;index.htm;welcome.htm",

	/*cgi: {
		".php": "/usr/bin/php-cgi"
	},*/
	
	fcgi: {
		".php": {
			binary: "/usr/bin/php-cgi",
			processes: 2,
			env: {
				PHP_FCGI_CHILDREN: 0,
				PHP_FCGI_MAX_REQUESTS: 10000
			}
		}
	}
});

instance.on("request_init", function(req) {
	requestlog(req);
});

function requestlog(req) {
	console.log(req.client.remoteAddress+' '+'['+req.client._idleStart+'] '+'"'+req.method+' '+req.url+' HTTP/'+req.httpVersion+'"');
}

instance.start();
