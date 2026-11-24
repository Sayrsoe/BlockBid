// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AuctionEnums} from "./AuctionEnums.sol";

library AuctionStructs {
    struct Auction {
        uint256 auctionId;
        address seller;
        address highestBidder;

        AuctionEnums.AuctionStatus status;
        AuctionEnums.AuctionCategory category;

        bool reserveMet;
        bool sellerClaimed;
        bool antiSnipeTriggered;

        uint40 createdAt;
        uint40 startTime;
        uint40 endTime;

        uint32 totalBids;
        uint32 disputeId;

        uint256 startingPrice;
        uint256 reservePrice;
        uint256 currentHighestBid;
        uint256 minBidIncrement;

        string metadataURI;
    }

    struct Bid {
        address bidder;
        AuctionEnums.BidStatus status;
        uint40 timestamp;
        uint256 amount;
    }

    struct EscrowInfo {
        uint256 auctionId;
        uint256 amount;
        address depositor;
        AuctionEnums.PaymentStatus status;
        uint40 depositedAt;
        uint40 releaseDeadline;
    }

    struct Dispute {
        uint256 disputeId;
        uint256 auctionId;
        address initiator;
        address resolver;
        AuctionEnums.DisputeStatus status;
        uint40 createdAt;
        uint40 resolvedAt;
        string reasonURI;
    }

    struct AuctionStatistics {
        uint256 totalBidVolume;
        uint32 uniqueBidders;
        uint40 firstBidAt;
        uint40 lastBidAt;
    }

    struct SellerStatistics {
        uint32 totalAuctionsCreated;
        uint32 totalAuctionsCompleted;
        uint32 totalAuctionsCancelled;
        uint32 activeAuctions;
        uint256 totalRevenueWei;
    }

    struct BuyerStatistics {
        uint32 totalBidsPlaced;
        uint32 totalAuctionsWon;
        uint32 activeBids;
        uint256 totalSpentWei;
    }

    struct PlatformStatistics {
        uint256 totalAuctionsCreated;
        uint256 totalAuctionsFinalized;
        uint256 totalVolumeWei;
        uint256 totalFeesCollectedWei;
        uint256 totalDisputesOpened;
    }
}
