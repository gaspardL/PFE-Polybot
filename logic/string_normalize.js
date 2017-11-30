'use strict';
module.exports = (function() {
    return function(str) {
        return str.toLowerCase() // met en minuscule
            .normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // enlève les accents
    }
})();