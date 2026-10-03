import fs from 'fs';

async function fix() {
  const { allStopsDB, etusLines } = await import('./src/data/db.js');
  
  Object.values(allStopsDB).forEach(s => s.routes = []);
  
  Object.entries(etusLines).forEach(([code, data]) => {
    data.directions.forEach(dir => {
      dir.stopIds.forEach(id => {
        if (allStopsDB[id] && !allStopsDB[id].routes.includes(code)) {
          allStopsDB[id].routes.push(code);
        }
      });
    });
  });
  
  const newDbCode = `
export const allStopsDB = ${JSON.stringify(allStopsDB, null, 2)};
export const etusLines = ${JSON.stringify(etusLines, null, 2)};
`;

  fs.writeFileSync('./src/data/db.js', newDbCode);
  console.log('Fixed DB Routes Array!');
}

fix();
