const HttpError = require('../models/http-error');
const Category = require('../models/category');
const Brand = require('../models/brand');

// GET /api/metadata/categories - Get all categories
exports.getCategories = async (req, res, next) => {
    let categories;
    try {
        categories = await Category.find();
    } catch (err) {
        const error = new HttpError('Fetching categories failed, please try again.', 500);
        return next(error);
    }
    
    res.json({ categories: categories.map(c => c.toObject({ getters: true })) });
};

// GET /api/metadata/brands - Get all brands
exports.getBrands = async (req, res, next) => {
    let brands;
    try {
        brands = await Brand.find();
    } catch (err) {
        const error = new HttpError('Fetching brands failed, please try again.', 500);
        return next(error);
    }
    
    res.json({ brands: brands.map(b => b.toObject({ getters: true })) });
};

// POST /api/metadata/categories - Create category
exports.createCategory = async (req, res, next) => {
    const { name, type, description, image } = req.body;
    
    const createdCategory = new Category({
        name,
        type,
        description,
        image
    });
    
    try {
        await createdCategory.save();
    } catch (err) {
        const error = new HttpError('Creating category failed, please try again.', 500);
        return next(error);
    }
    
    res.status(201).json({ category: createdCategory.toObject({ getters: true }) });
};

// POST /api/metadata/brands - Create brand
exports.createBrand = async (req, res, next) => {
    const { name, description, logo, image } = req.body;
    
    const createdBrand = new Brand({
        name,
        description,
        logo,
        image
    });
    
    try {
        await createdBrand.save();
    } catch (err) {
        const error = new HttpError('Creating brand failed, please try again.', 500);
        return next(error);
    }
    
    res.status(201).json({ brand: createdBrand.toObject({ getters: true }) });
};

