#!/usr/bin/env node
/**
 * Structured catalog seed generator (see /docs/catalog-report.md).
 *
 * Generates a single SQL migration that seeds 300+ realistic products across
 * the store's real, existing leaf category taxonomy (see migration
 * 0029_xrare_category_taxonomy.sql) — no categories are invented here.
 *
 * Run: node scripts/generate-catalog.mjs > supabase/migrations/0048_product_catalog_expansion.sql
 *
 * Deterministic: a fixed-seed PRNG means re-running this script produces the
 * same catalog (same names, prices, variant counts, stock levels) — useful
 * for reviewing a diff if the generator itself changes later. Product/variant
 * IDs are still real random UUIDs (crypto.randomUUID()), since nothing reads
 * this catalog by a hardcoded id the way the original fixed-id seed data
 * does for categories/collections/brands.
 */

import crypto from 'node:crypto';

// ============================================================
// Seeded PRNG (mulberry32) — deterministic across runs.
// ============================================================
let seedState = 20260814;
function rand() {
  seedState |= 0;
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function uuid() {
  return crypto.randomUUID();
}
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
function esc(s) {
  if (s === null || s === undefined) return 'null';
  return `'${String(s).replace(/'/g, "''")}'`;
}
function tagsLiteral(tags) {
  return `ARRAY[${tags.map((t) => `'${t}'`).join(',')}]::text[]`;
}

const BRAND_ID = '9bdd660c-aa2a-41fc-90b0-41aeabaabeb7'; // X-Rare — see migration 0046_brands.sql
const COLLECTIONS = {
  newIn: '20000000-0000-0000-0000-000000000001',
  bestSellers: '20000000-0000-0000-0000-000000000002',
  summerSale: '20000000-0000-0000-0000-000000000003',
  featured: '20000000-0000-0000-0000-000000000004',
};

// ============================================================
// Color palettes and SKU-safe color codes.
// ============================================================
const COLOR_CODES = {
  Black: 'BLK', White: 'WHT', Cream: 'CRM', Brown: 'BRN', Navy: 'NVY',
  Grey: 'GRY', Olive: 'OLV', Burgundy: 'BUR', Beige: 'BEI', Blue: 'BLU', Red: 'RED',
  'Light Wash': 'LWA', 'Mid Wash': 'MWA', 'Dark Wash': 'DWA', 'Black Wash': 'BWA', 'Raw Indigo': 'RIN',
  'Gold-Tone': 'GLD', 'Silver-Tone': 'SLV', Tan: 'TAN', Camel: 'CML',
};
const CORE_COLORS = ['Black', 'White', 'Cream', 'Brown', 'Navy', 'Grey', 'Olive', 'Burgundy', 'Beige', 'Blue', 'Red'];
const DENIM_COLORS = ['Light Wash', 'Mid Wash', 'Dark Wash', 'Black Wash', 'Raw Indigo'];
const METAL_COLORS = ['Gold-Tone', 'Silver-Tone', 'Black'];

function pickColors(palette, count) {
  const copy = [...palette];
  const out = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  }
  return out;
}

const LETTER_MEN = ['S', 'M', 'L', 'XL', 'XXL'];
const LETTER_WOMEN = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const WAIST = ['28', '30', '32', '34', '36', '38', '40'];
const BELT_WAIST = ['30', '32', '34', '36', '38'];
const SOCK_SIZES = ['S/M', 'L/XL'];

function sizeRange(full, minLen) {
  const len = Math.min(full.length, randInt(minLen, minLen + 2));
  const start = randInt(0, full.length - len);
  return full.slice(start, start + len);
}

