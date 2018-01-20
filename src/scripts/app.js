// TILES CACHE

const tiles = [
    // "X"
    [[0,12], [1,11], [2,10], [3,9], [4,8], [5,7], [6]],
    // "/"
    [[12], [11], [10], [9], [8], [7], [6]],
    // "\"
    [[0], [1], [2], [3], [4], [5], [6]],
    // "/" with small cross
    [[12], [11], [10], [9], [8,4], [7,5], [6]],
    // "\" with small cross
    [[0], [1], [2], [3], [4,8], [5,7], [6]],
    // diamond
    [[0,12], [1,11], [2,6,10], [3,5,7,9], [4,8], [3,9], [2,10]],
    // "X" with small gaps
    [[0,12], [1,11], [2,10], [], [4,8], [5,7], [6]],
    // "X" without centre
    [[0,12], [1,11], [2,10], [3,9], [], [], []],
].map((tilePrototype) => {
    /* Converts each array of array of numbers above to an array of array of
     * booleans, which avoids the need to call `.includes()' for every pixel we
     * draw on the canvas.
     */
    const tile = [];
    for (let y = 0; y < 7; y++) {
        const row = [];
        for (let x = 0; x < 13; x++) {
            row.push(tilePrototype[y].includes(x));
        }
        tile.push(row);
    }
    /* Goes back up and copies rows 1 to 5, mirroring and shifting them one
     * pixel right, and appends them to the tile map. This halves the required
     * size of the big number arrays above.
     */
    for (let y = 5; y >= 0; y--) {
        const row = tile[y].slice(0).reverse();
        tile.push(row);
    }

    return tile;
});

// FUNCTIONS

const generateDistribution = function generateDistribution() {
    /* I want the highest proportion of the tiles drawn to be blank. This line
     * ensures that 36%-81% of the tiles will be blank, with a slight bias
     * towards the lower end.
     */
    const spacePortion = (0.6 + Math.random() * 0.3) ** 2;
    const pickPortion = 1 - spacePortion;

    /* This block picks 2+ tile patterns from the `tiles' array, and generates
     * random points to give the picked tiles different probabilities of being
     * used.
     */
    const pickCount = 2 + Math.floor(Math.random() * (tiles.length - 2))
    const pickPoints = [];
    const picks = [];
    const tilesCopy = tiles.slice(0);
    for (let i = 0; i < pickCount; i++) {
        /* We only need to generate (x - 1) points to distribute (x) picks, so
         * we don't bother generating a point on the first iteration.
         */
        if (i > 0) {
            /* The random points are scaled by multiplying by `pickPortion' to
             * prevent them from encroaching on holy space-reserved land.
             */
            pickPoints.push(Math.random() * pickPortion);
        }
        const pickIndex = Math.floor(Math.random() * tilesCopy.length);
        picks.push(tilesCopy.splice(pickIndex, 1)[0]);
    }
    pickPoints.push(pickPortion);
    pickPoints.sort();

    return {
        picks,
        pickPoints,
        highestIndex: picks.length - 1,
    };
};

const resize = function resize() {
    el.canvas.width = window.innerWidth;
    el.canvas.height = window.innerHeight;
    draw(generateDistribution());
};

const draw = function draw(distribution) {
    const {width, height} = el.canvas;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fff';
    for (let y = 0; y < height; y += 24) {
        for (let x = 0; x < width; x += 12) {
            const cellEntropy = Math.random();
            let tile;
            distribution.pickPoints.some((pickPoint, i) => {
                if (cellEntropy < pickPoint) {
                    tile = distribution.picks[i];
                    return true;
                }
            });

            if (tile) {
                for (let py = 0; py < 13; py++) {
                    for (let px = 0; px < 13; px++) {
                        if (tile[py][px]) {
                            ctx.fillRect(x + px, y + (py * 2), 1, 2);
                        }
                    }
                }
            }

            /* Draws lines in 0.05% of cells.
            if (Math.random() > 0.995) {
                for (let i = 0; i < 10; i++) {
                    ctx.fillRect(x + i, y + (i * 2), 1, 2);
                }
            }
            */
        }
    }
};

const el = {};
el.canvas = document.querySelector('canvas');

const ctx = el.canvas.getContext('2d');
const pixelRatio = Math.round(window.devicePixelRatio + 0.5);

window.addEventListener('resize', resize);
resize();
