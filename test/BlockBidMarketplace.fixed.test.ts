import { expect } from "chai";
import { parseEther, ZeroAddress } from "ethers";
import { network } from "hardhat";

const connection = await network.create();
const { ethers } = connection;
const networkHelpers = (connection as any).networkHelpers;

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const DEFAULT_STARTING_PRICE = parseEther("1");
const DEFAULT_RESERVE_PRICE = parseEther("1.5");
const DEFAULT_INCREMENT = parseEther("0.1");
const FIRST_BID = parseEther("1.5");
const WINNING_BID = parseEther("2");
const PLATFORM_FEE_BPS = 250n;
const BPS_DENOMINATOR = 10_000n;

const AuctionStatus = {
  Active: 1n,
  Ended: 2n,
  Finalized: 3n,
  Cancelled: 4n,
} as const;

const PaymentStatus = {
  Escrowed: 1n,
  Released: 2n,
} as const;

const BidStatus = {
  Active: 0n,
  Outbid: 1n,
  Winning: 2n,
  Refunded: 3n,
} as const;

async function deployFixture() {
  const [owner, seller, bidderA, bidderB, feeRecipient, keeper, outsider] =
    await ethers.getSigners();

  const marketplace: any = await ethers.deployContract("BlockBidMarketplace", [
    feeRecipient.address,
  ]);
  await marketplace.waitForDeployment();

  return {
    marketplace,
    owner,
    seller,
    bidderA,
    bidderB,
    feeRecipient,
    keeper,
    outsider,
  };
}

type AuctionOptions = {
  startingPrice?: bigint;
  reservePrice?: bigint;
  minBidIncrement?: bigint;
  startDelay?: number;
  duration?: number;
  category?: number;
  metadataURI?: string;
};

async function createAuction(
  marketplace: any,
  seller: any,
  options: AuctionOptions = {},
) {
  const latest = await networkHelpers.time.latest();
  const startTime = latest + (options.startDelay ?? 60);
  const endTime = startTime + (options.duration ?? HOUR);

  await (
    await marketplace.connect(seller).createAuction(
      options.startingPrice ?? DEFAULT_STARTING_PRICE,
      options.reservePrice ?? DEFAULT_RESERVE_PRICE,
      options.minBidIncrement ?? DEFAULT_INCREMENT,
      startTime,
      endTime,
      options.category ?? 2,
      options.metadataURI ?? "ipfs://blockbid-test-auction",
    )
  ).wait();

  const auctionId = await marketplace.getTotalAuctions();
  return { auctionId, startTime, endTime };
}

async function moveTo(timestamp: bigint | number) {
  const latest = await networkHelpers.time.latest();
  const target = Number(timestamp);
  if (latest < target) {
    await networkHelpers.time.increaseTo(target);
  }
}

async function createStartedAuction(
  marketplace: any,
  seller: any,
  options: AuctionOptions = {},
) {
  const created = await createAuction(marketplace, seller, options);
  await moveTo(created.startTime);
  return created;
}

async function createSuccessfulEndedAuction(fixture: Awaited<ReturnType<typeof deployFixture>>) {
  const { marketplace, seller, bidderB, keeper } = fixture;
  const created = await createStartedAuction(marketplace, seller);

  await (
    await marketplace.connect(bidderB).placeBid(created.auctionId, {
      value: WINNING_BID,
    })
  ).wait();

  const auctionBeforeEnd = await marketplace.getAuction(created.auctionId);
  await moveTo(auctionBeforeEnd.endTime);
  await (await marketplace.connect(keeper).endAuction(created.auctionId)).wait();

  return created;
}