// ============================================================
// Category metadata: real leaf categories only (migration 0029).
// ============================================================
const CATEGORIES = [
  {
    key: 'mens-tshirts', categoryId: '10000000-0000-0000-0000-000000000011', skuCode: 'MTE', gender: 'men', department: 'clothing', sizeKind: 'letterMen', colorPalette: CORE_COLORS,
    materials: ['Cotton', 'Cotton Blend', 'Slub Cotton', 'Pima Cotton', 'Organic Cotton'],
    priceRange: [3500, 6500], nounForCopy: 'tee',
    names: ['Signature Crew Neck Tee', 'Heavyweight Cotton Tee', 'Relaxed Fit Pocket Tee', 'Ribbed Crew Tee', 'Washed Vintage Tee', 'Minimal Logo Tee', 'Boxy Drop-Shoulder Tee', 'Textured Waffle Knit Tee', 'Garment-Dyed Tee', 'Long Sleeve Essential Tee', 'Acid Wash Graphic Tee', 'Contrast Stitch Tee', 'Striped Crew Tee', 'Slub Cotton Tee', 'Curved Hem Tee', 'Raw Edge Tee', 'Double Layer Tee', 'Mesh Panel Tee', 'Embroidered Chest Tee', 'Muscle Fit Tee'],
    images: [['1622519407650-3df9883f76a5','Man in black crew neck t-shirt and blue denim jeans beside white wall'],['1618453292459-53424b66bb6a','Man in black crew neck t-shirt standing near brick wall'],['1627225925683-1da7021732ea','Man in black crew neck t-shirt'],['1589902860314-e910697dea18','Man in blue and white crew neck t-shirt and fitted cap on sidewalk'],['1521498542256-5aeb47ba2b36','Man in red crew-neck shirt under sunny sky'],['1678872844677-d650b788709b','Man wearing t-shirt with colorful design'],['1571455786673-9d9d6c194f90','Man wearing black crew-neck t-shirt'],['1503341733017-1901578f9f1e','Person wearing white and black shirt near wall'],['1661181475147-bbd20ef65781','Man in streetwear t-shirt wearing sunglasses'],['1527719327859-c6ce80353573','Man in t-shirt standing in front of door'],['1593726891090-b4c6bc09c819','Man in black and red graphic t-shirt wearing sunglasses'],['1503341338985-c0477be52513','Man in t-shirt standing while looking down at daytime'],['1635650804263-1a1941e14df5','Young man in t-shirt with hat on head']],
  },
  {
    key: 'mens-denim', categoryId: '10000000-0000-0000-0000-000000000012', skuCode: 'MDN', gender: 'men', department: 'clothing', sizeKind: 'waist', colorPalette: DENIM_COLORS,
    materials: ['Denim', 'Stretch Denim', 'Rigid Denim', 'Selvedge Denim'],
    priceRange: [9500, 16500], nounForCopy: 'denim',
    names: ['Slim Taper Denim', 'Relaxed Straight Denim', 'Baggy Wide Leg Denim', 'Distressed Denim', 'Raw Selvedge Denim', 'Stone Wash Denim', 'Black Coated Denim', 'Carpenter Denim', 'Skinny Stretch Denim', 'Vintage Wash Denim', 'Cargo Pocket Denim', 'Cropped Ankle Denim', 'Patchwork Denim', 'Bootcut Denim', 'Acid Wash Denim'],
    images: [['1542272604-787c3835535d','Three assorted-color denim bottoms displayed together'],['1605518216938-7c31b7b14ad0','Blue denim jeans positioned on a black surface'],['1714143136367-7bb68f3f0669','Back view of a pair of blue jeans'],['1715758890151-2c15d5d482aa','Jeans hanging on a clothes rack'],['1721637222188-fa7bf56ceaf5','Jeans stacked on top of each other'],['1714143164072-7646ef5cb24d','Dark blue jeans on a white background'],['1718252540617-6ecda2b56b57','Black jeans on a white background'],['1714143136385-c449be6760f6','Jeans resting on a white surface'],['1714143136361-386dae5672e2','Blue jeans sitting on top of a box'],['1721637245920-4073818252b2','A pile of jeans layered together'],['1721637296276-3816701ae7cf','Jeans stacked on each other'],['1721637284014-69d105a55fca','Jeans laid on top of another'],['1611007724518-5baaa6e24ce5','Blue denim textile with white button detail'],['1721637217881-f0ad35dd4829','Three pairs of jeans positioned side by side']],
  },
  {
    key: 'mens-jackets', categoryId: '10000000-0000-0000-0000-000000000013', skuCode: 'MJK', gender: 'men', department: 'clothing', sizeKind: 'letterMen', colorPalette: CORE_COLORS,
    materials: ['Nylon', 'Cotton Twill', 'Leather', 'Corduroy', 'Quilted Nylon', 'Wool Blend'],
    priceRange: [14000, 32000], nounForCopy: 'jacket',
    names: ['Bomber Jacket', 'Denim Trucker Jacket', 'Quilted Puffer Jacket', 'Varsity Jacket', 'Harrington Jacket', 'Field Jacket', 'Leather Biker Jacket', 'Windbreaker Shell Jacket', 'Corduroy Overshirt Jacket', 'Fleece-Lined Jacket', 'Utility Work Jacket', 'Nylon Track Jacket', 'Shearling Collar Jacket', 'Padded Vest Jacket', 'Reversible Jacket'],
    images: [['1617114919297-3c8ddb01f599','Man in brown jacket and blue denim jeans sitting on concrete bench'],['1507680434567-5739c80be1ac','Man in dress shirt fashion portrait'],['1516257984-b1b4d707412e','Man modeling denim jacket'],['1614252368727-99517bc90d7b','Man in brown leather jacket wearing black sunglasses'],['1614252369475-531eba835eb1','Brown leather jacket styling with sunglasses'],['1630173250799-2813d34ed14b','Man in gray suit jacket and black pants by white wall'],['1620228922597-cca58f177310','Man in brown zip-up jacket with blue denim jeans'],['1578198576866-7e0ba6078128','Person in brown leather zip-up jacket'],['1630667208073-82d53b1db540','Man in gray suit jacket wearing black sunglasses'],['1517938889432-a2ac9241a486','Man wearing brown blazer and eyeglasses'],['1643858040625-3e806a9e5be3','Man in denim jacket adjusting his watch'],['1505022610485-0249ba5b3675','Man in brown suit jacket carrying backpack'],['1675877879221-871aa9f7c314','Bearded man wearing black leather jacket'],['1620834767726-61b1986287ff','Man in beige button-up jacket on sidewalk']],
  },
  {
    key: 'mens-hoodies', categoryId: '10000000-0000-0000-0000-000000000014', skuCode: 'MHD', gender: 'men', department: 'clothing', sizeKind: 'letterMen', colorPalette: CORE_COLORS,
    materials: ['Cotton Fleece', 'Brushed Fleece', 'Cotton Blend', 'French Terry'],
    priceRange: [7500, 14000], nounForCopy: 'hoodie',
    names: ['Heavyweight Pullover Hoodie', 'Zip-Up Fleece Hoodie', 'Oversized Hoodie', 'Washed Vintage Hoodie', 'Sherpa-Lined Hoodie', 'Cropped Hoodie', 'Tie-Dye Hoodie', 'Colorblock Hoodie', 'Half-Zip Hoodie', 'Graphic Print Hoodie', 'Waffle Knit Hoodie', 'Sleeveless Hoodie', 'Two-Tone Hoodie', 'Boxy Fit Hoodie', 'Brushed Fleece Hoodie', 'Reflective Logo Hoodie', 'Layered Panel Hoodie', 'Essential Pullover Hoodie'],
    images: [['1578768079052-aa76e52ff62e','Person in brown hoodie and black pants on staircase'],['1601063476271-a159c71ab0b3','Man in white hoodie sitting on red sofa'],['1615397587950-3cbb55f95b77','Man in white pullover hoodie standing on road'],['1611817757591-c3f345024273','Man in gray hoodie standing in front of white building'],['1614214191247-5b2d3a734f1b','Person in black and white hoodie on brown field'],['1688111421205-a0a85415b224','Bearded man wearing white hoodie'],['1652823780977-b22c0ed84c97','Man in black hoodie crouching down'],['1616030257764-0fe6a2f05138','Person in white hoodie with white cap on beach'],['1542053254535-def95e944232','Person in blue pull-over hoodie'],['1542327534-59a1fe8daf73','Man wearing red pullover hoodie'],['1565978771542-0db9ab9ad3de','Man wearing green hooded jacket'],['1685328403732-64be6bb9d112','Man in hoodie standing on city street'],['1620780327051-f7ad06f5b1e0','Man in blue and white pullover hoodie on sidewalk']],
  },
  {
    key: 'mens-pants', categoryId: '10000000-0000-0000-0000-000000000031', skuCode: 'MPN', gender: 'men', department: 'clothing', sizeKind: 'waist', colorPalette: CORE_COLORS,
    materials: ['Cotton Twill', 'Wool Blend', 'Nylon', 'Corduroy', 'Ripstop Nylon'],
    priceRange: [8000, 15000], nounForCopy: 'trouser',
    names: ['Tailored Wide-Leg Trouser', 'Signature Cargo Pant', 'Relaxed Chino', 'Pleated Trouser', 'Tapered Jogger Pant', 'Nylon Utility Pant', 'Corduroy Trouser', 'Straight Leg Chino', 'Track Pant', 'Parachute Cargo Pant', 'Wool Blend Trouser', 'Cropped Trouser', 'Drawstring Lounge Pant', 'Ripstop Cargo Pant', 'Pinstripe Trouser'],
    images: [['1624835567150-0c530a20d8cc','Man in blue dress shirt and black dress pants standing'],['1622450180332-3da1126f10a4','Man in blue dress shirt and black pants sitting on chair'],['1648301558657-b55db298200a','Man wearing a face mask leaning against a wall'],['1649850874075-49e014357b9d','Man standing on top of a brick wall'],['1761726065663-6e550c25a6ef','Black loafers on a person wearing black pants'],['1584865288642-42078afe6942','Man in white t-shirt and black pants standing'],['1552903905-5e39e774e375','Selective focus photo of man sitting on concrete slab'],['1553247407-23251ce81f59','Men wearing fitted caps and coordinated outfits'],['1552904219-f4b87efe8792','Man standing near post'],['1779282525914-862151c52df2','Man poses in studio with blue backdrop'],['1769467304499-8f2e56c88ec7','Man in patterned shirt resting'],['1667744565777-fa2eb22adeeb','Man standing in a parking lot'],['1548883354-7622d03aca27','Person wearing tailored trousers'],['1761126085595-c9b8a83912cd','Man walking on a bridge with buildings in background'],['1678222532251-2f303290c1e5','Person wearing black trousers standing in a stream']],
  },
  {
    key: 'mens-tracksuits', categoryId: '10000000-0000-0000-0000-000000000032', skuCode: 'MTS', gender: 'men', department: 'clothing', sizeKind: 'letterMen', colorPalette: CORE_COLORS,
    materials: ['Polyester', 'Cotton Fleece', 'Velour', 'Ribbed Knit'],
    priceRange: [11000, 19000], nounForCopy: 'tracksuit',
    names: ['Classic Zip Tracksuit', 'Colorblock Tracksuit', 'Fleece Tracksuit Set', 'Ribbed Panel Tracksuit', 'Retro Stripe Tracksuit', 'Velour Tracksuit', 'Mesh Panel Tracksuit', 'Minimal Logo Tracksuit', 'Two-Tone Tracksuit', 'Cropped Tracksuit Set'],
    images: [['1602670935908-094f41dcb67c','Man in black jacket and red pants on wooden stairs'],['1619005695625-e8027b61c670','Man in black leather jacket with striped pants on road'],['1641319903767-c000749606af','Man standing before building wearing sunglasses'],['1643622744071-6aa7644a0ffd','Man in red jacket with sunglasses'],['1643061779987-78b366128372','Man with backpack running'],['1632053219083-02539aeb98a3','Man standing in empty parking lot'],['1644466315114-fe0ac2ba16f4','Man on boardwalk in front of restaurant'],['1604079458437-8ba716cd1324','Man in black/white zip jacket on sidewalk'],['1715609104589-97585b210c6e','Tracksuits and running shoes on wooden floor'],['1541102396743-74c128e1133e','Man wearing black/red jacket outfit'],['1643622782660-30dedcd8d75a','Man in red jacket leaning against wall'],['1648485628235-8812e303769e','Young man sitting in field'],['1674040759788-a1ad559ba57e','Man sitting on ledge before building'],['1665189047260-e52e37741c19','Man sitting on desk'],['1656664317720-e9d245741879','Group of men posing together in athleisure']],
  },
  {
    key: 'mens-outerwear', categoryId: '10000000-0000-0000-0000-000000000033', skuCode: 'MOW', gender: 'men', department: 'clothing', sizeKind: 'letterMen', colorPalette: CORE_COLORS,
    materials: ['Wool Blend', 'Down Fill', 'Cotton Twill', 'Shearling', 'Technical Nylon'],
    priceRange: [18000, 42000], nounForCopy: 'coat',
    names: ['Wool Overcoat', 'Long Trench Coat', 'Quilted Parka', 'Shearling Coat', 'Down-Filled Parka', 'Double-Breasted Overcoat', 'Car Coat', 'Technical Rain Shell', 'Belted Wrap Coat', 'Peacoat', 'Insulated Field Coat', 'Wool Blend Duffle Coat'],
    images: [['1622445275463-afa2ab738c34','Man in black coat leaning against wall'],['1669575903350-9a349b411810','Person wearing formal suit'],['1619603364937-8d7af41ef206','Man in brown coat standing'],['1619603364904-c0498317e145','Man in brown coat with black pants'],['1635205383450-e0fee6fe73c4','Man in suit and tie on sidewalk'],['1635205383325-aa3e6fb5ba55','Man in suit and sunglasses on sidewalk'],['1737508945707-ebdccee97cc5','Man in trench coat walking down street'],['1553209717-ddc5aa729bd2','Man in black coat by building'],['1715090364409-161e8dd5ab8e','Man leaning against fence in coat'],['1642886513052-d24b4f4745ea','Man standing in brown coat by building'],['1642886513308-d21acc15057d','Man walking street carrying bag in coat'],['1764593008673-af6056758b4a','Man in stylish outerwear on street'],['1764593008232-496797f6b31d','Man in cowboy hat and sunglasses outdoors'],['1640349571203-9d9c97a46f2c','Man standing in street in outerwear']],
  },
  {
    key: 'womens-tops', categoryId: '10000000-0000-0000-0000-000000000021', skuCode: 'WTP', gender: 'women', department: 'clothing', sizeKind: 'letterWomen', colorPalette: CORE_COLORS,
    materials: ['Satin', 'Silk Blend', 'Ribbed Knit', 'Linen', 'Mesh', 'Cotton Blend'],
    priceRange: [3800, 9500], nounForCopy: 'top',
    names: ['Silk Blend Cami Top', 'Fitted Bodysuit Top', 'Off-Shoulder Blouse', 'Wrap Front Top', 'Cropped Knit Top', 'Puff Sleeve Blouse', 'Satin Slip Top', 'Ruched Bodycon Top', 'Halter Neck Top', 'Cowl Neck Top', 'Linen Button-Up Top', 'Mesh Long Sleeve Top', 'Corset Style Top', 'One-Shoulder Top', 'Draped Jersey Top', 'Peplum Top', 'Sheer Layered Top', 'Square Neck Top', 'Twist Front Top', 'Turtleneck Knit Top'],
    images: [['1763294632433-a0c7680720e1','Young woman in blue floral top'],['1761117228880-df2425bd70da','Woman wearing red blouse with necklace'],['1768289222368-62cbdfe7d5f5','Young woman with sunglasses on head, smiling'],['1769063382706-8156b3b33eac','Woman in colorful patterned top'],['1768478701502-c6b378f85167','Woman wearing colorful patterned shirt'],['1775234576198-a1c680241c07','Woman in pink t-shirt and jeans'],['1768478701607-db8c96dbb87f','Woman in colorful patterned tunic and pants'],['1767687717463-1c9a555c76c1','Woman in paisley print top with tropical plants'],['1761121317492-57feee4fc674','Back view of woman in red top'],['1765365353704-ed0b6e1b11c2','Smiling woman in pink floral blouse'],['1762331978730-c7f64cdeda7c','Woman in red blazer and blue jeans'],['1680690599369-8878cf3eeb59','Blonde woman wearing white top'],['1680690395101-1b2a56c0ac21','Woman in white top and white pants']],
  },
  {
    key: 'womens-skirts', categoryId: '10000000-0000-0000-0000-000000000022', skuCode: 'WSK', gender: 'women', department: 'clothing', sizeKind: 'letterWomen', colorPalette: CORE_COLORS,
    materials: ['Satin', 'Denim', 'Cotton Twill', 'Faux Leather', 'Tweed', 'Ribbed Knit'],
    priceRange: [6500, 13500], nounForCopy: 'skirt',
    names: ['Satin Wrap Skirt', 'Denim Mini Skirt', 'A-Line Midi Skirt', 'Leather Look Skirt', 'Ruched Bodycon Skirt', 'Tiered Maxi Skirt', 'Asymmetric Hem Skirt', 'Corduroy Mini Skirt', 'Slip Style Skirt', 'High-Waisted Pencil Skirt', 'Cargo Utility Skirt', 'Knit Midi Skirt', 'Pleated Mini Skirt', 'Wrap Front Maxi Skirt', 'Textured Tweed Skirt'],
    images: [['1549575810-b9b7abc51d9e','Woman standing at middle of road'],['1590852669429-d1cd8775ea59','Woman in white long sleeve shirt and black floral skirt'],['1700748910236-3b744b8dacad','Woman in brown dress and black boots'],['1553096763-6fb9cdc4df14','Blonde woman stands in porch'],['1750032640627-941f5d457f05','Woman walks the beach in stylish outfit'],['1750032413868-04968f201deb','Woman poses in stylish attire'],['1606241853208-e8be190ac116','Woman in pink long sleeve shirt and denim skirt'],['1598886221171-8e62de2c4e35','Woman in white t-shirt and black skirt'],['1661869535393-872dea2d9f8d','Woman sitting on a ledge'],['1634340368854-7d92d2fb57c4','Woman in white skirt posing for picture'],['1750032517235-ff34925b31cf','Woman poses in stylish outfit in kitchen'],['1783095627501-e219e32a09f7','Woman in white ruffled skirt and grey blazer'],['1763454640064-d00574c83178','Two women in formal skirts on rocky shore'],['1592423777039-7be9f340582b','Woman in white coat and black skirt on wooden staircase']],
  },
  {
    key: 'womens-hoodies', categoryId: '10000000-0000-0000-0000-000000000035', skuCode: 'WHD', gender: 'women', department: 'clothing', sizeKind: 'letterWomen', colorPalette: CORE_COLORS,
    materials: ['Cotton Fleece', 'Brushed Fleece', 'French Terry'],
    priceRange: [7500, 14000], nounForCopy: 'hoodie',
    names: ['Cropped Zip Hoodie', 'Oversized Boyfriend Hoodie', 'Fitted Ribbed Hoodie', 'Tie-Front Hoodie', 'Washed Fleece Hoodie', 'Graphic Logo Hoodie', 'Drawstring Waist Hoodie', 'Half-Zip Hoodie', 'Colorblock Hoodie', 'Cinched Waist Hoodie', 'Sherpa-Lined Hoodie', 'Two-Tone Hoodie', 'Cropped Sleeveless Hoodie', 'Layered Hem Hoodie'],
    images: [['1526476148966-98bd039463ea','Portrait of woman wearing white pullover hoodie'],['1516195851888-6f1a981a862e','Woman in pink pullover hoodie standing near wall'],['1578470507807-3fc541d5f544','Woman in hoodie with both hands holding the hood'],['1633292750937-120a94f5c2bb','Woman standing in front of wall with graffiti'],['1617044263761-23580da3f886','Woman in white hijab and black sunglasses'],['1697507803481-5724f26a7b50','Woman sitting on cement wall wearing streetwear'],['1578632140472-6d913e068456','Woman standing near lamp posts in hoodie'],['1576790807856-b9205fb5703f','Woman posing on staircase'],['1622866654199-d36cf0709720','Woman in white hoodie on green grass field'],['1663573688938-2b3e7ea2ab33','Woman posing for fashion photograph'],['1633292587737-f898a032e562','Woman standing before colorful wall background'],['1547069553-12f23c839aaa','Woman wearing green sweater'],['1618924250113-e162305ac8cd','Person in black hoodie with contrasting pants']],
  },
  {
    key: 'womens-tshirts', categoryId: '10000000-0000-0000-0000-000000000034', skuCode: 'WTE', gender: 'women', department: 'clothing', sizeKind: 'letterWomen', colorPalette: CORE_COLORS,
    materials: ['Cotton', 'Slub Cotton', 'Cotton Blend', 'Pima Cotton'],
    priceRange: [3200, 7500], nounForCopy: 'tee',
    names: ['Fitted Baby Tee', 'Oversized Boyfriend Tee', 'Ribbed Crop Tee', 'Cap Sleeve Tee', 'Twist Front Tee', 'Muscle Tank Tee', 'Longline Tee', 'Washed Graphic Tee', 'Scoop Neck Tee', 'Cut-Out Tee', 'Slub Cotton Tee', 'Curved Hem Tee', 'Raw Edge Crop Tee', 'Mesh Layer Tee', 'Striped Crew Tee', 'Bow Detail Tee', 'Contrast Trim Tee', 'Signature Logo Tee'],
    images: [['1759572095384-1a7e646d0d4f','Two t-shirts in black and light green'],['1620799139507-2a76f79a2f4d','White crew neck t-shirt product shot'],['1618677603286-0ec56cb6e1b5','White crew neck t-shirt mockup'],['1564584217132-2271feaeb3c5','Grey t-shirt hanging on white wall'],['1503342217505-b0a15ec3261c','Woman in casual wear near pink concrete wall'],['1551799517-eb8f03cb5e6a','Woman wearing red crew-neck with printed text'],['1620799139652-715e4d5b232d','White crew neck t-shirt on black hanger'],['1610142991820-e02266a4a9f0','Woman in white t-shirt and gray denim'],['1608175602729-8980becd9c1e','Woman in white and red t-shirt with sunglasses'],['1624124959348-86710fef6630','Black and white striped crew neck shirt'],['1593526424177-9c9c7f68d4f2','White and black crew neck t-shirt'],['1503342452485-86b7f54527ef','Women’s black crop-top'],['1623256786459-8ae5e1a31c77','Woman wearing sunglasses in casual t-shirt'],['1610948199252-995d1f449363','Woman in black crew neck with red sunglasses'],['1628730992773-5185cc8efca9','Person in white crew neck t-shirt']],
  },
  {
    key: 'womens-sets', categoryId: '10000000-0000-0000-0000-000000000036', skuCode: 'WST', gender: 'women', department: 'clothing', sizeKind: 'letterWomen', colorPalette: CORE_COLORS,
    materials: ['Ribbed Knit', 'Terry', 'Velour', 'Linen', 'Satin'],
    priceRange: [9500, 19500], nounForCopy: 'set',
    names: ['Matching Knit Co-Ord Set', 'Ribbed Two-Piece Set', 'Satin Cami Set', 'Utility Two-Piece Set', 'Wide-Leg Co-Ord Set', 'Cropped Blazer Set', 'Terry Lounge Set', 'Printed Two-Piece Set', 'Tailored Vest Set', 'Linen Co-Ord Set', 'Velour Lounge Set', 'Corset Skirt Set'],
    images: [['1622113811634-93941531166d','Woman in matching gray shirt and gray pants sitting on floor'],['1767077281212-1b786ddf28c1','Woman in floral print set sits on patterned sofa'],['1767077281256-460358ce390a','Woman in navy blue set with embroidered floral pattern'],['1767077280528-0cbfe4ec9668','Woman in red embroidered set with sunglasses'],['1769063382684-28aa7d4d72a7','Woman wearing a colorful patterned set'],['1769063382633-ef27742cf2a1','Woman in patterned tunic and wide-leg pants set'],['1769063382610-6be8acb7552f','Woman in patterned top and pants set smiling'],['1765365353683-fc501d83ed24','Woman in blue floral set leaning against wall'],['1769063382620-125c3d741502','Woman wearing a patterned tunic and pants set'],['1769063382663-ec2414702d3a','Woman in patterned tunic and wide-leg pants set'],['1769063382670-823451e5a7ef','Woman in patterned tunic and pants set'],['1769063382655-190e8edbe188','Woman in patterned two-piece set smiling'],['1767884044909-20a99d762b69','Woman in floral set holding a purse on stairs'],['1562572159-4efc207f5aff','Woman wearing sunglasses in coordinated set']],
  },
  {
    key: 'womens-jackets', categoryId: '10000000-0000-0000-0000-000000000037', skuCode: 'WJK', gender: 'women', department: 'clothing', sizeKind: 'letterWomen', colorPalette: CORE_COLORS,
    materials: ['Denim', 'Faux Leather', 'Wool Blend', 'Nylon', 'Tweed', 'Shearling'],
    priceRange: [13000, 32000], nounForCopy: 'jacket',
    names: ['Cropped Denim Jacket', 'Faux Leather Biker Jacket', 'Oversized Blazer', 'Quilted Puffer Jacket', 'Tailored Trench Coat', 'Teddy Borg Jacket', 'Belted Wool Coat', 'Bomber Jacket', 'Structured Tweed Jacket', 'Longline Parka', 'Cropped Bomber Jacket', 'Double-Breasted Coat', 'Shearling Collar Jacket'],
    images: [['1513094735237-8f2714d57c13','Woman in casual jacket holding a paper bag while walking'],['1544022613-e87ca75a784a','Woman wearing brown jacket layered with white shirt and denim'],['1615397815341-bb06f6d55c94','Woman in black leather jacket standing and smiling'],['1685538758593-27e86bcaebe9','Woman posed in green coat for portrait photography'],['1685538759029-64900f1306d5','Woman in green coat posing for another portrait'],['1703758787714-6e0d4964d11b','Black and white photograph of person holding a jacket'],['1781174850262-fcf8f73ddd91','Storefront display of mannequins wearing leather jackets'],['1592423788390-2e71e064f724','Woman in beige coat and black skirt wearing sunglasses'],['1605108083603-85696109df99','Grayscale photograph of woman in coat standing on road'],['1713448721104-ecdcd999f341','Person in black jacket posing in front of wall'],['1585215173785-7f3c2252c25a','Woman in yellow coat on snow-covered ground'],['1636576506457-e22157f737e3','Woman in jacket sitting on wooden floor with flowers'],['1636576507919-929955a345c8','Woman wearing striped scarf with jacket']],
  },
  {
    key: 'womens-pants', categoryId: '10000000-0000-0000-0000-000000000038', skuCode: 'WPN', gender: 'women', department: 'clothing', sizeKind: 'letterWomen', colorPalette: CORE_COLORS,
    materials: ['Cotton Twill', 'Satin', 'Ribbed Knit', 'Linen Blend', 'Faux Leather'],
    priceRange: [7500, 15500], nounForCopy: 'trouser',
    names: ['Wide-Leg Tailored Trouser', 'High-Waisted Straight Pant', 'Pleated Wide-Leg Pant', 'Cargo Utility Pant', 'Cropped Straight Pant', 'Satin Palazzo Pant', 'Ribbed Flare Pant', 'Tapered Ankle Pant', 'Linen Blend Trouser', 'Paperbag Waist Pant', 'Track Jogger Pant', 'Faux Leather Pant', 'Wide-Leg Culotte'],
    images: [['1552902865-b72c031ac5ea','Woman standing near open door in casual outfit'],['1554062264-5bc2b06275ca','Woman sitting on concrete rail wearing trousers'],['1767631338127-8cd80ee2f9df','Woman in white shirt and black wide-leg pants'],['1552902831-bb0e060ac5a2','Woman in black gym clothes'],['1604182459406-fefa32508ab0','Woman in gray long sleeve shirt and black pants under tree'],['1604182440345-4a82e1c3876b','Woman in white button-up shirt and black pants near plants'],['1768289222386-93b3e854cf31','Woman in navy blue pants with hand in pocket'],['1700676194066-b9e1038058c3','Woman in black and white shirt and pants'],['1768289222419-255b80c65259','Red floral print wide-leg pants with hand in pocket'],['1552902875-9ac1f9fe0c07','Person wearing tailored black pants'],['1700676195086-81b936390de4','Woman standing in front of brown wall'],['1708170236295-20ab8fbadcef','Woman sitting on ground with legs crossed']],
  },
  {
    key: 'accessories-caps', categoryId: '10000000-0000-0000-0000-000000000039', skuCode: 'ACP', gender: 'unisex', department: 'accessories', sizeKind: 'none', colorPalette: CORE_COLORS,
    materials: ['Cotton Twill', 'Corduroy', 'Washed Cotton', 'Nylon'],
    priceRange: [2200, 4200], nounForCopy: 'cap',
    names: ['Classic Baseball Cap', 'Structured Snapback Cap', 'Low-Profile Dad Cap', 'Embroidered Logo Cap', 'Washed Cotton Cap', 'Corduroy Cap', 'Adjustable Strapback Cap', 'Camo Print Cap', 'Two-Tone Cap', 'Curved Brim Cap', 'Vintage Wash Cap', 'Nylon Sport Cap', 'Leather Strap Cap', 'Denim Cap', 'Minimal Logo Cap'],
    images: [['1531891570158-e71b35a485bc','Man in black shirt and black cap before glass wall'],['1510060637021-6287bd1b5232','Woman on concrete pavement wearing baseball cap'],['1568246621541-5704b4f0bbf2','Man wearing black fitted cap'],['1541598609756-e7dfa98d129f','Woman sitting on escalator with cap'],['1542529727-24cb357c57d2','Man in black cap and white shirt by gray metal wall'],['1699797637867-7dcace32561c','Woman with headphones wearing cap'],['1527413232440-2cf20e325d6a','Woman in black fitted cap'],['1675139382070-3f47ca969920','Man wearing layered baseball cap'],['1564866774036-35255ee24c9f','Man in black jacket and red cap by sea'],['1606483956061-46a898dce538','Black and white baseball cap'],['1777455163870-a846a5ca98af','Two baseball caps on wooden stool'],['1720534490358-bc2ad29d51d5','Baseball cap on wooden chair'],['1777455163868-b113d82fbe74','Black baseball cap on wooden stool'],['1775326521356-39f0ea9a2e5e','Man wearing white and black baseball cap'],['1775322658880-4098cfd56c93','Person in navy blue embroidered cap']],
  },
  {
    key: 'accessories-trucker-caps', categoryId: '10000000-0000-0000-0000-000000000040', skuCode: 'ATC', gender: 'unisex', department: 'accessories', sizeKind: 'none', colorPalette: CORE_COLORS,
    materials: ['Mesh/Foam', 'Cotton Twill'],
    priceRange: [2200, 3800], nounForCopy: 'trucker cap',
    names: ['Classic Mesh Trucker Cap', 'Foam Front Trucker Cap', 'Leather Patch Trucker Cap', 'Washed Trucker Cap', 'Snapback Trucker Cap', 'Two-Tone Mesh Trucker Cap', 'Curved Brim Trucker Cap', 'Camo Mesh Trucker Cap', 'Embroidered Trucker Cap', 'High-Profile Trucker Cap'],
    images: [['1620231109648-302d034cb29b','Blue and white fitted cap close-up'],['1733127547242-42a2e7ac12bb','Red and white hat displayed on wooden table'],['1775848366633-46257a5f55c0','Black trucker cap with patch logo'],['1761846788219-db3b636a0cd8','Black and brown trucker cap with patch branding'],['1767616526017-efd2886d527c','Tan trucker cap with patch detail'],['1753723824025-50ba4bc2ab68','Trucker cap with leather patch detail on table'],['1722620215428-1edded73220b','Woman wearing black jacket and brown trucker cap'],['1722620205962-94ee06af018d','Man posing in trucker-style cap'],['1760944016354-24ea05222a8a','Man in baseball cap positioned near red truck']],
  },
  {
    key: 'accessories-bags', categoryId: '10000000-0000-0000-0000-000000000041', skuCode: 'ABG', gender: 'unisex', department: 'accessories', sizeKind: 'none', colorPalette: CORE_COLORS,
    materials: ['Canvas', 'Leather', 'Faux Leather', 'Nylon', 'Straw'],
    priceRange: [4500, 18500], nounForCopy: 'bag',
    names: ['Structured Leather Tote', 'Mini Crossbody Bag', 'Canvas Weekender Bag', 'Quilted Shoulder Bag', 'Drawstring Backpack', 'Leather Belt Bag', 'Woven Straw Tote', 'Nylon Utility Backpack', 'Top Handle Satchel', 'Slouchy Hobo Bag', 'Structured Backpack', 'Mini Clutch Bag', 'Canvas Messenger Bag', 'Leather Crossbody Bag', 'Oversized Tote Bag'],
    images: [['1630381260512-e3fe55c11973','Person in blue denim holding white tote bag'],['1630381259916-72321f3bafe0','Woman in gray jacket seated with tote bag'],['1721111260419-03565e518110','Woman walking street with shoulder bag'],['1572196284554-4e321b0e7e0b','Black tote bag product shot'],['1623222403596-d0255da44c0b','Woman carrying bag on street'],['1624911104820-5316c700b907','Woman in white dress with tote bag'],['1572966059657-6e8910c8c3c0','White tote bag close-up'],['1623904492371-ffa09c010f92','Woman in leopard print with white tote'],['1683438465247-1b1a545ec02d','Multiple bags displayed on wall'],['1618864746159-ec96c3a32ce7','Black and white canvas tote bag'],['1611443522715-3220344f1a37','Woman carrying text-printed tote bag'],['1732963878674-651e7f5f71d7','Bag displayed on chair with plant'],['1633161995202-b17cb95943f5','Person holding white bag with text'],['1578682443756-573e32709f94','White and brown bag on sunflowers'],['1721111260412-5541dc8fbec5','Woman walking with shoulder bag']],
  },
  {
    key: 'accessories-beanies', categoryId: '10000000-0000-0000-0000-000000000042', skuCode: 'ABN', gender: 'unisex', department: 'accessories', sizeKind: 'none', colorPalette: CORE_COLORS,
    materials: ['Wool Blend', 'Cable Knit', 'Merino Wool', 'Acrylic Knit'],
    priceRange: [2000, 3800], nounForCopy: 'beanie',
    names: ['Ribbed Knit Beanie', 'Cuffed Wool Beanie', 'Fleece-Lined Beanie', 'Slouchy Knit Beanie', 'Cable Knit Beanie', 'Embroidered Logo Beanie', 'Chunky Knit Beanie', 'Merino Wool Beanie', 'Two-Tone Beanie', 'Waffle Knit Beanie', 'Pom-Pom Beanie', 'Recycled Yarn Beanie', 'Skull Cap Beanie', 'Reversible Beanie'],
    images: [['1576193929684-06c6c6a8b582','Woman in black outfit near vehicle wearing beanie'],['1630691650107-53dd500d2907','White knit cap on yellow textile background'],['1514642837906-76ed4698ec34','Man standing near green plant wearing beanie'],['1584216338898-f34d78201414','Woman in gray coat and beanie'],['1648483085782-4bc8f957e37c','Man in black jacket wearing blue beanie'],['1648483092137-6e63796c8b06','Blue beanie on lichen-covered rock'],['1648483066215-e00f37a9e26f','Blue beanie resting on pile of rocks'],['1611587475726-51e2958c96fc','Woman in gray knit cap and gray coat'],['1521119989659-a83eee488004','Man standing near balcony wearing beanie'],['1648483072474-6233d1b6c437','Bearded man wearing sunglasses and beanie'],['1723856030105-d30e65607008','Woman in woods wearing red beanie'],['1768729797745-0de2a5caa7bb','Person in yellow beanie and jacket'],['1639346633498-89a98fa00179','Woman in yellow beanie standing in snow']],
  },
  {
    key: 'accessories-socks', categoryId: '10000000-0000-0000-0000-000000000043', skuCode: 'ASK', gender: 'unisex', department: 'accessories', sizeKind: 'sock', colorPalette: CORE_COLORS,
    materials: ['Cotton Blend', 'Wool Blend', 'Ribbed Cotton'],
    priceRange: [1200, 2800], nounForCopy: 'socks',
    names: ['Ribbed Crew Socks (3-Pack)', 'Cushioned Sport Socks (3-Pack)', 'Ankle Socks (5-Pack)', 'Wool Blend Boot Socks', 'Striped Crew Socks', 'No-Show Socks (3-Pack)', 'Terry Sole Socks', 'Compression Crew Socks', 'Logo Crew Socks', 'Patterned Socks (3-Pack)', 'Merino Wool Hiking Socks', 'Tube Socks'],
    images: [['1585499583264-491df5142e83','Blue, white and yellow socks display'],['1615486364462-ef6363adbc18','Blue and black socks on white background'],['1586350977771-b3b0abd50c82','Person wearing white and red socks'],['1566563634870-d566ab58a4df','Assorted-color socks close-up photography'],['1635342587676-13a5570e9101','Person standing in sand with feet up wearing socks'],['1639753249870-ca3b0c380fd3','Person wearing black and white striped socks'],['1580973757787-e22cdecb9cd5','Pair of colorful socks on bed'],['1631024724206-6ccc65ab31bd','White and blue striped socks'],['1635293882159-a68f138748ee','Person with pink socks and white shoes'],['1698821610670-731514d37c0b','Socks displayed on rack'],['1641483305819-587106f06f83','Person sitting on bench with crossed legs wearing socks']],
  },
  {
    key: 'accessories-lifestyle', categoryId: '10000000-0000-0000-0000-000000000044', skuCode: 'ALS', gender: 'unisex', department: 'accessories', sizeKind: 'mixed', colorPalette: CORE_COLORS,
    materials: ['Leather', 'Faux Leather', 'Canvas', 'Acetate', 'Metal', 'Stainless Steel', 'Wool Blend', 'Silk Blend', 'Cotton'],
    priceRange: [1800, 24000], nounForCopy: 'accessory',
    names: ['Leather Belt', 'Reversible Leather Belt', 'Woven Canvas Belt', 'Classic Aviator Sunglasses', 'Square Frame Sunglasses', 'Oversized Round Sunglasses', 'Sport Wrap Sunglasses', 'Minimal Wire Sunglasses', 'Chronograph Watch', 'Minimalist Leather Strap Watch', 'Stainless Steel Watch', 'Digital Sport Watch', 'Layered Chain Necklace', 'Signet Ring', 'Beaded Bracelet', 'Stud Earrings Set', 'Pendant Necklace', 'Cuban Link Bracelet', 'Silk Neck Scarf', 'Wool Blend Scarf', 'Cotton Bandana', 'Knit Infinity Scarf', 'Leather Card Holder', 'Woven Phone Strap', 'Fabric Tote Keychain'],
    images: [['1718967807877-f2e04ffc7343','Sunglasses beside a tennis ball on table'],['1629139033414-76f3c0eacf84','Black framed eyeglasses with leather wallet'],['1584184804426-5e2aa23c2937','Black and silver chronograph timepiece'],['1608376165988-c7e0a856cce9','Black sunglasses near brown leather case'],['1774653248377-a42ed0245530','Sunglasses, watch, and perfume arranged'],['1774653273863-a689ee748eee','Luxury accessory flat lay with timepiece'],['1774653252770-677bd5930d05','Round sunglasses and watch on dark surface'],['1724318496827-2813ff4772b8','Sunglasses atop wooden box display'],['1724318496828-3438b8c7f32c','Pair of sunglasses on wooden surface'],['1613495316603-56bb7633017e','Black framed sunglasses on brown book'],['1774653265512-424ed4cc6882','Rose gold watch with sunglasses'],['1782171059919-6719ba1488f7','Stylish bearded man wearing sunglasses and watch'],['1724318497004-084cece3e7ae','Shoes, tie, and watch on table'],['1771768477964-fd70c615ceab','Perfume, sunglasses, phone, watch, keys arrangement'],['1608461864721-b8f50c91c147','Black leather belt displayed on gray textile'],['1590508340390-ea4ba24fca36','Individual styled with black leather belt'],['1585856331452-87ea5a04c21c','Blue denim jeans accessorized with black belt'],['1677588026510-cb54e2ee195a','Person in black jacket paired with black belt'],['1760551600273-bca4b15907d0','Woman in white blazer and sunglasses outdoors'],['1760551600697-14df45f4ce2a','Woman wearing sunglasses and scarf standing outside'],['1761765230989-2441b8f51954','Young woman in headscarf and blazer outdoors'],['1773595029618-d573300c37fa','Woman displaying elaborate jewelry'],['1652443590640-d16f7feebb5a','Pair of earrings arranged on pink blanket'],['1592932007895-e8d414dd1868','Person wearing black and white beaded necklace'],['1566534335938-05f1f2949435','Woman in pink pants holding grey leather handbag'],['1760551601203-12eddfb62216','Young woman in sunglasses and scarf outdoors'],['1773595034077-886893001125','Woman displaying elaborate jewelry and styling'],['1586878341574-72183eb184d0','Black and brown leopard print textile scarf']],
  },
];

