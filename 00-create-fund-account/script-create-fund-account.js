import { PrivateKey } from '@hashgraph/sdk';
import { HDNode as ethersHdNode } from '@ethersproject/hdnode';
import dotenv from 'dotenv';
import bip39 from 'bip39'; // Import the entire module

async function main() {
    dotenv.config();
    if (!process.env.SEED_PHRASE) {
        throw new Error('Please set required keys in .env file.');
    }

    const seedPhrase = process.env.SEED_PHRASE;

    // Validate the seed phrase
    if (!bip39.validateMnemonic(seedPhrase)) { // Use validateMnemonic instead of isValidMnemonic
        throw new Error('Invalid mnemonic seed phrase.');
    }

    const hdNodeRoot = ethersHdNode.fromMnemonic(seedPhrase);
    const accountHdPath = `m/44'/60'/0'/0/0`;
    const hdNode = hdNodeRoot.derivePath(accountHdPath);

    const privateKey = PrivateKey.fromStringECDSA(hdNode.privateKey);
    const privateKeyHex = `0x${privateKey.toStringRaw()}`;
    const evmAddress = `0x${privateKey.publicKey.toEvmAddress()}`;
    const accountExplorerUrl = `https://hashscan.io/testnet/account/${evmAddress}`;
    const accountBalanceFetchApiUrl =
        `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${evmAddress}&limit=1&order=asc`;

    let accountBalanceTinybar;
    let accountBalanceHbar;
    let accountId;

    try {
        const accountBalanceFetch = await fetch(accountBalanceFetchApiUrl);
        const accountBalanceJson = await accountBalanceFetch.json();
        accountId = accountBalanceJson?.balances[0]?.account;
        accountBalanceTinybar = accountBalanceJson?.balances[0]?.balance;
        if (accountBalanceTinybar) {
            accountBalanceHbar = new Intl.NumberFormat('en-GB', {
                minimumFractionDigits: 8,
                maximumFractionDigits: 8,
            }).format(accountBalanceTinybar * (10 ** -8));
        }
    } catch (ex) {
        console.error('Error fetching account balance:', ex);
    }

    console.log(`privateKeyHex: ${privateKeyHex}`);
    console.log(`evmAddress: ${evmAddress}`);
    console.log(`accountExplorerUrl: ${accountExplorerUrl}`);
    console.log(`accountId: ${accountId}`);
    console.log(`accountBalanceHbar: ${accountBalanceHbar}`);

    return {
        privateKeyHex,
        evmAddress,
        accountExplorerUrl,
        accountBalanceFetchApiUrl,
        accountBalanceHbar,
        accountBalanceTinybar,
    };
}

main();

export default main;
