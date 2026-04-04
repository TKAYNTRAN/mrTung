let Coupon = require('../models/Coupon');
let Book = require('../models/Book');

function toIdStr(id) {
    if (!id) return '';
    if (id._id) return id._id.toString();
    if (id.toString) return id.toString();
    return String(id);
}

function isBookEligible(bookId, coupon) {
    let id = toIdStr(bookId);
    let scope = coupon.scope || 'ALL';
    let ids = (coupon.bookIds || []).map(toIdStr);
    if (scope === 'ALL') return true;
    if (scope === 'ONLY_BOOKS') return ids.includes(id);
    if (scope === 'EXCEPT_BOOKS') return !ids.includes(id);
    return true;
}

function eligibleSubtotal(lines, coupon) {
    let e = 0;
    for (let line of lines) {
        if (isBookEligible(line.bookId, coupon)) {
            e += line.lineTotal;
        }
    }
    return e;
}

function eligibleLineCount(lines, coupon) {
    let count = 0;
    for (let line of lines) {
        if (isBookEligible(line.bookId, coupon)) {
            count += 1;
        }
    }
    return count;
}

function computeDiscountAmount(coupon, eligible) {
    if (eligible <= 0) return 0;
    if (coupon.discountType === 'PERCENTAGE') {
        return Math.round(eligible * (coupon.discountValue / 100));
    }
    return Math.min(Math.round(coupon.discountValue), Math.round(eligible));
}

function normalizePayload(body) {
    let data = { ...body };
    if (data.discountPercent != null && data.discountPercent !== '') {
        data.discountType = 'PERCENTAGE';
        data.discountValue = parseFloat(data.discountPercent);
        delete data.discountPercent;
    }
    if (data.validFrom !== undefined) {
        data.startDate = data.validFrom ? new Date(data.validFrom) : null;
        delete data.validFrom;
    }
    if (data.validTo !== undefined) {
        data.endDate = data.validTo ? new Date(data.validTo) : null;
        delete data.validTo;
    }
    if (data.scope === 'ALL') {
        data.bookIds = [];
    }
    if (data.bookIds && !Array.isArray(data.bookIds)) {
        data.bookIds = [data.bookIds];
    }
    return data;
}

function assertDateRange(data, currentCoupon) {
    const hasStartDate = Object.prototype.hasOwnProperty.call(data, 'startDate');
    const hasEndDate = Object.prototype.hasOwnProperty.call(data, 'endDate');

    const startDate = hasStartDate ? data.startDate : (currentCoupon ? currentCoupon.startDate : null);
    const endDate = hasEndDate ? data.endDate : (currentCoupon ? currentCoupon.endDate : null);

    if (!startDate || !endDate) {
        return;
    }

    if (startDate > endDate) {
        throw new Error('Start date cannot be later than end date');
    }
}

function formatCouponDoc(doc) {
    if (!doc) return null;
    let c = doc.toObject ? doc.toObject() : { ...doc };
    return {
        ...c,
        discountPercent: c.discountType === 'PERCENTAGE' ? c.discountValue : null,
        validFrom: c.startDate,
        validTo: c.endDate
    };
}

async function assertCouponBasic(coupon, subtotal) {
    if (!coupon) {
        throw new Error('Coupon not found');
    }
    if (!coupon.active) {
        throw new Error('Coupon is inactive');
    }
    if (coupon.startDate && new Date() < coupon.startDate) {
        throw new Error('Coupon is not yet valid');
    }
    if (coupon.endDate && new Date() > coupon.endDate) {
        throw new Error('Coupon has expired');
    }
    if (coupon.maxUsage && coupon.currentUsage >= coupon.maxUsage) {
        throw new Error('Coupon usage limit reached');
    }
    if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
        throw new Error(`Minimum order amount is ${coupon.minimumAmount}`);
    }
}

async function buildLinesFromItems(items) {
    let lines = [];
    let subtotal = 0;
    for (let it of items) {
        let book = await Book.findById(it.bookId);
        if (!book) {
            throw new Error(`Book ${it.bookId} not found`);
        }
        let unit = book.discount > 0
            ? book.price * (1 - book.discount / 100)
            : book.price;
        let lineTotal = unit * it.quantity;
        lines.push({ bookId: book._id, lineTotal });
        subtotal += lineTotal;
    }
    return { lines, subtotal };
}