// ============================================================
// Description generators.
// ============================================================
const CLOTHING_OPENERS = [
  (n) => `The ${n} brings a considered, easy confidence to everyday dressing.`,
  (n) => `Cut for a modern, versatile wardrobe, the ${n} moves easily from day to night.`,
  (n) => `A staple built to be worn often, the ${n} pairs effortlessly with the rest of your rotation.`,
  (n) => `Designed with intention, the ${n} balances clean lines with real wearability.`,
  (n) => `The ${n} takes a familiar silhouette and refines it with careful proportions.`,
];
const CLOTHING_FIT = [
  'The fit is relaxed through the body without feeling oversized, so it layers cleanly under outerwear or stands alone.',
  'A true-to-size cut keeps the silhouette clean and considered, never bulky.',
  'Cut with a slightly dropped shoulder and a straight body for an easy, unforced fit.',
  'Tailored through the waist and hip for a fit that reads polished rather than fussy.',
  'An oversized cut through the body gives room to move while keeping the silhouette deliberate, not sloppy.',
];
const CLOTHING_DETAIL = [
  'Clean seaming, a reinforced hem, and minimal branding keep the focus on the cut.',
  'Subtle contrast stitching and a tonal interior label round out the construction.',
  'A reinforced neckline and double-stitched seams are built to handle daily wear.',
  'Considered hardware and a tonal color palette keep the piece easy to style.',
  'Flat-felled seams and a clean interior finish reflect the attention paid to construction most people never see.',
];
const CLOTHING_USE = [
  'Wear it as the foundation of an everyday look or dress it up for something more considered.',
  "It's built for rotation — as comfortable running errands as it is out for the evening.",
  'Layer it into a full look or let it stand on its own; either way it holds its shape.',
  'A dependable piece for regular wear, built to outlast a single season.',
];
const CLOTHING_CARE = [
  'Machine wash cold, hang to dry.',
  'Machine wash cold with like colors; tumble dry low.',
  'Spot clean or dry clean recommended to preserve shape and color.',
  'Hand wash cold and lay flat to dry to keep its finish.',
];

