-- 'are-your-products-authentic' (seeded in 0045, before the multi-brand
-- repositioning) said "we're not a reseller or marketplace... every piece
-- is designed and produced by us." 0047 later added
-- 'are-all-products-x-rare-products' with the correct, brief-specified
-- honest answer ("Products may be from X-Rare or from selected partner
-- brands") but never went back to fix the now-contradictory older entry —
-- both are live and published in the same FAQ category today. Updating the
-- older one to be consistent: authenticity is guaranteed either way (own
-- line or curated partner brand), without the now-false "not a reseller"
-- claim.

update faqs
set answer = 'Yes. Whether it''s X-Rare''s own line or a partner brand from our curated selection, every product sold through X-Rare is the genuine article — never counterfeit or unauthorized resale. Each product page and product card always shows exactly which brand you''re buying from.'
where slug = 'are-your-products-authentic';