module.exports = {
    getAll: async function (page, size, active, search) {
        let query = {};

        if (active !== undefined) query.active = active === 'true';
        if (search) {
            query.$or = [
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        let coupons = await Coupon.find(query)
            .populate('bookIds', 'title')
            .sort({ createdAt: -1 })
            .skip(page * size)
            .limit(parseInt(size, 10));

        let total = await Coupon.countDocuments(query);

        return {
            coupons: coupons.map(formatCouponDoc),
            pagination: {
                page: parseInt(page, 10),
                size: parseInt(size, 10),
                total,
                totalPages: Math.ceil(total / size)
            }
        };
    },

    getById: async function (id) {
        let c = await Coupon.findById(id).populate('bookIds', 'title');
        return c ? formatCouponDoc(c) : null;
    },

    getByCode: async function (code) {
        let c = await Coupon.findOne({ code: code.toUpperCase() }).populate('bookIds', 'title');
        return c ? formatCouponDoc(c) : null;
    },

    create: async function (couponData) {
        let data = normalizePayload(couponData);
        assertDateRange(data, null);
        if (data.scope !== 'ALL' && (!data.bookIds || data.bookIds.length === 0)) {
            throw new Error('Please select at least one book for this scope');
        }
        let coupon = new Coupon(data);
        await coupon.save();
        return formatCouponDoc(await Coupon.findById(coupon._id).populate('bookIds', 'title'));
    },

    update: async function (id, couponData) {
        let data = normalizePayload(couponData);
        let currentCoupon = await Coupon.findById(id).select('startDate endDate');
        assertDateRange(data, currentCoupon);
        let scope = data.scope;
        if (scope !== undefined && scope !== 'ALL' && (!data.bookIds || data.bookIds.length === 0)) {
            throw new Error('Please select at least one book for this scope');
        }
        let coupon = await Coupon.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        ).populate('bookIds', 'title');
        return coupon ? formatCouponDoc(coupon) : null;
    },

    delete: async function (id) {
        return await Coupon.findByIdAndDelete(id);
    },

    validate: async function (code, orderAmount) {
        let coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            throw new Error('Coupon not found');
        }

        await assertCouponBasic(coupon, orderAmount);

        return { valid: true, coupon: formatCouponDoc(coupon) };
    },

    availableForCart: async function (items) {
        if (!items || !items.length) {
            return { coupons: [] };
        }
        let { lines, subtotal } = await buildLinesFromItems(items);

        let query = { active: true };
        let list = await Coupon.find(query)
            .populate('bookIds', '_id')
            .sort({ createdAt: -1 })
            .limit(50);

        let results = [];
        for (let raw of list) {
            let coupon = raw;
            try {
                await assertCouponBasic(coupon, subtotal);
            } catch (e) {
                continue;
            }
            let eligibleCount = eligibleLineCount(lines, coupon);
            if (eligibleCount <= 0) continue;

            let eligible = eligibleSubtotal(lines, coupon);
            if (eligible <= 0) continue;

            let discount = computeDiscountAmount(coupon, eligible);
            if (discount <= 0) continue;

            let fc = formatCouponDoc(coupon);
            results.push({
                code: fc.code,
                description: fc.description,
                discountPercent: fc.discountType === 'PERCENTAGE' ? fc.discountValue : 0,
                scope: fc.scope,
                eligibleBookCount: eligibleCount,
                couponDiscount: discount,
                subtotal,
                totalPrice: Math.max(0, subtotal - discount)
            });
        }

        return { coupons: results };
    },

    previewCouponForOrder: async function (items, couponCode) {
        if (!couponCode || !String(couponCode).trim()) {
            return { discount: 0, coupon: null };
        }
        let { lines, subtotal } = await buildLinesFromItems(items);
        let coupon = await Coupon.findOne({ code: String(couponCode).trim().toUpperCase() });
        await assertCouponBasic(coupon, subtotal);
        let eligible = eligibleSubtotal(lines, coupon);
        if (eligible <= 0) {
            throw new Error('This coupon does not apply to the books in your cart');
        }
        let discount = computeDiscountAmount(coupon, eligible);
        return {
            discount,
            coupon,
            subtotal,
            subtotalEligible: eligible
        };
    },

    incrementUsage: async function (couponId) {
        if (!couponId) return;
        await Coupon.findByIdAndUpdate(couponId, { $inc: { currentUsage: 1 } });
    }
};