const ACCESSORY_OPENERS = [
  (n) => `The ${n} is a finishing touch built to earn a permanent place in daily rotation.`,
  (n) => `Simple by design, the ${n} is the kind of detail that pulls a whole look together.`,
  (n) => `The ${n} is made to be used, not just displayed — durable where it counts.`,
  (n) => `A small piece with an outsized effect, the ${n} adds intention to the rest of an outfit.`,
];
const ACCESSORY_DETAIL = [
  'Proportions are kept deliberately understated, so it reads as considered rather than logo-driven.',
  'Hardware is finished to match, and every seam is checked before it ships.',
  'The construction favors longevity over trend — this is meant to be a repeat piece, not a one-season buy.',
  'Finished with minimal branding and clean edges, it pairs with almost anything already in your wardrobe.',
];
const ACCESSORY_USE = [
  'It works equally well as a everyday piece or as the detail that finishes a considered outfit.',
  'Pack it, wear it daily, or save it for the pieces that need one final layer of polish.',
  'A practical, wearable accessory designed to be reached for often, not saved for best.',
];
const ACCESSORY_CARE_TEXTILE = ['Spot clean as needed.', 'Hand wash cold and air dry.', 'Machine wash cold, lay flat to dry.'];
const ACCESSORY_CARE_HARD = ['Wipe clean with a soft, dry cloth.', 'Store in a dry place away from direct sunlight.', 'Avoid contact with water and harsh chemicals.'];

