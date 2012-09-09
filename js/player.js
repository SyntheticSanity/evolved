define(['three', 'sat', 'character', 'billboard', 'controls'], function(THREE, SAT, Character, TextBillboard, Controls) {
	var Player = function() {};
	Player = function(charname,playername,uid) {

		var scope = this;

		this.position = new THREE.Vector2();
		this.prevpos = new THREE.Vector2();
		this.velocity = new THREE.Vector2();
		this.box = new SAT.AABB(0, 0, 0.25, 0.75);

		this.mass = 20;
		this.runSpeed = 8;
		this.walkSpeed = 2;
		this.groundFriction = 40;

		this.controls = new Controls();

		this.wallLeft = false;
		this.wallRight = false;
		this.onGround = true;
		this.leftGround = false;
		this.slopeDown = false;
		this.falling = false;
		this.fastFalling = false;
		this.running = false;
		this.dashing = false;
		this.wallJumping = false;
		this.jumping = false;
		this.jumpCount = 0;
		this.jumpLimit = 1;

		this.groundPlane = new THREE.Vector2(1, 0);

		this.name = playername;
		this.uid = uid;

		this.networkDelta = 0;

		this.billboard = new TextBillboard({text: playername, size: 0.66});

		this.character = null;

		this.setup = function(scene) {
			var sc = this;
			this.character = new Character(charname, function(obj) {
				sc.box = sc.character.box;
				sc.satpts = sc.character.satpts;
				sc.character.setAnimation('Falling');
				scene.add(obj);
			});

			scene.add(this.billboard.sprite);
		};

		this.remove = function(scene) {
			scene.remove(this.billboard.sprite);
			scene.remove(this.character.model);
		};

		this.update = function(level,delta,g) {

			// this.velocity.x = (this.prevpos.x - this.position.x) / delta;
			// this.velocity.y = (this.prevpos.y - this.position.y) / delta;

			if (this.billboard.text != this.name) {
				this.billboard.setText(this.name);
			}

			var animationDelta = delta;

			if (this.networkDelta > 0) {
				delta += this.networkDelta;
				this.networkDelta = 0;
			}

			// if (this.xDelta > 0) {
				// this.position.addSelf(this.velocity.clone().multiplyScalar(this.xDelta));
				// this.xDelta = 0;
			// }

			this.wallLeft = false;
			this.wallRight = false;

			var wasOnGround = this.onGround;
			this.onGround = false;
			this.slopeDown = false;

			var smash = false;

			var animSet = false;

			if (this.position.y < -3) {
				this.position.x = level.spawn.x;
				this.position.y = level.spawn.y;
				this.velocity.x = 0;
				this.velocity.y = 0;
			}

			// If the player has stopped tilting or is falling, walljump physics are disabled.
			if (this.velocity.y <= 0 || (this.controls.player.left + this.controls.player.right) < 0.1) this.wallJumping = false;
			// If the player has stopped holding the jump button, jump physics are disabled.
			if (!this.controls.player.jump) this.jumping = false;

			// Fast falling
			if (this.controls.player.down - this.controls.playerPrev.down > 0.38 && this.controls.player.down >= this.controls.player.left + this.controls.player.right) {
				this.velocity.y = Math.min(this.mass * -0.2, this.velocity.y);
				this.fastFalling = true;
			}

			// Gravity
			if (!this.onGround) this.velocity.y -= (this.velocity.y > 0 && (this.jumping || this.wallJumping) ? this.mass : this.controls.player.down ? this.mass * 3.2 : this.mass * 2.4) * delta;

			this.groundPlane.x = 1;
			this.groundPlane.y = 0;

			this.prevpos = new THREE.Vector2(this.position.x, this.position.y);

			var f = function(x,y,p,g) {
				//console.log(p.name, p.position.x, p.position.y);
				if (x < 0 || x >= level.width || y < 0 || y >= level.height) return;
				var a, b, s, t;
				a = new SAT.AABB(p.position.x, p.position.y, p.box.w, p.box.h);
				t = x+(level.height-y-1)*level.width;
				if (level.tiles[t] !== 0) {
					if (level.satobj[t] instanceof SAT.AABB) {
						b = new SAT.AABB(x,y,0.54,0.49);
						if (SAT.AABBvsAABB(a,b)) {
							if (x > p.position.x && p.velocity.x > -0.5) {
								p.wallRight = true;
								// p.velocity.x = 0;
								//if (!scope.wallJumping && !scope.onGround) scope.dashing = false;
								if (p.velocity.y < p.mass * -0.2 && (!p.fastFalling || p.controls.player.right > 0.5)) {
									p.velocity.y = p.mass * -0.2;
								}
							} else if (p.velocity.x < 0.5) {
								p.wallLeft = true;
								// p.velocity.x = 0;
								//if (!scope.wallJumping && !scope.onGround) scope.dashing = false;
								if (p.velocity.y < p.mass * -0.2 && (!p.fastFalling || p.controls.player.left > 0.5)) {
									p.velocity.y = p.mass * -0.2;
								}
							}
						}
						b = new SAT.AABB(x,y,0.5,0.5);
						if (SAT.AABBvsAABB(a,b)) {
							s = SAT.Separate(a,b);
							if (Math.abs(a.x+a.w-b.x-b.w) >= 1) s.y = 0;
							if (s.y > 0 && p.velocity.y < 0) {
								p.jumpCount = 0;
								p.onGround = true;
								p.jumping = false;
								p.falling = false;
								p.fastFalling = false;
								p.velocity.y = 0;
							}
							p.position.addSelf(s);
							if (Math.abs(s.x) < Math.abs(s.y+0.05)) s.x = 0;
							if (s.x !== 0) p.velocity.x *= p.falling ? -0.8 : 0;
							if (s.y !== 0) p.velocity.y *= p.falling ? -0.8 : 0;
							a = new SAT.AABB(p.position.x, p.position.y, p.box.w, p.box.h);
						}
					} else {
						s = SAT.Separate(a,level.satobj[t]);
						if (s !== false) {
							if (Math.abs(s.x) < Math.abs(s.y) * 1.6 && s.y > 0) {
								s.y += Math.abs(s.x);
								s.x = 0;
							}
							if (s.y > 0) {
								p.jumpCount = 0;
								p.onGround = true;
								p.jumping = false;
								p.falling = false;
								p.fastFalling = false;
								p.velocity.y = 0;
								p.groundPlane = SAT.Per(s.v);
							}
							if (s.y < 0) {
								p.velocity.y = Math.min(s.y, 0);
								//p.velocity.x += Math.abs(s.y) * p.velocity.x / Math.abs(p.velocity.x || 1);
							}
							p.position.addSelf(s);
							p.velocity.addSelf(s);
							if (Math.abs(s.y) < 0.04) {
								if (x > p.position.x && p.velocity.x > -0.5) {
									p.wallRight = true;
									//if (!scope.wallJumping && !scope.onGround) scope.dashing = false;
									if (p.velocity.y < p.mass * -0.2 && (!p.fastFalling || p.controls.player.right > 0.5)) {
										p.velocity.y = p.mass * -0.2;
									}
								} else if (x < p.position.x && p.velocity.x < 0.5) {
									p.wallLeft = true;
									//if (!scope.wallJumping && !scope.onGround) scope.dashing = false;
									if (p.velocity.y < p.mass * -0.2 && (!p.fastFalling || p.controls.player.left > 0.5)) {
										p.velocity.y = p.mass * -0.2;
									}
								}
							}
						}
					}

					if (DEBUG) {

						// g.fillStyle = '#f00';
						// g.fillRect(a.x, a.y, 0.1, 0.1);

						// g.strokeStyle = '#fff';
						// g.beginPath();
						// for (i = 0; i < b.length; i++) {
							// g.lineTo(b[i].x, b[i].y);
						// }
						// g.closePath();
						// g.stroke();

						// g.strokeStyle = 'rgba(128,128,128,0.2)';
						// g.strokeRect(a.x - a.w, a.y - a.h, a.w * 2, a.h * 2);

						// var sv = SAT.Separate(a, b, g);

						// drawVector(a.x*2, a.y*2, sv.x, sv.y, g);

						// g.strokeStyle = '#fff';
						// g.strokeRect(a.x - 20 + sv.x, a.y - 20 + sv.y, 40, 40);

					}

				}

				if (DEBUG) {
					// g.strokeStyle = 'rgba(255,255,255,0.1)';
					// g.strokeRect(x - 0.5, y - 0.5, 1, 1);
				}
			};

			var si, ms = 2*Math.min(5, Math.ceil((delta / 0.1) * (2.3 + Math.round(Math.abs(this.velocity.x * 0.3) + Math.abs(this.velocity.y * 0.3))))), md = delta / ms;
			Perf.start('Collision');
			for (si = 0; si < ms; si++) {
				Perf.log('Collision Samples');

				// Move player per velocity
				this.position.addSelf(this.velocity.clone().multiplyScalar(md));

				// Detect collisions.
				f(Math.round(this.position.x),Math.round(this.position.y),this,g);
				f(Math.round(this.position.x),Math.round(this.position.y-1),this,g);
				f(Math.round(this.position.x-1),Math.round(this.position.y),this,g);
				f(Math.round(this.position.x+1),Math.round(this.position.y),this,g);
				f(Math.round(this.position.x),Math.round(this.position.y+1),this,g);
			}
			Perf.end('Collision');

			Perf.start('PlayerControl');
			this.groundPlane.normalize();

			this.billboard.sprite.position.x = this.position.x;
			this.billboard.sprite.position.y = this.position.y + this.box.h + 0.5;
			this.billboard.sprite.position.z = 0;

			if (Math.abs((this.controls.player.left + this.controls.player.right) - (this.controls.playerPrev.left + this.controls.playerPrev.right)) > 0.38) {
				smash = true;
				this.dashing = true;
			}
			if (Math.abs((this.controls.player.up + this.controls.player.down) - (this.controls.playerPrev.up + this.controls.playerPrev.down)) > 0.38) {
				smash = true;
			}

			this.groundPlane.normalize();

			var mvs, cms, vd;
			mvs = (this.dashing ? this.runSpeed : this.walkSpeed);
			if (vd < 0) console.log(vd);

			if (this.controls.player.left > 0.1) { // If the player is moving left
				if (this.velocity.x > 0.1) this.velocity.x = 0;
				cms = Math.abs(this.velocity.x);
				vd = (mvs - cms);
				this.velocity.x += vd * -this.groundPlane.x * delta * this.groundFriction;
				this.velocity.y += vd * -this.groundPlane.y * delta * this.groundFriction;

				vd = Math.abs(this.velocity.x / this.groundPlane.x);
				if (Math.abs(this.velocity.y / this.groundPlane.y) < vd * 0.33) {
					this.velocity.y = this.groundPlane.y * -vd * (this.groundPlane.y > 0 ? 2 : 1);
					this.onGround = true;
					this.falling = false;
					this.slopeDown = true;
				}

				if (this.character !== null) this.character.direction = Character.Directions.Left;
			} else if (this.controls.player.right > 0.1) { // If the player is moving right
				if (this.velocity.x < 0.1) this.velocity.x = 0;
				cms = Math.abs(this.velocity.x);
				vd = (mvs - cms);
				this.velocity.x += vd * this.groundPlane.x * delta * this.groundFriction;
				this.velocity.y += vd * this.groundPlane.y * delta * this.groundFriction;

				vd = Math.abs(this.velocity.x / this.groundPlane.x);
				if (Math.abs(this.velocity.y / this.groundPlane.y) < vd * 0.33) {
					this.velocity.y = this.groundPlane.y * vd * (this.groundPlane.y > 0 ? 1 : 2);
					this.onGround = true;
					this.falling = false;
					this.slopeDown = true;
				}

				if (this.character !== null) this.character.direction = Character.Directions.Right;
			} else { // If the player is not moving
				if (!this.wallJumping) this.dashing = false;
				this.velocity.x = (0 - this.velocity.x) * this.groundFriction * delta + this.velocity.x;
			}

			if (this.controls.player.jump && !this.controls.playerPrev.jump) {
				if (this.onGround) {
					this.velocity.y = 12;
					this.jumping = true;
				} else if (this.jumpCount < this.jumpLimit) {
					this.jumpCount++;
					this.velocity.y = 12;
					this.jumping = true;
				}
				if (!animSet && this.character !== null) {
					if (this.wasOnGround) {
						this.character.mesh.time = 0;
						this.character.setAnimation('Jumping');
						this.leftGround = 0.1;
					} else {
						this.character.setAnimation('Falling');
					}
					animSet = true;
				}
			}

			if (!this.onGround) { // If the player is in the air...
				if (this.controls.player.left > 0.2) { // ...and is tilting the stick to the left...
					if (this.wallRight) { // ...and a wall is to the right, walljump.
						this.velocity.x = -7;
						this.velocity.y = 9;
						this.wallJumping = true;
						this.dashing = true; // Always dash after a walljump.
						if (this.character !== null) this.character.setAnimation('Falling');
						animSet = true;
					}
				} else {
					if (this.wallRight && !animSet && this.velocity.y <= 0) {
						if (this.character !== null) this.character.direction = Character.Directions.Left;
					}
				}
				if (this.controls.player.right > 0.2) { // ... and is tilting the stick to the right...
					if (this.wallLeft) { // ...and a wall is to the left, walljump.
						this.velocity.x = 7;
						this.velocity.y = 9;
						this.wallJumping = true;
						this.dashing = true; // Always dash after a walljump.
						if (this.character !== null) this.character.setAnimation('Falling');
						animSet = true;
					}
				} else {
					if (this.wallLeft && !animSet && this.velocity.y <= 0) {
						if (this.character !== null) this.character.direction = 'Right';
					}
				}
				if (wasOnGround && !this.slopeDown && !animSet) {
					this.leftGround += 0.1;
				} else if (this.leftGround >= 1) {
					if (this.character !== null) this.character.setAnimation('Falling');
					this.leftGround = 0;
				}
			}
			this.leftGround = this.leftGround > 0 ? this.leftGround += delta * 2 : 0;

			if (this.character !== null) {
				if (!animSet) {
					if (this.onGround) {
						if (Math.abs(this.velocity.x) > this.walkSpeed + (this.runSpeed - this.walkSpeed) / 2) {
							this.character.setAnimation('Running');
						} else if (Math.abs(this.velocity.x) > 0.1) {
							this.character.setAnimation('Walking');
						} else {
							this.character.setAnimation('Standing');
						}
					} else if (!this.wallJumping && this.velocity.y <= 0) {
						if (this.wallLeft || this.wallRight) {
							this.character.setAnimation('WallSlide');
						}
					}
					this.character.update(this.position, animationDelta);
				} else {
					this.character.update(this.position, animationDelta);
				}
				this.character.dirSnap = false;
			}
			Perf.end('PlayerControl');

		};

		this.doCollision = function(v) {
			if (typeof v === 'undefined') v = new THREE.Vector2(1, 1);
		};
	};
	return Player;
});