define(['gamepad'], function(Gamepad) {
	var scope = function(){
		this.player = {
			left: 0,
			right: 0,
			up: 0,
			down: 0,
			dash: 0,
			start: 0,
			select: 0,
			attack: 0,
			special: 0,
			block: 0,
			jump: 0
		};
		this.playerPrev = {
			left: 0,
			right: 0,
			up: 0,
			down: 0,
			dash: 0,
			start: 0,
			select: 0,
			attack: 0,
			special: 0,
			block: 0,
			jump: 0
		};
		this.keys = {
			map: {
				left: 37,
				right: 39,
				up: 38,
				down: 40,
				dash: 16,
				menu: 13,
				attack: 90,
				special: 88,
				guard: 67,
				jump: 38
			},
			keys: ['left','right','up','down','dash','menu','attack','special','guard','jump'],
			down: [],
			held: [],
			char: []
		};
		this.pad = {
			plugin: Gamepad,
			connected: false,
			state: null
		},
		this.update = function(delta) {
			var s = this.pad.plugin.getStates().filter(function(e,i,a){return typeof e !== 'undefined';});
			if (s.length > 0) {
				this.pad.connected = true;
				// Grab the controller state.
				this.pad.state = s[0];
				// Deadzone cancelling.
				if (this.pad.state.leftStickX * this.pad.state.leftStickX + this.pad.state.leftStickY * this.pad.state.leftStickY < this.pad.state.deadZoneLeftStick * this.pad.state.deadZoneLeftStick) this.pad.state.leftStickX = this.pad.state.leftStickY = 0;
				if (this.pad.state.rightStickX * this.pad.state.rightStickX + this.pad.state.rightStickY * this.pad.state.rightStickY < this.pad.state.deadZonerightStick * this.pad.state.deadZonerightStick) this.pad.state.rightStickX = this.pad.state.rightStickY = 0;
			} else {
				this.pad.connected = false;
			}

			// Save old state values for deltas.
			for (var a in this.player) { this.playerPrev[a] = this.player[a]; }
			// Reset the key states.
			for (var i = 0; i < 256; i++) { this.keys.down[i] = 0; }

			this.player.left = this.keys.held[this.keys.map.left] ? (this.keys.held[this.keys.map.dash] ? 1 : 0.25) : this.pad.connected ? this.pad.state.leftStickX < 0 ? 0 - this.pad.state.leftStickX : 0 : 0;
			this.player.right = this.keys.held[this.keys.map.right] ? (this.keys.held[this.keys.map.dash] ? 1 : 0.25) : this.pad.connected ? this.pad.state.leftStickX > 0 ? this.pad.state.leftStickX : 0 : 0;
			this.player.up = this.keys.held[this.keys.map.up] ? 1 : this.pad.connected ? this.pad.state.leftStickY < 0 ? 0 - this.pad.state.leftStickY : 0 : 0;
			this.player.down = this.keys.held[this.keys.map.down] ? 1 : this.pad.connected ? this.pad.state.leftStickY > 0 ? this.pad.state.leftStickY : 0 : 0;
			this.player.jump = this.keys.held[this.keys.map.jump] ? 1 : this.pad.connected ? this.pad.state.faceButton3 > 0 ? this.pad.state.faceButton3 : this.pad.state.faceButton2 > 0 ? this.pad.state.faceButton2 : 0 : 0;
			if (this.player.left && this.player.right) this.player.left = this.player.right = 0;
			if (this.player.up && this.player.down) this.player.up = this.player.down = 0;
		};
		this.redefining = -1;
		for (var i = 0; i < 256; i++) {
			this.keys.down[i] = this.keys.held[i] = false;
		}
		this.hook = function(window) {
			var scope = this;
			window.addEventListener('keydown', function(e) {
				if (scope.redefining >= 0) {
					scope.keys.map[scope.keys.keys[scope.redefining]] = e.keyCode;
					scope.redefining = -1;
				} else {
					scope.keys.down[e.keyCode] = scope.keys.held[e.keyCode] = true;
					scope.keys.char[e.keyCode] = e.keyIdentifier;
				}
				if ([116,123].indexOf(e.keyCode) == -1) {
					e.preventDefault(true);
					return false;
				}
			}, false);
			window.addEventListener('keyup', function(e) {
				scope.keys.held[e.keyCode] = false;
				if (e.keyCode == 113) { window.DEBUGHEAVY = false; window.DEBUG = !window.DEBUG; }
				if (e.keyCode == 113 && e.shiftKey) window.DEBUGHEAVY = window.DEBUG;
				e.preventDefault(true);
				return false;
			}, false);
		};
	};
	return scope;
});