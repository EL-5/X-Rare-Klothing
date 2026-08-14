Implement the complete catalog experience.

Routes:

/shop
/collections/:slug
/search

## PRODUCT GRID

Support:

Responsive columns
Product cards
Sale badges
Sold out
Color indicators
Hover image
Quick View

## FILTERS

Implement audited filters.

At minimum:

Availability
Price
Category
Collection
Size
Color

## SORTING

Support:

Featured
Newest
Price low-high
Price high-low
Best selling where data exists

## URL STATE

Filters and sorting should be reflected in the URL where appropriate.

Example:

?sort=price-ascending&availability=in-stock

Refreshing the page must preserve state.

## MOBILE

Use a filter drawer.

## PAGINATION

Implement the reference site's observed pagination/load-more behavior.

## SEARCH

Implement:

Autocomplete
Search results
Product search
No results
Recent searches if appropriate

Use a SearchService abstraction.

Do not put search logic directly into UI components.