function buildClothingDescription(name, material) {
  const opener = pick(CLOTHING_OPENERS)(name);
  const fit = pick(CLOTHING_FIT);
  const materialLine = `Made from ${material.toLowerCase()}, it holds its shape wash after wash and softens with wear.`;
  const detail = pick(CLOTHING_DETAIL);
  const use = pick(CLOTHING_USE);
  const care = pick(CLOTHING_CARE);
  return `${opener} ${fit} ${materialLine} ${detail} ${use} ${care}`;
}

const HARD_MATERIALS = new Set(['Acetate', 'Metal', 'Stainless Steel', 'Leather', 'Faux Leather']);
function buildAccessoryDescription(name, material) {
  const opener = pick(ACCESSORY_OPENERS)(name);
  const materialLine = `Made from ${material.toLowerCase()}, it's built to handle daily use without losing its finish.`;
  const detail = pick(ACCESSORY_DETAIL);
  const use = pick(ACCESSORY_USE);
  const care = pick(HARD_MATERIALS.has(material) ? ACCESSORY_CARE_HARD : ACCESSORY_CARE_TEXTILE);
  return `${opener} ${materialLine} ${detail} ${use} ${care}`;
}

// ============================================================
// Per-product generation.
// ============================================================
// accessories-lifestyle spans belts through watches — one flat price range
// for the whole category would let a bandana randomly price like a watch,
// so price by sub-type instead (see docs/catalog-report.md).
const LIFESTYLE_PRICE_RANGES = [
  [/Belt/, [2500, 5500]],
  [/Sunglasses/, [3500, 9500]],
  [/Watch/, [8500, 24000]],
  [/Necklace|Ring|Bracelet|Earrings/, [1800, 6500]],
  [/Scarf|Bandana/, [2200, 6500]],
  [/Card Holder|Phone Strap|Keychain/, [1800, 4500]],
];
function priceRangeFor(cat, name) {
  if (cat.key !== 'accessories-lifestyle') return cat.priceRange;
  const match = LIFESTYLE_PRICE_RANGES.find(([re]) => re.test(name));
  return match ? match[1] : cat.priceRange;
}

