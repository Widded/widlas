import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const token = env.split('\n').find(l => l.startsWith('VITE_TOMTOM_TOKEN')).split('=')[1].trim();
const url = `https://api.tomtom.com/search/2/search/Tunca%20K%C3%B6pr%C3%BCs%C3%BC.json?key=${token}&lat=41.6771&lon=26.5557&radius=15000&language=tr-TR&limit=5`;

fetch(url)
  .then(r => r.json())
  .then(d => {
      console.log(JSON.stringify(d.results?.map(r => ({
          name: r.poi?.name, 
          street: r.address?.streetName, 
          freeform: r.address?.freeformAddress,
          type: r.type
      })), null, 2));
  })
  .catch(console.error);
