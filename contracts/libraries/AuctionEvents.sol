// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AuctionEnums} from "./AuctionEnums.sol";

library AuctionEvents {
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 startingPrice,
        uint256 startTime,
        uint256 endTime
    );
    event AuctionActivated(uint256 indexed auctionId, uint256 timestamp);
    event AuctionCancelled(uint256 indexed auctionId, address indexed seller, uint256 timestamp);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 winningBid);
    event AuctionFinalized(uint256 indexed auctionId, address indexed winner, uint256 amountPaidToSeller);
    event ReservePriceMet(uint256 indexed auctionId, uint256 bidAmount);
    event AuctionExtended(uint256 indexed auctionId, uint256 previousEndTime, uint256 newEndTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, uint256 timestamp);
    event BidOutbid(uint256 indexed auctionId, address indexed previousBidder, uint256 previousAmount);
    event BidWithdrawn(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event FundsEscrowed(uint256 indexed auctionId, address indexed depositor, uint256 amount);
    event EscrowReleased(uint256 indexed auctionId, address indexed seller, uint256 amount);
    event EscrowRefunded(uint256 indexed auctionId, address indexed buyer, uint256 amount);
    event RefundIssued(address indexed to, uint256 amount, uint256 indexed auctionId);
    event RefundClaimed(address indexed claimant, uint256 amount);
    event DisputeOpened(uint256 indexed disputeId, uint256 indexed auctionId, address indexed initiator);
    event DisputeUnderReview(uint256 indexed disputeId, address indexed reviewer);
    event DisputeResolved(
        uint256 indexed disputeId,
        uint256 indexed auctionId,
        AuctionEnums.DisputeStatus resolution,
        address resolver
    );
    event PlatformFeeUpdated(uint256 previousFeeBps, uint256 newFeeBps);
    event FeeRecipientUpdated(address indexed previousRecipient, address indexed newRecipient);
    event PlatformConfigUpdated(bytes32 indexed parameter, uint256 previousValue, uint256 newValue);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);
    event EmergencyWithdrawal(address indexed by, address indexed to, uint256 amount);
    event PlatformStatisticsUpdated(uint256 totalAuctions, uint256 totalVolumeWei, uint256 totalFeesCollectedWei);
    event SellerStatisticsUpdated(address indexed seller, uint32 totalCompleted, uint32 totalCancelled);
    event SellerPaid(uint256 indexed auctionId, address indexed seller, uint256 amount);
    event PlatformFeeCollected(uint256 indexed auctionId, uint256 amount);
}
