/**
 * SREEVEESATHYA AGENCIES & VELAVAN CRACKERS — 2026 MASTER PRODUCT CATALOG
 * 5/339 Sai Kuzanthai Ammal Nagar, ENJAR Village, Sivakasi-Taluk, Virudhunagar-Dist, Tamilnadu - 626124
 * License No: E/SS/TN/24/161(E-92784) | Phone: 9600499750, 9486050349 | GSTIN: 33GCMPS3008E1ZO
 */

const SREEVEE_CATEGORIES = [
  { name: 'ONE/TWO/THREESOUNDCRACKERS', description: 'Sound crackers - single, double, triple sound' },
  { name: 'BIJILICRACKERS', description: 'Bijili crackers - red, stripped & gold bags' },
  { name: 'CHORSA/GIANTCRACKERS', description: 'Chorsa and Giant crackers' },
  { name: 'DELUXECRACKERS', description: 'Deluxe crackers 24, 50, 100 series' },
  { name: 'GARLANDCRACKERS', description: 'Wala garland crackers (100 to 10000)' },
  { name: 'GROUNDCHAKKARS', description: 'Ground chakkars - big, special, deluxe' },
  { name: 'FLOWERPOTS', description: 'Flowerpots - small, big, special, deluxe, colour kotti' },
  { name: 'BOMBS', description: 'Green atom bombs, hydro, sumo, bullet & agni bombs' },
  { name: 'ROCKETBOMBS', description: 'Baby, 2-sound, 3-sound, whistling rockets' },
  { name: 'SPARKLERS', description: 'Electric, colour, green, red sparklers (7cm - 50cm)' },
  { name: 'FANCYSHOTS', description: 'Colour shots, multi-shots (12 to 240 shots)' },
  { name: '1 1/4 MINIARIALOUTS(CHOTTAFANCY)', description: 'Mini aerial outs (Chotta fancy)' },
  { name: '2\'\'ARIALOUTS', description: '2 inch single aerial outs' },
  { name: '3 1/2\'\'ARIALOUTS (TWO PIECES)', description: '3.5 inch aerial outs - two pieces' },
  { name: '3 1/2\'\'ARIALOUTS (SINGLE PIECE)', description: '3.5 inch aerial outs - single piece' },
  { name: '4\'\'MEGAARIALOUTS', description: '4 inch mega aerial outs - single & double ball' },
  { name: '1 3/4\'\'ARIALOUTS(3PCS)', description: '1.75 inch aerial outs - 3 pieces' },
  { name: 'TWINKLINGSTARS', description: 'Twinkling stars 1.5 inch and 4 inch' },
  { name: 'FANCYNOVELTIES', description: 'Butterflies, peacock, helicopters, siren, fountains' },
  { name: 'GIFTBOXES (NO DISCOUNT)', description: 'Assorted gift boxes (15 to 60 items) - Net rate' },
  { name: 'ECONOMICITEMS (NO DISCOUNT)', description: 'Economic items & bijili bulk packs - Net rate' }
];

const DISCOUNT_SLABS = [
  { min: 1, max: 5000, discountPercent: 5 },
  { min: 5001, max: 10000, discountPercent: 10 },
  { min: 10001, max: 15000, discountPercent: 15 },
  { min: 15001, max: Infinity, discountPercent: 20 }
];

