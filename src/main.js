
const canvas = document.querySelector('.canvas');
const sImage = document.querySelector('.image');
canvas.width = canvas.height = 256;
sImage.width = sImage.height = 256;
	// const ctx = sImage.getContext("2d", {willReadFrequently: true});
const ctx = sImage.getContext("2d");
const ptx = canvas.getContext("2d");
const content = sImage.parentNode.parentNode;
const textNode = document.querySelector('.text');

const pos = {
	s: [],
	d: []
};
let bm, imageData, spos;
const toogle = () => {
	if (spos) {
		content.classList.add('active');
	} else {
		content.classList.remove('active');
	}
}

canvas.addEventListener('click', ev => { // клик на выходной картинке
	if (!spos) return;
	let dpos = [ev.layerX, ev.layerY];
	pos.d.push(dpos);
	spos = undefined;
	toogle();
	drawImg();
});

sImage.addEventListener('click', ev => {	// клик на исходной картинке
	const target = ev.target;
	if (spos) return;

	spos = [ev.layerX, ev.layerY];
	pos.s.push(spos);
	toogle();
	drawImg();

});
const drawImg = () => {		// перерисовка
	ctx.drawImage(bm, 0, 0);
	ctx.font = "20px serif";
	ctx.strokeStyle = "blue";
	pos.s.forEach((p, i) => {
		ctx.beginPath();
		ctx.arc(p[0], p[1], 10, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.fillText(i, p[0] - 6, p[1] + 6);
	});
	ctx.strokeStyle = "red";
	pos.d.forEach((p, i) => {
		ctx.beginPath();
		ctx.arc(p[0], p[1], 10, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.fillText(i, p[0] - 6, p[1] + 6);
	});
	textNode.innerHTML = JSON.stringify(pos, null, 2);
	if (imageData) transf();
};

const getImg = async (src) => {		// получение исходной картинки
	bm = await fetch(src, {}).then(resp => resp.blob()).then(createImageBitmap);
	drawImg();
	imageData = ctx.getImageData(0, 0, 256, 256);
	console.log('bm', imageData)
}
getImg('./tile.png');

const transf = () => {	// проходим по всем пикселам
	let ch = 4;
	let {width, height, data} = imageData;
	let out = new ImageData(width, height);
	let outd = out.data;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const pnew = project([x, y],  pos);
			const i = pnew[1] * width + pnew[0];
			const o = y * width + x;

			const r = data[i * ch + 0]; outd[o * ch + 0] = r;
			const g = data[i * ch + 1]; outd[o * ch + 1] = g;
			const b = data[i * ch + 2]; outd[o * ch + 2] = b;
			const a = data[i * ch + 3]; outd[o * ch + 3] = a;
			
		}
	}
	ptx.putImageData(out, 0, 0);
}

const norm = (p,q) => {
	let [x1,y1] = p;
	let [x2,y2] = q;
	return [((x1-x2)^2+(y1-y2)^2) / (1+(x1-x2)^2+(y1-y2)^2)];
}

const project = (p, data) => {	// перепроектирование
	let [x, y] = p; let [smx, smy, sm] = [0, 0, 0]; let n = data.s.length;
	// xnew = sum(d[i]*product(norm(p,s[(i+j) % n])/norm(s[i],s[(i+j)%n]),j=0..(n-1)),i=0..(n-1))
	data.s.forEach((si, i) => {
		//let [six, siy] = si;
		if (data.d[i]) {
			let [dix, diy] = data.d[i];
			//if (sx > dx) { // при x входной точки > x выходной точки - берем 0 точку для всех
			//	x = 0;
			//	y = 0;
			//smx = smx + dx *
			// console.log('dix, diy', six, siy, px, py, dix, diy);
			//}
			let pr = 1;
			data.s.forEach((sj, j) => {
				if (j !== i) {
					//let [sjx, sjy] = sj;
					let nm = norm(p, sj) / norm(si, sj);
					pr = pr * nm;
				}
			});
			smx = smx + dix * pr;
			smy = smy + diy * pr;
			sm = sm + pr;
	// console.log('dx, dy', sx, sy, dx, dy)
			smx = Math.min(256, Math.max(0, smx / sm));
			smy = Math.min(256, Math.max(0, smy / sm));
		}
	});
	return [Math.ceil(smx), Math.ceil(smy)];
}

