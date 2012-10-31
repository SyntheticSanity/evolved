require(['three', 'controls', 'player', 'renderer', 'globals', 'sat', 'kong', 'character', 'billboard', 'perf'], function(THREE, Controls, Player, Renderer, globals, SAT, Kong, Character, TextBillboard, Perf) {
	var clock = new THREE.Clock();
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(55, globals.view.aspect, 0.01, 100);
	var maps = {};
	var meshes = {};
	var tc = document.createElement('canvas');
	var tg = tc.getContext('2d');
	var ts;
	var bc = document.createElement('canvas');
	var bg = bc.getContext('2d');
	var loader = new THREE.JSONLoader();

	var players = {};
	var socket = null;
	var sentPackets = 0;
	var recvPackets = 0;
	var lastPackets = Date.now();
	var packetParticles = [];

	var connect = function() {

		socket = io.connect('http://nfd.ath.cx/');

		socket.on('connect', function() {
			socket.emit('update', {
				fTime: Date.now(),
				name: players.self.name,
				uid: players.self.uid,
				player: {
					position: { x: players.self.position.x, y: players.self.position.y },
					velocity: { x: players.self.velocity.x, y: players.self.velocity.y },
					controls: players.self.controls.player,
					animation: players.self.character.animation,
					name: players.self.name,
					uid: players.self.uid,
					state: {
						wallLeft: players.self.wallLeft,
						wallRight: players.self.wallRight,
						onFloor: players.self.onFloor,
						falling: players.self.falling,
						running: players.self.running,
						dashing: players.self.dashing,
						wallJumping: players.self.wallJumping,
						jumping: players.self.jumping
					}
				}
			});
		});
		socket.on('disconnect', function() {
			for (var p in players) {
				if (p != 'self' && players.hasOwnProperty(p)) {
					players[p].remove(scene);
				}
			}
			players = {self: players.self};
			if (confirm('Server disconnected. Reconnect?')) {
				if (Kong.live) {
					//players.self = new Player('female', Kong.api.services.getUsername(), Kong.api.services.getUserID());
					connect();
					sentPackets++;
					socket.on('connect', function() {
						socket.emit('ident', { gid: 'evolved', name: players.self.name, uid: players.self.uid });
					});
				} else {
					//var n = prompt('What is your name?') || 'Nobody' + Date.now() % 1000;
					//players.self = new Player('female',  n, Date.now());
					connect();
					sentPackets++;
					socket.on('connect', function() {
						socket.emit('ident', { gid: 'evolved', name: players.self.name, uid: players.self.uid });
					});
				}
			}
			//window.location = window.location + '';
		});
		socket.on('player', function(data) {
			// console.log(xDelta);
			if (typeof data.uid == 'string') data.uid *= 1;
			if (data.uid != players.self.uid) {
				var a;
				if (typeof players[data.uid] === 'undefined') {
					players[data.uid] = new Player('female', data.name, data.uid);
					players[data.uid].setup(scene);
				}
				if (typeof data.player.position !== 'undefined' && typeof data.player.velocity !== 'undefined') {
					//var d = (Date.now() - data.rTime) / 2000;
					players[data.uid].position.x = data.player.position.x;// + data.player.velocity.x * xDelta;
					players[data.uid].position.y = data.player.position.y;// + data.player.velocity.y * xDelta;
					players[data.uid].velocity.x = data.player.velocity.x;
					players[data.uid].velocity.y = data.player.velocity.y;
				}
				if (typeof data.player.controls !== 'undefined') {
					for (a in data.player.controls) {
						players[data.uid].controls.playerPrev[a] = players[data.uid].controls.player[a];
						players[data.uid].controls.player[a] = data.player.controls[a];
					}
				}
				if (typeof data.player.state !== 'undefined') {
					for (a in data.player.state) {
						players[data.uid][a] = data.player.state[a];
					}
				}
				if (typeof data.player.name !== 'undefined') {
					players[data.uid].name = data.player.name;
				}
				if (players[data.uid].billboard.text !== players[data.uid].name) {
					players[data.uid].billboard.setText(players[data.uid].name);
				}
				if (typeof data.player.animation !== 'undefined') {
					players[data.uid].character.setAnimation(data.player.animation);
				}
				players[data.uid].networkDelta += (Date.now() - data.rTime) / 1000;
			}
		});
		socket.on('update', function(data) {
			recvPackets++;
		});
		socket.on('out', function(data) {
			recvPackets++;
			players[data.uid].remove(scene);
			delete players[data.uid];
		});
		socket.on('refresh', function(data) {
			recvPackets++;
			alert('Server has forced refresh on all clients.');
			window.location = window.location + '';
		});
		setInterval(function() {
			sentPackets++;
			socket.emit('update', {
				rTime: Date.now(),
				player: {
					position: { x: players.self.position.x, y: players.self.position.y },
					velocity: { x: players.self.velocity.x, y: players.self.velocity.y },
					controls: players.self.controls.player,
					name: players.self.name,
					uid: players.self.uid,
					animation: players.self.character.animation,
					state: {
						wallLeft: players.self.wallLeft,
						wallRight: players.self.wallRight,
						onFloor: players.self.onFloor,
						falling: players.self.falling,
						running: players.self.running,
						dashing: players.self.dashing,
						wallJumping: players.self.wallJumping,
						jumping: players.self.jumping
					}
				}
			});
		}, 25);

	};

	var lback = '3111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111114'+
				'11111111111111111111111116                  5111111116                  5111111111111111111116                    5111111'+
				'111111111111111111111116                     51111111                    511111111111111116                         51111'+
				'11111111111111111111116                       11111114                    1111111111111116                           1111'+
				'11111111111111111116                          511111114                 5111111111111116                            31111'+
				'111111111111111116                             11111111111               51111111111111                             11111'+
				'111111111111111114                             1111111116                 5111111111111                             11111'+
				'1111111111111111114                            111111116                   111111111111             314            311111'+
				'1111111111111111111                           311111111                    511111111111           3111114        31111111'+
				'11111111111111111114                          111111116                     111111111114        31111111114   31111111111'+
				'111111111111111111114             1           11111111                      111111111111      311111111111111111111111111'+
				'11111111111111111111114           1          3111111114                     1111111111114    3111111111111111111111111111'+
				'11111111111111111111111114        1          1111111111               51111111111111111114  31111111116 51111111111111111'+
				'1111111111111111111111111114      14        31111111111                 511111111111111111111111111116    511111111111111'+
				'11111111111111111111111111114    3114      3111111111114                31111111111111111111111111111      51111111111111'+
				'1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111';
	var lbdec = '2111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111113'+
				'                                                                                                                         '+
				'                                                                                                                         '+
				'                                                     3                                                                   '+
				'                                                      3                 a1                                          2    '+
				'                                                       11b                                                          4    '+
				'                 3                                                                                                       '+
				'                  3                                                                                 213            2     '+
				'                  5                           2                                                   21   13        21      '+
				'                   3                          4                                        3        21       13   211        '+
				'                    3             n                                                    5      21           111           '+
				'                     13                      2        3                                 3    2                           '+
				'                       113                   4        5               a11111             3  2                            '+
				'                          13       3        2                                             11                             '+
				'                            3    2  3      2           3                2                                                '+
				'                             1111    111111             1111111111111111                             1111111             ';
	var ldata = '311111111111111111111111111111111111   1111111111111111111111111111111111111111111111111111111111114   311111111111111114'+
				'16    5111116                                                                                      1   1               51'+
				'1       516                                                                                        1   1                1'+
				'1  51111114    3111                            1                                                   51116                1'+
				'1      5111   31116                            1                        511116                                          1'+
				'1       5111111116                             1  31111111                                                              1'+
				'1         5111111                              1  16                                                                    1'+
				'1            5116                              1  1                                                                     1'+
				'1              6                               1  1                           5111116              R817r                1'+
				'1                                              1  1                                               36   54               1'+
				'1                                 1            1  1                                              36     54              1'+
				'1                                 1            1  1                                             36       54             1'+
				'1                    1            1            1  1                   51111116                 36         54            1'+
				'1                    1            1               1                                                                     1'+
				'1         1          1            1               1                                                                     1'+
				'1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111';
	var ldeco = '21111111111111111111111111111111111b   a111111111111111111111111111111111111111111111111111111111113   211111111111111113'+
				'                                                                                                                         '+
				'                                                                                                                         '+
				'                                               n                                                    111                  '+
				'                                                                        a1111b                                           '+
				'                                                  2111111b                                                               '+
				'                                                  4                                                                      '+
				'                                                                                                                         '+
				'                                                                              a11111b              R817r                 '+
				'                                                                                                  2     3                '+
				'                                  n                                                              2       3               '+
				'                                                                                                2         3              '+
				'                     n                                                a111111b                 2           3             '+
				'     p                                                                                         4           5             '+
				'          n                                                                                                              '+
				' 111111111 1111111111 111111111111 111111111111111 111111111111111111111111111111111111111111111111111111111111111111111 ';

	window.level = {
		bgtiles: lback.split(''),
		tiles: ldata.split(''),
		bgdeco: lbdec.split(''),
		deco: ldeco.split(''),
		satobj: [],
		width: 121,
		height: 16,
		spawn: new THREE.Vector2(),
		billboards: [],
		geometry: new THREE.Geometry()
	};
	level.width = Math.floor(level.tiles.length / level.height);

	var x, y;
	for (i = 0; i < level.tiles.length; i++) {
		level.tiles[i] = level.tiles[i] == ' ' ? 0 : isNaN(level.tiles[i] * 1) ? level.tiles[i] : level.tiles[i] * 1;
		level.bgtiles[i] = level.bgtiles[i] == ' ' ? 0 : isNaN(level.bgtiles[i] * 1) ? level.bgtiles[i] : level.bgtiles[i] * 1;
		switch (level.deco[i]) {
			case ' ':
				level.deco[i] = [0];
				break;
			case 'a':
				level.deco[i] = [1,4];
				break;
			case 'b':
				level.deco[i] = [1,5];
				break;
			case 'p':
				level.deco[i] = [0];
				level.spawn.x = i%level.width;
				level.spawn.y = level.height - Math.round(i/level.width);
				break;
			case 'n':
				level.deco[i] = [1,4,5];
				break;
			case 'r':
				level.deco[i] = ['r'];
				break;
			case 'R':
				level.deco[i] = ['R'];
				break;
			default:
				level.deco[i] = [level.deco[i] * 1];
		}
		switch (level.bgdeco[i]) {
			case ' ':
				level.bgdeco[i] = [0];
				break;
			case 'a':
				level.bgdeco[i] = [1,4];
				break;
			case 'b':
				level.bgdeco[i] = [1,5];
				break;
			case 'n':
				level.bgdeco[i] = [1,4,5];
				break;
			case 'r':
				level.bgdeco[i] = ['r'];
				break;
			case 'R':
				level.bgdeco[i] = ['R'];
				break;
			default:
				level.bgdeco[i] = [level.bgdeco[i] * 1];
		}
		//level.deco[i] = level.deco[i] == ' ' ? 0 : level.deco[i] * 1;
		x = i % level.width;
		y = level.height - Math.floor(i / level.width) - 1;
		switch (level.tiles[i]) {
			case 0:
				// Air
				level.satobj[i] = null;
				break;
			case 3: // Slope NE
				level.satobj[i] = [
					{x: 0.5+x,y:-0.5+y},
					{x: 0.5+x,y: 0.5+y},
					{x:-0.5+x,y:-0.5+y}
				];
				break;
			case 4: // Slope NW
				level.satobj[i] = [
					{x: 0.5+x,y:-0.5+y},
					{x:-0.5+x,y: 0.5+y},
					{x:-0.5+x,y:-0.5+y}
				];
				break;
			case 6: // Slope SE
				level.satobj[i] = [
					{x: 0.5+x,y: 0.5+y},
					{x:-0.5+x,y: 0.5+y},
					{x:-0.5+x,y:-0.5+y}
				];
				break;
			case 5: // Slope SW
				level.satobj[i] = [
					{x: 0.5+x,y: 0.5+y},
					{x:-0.5+x,y: 0.5+y},
					{x: 0.5+x,y:-0.5+y}
				];
				break;
			case 8: // Curved A
				level.satobj[i] = [
					{x: 0.5+x,y: 0.5+y},
					{x: 0.0+x,y: 0.38+y},
					{x:-0.5+x,y: 0.22+y},
					{x:-0.5+x,y:-0.5+y},
					{x: 0.5+x,y:-0.5+y}
				];
				break;
			case 7: // Curved B
				level.satobj[i] = [
					{x:-0.5+x,y:-0.5+y},
					{x: 0.5+x,y:-0.5+y},
					{x: 0.5+x,y: 0.22+y},
					{x: 0.0+x,y: 0.38+y},
					{x:-0.5+x,y: 0.5+y}
				];
				break;
			case 'R': // Curved C
				level.satobj[i] = [
					{x: 0.5+x,y: 0.22+y},
					{x: 0.0+x,y:-0.1+y},
					{x:-0.5+x,y:-0.5+y},
					{x: 0.5+x,y:-0.5+y}
				];
				break;
			case 'r': // Curved D
				level.satobj[i] = [
					{x:-0.5+x,y:-0.5+y},
					{x: 0.5+x,y:-0.5+y},
					{x: 0.0+x,y:-0.1+y},
					{x:-0.5+x,y: 0.22+y}
				];
				break;
			default:
				level.satobj[i] = new SAT.AABB(x,y,1,1);
		}
	}

	window.THREE = THREE;
	window.Controls = Controls;
	window.Player = Player;
	window.Renderer = Renderer;
	window.SAT = SAT;
	window.globals = globals;
	window.camera = camera;
	window.players = players;
	window.socket = socket;
	window.Perf = Perf;
	var timeMultiplier = 1;
	window.DEBUG = false;
	window.DEBUGHEAVY = false;
	window.SQRT2PI = Math.sqrt(Math.PI / 2);
	window.CUBERTPI = 1.464591887561523;

	document.body.appendChild(tc);
	tc.style.zIndex = 100000;
	tc.width = window.innerWidth;
	tc.height = window.innerHeight;
	tc.style.position = 'absolute';
	tc.style.left = '0';
	tc.style.top = '0';

	bc.width = window.innerWidth;
	bc.height = window.innerHeight;
	// tg.translate(tc.width / 2, tc.height / 2);
	// tg.scale(128, -128);
	// tg.lineWidth = 0.02;
	// ts = tg.save();

	Renderer.setup(scene, camera);
	// window.Kong = Kong;

	camera.position.set(0, 1, 5);
	camera.lookAt(scene.position);
	scene.add(camera);
	scene.add(new THREE.AmbientLight(0x888888));

	window.sun = new THREE.SpotLight(0xffffff, 1, 1000, Math.PI / 2, 1);
	sun.position.set(0,50,20);
	sun.lookAt(scene.position);
	sun.castShadow = true;
	sun.shadowDarkness = 0.6;
	sun.shadowMapWidth = 2048;
	sun.shadowMapHeight = 2048;
	sun.shadowCameraNear = 20;
	sun.shadowCameraFar = 100;
	sun.shadowBias = -0.0022;

	scene.add(sun);

	//maps.block = new THREE.ImageUtils.loadTexture('img/block.png');
	maps.grass = new THREE.ImageUtils.loadTexture('mdl/grass_block.png');
	maps.dirt = new THREE.ImageUtils.loadTexture('mdl/dirt.png');

	//var geomBox = new THREE.CubeGeometry(players.self.box.w*2, players.self.box.h*2, 0.1);
	//var matBox = new THREE.MeshPhongMaterial({map:maps.block});
	var matGrass = new THREE.MeshPhongMaterial({map:maps.grass,transparent:true,alphaTest:0.1});
	var matDirt = new THREE.MeshPhongMaterial({map:maps.dirt});
	window.matDirt2 = new THREE.MeshPhongMaterial({map:maps.dirt,ambient:0x999999});

	//meshes.ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 32), matBox);
	//meshes.ball = new THREE.Mesh(geomBox, matBox);
	//meshes.ball.castShadow = true;
	//meshes.ball.receiveShadow = true;
	//scene.add(meshes.ball);


	loader.load('mdl/grass_top.js', function(geom) {
		loadLevelModel(geom, matGrass, level.deco, [1]);
		loadLevelModel(geom, matGrass, level.bgdeco, [1], false, -1);
	});
	loader.load('mdl/grass_ramp.js', function(geom) {
		loadLevelModel(geom, matGrass, level.deco, [2]);
		loadLevelModel(geom, matGrass, level.bgdeco, [2], false, -1);
	});
	loader.load('mdl/grass_ramp2.js', function(geom) {
		loadLevelModel(geom, matGrass, level.deco, [3]);
		loadLevelModel(geom, matGrass, level.bgdeco, [3], false, -1);
	});
	loader.load('mdl/grass_edge.js', function(geom) {
		loadLevelModel(geom, matGrass, level.deco, [4]);
		loadLevelModel(geom, matGrass, level.deco, [5], true);
		loadLevelModel(geom, matGrass, level.bgdeco, [4], false, -1);
		loadLevelModel(geom, matGrass, level.bgdeco, [5], true, -1);
	});
	loader.load('mdl/grass_round_a.js', function(geom) {
		loadLevelModel(geom, matGrass, level.deco, [7]);
		loadLevelModel(geom, matGrass, level.bgdeco, [7], false, -1);
	});
	loader.load('mdl/grass_round_c.js', function(geom) {
		loadLevelModel(geom, matGrass, level.deco, [8]);
		loadLevelModel(geom, matGrass, level.bgdeco, [8], false, -1);
	});
	loader.load('mdl/grass_round_b.js', function(geom) {
		loadLevelModel(geom, matGrass, level.deco, ['r']);
		loadLevelModel(geom, matGrass, level.bgdeco, ['r'], false, -1);
	});
	loader.load('mdl/grass_round_d.js', function(geom) {
		loadLevelModel(geom, matGrass, level.deco, ['R']);
		loadLevelModel(geom, matGrass, level.bgdeco, ['R'], false, -1);
	});

	loader.load('mdl/dirt_block.js', function(geom) {
		loadLevelModel(geom, matDirt, level.tiles, [1]);
		loadLevelModel(geom, matDirt2, level.bgtiles, [1], false, -1);
	});
	loader.load('mdl/dirt_ramp.js', function(geom) {
		loadLevelModel(geom, matDirt, level.tiles, [3]);
		loadLevelModel(geom, matDirt, level.tiles, [4], true);
		loadLevelModel(geom, matDirt2, level.bgtiles, [3], false, -1);
		loadLevelModel(geom, matDirt2, level.bgtiles, [4], true, -1);
	});
	loader.load('mdl/dirt_corner.js', function(geom) {
		loadLevelModel(geom, matDirt, level.tiles, [5]);
		loadLevelModel(geom, matDirt, level.tiles, [6], true);
		loadLevelModel(geom, matDirt2, level.bgtiles, [5], false, -1);
		loadLevelModel(geom, matDirt2, level.bgtiles, [6], true, -1);
	});
	loader.load('mdl/dirt_round_a.js', function(geom) {
		loadLevelModel(geom, matDirt, level.tiles, [7]);
		loadLevelModel(geom, matDirt, level.tiles, [8], true);
		loadLevelModel(geom, matDirt2, level.bgtiles, [7], false, -1);
		loadLevelModel(geom, matDirt2, level.bgtiles, [8], true, -1);
	});
	loader.load('mdl/dirt_round_b.js', function(geom) {
		loadLevelModel(geom, matDirt, level.tiles, ['r']);
		loadLevelModel(geom, matDirt, level.tiles, ['R'], true);
		loadLevelModel(geom, matDirt2, level.bgtiles, ['r'], false, -1);
		loadLevelModel(geom, matDirt2, level.bgtiles, ['R'], true, -1);
	});
	//loader.load('mdl/box.js', function(geom) { loadLevelModel(geom, matBox, 1); });
	//loader.load('mdl/ramp.js', function(geom) { loadLevelModel(geom, matBox, 2, true); loadLevelModel(geom, matBox, 3); });

	level.billboards.push(new TextBillboard({ text: 'Use the arrow keys to move', size: 0.8, x: 5, y: 4 }));
	level.billboards.push(new TextBillboard({ text: 'and Ctrl to run.', size: 0.8, x: 5, y: 3.5 }));
	level.billboards.push(new TextBillboard({ text: 'Press UP to jump.', size: 0.8, x: 10, y: 5 }));
	level.billboards.push(new TextBillboard({ text: 'Jump in midair to use your second jump.', size: 0.8, x: 16, y: 5 }));
	level.billboards.push(new TextBillboard({ text: 'Hold jump for more air.', size: 0.8, x: 29, y: 5 }));
	level.billboards.push(new TextBillboard({ text: 'Jump against a wall and then', size: 0.8, x: 44, y: 4.5 }));
	level.billboards.push(new TextBillboard({ text: 'move away from it to walljump.', size: 0.8, x: 44, y: 4 }));

	for (var b = 0; b < level.billboards.length; b++) {
		level.billboards[b].sprite.opacity = 0;
		scene.add(level.billboards[b].sprite);
	}

	Kong.onload = function(live) {
		Kong.live = live;
		if (live) {
			players.self = new Player('female', Kong.api.services.getUsername(), Kong.api.services.getUserID());
			connect();
			socket.emit('ident', { gid: 'evolved', name: players.self.name, uid: players.self.uid });
		} else {
			var n = prompt('What is your name?') || 'Nobody' + Date.now() % 1000;
			players.self = new Player('female',  n, Date.now());
			connect();
			socket.emit('ident', { gid: 'evolved', name: players.self.name, uid: players.self.uid });
		}
		players.self.position.set(level.spawn.x, level.spawn.y);
		players.self.setup(scene);
		players.self.controls.hook(window);
		players.self.controls.update(0);
	};
	Kong.setup();

	var m, i;

	function loadLevelModel(geom,mat,data,type,flip,zoff) {
		flip = flip ? flip : false;
		zoff = zoff ? zoff : 0;
		var m, i, j, x, y;
		var g = new THREE.Geometry();
		for (y = 0; y < level.height; y++) {
			for (x = 0; x < level.width; x++) {
				j = data[x+(level.height-y-1)*level.width];
				for (i = 0; i < (j.length ? j.length : 1); i++) {
					if (type.indexOf(j.length ? j[i] : j)>-1) {
						m = new THREE.Mesh(geom, mat);
						m.position.set(x, y, zoff);
						if (flip) m.rotation.y = Math.PI;
						m.receiveShadow = true;
						m.castShadow = true;
						THREE.GeometryUtils.merge(g, m);
					}
				}
			}
		}
		m = new THREE.Mesh(g, mat);
		m.receiveShadow = true;
		m.castShadow = true;
		scene.add(m);
	}

	function loop() {
		Perf.end('loop tween');
		Perf.start('loop tween');
		Perf.start('loop');
		var delta = Math.min(0.15, clock.getDelta() * timeMultiplier);

		if (players.self !== undefined) {

			players.self.controls.update(delta);

			for (var i = 0; i < level.billboards.length; i++) {
				if (players.self.position.x > level.billboards[i].sprite.position.x + 5.5) {
					level.billboards[i].sprite.opacity = level.billboards[i].sprite.opacity > delta ? level.billboards[i].sprite.opacity - delta : 0;
				}
				if (players.self.position.x > level.billboards[i].sprite.position.x - 3 && level.billboards[i].shown === false) {
					level.billboards[i].sprite.opacity = level.billboards[i].sprite.opacity < 2 - delta ? level.billboards[i].sprite.opacity + delta : 2;
					if (level.billboards[i].sprite.opacity == 2) level.billboards[i].shown = true;
				}
			}

			for (var p in players) {
				// ts = tg.save();
				// tg.translate(500, 500);
				// tg.scale(32, 32);
				// tg.lineWidth = 1/32;
				// tg.translate(-players[p].position.x, -players[p].position.y);
				// tg.clearRect(players[p].position.x - 50, players[p].position.y - 50, 100, 100);
				// tg.fillRect(0, 0, 20, 20);
				players[p].update(level,delta,tg);
				// tg.restore(ts);
			}

			//sun.shadowBias = players.self.position.x / 2000;

			// Update the player's mesh position.
			//meshes.ball.position.set( players.self.position.x, players.self.position.y, 0);

			sun.position.set(players.self.position.x, 50 + players.self.position.y, 20);
			sun.target.position.set(players.self.position.x, players.self.position.y, 0);

			// Update the camera's position.
			//camera.position.set(players.self.position.x - players.self.velocity.x, players.self.position.y - players.self.velocity.y + 3, 15);
			camera.position.x += (players.self.position.x - camera.position.x) * delta * 6;
			camera.position.y += ((players.self.position.y + 2.25) - camera.position.y) * delta * 6;
			camera.position.z = 10;
			camera.lookAt(new THREE.Vector3(players.self.position.x, players.self.position.y, 0));
		}
		Perf.end('loop');
	}
	function draw() {
		Perf.end('draw tween');
		Perf.start('draw tween');
		Perf.start('draw');
		requestAnimationFrame(draw);
		Renderer.render(scene, camera);
		Perf.end('draw');

		tg.clearRect(0, 0, tc.width, tc.height);
		// Perf.start('Debug Draw');
		var i, h, k, p;
		for (i = 0; i < packetParticles.length; i++) {
			packetParticles[i].anim += 0.005;
			if (packetParticles[i].anim > CUBERTPI) {
				packetParticles.shift(i);
			}
		}
		if (Date.now() - lastPackets > 192) {
			if (sentPackets > 0) {
				packetParticles.push({
					count: sentPackets,
					type: 'sent',
					anim: 0.01
				});
			}
			if (recvPackets > 0) {
				packetParticles.push({
					count: recvPackets,
					type: 'recv',
					anim: 0.01
				});
			}
			sentPackets = 0;
			recvPackets = 0;
			lastPackets = Date.now();
		}
		if (DEBUGHEAVY) {
			i = 0;
			bg.textBaseline = 'top';
			bg.textAlign = 'left';
			for (var a in Perf.list) {
				bg.fillStyle = 'rgba(0,0,0,0.75)';
				bg.fillRect(4, 4+36*i, 256, 32);
				var sl = Perf.list[a].list.length > 256 ? 256 : Perf.list[a].list.length;
				for (var si = 0; si < sl; si++) {
					h = Perf.list[a].list[Perf.list[a].list.length - si - 1];
					if (a == 'draw tween') {
						bg.fillStyle = h > 13 || h < 7 ? h > 20 || h < 2 ? '#c00' : '#cc0' : '#0c0';
					} else if (a == 'loop tween') {
						bg.fillStyle = h > 13 || h < 7 ? h > 20 || h < 2 ? '#c00' : '#cc0' : '#0c0';
					} else if (a == 'Collision Samples') {
						bg.fillStyle = h > 12 ? h > 40 ? '#c00' : '#cc0' : '#0c0';
					} else {
						bg.fillStyle = h > 3 ? h > 10 ? '#c00' : '#cc0' : '#0c0';
					}
					h = h * 32 / Math.max(Perf.list[a].maximum, 5);
					bg.fillRect(4+256 - si, 4+36*i+32-h, 1, h);
				}
				bg.fillStyle = '#fff';
				bg.fillText(a, 8 + 256, 4 + 36 * i);
				if (Perf.list[a].minimum !== null && Perf.list[a].maximum !== null) {
					bg.fillText('Min: ' + Perf.list[a].minimum.toString().substr(0,5), 8 + 256, 4 + 10 + 36 * i);
					bg.fillText('Max: ' + Perf.list[a].maximum.toString().substr(0,5), 8 + 256, 4 + 20 + 36 * i);
				}

				i++;
			}
			/*
			bg.textAlign = 'center';
			bg.textBaseline = 'middle';
			for (p = packetParticles.length - 1; p >= 0; --p) {
				bg.fillStyle = (packetParticles[p].type == 'recv' ? 'rgba(51, 153, 85, ' : 'rgba(51, 85, 153, ')+Math.sin(packetParticles[p].anim*packetParticles[p].anim*packetParticles[p].anim*2)+')';

				h = packetParticles[p].type == 'recv' ? 20 : 52;
				if (packetParticles[p].type == 'recv') {
					k = i * 36 + 20 + 512 * Math.sin(packetParticles[p].anim*packetParticles[p].anim*packetParticles[p].anim);
				} else {
					k = i * 36 + 20 + 512 * (1 - Math.sin(packetParticles[p].anim*packetParticles[p].anim*packetParticles[p].anim));
				}

				bg.fillRect(h - 16, k - 8, 32, 16);
				bg.fillStyle = 'rgba(255, 255, 255, '+Math.sin(packetParticles[p].anim*packetParticles[p].anim*packetParticles[p].anim*2)+')';
				bg.fillText(packetParticles[p].count, h, k);
			}
			*/
		}
		if (DEBUG) {
			bg.shadowBlur = 3;
			bg.shadowColor = 'rgba(0,0,0,0.6)';
			bg.shadowOffsetY = 1;

			i = 0;
			bg.textBaseline = 'middle';
			for (p in players) {
				bg.textAlign = 'right';
				h = 0;
				for (k in players[p].controls.player) {
					if (players[p].controls.player[k] > 0.1) {
						h++;
						bg.fillStyle = 'rgba(255,255,255,'+players[p].controls.player[k]+')';
						bg.fillRect(tc.width - 40 * h, 8 + 40 * i, 32, 32);
						bg.textAlign = 'center';
						bg.fillStyle = '#000';
						bg.fillText(k, tc.width - 40 * h + 16, 24 + 40 * i);
					}
				}
				bg.fillStyle = '#fff';
				bg.textAlign = 'right';
				bg.shadowColor = '#000';
				bg.fillText(players[p].name, tc.width - 40 * h - 8, 24 + 40 * i);
				bg.fillText(players[p].name, tc.width - 40 * h - 8, 24 + 40 * i);
				i++;
			}
		}
		if (DEBUG) {
			bg.shadowBlur = null;
			bg.shadowColor = null;
			bg.shadowOffsetY = null;
			tg.drawImage(bc, 0, 0);
			bg.clearRect(0, 0, tc.width, tc.height);
		}
		// Perf.end('Debug Draw');
	}

	window.drawVector = function(x,y,vx,vy,s,c) {
		s = s !== undefined ? s : 1;
		x -= players.self.position.x;
		y -= players.self.position.y;
		var l = Math.sqrt(vx * vx + vy * vy);
		var px = -vy / l * 0.2;
		var py = vx / l * 0.2;
		var ld = s - 0.2 / l;
		tg.beginPath();
		tg.moveTo(x,y);
		tg.lineTo(x+vx*s,y+vy*s);
		tg.moveTo(x+vx*ld+px,y+vy*ld+py);
		tg.lineTo(x+vx*s,y+vy*s);
		tg.lineTo(x+vx*ld-px,y+vy*ld-py);
		tg.strokeStyle = c!==undefined?c:'#c00';
		tg.stroke();
	};

	Perf.start('draw tween');
	draw();
	Perf.start('loop tween');
	setInterval(loop, 16);
});