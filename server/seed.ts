// Seed script to populate initial signals for popular cryptocurrencies
import { storage } from "./storage";

const POPULAR_CRYPTOS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'cardano',
  'solana',
  'ripple',
  'polkadot',
  'dogecoin',
  'avalanche-2',
  'polygon',
];

async function seedSignals() {
  console.log('Seeding signals for popular cryptocurrencies...');
  
  for (const cryptoId of POPULAR_CRYPTOS) {
    try {
      console.log(`Generating signal for ${cryptoId}...`);
      const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/signals/generate/${cryptoId}`);
      
      if (response.ok) {
        const signal = await response.json();
        console.log(`✓ Generated signal for ${signal.cryptoName}: ${signal.signalType.toUpperCase()} (${signal.confidence}%)`);
      } else {
        console.log(`✗ Failed to generate signal for ${cryptoId}`);
      }
      
      // Rate limiting - wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error generating signal for ${cryptoId}:`, error);
    }
  }
  
  console.log('Seeding completed!');
  process.exit(0);
}

// Only run if called directly
if (require.main === module) {
  seedSignals().catch(console.error);
}

export { seedSignals };