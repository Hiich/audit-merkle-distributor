const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256")


const generateMerkleTree = (leaves) => {
    const hashedLeaves = leaves.map(leaf => keccak256(JSON.stringify(leaf)));
    const tree = new MerkleTree(hashedLeaves, keccak256, { isBitcoinTree: false });
    const root = tree.getRoot();

    const proofs = leaves.map(l => {
        const proof = tree.getProof(l.address);
        const proofValues = proof.map(p => p.data.toString("hex"));
        return {
            address: l.address,
            proof: proofValues,
        };
    });

    return ({ root, proofs });
}

const getUserProof = (userAddress, proofs) => {
    const proofValues = proofs.find(p => p.address === userAddress);

    if (!proofValues) {
        throw new Error("User not found");
    }

    return proofValues.proof;
}

const generateLeaves = (wallets, totalRewards) => {
    const leaves = wallets.map(w => {
        return {
            address: w.address,
            totalRewards: totalRewards,
        }
    });

    return leaves;
}

module.exports = {
    generateMerkleTree,
    getUserProof,
    generateLeaves,
}