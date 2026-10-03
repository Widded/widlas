import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

async function extractRoutes() {
  const dataBuffer = fs.readFileSync('ulasim_rehberi.pdf');
  
  try {
    const data = await pdf(dataBuffer);
    const text = data.text;
    
    // We are looking for blocks of text like "1A Nolu Hat Güzergahı : Gazimihal-Bankalar-Orduevi..."
    const lines = text.split('\n');
    let currentRouteName = null;
    let currentRouteStopsStr = '';
    const routes = {};

    // A more robust regex to find lines containing "Nolu Hat Güzergahı"
    const routeStartRegex = /([A-Z0-9]+)\s+Nolu\s+Hat\s+G[uü]zergah[ıi]\s*[:\-\s](.*)/i;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(routeStartRegex);
        
        if (match) {
            // Found a new route
            const routeId = match[1];
            currentRouteName = routeId;
            currentRouteStopsStr = match[2];
            routes[currentRouteName] = '';
        } else if (currentRouteName) {
            // If it's continuing the route
            // Check if we hit a stop condition like a new route or another section
            if (line.includes("Nolu Hat Güzergahı") || line.includes("Saatleri") || line.includes("Not:") || line.match(/^([A-Z0-9]+)\s+$/)) {
                // Done with current route, unless it's just a word wrapping
                if(line.includes("Nolu Hat Güzergahı")) {
                    currentRouteName = null;
                    i--; // re-process line
                    continue;
                }
            }
            
            // Collect the text. The routes end when we stop seeing hyphen-separated text or we hit "Not:"
            if (line.startsWith("Not:") || line.startsWith("NOT:")) {
                currentRouteName = null;
                continue;
            }
            
            if (line.length > 0) {
               currentRouteStopsStr += ' ' + line;
               routes[currentRouteName] = currentRouteStopsStr;
            }
        }
    }
    
    console.log(JSON.stringify(routes, null, 2));

  } catch (error) {
    console.error("PDF Parsing error:", error);
  }
}

extractRoutes();
