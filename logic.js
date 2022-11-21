canvcreate("", 500, 500);
canv.width = window.innerWidth;
canv.height = window.innerHeight;
window.onresize = function () {
	canv.width = window.innerWidth;
	canv.height = window.innerHeight;
}

var startTime = new Date();
var deltaTime = 0;
var frame = 0;
var rFps = 0;

var frameCountForSample = 5;
var fps = 0;

var mainCamera = new Camera3d({x:0,y:0,z:-3},1);
var lightDirection = {
	x: 0,
	y:-1,
	z:1
};
lightDirection = math.normalize(lightDirection);

var debugValue1 = 1;
var debugValue2 = 0;
var debugValue3 = 0;

var debugPoints = [];
for (let i = 0; i < 10; i++) { 
	for (let j = 0; j < 10; j++) { 
		for (let k = 0; k < 10; k++) { 
			debugPoints.push({x:i-5,y:j-5,z:k-5});
		}
	}
}

var fbmOctaves = 1, fbmIntens = 1, graphQuality = 0.025;

var fovSlider = new Slider({ x: 10, y: 30 }, "Fov", (e) => { 
	mainCamera.fov = e;
}, 2, 200, 1, 0, 5, 1);
var intensSlider = new Slider({ x: 10, y: 45+15*2 }, "Intensity", (e) => { 
	fbmIntens = e;
}, 2, 200, 1, 0.01, 5, 1);
var octavesSlider = new Slider({ x: 10, y: 45+15*3 }, "OctavesCount", (e) => { 
	fbmOctaves = e;
}, 2, 200, 1, 0, 16, 1);
var graphQualitySlider = new Slider({ x: 10, y: 45+15*4 }, "Grid Quality", (e) => { 
	mainGraph.equationDrawQuality = e;
}, 2, 200, 0.025, 0.01, 0.08, 1);
var debugSlider1 = new Slider({ x: 10, y: 45+15*6 }, "Debug slider 1", (e) => { 
	debugValue1 = e;
}, 2, 200, 0, 0, 2*Math.PI, 1);
var debugSlider2 = new Slider({ x: 10, y: 45+15*7 }, "Debug slider 2", (e) => { 
	debugValue2 = e;
}, 2, 200, 0, -5, 5, 1);
var debugSlider3 = new Slider({ x: 10, y: 45+15*8 }, "Debug slider 3", (e) => { 
	debugValue3 = Math.floor(e);
}, 2, 200, 0, 0, 2*Math.PI, 1);
let sliders = [fovSlider, intensSlider, octavesSlider,graphQualitySlider,debugSlider1,debugSlider2,debugSlider3];


document.addEventListener("mousemove", (e) => { 
	if (e.buttons != 1) return;

	mainCamera.Rotate(mainCamera.rotation.x-e.movementY*0.001,mainCamera.rotation.y-e.movementX*0.001,mainCamera.rotation.z);
});

