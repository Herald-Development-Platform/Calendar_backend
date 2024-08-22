const makePascalCase = (string) => {
    return string
        .split(' ').filter(v=>v.trim().length>0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const generateRandomString = (length = 6) => {
    return Math.random().toString(20).substring(2, length);
}


module.exports = {
    makePascalCase,
    generateRandomString,
};