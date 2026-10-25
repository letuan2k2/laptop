import { describe, it, expect } from 'vitest';
import { computeVoucherDiscount, type VoucherLike } from '../src/lib/voucher-calc';

const base: VoucherLike = {
  isActive: true,
  expiryDate: null,
  usedCount: 0,
  usageLimit: 10,
  minOrderAmount: 0,
  maxDiscount: null,
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minRank: 'BRONZE',
  products: [],
};

const items = [
  { id: 'gaming', price: 30000000, quantity: 1 },
  { id: 'office', price: 10000000, quantity: 2 },
];

describe('computeVoucherDiscount', () => {
  it('applies to the whole order when the voucher has no linked products', () => {
    expect(computeVoucherDiscount(base, items, 'BRONZE')).toEqual({ ok: true, discount: 5000000 });
  });

  it('applies only to linked products', () => {
    const v = { ...base, products: [{ id: 'gaming' }] };
    expect(computeVoucherDiscount(v, items, 'BRONZE')).toEqual({ ok: true, discount: 3000000 });
  });

  it('caps percentage discounts at maxDiscount', () => {
    const v = { ...base, maxDiscount: 1000000 };
    expect(computeVoucherDiscount(v, items, 'BRONZE')).toEqual({ ok: true, discount: 1000000 });
  });

  it('never discounts more than the eligible amount', () => {
    const v = { ...base, discountType: 'FIXED_AMOUNT' as const, discountValue: 50000000, products: [{ id: 'office' }] };
    expect(computeVoucherDiscount(v, items, 'BRONZE')).toEqual({ ok: true, discount: 20000000 });
  });

  it('rejects inactive, expired and exhausted vouchers', () => {
    expect(computeVoucherDiscount({ ...base, isActive: false }, items, 'BRONZE')).toMatchObject({ ok: false, error: 'voucher.inactive' });
    expect(computeVoucherDiscount({ ...base, expiryDate: '2000-01-01' }, items, 'BRONZE')).toMatchObject({ ok: false, error: 'voucher.expired' });
    expect(computeVoucherDiscount({ ...base, usedCount: 10 }, items, 'BRONZE')).toMatchObject({ ok: false, error: 'voucher.usageLimitExceeded' });
  });

  it('enforces minimum rank and minimum order amount', () => {
    expect(computeVoucherDiscount({ ...base, minRank: 'GOLD' }, items, 'SILVER')).toMatchObject({ ok: false, error: 'voucher.rankRequired' });
    expect(computeVoucherDiscount({ ...base, minRank: 'GOLD' }, items, 'PLATINUM')).toMatchObject({ ok: true });
    expect(computeVoucherDiscount({ ...base, minOrderAmount: 60000000 }, items, 'BRONZE')).toMatchObject({ ok: false, error: 'voucher.minOrderAmountRequired' });
  });

  it('rejects vouchers whose products are not in the cart', () => {
    const v = { ...base, products: [{ id: 'other' }] };
    expect(computeVoucherDiscount(v, items, 'BRONZE')).toMatchObject({ ok: false, error: 'voucher.notApplicable' });
  });
});

describe("tiền giảm không bao giờ âm", () => {
  it("dữ liệu voucher lỗi (giảm tối đa âm) vẫn cho tiền giảm = 0, không cộng thêm tiền", () => {
    const r = computeVoucherDiscount({ ...base, discountType: "PERCENTAGE", discountValue: 10, maxDiscount: -500000 }, [{ id: "p1", price: 20000000, quantity: 1 }], "BRONZE");
    expect(r).toEqual({ ok: true, discount: 0 });
  });
});
