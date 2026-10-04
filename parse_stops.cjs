const fs = require('fs');

const rawText = `A C A R P A R K 3 A
A C I Ç E Ş M E M E Z A R L I K 5 A 5 B
A Ç I K C E Z A E V İ V E L O J M A N L A R I 6
A D L İ Y E A L T I 4 4 A
A D L İ Y E 6
A R A Z C A F E ( H a l ı s a h a Y ö n ü ) 5 5 A
A R A Z C A F E ( H a s t a n e Y ö n ü ) 2 A
A R S E V E N S İ T E S İ 1 A
A S K E R L İ K Ş U B E S İ ( H a s t a n e Y ö n ü ) 2 A 7 A
A T A T Ü R K K Ü L T Ü R M E R K E Z İ 5 5 A
A V R U P A K E N T 1 A
A Y Ç İ Ç E K H E Y K E L İ 3 C
A Y Ş E K A D I N C A M İ İ 1 A 1 F 2 A 2 B 3 3 A 4 5 5 B 6
A Y Ş E K A D I N K A R A K O L 1 A 1 F 2 A 2 B 3 3 A 4 5 5 B 6
B A C A ( Ç a r ş ı Y ö n ü ) 2 B 3 C
B A C A ( H a s t a n e Y ö n ü ) 2 B 3 C
B A D E M L İ K 3 A
B A H A R İ Y E 1 3 C 6 A
B A H A R İ Y E 2 3 C 6 A
B A H Ç E Ş E H İ R 1 A
B A L K A N P A Z A R I ( 2 5 K A S I M S T A D Y U M Y A N I ) 4 A
B A N K A L A R ( G a z i m i h a l Y ö n ü ) 1 A 1 F 3 3 A 3 A Y M 4 5 A 7
B A N K A L A R ( H a s t a n e Y ö n ü - M e t e o r o l o j i Ö n ü ) 1 A 1 F 2 A 2 B 3 3 A 4 5 A 7
B A N K A L A R 2 ( M a a r i f C a d d e s i O r t a k a p ı ) 2 A 2 B 6 A
B A R I Ş P A R K I 5 5 A 5 B
B A Ş A R - M A R 5 5 A 5 B
B E K T A Ş Y A P I 6 B
B E L K O O P 6 6 A 7 A 7 E
B E L K O O P G İ R İ Ş 6 6 A 7 A 7 E
B İ Z K E N T 5 B 7 7 E
B O S T A N P A Z A R I 3 C 4 A
B U Ç U K T E P E M E Z A R L I K 5 5 A
B U L U T A P A R T M A N I 5
B U L G A R K O N S O L O S L U Ğ U 1 A 1 F 2 A 2 B 3 3 A 4 5 5 B 6
T U Ğ R A M A R K E T 4 3 C 6
C E M E V İ 5 A 5 B
C E V A H İ R Y A Ş A M
C U M A R T E S İ P A Z A R I 2 B 3
Ç A M M O B İ L Y A 5
Ç E L İ K İ N Ş A A T 5
Ç E Ş M E 5 A 5 B
Ç I N A R L İ F E 5
Ç I N A R A L T I 5 A 6 6 A 6 B 7
Ç O C U K S İ T E S İ 5 5 B 7 A
D E F T E R D A R L I K 5 B
D E Ğ İ R M E N M A R K E T 2 A 3 C
D E L T A P A R K 1 F 2 A 2 B 3 3 A 3 C 4 A 5 A 7 A 7 E
D E V L E T H A S T A N E S İ ( Ç a r ş ı Y ö n ü ) 2 A 2 B 3 3 A 3 C 4 A 5 A 5 B 7 7 E
D E V L E T H A S T A N E S İ ( O t o g a r Y ö n ü ) 2 A 2 B 3 3 A 3 C 4 A 5 A 7 E
D İ N Ç E L S İ T E S İ ( Ç a r ş ı Y ö n ü ) 2 A
D İ N Ç E L S İ T E S İ ( H a s t a n e Y ö n ü ) 2 A
D İ Ş H A S T A N E S İ 2 B 3
E D İ R N E L İ L E R 6 B
E C Z A C I L I K F A K Ü L T E S İ 1 F 2 A 2 B 3 3 A 3 C 4 A 5 A 7 A 7 E
E G E Ş A H 5 A 5 B
E Ğ İ T İ M F A K . 2 A 5
E M E L Ö Z G Ü R S U B A Ş I A Y L İ S E S İ 5 B
E M İ R G A N 3 C 6 A
E S K İ E M N İ Y E T M Ü D Ü R L Ü Ğ Ü 2 A 7 A
E R A S T A 1 A 2 B 1 F 3 A 7 A
E R D E M Y A P I 2 B 3
E S E N T E P E 2 A 5 5 A
E T S O 1 A 1 F 3 A 5 7 A
F T İ P İ C E Z A E V İ 6
F A K Ü L T E I Ş I K L A R 1 A
F A T İ H C A M İ İ 1 G 2 B 3 3 A 3 C 4 A 5 A
F E N İ Ş L E R İ 5 B
F E N L İ S E S İ 3 C 6 A
F I R I N L A R S I R T I T O K İ 6 6 A 6 B 7 A 7 E
F I R I N L A R S I R T I T O K İ G İ R İ Ş 6 6 A 6 B 7 A 7 E
G A R 1 G 4 A 6
G A Z D A Ş 3 C 4 6
G A Z İ O S M A N P A Ş A O R T A O K U L U 2 A 5 B 7 7 E
G A Z İ M İ H A L 1 A 1 F 3 3 A 3 A Y M 4 5 A 7
G Ö Ç M E N E V L E R İ 2 A 5 5 A
G Ö K S U E V L E R İ 1 A
G Ö K Y A P I 1 A
G Ö L E T 5 5 A
G Ü L L Ü B A H Ç E 5 B
G Ü Z E L S A N A T L A R L İ S E S İ 1 A 7 A
H A C I İ L B E Y 3 A
H A D I M A Ğ A T O K İ 2 A 2 B 3 3 A 3 C 4 A 5 A 5 B 7 7 E
H A L K E Ğ İ T İ M 5 A 6 6 A 7
İ K İ K Ö P R Ü A R A S I 3 C 6 A
İ K T İ S A T F A K Ü L T E S İ 1 F 2 A 2 B 3 3 A 3 C 4 A 5 A 7 A 7 E
İ L H A M İ E R T E M 2 A 3 C
İ S T A S Y O N M A H A L L E S İ 4
J A N D A R M A 2 A 3 C 5
K A F E T E R Y A L A R 3 C 6 A
K A L E İ Ç İ A 1 0 1 2 A 2 B 6 A 6 B
K A L E İ Ç İ Ç O C U K P A R K I 2 A 2 B 6 A 6 B
K A L E İ Ç İ S İ T E S İ 3
K A P T A N I N Y E R İ 5 B 7
K A R A A Ğ A Ç C A M İ İ 3 C 6 A
K A R A A Ğ A Ç Ç I N A R A L T I 3 C 6 A
K A R A A Ğ A Ç M E R K E Z 3 C 6 A
K E R V A N S A R A Y 4 A
K E N T O R M A N I 3 C 6 A
K I Ş L A 5 6 6 A 6 B 7
K I Y I K C A M İ İ 5 6 6 A 6 B 7
K İ P A 1 A 1 F 3 A 5 7 A
K İ R İ Ş H A N E 4
K Ö P R Ü D U R A Ğ I 1 G 2 B 3 C 4 A
K Ö Y H İ Z M E T L E R İ ( O t o g a r Y ö n ü ) 1 A 1 F 3 A 7 A
K Ö Y H İ Z M E T L E R İ ( Ç a r ş ı Y ö n ü ) 1 A 1 F 3 A 7 A
K Ö Y H İ Z M E T L E R İ A R K A S I 1 G 2 B 3 C 4 A
K U M M A H A L L E 3 A 3 A Y M
K U T L U T A Ş E C Z A N E S İ 5 3 A
K Ü L L İ Y E 1 3 A
K Ü L L İ Y E 2 3 A
K Ü L T Ü R K E N T 5 B
L A D İ N S İ T E S İ 1 A
M A C E R A P A R K I 7 7 E
M A C U R E V L E R İ 3 C 6 A
M A R G İ 1 A 1 F 3 A 7 A
M E G A P A R K 1 G 2 B 3 C 4 A
M E R İ Ç H O U S E 5
M E V L A N A C A M İ İ 5 7 7 E
M O D A V İ Z Y O N 1 A 2 A 2 B 3 3 A 3 C 4 A 5 A 7 E
N E H İ R M A R K E T 4 4 A
N İ M E T - E R 5 B 7 7 E
O L İ M P İ K H A V U Z 5 B 7 7 E
O L İ N 1 A 1 F 3 A 5 7 A
O R D U E V İ ( A T A T Ü R K B u l v a r ı ) 1 A 1 F 2 A 2 B 3 3 A 4 5 B 6
O R D U E V İ 2 ( K ı y ı k C a d d e s i ) 5 A 6 6 A 6 B 7
O R M A N İ Ş L E T M E M Ü D . 3 C 6 A
O T O G A R 2 A 2 B 3 3 A 3 C 4 A 5 A 7 E
Ö N D E R M A R K E T 5 A 5 B
Ö N D E R T A R I M 5
Ö R E N S İ T E S İ 2 A 3 C
Ö Z B İ Z İ M E V L E R 7 7 E
Ö Z G Ü R Ç O C U K L A R P A R K I 7 7 E
P A Z A R T E S İ P A Z A R I 2 A 2 B 6 A
P E R Ş E M B E P A Z A R I 6 6 A 7 A 7 E
P E T R O L D U R A Ğ I 6 6 A 7
P L A T İ N 6 6 A 7 A 7 E
P L E V N E İ L K O K U L U 3
P Ü S K Ü L L Ü 3 A
R Ö L E 5 6 B
S A F R A N
S A Ğ L I K B İ L İ M L E R İ 1 F 2 A 2 B 3 3 A 3 C 5 A 7 A 7 E
S A Ğ L I K M Ü D Ü R L Ü Ğ Ü ( K ı y ı k C a d d e s i ) 5 A 6 6 A 6 B 7
S A K I P A Ğ A S İ T E S İ 7 7 E
S A N A Y İ A L T I 4
S A N A Y İ C A M İ İ 6
S A N A Y İ Ç I K I Ş 1 A 1 F 3 A 5 7 A
S A N A Y İ O R T A K A P I 1 A 1 F 3 A 5 7 A
S A R A Ç H A N E 5 B
S A R A Y O T E L 4 A
S A R A Y İ Ç İ 5 B
S E L İ M İ Y E C A M İ İ 5 A 6 6 A 6 B 7
S E L İ M İ Y E İ M A M H A T İ P L . 5 5 A
S E R A K E N T 1 A
S E R H A T İ M K B 5 B
S G K 1 A 1 F 2 A 2 B 3 3 A 4 5 B 6 7 A
S O M U N C U B A B A 5 B
S O N B A K K A L 5 A 6 6 A 7
S O S Y A L B İ L İ M L E R L İ S E S İ 1 A 1 F 2 A 2 B 3 3 A 4 5 B 6 7 A
S U L T A N Ç E L E B İ M E H M E T K Y K Y U R D U 5 B 6 A 7 A 7 E
Ş A F A K S İ T E S İ 3
Ş A H İ N T E P E S İ 6 6 A 7 A 7 E
Ş Ü K R Ü P A Ş A A N I T I 5 5 A
Ş Ü K R Ü P A Ş A K O N A K L A R I 5 7 7 E
Ş Ü K R Ü P A Ş A M U H T A R L I Ğ I 2 A 3 C
T A B Y A ( Y e ş i l E v l e r R a m p a s ı ) 2 A
T A B Y A ( G Ö L E T ) 5 5 A
T A R I M S A L A R A Ş T I R M A 1 A 1 F 7 A
T E D K O L E J İ 1 A
T I P F A K Ü L T E S İ 1 F 2 A 2 B 3 3 A 3 C 4 A 5 A 7 A 7 E
T O K İ İ M A M H A T İ P L İ S E S İ 6 6 A 6 B 7 A 7 E
T O P H A N E 5 A 6 6 A 6 B 7
T O K İ M İ G R O S 6 B
T O K İ S A Ğ L I K M Ü D Ü R L Ü Ğ Ü 6 6 A 6 B 7 A 7 E
T R A F O 3 A
T R A L İ Ç E 7 7 E
T A R L A K A P I 4 4 A
T E M İ Z L İ K İ Ş L E R İ 4 4 A
T R E D A Ş 1 A 1 F 3 A 5 6 7 A
Ü Ç Ş E R E F E L İ C A M İ İ 5 B
Ü N İ V E R S İ T E 2 B 3 3 C 5 5 B
V A D İ K O N A K L A R I 5 6 B
V A L İ K O N A Ğ I 2 B 3 C 4 A
V İ T R İ N 7
Y A B A N C I L A R Ş U B E 3 A
Y A Y L A T A K S İ 5 A 5 B
Y E N İ İ M A R E T M E R K E Z 3 A 3 A Y M
Y E N İ İ M A R E T M E Z A R L I K 3 A
Y E Ş İ L T E P E 2 A 7 A
Y E Ş İ L E V L E R 2 A
Y E Ş İ L E V L E R 2 ( A y ç i ç e k H e y k e l i Y ö n ü ) 3 C
Y I L D I R I M Ç E Ş M E 3 A 3 A Y M
Y I L D I R I M M E R K E Z 3 A 3 A Y M
Y I L D I Z A P A R T M A N I 7 7 E
Z İ R V E Y A Ş A M S İ T E S İ 7 7 E
Z Ü B E Y D E H A N I M P A R K I ( Ç a r ş ı Y ö n ü ) 2 B
Z Ü B E Y D E H A N I M K A D I N M E R K E Z İ 3`;

