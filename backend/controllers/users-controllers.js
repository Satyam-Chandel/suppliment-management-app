const HttpError = require('../models/http-error');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// GET /api/users - Get all users
exports.getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError('Fetching users failed, please try again.', 500);
        return next(error);
    }
    
    res.json({ users: users.map(u => u.toObject({ getters: true })) });
};

// POST /api/users/signup - Create new user
exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }
    
    const { name, email, password, role } = req.body;
    
    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError('Signing up failed, please try again later.', 500);
        return next(error);
    }
    
    if (existingUser) {
        const error = new HttpError('User exists already, please login instead.', 422);
        return next(error);
    }
    
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError('Could not create user, please try again.', 500);
        return next(error);
    }
    
    const createdUser = new User({
        name,
        email,
        password: hashedPassword,
        role: role || 'staff',
        image: req.file ? req.file.path : 'https://via.placeholder.com/150'
    });
    
    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Signing up failed, please try again.', 500);
        return next(error);
    }
    
    let token;
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            process.env.JWT_SECRET || 'supersecret_dont_share',
            { expiresIn: '1h' }
        );
    } catch (err) {
        const error = new HttpError('Signing up failed, please try again.', 500);
        return next(error);
    }
    
    res.status(201).json({ 
        userId: createdUser.id, 
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        token: token 
    });
};

// POST /api/users/login - User login
exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    
    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError('Logging in failed, please try again later.', 500);
        return next(error);
    }
    
    if (!existingUser) {
        const error = new HttpError('Invalid credentials, could not log you in.', 403);
        return next(error);
    }
    
    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        const error = new HttpError('Could not log you in, please check your credentials and try again.', 500);
        return next(error);
    }
    
    if (!isValidPassword) {
        const error = new HttpError('Invalid credentials, could not log you in.', 403);
        return next(error);
    }
    
    let token;
    try {
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            process.env.JWT_SECRET || 'supersecret_dont_share',
            { expiresIn: '1h' }
        );
    } catch (err) {
        const error = new HttpError('Logging in failed, please try again.', 500);
        return next(error);
    }
    
    res.json({
        userId: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        token: token
    });
};

// PATCH /api/users/:id - Update user
exports.updateUser = async (req, res, next) => {
    const { name, email, role } = req.body;
    const userId = req.params.id;
    
    let user;
    try {
        user = await User.findById(userId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update user.', 500);
        return next(error);
    }
    
    if (!user) {
        const error = new HttpError('Could not find user for this id.', 404);
        return next(error);
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    
    try {
        await user.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update user.', 500);
        return next(error);
    }
    
    res.status(200).json({ user: user.toObject({ getters: true }) });
};

// DELETE /api/users/:id - Delete user
exports.deleteUser = async (req, res, next) => {
    const userId = req.params.id;
    
    let user;
    try {
        user = await User.findById(userId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete user.', 500);
        return next(error);
    }
    
    if (!user) {
        const error = new HttpError('Could not find user for this id.', 404);
        return next(error);
    }
    
    try {
        await user.remove();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete user.', 500);
        return next(error);
    }
    
    res.status(200).json({ message: 'User deleted successfully.' });
};

