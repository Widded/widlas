import fs from 'fs';

fetch('https://otobusnerede.com/edirne/hat/1a')
  .then(r => r.text())
  .then(html => {
     const match = html.match(/<script type="application\/json" id="seo-map-data">([\s\S]*?)<\/script>/);
     if (match) {
        const d = JSON.parse(match[1]);
        const route = d.routes[0];
        console.log("Keys in route:", Object.keys(route));
        if (route.timetables || route.schedule || route.times) {
            console.log("Found times!");
        } else {
            console.log("No times array found in map data.");
        }
     } else {
        console.log("No map data");
     }
  })
  .catch(console.error);