const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
const db = {};
const allRoutes = new Set();

lines.forEach(l => {
  // Collapse spaces between single uppercase letters (and Turkish chars)
  // e.g. "A C A R P A R K" -> "ACARPARK", but we also want to preserve spaces between words.
  // Actually a simpler way: find the sequence of route tokens at the end.
  const words = l.split(' ');
  const routeTokens = [];
  const nameTokens = [];
  
  // A route token is something like '1A', '1F', '3AYM', '6', '7A', etc.
  const isRouteToken = (str) => /^[0-9]+[A-Z]*$/.test(str) && str.length <= 4;
  
  let i = words.length - 1;
  while(i >= 0 && isRouteToken(words[i])) {
    routeTokens.unshift(words[i]);
    i--;
  }
  
  // The rest is the stop name. But the stop name has spaces between every letter!
  // E.g. "A C A R P A R K" -> ['A', 'C', 'A', 'R', 'P', 'A', 'R', 'K']
  // If it's a space between words, it might be double space in original text, which split(' ') turns into empty string tokens.
  const rawName = l.substring(0, l.indexOf(routeTokens[0])).trim();
  // To fix "A Y Ş E K A D I N   C A M İ İ", we can replace "   " with a placeholder.
  let cleanName = rawName.replace(/   /g, ' _SPACE_ ');
  cleanName = cleanName.replace(/ /g, '');
  cleanName = cleanName.replace(/_SPACE_/g, ' ');
  
  // Capitalize nicely
  cleanName = cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  
  // Fallback for names that didn't have triple spaces, e.g., if OCR just did "A Y Ş E K A D I N C A M İ İ"
  // It becomes "Ayşekadıncamii". We can't perfectly split them, but we can do a naive dictionary or just use it.
  
  // Let's actually use a smarter approach:
  // "A C I Ç E Ş M E M E Z A R L I K" -> "Acıçeşme Mezarlık" ... we can just store the cleanName.
  
  if(cleanName && routeTokens.length > 0) {
    db[cleanName] = routeTokens;
    routeTokens.forEach(r => allRoutes.add(r));
  }
});

let outputContent = `// Otomatik oluşturulan tüm durak veritabanı\nexport const allStopsDB = ${JSON.stringify(db, null, 2)};\n`;
fs.writeFileSync('src/data/db.js', outputContent);
console.log('Stops compiled successfully! Total stops:', Object.keys(db).length);
console.log('Routes found:', Array.from(allRoutes).join(', '));
