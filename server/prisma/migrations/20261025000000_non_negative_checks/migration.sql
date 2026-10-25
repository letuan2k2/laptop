-- Lớp chặn cuối ở CSDL: tồn kho, số lượng, giá, điểm... không bao giờ âm
-- (kể cả khi sửa trực tiếp trong phpMyAdmin). Prisma không mô tả được CHECK nên viết bằng SQL.

ALTER TABLE `product`
  ADD CONSTRAINT `product_stock_non_negative` CHECK (`stockQuantity` >= 0),
  ADD CONSTRAINT `product_price_positive` CHECK (`price` > 0),
  ADD CONSTRAINT `product_original_price_valid` CHECK (`originalPrice` IS NULL OR `originalPrice` >= 0),
  ADD CONSTRAINT `product_ram_positive` CHECK (`ramGb` > 0),
  ADD CONSTRAINT `product_storage_positive` CHECK (`storageGb` > 0),
  ADD CONSTRAINT `product_warranty_non_negative` CHECK (`warrantyMonths` >= 0),
  ADD CONSTRAINT `product_views_non_negative` CHECK (`viewCount` >= 0);

ALTER TABLE `pricehistory`
  ADD CONSTRAINT `pricehistory_price_positive` CHECK (`price` > 0);

ALTER TABLE `order`
  ADD CONSTRAINT `order_subtotal_non_negative` CHECK (`subTotal` >= 0),
  ADD CONSTRAINT `order_discount_non_negative` CHECK (`discountAmount` >= 0),
  ADD CONSTRAINT `order_shipping_non_negative` CHECK (`shippingFee` >= 0),
  ADD CONSTRAINT `order_total_non_negative` CHECK (`totalPayment` >= 0);

ALTER TABLE `orderitem`
  ADD CONSTRAINT `orderitem_quantity_positive` CHECK (`quantity` > 0),
  ADD CONSTRAINT `orderitem_price_non_negative` CHECK (`priceAtPurchase` >= 0);

ALTER TABLE `voucher`
  ADD CONSTRAINT `voucher_value_positive` CHECK (`discountValue` > 0),
  ADD CONSTRAINT `voucher_min_order_non_negative` CHECK (`minOrderAmount` >= 0),
  ADD CONSTRAINT `voucher_max_discount_positive` CHECK (`maxDiscount` IS NULL OR `maxDiscount` > 0),
  ADD CONSTRAINT `voucher_usage_limit_positive` CHECK (`usageLimit` >= 1),
  ADD CONSTRAINT `voucher_used_non_negative` CHECK (`usedCount` >= 0);

ALTER TABLE `user`
  ADD CONSTRAINT `user_points_non_negative` CHECK (`points` >= 0);

ALTER TABLE `review`
  ADD CONSTRAINT `review_rating_range` CHECK (`rating` BETWEEN 1 AND 5);
