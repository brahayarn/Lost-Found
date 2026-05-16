"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemCategory = exports.ItemStatus = void 0;
var ItemStatus;
(function (ItemStatus) {
    ItemStatus["NEW"] = "NEW";
    ItemStatus["PUBLISHED"] = "PUBLISHED";
    ItemStatus["MATCHED"] = "MATCHED";
    ItemStatus["CLAIMED"] = "CLAIMED";
    ItemStatus["RETURNED"] = "RETURNED";
    ItemStatus["TO_DISPOSE"] = "TO_DISPOSE";
    ItemStatus["ARCHIVED"] = "ARCHIVED";
})(ItemStatus || (exports.ItemStatus = ItemStatus = {}));
var ItemCategory;
(function (ItemCategory) {
    ItemCategory["ELECTRONICS"] = "ELECTRONICS";
    ItemCategory["DOCUMENTS"] = "DOCUMENTS";
    ItemCategory["KEYS"] = "KEYS";
    ItemCategory["BAG"] = "BAG";
    ItemCategory["CLOTHING"] = "CLOTHING";
    ItemCategory["JEWELRY"] = "JEWELRY";
    ItemCategory["OTHER"] = "OTHER";
})(ItemCategory || (exports.ItemCategory = ItemCategory = {}));
//# sourceMappingURL=item.js.map