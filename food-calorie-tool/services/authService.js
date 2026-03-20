const User = require('../models/User');
const { resolveUserRole } = require('../lib/auth');

function createAuthPayload(user) {
  const role = user.role || resolveUserRole(user.email);

  return {
    user: {
      email: user.email,
      userId: user._id,
      role,
    },
  };
}

async function syncUserRole(user) {
  const expectedRole = resolveUserRole(user.email);

  if (user.role === expectedRole) {
    return user;
  }

  if (typeof user.save === 'function') {
    user.role = expectedRole;
    await user.save();
    return user;
  }

  return User.findByIdAndUpdate(user._id, { role: expectedRole }, { new: true });
}

module.exports = {
  createAuthPayload,
  syncUserRole,
};
