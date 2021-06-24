const hasLowerCase = function(str) {
    return (/[a-z]/.test(str));
}

const hasUpperCase = function(str) {
    return (/[A-Z]/.test(str));
}

const specialCharacters = function(str) {
    var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

    if(format.test(str)){
        return true;
    } else {
        return false;
    }
}

const length = function(str) {
    if(str.length < 8) {
      return false;
    } else {
      return true;
    }
}

module.exports = {
  hasLowerCase,
  hasUpperCase,
  specialCharacters,
  length
}
