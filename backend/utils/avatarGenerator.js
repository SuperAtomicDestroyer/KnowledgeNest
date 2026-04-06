const generateAvatar = (username) => {
  const firstLetter = username.charAt(0).toUpperCase();

  if (firstLetter.match(/[A-Z]/)) {
    return `${firstLetter}.png`;
  }

  return "default.png"; // fallback
};

module.exports = generateAvatar;
