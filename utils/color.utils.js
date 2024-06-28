function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');

    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return [r, g, b];
}

function colorDifference(hex1, hex2) {
    let [r1, g1, b1] = hexToRgb(hex1);
    let [r2, g2, b2] = hexToRgb(hex2);

    let rDiff = Math.abs(r1 - r2);
    let gDiff = Math.abs(g1 - g2);
    let bDiff = Math.abs(b1 - b2);

    return Math.sqrt(rDiff + gDiff + bDiff);
}
module.exports = {
    hexToRgb,
    colorDifference,
}
