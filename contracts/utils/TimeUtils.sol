// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AuctionConstants} from "../libraries/AuctionConstants.sol";
import {AuctionErrors} from "../libraries/AuctionErrors.sol";

library TimeUtils {
    function auctionExpired(uint256 endTime) internal view returns (bool expired) {
        return block.timestamp >= endTime;
    }

    function auctionStarted(uint256 startTime) internal view returns (bool started) {
        return block.timestamp >= startTime;
    }

    function escrowExpired(uint256 releaseDeadline) internal view returns (bool expired) {
        return block.timestamp >= releaseDeadline;
    }

    function shouldExtendAuction(uint256 endTime) internal view returns (bool shouldExtend) {
        if (block.timestamp >= endTime) {
            return false;
        }
        return (endTime - block.timestamp) <= AuctionConstants.ANTI_SNIPE_WINDOW;
    }

    function extendAuctionEndTime(uint256 currentEndTime) internal pure returns (uint256 newEndTime) {
        newEndTime = currentEndTime + AuctionConstants.ANTI_SNIPE_EXTENSION;
        if (newEndTime > type(uint40).max) {
            revert AuctionErrors.TimeExtensionOverflow(newEndTime);
        }
    }

    function remainingTime(uint256 endTime) internal view returns (uint256 remaining) {
        if (block.timestamp >= endTime) {
            return 0;
        }
        return endTime - block.timestamp;
    }

    function computeEscrowDeadline(uint256 settledAt) internal pure returns (uint256 deadline) {
        return settledAt + AuctionConstants.DEFAULT_ESCROW_PERIOD;
    }
}