describe("BlockBidMarketplace", function () {
  describe("Deployment and configuration", function () {
    it("sets the owner, fee recipient, and default platform fee", async function () {
      const { marketplace, owner, feeRecipient } =
        await networkHelpers.loadFixture(deployFixture);

      expect(await marketplace.owner()).to.equal(owner.address);
      expect(await marketplace.getFeeRecipient()).to.equal(feeRecipient.address);
      expect(await marketplace.getPlatformFee()).to.equal(PLATFORM_FEE_BPS);
      expect(await marketplace.getTotalAuctions()).to.equal(0n);
    });

    it("rejects a zero fee recipient", async function () {
      const { marketplace } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        ethers.deployContract("BlockBidMarketplace", [ZeroAddress]),
      ).to.revert(ethers);
    });

    it("allows only the owner to update platform settings", async function () {
      const { marketplace, owner, outsider } =
        await networkHelpers.loadFixture(deployFixture);

      await expect(
        marketplace.connect(outsider).setPlatformFee(300),
      ).to.revert(ethers);

      await expect(marketplace.connect(owner).setPlatformFee(300))
        .to.emit(marketplace, "PlatformFeeUpdated")
        .withArgs(250n, 300n);

      expect(await marketplace.getPlatformFee()).to.equal(300n);

      await expect(
        marketplace.connect(owner).setPlatformFee(1001),
      ).to.revert(ethers);
    });
  });

  describe("Auction creation and editing", function () {
    it("creates and indexes an auction", async function () {
      const { marketplace, seller } =
        await networkHelpers.loadFixture(deployFixture);

      const { auctionId, startTime, endTime } = await createAuction(
        marketplace,
        seller,
      );
      const auction = await marketplace.getAuction(auctionId);
      const sellerIds = await marketplace.getAuctionsBySeller(
        seller.address,
        0,
        10,
      );

      expect(auction.auctionId).to.equal(auctionId);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.status).to.equal(AuctionStatus.Active);
      expect(auction.startTime).to.equal(BigInt(startTime));
      expect(auction.endTime).to.equal(BigInt(endTime));
      expect(auction.startingPrice).to.equal(DEFAULT_STARTING_PRICE);
      expect(auction.reservePrice).to.equal(DEFAULT_RESERVE_PRICE);
      expect(auction.minBidIncrement).to.equal(DEFAULT_INCREMENT);
      expect(auction.metadataURI).to.equal("ipfs://blockbid-test-auction");
      expect(sellerIds).to.deep.equal([auctionId]);
    });

    it("rejects invalid prices and durations", async function () {
      const { marketplace, seller } =
        await networkHelpers.loadFixture(deployFixture);
      const latest = await networkHelpers.time.latest();
      const start = latest + 60;

      await expect(
        marketplace.connect(seller).createAuction(
          0,
          0,
          DEFAULT_INCREMENT,
          start,
          start + HOUR,
          0,
          "ipfs://valid",
        ),
      ).to.be.revertedWithCustomError(
        marketplace,
        "PriceMustBeGreaterThanZero",
      );

      await expect(
        marketplace.connect(seller).createAuction(
          DEFAULT_STARTING_PRICE,
          parseEther("0.5"),
          DEFAULT_INCREMENT,
          start,
          start + HOUR,
          0,
          "ipfs://valid",
        ),
      ).to.be.revertedWithCustomError(
        marketplace,
        "ReserveBelowStartingPrice",
      );

      await expect(
        marketplace.connect(seller).createAuction(
          DEFAULT_STARTING_PRICE,
          DEFAULT_RESERVE_PRICE,
          DEFAULT_INCREMENT,
          start,
          start + HOUR - 1,
          0,
          "ipfs://valid",
        ),
      ).to.be.revertedWithCustomError(
        marketplace,
        "InvalidAuctionDuration",
      );
    });

    it("lets the seller edit metadata before the first bid", async function () {
      const { marketplace, seller } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createAuction(marketplace, seller);

      await marketplace
        .connect(seller)
        .editAuctionMetadata(auctionId, "ipfs://updated");

      expect((await marketplace.getAuction(auctionId)).metadataURI).to.equal(
        "ipfs://updated",
      );
    });
  });

  describe("Bidding and refunds", function () {
    it("rejects bidding before start time", async function () {
      const { marketplace, seller, bidderA } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createAuction(marketplace, seller, {
        startDelay: 300,
      });

      await expect(
        marketplace.connect(bidderA).placeBid(auctionId, {
          value: FIRST_BID,
        }),
      ).to.be.revertedWithCustomError(marketplace, "AuctionNotActive");
    });

    it("rejects seller bids and bids below the required amount", async function () {
      const { marketplace, seller, bidderA, bidderB } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createStartedAuction(marketplace, seller);

      await expect(
        marketplace.connect(seller).placeBid(auctionId, {
          value: FIRST_BID,
        }),
      ).to.be.revertedWithCustomError(marketplace, "SellerCannotBid");

      await expect(
        marketplace.connect(bidderA).placeBid(auctionId, {
          value: parseEther("0.9"),
        }),
      ).to.be.revertedWithCustomError(
        marketplace,
        "BidBelowStartingPrice",
      );

      await marketplace.connect(bidderA).placeBid(auctionId, {
        value: FIRST_BID,
      });

      await expect(
        marketplace.connect(bidderB).placeBid(auctionId, {
          value: parseEther("1.55"),
        }),
      ).to.be.revertedWithCustomError(marketplace, "BidTooLow");
    });

    it("records a valid first bid", async function () {
      const { marketplace, seller, bidderA } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createStartedAuction(marketplace, seller);

      await expect(
        marketplace.connect(bidderA).placeBid(auctionId, {
          value: FIRST_BID,
        }),
      ).to.emit(marketplace, "BidPlaced");

      const auction = await marketplace.getAuction(auctionId);
      const history = await marketplace.getBidHistory(auctionId);

      expect(auction.highestBidder).to.equal(bidderA.address);
      expect(auction.currentHighestBid).to.equal(FIRST_BID);
      expect(auction.totalBids).to.equal(1n);
      expect(auction.reserveMet).to.equal(true);
      expect(history).to.have.length(1);
      expect(history[0].bidder).to.equal(bidderA.address);
      expect(history[0].status).to.equal(BidStatus.Active);
      expect(history[0].amount).to.equal(FIRST_BID);
      expect(await marketplace.getMinimumNextBid(auctionId)).to.equal(
        FIRST_BID + DEFAULT_INCREMENT,
      );
    });

    it("prevents the current highest bidder from bidding against themselves", async function () {
      const { marketplace, seller, bidderA } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createStartedAuction(marketplace, seller);

      await marketplace.connect(bidderA).placeBid(auctionId, {
        value: FIRST_BID,
      });

      await expect(
        marketplace.connect(bidderA).placeBid(auctionId, {
          value: WINNING_BID,
        }),
      ).to.be.revertedWithCustomError(
        marketplace,
        "AlreadyHighestBidder",
      );
    });

    it("credits the previous bidder through pull-payment accounting", async function () {
      const { marketplace, seller, bidderA, bidderB } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createStartedAuction(marketplace, seller);

      await marketplace.connect(bidderA).placeBid(auctionId, {
        value: FIRST_BID,
      });

      await expect(
        marketplace.connect(bidderB).placeBid(auctionId, {
          value: WINNING_BID,
        }),
      )
        .to.emit(marketplace, "RefundIssued")
        .withArgs(bidderA.address, FIRST_BID, auctionId);

      const history = await marketplace.getBidHistory(auctionId);
      expect(history[0].status).to.equal(BidStatus.Outbid);
      expect(history[1].status).to.equal(BidStatus.Active);
      expect(await marketplace.getPendingRefund(bidderA.address)).to.equal(
        FIRST_BID,
      );
    });

    it("allows a refund to be claimed once", async function () {
      const { marketplace, seller, bidderA, bidderB } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createStartedAuction(marketplace, seller);

      await marketplace.connect(bidderA).placeBid(auctionId, {
        value: FIRST_BID,
      });
      await marketplace.connect(bidderB).placeBid(auctionId, {
        value: WINNING_BID,
      });

      await expect(marketplace.connect(bidderA).claimRefund())
        .to.emit(marketplace, "RefundClaimed")
        .withArgs(bidderA.address, FIRST_BID);

      expect(await marketplace.getPendingRefund(bidderA.address)).to.equal(0n);

      await expect(
        marketplace.connect(bidderA).claimRefund(),
      ).to.be.revertedWithCustomError(marketplace, "NoFundsToWithdraw");
    });

    it("extends the auction once for a late bid", async function () {
      const { marketplace, seller, bidderA, bidderB } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId, endTime } = await createAuction(marketplace, seller);

      await moveTo(endTime - 300);

      await expect(
        marketplace.connect(bidderA).placeBid(auctionId, {
          value: FIRST_BID,
        }),
      )
        .to.emit(marketplace, "AuctionExtended")
        .withArgs(auctionId, BigInt(endTime), BigInt(endTime + 600));

      const extended = await marketplace.getAuction(auctionId);
      expect(extended.endTime).to.equal(BigInt(endTime + 600));
      expect(extended.antiSnipeTriggered).to.equal(true);

      await moveTo(extended.endTime - 60n);
      await marketplace.connect(bidderB).placeBid(auctionId, {
        value: WINNING_BID,
      });

      expect((await marketplace.getAuction(auctionId)).endTime).to.equal(
        extended.endTime,
      );
    });
  });

  describe("Cancellation and ending", function () {
    it("allows cancellation before any bid", async function () {
      const { marketplace, seller } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createAuction(marketplace, seller);

      await expect(
        marketplace.connect(seller).cancelAuction(auctionId),
      ).to.emit(marketplace, "AuctionCancelled");

      expect((await marketplace.getAuction(auctionId)).status).to.equal(
        AuctionStatus.Cancelled,
      );
    });

    it("rejects cancellation after a bid", async function () {
      const { marketplace, seller, bidderA } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createStartedAuction(marketplace, seller);

      await marketplace.connect(bidderA).placeBid(auctionId, {
        value: FIRST_BID,
      });

      await expect(
        marketplace.connect(seller).cancelAuction(auctionId),
      ).to.be.revertedWithCustomError(marketplace, "CannotCancelAfterBid");
    });

    it("rejects ending an auction before its end time", async function () {
      const { marketplace, seller, keeper } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createStartedAuction(marketplace, seller);

      await expect(
        marketplace.connect(keeper).endAuction(auctionId),
      ).to.be.revertedWithCustomError(marketplace, "AuctionNotEnded");
    });

    it("refunds the highest bidder when the reserve was not met", async function () {
      const { marketplace, seller, bidderA, keeper } =
        await networkHelpers.loadFixture(deployFixture);
      const { auctionId } = await createStartedAuction(marketplace, seller, {
        reservePrice: parseEther("3"),
      });

      await marketplace.connect(bidderA).placeBid(auctionId, {
        value: FIRST_BID,
      });

      const beforeEnd = await marketplace.getAuction(auctionId);
      await moveTo(beforeEnd.endTime);
      await marketplace.connect(keeper).endAuction(auctionId);

      const auction = await marketplace.getAuction(auctionId);
      const history = await marketplace.getBidHistory(auctionId);

      expect(auction.status).to.equal(AuctionStatus.Ended);
      expect(auction.highestBidder).to.equal(ZeroAddress);
      expect(auction.currentHighestBid).to.equal(0n);
      expect(history[0].status).to.equal(BidStatus.Refunded);
      expect(await marketplace.getPendingRefund(bidderA.address)).to.equal(
        FIRST_BID,
      );
    });

    it("moves a successful winning bid into escrow", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { marketplace, bidderB } = fixture;
      const { auctionId } = await createSuccessfulEndedAuction(fixture);

      const auction = await marketplace.getAuction(auctionId);
      const escrow = await marketplace.getEscrowInfo(auctionId);
      const history = await marketplace.getBidHistory(auctionId);

      expect(auction.status).to.equal(AuctionStatus.Ended);
      expect(auction.highestBidder).to.equal(bidderB.address);
      expect(escrow.amount).to.equal(WINNING_BID);
      expect(escrow.depositor).to.equal(bidderB.address);
      expect(escrow.status).to.equal(PaymentStatus.Escrowed);
      expect(history[0].status).to.equal(BidStatus.Winning);
    });
  });

  describe("Escrow settlement", function () {
    it("rejects settlement before the escrow deadline", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { marketplace, seller, keeper } = fixture;
      const { auctionId } = await createSuccessfulEndedAuction(fixture);

      await expect(
        marketplace.connect(keeper).finalizeAuction(auctionId),
      ).to.be.revertedWithCustomError(marketplace, "EscrowStillLocked");

      await expect(
        marketplace.connect(seller).claimProceeds(auctionId),
      ).to.be.revertedWithCustomError(marketplace, "EscrowStillLocked");
    });

    it("prevents a non-seller from using claimProceeds", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { marketplace, outsider } = fixture;
      const { auctionId } = await createSuccessfulEndedAuction(fixture);

      const escrow = await marketplace.getEscrowInfo(auctionId);
      await moveTo(escrow.releaseDeadline);

      await expect(
        marketplace.connect(outsider).claimProceeds(auctionId),
      ).to.be.revertedWithCustomError(marketplace, "NotAuctionSeller");
    });

    it("finalizes escrow, pays seller and platform, and prevents double settlement", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { marketplace, seller, feeRecipient, keeper } = fixture;
      const { auctionId } = await createSuccessfulEndedAuction(fixture);

      const escrowBefore = await marketplace.getEscrowInfo(auctionId);
      await moveTo(escrowBefore.releaseDeadline);

      const platformFee =
        (WINNING_BID * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
      const sellerPayment = WINNING_BID - platformFee;
      const sellerBalanceBefore = await ethers.provider.getBalance(
        seller.address,
      );
      const feeBalanceBefore = await ethers.provider.getBalance(
        feeRecipient.address,
      );

      await expect(
        marketplace.connect(keeper).finalizeAuction(auctionId),
      )
        .to.emit(marketplace, "AuctionFinalized")
        .withArgs(auctionId, fixture.bidderB.address, sellerPayment);

      const sellerBalanceAfter = await ethers.provider.getBalance(
        seller.address,
      );
      const feeBalanceAfter = await ethers.provider.getBalance(
        feeRecipient.address,
      );
      const auction = await marketplace.getAuction(auctionId);
      const escrowAfter = await marketplace.getEscrowInfo(auctionId);

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerPayment);
      expect(feeBalanceAfter - feeBalanceBefore).to.equal(platformFee);
      expect(auction.status).to.equal(AuctionStatus.Finalized);
      expect(auction.sellerClaimed).to.equal(true);
      expect(escrowAfter.status).to.equal(PaymentStatus.Released);

      await expect(
        marketplace.connect(keeper).finalizeAuction(auctionId),
      ).to.be.revertedWithCustomError(
        marketplace,
        "EscrowAlreadySettled",
      );
    });

    it("allows the seller to settle through claimProceeds", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { marketplace, seller } = fixture;
      const { auctionId } = await createSuccessfulEndedAuction(fixture);

      const escrow = await marketplace.getEscrowInfo(auctionId);
      await moveTo(escrow.releaseDeadline);

      await expect(marketplace.connect(seller).claimProceeds(auctionId)).to.emit(
        marketplace,
        "SellerPaid",
      );

      expect((await marketplace.getAuction(auctionId)).status).to.equal(
        AuctionStatus.Finalized,
      );
    });
  });

  describe("Pause behavior", function () {
    it("blocks new creation and bidding but allows refunds, ending, and settlement", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const {
        marketplace,
        owner,
        seller,
        bidderA,
        bidderB,
        outsider,
        keeper,
      } = fixture;
      const { auctionId } = await createStartedAuction(marketplace, seller);

      await marketplace.connect(bidderA).placeBid(auctionId, {
        value: FIRST_BID,
      });
      await marketplace.connect(bidderB).placeBid(auctionId, {
        value: WINNING_BID,
      });

      await marketplace.connect(owner).pause();

      const latest = await networkHelpers.time.latest();
      await expect(
        marketplace.connect(seller).createAuction(
          DEFAULT_STARTING_PRICE,
          DEFAULT_RESERVE_PRICE,
          DEFAULT_INCREMENT,
          latest + 60,
          latest + 60 + HOUR,
          0,
          "ipfs://paused",
        ),
      ).to.revert(ethers);

      await expect(
        marketplace.connect(outsider).placeBid(auctionId, {
          value: parseEther("2.1"),
        }),
      ).to.revert(ethers);

      await expect(marketplace.connect(bidderA).claimRefund()).to.emit(
        marketplace,
        "RefundClaimed",
      );

      const auctionBeforeEnd = await marketplace.getAuction(auctionId);
      await moveTo(auctionBeforeEnd.endTime);
      await expect(marketplace.connect(keeper).endAuction(auctionId)).to.emit(
        marketplace,
        "AuctionEnded",
      );

      const escrow = await marketplace.getEscrowInfo(auctionId);
      await moveTo(escrow.releaseDeadline);
      await expect(
        marketplace.connect(keeper).finalizeAuction(auctionId),
      ).to.emit(marketplace, "AuctionFinalized");
    });
  });

  describe("Deferred MVP features", function () {
    it("explicitly reverts for disputes, emergency withdrawal, and statistics", async function () {
      const { marketplace } = await networkHelpers.loadFixture(deployFixture);

      await expect(
        marketplace.openDispute(1, "ipfs://reason"),
      ).to.be.revertedWithCustomError(marketplace, "NotYetImplemented");
      await expect(
        marketplace.resolveDispute(1, 3),
      ).to.be.revertedWithCustomError(marketplace, "NotYetImplemented");
      await expect(
        marketplace.emergencyWithdraw(ZeroAddress, 1),
      ).to.be.revertedWithCustomError(marketplace, "NotYetImplemented");
      await expect(
        marketplace.getPlatformStatistics(),
      ).to.be.revertedWithCustomError(marketplace, "NotYetImplemented");
    });
  });
});

