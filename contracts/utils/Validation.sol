// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AuctionErrors} from "../libraries/AuctionErrors.sol";
import {AuctionConstants} from "../libraries/AuctionConstants.sol";

library Validation {
    function validateAuctionDuration(uint256 startTime, uint256 endTime) internal view {
        if (startTime < block.timestamp) {
            revert AuctionErrors.StartTimeInThePast(startTime, block.timestamp);
        }
        if (startTime - block.timestamp > AuctionConstants.MAX_START_DELAY) {
            revert AuctionErrors.InvalidAuctionDuration(
                startTime, block.timestamp, block.timestamp + AuctionConstants.MAX_START_DELAY
            );
        }
        if (endTime <= startTime) {
            revert AuctionErrors.EndTimeBeforeStartTime(startTime, endTime);
        }

        uint256 duration = endTime - startTime;
        if (duration < AuctionConstants.MIN_AUCTION_DURATION || duration > AuctionConstants.MAX_AUCTION_DURATION) {
            revert AuctionErrors.InvalidAuctionDuration(
                duration, AuctionConstants.MIN_AUCTION_DURATION, AuctionConstants.MAX_AUCTION_DURATION
            );
        }
    }

    function validatePrices(uint256 startingPrice, uint256 reservePrice) internal pure {
        if (startingPrice == 0) {
            revert AuctionErrors.PriceMustBeGreaterThanZero();
        }
        if (reservePrice != 0 && reservePrice < startingPrice) {
            revert AuctionErrors.ReserveBelowStartingPrice(reservePrice, startingPrice);
        }
    }

    function validateBidIncrement(uint256 increment) internal pure {
        if (increment < AuctionConstants.MIN_BID_INCREMENT) {
            revert AuctionErrors.InvalidBidIncrement(increment);
        }
    }

    function validateBidAmount(
        uint256 sentValue,
        uint256 currentHighestBid,
        uint256 startingPrice,
        uint256 minBidIncrement
    ) internal pure {
        if (sentValue == 0) {
            revert AuctionErrors.ZeroValueBid();
        }

        if (currentHighestBid == 0) {
            if (sentValue < startingPrice) {
                revert AuctionErrors.BidBelowStartingPrice(sentValue, startingPrice);
            }
        } else {
            uint256 required = currentHighestBid + minBidIncrement;
            if (sentValue < required) {
                revert AuctionErrors.BidTooLow(sentValue, required);
            }
        }
    }

    function validateTitle(string calldata title) internal pure {
        uint256 length = bytes(title).length;
        if (length == 0) {
            revert AuctionErrors.EmptyField("title");
        }
        if (length > AuctionConstants.MAX_TITLE_LENGTH) {
            revert AuctionErrors.TitleTooLong(length, AuctionConstants.MAX_TITLE_LENGTH);
        }
    }

    function validateDescription(string calldata description) internal pure {
        uint256 length = bytes(description).length;
        if (length > AuctionConstants.MAX_DESCRIPTION_LENGTH) {
            revert AuctionErrors.DescriptionTooLong(length, AuctionConstants.MAX_DESCRIPTION_LENGTH);
        }
    }

    function validateURI(string calldata uri) internal pure {
        uint256 length = bytes(uri).length;
        if (length == 0) {
            revert AuctionErrors.EmptyField("metadataURI");
        }
        if (length > AuctionConstants.MAX_URI_LENGTH) {
            revert AuctionErrors.DescriptionTooLong(length, AuctionConstants.MAX_URI_LENGTH);
        }
    }

    function validateAddress(address addr) internal pure {
        if (addr == address(0)) {
            revert AuctionErrors.ZeroAddressNotAllowed();
        }
    }

    function validateAuctionExists(address seller, uint256 auctionId) internal pure {
        if (seller == address(0)) {
            revert AuctionErrors.AuctionNotFound(auctionId);
        }
    }

    function validateNotSeller(address seller, address caller, uint256 auctionId) internal pure {
        if (caller == seller) {
            revert AuctionErrors.SellerCannotBid(auctionId, caller);
        }
    }

    function validatePlatformFee(uint256 feeBps) internal pure {
        if (feeBps > AuctionConstants.MAX_PLATFORM_FEE_BPS) {
            revert AuctionErrors.FeeExceedsMaximum(feeBps, AuctionConstants.MAX_PLATFORM_FEE_BPS);
        }
    }

    function validateBatchSize(uint256 requested) internal pure {
        if (requested > AuctionConstants.MAX_BATCH_SIZE) {
            revert AuctionErrors.BatchSizeTooLarge(requested, AuctionConstants.MAX_BATCH_SIZE);
        }
    }
}