function materialFor(cat, name, i) {
  if (cat.key !== 'accessories-lifestyle') return cat.materials[i % cat.materials.length];
  if (/Belt/.test(name)) return pick(['Leather', 'Faux Leather', 'Canvas']);
  if (/Sunglasses/.test(name)) return pick(['Acetate', 'Metal']);
  if (/Watch/.test(name)) return pick(['Stainless Steel', 'Leather']);
  if (/Necklace|Ring|Bracelet|Earrings/.test(name)) return pick(['Gold-Tone Metal', 'Silver-Tone Metal', 'Beaded']);
  if (/Scarf|Bandana/.test(name)) return pick(['Wool Blend', 'Silk Blend', 'Cotton']);
  return pick(['Leather', 'Canvas']);
}

function sizesFor(cat, name) {
  if (cat.key === 'accessories-lifestyle') {
    if (/Belt/.test(name)) return sizeRange(BELT_WAIST, 3);
    return null;
  }
  switch (cat.sizeKind) {
    case 'letterMen': return sizeRange(LETTER_MEN, 3);
    case 'letterWomen': return sizeRange(LETTER_WOMEN, 3);
    case 'waist': return sizeRange(WAIST, 3);
    case 'sock': return SOCK_SIZES;
    default: return null;
  }
}