class EqPoint { 
	constructor(x,y,z, ix,iy) { 
		this.x = x;
		this.y = y;
		this.z = z;

		this.pos = {x:x,y:y,z:z};
	
		this.ix = ix;
		this.iy = iy;
	}
}
function factorial(n) {
    if (n > 1) {
        return n * factorial(n - 1);
    }
    return 1;
}
function Binom(a,b) {
	return (factorial(a))/(factorial(b)*factorial(b-a));
}
function zInPower(x0,y0,n) {
	let x = 0;
	let y = 0;
	for (let i = 0; i < n/2; i++) {
		x += Math.pow((-1),i)*Binom(n,2*i)*Math.pow(x0,n-2*i)*Math.pow(y0,2*i);
		y += Math.pow((-1),i)*Binom(n,2*i+1)*Math.pow(x0,n-2*i-1)*Math.pow(y0,2*i+1);
	}
	return [x,y];
}
function matExpectation(a, b) {
	let v = 0;
	for (let i = 0; i < a.length; i++) {
		v+= a[i]*b[i];
	}
	return v;
}
function dispersion(P,p) {
	let v = [];
	let E = matExpectation(P,p);
	for (let i = 0; i < P.length; i++) {
		v.push(Math.abs(P[i]-E));
	}
	return matExpectation(v,p);
}
class ComplexGraph { 
	constructor(ScaleX = 2, ScaleY = 2, ScaleZ = 2) {
		this.position = { x: 0, y: 0, z: 0 };
		
		this.scaleX = ScaleX;
		this.scaleY = ScaleY;
		this.scaleZ = ScaleZ;

		document.addEventListener("wheel", (e => {
			this.OnWheel(e);
		}));
	
		this.planeEquations = [];
		this.planeEquations.push({ eq: (x, y) => { let c0 = math.FBM([x*debugValue1,y*debugValue1,frame*0.04],2); return c0; }, color: inRgb(255,0,0,0.4) });
		// this.planeEquations.push({ eq: (x, y) => { let c0 = zInPower(x,y,debugValue3); return c0[1]; }, color: inRgb(255,0,0,0.4) });
		// this.planeEquations.push({ eq: (x, y) => { let c0 = zInPower(x,y,debugValue3); return c0[0]; }, color: inRgb(0,255,0,0.4) });
		// this.planeEquations.push({ eq: (x, y) => { let c0 = zInPower(x,y,debugValue3); return c0[0]; }, color: inRgb(255,0,0,0.55) });
		// this.planeEquations.push({ eq: (x, y) => { return debugValue2*Math.sin(x)*Math.pow(-Math.pow((debugValue3),2)+1,(y+debugValue1)); }, color: inRgb(122,122,0,0.55) });
		// this.planeEquations.push({ eq: (x, y) => { return (-(2*x)/(1+((x**2)*(2+2*(y**2)+x**2))+((y**2)*(2+y**2))))+((-2*y)/(1+(x**2)*(2+x**2)+(y**2)*(2*(x**2)+2+y**2))) }, color: inRgb(255,0,0,0.55) });

		// this.planeEquations.push({ eq: (x, y) => {
		// 	let p = [debugValue1,0,debugValue2];
		// 	let c = p[0]+p[1]+p[2];
		// 	let p0 = [p[0]/c,p[1]/c,p[2]/c];
		// 	let E = matExpectation(p,p0);
		// 	let D = dispersion(p,p0);
		// 	return E/(1+(D*x)**2); 
		// }, color: inRgb(255,0,0,0.4) });
	
		this.oneVarEquations = [];
		// this.oneVarEquations.push({ eq: (x) => { let c0 = zInPower(x,debugValue2,debugValue3); return [c0[0],c0[1]]; },color:"white"});

		this.withColor = false;
		this.equationDrawQuality = 0.03;
	}
	OnWheel(e) { 
		this.scaleX += this.scaleX * e.deltaY / 100 *0.05;
		this.scaleY += this.scaleY * e.deltaY / 100 *0.05;
		this.scaleZ += this.scaleZ * e.deltaY / 100 *0.05;
	}
	Draw() {
		this.DrawAxes();
		this.DrawSeparatorsLines();//1/(1+x**2+y**2)
		for (let i = 0; i < this.planeEquations.length; i++) { 
			this.DrawPlaneEquation(this.planeEquations[i].eq,this.planeEquations[i].color);
		}
		for (let i = 0; i < this.oneVarEquations.length; i++) { 
			this.DrawDotEquation(this.oneVarEquations[i].eq,this.oneVarEquations[i].color);
		}
	}
	DrawAxes() { 
		let xp1 = mainCamera.ProjectToCanvas({x:-1,y:0,z:0});
		let xp2= mainCamera.ProjectToCanvas({ x: 1, y: 0, z: 0 });
		
		let yp1 = mainCamera.ProjectToCanvas({x:0,y:-1,z:0});
		let yp2 = mainCamera.ProjectToCanvas({ x: 0, y: 1, z: 0 });
		
		let zp1 = mainCamera.ProjectToCanvas({x:0,y:0,z:-1}); 
		let zp2 = mainCamera.ProjectToCanvas({ x: 0, y: 0, z: 1 });
		
		d.line(xp1.x,xp1.y, xp2.x,xp2.y, "red");
		d.line(yp1.x,yp1.y, yp2.x,yp2.y, "green");
		d.line(zp1.x,zp1.y, zp2.x,zp2.y, "blue");

		d.txt("X " + this.scaleX.toFixed(2),xp2.x,xp2.y,(30/mainCamera.DistToCamera({x:1,y:0,z:0}))+"px Arial","red");
		d.txt("Y " + this.scaleY.toFixed(2),yp2.x,yp2.y,(30/mainCamera.DistToCamera({x:0,y:1,z:0}))+"px Arial","green");
		d.txt("Z " + this.scaleZ.toFixed(2),zp2.x,zp2.y,(38/mainCamera.DistToCamera({x:0,y:0,z:1}))+"px Arial","blue");
	}
	DrawSeparatorsLines() {
		// X axis
		for (let i = -this.scaleX; i <= this.scaleX; i++) { 
			let px = i/this.scaleX;
			let vpUp = mainCamera.ProjectToCanvas({x:px,y:0.012,z:0});
			let vpDown = mainCamera.ProjectToCanvas({x:px,y:-0.012,z:0});
			d.line(vpUp.x, vpUp.y, vpDown.x, vpDown.y, "red");
			// d.txt((i).toFixed(1),vpDown.x-6,vpDown.y+15,"12px Arial","red");
		}
		
		// Y axis
		for (let i = -this.scaleY; i <= this.scaleY; i++) { 
			let px = i/this.scaleY;
			let vpUp = mainCamera.ProjectToCanvas({x:-0.012,y:px,z:0});
			let vpDown = mainCamera.ProjectToCanvas({x:0.012,y:px,z:0});
			d.line(vpUp.x,vpUp.y, vpDown.x,vpDown.y,"green");
			// d.txt((i).toFixed(1),vpDown.x-6,vpDown.y+15,"12px Arial","green");
		}
		
		// Z axis
		for (let i = -this.scaleZ; i <= this.scaleZ; i++) { 
			let px = i/this.scaleZ;
			let vpUp = mainCamera.ProjectToCanvas({x:0,y:-0.012,z:px});
			let vpDown = mainCamera.ProjectToCanvas({x:0,y:0.012,z:px});
			d.line(vpUp.x,vpUp.y, vpDown.x,vpDown.y,"blue");
			// d.txt((i).toFixed(1),vpDown.x-6,vpDown.y+15,"12px Arial","blue");
		}
	}
	DrawDotEquation(f, clr) { 
		let step = (this.equationDrawQuality**2);
		let pastPos = {x:0,y:0};
		ctx.strokeStyle = clr;
		ctx.beginPath();
		for (let x = -this.scaleX; x < this.scaleX; x += step * this.scaleX) { 
			let v = f(x);
			let pos = {
				x: x / this.scaleX,
				y: v[0] / this.scaleY,
				z: v[1] / this.scaleZ
			};
			let vp = mainCamera.ProjectToCanvas(pos);
			if (x == -this.scaleX) {
				pastPos = vp;	
			} else {
				if (pos.x > 1 || pos.x < -1) {
					ctx.moveTo(vp.x,vp.y);
					continue;
				}
				if (pos.y > 1 || pos.y < -1) {
					ctx.moveTo(vp.x,vp.y);
					continue;
				}
				if (pos.z > 1 || pos.z < -1) {
					ctx.moveTo(vp.x,vp.y);
					continue;
				}
				ctx.lineTo(vp.x,vp.y);
				pastPos = vp;
			}
		}
		ctx.stroke();
	}
	DrawPlaneEquation(f, clr) { 
		let step = this.equationDrawQuality;
		let pastPos1 = { x: 0, y: 0 };
		let pastPos2 = { x: 0, y: 0 };
		ctx.strokeStyle = clr;
		if (!this.withColor)
			ctx.beginPath();
		for (let y = -this.scaleY; y < this.scaleY; y += step*this.scaleY) {
			for (let x = -this.scaleX; x <= this.scaleX; x += step * this.scaleX) {
				let v = f(x, y);
				let pos = {
					x: x / this.scaleX,
					y: v / this.scaleY,
					z: y / this.scaleZ
				};
				// if (pos.y > 2) continue;
				let vp1 = mainCamera.ProjectToCanvas(pos);
				let vp2 = mainCamera.ProjectToCanvas({ x: pos.z, y: (f(y, x) / this.scaleY), z: pos.x });
				if (x == -this.scaleX) {
					// d.rect(vp1.x, vp1.y, 1, 1, "white", "white");
				} else {
					if (this.withColor) {
						d.line(vp1.x, vp1.y, pastPos1.x, pastPos1.y, inRgb((pos.y ** 0.5) * 255, 0, 255 - (pos.y ** 0.5) * 255, 1));
						d.line(vp2.x, vp2.y, pastPos2.x, pastPos2.y, inRgb((pos.y ** 0.5) * 255, 0, 255 - (pos.y ** 0.5) * 255, 1));
					} else {
						// if (pos.y > 1 || pos.y < -1) {
						// 	pastPos1 = vp1;
						// 	pastPos2 = vp2;
						// 	continue;
						// }
						// if (!mainCamera.isOnScreen(vp1) || !mainCamera.isOnScreen(vp2)) {
						// 	pastPos1 = vp1;
						// 	pastPos2 = vp2;
						// 	continue;
						// }
						ctx.moveTo(pastPos1.x, pastPos1.y);
						ctx.lineTo(vp1.x, vp1.y);

						ctx.moveTo(pastPos2.x, pastPos2.y);
						ctx.lineTo(vp2.x, vp2.y);
					}
				}
				pastPos1 = vp1;
				pastPos2 = vp2;
			}
		}
		if (!this.withColor)
			ctx.stroke();
	}
	GetPositionOnGraph(x,z) {
		return {x:x/this.scaleX, z: z/this.scaleZ};
	}
	ComplexPow(x,p) {
		return Math.pow(x, p);
	}
}
var mainGraph = new ComplexGraph();

