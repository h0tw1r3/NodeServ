var FCGIProcess = require("./process");

var FCGIProcessManager = module.exports = function(binary, processCount, env) {
	var that = this,
		processes = [],
		connectionCounter = 0;

	this.stop = function() {
		processes.forEach(function(process) {
			process.stop();
		});
	};
	
	this.start = function() {
		for(var i = 0; i < processCount; i++) {
			this.spawn();
		}
	};

	this.spawn = function() {
		var p = processes[processes.length] = new FCGIProcess(binary, env, processes.length);
		p.on('exit', function() {
			processes.splice(this.id,1);
		});
	};

	this.getSession = function(callback) {
		// TODO: throttle if process is misbehaving
		if (processCount > processes.length) {
			this.spawn();
		}

		// TODO: decent load balancing. For now we're gonna do round robin.
		var process = processes[connectionCounter++ % processes.length];

		return process.getSession(callback);
	};

	this.start();
};
