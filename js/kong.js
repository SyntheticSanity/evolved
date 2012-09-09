define(['net'], function(Net) {
	var KAPI;
	var scope;
	scope = {
		setup: function() {
			if (kongregateAPI._flashVarsString.length > 0) {
				kongregateAPI.loadAPI(function(){scope.init(true);});
			} else {
				scope.init(false);
			}
		},
		init: function(connected) {
			if (connected === true) {
				KAPI = kongregateAPI.getAPI();
				scope.api = KAPI;
				scope.onload(true);
			} else {
				scope.api = null;
				scope.onload(false);
			}
		},
		onload: function(live) {},
		getName: function() {

		},
		api: {},
		live: false
	};
	return scope;
});