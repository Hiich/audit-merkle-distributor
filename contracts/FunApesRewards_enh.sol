// File: FunApeRewards.sol

pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import hardhat console
import "hardhat/console.sol";

contract FunApesRewardsEnh is Ownable {
    mapping(address => uint256) public TOTAL_CLAIMED;
    bytes32 public merkleRoot;

    address APECOIN_CONTRACT = 0xd9145CCE52D386f254917e481eB44e9943F39138; //EXAMPLE ADDRESS - CHANGE

    function claimRewards(
        uint256 claimAmount,
        uint256 totalRewards,
        bytes32[] calldata _merkleProof
    ) external {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, totalRewards));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Merkle Proof."
        );
        require(
            TOTAL_CLAIMED[msg.sender] + claimAmount <= totalRewards,
            "Max Claim Amount"
        );
        TOTAL_CLAIMED[msg.sender] += claimAmount;
        IERC20(APECOIN_CONTRACT).transfer(msg.sender, claimAmount);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function withdrawAPE(uint256 amount) external onlyOwner {
        IERC20(APECOIN_CONTRACT).transfer(msg.sender, amount);
    }

    function setApeCoinAddress(address _apeCoin) external onlyOwner {
        APECOIN_CONTRACT = _apeCoin;
    }
}
