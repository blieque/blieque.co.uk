const toHSLString = function toHSLString(hue, saturation, lightness) {
    hue = Math.round((hue + 360) % 360);
    saturation = Math.round(saturation * 100);
    lightness = Math.round(lightness * 100);

    return `hsl(${hue},${saturation}%,${lightness}%)`;
};

const generateScheme = function generateScheme() {
    const backgroundLightness = ((Math.random() - 0.5) * 1.58) ** 3 + 0.5;
    const darkOnLightThreshold = 0.7;
    let lightnessRange;
    let lightnessOffset;

    if (backgroundLightness > darkOnLightThreshold) {
        lightnessRange = backgroundLightness;
        lightnessOffset = 0;
    } else {
        lightnessRange = (1 - backgroundLightness);
        lightnessOffset = backgroundLightness;
    }

    const lightnessScale = 0.2 + 0.6 * Math.random();
    lightnessOffset +=
        lightnessRange * (1 - lightnessScale) * Math.random();
    lightnessRange *= lightnessScale;

    const baseHue = Math.random() * 360;
    const hueRange = 30 + 90 * Math.random();
    const hueOffsetMax = 90;
    const hueOffset =
        -hueOffsetMax + hueOffsetMax * 2 * Math.random() - (hueRange / 2);
    const saturation = 0.4 + 0.5 * (1 - (1 - Math.random()) ** 1.5);

    const scheme = [];
    scheme.background = [baseHue, saturation * 0.7, backgroundLightness];

    const hueStep = hueRange / 7;
    for (let i = 0; i < 8; i++) {
        const hueRaw = baseHue + hueOffset + hueStep * i;
        const hue = Math.round((hueRaw + 360) % 360);
        const lightness = lightnessOffset + lightnessRange * Math.random();
        scheme.push([hue, saturation, lightness]);
    }

    return scheme;
};

const hslToHex = function hslToHex(hue, saturation, lightness) {
    /* Algorithm from Wikipedia. */
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const hueDivision = hue / 60;
    const x = chroma * (1 - Math.abs(hueDivision % 2 - 1));

    let hueDivisionFloor = Math.floor(hueDivision);
    let rgb;
    if (hueDivisionFloor % 2 === 0) {
        rgb = [chroma, x, 0];
    } else {
        hueDivisionFloor--;
        rgb = [x, chroma, 0];
    }
    for (let i = 0; i < hueDivisionFloor; i += 2) {
        console.log('sheeft');
        rgb.push(rgb.shift());
    }

    const m = lightness - (chroma / 2);
    for (let i = 0; i < 3; i++) {
        rgb[i] = Math.floor((rgb[i] + m) * 255);
    }

    return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
};

const changeItUp = function changeItUp() {
    const scheme = generateScheme();

    document.body.style.backgroundColor = hslToHex(...scheme.background);
    scheme.forEach((color, i) => {
        window[`s${i}`].style.backgroundColor = hslToHex(...color);
    });

    /* Update the hue indicator wheels. */
    const wheels = document.querySelectorAll('.wheel');
    scheme.forEach((color, i) => {
        wheels[i].style.transform = `rotate(${scheme[i][0]}deg)`;
    });
    wheels[8].style.transform = `rotate(${scheme.background[0]}deg)`;
};

changeItUp();
window.addEventListener('click', changeItUp);
