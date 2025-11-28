const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Parse duration string to seconds
const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 900;
  }
};

const generateAccessToken = (user) => {
  const expiresIn = process.env.JWT_ACCESS_EXPIRATION || '15m';
  const expiresInSeconds = parseDuration(expiresIn);

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: expiresInSeconds }
  );

  return { token, expiresIn: expiresInSeconds };
};

const generateRefreshToken = (user) => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRATION || '30d';
  const expiresInSeconds = parseDuration(expiresIn);

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: expiresInSeconds }
  );

  return { token, expiresIn: expiresInSeconds };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  parseDuration
};
