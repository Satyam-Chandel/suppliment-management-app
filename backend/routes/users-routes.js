const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// Public routes
router.post('/signup',
    fileUpload.single('image'),
    [
        check('name').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({ min: 6 })
    ],
    usersControllers.signup
);

router.post('/login', usersControllers.login);

// Protected routes
router.use(checkAuth);

router.get('/', usersControllers.getUsers);
router.patch('/:id', usersControllers.updateUser);
router.delete('/:id', usersControllers.deleteUser);

module.exports = router;

