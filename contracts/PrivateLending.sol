// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FHE, euint16, euint64, ebool, inEuint64} from "@fhenixprotocol/contracts/FHE.sol";
import {PermissionedV2, PermissionV2} from "@fhenixprotocol/contracts/access/PermissionedV2.sol";

/// @title Private Lending with FHE
/// @notice Users apply with encrypted income & debt; contract computes eligibility, rate tier, and max loan.
contract PrivateLending is PermissionedV2 {
    struct Profile {
        euint64 income;       // encrypted monthly income
        euint64 debt;         // encrypted monthly debt
        euint64 maxLoan;      // encrypted approved loan cap
        euint16 rateBps;      // encrypted interest in basis points
        ebool   eligible;     // encrypted boolean flag
        euint64 outstanding;  // encrypted outstanding balance (starts at maxLoan)
    }

    mapping(address => Profile) internal profiles;

    event Applied(address indexed user);

    /// @dev Apply with encrypted monthly income & debt (both euint64).
    function apply(inEuint64 calldata encIncome, inEuint64 calldata encDebt) external {
        euint64 income = FHE.asEuint64(encIncome);
        euint64 debt   = FHE.asEuint64(encDebt);

        // Tier thresholds via constant-only transforms (avoid ciphertext division):
        ebool within30 = FHE.le(FHE.mul(debt, 10), FHE.mul(income, 3));
        ebool within40 = FHE.le(FHE.mul(debt, 10), FHE.mul(income, 4));

        // Default 18.00% -> 14.00% -> 10.00% by tiers
        euint16 rate = FHE.asEuint16(1800);
        rate = FHE.select(within40, FHE.asEuint16(1400), rate);
        rate = FHE.select(within30, FHE.asEuint16(1000), rate);

        // Eligibility: 2*debt <= income
        ebool eligible = FHE.le(FHE.mul(debt, 2), income);

        // Max loan = (20 * income) - (12 * debt)
        euint64 baseMax  = FHE.mul(income, 20);
        euint64 penalty  = FHE.mul(debt, 12);
        euint64 maxLoan  = FHE.sub(baseMax, penalty);

        profiles[msg.sender] = Profile({
            income: income,
            debt: debt,
            maxLoan: maxLoan,
            rateBps: rate,
            eligible: eligible,
            outstanding: maxLoan
        });

        FHE.allow(profiles[msg.sender].maxLoan, msg.sender);
        FHE.allow(profiles[msg.sender].rateBps, msg.sender);
        FHE.allow(profiles[msg.sender].eligible, msg.sender);
        FHE.allow(profiles[msg.sender].outstanding, msg.sender);

        emit Applied(msg.sender);
    }

    /// @notice Returns sealed (re-encrypted) results for the permit holder; front-end unseals results.
    function myDecision(
        PermissionV2 memory permission
    )
        public
        view
        withPermission(permission)
        returns (
            FHE.SealedUint memory sealedMaxLoan,
            FHE.SealedUint memory sealedRateBps,
            FHE.SealedBool memory sealedEligible,
            FHE.SealedUint memory sealedOutstanding
        )
    {
        Profile storage p = profiles[permission.issuer];
        sealedMaxLoan     = FHE.sealoutputTyped(p.maxLoan, permission.sealingKey);
        sealedRateBps     = FHE.sealoutputTyped(p.rateBps, permission.sealingKey);
        sealedEligible    = FHE.sealoutputTyped(p.eligible, permission.sealingKey);
        sealedOutstanding = FHE.sealoutputTyped(p.outstanding, permission.sealingKey);
    }

    /// @notice Pay down outstanding balance with an encrypted payment.
    function pay(inEuint64 calldata encPayment) external {
        euint64 payment = FHE.asEuint64(encPayment);
        Profile storage p = profiles[msg.sender];

        // Safe underflow handling: cap at zero.
        euint64 temp   = FHE.sub(p.outstanding, payment);
        ebool  overpay = FHE.gt(payment, p.outstanding);
        p.outstanding  = FHE.select(overpay, FHE.asEuint64(0), temp);

        FHE.allow(p.outstanding, msg.sender);
    }
}