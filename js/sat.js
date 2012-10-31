define(['three','perf'], function(THREE,Perf) {
	var SAT;
	SAT = {
		LastSeparation: { x: 0, y: 0, v: 0 },
		LastProjection: { x: 0, y: 0, v: 0 },
		PointArray1: [],
		PointArray2: [],
		AxisArray: [],

















		Per: function(v) { // Right perproduct.
Perf.log('Create');
			return new THREE.Vector2(v.y, -v.x);
		},
		Per2: function(v) { // Left perproduct.
Perf.log('Create');
			return new THREE.Vector2(-v.y, v.x);
		},
		LengthSq: function(v) { // Length Squared)
			return v.x * v.x + v.y * v.y;
		},











		Project: function(a,b) { // Project point onto line.
			var v = (a.x * b.x + a.y * b.y) / (b.x * b.x + b.y * b.y);
Perf.log('Create');
			var r = new THREE.Vector3(v * b.x, v * b.y, v);
			return r;
		},
		eProject: function(a,b) { // Project point onto line.
			var v = (a.x * b.x + a.y * b.y) / (b.x * b.x + b.y * b.y);
			SAT.LastProjection.x = v * b.x;
			SAT.LastProjection.y = v * b.y;
			SAT.LastProjection.v = v;
		},












		ProjectOnto: function(a,v) { // Project object onto line.
			var pts = [], min, max, i;

			if (a instanceof SAT.AABB) {
Perf.log('Create');
Perf.log('Create');
Perf.log('Create');
Perf.log('Create');
				pts.push(SAT.Project(new THREE.Vector2(a.x - a.w, a.y - a.h), v));
				pts.push(SAT.Project(new THREE.Vector2(a.x - a.w, a.y + a.h), v));
				pts.push(SAT.Project(new THREE.Vector2(a.x + a.w, a.y - a.h), v));
				pts.push(SAT.Project(new THREE.Vector2(a.x + a.w, a.y + a.h), v));
			} else {
				for (i = a.length - 1; i >= 0; i--) {
					pts.push(SAT.Project(a[i], v));
				}
			}
			min = max = pts[0];
			for (i = pts.length - 1; i > 0; i--) {
				if (pts[i].z < min.z) min = pts[i];
				if (pts[i].z > max.z) max = pts[i];
			}
Perf.log('Create');
			return new SAT.Line(min.x, min.y, max.x, max.y, min.z, max.z);
		},





		eProjectOnto: function(a,x,y) { // Project object onto line.
			var min, max, i;

			for (i = 0; i < a.length; i++) {

			}
		},





















		GetAxes: function(obj,and) {
			var axes = typeof and !== 'undefined' ? and : [], ax, pd, l;
			if (obj instanceof SAT.AABB) {
				ax = { x: 0, y: 1, fx: obj.x, fy: obj.y + obj.h };
				if (axes.indexOf(ax) == -1) { axes.push(ax); }
				ax = { x: 1, y: 0, fx: obj.x + obj.w, fy: obj.y };
				if (axes.indexOf(ax) == -1) { axes.push(ax); }
				ax = { x: 0, y:-1, fx: obj.x, fy: obj.y - obj.h };
				if (axes.indexOf(ax) == -1) { axes.push(ax); }
				ax = { x:-1, y: 0, fx: obj.x - obj.w, fy: obj.y };
				if (axes.indexOf(ax) == -1) { axes.push(ax); }
			} else {
				for (var point = 0; point < obj.length; point++) { // Step through vertices clockwise.
Perf.log('Create');
					pd = new THREE.Vector2(obj[(point+1)%obj.length].x - obj[point].x, obj[(point+1)%obj.length].y - obj[point].y);
					//l = Math.sqrt(pd.x * pd.x + pd.y * pd.y);
					l = Math.abs(pd.x) + Math.abs(pd.y);
					ax = SAT.Per(pd); // Get edge normal.
					if (axes.indexOf(ax) == -1) {
Perf.log('Create');
						axes.push({x: ax.x / l, y: ax.y / l, fx: obj[point].x + pd.x / 2, fy: obj[point].y + pd.y / 2});
					}
				}
			}
			return axes;
		},




































		Separate: function(a,b) {
			var i, ap, bp, dp, pd, sd, vi, min = Number.MAX_VALUE;

			if (b instanceof SAT.AABB) {
				b = [
					{ x: b.x - b.w, y: b.y + b.h },
					{ x: b.x + b.w, y: b.y + b.h },
					{ x: b.x + b.w, y: b.y - b.h },
					{ x: b.x - b.w, y: b.y - b.h }
				];
			}

			var v = SAT.GetAxes(b);
			v = SAT.GetAxes(a,v);

			for (i = 0; i < v.length; i++) {
					ap = SAT.ProjectOnto(a, v[i]);
					bp = SAT.ProjectOnto(b, v[i]);
					sd = SAT.Separate1D(bp.d1, bp.d2, ap.d1, ap.d2);

					//drawVector(v[i].fx + a.x, v[i].fy + a.y, v[i].x, v[i].y, 0.3, g);

					if (sd == Number.MAX_VALUE) return false;
					if (sd < min && sd >= 0) {
						min = sd;
						vi = i;
					}

			}

Perf.log('Create');
			return { x: v[vi].x * min, y: v[vi].y * min, v: v[vi] };

		},














		eSeparate: function(a,b) {
			var i, ap, bp, dp, pd, sd, vi, min = Number.MAX_VALUE;

			if (b instanceof SAT.AABB) {
				b = [
					{ x: b.x - b.w, y: b.y + b.h },
					{ x: b.x + b.w, y: b.y + b.h },
					{ x: b.x + b.w, y: b.y - b.h },
					{ x: b.x - b.w, y: b.y - b.h }
				];
			}

			var v = SAT.GetAxes(b);
			v = SAT.GetAxes(a,v);

			for (i = 0; i < v.length; i++) {
					ap = SAT.eProjectOnto(a, v[i]);
					bp = SAT.eProjectOnto(b, v[i]);
					sd = SAT.Separate1D(bp.d1, bp.d2, ap.d1, ap.d2);

					//drawVector(v[i].fx + a.x, v[i].fy + a.y, v[i].x, v[i].y, 0.3, g);

					if (sd == Number.MAX_VALUE) return false;
					if (sd < min && sd >= 0) {
						min = sd;
						vi = i;
					}

			}

			SAT.LastSeparation.x = v[vi].x * min;
			SAT.LastSeparation.y = v[vi].y * min;
			SAT.LastSeparation.v = v[vi];
			return true;

		},



















		Dot: function(a,b) {
			return a.x * b.x + a.y * b.y;
		},
		Separate1D: function(a,b,c,d) {
			if (a > d || b < c) return Number.MAX_VALUE; // Not touching.

			if ((b > d && a < c) || (b < d && a > c)) { // CD inside AB or AB inside CD
				if ((b-a)/2+a>=(d-c)/2+c) { // AB is right of CD
					return a-d;
				} else { // AB is right of CD
					return b-c;
				}
			}

			if (b >= d) {
				return a-d;
			} else {
				return b-c;
			}
		},
		AABBvsPoint: function(a,p) {
			if (p.x <= a.x - a.w) return false;
			if (p.x <= a.x + a.w) return false;
			if (p.y >= a.y - a.h) return false;
			if (p.y <= a.y + a.h) return false;
			return true;
		},
		AABBvsAABB: function(a,b) {
			//return SAT.AABBvsPoint(new SAT.AABB(a.x, a.y, a.w + b.w, a.h + b.h), b.x, b.y);
			if (a.x + a.w <= b.x - b.w) return false;
			if (a.x - a.w >= b.x + b.w) return false;
			if (a.y + a.h <= b.y - b.h) return false;
			if (a.y - a.h >= b.y + b.h) return false;
			return true;
		},
		AABB: function(x,y,w,h,l,r,t,b) {
			if (x instanceof THREE.Vector2) {
				this.x = x.x;
				this.y = x.y;
				if (y instanceof THREE.Vector2) {
					this.w = y.x;
					this.h = y.y;
				}
			} else {
				this.x = typeof x !== 'undefined' ? x : 0.5;
				this.y = typeof y !== 'undefined' ? y : 0.5;
				this.w = typeof w !== 'undefined' ? w : 0.5;
				this.h = typeof h !== 'undefined' ? h : 0.5;
			}
			this.l = typeof l !== 'undefined' ? l : x - w;
			this.r = typeof r !== 'undefined' ? r : x + w;
			this.t = typeof t !== 'undefined' ? t : y + h;
			this.b = typeof b !== 'undefined' ? b : y - h;
			this.inflate = function(x,y) {
				if (typeof y === 'undefined') {
					y = x;
				}
				this.w += x;
				this.h += y;
				this.l = this.x - this.w;
				this.r = this.x + this.w;
				this.t = this.y + this.h;
				this.b = this.y - this.h;
				return this;
			};
		},
		Line: function(x1,y1,x2,y2,d1,d2) {
			this.x1 = x1;
			this.y1 = y1;
			this.x2 = x2;
			this.y2 = y2;
			this.d1 = d1 || 0;
			this.d2 = d2 || 0;
		}
	};

	return SAT;
});