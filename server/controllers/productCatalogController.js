

const Product = require('../models/Product');
const Category = require('../models/Category');

const normalizeText = (text) => {
    if (!text) return '';
    
    const boldMap = {
        '𝐀': 'A', '𝐁': 'B', '𝐂': 'C', '𝐃': 'D', '𝐄': 'E', '𝐅': 'F', '𝐆': 'G', '𝐇': 'H', '𝐈': 'I', '𝐉': 'J',
        '𝐊': 'K', '𝐋': 'L', '𝐌': 'M', '𝐍': 'N', '𝐎': 'O', '𝐏': 'P', '𝐐': 'Q', '𝐑': 'R', '𝐒': 'S', '𝐓': 'T',
        '𝐔': 'U', '𝐕': 'V', '𝐖': 'W', '𝐗': 'X', '𝐘': 'Y', '𝐙': 'Z',
        '𝐚': 'a', '𝐛': 'b', '𝐜': 'c', '𝐝': 'd', '𝐞': 'e', '𝐟': 'f', '𝐠': 'g', '𝐡': 'h', '𝐢': 'i', '𝐣': 'j',
        '𝐤': 'k', '𝐥': 'l', '𝐦': 'm', '𝐧': 'n', '𝐨': 'o', '𝐩': 'p', '𝐪': 'q', '𝐫': 'r', '𝐬': 's', '𝐭': 't',
        '𝐮': 'u', '𝐯': 'v', '𝐰': 'w', '𝐱': 'x', '𝐲': 'y', '𝐳': 'z'
    };
    
    let normalized = '';
    for (let char of text) {
        normalized += boldMap[char] || char;
    }
    return normalized;
};

const getCatalogProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const total = await Product.countDocuments({ isActive: true });
        const products = await Product.find({ isActive: true })
            .populate('category', 'name slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedProducts = products.map(product => ({
            id: product.productId,
            title: normalizeText(product.name),
            body_html: product.description || '',
            vendor: normalizeText(product.brand) || 'Factory Sale',
            product_type: product.category?.name || 'T-Shirt',
            created_at: product.createdAt,
            handle: product.slug,
            updated_at: product.updatedAt,
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
            status: product.isActive ? 'active' : 'draft',
            variants: (product.sizes || []).map(size => ({
                id: size.variantId,
                title: size.size,
                price: product.price.toString(),
                sku: product.sku || '',
                quantity: size.stock,                           // ✅ नवीन: quantity field
                created_at: product.createdAt,
                updated_at: product.updatedAt,
                taxable: true,
                grams: product.weight || 0,
                image: {
                    src: product.images?.[0]?.url || ''
                },
                weight: (product.weight || 0) / 1000,
                weight_unit: 'kg'
            })),
            image: {
                src: product.images?.[0]?.url || ''
            }
        }));

        res.status(200).json({
            data: {
                total: total,
                products: formattedProducts
            }
        });

    } catch (error) {
        console.error('Get Catalog Products Error:', error);
        res.status(500).json({
            error: 'Failed to fetch products',
            message: error.message
        });
    }
};

const getCatalogCollections = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const total = await Category.countDocuments({ isActive: true });
        const categories = await Category.find({ isActive: true })
            .sort({ sortOrder: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedCollections = categories.map(category => ({
            id: category.categoryId,                        // ✅ बदल: numeric ID
            updated_at: category.updatedAt,
            body_html: category.description || `<p>${normalizeText(category.name)} collection</p>`,
            handle: category.slug,
            image: {
                src: category.image?.url || ''
            },
            title: normalizeText(category.name),
            created_at: category.createdAt
        }));

        res.status(200).json({
            data: {
                total: total,
                collections: formattedCollections
            }
        });

    } catch (error) {
        console.error('Get Catalog Collections Error:', error);
        res.status(500).json({
            error: 'Failed to fetch collections',
            message: error.message
        });
    }
};

const getCatalogProductsByCollection = async (req, res) => {
    try {
        const { collection_id } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        if (!collection_id) {
            return res.status(400).json({
                error: 'collection_id is required',
                message: 'Please provide collection_id parameter'
            });
        }

        // ✅ बदल: numeric categoryId ने search कर
        const collection = await Category.findOne({ 
            categoryId: parseInt(collection_id),  // numeric ID ने search
            isActive: true 
        });

        if (!collection) {
            return res.status(404).json({
                error: 'Collection not found',
                message: `No collection found with id: ${collection_id}`
            });
        }

        const total = await Product.countDocuments({ 
            isActive: true, 
            category: collection._id   // ← MongoDB _id वापर (हे बरोबर आहे)
        });

        const products = await Product.find({ 
            isActive: true, 
            category: collection._id   // ← MongoDB _id वापर
        })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const formattedProducts = products.map(product => ({
            id: product.productId,
            title: normalizeText(product.name),
            body_html: product.description || '',
            vendor: normalizeText(product.brand) || 'Factory Sale',
            product_type: product.category?.name || 'T-Shirt',
            created_at: product.createdAt,
            handle: product.slug,
            updated_at: product.updatedAt,
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
            status: product.isActive ? 'active' : 'draft',
            variants: (product.sizes || []).map(size => ({
                id: size.variantId,
                title: size.size,
                price: product.price.toString(),
                sku: product.sku || '',
                quantity: size.stock,
                created_at: product.createdAt,
                updated_at: product.updatedAt,
                taxable: true,
                grams: product.weight || 0,
                image: {
                    src: product.images?.[0]?.url || ''
                },
                weight: (product.weight || 0) / 1000,
                weight_unit: 'kg'
            })),
            image: {
                src: product.images?.[0]?.url || ''
            }
        }));

        res.status(200).json({
            data: {
                total: total,
                products: formattedProducts
            }
        });

    } catch (error) {
        console.error('Get Catalog Products By Collection Error:', error);
        res.status(500).json({
            error: 'Failed to fetch products by collection',
            message: error.message
        });
    }
};

module.exports = {
    getCatalogProducts,
    getCatalogCollections,
    getCatalogProductsByCollection
};