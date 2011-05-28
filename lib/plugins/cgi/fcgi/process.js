var FCGIConnectionManager = require("./connection_manager"),
	fs = require("fs"),
	util = require("util"),
	events = require("events"),
	child_process = require("child_process");
	
var binding = process.binding('net'),
	socket = binding.socket,
	bind = binding.bind,
	listen = binding.listen,
	accept = binding.accept;

// Uses Node.js low level bindings to create a UNIX socket file and allow it to listen for
// connections. The file descriptor for this socket is returned so it can be passed to an FCGI
// application.
function createListeningSocket(socketFile) {
	var socketFd = socket("unix");
	var umask = process.umask(0007);

	try { fs.unlinkSync(socketFile); } catch(e) {};
	bind(socketFd, socketFile);
	listen(socketFd, 128);
	
	process.umask(umask);
	return socketFd;
};

var FCGIProcess = module.exports = function(binary, env, id) {
	var that = this, socketFd, socketFile, fcgiProcess, connectionManager;

	this.id = id;

	socketFile = "/tmp/nodeserv_fcgi." + id + ".sock";
	socketFd = createListeningSocket(socketFile);

	fcgiProcess = child_process.spawn(binary, [], {
		customFds: [socketFd, -1, -1],
		env: env
	});

	fcgiProcess.on("exit", function() {
		stopConnections();
		try { fs.unlinkSync(socketFile); } catch(e) {};
		that.emit('exit');
	});

	connectionManager = new FCGIConnectionManager(socketFile);

	var stopConnections = function() {
		if (connectionManager) {
			connectionManager.stop();
			connectionManager = null;
		}
	};

	this.stop = function() {
		stopConnections();
		if (fcgiProcess)
			fcgiProcess.kill('SIGTERM');
	};

	this.getSession = function(callback) {
		return connectionManager.getSession(callback);
	};

};
util.inherits(FCGIProcess, events.EventEmitter);
