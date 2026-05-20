// 1 Black Money = 2.5 White Money
const RATE = 2.5;

const toWhite = (black) => Number(black) * RATE;
const toBlack = (white) => Number(white) / RATE;

module.exports = { RATE, toWhite, toBlack };
