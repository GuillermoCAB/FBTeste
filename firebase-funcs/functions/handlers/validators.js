exports.isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};

exports.isEmailInvalid = email => {
  if (email.indexOf("@") == -1) {
    return true;
  } else if (email.indexOf(".com") == -1) {
    return true;
  } else {
    return false;
  }
};

exports.isPassInvalid = pass => {
  if (pass.length < 8) {
    return true;
  } else {
    return false;
  }
};
