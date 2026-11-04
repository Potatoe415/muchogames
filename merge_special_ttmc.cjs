const fs = require('fs');
const { execSync } = require('child_process');

// Get main version (has the 7 inferred cards + previous 524)
const mainData = JSON.parse(fs.readFileSync('public/data/ttmc/ttmc_data.json', 'utf8'));

// Get feature branch version
const featDataStr = execSync('git show origin/feat/special-cards:public/data/ttmc/ttmc_data.json', { encoding: 'utf8' });
const featData = JSON.parse(featDataStr);

// The feature branch added the special cards. We just need to extract those.
const specialThemes = ['Challenge', 'Débuter', 'Gagner', 'Superbe'];
const specialCards = featData.cards.filter(c => specialThemes.includes(c.theme));

mainData.cards.push(...specialCards);

fs.writeFileSync('public/data/ttmc/ttmc_data.json', JSON.stringify(mainData, null, 2));
console.log(`Merged! Total cards: ${mainData.cards.length} (added ${specialCards.length} special cards)`);