function colorsFor(cat, name, count) {
  if (cat.key === 'accessories-lifestyle' && /Watch/.test(name)) return pickColors(METAL_COLORS, Math.min(count, METAL_COLORS.length));
  return pickColors(cat.colorPalette, count);
}

let globalIndex = 0;
const products = [];

for (const cat of CATEGORIES) {
  cat.names.forEach((name, i) => {
    globalIndex++;
    const skuNum = String(i + 1).padStart(3, '0');
    const sku = `XR-${cat.skuCode}-${skuNum}`;
    const slug = `${slugify(name)}-${cat.skuCode.toLowerCase()}${skuNum}`;
    const material = materialFor(cat, name, i);
    const description = cat.department === 'clothing' ? buildClothingDescription(name, material) : buildAccessoryDescription(name, material);

    const colorCount = Math.min(cat.colorPalette.length, 2 + ((globalIndex * 7) % 5)); // 2..6
    const colors = colorsFor(cat, name, colorCount);
    const sizes = sizesFor(cat, name);

    const [priceMin, priceMax] = priceRangeFor(cat, name);
    const basePrice = randInt(priceMin, priceMax);
    // Round to a "nice" price ending in 00 or 50.
    const priceCents = Math.round(basePrice / 50) * 50;
    const onSale = globalIndex % 7 === 0; // ~14% of catalog
    const compareAtCents = onSale ? Math.round((priceCents * randInt(115, 140)) / 100 / 50) * 50 : null;

    const stockRoll = globalIndex % 20;
    let stockTier;
    if (stockRoll === 0) stockTier = 'out'; // 5%
    else if (stockRoll <= 3) stockTier = 'limited'; // 15%
    else if (stockRoll <= 5) stockTier = 'popular'; // 10%
    else stockTier = 'normal'; // 70%

    const imageCount = Math.min(cat.images.length, 2 + (globalIndex % 4)); // 2..5
    const imageStart = globalIndex % cat.images.length;
    const productImages = Array.from({ length: imageCount }, (_, k) => cat.images[(imageStart + k) % cat.images.length]);

    const tags = [];
    if (cat.department === 'accessories') tags.push('unisex');
    if (['mens-hoodies', 'womens-hoodies', 'mens-tracksuits', 'accessories-caps', 'accessories-trucker-caps'].includes(cat.key)) tags.push('streetwear');
    if (['mens-outerwear', 'womens-jackets', 'accessories-lifestyle'].includes(cat.key) && priceCents > 15000) tags.push('premium');
    if (/Essential|Classic|Signature/.test(name)) tags.push('essential');
    if (/Oversized|Boxy/.test(name)) tags.push('oversized');
    if (/Relaxed/.test(name)) tags.push('relaxed');
    if (/Slim|Fitted|Skinny|Tapered/.test(name)) tags.push('slim');
    if (onSale) tags.push('sale');
    if (stockTier === 'limited') tags.push('limited');

    products.push({
      id: uuid(), name, slug, sku, description, categoryId: cat.categoryId, cat,
      priceCents, compareAtCents, colors, sizes, material, stockTier, images: productImages, tags: [...new Set(tags)],
    });
  });
}

