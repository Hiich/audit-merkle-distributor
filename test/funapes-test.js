const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { generateMerkleTree, getUserProof, generateLeaves } = require("../helpers/merkle-root");
const { getWalletsFromKeys } = require("../helpers/wallets");
const merkleDistribution1 = require("../data/merkle-distribution-1.json");
const merkleDistribution2 = require("../data/merkle-distribution-2.json");

describe("FunApesRewards", function () {
  //apply before each test
  beforeEach(async function () {
    //get signers
    const [owner] = await ethers.getSigners();
    this.owner = owner;

    const provider = ethers.provider;
    this.signers = getWalletsFromKeys(provider);
    this.wallets = this.signers.map((s) => s.address);

    for (const w of this.wallets) {
      await this.owner.sendTransaction({
        to: w,
        value: parseEther("1"),
      });
    }

    const FunApesRewards = await ethers.getContractFactory("FunApesRewardsEnh");
    const funApesRewards = await FunApesRewards.deploy();
    await funApesRewards.deployed();

    const ApeCoin = await ethers.getContractFactory("ApeCoin");
    const apeCoin = await ApeCoin.deploy();
    await apeCoin.deployed();

    //aidrop tokens to funapesrewards contract
    await apeCoin.transfer(funApesRewards.address, parseEther("1000000"));
    this.funApesRewards = funApesRewards;
    this.apeCoin = apeCoin;

    //get first merkle distribution
    await this.funApesRewards.setMerkleRoot(merkleDistribution1.merkleRoot);

    //set correct apecoin address
    await this.funApesRewards.setApeCoinAddress(apeCoin.address);
  });


  describe("#interactions", async function () {
    it("Should set merkle root", async function () {
      await this.funApesRewards.setMerkleRoot(merkleDistribution1.merkleRoot);
      expect(await this.funApesRewards.merkleRoot()).to.equal(merkleDistribution1.merkleRoot);
    });

    it("Should set merkle root only by owner", async function () {
      await expect(
        this.funApesRewards.connect(this.signers[0]).setMerkleRoot(merkleDistribution1.merkleRoot)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("#claim", async function () {
    it("#--------------first round---------------Should claim tokens for all users ", async function () {
      for (const [address, claim] of Object.entries(merkleDistribution1.claims)) {
        const proof = claim.proof;
        const amount = claim.amount;
        const signer = this.signers.find((s) => s.address === address);
        await this.funApesRewards.connect(signer).claimRewards(1000000, amount, proof);
        expect(await this.apeCoin.balanceOf(address)).to.equal(
          1000000
        );
      }
    });

    it("Should not claim beyond the limit", async function () {
      for (const [address, claim] of Object.entries(merkleDistribution1.claims)) {
        const proof = claim.proof;
        const amount = claim.amount;
        const signer = this.signers.find((s) => s.address === address);
        await this.funApesRewards.connect(signer).claimRewards(1000000, amount, proof);
        await expect(
          this.funApesRewards.connect(signer).claimRewards(1000000, amount, proof)
        ).to.be.revertedWith("Max Claim Amount");
      }
    })

    it("Should not claim with invalid proof", async function () {
      for (const [address, claim] of Object.entries(merkleDistribution1.claims)) {
        const proof = claim.proof;
        const amount = claim.amount;
        const signer = this.signers.find((s) => s.address === address);
        await expect(
          this.funApesRewards.connect(signer).claimRewards(1000000, amount, proof.slice(1))
        ).to.be.revertedWith("Invalid Merkle Proof.");
      }
    });

    it("Should not claim with invalid amount", async function () {
      for (const [address, claim] of Object.entries(merkleDistribution1.claims)) {
        const proof = claim.proof;
        const amount = claim.amount;
        const signer = this.signers.find((s) => s.address === address);
        await expect(
          this.funApesRewards.connect(signer).claimRewards(1000000, amount + 1, proof)
        ).to.be.revertedWith("Invalid Merkle Proof.");
      }
    });

    it("#--------------second round---------------Should claim tokens for all users ", async function () {
      for (const [address, claim] of Object.entries(merkleDistribution1.claims)) {
        const proof = claim.proof;
        const amount = claim.amount;
        const signer = this.signers.find((s) => s.address === address);
        await this.funApesRewards.connect(signer).claimRewards(amount, amount, proof);
        expect(await this.apeCoin.balanceOf(address)).to.equal(
          amount
        );
      }

      await this.funApesRewards.setMerkleRoot(merkleDistribution2.merkleRoot);
      expect(await this.funApesRewards.merkleRoot()).to.equal(merkleDistribution2.merkleRoot);

      for (const [address, claim] of Object.entries(merkleDistribution2.claims)) {
        const totalClaimed = await this.funApesRewards.TOTAL_CLAIMED(address)
        expect(totalClaimed).to.equal(1000000)
        const proof = claim.proof;
        const amount = claim.amount;
        const signer = this.signers.find((s) => {
          return s.address === address
        })
        await this.funApesRewards.connect(signer).claimRewards(amount - totalClaimed, amount, proof);
        expect(await this.apeCoin.balanceOf(address)).to.equal(
          amount
        );
      }
    });
  });

  describe("#withdraw", async function () {
    it("Should withdraw tokens", async function () {
      const balanceBefore = await this.apeCoin.balanceOf(this.owner.address);
      await this.funApesRewards.withdrawAPE(parseEther("1000000"));
      const balanceAfter = await this.apeCoin.balanceOf(this.owner.address);
      expect(balanceAfter).to.equal(balanceBefore.add(parseEther("1000000")));
    });

    it("Should withdraw tokens only by owner", async function () {
      await expect(
        this.funApesRewards.connect(this.signers[0]).withdrawAPE(parseEther("1000000"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

});
