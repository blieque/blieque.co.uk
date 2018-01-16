const el = {};
el.canvas = document.querySelector('canvas');

const ctx = el.canvas.getContext('2d');
const pixelRatio = Math.round(window.devicePixelRatio + 0.5);

const resize = function resize() {
    el.canvas.width = window.innerWidth;
    el.canvas.height = window.innerHeight;
    draw();
};

const draw = function draw() {
    const {width, height} = el.canvas;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fff';
    for (let y = 0; y < height; y += 20) {
        for (let x = 0; x < width; x += 10) {
            if (Math.random() > 0.995) {
                for (let i = 0; i < 10; i++) {
                    ctx.fillRect(x + i, y + (i * 2), 1, 2);
                }
            }
        }
    }
};

window.addEventListener('resize', resize);
resize();