// ============================================================
// Merchandising collection assignment — spread across categories/genders,
// not clustered in one part of the catalog.
// ============================================================
function pickSpread(list, count, offset, stride) {
  const out = [];
  let idx = offset % list.length;
  const used = new Set();
  while (out.length < count && used.size < list.length) {
    if (!used.has(idx)) {
      out.push(list[idx]);
      used.add(idx);
    }
    idx = (idx + stride) % list.length;
  }
  return out;
}

const newInProducts = pickSpread(products, 40, 3, 7);
const bestSellerProducts = pickSpread(products, 25, 11, 13);
const featuredProducts = pickSpread(products, 30, 5, 9);
// Summer Sale = a genuine subset of products that actually carry a compare-at price (no invented discount).
const onSaleProducts = products.filter((p) => p.compareAtCents !== null);
const summerSaleProducts = onSaleProducts.slice(0, 40);

// ============================================================
// SQL emission.
// ============================================================
const out = [];
out.push('-- Structured catalog expansion seed — generated by scripts/generate-catalog.mjs.');
out.push('-- Do not hand-edit; re-run the generator and replace this file if the catalog needs to change.');
out.push('-- See /docs/catalog-report.md for the full breakdown.');
out.push('');

for (const p of products) {
  out.push(`insert into products (id, slug, name, description, sku, status, brand_id, category_id, tags, seo_title, seo_description, published_at) values`);
  out.push(`  (${esc(p.id)}, ${esc(p.slug)}, ${esc(p.name)}, ${esc(p.description)}, ${esc(p.sku)}, 'active', ${esc(BRAND_ID)}, ${esc(p.categoryId)}, ${tagsLiteral(p.tags)}, ${esc(`${p.name} | X-Rare`)}, ${esc(p.description.slice(0, 155))}, now());`);

  const variantRows = [];
  const variants = [];
  if (p.sizes) {
    for (const color of p.colors) {
      for (const size of p.sizes) {
        variants.push({ color, size });
      }
    }
  } else {
    for (const color of p.colors) {
      variants.push({ color, size: null });
    }
  }

  let stockBase;
  if (p.stockTier === 'out') stockBase = 0;
  else if (p.stockTier === 'limited') stockBase = () => randInt(1, 15);
  else if (p.stockTier === 'popular') stockBase = () => randInt(50, 150);
  else stockBase = () => randInt(10, 60);

  variants.forEach((v, vi) => {
    const variantId = uuid();
    const colorCode = v.color ? (COLOR_CODES[v.color] || v.color.slice(0, 3).toUpperCase()) : null;
    const sizeCode = v.size ? v.size.replace('/', '') : null;
    const parts = [p.sku, colorCode, sizeCode].filter(Boolean);
    const variantSku = parts.length > 1 ? parts.join('-') : `${p.sku}-${vi + 1}`;
    const stock = p.stockTier === 'out' ? 0 : stockBase();
    variantRows.push({ id: variantId, sku: variantSku, color: v.color, size: v.size, stock });
  });

  out.push(`insert into product_variants (id, product_id, sku, price_cents, compare_at_price_cents, size, color, material, is_active, position) values`);
  out.push(
    variantRows
      .map(
        (v, i) =>
          `  (${esc(v.id)}, ${esc(p.id)}, ${esc(v.sku)}, ${p.priceCents}, ${p.compareAtCents ?? 'null'}, ${esc(v.size)}, ${esc(v.color)}, ${esc(p.material)}, true, ${i + 1})`,
      )
      .join(',\n') + ';',
  );

  out.push(`insert into inventory_movements (variant_id, type, quantity, reason) values`);
  out.push(
    variantRows
      .map((v) => `  (${esc(v.id)}, 'restock', ${Math.max(v.stock, 1)}, 'Initial catalog seed')`)
      .join(',\n') + ';',
  );
  if (variantRows.some((v) => v.stock === 0)) {
    // A variant that should read as truly out of stock: restock then fully reserve it via a sale movement,
    // rather than a fabricated on_hand of zero that bypasses the ledger's own arithmetic.
    const zeroVariants = variantRows.filter((v) => v.stock === 0);
    out.push(`insert into inventory_movements (variant_id, type, quantity, reason) values`);
    out.push(zeroVariants.map((v) => `  (${esc(v.id)}, 'sale', -1, 'Seed: mark out of stock')`).join(',\n') + ';');
  }

  out.push(`insert into product_images (product_id, url, alt_text, position) values`);
  out.push(
    p.images
      .map(([id, alt], i) => `  (${esc(p.id)}, ${esc(`https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop&h=1500`)}, ${esc(alt)}, ${i + 1})`)
      .join(',\n') + ';',
  );
  out.push('');
}

function emitCollection(collectionId, list) {
  if (list.length === 0) return;
  out.push(`insert into collection_products (collection_id, product_id, position) values`);
  out.push(list.map((p, i) => `  (${esc(collectionId)}, ${esc(p.id)}, ${i + 1})`).join(',\n') + ';');
  out.push('');
}

emitCollection(COLLECTIONS.newIn, newInProducts);
emitCollection(COLLECTIONS.bestSellers, bestSellerProducts);
emitCollection(COLLECTIONS.featured, featuredProducts);
emitCollection(COLLECTIONS.summerSale, summerSaleProducts);

process.stdout.write(out.join('\n') + '\n');

// Report to stderr (not part of the SQL output) — used to write docs/catalog-report.md.
const report = {
  totalProducts: products.length,
  byCategory: CATEGORIES.map((c) => ({ key: c.key, count: c.names.length })),
  onSale: onSaleProducts.length,
  outOfStock: products.filter((p) => p.stockTier === 'out').length,
  lowStock: products.filter((p) => p.stockTier === 'limited').length,
  totalVariants: products.reduce((sum, p) => sum + (p.sizes ? p.colors.length * p.sizes.length : p.colors.length), 0),
  totalImages: products.reduce((sum, p) => sum + p.images.length, 0),
  collections: {
    newIn: newInProducts.length,
    bestSellers: bestSellerProducts.length,
    featured: featuredProducts.length,
    summerSale: summerSaleProducts.length,
  },
};
process.stderr.write(JSON.stringify(report, null, 2) + '\n');
