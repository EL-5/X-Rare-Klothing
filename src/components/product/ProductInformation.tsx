import { Link } from 'react-router-dom';
import { formatMoney } from '@/utils/money';
import { ROUTES } from '@/config/routes';
import type { Money, Product } from '@/types/domain';

export interface ProductInformationProps {
  product: Product;
  /** Reflects the currently-selected variant's price when one resolves, falling back to the product's base price. */
  price: Money;
  compareAtPrice: Money | null;
  sku: string | null;
}

export function ProductInformation({ product, price, compareAtPrice, sku }: ProductInformationProps) {
  const isOnSale = compareAtPrice !== null && compareAtPrice.cents > price.cents;

  return (
    <div>
      {product.brand ? (
        <Link
          to={ROUTES.brand(product.brand.slug)}
          className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/60 underline-offset-4 hover:text-accent hover:underline"
        >
          {product.brand.name}
        </Link>
      ) : null}
      <h1 className="mt-1 text-xl font-semibold uppercase tracking-wide text-ink lg:text-2xl">{product.title}</h1>
      <p className="mt-3 text-lg text-ink">
        {isOnSale ? <span className="mr-2 text-ink/60 line-through">{formatMoney(compareAtPrice)}</span> : null}
        {formatMoney(price)}
      </p>
      {sku ? <p className="mt-1 text-xs text-ink/60">SKU: {sku}</p> : null}
    </div>
  );
}
