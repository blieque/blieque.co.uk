/* TILES CACHE */

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
        const row = tile[y].slice().reverse();
        tile.push(row);
    }

    return tile;
});

/* FUNCTIONS */

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
    const tilesCopy = tiles.slice();
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
    const x = Math.random();
    const backgroundLightness = (1.1 * (x - 0.5)) ** 3 + 0.1 * x + 0.17;
    let lightnessRange;
    let lightnessOffset;

    /* A lightness range is generated for the swatches, so that all values are
     * darker than the background.
     */
    lightnessRange = (1 - backgroundLightness) * 0.8;
    lightnessOffset = backgroundLightness + lightnessRange * 0.25;

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
    addBackgroundGetter(scheme);

    return scheme;
};

/* This is pretty stupid, let's not kid ourselves.
 */
const addBackgroundGetter = function addBackgroundGetter(obj) {
    if (Array.isArray(obj)) {
        Object.defineProperty(obj, 'background', { get(){
            return obj[obj.length - 1];
        } });
    }
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

/* Ease range 0-1 following sine curve.
 */
const ease = function ease(x) {
    return (Math.sin(Math.PI * (Math.min(1, Math.max(0, x)) - 0.5)) + 1) / 2;
};

const pace = 60 / 1000;
const patternSpecs = [];
let linePrevious;
let canvasSpec;
let lastPatternSpec;
let requestID;

/* Draw a new random pattern in the canvas, using a provided distribution and
 * colour scheme.
 */
const draw = function draw(full) {
    requestID = null;

    const time = Date.now();
    const cycleDuration = (canvasSpec.lines + 1) / pace;
    let pops = 0;

    if (full && lastPatternSpec) {
        lastPatternSpec.line = canvasSpec.lines - 1;
        patternSpecs.push(lastPatternSpec);
    }

    patternSpecs.forEach((patternSpec, i) => {
        const patternSpecPrevious = patternSpecs[i - 1];

        const timeElapsedPattern =
            ease((time - patternSpec.startedAt) / cycleDuration) *
            cycleDuration;
        patternSpec.linePrevious = patternSpec.line || canvasSpec.lines;
        patternSpec.line =
            canvasSpec.lines - Math.floor(timeElapsedPattern * pace);

        const lineStart = Math.min(
            full ? canvasSpec.lines - 1 : patternSpec.linePrevious - 1,
            (patternSpecPrevious?.line || canvasSpec.lines) - 1,
        );

        for (let l = lineStart; l >= patternSpec.line; l--) {
            if (canvasSpec.lineCells[l]) {
                for (let i = 0; i < canvasSpec.lineCells[l]; i++) {
                    const x = 12 * (canvasSpec.lineOffset[l] + i);
                    const y = 24 * (l - canvasSpec.lineOffset[l] - i);

                    ctx.fillStyle = patternSpec.scheme.background;
                    ctx.fillRect(x, y, 12, 24);

                    const cellEntropy = Math.random();
                    let tile;
                    patternSpec.distribution.pickPoints.some((pickPoint, i) => {
                        if (cellEntropy < pickPoint) {
                            tile = patternSpec.distribution.picks[i];
                            return true;
                        }
                    });

                    if (tile) {
                        const colourIndex = Math.floor(
                            patternSpec.distribution.pickCount *
                            (cellEntropy * 10000 % 1)
                        );
                        ctx.fillStyle = patternSpec.scheme[colourIndex];
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
        }

        if (patternSpec.line <= 0) {
            pops++;
        }
    });

    for (let i = 0; i < pops; i++) {
        lastPatternSpec = patternSpecs.pop();
    }

    if (patternSpecs.length > 0) {
        requestID = requestAnimationFrame(() => {
            draw();
        });
    }
};

let refresherIsAcknowledged = false;
let idleAnimationCount = -1;

/* Optionally generates a new tile distribution and colour scheme, then calls
 * `draw()' to draw a pattern on the canvas. If a new distribution and scheme
 * are not requested, the last one used will be re-used. A closure is used to
 * store the two arrays privately.
 */
const addNewPattern = function addNewPattern() {
    const distribution = generateDistribution();
    const scheme = generateScheme();
    const schemeHex = scheme.map(c => hslToHex(...c));
    addBackgroundGetter(schemeHex);

    patternSpecs.unshift({
        distribution,
        scheme: schemeHex,
        startedAt: Date.now(),
    });

    if (!requestID) {
        draw();
    }

    setTimeout(
        () => {
            el.refresherDot.style.setProperty('--color', schemeHex.background);
        },
        el.refresherDot.style.getPropertyValue('--color') ? 600 * 0.41 : 0,
    );
    el.metaThemeColor.content = hslToHex(scheme.background[0], 0.3, 0.7);
};

/* Adjust the size of the canvas to the size of the screen, and call the
 * generator function to refresh the pattern.
 */
const resize = function resize() {
    const scale = window.innerWidth > 1000 ? 2 : 1;

    const width =
        Math.ceil(el.canvasFrame.clientWidth * adjustmentRatio / scale);
    const height =
        Math.ceil(el.canvasFrame.clientHeight * adjustmentRatio / scale);
    const widthCells = Math.ceil(width / 12);
    const heightCells = Math.ceil(height / 24);

    el.canvas.width = width;
    el.canvas.height = height;
    el.canvas.style.width = `${width * scale / adjustmentRatio}px`;
    el.canvas.style.height = `${height * scale / adjustmentRatio}px`;

    canvasSpec = {
        width,
        height,
        widthCells,
        heightCells,
        lines: widthCells + heightCells - 1,
        lineCells: [...Array(widthCells + heightCells - 1)].map((_, i) => {
            return Math.min(
                i + 1,
                widthCells,
                heightCells,
                widthCells + heightCells - i - 1,
            );
        }),
        lineOffset: [...Array(widthCells + heightCells - 1)].map((_, i) => {
            return Math.max(0, i - heightCells + 1);
        }),
    };

    draw(true);
};

/* BOOTSTRAPPY STUFF */

const el = {};
el.metaThemeColor = document.querySelector('.meta__theme-color');
el.canvasFrame = document.querySelector('.layout__canvas-frame');
el.canvas = document.querySelector('.layout__canvas');
el.refresher = document.querySelector('.refresher');
el.refresherDot = document.querySelector('.refresher__dot');

const ctx = el.canvas.getContext('2d');

/* For devices whose stupid manufacturers that think a non-integer device pixel
 * ratio is remotely sane.
 */
const adjustmentRatio =
    window.devicePixelRatio / Math.round(window.devicePixelRatio);

const refresh = (() => {
    let dotScale = 1;

    return () => {
        refresherIsAcknowledged = true;

        addNewPattern();
        dotScale *= -1;
        el.refresherDot.style.transform = `scaleY(${dotScale})`;
    }
})();
window.addEventListener('resize', resize);
el.refresher.addEventListener('mousedown', refresh);
window.addEventListener('keypress', (event) => {
    if (event.key.toLowerCase() === 'r') {
        (event.shiftKey ? resize : refresh)();
    }
});

resize();
setTimeout(() => {
    addNewPattern();
}, 200);

const joints = Array.from(document.querySelectorAll([
    '.refresher__upper-arm',
    '.refresher__middle-arm',
    '.refresher__lower-arm',
    '.refresher__hand',
].join()));

const endIdleAnimation = function endIdleAnimation(event) {
    if (event.target == joints[0] && !event.animationName.includes('-part-')) {
        idleAnimationCount++;

        if (refresherIsAcknowledged) {
            joints[0].parentElement.classList.remove('refresher--animate-idle');
            const outroID = idleAnimationCount % 2 == 0 ? 'a' : 'b';
            joints[0].parentElement.classList
                .add(`refresher--animate-outro-${outroID}`);
        }
    }
};

const endIntroAnimation = function endIntroAnimation(event) {
    if (event.target == joints[0] && !event.animationName.includes('-part-')) {
        joints[0].parentElement.classList.remove('refresher--animate-intro');
        joints[0].parentElement.classList.add('refresher--animate-idle');

        joints[0].removeEventListener('animationend', endIntroAnimation);
        joints[0].addEventListener('animationiteration', endIdleAnimation);
        idleAnimationCount = 0;
    }
}

setTimeout(() => {
    if (!refresherIsAcknowledged) {
        joints[0].parentElement.classList.add('refresher--animate-intro');
        joints[0].addEventListener('animationend', endIntroAnimation);
    }
}, 5000);
