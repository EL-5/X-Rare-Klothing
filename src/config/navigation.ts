import { ROUTES } from './routes';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavColumn {
  heading: NavLink;
  links: NavLink[];
}

export interface NavItem {
  label: string;
  href: string;
  columns?: NavColumn[];
}

/** Primary navigation tree — X-Rare's main website categories: New In / Shop (Men, Women, Accessories) / Collections. */
export const primaryNav: NavItem[] = [
  { label: 'Home', href: ROUTES.home },
  { label: 'New In', href: ROUTES.collection('new-in') },
  {
    label: 'Shop',
    href: ROUTES.shop,
    columns: [
      {
        heading: { label: 'Men', href: ROUTES.category('men') },
        links: [
          { label: 'T-Shirts', href: ROUTES.category('mens-tshirts') },
          { label: 'Hoodies', href: ROUTES.category('mens-hoodies') },
          { label: 'Jackets', href: ROUTES.category('mens-jackets') },
          { label: 'Pants', href: ROUTES.category('mens-pants') },
          { label: 'Tracksuits', href: ROUTES.category('mens-tracksuits') },
          { label: 'Outerwear', href: ROUTES.category('mens-outerwear') },
        ],
      },
      {
        heading: { label: 'Women', href: ROUTES.category('women') },
        links: [
          { label: 'Tops', href: ROUTES.category('womens-tops') },
          { label: 'T-Shirts', href: ROUTES.category('womens-tshirts') },
          { label: 'Hoodies', href: ROUTES.category('womens-hoodies') },
          { label: 'Sets', href: ROUTES.category('womens-sets') },
          { label: 'Jackets', href: ROUTES.category('womens-jackets') },
          { label: 'Pants', href: ROUTES.category('womens-pants') },
        ],
      },
      {
        heading: { label: 'Accessories', href: ROUTES.category('accessories') },
        links: [
          { label: 'Caps', href: ROUTES.category('accessories-caps') },
          { label: 'Trucker Caps', href: ROUTES.category('accessories-trucker-caps') },
          { label: 'Bags', href: ROUTES.category('accessories-bags') },
          { label: 'Beanies', href: ROUTES.category('accessories-beanies') },
          { label: 'Socks', href: ROUTES.category('accessories-socks') },
          { label: 'Lifestyle Accessories', href: ROUTES.category('accessories-lifestyle') },
        ],
      },
    ],
  },
  { label: 'Collections', href: ROUTES.collections },
  { label: 'About', href: ROUTES.about },
  { label: 'FAQ', href: ROUTES.faq },
  { label: 'Contact', href: ROUTES.contact },
];
