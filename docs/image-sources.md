# Image Sources

Every externally-sourced image in the app is listed here with its source,
license, and usage. All images come from [Unsplash](https://unsplash.com)
under the [Unsplash License](https://unsplash.com/license) — free for
commercial and noncommercial use, no permission required, attribution
appreciated but not required. None are Unsplash+ (paid/restricted) images.

The canonical id/alt-text pairing lives in code at
[src/data/images.ts](../src/data/images.ts) — this table is the licensing
record; that file is the runtime source of truth. If an image is swapped,
update both.

## Product images

| Product | Position | Photo ID | Photographer | Usage |
|---|---|---|---|---|
| Oversized Graphic Tee | 1 (front) | 1508216310976-c518daae0cdc | Oladimeji Odunsi | Product gallery, card |
| Oversized Graphic Tee | 2 (back) | 1542406775-ade58c52d2e4 | rico cori | Product gallery, card hover |
| Straight Leg Denim | 1 (front) | 1624378439575-d8705ad7ae80 | Matthew Moloney | Product gallery, card |
| Straight Leg Denim | 2 (back) | 1714143136372-ddaf8b606da7 | TuanAnh Blue | Product gallery, card hover |
| Coach Jacket | 1 (front) | 1614693348454-1e0710d21c60 | Brock Wegner | Product gallery, card |
| Coach Jacket | 2 (back) | 1555583743-991174c11425 | Adrian Dascal | Product gallery, card hover |
| Embroidered Hoodie | 1 (front) | 1564557287817-3785e38ec1f5 | The Ian | Product gallery, card |
| Embroidered Hoodie | 2 (back) | 1685328403755-de1d57e12e63 | Redicul Pict | Product gallery, card hover |
| Ribbed Tank Top | 1 (front) | 1762337676182-28feaa48e3d4 | Zulfugar Karimov | Product gallery, card |
| Ribbed Tank Top | 2 (back) | 1598554747436-c9293d6a588f | KAi'S PHOTOGRAPHY | Product gallery, card hover |
| Pleated Midi Skirt | 1 (front) | 1762337679957-0994eeb9001b | Zulfugar Karimov | Product gallery, card |
| Pleated Midi Skirt | 2 (back) | 1762337677950-dcd609ca8ffa | Zulfugar Karimov | Product gallery, card hover |
| Canvas Tote Bag | 1 (front) | 1624687943971-e86af76d57de | Ugluk Potroshitel | Product gallery, card |
| Canvas Tote Bag | 2 (detail) | 1732963947955-858ad7d5e540 | Simply Mersah | Product gallery, card hover |
| Wool Blend Beanie | 1 (front) | 1576871337632-b9aef4c17ab9 | Fábio Alves | Product gallery, card |
| Wool Blend Beanie | 2 (worn) | 1510598969022-c4c6c5d05769 | Jordan Whitfield | Product gallery, card hover |

## Category images (top-level — the only tier a UI surface renders today)

| Category | Photo ID | Photographer | Usage |
|---|---|---|---|
| Men | 1644092000597-ff2320ffbb6d | Caleb Williams | Homepage category grid |
| Women | 1533392151650-269f96231f65 | Dmytro Tolokonov | Homepage category grid |
| Accessories | 1680690653166-1618c3bcdf51 | Valentina Schick | Homepage category grid |

## Collection cover images

| Collection | Photo ID | Photographer | Usage |
|---|---|---|---|
| New In | 1571513800374-df1bbe650e56 | Aiony Haust | Collections index, collection page cover |
| Best Sellers | 1613915617430-8ab0fd7c6baf | Chyntia Juls | Collections index, collection page cover |
| Summer Sale | 1662532577856-e8ee8b138a8b | Marjan Taghipour | Collections index, collection page cover |
| Featured Products | 1629511565591-a1d494ad6c58 | Anni Peng | Collections index, collection page cover |

## Homepage hero campaign (3 slides)

| Slide | Photo ID | Photographer | Usage |
|---|---|---|---|
| New Season / Rare By Design | 1603189343302-e603f7add05a | Malicki M Beser | Hero carousel (desktop + mobile crop) |
| Best Sellers | 1543728069-a3f97c5a2f32 | Michael Lee | Hero carousel (desktop + mobile crop) |
| Summer Sale | 1657815929003-b97cc426cb3d | Alina Bordunova | Hero carousel (desktop + mobile crop) |

## Homepage promotional banners

| Banner | Photo ID | Photographer | Usage |
|---|---|---|---|
| New Releases | 1733322992706-1210ca79f4df | Ben Iwara | Homepage banner section |
| Tracksuits | 1635650804060-bb009bcb2ea5 | Bailey Alexander | Homepage banner section |

## Editorial / page imagery

| Placement | Photo ID | Photographer | Usage |
|---|---|---|---|
| About page hero | 1676439777386-d67cd2b32e7b | mohammad kashkooli | About page full-width banner |
| About page secondary | 1548207775-a7676e36f20a | Juan Manuel Merino | About page image/text section |
| Contact page banner | 1441984904996-e0b6ba687e04 | Clark Street Mercantile | Contact page top banner |

## Attribution

Not legally required under the Unsplash License, but courtesy credit: full
photographer list above. Each photo can be viewed at
`https://unsplash.com/photos/<slug-ending-in-the-photo-id>` for verification.

## Not yet sourced

Subcategory images (T-Shirts, Denim, Jackets, Hoodies, etc. below the
Men/Women/Accessories tier) are left `null` — no current UI surface renders
them (`CategoryGrid` only shows top-level categories). See
docs/image-content-plan.md for the full "what renders where" audit that
justifies this scope.
