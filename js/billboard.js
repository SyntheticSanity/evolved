define(['three'], function(THREE) {
	var TextBillboard = function( parameters ) {

		this.sprite = new THREE.Sprite({ useScreenCoordinates: true });
		this.shown = false;

		this.size = parameters.size !== undefined ? parameters.size : 1;
		this.text = parameters.text !== undefined ? parameters.text : 'Text';

		this.canvas = document.createElement('canvas');
		this.canvas.width = 1024;
		this.canvas.height = 256;

		this.context = this.canvas.getContext('2d');
		this.context.font = '60px \'Dosis\'';
		this.context.textAlign = "center";
		this.context.textBaseline = "middle";
		this.context.shadowColor = '#000';
		this.context.shadowOffsetX = 0;
		this.context.shadowOffsetY = 0;
		this.context.shadowBlur = 6;
		this.context.fillStyle = "white";

		this.texture = new THREE.Texture(this.canvas);
		this.texture.needsUpdate = true;

		this.setText = function(string) {
			this.text = string;
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.context.fillText(string, 512, 128);
			this.texture.needsUpdate = true;
		};

		this.setText(this.text);

		var scope = this;
		onWebfontLoad('Dosis', function() {
			scope.setText(scope.text);
		});

		this.sprite.map = this.texture;
		this.sprite.useScreenCoordinates = false;
		this.sprite.position.set(parameters.x !== undefined ? parameters.x : 0, parameters.y !== undefined ? parameters.y : 0, 0);
		this.sprite.scale.set(this.size * window.innerHeight / 1600, this.size * window.innerHeight / 6400, 0);
		this.sprite.opacity = 2;

		var resize = function() {
			scope.sprite.scale.set(scope.size * window.innerHeight / 1600, scope.size * window.innerHeight / 6400, 0);
		};
		window.addEventListener('resize', resize);

		this.setup = function(scene) {
			scene.add(this.sprite);
		};
		this.remove = function(scene) {
			scene.remove(this.sprite);
			window.removeEventListener('resize', resize);
		};

	};
	//TextBillboard.prototype = new THREE.Sprite();
	return TextBillboard;
});