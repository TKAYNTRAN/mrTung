var express = require('express');
var router = express.Router();

let bcrypt = require('bcrypt');
let userModel = require('../schemas/users');
let { checkLogin, checkRole } = require('../utils/authHandler');

// Role hierarchy for permission checks
let ROLE_HIERARCHY = {
  'CUSTOMER': 0,
  'ADMIN': 1,
  'SUPER_ADMIN': 2
};

// Helper: Check if email format is valid
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper: Get current user's role
async function getCurrentUserRole(userId) {
  let user = await userModel.findById(userId);
  return user ? user.role : null;
}

function toUserResponse(user) {
  let obj = user.toObject ? user.toObject() : user;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
    password: undefined,
  };
}

async function buildUniqueUsername(seed) {
  let base = (seed || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  let username = base;
  let count = 0;

  while (await userModel.findOne({ username })) {
    count += 1;
    username = `${base}${count}`;
  }

  return username;
}

router.get('/', checkLogin, checkRole('ADMIN'), async function (req, res) {
  try {
    let result = await userModel.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.send(result.map(toUserResponse));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/:id', checkLogin, checkRole('ADMIN'), async function (req, res) {
  try {
    let result = await userModel.findOne({ _id: req.params.id, isDeleted: false });
    if (!result) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.send(toUserResponse(result));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.post('/', checkLogin, checkRole('ADMIN'), async function (req, res) {
  try {
    let email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).send({ message: 'Email is required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).send({ message: 'Invalid email format' });
    }

    let result = await userModel.findOne({ email });
    if (result) {
      return res.status(400).send({ message: 'Email already exists' });
    }

    let seedUsername = req.body.username || email.split('@')[0];
    let username = await buildUniqueUsername(seedUsername);

    let plainPassword = req.body.password || 'Admin@123';
    let hashedPassword = bcrypt.hashSync(plainPassword, 10);

    let requestedRole = req.body.role || 'CUSTOMER';
    
    // Check role assignment constraints
    if (!['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'].includes(requestedRole)) {
      return res.status(400).send({ message: 'Invalid role' });
    }
    
    let currentUserRole = await getCurrentUserRole(req.userId);
    let currentHierarchy = ROLE_HIERARCHY[currentUserRole];
    let requestedHierarchy = ROLE_HIERARCHY[requestedRole];
    
    // Only SUPER_ADMIN can create ADMIN/SUPER_ADMIN users
    if (requestedHierarchy > 0 && currentUserRole !== 'SUPER_ADMIN') {
      return res.status(403).send({ message: 'Only SUPER_ADMIN can create privileged users' });
    }

    let newItem = await userModel.create({
      username,
      password: hashedPassword,
      email,
      name: req.body.name || username,
      phone: req.body.phone || '',
      role: requestedRole,
      active: req.body.active !== false,
    });

    res.status(201).send(toUserResponse(newItem));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.put('/:id/role', checkLogin, checkRole('SUPER_ADMIN'), async function (req, res) {
  try {
    let role = req.body.role;
    if (!role || !['SUPER_ADMIN', 'ADMIN', 'CUSTOMER'].includes(role)) {
      return res.status(400).send({ message: 'Invalid role' });
    }
    
    // Prevent self-role-change (must be done by another SUPER_ADMIN)
    if (req.params.id === req.userId) {
      return res.status(403).send({ message: 'Cannot change your own role' });
    }

    let updatedItem = await userModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { role },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.send(toUserResponse(updatedItem));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.delete('/:id', checkLogin, checkRole('SUPER_ADMIN'), async function (req, res) {
  try {
    // Prevent self-deletion
    if (req.params.id === req.userId) {
      return res.status(403).send({ message: 'Cannot delete your own account' });
    }
    
    let deletedItem = await userModel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!deletedItem) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;

