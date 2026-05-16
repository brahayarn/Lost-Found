"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchProposalStatus = exports.ClaimStatus = void 0;
var ClaimStatus;
(function (ClaimStatus) {
    ClaimStatus["NEW"] = "NEW";
    ClaimStatus["PROCESSING"] = "PROCESSING";
    ClaimStatus["MATCHED"] = "MATCHED";
    ClaimStatus["READY_FOR_HANDOVER"] = "READY_FOR_HANDOVER";
    ClaimStatus["CLOSED"] = "CLOSED";
    ClaimStatus["REJECTED"] = "REJECTED";
})(ClaimStatus || (exports.ClaimStatus = ClaimStatus = {}));
var MatchProposalStatus;
(function (MatchProposalStatus) {
    MatchProposalStatus["PENDING"] = "PENDING";
    MatchProposalStatus["CONFIRMED"] = "CONFIRMED";
    MatchProposalStatus["REJECTED"] = "REJECTED";
})(MatchProposalStatus || (exports.MatchProposalStatus = MatchProposalStatus = {}));
//# sourceMappingURL=claim.js.map