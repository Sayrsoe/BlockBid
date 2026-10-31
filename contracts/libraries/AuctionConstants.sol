// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
library AuctionConstants {
    uint256 internal constant MIN_AUCTION_DURATION = 5 minutes;
    uint256 internal constant MAX_AUCTION_DURATION = 30 days;
    uint256 internal constant MAX_START_DELAY = 90 days;
    uint256 internal constant ANTI_SNIPE_WINDOW = 5 minutes;
    uint256 internal constant ANTI_SNIPE_EXTENSION = 10 minutes;
    uint8 internal constant MAX_SNIPE_EXTENSIONS = 5;
    uint256 internal constant MIN_BID_INCREMENT = 0.001 ether;
    uint256 internal constant DEFAULT_BID_INCREMENT = 0.01 ether;
    uint256 internal constant DEFAULT_ESCROW_PERIOD = 3 days;
    uint256 internal constant MAX_ESCROW_PERIOD = 14 days;
    uint256 internal constant MAX_PLATFORM_FEE_BPS = 1_000;
    uint256 internal constant DEFAULT_PLATFORM_FEE_BPS = 250;
    uint256 internal constant BPS_DENOMINATOR = 10_000;
    uint256 internal constant MAX_TITLE_LENGTH = 100;
    uint256 internal constant MAX_DESCRIPTION_LENGTH = 1_000;
    uint256 internal constant MAX_URI_LENGTH = 250;
    uint256 internal constant MAX_BATCH_SIZE = 50;
}
