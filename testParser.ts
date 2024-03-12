import { processMessage } from './src/processor/TokenProcessor';
const text = `Prelaunch (🔥SOL) CrazyBunny

"CrazyBunny had a presale on SolPad and is now going live! CrazyBunny was first launched successfully on BSC and has CEX listing, GotBit MM, 8500+ holders, Ads in NY Time Square, and several partnerships including Avadex!"

Launches Soon ‼️Wait for lock, renounce, lower to be safe. DYOR

✅ https://t.me/CrazyBunnyEN
🚀https://twitter.com/crazybunnysol
🌐 https://crazybunny.top/
ECA
2ncKzZN6b2GbwWZVxQ4Q7nRQZbzqaR61MXrp4J7VE4Zj`;

const solanaAddressRegex = /\b[A-Za-z0-9]{40,44}\b/g;
function extractSolanaAddresses(text: string): string {
    const matches = text.match(solanaAddressRegex);
    if (matches) {
        return matches.join('\n'); // Join the matches with newline characters
    } else {
        return "No Solana addresses found in the text.";
    }
}
 

processMessage({message:text});