-- The order_confirmation email was a single bare sentence with no order
-- details at all — no line items, no images, no totals breakdown, no
-- shipping address. Same "dry"/missing-content pattern already fixed across
-- every list-rendering surface in the app this session, just server-side
-- and email-specific this time (table-based layout, inline styles only —
-- email clients don't run the site's CSS or JS).
--
-- order_items.image_url is a snapshot taken at purchase time (see
-- 0006_orders.sql's header comment: "must stand on their own historically"),
-- so it's already exactly the right image to show even if the product is
-- later repriced, renamed, or deleted.

create or replace function finalize_paid_order(_order_id uuid, _payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _item record;
  _order orders%rowtype;
  _items jsonb;
  _shipping_address jsonb;
begin
  update payments set status = 'successful' where id = _payment_id;

  insert into payment_transactions (payment_id, type, amount_cents, status, provider_reference, raw_response)
  select id, 'capture', amount_cents, 'successful', provider_reference, '{}'::jsonb
  from payments where id = _payment_id;

  update orders set status = 'paid', inventory_reserved = false where id = _order_id;

  for _item in select variant_id, quantity from order_items where order_id = _order_id loop
    insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
    values (_item.variant_id, 'release', _item.quantity, 'Order paid', 'order', _order_id);
    insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
    values (_item.variant_id, 'sale', -_item.quantity, 'Order paid', 'order', _order_id);
  end loop;

  select * into _order from orders where id = _order_id;

  select jsonb_agg(jsonb_build_object(
    'product_name', product_name,
    'variant_title', variant_title,
    'image_url', image_url,
    'quantity', quantity,
    'line_total', _order.currency || ' ' || to_char(total_cents / 100.0, 'FM999999990.00')
  ) order by created_at)
  into _items
  from order_items where order_id = _order_id;

  select jsonb_build_object(
    'first_name', first_name, 'last_name', last_name,
    'address1', address1, 'address2', address2,
    'city', city, 'region', region, 'postal_code', postal_code, 'country_code', country_code
  )
  into _shipping_address
  from order_addresses where order_id = _order_id and type = 'shipping';

  perform enqueue_notification('order_confirmation', _order.email,
    jsonb_build_object(
      'order_number', _order.order_number,
      'total', _order.currency || ' ' || to_char(_order.total_cents / 100.0, 'FM999999990.00'),
      'subtotal', _order.currency || ' ' || to_char(_order.subtotal_cents / 100.0, 'FM999999990.00'),
      'discount', _order.currency || ' ' || to_char(_order.discount_cents / 100.0, 'FM999999990.00'),
      'discount_cents', _order.discount_cents,
      'shipping', _order.currency || ' ' || to_char(_order.shipping_cents / 100.0, 'FM999999990.00'),
      'tax', _order.currency || ' ' || to_char(_order.tax_cents / 100.0, 'FM999999990.00'),
      'items', coalesce(_items, '[]'::jsonb),
      'shipping_address', _shipping_address
    ), _order_id);
  perform enqueue_notification('payment_confirmation', _order.email,
    jsonb_build_object('order_number', _order.order_number,
      'total', _order.currency || ' ' || to_char(_order.total_cents / 100.0, 'FM999999990.00')), _order_id);
end;
$$;

create or replace function render_notification(_type notification_type, _data jsonb)
returns table (subject text, body text)
language plpgsql
immutable
as $$
declare
  _content_subject text;
  _content_body text;
  _items_html text := '';
  _item jsonb;
  _totals_html text := '';
  _address_html text := '';
  _address jsonb;
begin
  case _type
    when 'account_verification' then
      _content_subject := 'Verify your X-Rare account';
      _content_body := '<p>Welcome to X-Rare. Please verify your email address to activate your account.</p>';
    when 'password_reset' then
      _content_subject := 'Reset your X-Rare password';
      _content_body := '<p>We received a request to reset your password. If this wasn''t you, you can safely ignore this email.</p>';
    when 'order_confirmation' then
      _content_subject := 'Order Confirmed — ' || coalesce(_data->>'order_number', '');

      for _item in select * from jsonb_array_elements(coalesce(_data->'items', '[]'::jsonb))
      loop
        _items_html := _items_html ||
          '<tr>' ||
            '<td style="padding:12px 0;border-bottom:1px solid #EAE7E0;width:56px;">' ||
              (case when coalesce(_item->>'image_url', '') <> ''
                then '<img src="' || (_item->>'image_url') ||
                  '" width="56" height="70" style="width:56px;height:70px;object-fit:cover;display:block;border-radius:2px;" alt="" />'
                else '<div style="width:56px;height:70px;background:#F5F3EE;border-radius:2px;"></div>'
              end) ||
            '</td>' ||
            '<td style="padding:12px 16px;border-bottom:1px solid #EAE7E0;vertical-align:top;">' ||
              '<div style="font-size:13px;color:#0A0A0A;">' || coalesce(_item->>'product_name', '') || '</div>' ||
              (case when coalesce(_item->>'variant_title', '') <> ''
                then '<div style="font-size:12px;color:#666666;margin-top:2px;">' || (_item->>'variant_title') || '</div>'
                else ''
              end) ||
              '<div style="font-size:12px;color:#666666;margin-top:2px;">Qty ' || coalesce(_item->>'quantity', '1') || '</div>' ||
            '</td>' ||
            '<td style="padding:12px 0;border-bottom:1px solid #EAE7E0;text-align:right;vertical-align:top;font-size:13px;color:#0A0A0A;white-space:nowrap;">' ||
              coalesce(_item->>'line_total', '') ||
            '</td>' ||
          '</tr>';
      end loop;

      _totals_html :=
        '<tr><td style="padding:6px 0;font-size:13px;color:#666666;">Subtotal</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#0A0A0A;">' ||
          coalesce(_data->>'subtotal', '') || '</td></tr>';
      if coalesce((_data->>'discount_cents')::integer, 0) > 0 then
        _totals_html := _totals_html ||
          '<tr><td style="padding:6px 0;font-size:13px;color:#666666;">Discount</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#0A0A0A;">-' ||
            (_data->>'discount') || '</td></tr>';
      end if;
      _totals_html := _totals_html ||
        '<tr><td style="padding:6px 0;font-size:13px;color:#666666;">Shipping</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#0A0A0A;">' ||
          coalesce(_data->>'shipping', '') || '</td></tr>' ||
        '<tr><td style="padding:6px 0;font-size:13px;color:#666666;">Tax</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#0A0A0A;">' ||
          coalesce(_data->>'tax', '') || '</td></tr>' ||
        '<tr><td style="padding:10px 0 0;font-size:13px;font-weight:600;color:#0A0A0A;border-top:1px solid #0A0A0A;">Total</td><td style="padding:10px 0 0;text-align:right;font-size:13px;font-weight:600;color:#0A0A0A;border-top:1px solid #0A0A0A;">' ||
          coalesce(_data->>'total', '') || '</td></tr>';

      _address := _data->'shipping_address';
      if _address is not null and _address->>'address1' is not null then
        _address_html :=
          '<div style="margin-top:24px;">' ||
            '<p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#666666;margin:0 0 8px;">Shipping to</p>' ||
            '<p style="font-size:13px;color:#0A0A0A;line-height:1.5;margin:0;">' ||
              coalesce(_address->>'first_name', '') || ' ' || coalesce(_address->>'last_name', '') || '<br/>' ||
              coalesce(_address->>'address1', '') ||
              (case when coalesce(_address->>'address2', '') <> '' then ', ' || (_address->>'address2') else '' end) || '<br/>' ||
              coalesce(_address->>'city', '') ||
              (case when coalesce(_address->>'region', '') <> '' then ', ' || (_address->>'region') else '' end) ||
              ' ' || coalesce(_address->>'postal_code', '') || '<br/>' ||
              coalesce(_address->>'country_code', '') ||
            '</p>' ||
          '</div>';
      end if;

      _content_body :=
        '<p>Thanks for your order! We''ve received order <strong>' || coalesce(_data->>'order_number', '') ||
          '</strong>. We''ll email you again once it ships.</p>' ||
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-collapse:collapse;">' ||
          _items_html ||
        '</table>' ||
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;border-collapse:collapse;">' ||
          _totals_html ||
        '</table>' ||
        _address_html;
    when 'payment_confirmation' then
      _content_subject := 'Payment Received — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>We''ve successfully received your payment of ' || coalesce(_data->>'total', '') ||
        ' for order <strong>' || coalesce(_data->>'order_number', '') || '</strong>.</p>';
    when 'order_processing' then
      _content_subject := 'Your Order Is Being Prepared — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>Order <strong>' || coalesce(_data->>'order_number', '') || '</strong> is now being prepared for shipment.</p>';
    when 'order_shipped' then
      _content_subject := 'Your Order Has Shipped — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>Order <strong>' || coalesce(_data->>'order_number', '') || '</strong> is on its way.</p>';
    when 'order_delivered' then
      _content_subject := 'Delivered — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>Order <strong>' || coalesce(_data->>'order_number', '') || '</strong> has been delivered. We hope you love it.</p>';
    when 'refund' then
      _content_subject := 'Refund Processed — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>A refund of ' || coalesce(_data->>'amount', '') || ' has been issued for order <strong>' ||
        coalesce(_data->>'order_number', '') || '</strong>.</p>';
    when 'newsletter' then
      _content_subject := 'Welcome to X-Rare';
      _content_body := '<p>You''re on the list. Watch your inbox for drops, offers, and rare finds.</p>';
    else
      _content_subject := 'X-Rare';
      _content_body := '';
  end case;

  return query select
    _content_subject,
    '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">' ||
    '<div style="background:#0A0A0A;padding:24px;text-align:center;"><span style="color:#ffffff;font-size:20px;letter-spacing:2px;font-weight:600;">X-RARE</span></div>' ||
    '<div style="padding:32px 24px;color:#0A0A0A;line-height:1.6;">' || _content_body || '</div>' ||
    '<div style="padding:16px 24px;background:#F5F3EE;text-align:center;color:#666666;font-size:12px;">© ' ||
    extract(year from now())::text || ' X-Rare. All rights reserved.</div>' ||
    '</div>';
end;
$$;
