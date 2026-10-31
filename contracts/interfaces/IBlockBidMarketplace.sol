// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AuctionStructs} from "../libraries/AuctionStructs.sol";
import {AuctionEnums} from "../libraries/AuctionEnums.sol";

interface IBlockBidMarketplace {
    function createAuction(
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 minBidIncrement,
        uint256 startTime,
        uint256 endTime,
        AuctionEnums.AuctionCategory category,
        string calldata metadataURI
    ) external returns (uint256 auctionId);

    function cancelAuction(uint256 auctionId) external;

    function editAuctionMetadata(uint256 auctionId, string calldata metadataURI) external;

    function endAuction(uint256 auctionId) external;

    function finalizeAuction(uint256 auctionId) external;

    function placeBid(uint256 auctionId) external payable;

    function claimRefund() external;

    function claimProceeds(uint256 auctionId) external;

    function openDispute(uint256 auctionId, string calldata reasonURI) external returns (uint256 disputeId);

    function resolveDispute(uint256 disputeId, AuctionEnums.DisputeStatus resolution) external;

    function setPlatformFee(uint256 newFeeBps) external;

    function setFeeRecipient(address newRecipient) external;

    function pause() external;

    function unpause() external;

    function emergencyWithdraw(address to, uint256 amount) external;

    function getAuction(uint256 auctionId) external view returns (AuctionStructs.Auction memory auction);

    function getRemainingTime(uint256 auctionId) external view returns (uint256 remaining);

    function getMinimumNextBid(uint256 auctionId) external view returns (uint256 minimumBid);

    function getAuctionsBySeller(address seller, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory auctionIds);

    function getAuctionsByBidder(address bidder, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory auctionIds);

    function getBidHistory(uint256 auctionId) external view returns (AuctionStructs.Bid[] memory bids);

    function getPendingRefund(address account) external view returns (uint256 amount);

    function getEscrowInfo(uint256 auctionId) external view returns (AuctionStructs.EscrowInfo memory escrow);

    function getDispute(uint256 disputeId) external view returns (AuctionStructs.Dispute memory dispute);

    function getAuctionStatistics(uint256 auctionId)
        external
        view
        returns (AuctionStructs.AuctionStatistics memory stats);

    function getSellerStatistics(address seller) external view returns (AuctionStructs.SellerStatistics memory stats);

    function getBuyerStatistics(address buyer) external view returns (AuctionStructs.BuyerStatistics memory stats);

    function getPlatformStatistics() external view returns (AuctionStructs.PlatformStatistics memory stats);

    function getPlatformFee() external view returns (uint256 feeBps);

    function getFeeRecipient() external view returns (address recipient);

    function getTotalAuctions() external view returns (uint256 total);
}
