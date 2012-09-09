define(['three','sat'], function(THREE,SAT) {

	var Character;
	Character = function(name,callback) {

		var scope = this;
		var loadCallback = callback;

		THREE.Object3D.call(this);

		var loader = new THREE.GeometryLoader();

		this.geom = undefined;
		this.model = undefined;
		this.frame = 0;
		this.loaded = false;
		this.box = new SAT.AABB(0, 0, 0.25, 0.75);

		loader.addEventListener('load', function(e) {
			scope.geom = e.content;

			scope.geom.computeMorphNormals();

			var mat = scope.geom.materials[0];
			mat.morphTargets = true;
			mat.morphNormals = true;
			mat.transparent = true;
			mat.color.setHex(0xffffff);
			mat.ambient.setHex(0x888888);

			var morph = new THREE.MorphAnimMesh(scope.geom, mat);

			morph.duration = 24;
			morph.time = 0;
			morph.scale.set(1,1,1);
			morph.rotation.set(0,Math.PI/2,0);
			morph.matrixAutoUpdate = false;
			morph.updateMatrix();

			scope.model = morph;
			scope.model.castShadow = true;
			scope.model.receiveShadow = true;

			scope.loaded = true;

			window.morph = morph;

			scope.setAnimation(scope.animation);

			loadCallback(morph);
		});
		loader.load('./mdl/'+name+'.js');

		this.animation = 'Standing';
		this.nextAnimation = null;
		this.direction = Character.Directions.Right;
		this.dirSnap = false;

		this.update = function(position, delta) {
			//this.char.position.set(position.x, position.y, position.z);
			//console.log(position);
			//scope.position.x = position.x;
			//scope.position.y = position.y;

			if (scope.loaded) {
				if (scope.direction == Character.Directions.Left) {
					if (scope.model.rotation.y > -Math.PI / 2 && !scope.dirSnap) {
						scope.model.rotation.y -= delta * 40;
					} else {
						scope.model.rotation.y = -Math.PI / 2;
					}
				} else {
					if (scope.model.rotation.y < Math.PI / 2 && !scope.dirSnap) {
						scope.model.rotation.y += delta * 40;
					} else {
						scope.model.rotation.y = Math.PI / 2;
					}
				}

				if (scope.cueTime > 0 && (scope.cueTime -= delta * 50) < 0) {
					scope.cueTime = 0;
					scope.setAnimation(scope.nextAnimation);
					scope.nextAnimation = null;
				}

				scope.model.updateAnimation(delta * 1000);

				scope.model.position.x = position.x;
				scope.model.position.y = position.y - scope.box.h;

				scope.model.updateMatrix();
			}

		};

		this.setAnimation = function(animation) {
			scope.animation = animation;
			if (typeof scope.model !== 'undefined' && typeof scope.model.setFrameRange !== 'undefined') {
				try {
					scope.model.setFrameRange(Character.Animations[animation].Start, Character.Animations[animation].Start + Character.Animations[animation].Length - 1);
					scope.model.duration = Character.Animations[animation].Duration;
				} catch(e) {}
			}
		};

		this.cueAnimation = function(animation) {
			scope.nextAnimation = animation;
			scope.cueTime = Character.Animations[scope.animation].Length;
		};

	};
	Character.Animations = {
		Standing: {
			Name: 'Standing',
			Start: 0,
			Length: 2,
			Duration: 600,
			Follow: 'Standing'
		},
		Walking: {
			Name: 'Walking',
			Start: 4,
			Length: 4,
			Duration: 600,
			Follow: 'Walking'
		},
		Running: {
			Name: 'Running',
			Start: 8,
			Length: 8,
			Duration: 400,
			Follow: 'Running'
		},
		Jumping: {
			Name: 'Jumping',
			Start: 17,
			Length: 2,
			Duration: 200,
			Follow: 'Falling'
		},
		Falling: {
			Name: 'Falling',
			Start: 19,
			Length: 2,
			Duration: 500,
			Follow: 'Falling'
		},
		Landing: {
			Name: 'Landing',
			Start: 21,
			Length: 3,
			Duration: 100,
			Follow: 'Standing'
		},
		WallSlide: {
			Name: 'WallSlide',
			Start: 24,
			Length: 2,
			Duration: 100,
			Follow: 'WallSlide'
		},
		Punch: {
			Name: 'Punch',
			Start: 26,
			Length: 5,
			Duration: 100,
			Follow: 'Standing'
		}
	};
	Character.Directions = {
		Left: 0,
		Right: 1
	};
	Character.Frames = {
		Standing: 0,
		Walking: 4,
		Running: 8,
		Jumping: 17,
		Falling: 19,
		Landing: 21,
		WallSlide: 24
	};
	return Character;
});