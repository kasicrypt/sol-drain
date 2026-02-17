// SOLANA TESTNET DRAINER - CREATE MALICIOUS TOKEN
const solanaWeb3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const fs = require('fs');

// TESTNET ONLY - SAFE
const NETWORK = 'https://api.testnet.solana.com';
const connection = new solanaWeb3.Connection(NETWORK, 'confirmed');

async function main() {
    console.log('🔰 SOLANA TESTNET DRAINER - EDUCATIONAL');
    console.log('========================================\n');

    // STEP 1: Create Attacker Wallet (gets stolen funds)
    console.log('🔑 Creating ATTACKER wallet (receives stolen funds)...');
    const attackerWallet = solanaWeb3.Keypair.generate();
    console.log('✅ Attacker Address:', attackerWallet.publicKey.toString());
    
    // STEP 2: Create Victim Wallet (has tokens to steal)
    console.log('\n👤 Creating VICTIM wallet (will get drained)...');
    const victimWallet = solanaWeb3.Keypair.generate();
    console.log('✅ Victim Address:', victimWallet.publicKey.toString());

    // Save both wallets
    fs.writeFileSync('attacker-wallet.json', JSON.stringify(Array.from(attackerWallet.secretKey)));
    fs.writeFileSync('victim-wallet.json', JSON.stringify(Array.from(victimWallet.secretKey)));
    
    console.log('\n💰 BOTH WALLETS NEED TESTNET SOL!');
    console.log('\n📋 ATTACKER WALLET (copy this):');
    console.log('==================================');
    console.log(attackerWallet.publicKey.toString());
    console.log('==================================');
    
    console.log('\n📋 VICTIM WALLET (copy this):');
    console.log('==================================');
    console.log(victimWallet.publicKey.toString());
    console.log('==================================');
    
    console.log('\n👉 Go to: https://solfaucet.com');
    console.log('👉 Send 2 SOL to ATTACKER wallet (do this 3 times)');
    console.log('👉 Send 2 SOL to VICTIM wallet (do this 3 times)');
    console.log('\n⚠️  After getting SOL, press Enter to continue...');
    
    // Wait for Enter key
    await new Promise(resolve => process.stdin.once('data', resolve));
    
    // Check balances
    const attackerBalance = await connection.getBalance(attackerWallet.publicKey);
    const victimBalance = await connection.getBalance(victimWallet.publicKey);
    
    console.log(`\n💰 Attacker balance: ${attackerBalance / 1e9} SOL`);
    console.log(`💰 Victim balance: ${victimBalance / 1e9} SOL`);
    
    if (attackerBalance < 0.01 || victimBalance < 0.01) {
        console.log('❌ Need more SOL! Run again after getting SOL.');
        return;
    }
    
    // STEP 3: Create Malicious Token
    console.log('\n🎣 Creating MALICIOUS token...');
    const tokenMint = solanaWeb3.Keypair.generate();
    
    const mint = await splToken.createMint(
        connection,
        attackerWallet,
        attackerWallet.publicKey,
        null,
        9
    );
    
    // Create token account for victim
    const victimTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        attackerWallet,
        mint,
        victimWallet.publicKey
    );
    
    // Mint 1000 malicious tokens to victim
    await splToken.mintTo(
        connection,
        attackerWallet,
        mint,
        victimTokenAccount.address,
        attackerWallet.publicKey,
        1000 * 1e9
    );
    
    console.log('✅ Malicious token created and sent to victim!');
    console.log('\n📋 TOKEN ADDRESS (import to Phantom):');
    console.log('==================================');
    console.log(mint.toBase58());
    console.log('==================================');
    
    // STEP 4: Give victim some USDC (the REAL token to steal)
    console.log('\n💰 Giving victim test USDC (the target)...');
    const usdcMint = new solanaWeb3.PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');
    
    const victimUsdcAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        attackerWallet,
        usdcMint,
        victimWallet.publicKey
    );
    
    console.log('✅ Victim USDC account ready');
    
    // STEP 5: Show the attack simulation
    console.log('\n🎯 ATTACK SIMULATION READY!');
    console.log('================================');
    console.log('1️⃣ Victim sees "Jupiter Airdrop" in Phantom (1000 tokens)');
    console.log('2️⃣ Victim tries to swap it for USDC');
    console.log('3️⃣ Hidden in swap: unlimited approval for USDC');
    console.log('4️⃣ Drainer bot takes all USDC to attacker wallet');
    console.log('\n✅ Run drain-bot.js next to simulate the drain!');
    
    // Save all addresses
    fs.writeFileSync('token-address.txt', mint.toBase58());
    fs.writeFileSync('victim-usdc-account.txt', victimUsdcAccount.address.toString());
}

main().catch(console.error);
