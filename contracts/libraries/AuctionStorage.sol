// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AuctionStructs} from "./AuctionStructs.sol";
import {AuctionConstants} from "./AuctionConstants.sol";

abstract contract AuctionStorage {
    uint256 internal auctionCounter = 1;
    uint256 internal disputeCounter = 1;
    mapping(uint256 => AuctionStructs.Auction) internal auctions;
    mapping(uint256 => AuctionStructs.Bid[]) internal bidHistory;
    mapping(uint256 => AuctionStructs.EscrowInfo) internal escrows;
    mapping(uint256 => AuctionStructs.Dispute) internal disputes;
    mapping(address => uint256) internal pendingRefunds;
    mapping(address => uint256[]) internal sellerAuctions;
    mapping(address => uint256[]) internal buyerAuctions;
    mapping(uint256 => AuctionStructs.AuctionStatistics) internal auctionStats;
    mapping(address => AuctionStructs.SellerStatistics) internal sellerStats;
    mapping(address => AuctionStructs.BuyerStatistics) internal buyerStats;
    AuctionStructs.PlatformStatistics internal platformStats;
    uint256 internal platformFeeBps = AuctionConstants.DEFAULT_PLATFORM_FEE_BPS;
    address internal feeRecipient;
}
