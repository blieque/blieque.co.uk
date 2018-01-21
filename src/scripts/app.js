// TILES CACHE

const tiles = [
    // "X"
    [[0,12], [1,11], [2,10], [3,9], [4,8], [5], [6]],
    // "X" alternative
    [[0,12], [1,11], [2,10], [3,9], [4,8], [7], [6]],
    // "/"
    [[12], [11], [10], [9], [8], [7], [6]],
    // "\"
    [[0], [1], [2], [3], [4], [5], [6]],
    // "/" with small cross
    [[12], [11], [10], [9], [8,4], [7,5], [6]],
    // "\" with small cross
    [[0], [1], [2], [3], [4,8], [5,7], [6]],
    // "/" with small cross alternative
    [[12], [11], [10], [9], [8,4], [5], [6]],
    // "\" with small cross alternative
    [[0], [1], [2], [3], [4,8], [7], [6]],
    /* The tile patterns were removed for feeling a bit too cluttered.
    // diamond
    [[0,12], [1,11], [2,6,10], [3,5,7,9], [4,8], [3,9], [2,10]],
    // "X" with small gaps
    [[0,12], [1,11], [2,10], [], [4,8], [5,7], [6]],
    // "X" without centre
    [[0,12], [1,11], [2,10], [3,9], [], [], []],
    */
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
     * ensures that 49%-81% of the tiles will be blank, with a slight bias
     * towards the lower end.
     */
    const spacePortion = (0.7 + Math.random() * 0.2) ** 2;
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
        pickCount: picks.length,
    };
};

const generateScheme = function generateScheme() {
    /* Background lightness has a pretty strong bias towards 50%, making very
     * light and very dark backgrounds a lot rarely than they'd otherwise be.
     */
    //const backgroundLightness = ((Math.random() - 0.5) * 1.58) ** 3 + 0.5;
    const x = Math.random();
    const backgroundLightness = (1.1 * (x - 0.5)) ** 3 + 0.1 * x + 0.17;
    let lightnessRange;
    let lightnessOffset;

    /* A lightness range is generated for the swatches, so that all values are
     * darker than the background.
     */
    lightnessRange = (1 - backgroundLightness) * 0.8;
    lightnessOffset = backgroundLightness + lightnessRange * 0.25;

    //const lightnessScale = 0.3 + 0.5 * Math.random();
    const lightnessScale = 0.8;
    lightnessOffset +=
        lightnessRange * (1 - lightnessScale) * Math.random();
    lightnessRange *= lightnessScale;

    /* A random base hue is generated, and used for the background. A hue range
     * is generated for the swatches, and is offset by some amount. This allows
     * for some schemes with a similar-hue background, and others with more
     * complementary colours.
     */
    const baseHue = Math.random() * 360;
    const hueRange = 30 + 90 * Math.random();
    const hueOffsetMax = 90;
    const hueOffset =
        -hueOffsetMax + hueOffsetMax * 2 * Math.random() - (hueRange / 2);

    /* Saturation range, with a bias towards the upper end. */
    const saturation = 0.4 + 0.35 * (1 - (1 - Math.random()) ** 1.5);

    /* Create the array to hold HSL colour arrays. */
    const scheme = [];

    /* Generate and add the swatch colours to the array. Hues are evenly
     * distributed within the previously allocated range, saturation is uniform
     * for all swatches and generated within a range, and lightness is generated
     * per-swatch within a range.
     */
    const hueStep = hueRange / 7;
    for (let i = 0; i < 8; i++) {
        const hueRaw = baseHue + hueOffset + hueStep * i;
        const hue = Math.round((hueRaw + 360) % 360);
        const lightness = lightnessOffset + lightnessRange * Math.random();
        scheme.push([hue, saturation, lightness]);
    }

    /* Add the background colour last, and add a getter function to give the
     * colour an alias.
     */
    scheme.push([baseHue, saturation * 0.5, backgroundLightness]);
    Object.defineProperty(scheme, 'background', { get(){
        return scheme[scheme.length - 1];
    } });

    return scheme;
};

/* HSL to RGB hex converter, based on an algorithm available on Wikipedia.
 */
const hslToHex = function hslToHex(hue, saturation, lightness) {
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const hueDivision = hue / 60;
    const x = chroma * (1 - Math.abs(hueDivision % 2 - 1));

    /* Performs the mapping from the divided hue value to one of six possible
     * initial RGB arrays
     */
    let hueDivisionFloor = Math.floor(hueDivision);
    let rgb;
    if (hueDivisionFloor % 2 === 0) {
        rgb = [chroma, x, 0];
    } else {
        hueDivisionFloor--;
        rgb = [x, chroma, 0];
    }
    for (let i = 0; i < hueDivisionFloor; i += 2) {
        rgb.push(rgb.shift());
    }

    /* Adjusts the initial RGB array values by a calculated amount to match
     * lightness with the HSL colour.
     */
    const m = lightness - (chroma / 2);
    for (let i = 0; i < 3; i++) {
        rgb[i] = Math.floor((rgb[i] + m) * 255);
    }

    /* Convert the RGB array to a hex string. */
    return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
};

/* Draw a new random pattern in the canvas, using a provided distribution and
 * colour scheme.
 */
const draw = function draw(distribution, scheme) {
    const {width, height} = el.canvas;

    ctx.fillStyle = scheme.background;
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
                const colourIndex = Math.floor(
                    distribution.pickCount * (cellEntropy * 10000 % 1));
                ctx.fillStyle = scheme[colourIndex];
                for (let py = 0; py < 13; py++) {
                    for (let px = 0; px < 13; px++) {
                        if (tile[py][px]) {
                            ctx.fillRect(x + px, y + (py * 2), 1, 2);
                        }
                    }
                }
            }
        }
    }
};

/* Adjust the size of the canvas to the size of the screen, and call the
 * generator function to refresh the pattern.
 */
const resize = function resize() {
    el.canvas.width = el.canvasFrame.clientWidth;
    el.canvas.height = el.canvasFrame.clientHeight;
    updatePattern();
};

/* Optionally generates a new tile distribution and colour scheme, then calls
 * `draw()' to draw a pattern on the canvas. If a new distribution and scheme
 * are not requested, the last one used will be re-used.
 */
const updatePattern = (() => {
    let distribution;
    let scheme;

    return (newEntropy) => {
        if (newEntropy || !distribution) {
            distribution = generateDistribution();
            scheme = generateScheme();
            for (let i = 0; i < 9; i++) {
                scheme[i] = hslToHex(...scheme[i]);
            }
        }
        draw(distribution, scheme);
        el.nameHeading.style.setProperty('--shadow-color', scheme[0]);
    };
})();

// BOOTSTRAPPY STUFF

const el = {};
el.canvasFrame = document.querySelector('.layout__canvas-frame');
el.canvas = document.querySelector('canvas');
el.nameHeading = document.querySelector('.content__name');

const ctx = el.canvas.getContext('2d');
const pixelRatio = Math.round(window.devicePixelRatio + 0.5);

window.addEventListener('resize', resize);
resize(); // Will also call `updatePattern()'.
window.addEventListener('click', () => {
    updatePattern(true);
});