function render() {
	deltaTime = (new Date() - startTime);
	startTime = new Date();
	fps += 1000/deltaTime;
	if (frame % frameCountForSample == 0) {
		rFps = fps/frameCountForSample;
		fps = 0;
	}
	
	let speed = 0.002*deltaTime;
	if (input.keyboard.char == "w") { 
		mainCamera.position.x += mainCamera.forward.x*speed;
		mainCamera.position.y += mainCamera.forward.y*speed;
		mainCamera.position.z += mainCamera.forward.z*speed;
	}
	if (input.keyboard.char == "a") { 
		mainCamera.position.x += -mainCamera.right.x*speed;
		mainCamera.position.y += -mainCamera.right.y*speed;
		mainCamera.position.z += -mainCamera.right.z*speed;
	}
	if (input.keyboard.char == "s") { 
		mainCamera.position.x += -mainCamera.forward.x*speed;
		mainCamera.position.y += -mainCamera.forward.y*speed;
		mainCamera.position.z += -mainCamera.forward.z*speed;
	}
	if (input.keyboard.char == "d") { 
		mainCamera.position.x += mainCamera.right.x*speed;
		mainCamera.position.y += mainCamera.right.y*speed;
		mainCamera.position.z += mainCamera.right.z*speed;
	}
	if (input.keyboard.char == "r") { 
		mainCamera.position.x += mainCamera.up.x*speed;
		mainCamera.position.y += mainCamera.up.y*speed;
		mainCamera.position.z += mainCamera.up.z*speed;
	}
	if (input.keyboard.char == "f") { 
		mainCamera.position.x += -mainCamera.up.x*speed;
		mainCamera.position.y += -mainCamera.up.y*speed;
		mainCamera.position.z += -mainCamera.up.z*speed;
	}

	d.clear("black");

	mainGraph.Draw();

	let dir = mainCamera.ViewportPosToRay(input.mouse.position);
	let t = -mainCamera.position.y / dir.y;
	let pos = {
		x: mainCamera.position.x + dir.x * t,
		z: mainCamera.position.z + dir.z * t
	};
	let vpos = mainCamera.ProjectToCanvas({x:pos.x,y:0,z:pos.z});
	d.circle(vpos.x,vpos.y,3,"blue","blue");

	// for (let k = 0; k < 1; k++) {
	// 	// let x0 = (-1+math.getRandomFromArray(k)*2)*2, z0 = (-1+math.getRandomFromArray(100+k)*2)*2;
	// 	let x0 = pos.x*mainGraph.scaleX, z0 = pos.z*mainGraph.scaleZ;
	// 	for (let i = 0; i < mainGraph.planeEquations.length; i++) {
	// 		let p = mainGraph.GetPositionOnGraph(x0, z0);

	// 		let pos = { x: p.x, y: mainGraph.planeEquations[i].eq(x0, z0) / mainGraph.scaleY, z: p.z };
	// 		let vpos = mainCamera.ProjectToCanvas(pos);

	// 		let deriative = math.getXzEqDeriative(mainGraph.planeEquations[i].eq, x0, z0, 0.00000001);
	// 		let dx0 = deriative.x;
	// 		let dz0 = deriative.z;

	// 		d.circle(vpos.x, vpos.y, 3, "white", "white");
	// 		// d.txt("x = " + x0.toFixed(3), vpos.x, vpos.y, "", inRgb(255, 255, 255, 0.3));
	// 		// d.txt("y = " + (pos.y * mainGraph.scaleY).toFixed(3), vpos.x, vpos.y + 16, "", inRgb(255, 255, 255, 0.3));
	// 		// d.txt("z = " + z0.toFixed(3), vpos.x, vpos.y + 32, "", inRgb(255, 255, 255, 0.3));
		
	// 		let v = 0.01;
	// 		let np = { x: x0, y: pos.y * mainGraph.scaleY, z: z0 };
	// 		let nv = { x: dx0, z: dz0 };
	// 		let j = 0;
	// 		ctx.beginPath();
	// 		ctx.strokeStyle = inRgb(255,0,0,0.4);
	// 		ctx.moveTo(vpos.x, vpos.y);
	// 		for (j = 0; j < 512; j++) {
	// 			deriative = math.getXzEqDeriative(mainGraph.planeEquations[i].eq, np.x, np.z, 0.00000001);
	// 			let dx = deriative.x;
	// 			let dz = deriative.z;

	// 			// if (nv.x ** 2 + nv.y ** 2 < 0.1 ** 2) break;

	// 			nv.x += -dx;
	// 			nv.z += -dz;

	// 			np.x += nv.x * v;
	// 			np.z += nv.z * v;

	// 			nv.x *= 0.99;
	// 			nv.z *= 0.99;
	// 			np.y = mainGraph.planeEquations[i].eq(np.x, np.z);

	// 			let vnp = mainCamera.ProjectToCanvas({ x: np.x / mainGraph.scaleX, y: np.y / mainGraph.scaleY, z: np.z / mainGraph.scaleZ });
	// 			ctx.lineTo(vnp.x, vnp.y);
	// 			ctx.moveTo(vnp.x, vnp.y);
	// 		}
	// 		ctx.stroke();
	// 		let vnp = mainCamera.ProjectToCanvas({ x: np.x / mainGraph.scaleX, y: np.y / mainGraph.scaleY, z: np.z / mainGraph.scaleZ });
	// 		d.circle(vnp.x, vnp.y, 1, "yellow", "yellow");
	// 		d.line(vpos.x,vpos.y, vnp.x,vnp.y,inRgb(255,255,0,0.5));
	// 		deriative = math.getXzEqDeriative(mainGraph.planeEquations[i].eq, np.x, np.z, 0.00000001);
		
	// 		// d.txt("x = " + np.x.toFixed(3), vnp.x, vnp.y, "", inRgb(255, 255, 0, 0.3));
	// 		// d.txt("y = " + (np.y).toFixed(3), vnp.x, vnp.y + 16, "", inRgb(255, 255, 0, 0.3));
	// 		// d.txt("z = " + np.z.toFixed(3), vnp.x, vnp.y + 32, "", inRgb(255, 255, 0, 0.3));
	// 	}
	// }

	// fovSlider.draw();
	// fovSlider.control();
	for (let i = 0; i < sliders.length; i++) {
		sliders[i].draw();
		sliders[i].control();
	}


	d.txt(Math.round(rFps), 1, 16, "", "white");
	frame++;
	requestAnimationFrame(render);
};

// d.clear("black");
// for (let y = 0; y < 500; y++) { 
// 	for (let x = 0; x < 500; x++) { 
// 		let v = math.random([x/500,y/500])[0];
// 		d.rect(50 + x, 50 + y, 1, 1, inRgb(v*255, v*255, v*255, 1));
// 	}
// }
requestAnimationFrame(render);