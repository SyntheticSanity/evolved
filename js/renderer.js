define(['three','globals','renderer'], function(THREE,globals,Renderer) {
	var rtParamsRGB  = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
	var rtParamsRGBA = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
	var scope;
	scope = {
		renderer: new THREE.WebGLRenderer({alpha:false,antialias:true}),
		composer: null,
		cube_scene: null,
		cube_camera: null,
		cube_sky: null,
		cube_map: null,
		effects: {
			fxaa: new THREE.ShaderPass(THREE.ShaderExtras['fxaa']),
			screen: new THREE.ShaderPass(THREE.ShaderExtras['screen'])
		},
		targets: {
			depth: new THREE.WebGLRenderTarget(globals.view.width, globals.view.height, rtParamsRGBA),
			color: new THREE.WebGLRenderTarget(globals.view.width, globals.view.height, rtParamsRGB)
		},
		setup: function(scene, camera) {
			this.resize();

			this.cube_scene = new THREE.Scene();

			this.cube_camera = new THREE.PerspectiveCamera(camera.angle, camera.aspect, 1, 1000);

			this.cube_texture = new THREE.ImageUtils.loadTextureCube([
				'img/sky_px.png',
				'img/sky_nx.png',
				'img/sky_py.png',
				'img/sky_ny.png',
				'img/sky_pz.png',
				'img/sky_nz.png'
			]);
			var shader = THREE.ShaderUtils.lib['cube'];
			shader.uniforms['tCube'].texture = this.cube_texture;

			this.cube_map = new THREE.ShaderMaterial({
				fragmentShader: shader.fragmentShader,
				vertexShader: shader.vertexShader,
				uniforms: shader.uniforms,
				depthWrite: false,
				side: THREE.BackSide
			});

			this.cube_sky = new THREE.Mesh(new THREE.CubeGeometry(100, 100, 100), this.cube_map);
			this.cube_scene.add(this.cube_sky);
			this.cube_scene.add(this.cube_camera);

			this.composer = new THREE.EffectComposer(this.renderer, this.targets.color);

			this.effects.screen.renderToScreen = true;

			//this.composer.addPass(this.effects.fxaa);
			this.composer.addPass(this.effects.screen);

			window.fx = this.effects;

			this.renderer.sortObjects = true;
			//this.renderer.physicallyBasedShading = true;
			this.renderer.shadowMapEnabled = true;
			//this.renderer.shadowMapDebug = true;
			this.renderer.shadowMapCullFrontFaces = true;
			this.renderer.shadowMapSoft = true;
			this.renderer.sortObjects = false;

			this.renderer.autoClear = false;

			window.addEventListener('resize', this.resize, false);

			document.body.appendChild(this.renderer.domElement);
		},
		render: function(scene, camera) {
			if (camera.aspect !== globals.view.aspect) {
				camera.aspect = globals.view.aspect;
				this.cube_camera.aspect = globals.view.aspect;
				camera.updateProjectionMatrix();
				this.cube_camera.updateProjectionMatrix();
			}
			this.cube_camera.rotation.copy(camera.rotation);

			this.renderer.clear();
			this.renderer.render(this.cube_scene, this.cube_camera);
			this.renderer.render(scene, camera);
			// this.renderer.render(scene, camera, this.composer.renderTarget2, true);
			// this.composer.render(0.1);
		},
		resize: function() {
			globals.view.width = window.innerWidth;
			globals.view.height = window.innerHeight;
			globals.view.aspect = globals.view.width / globals.view.height;

			if (typeof this.renderer !== 'undefined') {
				this.renderer.setSize(globals.view.width, globals.view.height);
				this.effects.fxaa.uniforms['resolution'].value.set( 1.0 / globals.view.width, 1.0 / globals.view.height );
			} else {
				scope.renderer.setSize(globals.view.width, globals.view.height);
				scope.effects.fxaa.uniforms['resolution'].value.set( 1.0 / globals.view.width, 1.0 / globals.view.height );
			}

		}
	};
	return scope;
});