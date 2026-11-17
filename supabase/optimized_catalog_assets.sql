-- Point the 30 published RAHA products at the optimized immutable WebP assets.
update public.perfumes
set
  image_url = '/media/perfumes/webp/' || slug || '.webp'
where
  slug in (
    'nocturne',
    'saffron-veil',
    'velvet-oud',
    'dawn-resin',
    'ember-bloom',
    'mineral-veil',
    'cinder-rose',
    'golden-hour',
    'ash-and-iris',
    'silk-atlas',
    'fig-noir',
    'solar-musk',
    'amber-archive',
    'quiet-tide',
    'black-tea',
    'celestial-skin',
    'fig-and-salt',
    'rose-signal',
    'cedar-drift',
    'after-rain',
    'moss-lit',
    'linen-smoke',
    'cassis-night',
    'opal-heat',
    'stone-fig',
    'amber-mist',
    'santal-quiet',
    'blue-hour',
    'velvet-citrus',
    'white-oud'
  );
