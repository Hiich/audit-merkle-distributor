const { Wallet } = require("ethers")
const keys = require("../data/test-wallets.json")
const getWallets = async (amount, provider) => {
    const signers = [];
    // Generate a new random private key
    for (let i = 0; i < amount; i++) {
        // Generate a new random private key
        const privateKey = Wallet.createRandom().privateKey;
        const signer = new Wallet(privateKey, provider);
        signers.push(signer);
    }

    return signers;
}

const getWalletsFromKeys = (provider) => {
    const signers = [];
    // Generate a new random private key
    for (let i = 0; i < keys.length; i++) {
        const signer = new Wallet(keys[i], provider);
        signers.push(signer);
    }

    return signers;
}

module.exports = {
    getWallets,
    getWalletsFromKeys
}