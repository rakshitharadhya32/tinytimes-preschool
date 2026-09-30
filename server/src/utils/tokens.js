const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = { signToken };
