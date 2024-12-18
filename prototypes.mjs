

Array.prototype.random = function () {

    let index = Math.round(Math.random() * this.length);
    return this[index];

}
