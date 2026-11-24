// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library AuctionEnums {
    enum AuctionStatus {
        Created,
        Active,
        Ended,
        Finalized,
        Cancelled,
        Disputed
    }

    enum DisputeStatus {
        None,
        Opened,
        UnderReview,
        ResolvedBuyer,
        ResolvedSeller,
        ResolvedSplit,
        Closed
    }

    enum PaymentStatus {
        Pending,
        Escrowed,
        Released,
        Refunded,
        Failed
    }

    enum AuctionCategory {
        Art,
        Collectibles,
        Electronics,
        Fashion,
        RealWorldAssets,
        Domains,
        Services,
        Other
    }

    enum BidStatus {
        Active,
        Outbid,
        Winning,
        Refunded,
        Withdrawn
    }
}
