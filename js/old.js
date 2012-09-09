require(['three', 'controls', 'player', 'renderer', 'globals', 'sat'], function(THREE, Controls, Player, Renderer, globals, SAT) {
	var clock = new THREE.Clock();
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(45, globals.view.aspect, 0.1, 1000);
	var maps = {};
	var meshes = {};
	var tc = document.createElement('canvas');
	var tg = tc.getContext('2d');
	var loader = new THREE.JSONLoader();

	var level = {
		tiles: [
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 3, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1, 0, 0, 1, 3, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 2, 1, 1, 1, 1, 0, 0, 1, 1, 3, 0, 0, 0, 0, 1, 0, 0, 0, 1, 3, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 3, 0, 0, 2, 1, 0, 0, 0, 1, 1, 3, 0, 0, 0, 0,
			1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
		],
		width: 32,
		height: 8
	};

	window.THREE = THREE;
	window.Controls = Controls;
	window.Player = Player;
	window.Renderer = Renderer;
	window.SAT = SAT;
	window.globals = globals;
	window.camera = camera;

	document.body.appendChild(tc);
	tc.style.zIndex = 100000;
	Renderer.setup(scene, camera);
	/*window.kong = kongregateAPI.loadAPI(function() {
		console.log('Kongregate API loaded.');
		window.kapi = kongregateAPI.getAPI();
	});*/

	camera.position.set(0, 1, 5);
	camera.lookAt(scene.position);
	scene.add(camera);
	scene.add(new THREE.AmbientLight(0x333333));

	var sun = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 2, 1);
	sun.position.set(0,50,20);
	sun.lookAt(scene.position);
	sun.castShadow = true;
	sun.shadowDarkness = 0.6;
	sun.shadowMapWidth = 2048;
	sun.shadowMapHeight = 2048;
	sun.shadowCameraNear = 20;
	sun.shadowCameraFar = 100;
	sun.shadowBias = 0.000000001;

	scene.add(sun);

	maps.block = new THREE.ImageUtils.loadTexture('img/block.png?'+Date.now());

	var geomBox = new THREE.CubeGeometry(0.98, 0.98, 0.98);
	var matBox = new THREE.MeshLambertMaterial({map:maps.block});

	meshes.ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 32), matBox);
	meshes.ball.castShadow = true;
	meshes.ball.receiveShadow = true;
	scene.add(meshes.ball);

	loader.load('mdl/box.js', function(geom) { loadLevelModel(geom, matBox, 1); });
	loader.load('mdl/ramp.js', function(geom) { loadLevelModel(geom, matBox, 2, true); loadLevelModel(geom, matBox, 3); });

	var m, i, x, y;

	function loadLevelModel(geom,mat,type,flip) {
		flip = flip ? flip : false;
		var m, i, x, y;
		for (y = 0; y < level.height; y++) {
			for (x = 0; x < level.width; x++) {
				if (level.tiles[x+(level.height-y-1)*level.width] == type) {
					m = new THREE.Mesh(geom, mat);
					m.position.set(x, y, 0);
					if (flip) m.rotation.set(0, Math.PI, 0);
					m.receiveShadow = true;
					m.castShadow = true;
					scene.add(m);
				}
			}
		}
	}

	function loop() {
		var delta = clock.getDelta();

		Controls.update(delta);

		Player.position.set(
			Player.position.x - Controls.player.left * delta + Controls.player.right * delta,
			Player.position.y + Controls.player.up * delta - Controls.player.down * delta
		);

		meshes.ball.position.set( Player.position.x, Player.position.y, 0);
		sun.position.set(Player.position.x, Player.position.y + 50, 20);

		camera.position.set(Player.position.x, Player.position.y + 3, 15);
		camera.lookAt(new THREE.Vector3(Player.position.x, Player.position.y, 0));
	}
	function draw() {
		requestAnimationFrame(draw);
		Renderer.render(scene, camera);

		tc.width = window.innerWidth;
		tc.height = window.innerHeight;

		tg.clearRect(0, 0, tc.width, tc.height);

		var m, i, x, y, s;

		var st = tg.save();

		tg.translate(tc.width / 2, tc.height / 2);
		tg.scale(80, -80);

		var a, b, c, d, e, f, g, h;

		tg.translate(-Player.position.x, -Player.position.y);

		tg.strokeStyle = '#ff0';
		tg.lineWidth = 1/50;
		for (y = 0; y < level.height; y++) {
			for (x = 0; x < level.width; x++) {
				switch (level.tiles[x+(level.height-y-1)*level.width]) {
					case 1:
						s = SAT.AABBvsAABB(new SAT.AABB(Player.position.x, Player.position.y, 0.5, 0.5), new SAT.AABB(x,y,0.5,0.5));
						if (s === false) {
							tg.strokeStyle = '#fc0';
						} else {
							tg.strokeStyle = '#0f0';
						}
						tg.strokeRect(x - 0.5, y - 0.5, 1, 1);
						break;
					case 2:
						s = SAT.AABBvsAABB(new SAT.AABB(Player.position.x, Player.position.y, 0.5, 0.5), new SAT.AABB(x,y,0.5,0.5));
						if (s === false) {
							tg.strokeStyle = '#fc0';
						} else {
							b = SAT.ProjectOnto(new SAT.AABB(Player.position.x, Player.position.y, 0.5, 0.5), new THREE.Vector2(1,-1), tg);
							c = SAT.ProjectOnto([new THREE.Vector2(x-0.5,y-0.5), new THREE.Vector2(x+0.5,y-0.5), new THREE.Vector2(x+0.5,y+0.5)], new THREE.Vector2(-1,1), tg);
							//drawVector(a.x + Player.position.x, a.y + Player.position.y, 1, 1, 1, '#0cc');
							drawVector(b.x1 + Player.position.x, b.y1 + Player.position.y, b.x2 - b.x1, b.y2 - b.y1, 1, '#0c0');
							drawVector(c.x1 + Player.position.x, c.y1 + Player.position.y, c.x2 - c.x1, c.y2 - c.y1, 1, '#c00');
							/*if (b.x2 > c.x1) {
								drawVector(b.x2 + Player.position.x, b.y2 + Player.position.y, c.x2 - b.x2, c.y2 - b.y2, 1, '#f0f');
							}*/
							//d = new THREE.Vector2(b.x1, b.y1);
							//e = new THREE.Vector2(c.c1, b.y1);
							//f = Math.abs(d.distanceTo(new THREE.Vector2(b.x2, b.y2)));
							//g = Math.abs(e.distanceTo(new THREE.Vector2(c.x2, c.y2)));
							//a = Math.abs(d.distanceTo(e));
							d = b.d1 - b.d2;
							e = b.d2 - c.d2;
							f = c.d1 - c.d2;
							//g = c.d2;

							drawVector(Player.position.x*2+0.0, Player.position.y*2+0.0, -1, 1, b.d1, '#f00');
							drawVector(Player.position.x*2+0.1, Player.position.y*2+0.1, -1, 1, b.d2, '#0f0');
							drawVector(Player.position.x*2+0.2, Player.position.y*2+0.2, -1, 1, c.d1, '#00f');
							drawVector(Player.position.x*2+0.3, Player.position.y*2+0.3, -1, 1, c.d2, '#ff0');
							drawVector(Player.position.x*2+0.4, Player.position.y*2+0.4, -1, 1, h, '#fff');

							//if (h > 1) Player.position.addSelf(new THREE.Vector2(-1,1).multiplyScalar(h));
							// a > 0 ? no collision : collision
							tg.strokeStyle = '#f00';
						}
						tg.beginPath();
						tg.moveTo(x - 0.5, y - 0.5);
						tg.lineTo(x + 0.5, y + 0.5);
						tg.lineTo(x + 0.5, y - 0.5);
						tg.lineTo(x - 0.5, y - 0.5);
						tg.stroke();
						break;
					case 3:
						s = SAT.AABBvsAABB(new SAT.AABB(Player.position.x, Player.position.y, 0.5, 0.5), new SAT.AABB(x,y,0.5,0.5));
						if (s === false) {
							tg.strokeStyle = '#fc0';
						} else {
							tg.strokeStyle = '#f00';
						}
						tg.beginPath();
						tg.moveTo(x - 0.5, y - 0.5);
						tg.lineTo(x - 0.5, y + 0.5);
						tg.lineTo(x + 0.5, y - 0.5);
						tg.lineTo(x - 0.5, y - 0.5);
						tg.stroke();
						break;
					default:
						// Derp
				}
			}
		}
		tg.strokeStyle = '#0ff';
		tg.strokeRect(-0.5 + Player.position.x, -0.5 + Player.position.y, 1, 1);

		//tg.strokeStyle = '#0f0';
		//tg.strokeRect(-1.5, -1.5, 3, 3);

		//b = new THREE.Vector2(1, 0.5);
		//a = SAT.ProjectOnto(new SAT.AABB(Player.position.x, Player.position.y, 1.5, 1.5), b);
		//c = SAT.ProjectOnto(new SAT.AABB(Player.position.x, Player.position.y, 1.5, 1.5), new THREE.Vector2(1, 0));

		//drawVector(a.x1 - Player.position.x, a.y1 - Player.position.y, a.x2 - a.x1, a.y2 - a.y1);
		//drawVector(c.x1 - Player.position.x, c.y1 - Player.position.y, c.x2 - c.x1, c.y2 - c.y1);

		//tg.fillStyle = '#fff';
		//c = SAT.ProjectOnto(new SAT.AABB(Player.position.x, Player.position.y, 0.5), new THREE.Vector2(Math.cos((Date.now() % 8000) / 4000 * Math.PI), Math.sin((Date.now() % 8000) / 4000 * Math.PI)), tg);
		//drawVector(c.x1 + Player.position.x, c.y1 + Player.position.y, c.x2 - c.x1, c.y2 - c.y1);

		tg.restore(st);
	}


	function drawVector(x,y,vx,vy,s,c) {
		s = s !== undefined ? s : 1;
		x -= Player.position.x;
		y -= Player.position.y;
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
	}

	requestAnimationFrame(draw);
	setInterval(loop, 10);
});