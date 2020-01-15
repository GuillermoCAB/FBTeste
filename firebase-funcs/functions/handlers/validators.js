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

exports.reduceUserDetails = data => {
  let userDetails = {};

  if (!this.isEmpty(data.bio.trim())) userDetails.bio = data.bio;
  if (!this.isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== 'http') {
      userDetails.website = `http://${data.website.trim()}`
    } else userDetails.website = data.website;
  }
  if (!this.isEmpty(data.location.trim())) userDetails.location = data.location;

  return userDetails;
}