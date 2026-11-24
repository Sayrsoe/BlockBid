// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {AuctionStructs} from "./libraries/AuctionStructs.sol";
import {AuctionEnums} from "./libraries/AuctionEnums.sol";
import {AuctionErrors} from "./libraries/AuctionErrors.sol";
import {AuctionEvents} from "./libraries/AuctionEvents.sol";
import {AuctionConstants} from "./libraries/AuctionConstants.sol";
import {AuctionStorage} from "./libraries/AuctionStorage.sol";
import {Validation} from "./utils/Validation.sol";
import {TimeUtils} from "./utils/TimeUtils.sol";
import {IBlockBidMarketplace} from "./interfaces/IBlockBidMarketplace.sol";

contract BlockBidMarketplace is
    AuctionStorage,
    Ownable,
    ReentrancyGuard,
    Pausable,
    IBlockBidMarketplace
{

    error NotYetImplemented();

    constructor(address _feeRecipient) Ownable(msg.sender) {
        Validation.validateAddress(_feeRecipient);

        feeRecipient = _feeRecipient;
        platformFeeBps = AuctionConstants.DEFAULT_PLATFORM_FEE_BPS;

        emit AuctionEvents.FeeRecipientUpdated(address(0), _feeRecipient);
        emit AuctionEvents.PlatformFeeUpdated(0, platformFeeBps);
    }

    modifier auctionExists(uint256 auctionId) {
        Validation.validateAuctionExists(auctions[auctionId].seller, auctionId);
        _;
    }

    modifier onlySeller(uint256 auctionId) {
        if (msg.sender != auctions[auctionId].seller) {
            revert AuctionErrors.NotAuctionSeller(auctionId, msg.sender);
        }
        _;
    }

    modifier auctionActive(uint256 auctionId) {
        AuctionStructs.Auction storage auction = auctions[auctionId];

        if (auction.status != AuctionEnums.AuctionStatus.Active) {
            revert AuctionErrors.AuctionNotActive(auctionId);
        }
        if (TimeUtils.auctionExpired(auction.endTime)) {
            revert AuctionErrors.AuctionAlreadyEnded(auctionId);
        }
        _;
    }

    modifier auctionStarted(uint256 auctionId) {
        if (!TimeUtils.auctionStarted(auctions[auctionId].startTime)) {
            revert AuctionErrors.AuctionNotActive(auctionId);
        }
        _;
    }

    modifier auctionEnded(uint256 auctionId) {
        if (auctions[auctionId].status != AuctionEnums.AuctionStatus.Ended) {
            revert AuctionErrors.AuctionNotEnded(auctionId);
        }
        _;
    }

    modifier validBid(uint256 auctionId) {
        AuctionStructs.Auction storage auction = auctions[auctionId];
        Validation.validateBidAmount(
            msg.value,
            auction.currentHighestBid,
            auction.startingPrice,
            auction.minBidIncrement
        );
        _;
    }

    function createAuction(
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 minBidIncrement,
        uint256 startTime,
        uint256 endTime,
        AuctionEnums.AuctionCategory category,
        string calldata metadataURI
    ) external override whenNotPaused nonReentrant returns (uint256 auctionId) {
        Validation.validateURI(metadataURI);
        Validation.validatePrices(startingPrice, reservePrice);
        Validation.validateBidIncrement(minBidIncrement);
        Validation.validateAuctionDuration(startTime, endTime);

        auctionId = auctionCounter;
        unchecked {
            auctionCounter = auctionId + 1;
        }

        AuctionStructs.Auction storage auction = auctions[auctionId];
        auction.auctionId = auctionId;
        auction.seller = msg.sender;
        auction.status = AuctionEnums.AuctionStatus.Active;
        auction.category = category;
        auction.createdAt = uint40(block.timestamp);
        auction.startTime = uint40(startTime);
        auction.endTime = uint40(endTime);
        auction.startingPrice = startingPrice;
        auction.reservePrice = reservePrice;
        auction.minBidIncrement = minBidIncrement;
        auction.metadataURI = metadataURI;

        sellerAuctions[msg.sender].push(auctionId);

        emit AuctionEvents.AuctionCreated(
            auctionId,
            msg.sender,
            startingPrice,
            startTime,
            endTime
        );
    }

    function cancelAuction(uint256 auctionId)
        external
        override
        whenNotPaused
        nonReentrant
        auctionExists(auctionId)
        onlySeller(auctionId)
    {
        AuctionStructs.Auction storage auction = auctions[auctionId];

        if (auction.status != AuctionEnums.AuctionStatus.Active) {
            revert AuctionErrors.AuctionNotActive(auctionId);
        }
        if (auction.totalBids != 0) {
            revert AuctionErrors.CannotCancelAfterBid(auctionId);
        }

        auction.status = AuctionEnums.AuctionStatus.Cancelled;

        emit AuctionEvents.AuctionCancelled(
            auctionId,
            msg.sender,
            block.timestamp
        );
    }

    function editAuctionMetadata(uint256 auctionId, string calldata metadataURI)
        external
        override
        whenNotPaused
        auctionExists(auctionId)
        onlySeller(auctionId)
    {
        AuctionStructs.Auction storage auction = auctions[auctionId];

        if (auction.status != AuctionEnums.AuctionStatus.Active) {
            revert AuctionErrors.AuctionNotActive(auctionId);
        }
        if (auction.totalBids != 0) {
            revert AuctionErrors.CannotCancelAfterBid(auctionId);
        }

        Validation.validateURI(metadataURI);
        auction.metadataURI = metadataURI;
    }

    function endAuction(uint256 auctionId)
        external
        override
        nonReentrant
        auctionExists(auctionId)
    {
        AuctionStructs.Auction storage auction = auctions[auctionId];

        if (auction.status != AuctionEnums.AuctionStatus.Active) {
            revert AuctionErrors.AuctionNotActive(auctionId);
        }
        if (!TimeUtils.auctionExpired(auction.endTime)) {
            revert AuctionErrors.AuctionNotEnded(auctionId);
        }

        address winner;
        uint256 winningBid;

        if (auction.reserveMet) {
            winner = auction.highestBidder;
            winningBid = auction.currentHighestBid;
            _moveWinningBidToEscrow(auctionId, auction);
        } else {
            _settleUnsuccessfulAuction(auctionId, auction);
        }

        auction.status = AuctionEnums.AuctionStatus.Ended;

        emit AuctionEvents.AuctionEnded(auctionId, winner, winningBid);
    }

    function finalizeAuction(uint256 auctionId)
        external
        override
        nonReentrant
        auctionExists(auctionId)
    {
        _settleEscrow(auctionId, auctions[auctionId]);
    }

    function placeBid(uint256 auctionId)
        external
        payable
        override
        whenNotPaused
        nonReentrant
        auctionExists(auctionId)
        auctionActive(auctionId)
        auctionStarted(auctionId)
        validBid(auctionId)
    {
        AuctionStructs.Auction storage auction = auctions[auctionId];

        Validation.validateNotSeller(auction.seller, msg.sender, auctionId);
        if (msg.sender == auction.highestBidder) {
            revert AuctionErrors.AlreadyHighestBidder(auctionId, msg.sender);
        }

        address previousBidder = auction.highestBidder;
        uint256 previousAmount = auction.currentHighestBid;

        if (previousBidder != address(0)) {
            _markPreviousBidOutbid(auctionId);
            _creditRefund(previousBidder, previousAmount, auctionId);

            emit AuctionEvents.BidOutbid(
                auctionId,
                previousBidder,
                previousAmount
            );
        }

        auction.highestBidder = msg.sender;
        auction.currentHighestBid = msg.value;

        unchecked {
            ++auction.totalBids;
        }

        bidHistory[auctionId].push(
            AuctionStructs.Bid({
                bidder: msg.sender,
                status: AuctionEnums.BidStatus.Active,
                timestamp: uint40(block.timestamp),
                amount: msg.value
            })
        );

        buyerAuctions[msg.sender].push(auctionId);

        if (
            !auction.reserveMet &&
            (auction.reservePrice == 0 || msg.value >= auction.reservePrice)
        ) {
            auction.reserveMet = true;

            if (auction.reservePrice != 0) {
                emit AuctionEvents.ReservePriceMet(auctionId, msg.value);
            }
        }

        _extendAuctionIfNeeded(auctionId);

        emit AuctionEvents.BidPlaced(
            auctionId,
            msg.sender,
            msg.value,
            block.timestamp
        );
    }

    function claimRefund() external override nonReentrant {
        _withdrawRefund(msg.sender);
    }

    function claimProceeds(uint256 auctionId)
        external
        override
        nonReentrant
        auctionExists(auctionId)
        onlySeller(auctionId)
    {
        _settleEscrow(auctionId, auctions[auctionId]);
    }

    function openDispute(uint256, string calldata)
        external
        pure
        override
        returns (uint256)
    {
        revert NotYetImplemented();
    }

    function resolveDispute(uint256, AuctionEnums.DisputeStatus)
        external
        pure
        override
    {
        revert NotYetImplemented();
    }

    function setPlatformFee(uint256 newFeeBps) external override onlyOwner {
        Validation.validatePlatformFee(newFeeBps);

        uint256 previousFeeBps = platformFeeBps;
        platformFeeBps = newFeeBps;

        emit AuctionEvents.PlatformFeeUpdated(previousFeeBps, newFeeBps);
    }

    function setFeeRecipient(address newRecipient) external override onlyOwner {
        Validation.validateAddress(newRecipient);

        address previousRecipient = feeRecipient;
        feeRecipient = newRecipient;

        emit AuctionEvents.FeeRecipientUpdated(previousRecipient, newRecipient);
    }

    function pause() external override onlyOwner {
        if (paused()) {
            revert AuctionErrors.ContractIsPaused();
        }

        _pause();
        emit AuctionEvents.ContractPaused(msg.sender, block.timestamp);
    }

    function unpause() external override onlyOwner {
        if (!paused()) {
            revert AuctionErrors.ContractNotPaused();
        }

        _unpause();
        emit AuctionEvents.ContractUnpaused(msg.sender, block.timestamp);
    }

    function emergencyWithdraw(address, uint256) external pure override {
        revert NotYetImplemented();
    }

    function getAuction(uint256 auctionId)
        external
        view
        override
        auctionExists(auctionId)
        returns (AuctionStructs.Auction memory auction)
    {
        return auctions[auctionId];
    }

    function getRemainingTime(uint256 auctionId)
        external
        view
        override
        auctionExists(auctionId)
        returns (uint256 remaining)
    {
        return TimeUtils.remainingTime(auctions[auctionId].endTime);
    }

    function getMinimumNextBid(uint256 auctionId)
        external
        view
        override
        auctionExists(auctionId)
        returns (uint256 minimumBid)
    {
        AuctionStructs.Auction storage auction = auctions[auctionId];

        if (auction.currentHighestBid == 0) {
            return auction.startingPrice;
        }

        return auction.currentHighestBid + auction.minBidIncrement;
    }

    function getAuctionsBySeller(
        address seller,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory auctionIds) {
        return _getAuctionPage(sellerAuctions[seller], offset, limit);
    }

    function getAuctionsByBidder(
        address bidder,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory auctionIds) {
        return _getAuctionPage(buyerAuctions[bidder], offset, limit);
    }

    function getBidHistory(uint256 auctionId)
        external
        view
        override
        auctionExists(auctionId)
        returns (AuctionStructs.Bid[] memory bids)
    {
        return bidHistory[auctionId];
    }

    function getPendingRefund(address account)
        external
        view
        override
        returns (uint256 amount)
    {
        return pendingRefunds[account];
    }

    function getEscrowInfo(uint256 auctionId)
        external
        view
        override
        auctionExists(auctionId)
        returns (AuctionStructs.EscrowInfo memory escrow)
    {
        return escrows[auctionId];
    }

    function getDispute(uint256 disputeId)
        external
        view
        override
        returns (AuctionStructs.Dispute memory dispute)
    {
        if (disputeId == 0 || disputes[disputeId].disputeId != disputeId) {
            revert AuctionErrors.DisputeNotFound(disputeId);
        }

        return disputes[disputeId];
    }

    function getAuctionStatistics(uint256)
        external
        view
        override
        returns (AuctionStructs.AuctionStatistics memory)
    {
        revert NotYetImplemented();
    }

    function getSellerStatistics(address)
        external
        view
        override
        returns (AuctionStructs.SellerStatistics memory)
    {
        revert NotYetImplemented();
    }

    function getBuyerStatistics(address)
        external
        view
        override
        returns (AuctionStructs.BuyerStatistics memory)
    {
        revert NotYetImplemented();
    }

    function getPlatformStatistics()
        external
        view
        override
        returns (AuctionStructs.PlatformStatistics memory)
    {
        revert NotYetImplemented();
    }

    function getPlatformFee() external view override returns (uint256 feeBps) {
        return platformFeeBps;
    }

    function getFeeRecipient()
        external
        view
        override
        returns (address recipient)
    {
        return feeRecipient;
    }

    function getTotalAuctions() external view override returns (uint256 total) {
        return auctionCounter - 1;
    }

    receive() external payable {
        revert AuctionErrors.EmergencyActionNotAllowed();
    }

    function _moveWinningBidToEscrow(
        uint256 auctionId,
        AuctionStructs.Auction storage auction
    ) internal {
        escrows[auctionId] = AuctionStructs.EscrowInfo({
            auctionId: auctionId,
            amount: auction.currentHighestBid,
            depositor: auction.highestBidder,
            status: AuctionEnums.PaymentStatus.Escrowed,
            depositedAt: uint40(block.timestamp),
            releaseDeadline: uint40(
                TimeUtils.computeEscrowDeadline(block.timestamp)
            )
        });

        AuctionStructs.Bid[] storage history = bidHistory[auctionId];
        history[history.length - 1].status = AuctionEnums.BidStatus.Winning;

        emit AuctionEvents.FundsEscrowed(
            auctionId,
            auction.highestBidder,
            auction.currentHighestBid
        );
    }

    function _settleUnsuccessfulAuction(
        uint256 auctionId,
        AuctionStructs.Auction storage auction
    ) internal {
        if (auction.highestBidder == address(0)) {
            return;
        }

        AuctionStructs.Bid[] storage history = bidHistory[auctionId];
        history[history.length - 1].status = AuctionEnums.BidStatus.Refunded;

        _creditRefund(
            auction.highestBidder,
            auction.currentHighestBid,
            auctionId
        );

        auction.highestBidder = address(0);
        auction.currentHighestBid = 0;
    }

    function _markPreviousBidOutbid(uint256 auctionId) internal {
        AuctionStructs.Bid[] storage history = bidHistory[auctionId];
        history[history.length - 1].status = AuctionEnums.BidStatus.Outbid;
    }

    function _creditRefund(
        address account,
        uint256 amount,
        uint256 auctionId
    ) internal {
        pendingRefunds[account] += amount;
        emit AuctionEvents.RefundIssued(account, amount, auctionId);
    }

    function _withdrawRefund(address claimant) internal {
        uint256 amount = pendingRefunds[claimant];
        if (amount == 0) {
            revert AuctionErrors.NoFundsToWithdraw(claimant);
        }

        pendingRefunds[claimant] = 0;

        if (!_transferETH(claimant, amount)) {
            revert AuctionErrors.TransferFailed(claimant, amount);
        }

        emit AuctionEvents.RefundClaimed(claimant, amount);
    }

    function _settleEscrow(
        uint256 auctionId,
        AuctionStructs.Auction storage auction
    ) internal {
        if (auction.sellerClaimed) {
            revert AuctionErrors.EscrowAlreadySettled(auctionId);
        }
        if (auction.status != AuctionEnums.AuctionStatus.Ended) {
            revert AuctionErrors.AuctionNotEnded(auctionId);
        }

        AuctionStructs.EscrowInfo storage escrow = _requireEscrowReleaseReady(
            auctionId
        );

        uint256 platformFee = (escrow.amount * platformFeeBps) /
            AuctionConstants.BPS_DENOMINATOR;
        uint256 sellerPayment = escrow.amount - platformFee;
        address seller = auction.seller;
        address winner = auction.highestBidder;

        auction.sellerClaimed = true;
        auction.status = AuctionEnums.AuctionStatus.Finalized;
        escrow.status = AuctionEnums.PaymentStatus.Released;

        if (platformFee != 0 && !_transferETH(feeRecipient, platformFee)) {
            revert AuctionErrors.TransferFailed(feeRecipient, platformFee);
        }
        if (!_transferETH(seller, sellerPayment)) {
            revert AuctionErrors.TransferFailed(seller, sellerPayment);
        }

        emit AuctionEvents.PlatformFeeCollected(auctionId, platformFee);
        emit AuctionEvents.EscrowReleased(auctionId, seller, sellerPayment);
        emit AuctionEvents.SellerPaid(auctionId, seller, sellerPayment);
        emit AuctionEvents.AuctionFinalized(
            auctionId,
            winner,
            sellerPayment
        );
    }

    function _requireEscrowReleaseReady(uint256 auctionId)
        internal
        view
        returns (AuctionStructs.EscrowInfo storage escrow)
    {
        escrow = escrows[auctionId];

        if (escrow.status != AuctionEnums.PaymentStatus.Escrowed) {
            revert AuctionErrors.EscrowNotFound(auctionId);
        }
        if (!TimeUtils.escrowExpired(escrow.releaseDeadline)) {
            revert AuctionErrors.EscrowStillLocked(
                auctionId,
                escrow.releaseDeadline
            );
        }
    }

    function _transferETH(address to, uint256 amount)
        internal
        returns (bool success)
    {
        (success, ) = payable(to).call{value: amount}("");
    }

    function _extendAuctionIfNeeded(uint256 auctionId) internal {
        AuctionStructs.Auction storage auction = auctions[auctionId];

        if (
            !auction.antiSnipeTriggered &&
            TimeUtils.shouldExtendAuction(auction.endTime)
        ) {
            uint256 previousEndTime = auction.endTime;
            uint256 newEndTime = TimeUtils.extendAuctionEndTime(
                auction.endTime
            );

            auction.endTime = uint40(newEndTime);
            auction.antiSnipeTriggered = true;

            emit AuctionEvents.AuctionExtended(
                auctionId,
                previousEndTime,
                newEndTime
            );
        }
    }

    function _getAuctionPage(
        uint256[] storage source,
        uint256 offset,
        uint256 limit
    ) internal view returns (uint256[] memory page) {
        Validation.validateBatchSize(limit);

        if (offset >= source.length || limit == 0) {
            return new uint256[](0);
        }

        uint256 end = source.length;
        if (limit < source.length - offset) {
            end = offset + limit;
        }

        page = new uint256[](end - offset);

        for (uint256 i; i < page.length; ) {
            page[i] = source[offset + i];
            unchecked {
                ++i;
            }
        }
    }
}