const SREEVEE_PRODUCTS = [
  // ONE/TWO/THREESOUNDCRACKERS (1-10)
  { sno: 1, name: '3½\'\'LAKSHMI', rate: 16.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 50, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 2, name: '4\'\'LAKSHMI/PARROT', rate: 24.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 50, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 3, name: '4\'\'GOLDLAKSHMI/GANESH', rate: 40.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 40, brand: 'Karpagam', noDiscount: false },
  { sno: 4, name: '4\'\'DELUXELAKSHMI/KUMKI', rate: 36.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 40, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 5, name: '2¾\'\'KURUVI', rate: 12.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 100, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 6, name: '2 SOUND CRACKERS', rate: 38.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 40, brand: 'Karpagam', noDiscount: false },
  { sno: 7, name: '3SOUNDCRACAKERSGREEN', rate: 46.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 40, brand: 'Karpagam', noDiscount: false },
  { sno: 8, name: '5\'\'DELUXE CRACKERS', rate: 50.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 9, name: '6\'\'JOHNSENA/WARRIORS', rate: 60.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 25, brand: 'Karpagam', noDiscount: false },
  { sno: 10, name: '5\'\' VIKING CRACKERS', rate: 76.00, category: 'ONE/TWO/THREESOUNDCRACKERS', caseContent: 25, brand: 'Karpagam', noDiscount: false },

  // BIJILICRACKERS (11-12 + PDF 1 Item)
  { sno: 11, name: 'REDBIJILICRACKERS100PCS', rate: 46.00, category: 'BIJILICRACKERS', caseContent: 36, brand: 'Karpagam', noDiscount: false },
  { sno: 12, name: 'STRIPPEDBIJILICRACKERS100PCS', rate: 50.00, category: 'BIJILICRACKERS', caseContent: 36, brand: 'Karpagam', noDiscount: false },
  { sno: 186, name: 'Red bijili 100 pcs gold bags', rate: 150.00, category: 'BIJILICRACKERS', caseContent: 36, brand: 'Karpagam', noDiscount: false },

  // CHORSA/GIANTCRACKERS (13-15)
  { sno: 13, name: '28CHORSACRACKERS', rate: 20.00, category: 'CHORSA/GIANTCRACKERS', caseContent: 50, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 14, name: '28GIANTCRACKERS', rate: 30.00, category: 'CHORSA/GIANTCRACKERS', caseContent: 50, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 15, name: '56GIANTCRACKERS', rate: 60.00, category: 'CHORSA/GIANTCRACKERS', caseContent: 30, brand: 'Karpagam', noDiscount: false },

  // DELUXECRACKERS (16-21)
  { sno: 16, name: '2¾\'\'24DELUXECRACKERS', rate: 54.00, category: 'DELUXECRACKERS', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 17, name: '2¾\'\'50DELUXECRACKERS', rate: 126.00, category: 'DELUXECRACKERS', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 18, name: '2¾\'\'100DELUXECRACKERS', rate: 250.00, category: 'DELUXECRACKERS', caseContent: 15, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 19, name: '4\'\'24DELUXECRACKERS', rate: 96.00, category: 'DELUXECRACKERS', caseContent: 25, brand: 'Karpagam', noDiscount: false },
  { sno: 20, name: '4\'\'50DELUXECRACKERS', rate: 200.00, category: 'DELUXECRACKERS', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 21, name: '4\'\'100DELUXECRACKERS', rate: 400.00, category: 'DELUXECRACKERS', caseContent: 10, brand: 'Karpagam', noDiscount: false },

  // GARLANDCRACKERS (22-29)
  { sno: 22, name: '1OOWALAGARLANDCRACKERS', rate: 40.00, category: 'GARLANDCRACKERS', caseContent: 50, brand: 'Velavan', noDiscount: false },
  { sno: 23, name: '2OOWALAGARLANDCRACKERS', rate: 78.00, category: 'GARLANDCRACKERS', caseContent: 30, brand: 'Velavan', noDiscount: false },
  { sno: 24, name: '3OOWALAGARLANDCRACKERS', rate: 110.00, category: 'GARLANDCRACKERS', caseContent: 25, brand: 'Velavan', noDiscount: false },
  { sno: 25, name: '6OOWALAGARLANDCRACKERS', rate: 180.00, category: 'GARLANDCRACKERS', caseContent: 15, brand: 'Velavan', noDiscount: false },
  { sno: 26, name: '1000WALAGARLANDCRACKERS', rate: 380.00, category: 'GARLANDCRACKERS', caseContent: 10, brand: 'Velavan', noDiscount: false },
  { sno: 27, name: '2000WALAGARLANDCRACKERS', rate: 760.00, category: 'GARLANDCRACKERS', caseContent: 6, brand: 'Velavan', noDiscount: false },
  { sno: 28, name: '5000WALAGARLANDCRACKERS', rate: 1800.00, category: 'GARLANDCRACKERS', caseContent: 4, brand: 'Velavan', noDiscount: false },
  { sno: 29, name: '10000WALAGARLANDCRACKERS', rate: 3500.00, category: 'GARLANDCRACKERS', caseContent: 2, brand: 'Velavan', noDiscount: false },

  // GROUNDCHAKKARS (30-32)
  { sno: 30, name: 'GROUNDCHAKKARBIG10PCS', rate: 48.00, category: 'GROUNDCHAKKARS', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 31, name: 'GROUNDCHAKKARSPECIAL', rate: 90.00, category: 'GROUNDCHAKKARS', caseContent: 25, brand: 'Karpagam', noDiscount: false },
  { sno: 32, name: 'GROUNDCHAKKAR DELUXE', rate: 170.00, category: 'GROUNDCHAKKARS', caseContent: 20, brand: 'Karpagam', noDiscount: false },

  // FLOWERPOTS (33-39)
  { sno: 33, name: 'FLOWERPOTS SMALL', rate: 66.00, category: 'FLOWERPOTS', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 34, name: 'FLOWERPOTSBIG', rate: 90.00, category: 'FLOWERPOTS', caseContent: 25, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 35, name: 'FLOWERPOTSSPECIAL', rate: 120.00, category: 'FLOWERPOTS', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 36, name: 'FLOWERPOTSASHOKA', rate: 160.00, category: 'FLOWERPOTS', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 37, name: 'FLOWERPOTSCOLOURKOTTI', rate: 210.00, category: 'FLOWERPOTS', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 38, name: 'FLOWERPOTSDELUXE', rate: 240.00, category: 'FLOWERPOTS', caseContent: 10, brand: 'Karpagam', noDiscount: false },
  { sno: 39, name: 'FLOWERPOTSSUPERDELUXE', rate: 200.00, category: 'FLOWERPOTS', caseContent: 10, brand: 'Karpagam', noDiscount: false },

  // BOMBS (40-47)
  { sno: 40, name: 'ATTOMBOMBGREEN', rate: 56.00, category: 'BOMBS', caseContent: 30, brand: 'Velavan', noDiscount: false },
  { sno: 41, name: 'HYDROBOMB GREEN', rate: 86.00, category: 'BOMBS', caseContent: 25, brand: 'Velavan', noDiscount: false },
  { sno: 42, name: 'KINGOFKINGBOMB GREEN', rate: 110.00, category: 'BOMBS', caseContent: 20, brand: 'Velavan', noDiscount: false },
  { sno: 43, name: 'SUMO BOMB GREEN', rate: 160.00, category: 'BOMBS', caseContent: 15, brand: 'Velavan', noDiscount: false },
  { sno: 44, name: 'CLASSIC BOMB', rate: 120.00, category: 'BOMBS', caseContent: 20, brand: 'Velavan', noDiscount: false },
  { sno: 45, name: 'BULLET BOMB MINI', rate: 30.00, category: 'BOMBS', caseContent: 40, brand: 'Velavan', noDiscount: false },
  { sno: 46, name: 'BULLET BOMB MEGA', rate: 60.00, category: 'BOMBS', caseContent: 30, brand: 'Velavan', noDiscount: false },
  { sno: 47, name: 'AGNI BOMB MEGA', rate: 270.00, category: 'BOMBS', caseContent: 10, brand: 'Velavan', noDiscount: false },

  // ROCKETBOMBS (48-53)
  { sno: 48, name: 'BABYROCKET', rate: 42.00, category: 'ROCKETBOMBS', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 49, name: 'ROCKETBOMB', rate: 78.00, category: 'ROCKETBOMBS', caseContent: 25, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 50, name: 'LUNIKROCKET', rate: 140.00, category: 'ROCKETBOMBS', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 51, name: 'TWOSOUNDROCKET', rate: 150.00, category: 'ROCKETBOMBS', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 52, name: 'THREESOUNDROCKET', rate: 160.00, category: 'ROCKETBOMBS', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 53, name: 'WHISTLINGROCKET', rate: 200.00, category: 'ROCKETBOMBS', caseContent: 15, brand: 'Karpagam', noDiscount: false },

  // SPARKLERS (54-76)
  { sno: 54, name: '7CMELECTRICSPARKLERS', rate: 13.00, category: 'SPARKLERS', caseContent: 50, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 55, name: '7CMCOLOURSPARKLERS', rate: 14.00, category: 'SPARKLERS', caseContent: 50, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 56, name: '7CMGREENSPARKLERS', rate: 15.00, category: 'SPARKLERS', caseContent: 50, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 57, name: '7CMREDSPARKLERS', rate: 16.00, category: 'SPARKLERS', caseContent: 50, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 58, name: '10CMELECTRICSPARKLERS', rate: 22.00, category: 'SPARKLERS', caseContent: 40, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 59, name: '10CMCOLOURSPARKLERS', rate: 24.00, category: 'SPARKLERS', caseContent: 40, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 60, name: '10CMGREENSPARKLERS', rate: 26.00, category: 'SPARKLERS', caseContent: 40, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 61, name: '10CMREDSPARKLERS', rate: 28.00, category: 'SPARKLERS', caseContent: 40, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 62, name: '12CMELECTRICSPARKLERS', rate: 32.00, category: 'SPARKLERS', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 63, name: '12CMCOLOURSPARKLERS', rate: 34.00, category: 'SPARKLERS', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 64, name: '12CMGREENSPARKLERS', rate: 36.00, category: 'SPARKLERS', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 65, name: '12CMREDSPARKLERS', rate: 38.00, category: 'SPARKLERS', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 66, name: '15CMELECTRICSPARKLERS', rate: 46.00, category: 'SPARKLERS', caseContent: 25, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 67, name: '15CMCOLOURSPARKLERS', rate: 50.00, category: 'SPARKLERS', caseContent: 25, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 68, name: '15CMGREENSPARKLERS', rate: 54.00, category: 'SPARKLERS', caseContent: 25, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 69, name: '15CMREDSPARKLERS', rate: 58.00, category: 'SPARKLERS', caseContent: 25, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 70, name: '30CMELECTRICSPARKLERS(5PCS)', rate: 46.00, category: 'SPARKLERS', caseContent: 30, brand: 'Karpagam', noDiscount: false },
  { sno: 71, name: '30CMCOLOURSPARKLERS(5PCS)', rate: 50.00, category: 'SPARKLERS', caseContent: 30, brand: 'Karpagam', noDiscount: false },
  { sno: 72, name: '30CMGREENSPARKLERS(5PCS)', rate: 54.00, category: 'SPARKLERS', caseContent: 30, brand: 'Karpagam', noDiscount: false },
  { sno: 73, name: '30CMREDSPARKLERS(5PCS)', rate: 58.00, category: 'SPARKLERS', caseContent: 30, brand: 'Karpagam', noDiscount: false },
  { sno: 74, name: '50CMELECTRICSPARKLERS', rate: 220.00, category: 'SPARKLERS', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 75, name: '50CMCOLOURSPARKLERS', rate: 240.00, category: 'SPARKLERS', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 76, name: '5 IN ONE ROTATING SPARKLERS', rate: 250.00, category: 'SPARKLERS', caseContent: 15, brand: 'Karpagam', noDiscount: false },

  // FANCYSHOTS (77-90)
  { sno: 77, name: '7COLOURSHOTS(5Pcs)', rate: 120.00, category: 'FANCYSHOTS', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 78, name: '12SHOTSSQUARE', rate: 150.00, category: 'FANCYSHOTS', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 79, name: '12SHOTSCOLOURROUND', rate: 180.00, category: 'FANCYSHOTS', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 80, name: '12 SHOTS MEGA MC', rate: 250.00, category: 'FANCYSHOTS', caseContent: 12, brand: 'Karpagam', noDiscount: false },
  { sno: 81, name: '25SHOTSCRACKLING', rate: 210.00, category: 'FANCYSHOTS', caseContent: 10, brand: 'Karpagam', noDiscount: false },
  { sno: 82, name: '25SHOTSSQUARE', rate: 240.00, category: 'FANCYSHOTS', caseContent: 10, brand: 'Karpagam', noDiscount: false },
  { sno: 83, name: '30SHOTSECONOMIC', rate: 500.00, category: 'FANCYSHOTS', caseContent: 8, brand: 'Karpagam', noDiscount: false },
  { sno: 84, name: '60SHOTSECONOMIC', rate: 1000.00, category: 'FANCYSHOTS', caseContent: 6, brand: 'Karpagam', noDiscount: false },
  { sno: 85, name: '120SHOTSECONOMIC', rate: 2000.00, category: 'FANCYSHOTS', caseContent: 4, brand: 'Karpagam', noDiscount: false },
  { sno: 86, name: '240SHOTSECONOMIC', rate: 3600.00, category: 'FANCYSHOTS', caseContent: 2, brand: 'Karpagam', noDiscount: false },
  { sno: 87, name: '30SHOTSMULTICOLOUR', rate: 550.00, category: 'FANCYSHOTS', caseContent: 8, brand: 'Karpagam', noDiscount: false },
  { sno: 88, name: '60SHOTSMULTICOLOUR', rate: 1100.00, category: 'FANCYSHOTS', caseContent: 6, brand: 'Karpagam', noDiscount: false },
  { sno: 89, name: '120SHOTSMULTICOLOUR', rate: 2200.00, category: 'FANCYSHOTS', caseContent: 4, brand: 'Karpagam', noDiscount: false },
  { sno: 90, name: '240SHOTSMULTICOLOUR', rate: 4200.00, category: 'FANCYSHOTS', caseContent: 2, brand: 'Karpagam', noDiscount: false },

  // 1 1/4 MINIARIALOUTS(CHOTTAFANCY) (91-96)
  { sno: 91, name: 'KING OF CRICKET', rate: 44.00, category: '1 1/4 MINIARIALOUTS(CHOTTAFANCY)', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 92, name: 'HISTRY OF INDIA', rate: 44.00, category: '1 1/4 MINIARIALOUTS(CHOTTAFANCY)', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 93, name: 'LEGEND OF CRICKET', rate: 44.00, category: '1 1/4 MINIARIALOUTS(CHOTTAFANCY)', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 94, name: 'GOD OF CRICKET', rate: 44.00, category: '1 1/4 MINIARIALOUTS(CHOTTAFANCY)', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 95, name: 'DREAM CRICKET', rate: 44.00, category: '1 1/4 MINIARIALOUTS(CHOTTAFANCY)', caseContent: 30, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 96, name: 'FANTA SHOTS (5 PCS)', rate: 180.00, category: '1 1/4 MINIARIALOUTS(CHOTTAFANCY)', caseContent: 20, brand: 'Karpagam', noDiscount: false },

  // 2''ARIALOUTS (97-105)
  { sno: 97, name: 'LUX TOUR', rate: 130.00, category: '2\'\'ARIALOUTS', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 98, name: 'VINTAGE', rate: 130.00, category: '2\'\'ARIALOUTS', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 99, name: 'ENFIELD', rate: 130.00, category: '2\'\'ARIALOUTS', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 100, name: 'TATO STUDIO', rate: 130.00, category: '2\'\'ARIALOUTS', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 101, name: 'CLASSIC POLO', rate: 130.00, category: '2\'\'ARIALOUTS', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 102, name: 'DREAM CASTLE(CRACKLING)', rate: 130.00, category: '2\'\'ARIALOUTS', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 103, name: 'FOLK', rate: 130.00, category: '2\'\'ARIALOUTS', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 104, name: 'MAMBO', rate: 130.00, category: '2\'\'ARIALOUTS', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 105, name: 'DISCO', rate: 130.00, category: '2\'\'ARIALOUTS', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },

  // 3 1/2''ARIALOUTS (TWO PIECES) (106-110)
  { sno: 106, name: 'YA YA', rate: 780.00, category: '3 1/2\'\'ARIALOUTS (TWO PIECES)', caseContent: 10, brand: 'Karpagam', noDiscount: false },
  { sno: 107, name: 'LETS DANCE', rate: 780.00, category: '3 1/2\'\'ARIALOUTS (TWO PIECES)', caseContent: 10, brand: 'Karpagam', noDiscount: false },
  { sno: 108, name: 'SHANGAI NIGHT', rate: 780.00, category: '3 1/2\'\'ARIALOUTS (TWO PIECES)', caseContent: 10, brand: 'Karpagam', noDiscount: false },
  { sno: 109, name: 'EUROPE', rate: 780.00, category: '3 1/2\'\'ARIALOUTS (TWO PIECES)', caseContent: 10, brand: 'Karpagam', noDiscount: false },
  { sno: 110, name: 'CARNIVAL KING', rate: 780.00, category: '3 1/2\'\'ARIALOUTS (TWO PIECES)', caseContent: 10, brand: 'Karpagam', noDiscount: false },

  // 3 1/2''ARIALOUTS (SINGLE PIECE) (111-116)
  { sno: 111, name: 'KASHMIR ROSE', rate: 350.00, category: '3 1/2\'\'ARIALOUTS (SINGLE PIECE)', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 112, name: 'PALM TREE', rate: 350.00, category: '3 1/2\'\'ARIALOUTS (SINGLE PIECE)', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 113, name: 'GOLD TREASURE', rate: 350.00, category: '3 1/2\'\'ARIALOUTS (SINGLE PIECE)', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 114, name: 'DIAMOND FOR EVER(CRACKLING)', rate: 350.00, category: '3 1/2\'\'ARIALOUTS (SINGLE PIECE)', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 115, name: 'ECO GREEN', rate: 350.00, category: '3 1/2\'\'ARIALOUTS (SINGLE PIECE)', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 116, name: 'NAYAGRA', rate: 350.00, category: '3 1/2\'\'ARIALOUTS (SINGLE PIECE)', caseContent: 15, brand: 'Karpagam', noDiscount: false },

  // 4''MEGAARIALOUTS (117-126)
  { sno: 117, name: 'DRUMS', rate: 880.00, category: '4\'\'MEGAARIALOUTS', caseContent: 8, brand: 'Karpagam', noDiscount: false },
  { sno: 118, name: 'GITAR', rate: 880.00, category: '4\'\'MEGAARIALOUTS', caseContent: 8, brand: 'Karpagam', noDiscount: false },
  { sno: 119, name: 'PYANO', rate: 880.00, category: '4\'\'MEGAARIALOUTS', caseContent: 8, brand: 'Karpagam', noDiscount: false },
  { sno: 120, name: 'TABLA', rate: 880.00, category: '4\'\'MEGAARIALOUTS', caseContent: 8, brand: 'Karpagam', noDiscount: false },
  { sno: 121, name: 'DIVINE', rate: 450.00, category: '4\'\'MEGAARIALOUTS', caseContent: 12, brand: 'Karpagam', noDiscount: false },
  { sno: 122, name: 'DESIRE', rate: 450.00, category: '4\'\'MEGAARIALOUTS', caseContent: 12, brand: 'Karpagam', noDiscount: false },
  { sno: 123, name: 'MOON STARS (NAYAGRA FALLS)', rate: 450.00, category: '4\'\'MEGAARIALOUTS', caseContent: 12, brand: 'Karpagam', noDiscount: false },
  { sno: 124, name: 'SHINING (CRACKLING)', rate: 450.00, category: '4\'\'MEGAARIALOUTS', caseContent: 12, brand: 'Karpagam', noDiscount: false },
  { sno: 125, name: 'MIRACLE', rate: 450.00, category: '4\'\'MEGAARIALOUTS', caseContent: 12, brand: 'Karpagam', noDiscount: false },
  { sno: 126, name: 'MOTU PATHLU (DOUBLE BALL)', rate: 550.00, category: '4\'\'MEGAARIALOUTS', caseContent: 10, brand: 'Karpagam', noDiscount: false },

  // 1 3/4''ARIALOUTS(3PCS) (127-133)
  { sno: 127, name: 'SAVE JUNGLE', rate: 320.00, category: '1 3/4\'\'ARIALOUTS(3PCS)', caseContent: 15, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 128, name: 'THING DIGITAL', rate: 320.00, category: '1 3/4\'\'ARIALOUTS(3PCS)', caseContent: 15, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 129, name: 'SAVE WATER', rate: 320.00, category: '1 3/4\'\'ARIALOUTS(3PCS)', caseContent: 15, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 130, name: 'GIONEE', rate: 320.00, category: '1 3/4\'\'ARIALOUTS(3PCS)', caseContent: 15, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 131, name: 'CELKON', rate: 320.00, category: '1 3/4\'\'ARIALOUTS(3PCS)', caseContent: 15, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 132, name: 'SAVE EARTH', rate: 320.00, category: '1 3/4\'\'ARIALOUTS(3PCS)', caseContent: 15, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 133, name: 'STUBHUB (CRACKLING)', rate: 320.00, category: '1 3/4\'\'ARIALOUTS(3PCS)', caseContent: 15, brand: 'Sreeveesathya', noDiscount: false },

  // TWINKLINGSTARS (134-135)
  { sno: 134, name: '1½\'\'TWINKLING STARS', rate: 36.00, category: 'TWINKLINGSTARS', caseContent: 40, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 135, name: '4\'\'TWINKLINGSTARS', rate: 90.00, category: 'TWINKLINGSTARS', caseContent: 25, brand: 'Sreeveesathya', noDiscount: false },

  // FANCYNOVELTIES (136-168)
  { sno: 136, name: 'COLOURCHANGINGBUTTERFLIES', rate: 86.00, category: 'FANCYNOVELTIES', caseContent: 25, brand: 'Karpagam', noDiscount: false },
  { sno: 137, name: 'GANGA JAMUNA', rate: 76.00, category: 'FANCYNOVELTIES', caseContent: 25, brand: 'Karpagam', noDiscount: false },
  { sno: 138, name: 'WHISTLINGWHEELS(5PCS)', rate: 120.00, category: 'FANCYNOVELTIES', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 139, name: 'SERPENTEGGSBIG(10SMALLBOXES)', rate: 32.00, category: 'FANCYNOVELTIES', caseContent: 40, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 140, name: 'ROLLCAPS', rate: 100.00, category: 'FANCYNOVELTIES', caseContent: 25, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 141, name: 'LAMBAMATCHES10INONE', rate: 200.00, category: 'FANCYNOVELTIES', caseContent: 20, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 142, name: 'PEACOCK FEATHERS', rate: 120.00, category: 'FANCYNOVELTIES', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 143, name: 'MEGAMATCHES10IN ONE', rate: 280.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 144, name: 'DISCOSHOWERS(5 PCSBOX)', rate: 120.00, category: 'FANCYNOVELTIES', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 145, name: 'MULTI COLUR TIN SHOWERS', rate: 130.00, category: 'FANCYNOVELTIES', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 146, name: '8INCHFOUNTAIN', rate: 300.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 147, name: 'PEACOCK', rate: 180.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 148, name: 'MONEYINTHEBANK', rate: 30.00, category: 'FANCYNOVELTIES', caseContent: 40, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 149, name: 'SELFIESTICK', rate: 170.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 150, name: 'BAMBARAM', rate: 120.00, category: 'FANCYNOVELTIES', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 151, name: 'PHOTOFLASH', rate: 74.00, category: 'FANCYNOVELTIES', caseContent: 25, brand: 'Karpagam', noDiscount: false },
  { sno: 152, name: 'HELICOPTER', rate: 100.00, category: 'FANCYNOVELTIES', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 153, name: 'PANCHWHEELS', rate: 180.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 154, name: 'DRONECAMERA+9', rate: 170.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 155, name: 'WINWHEELMINI', rate: 190.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 156, name: 'WINWHEELMAX', rate: 220.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 157, name: 'WINWHEELSUPER', rate: 280.00, category: 'FANCYNOVELTIES', caseContent: 10, brand: 'Karpagam', noDiscount: false },
  { sno: 158, name: 'SIREN3PCS', rate: 200.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 159, name: 'TRICOLOURFOUNTAIN', rate: 330.00, category: 'FANCYNOVELTIES', caseContent: 10, brand: 'Karpagam', noDiscount: false },
  { sno: 160, name: '2KSPECIALSTARGALAXY2PCS', rate: 260.00, category: 'FANCYNOVELTIES', caseContent: 12, brand: 'Karpagam', noDiscount: false },
  { sno: 161, name: 'EMU CHICKEN', rate: 260.00, category: 'FANCYNOVELTIES', caseContent: 12, brand: 'Karpagam', noDiscount: false },
  { sno: 162, name: 'BADA PEACOCK', rate: 480.00, category: 'FANCYNOVELTIES', caseContent: 8, brand: 'Karpagam', noDiscount: false },
  { sno: 163, name: 'WATERPARTYEXPRESS', rate: 140.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 164, name: 'MAGIC CRACKLING 1000', rate: 150.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },
  { sno: 165, name: 'ELECTRIC STONES', rate: 36.00, category: 'FANCYNOVELTIES', caseContent: 40, brand: 'Sreeveesathya', noDiscount: false },
  { sno: 166, name: 'DISCOWHEEL', rate: 100.00, category: 'FANCYNOVELTIES', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 167, name: 'MINI FOG (STD)', rate: 120.00, category: 'FANCYNOVELTIES', caseContent: 20, brand: 'Karpagam', noDiscount: false },
  { sno: 168, name: 'RAINBOW FOG', rate: 180.00, category: 'FANCYNOVELTIES', caseContent: 15, brand: 'Karpagam', noDiscount: false },

  // GIFTBOXES (NO DISCOUNT) (169-176)
  { sno: 169, name: '15ITEMSGIFTBOXES', rate: 160.00, category: 'GIFTBOXES (NO DISCOUNT)', caseContent: 20, brand: 'Sreeveesathya', noDiscount: true },
  { sno: 170, name: '20ITEMSGIFTBOXES', rate: 220.00, category: 'GIFTBOXES (NO DISCOUNT)', caseContent: 15, brand: 'Sreeveesathya', noDiscount: true },
  { sno: 171, name: '25ITEMSGIFTBOXES', rate: 280.00, category: 'GIFTBOXES (NO DISCOUNT)', caseContent: 12, brand: 'Sreeveesathya', noDiscount: true },
  { sno: 172, name: '30ITEMSGIFTBOXES', rate: 330.00, category: 'GIFTBOXES (NO DISCOUNT)', caseContent: 10, brand: 'Sreeveesathya', noDiscount: true },
  { sno: 173, name: '35ITEMSGIFTBOXES', rate: 420.00, category: 'GIFTBOXES (NO DISCOUNT)', caseContent: 8, brand: 'Sreeveesathya', noDiscount: true },
  { sno: 174, name: '40ITEMSGIFTBOXES', rate: 500.00, category: 'GIFTBOXES (NO DISCOUNT)', caseContent: 6, brand: 'Sreeveesathya', noDiscount: true },
  { sno: 175, name: '50ITEMSGIFTBOXES', rate: 850.00, category: 'GIFTBOXES (NO DISCOUNT)', caseContent: 4, brand: 'Sreeveesathya', noDiscount: true },
  { sno: 176, name: '60ITEMSGIFTBOXES', rate: 1250.00, category: 'GIFTBOXES (NO DISCOUNT)', caseContent: 3, brand: 'Sreeveesathya', noDiscount: true },

  // ECONOMICITEMS (NO DISCOUNT) (177-185)
  { sno: 177, name: '2\'\'ARIALOUTS', rate: 90.00, category: 'ECONOMICITEMS (NO DISCOUNT)', caseContent: 25, brand: 'Sreeveesathya', noDiscount: true },
  { sno: 178, name: '3\'\'ARIALOUTS', rate: 260.00, category: 'ECONOMICITEMS (NO DISCOUNT)', caseContent: 15, brand: 'Sreeveesathya', noDiscount: true },
  { sno: 179, name: 'PAPERBOMB250G', rate: 50.00, category: 'ECONOMICITEMS (NO DISCOUNT)', caseContent: 30, brand: 'Velavan', noDiscount: true },
  { sno: 180, name: 'PAPERBOMB500 G', rate: 90.00, category: 'ECONOMICITEMS (NO DISCOUNT)', caseContent: 20, brand: 'Velavan', noDiscount: true },
  { sno: 181, name: 'PAPER BOMB1000G', rate: 180.00, category: 'ECONOMICITEMS (NO DISCOUNT)', caseContent: 12, brand: 'Velavan', noDiscount: true },
  { sno: 182, name: '1000 BIJILI CRACKERS', rate: 160.00, category: 'ECONOMICITEMS (NO DISCOUNT)', caseContent: 15, brand: 'Karpagam', noDiscount: true },
  { sno: 183, name: '2000 BIJILI CRACKERS', rate: 320.00, category: 'ECONOMICITEMS (NO DISCOUNT)', caseContent: 10, brand: 'Karpagam', noDiscount: true },
  { sno: 184, name: '5000 BIJILI CRACKERS', rate: 800.00, category: 'ECONOMICITEMS (NO DISCOUNT)', caseContent: 5, brand: 'Karpagam', noDiscount: true },
  { sno: 185, name: '10000 BIJILI CRACKERS', rate: 1500.00, category: 'ECONOMICITEMS (NO DISCOUNT)', caseContent: 2, brand: 'Karpagam', noDiscount: true }
];

module.exports = {
  SREEVEE_CATEGORIES,
  DISCOUNT_SLABS,
  SREEVEE_PRODUCTS
};
