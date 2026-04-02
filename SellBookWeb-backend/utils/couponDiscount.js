/**
 * Shared coupon eligibility and discount math for orders and /coupons/validate.
 */

function isBookEligibleForCoupon(coupon, bookId) {
    if (!coupon) return false;
    const bid = bookId.toString();
    const ids = (coupon.bookIds || []).map((id) => id.toString());
    switch (coupon.scope) {
        case 'ALL':
            return true;
        case 'ONLY_BOOKS':
            return ids.includes(bid);
        case 'EXCEPT_BOOKS':
            return !ids.includes(bid);
        default:
            return true;
    }
}

function isCouponActiveNow(coupon) {
    if (!coupon || !coupon.active) return false;
    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom)) return false;
    if (coupon.validTo && now > new Date(coupon.validTo)) return false;
    return true;
}

/**
 * @param {object} coupon - Coupon document
 * @param {{ bookId: any, price: number, quantity: number }[]} orderItems - unit price after book-level discount
 * @returns {{ eligibleSubtotal: number, discount: number }}
 */
function computeCouponDiscountAmount(coupon, orderItems) {
    let eligible = 0;
    for (const item of orderItems) {
        if (isBookEligibleForCoupon(coupon, item.bookId)) {
            eligible += item.price * item.quantity;
        }
    }
    if (eligible <= 0) {
        return { eligibleSubtotal: 0, discount: 0 };
    }
    const discount = Math.round((eligible * coupon.discountPercent) / 100);
    return { eligibleSubtotal: eligible, discount };
}

module.exports = {
    isBookEligibleForCoupon,
    isCouponActiveNow,
    computeCouponDiscountAmount
};
