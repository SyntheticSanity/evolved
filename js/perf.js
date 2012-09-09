define(function() {

	function PerfEntry() {
		this.minimum = null;
		this.maximum = null;
		this.average = 0;
		this.logCount = 0;
		this.lastLog = 0;
		this.list = [];
		this.clock = function(t) {
			// if(this.minimum === null || t < this.minimum) {
				// this.minimum = t;
			// }
			// if(this.maximum === null || t > this.maximum) {
				// this.maximum = t;
			// }
			if (this.list.push(t) > 256) {
				this.list.shift();
			}
			this.average = this.list.reduce(function(a,b){return a+b;}) / this.list.length;
			this.minimum = this.list.reduce(function(a,b){return a<b?a:b;});
			this.maximum = this.list.reduce(function(a,b){return a>b?a:b;});
		};
	}

	window.performance = performance || {};
	performance.now = performance.now || performance.webkitNow || performance.mozNow || function() {
		return Date.now();
	};

	var scope;
	scope = {
		list: {},
		startTimes: {},
		start: function(n) {
			if (!(scope.list[n] instanceof PerfEntry)) {
				scope.list[n] = new PerfEntry();
			}
			scope.startTimes[n] = performance.now();
		},
		end: function(n) {
			scope.list[n].clock(performance.now() - scope.startTimes[n]);
		},
		log: function(n) {
			if (!(scope.list[n] instanceof PerfEntry)) {
				scope.list[n] = new PerfEntry();
			}
			scope.list[n].logCount++;
			if (scope.list[n].lastLog + 16 < performance.now()) {
				scope.list[n].clock(scope.list[n].logCount);
				scope.list[n].lastLog = performance.now();
				scope.list[n].logCount = 0;
			}
		}
	};

	return scope;
});