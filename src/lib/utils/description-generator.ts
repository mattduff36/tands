interface CastleFormData {
  name: string;
  theme: string;
  size: string;
  price: number;
}

const themeDescriptions: Record<string, string[]> = {
  princess: [
    'A magical castle fit for royalty',
    'Features beautiful artwork of enchanting characters',
    'Perfect for little princesses and their royal celebrations',
    'Decorated with stunning princess designs'
  ],
  superhero: [
    'Become a superhero for a day',
    'Perfect for action-packed parties',
    'Features exciting superhero designs',
    'Great for aspiring heroes and heroines'
  ],
  jungle: [
    'Go on a wild adventure',
    'Decorated with jungle animals and tropical designs',
    'Perfect for nature-loving adventurers',
    'Features exciting wildlife artwork'
  ],
  pirate: [
    'Ahoy matey! Set sail for adventure',
    'Perfect for treasure hunters and sea explorers',
    'Features exciting pirate ship designs',
    'Great for swashbuckling fun'
  ],
  fairy: [
    'Enter a magical fairy wonderland',
    'Perfect for enchanted celebrations',
    'Features beautiful fairy tale designs',
    'Great for magical adventures'
  ],
  sports: [
    'Perfect for active celebrations',
    'Great for sports enthusiasts',
    'Features exciting sports designs',
    'Ideal for energetic fun'
  ],
  party: [
    'All about celebrating in style',
    'Perfect for any celebration',
    'Features colorful party designs',
    'Great for festive fun'
  ],
  classic: [
    'A timeless classic that never goes out of style',
    'Perfect for any party or event',
    'Features bright, colorful designs',
    'Great for traditional bouncy fun'
  ],
  ocean: [
    'Dive into underwater fun',
    'Features colorful sea creatures',
    'Perfect for ocean-loving adventurers',
    'Great for making a splash at your party'
  ]
};

const sizeDescriptions: Record<string, string> = {
  small: 'ideal for smaller gardens and intimate gatherings',
  medium: 'perfect for most garden parties and events',
  large: 'great for bigger celebrations and larger groups',
  compact: 'perfect for smaller spaces without compromising on fun'
};

const priceDescriptions: Record<string, string> = {
  budget: 'offering excellent value for money',
  mid: 'providing great quality at a competitive price',
  premium: 'our premium option with extra special features'
};

export function generateCastleDescription(formData: CastleFormData): string {
  const { name, theme, size, price } = formData;
  
  // Normalize theme for lookup
  const normalizedTheme = theme.toLowerCase().trim();
  
  // Get theme-specific descriptions
  const themeDescs = themeDescriptions[normalizedTheme] || themeDescriptions.classic;
  const mainDescription = themeDescs[Math.floor(Math.random() * themeDescs.length)];
  
  // Determine size category
  let sizeCategory = 'medium';
  if (size.toLowerCase().includes('10ft') || size.toLowerCase().includes('12ft')) {
    sizeCategory = 'small';
  } else if (size.toLowerCase().includes('15ft') || size.toLowerCase().includes('16ft') || size.toLowerCase().includes('18ft')) {
    sizeCategory = 'large';
  } else if (size.toLowerCase().includes('compact') || size.toLowerCase().includes('mini')) {
    sizeCategory = 'compact';
  }
  
  // Determine price category
  let priceCategory = 'mid';
  if (price <= 50) {
    priceCategory = 'budget';
  } else if (price >= 80) {
    priceCategory = 'premium';
  }
  
  // Build description
  const parts = [
    mainDescription,
    `This ${size} bouncy castle is ${sizeDescriptions[sizeCategory]}`,
    `${priceDescriptions[priceCategory]}. Fully cleaned, safety tested, and guaranteed to bring smiles to faces of all ages!`
  ];
  
  // Add special features based on theme
  const specialFeatures: Record<string, string> = {
    jungle: 'Includes a fun slide for extra adventure!',
    pirate: 'Complete with pirate ship features!',
    princess: 'Featuring beautiful turrets and royal decorations!',
    superhero: 'With exciting 3D superhero artwork!',
    sports: 'Perfect for active kids who love to bounce and play!',
    ocean: 'Complete with underwater scene decorations!'
  };
  
  if (specialFeatures[normalizedTheme]) {
    parts.splice(1, 0, specialFeatures[normalizedTheme]);
  }
  
  return parts.join(' ');
}

// Alternative descriptions for variety
export function generateAlternativeDescription(formData: CastleFormData): string {
  const { name, theme, size, price } = formData;
  
  const alternatives = [
    `${name} is the perfect addition to any celebration! This ${theme.toLowerCase()}-themed bouncy castle (${size}) combines safety, fun, and excitement. At just £${price} per day, it's an affordable way to make your event unforgettable. Fully insured, PIPA tested, and guaranteed to be the highlight of your party!`,
    
    `Looking for the perfect bouncy castle? ${name} delivers endless fun with its ${theme.toLowerCase()} theme and spacious ${size} design. Professional setup and collection included, along with full insurance coverage. Book today for just £${price} per day and watch the smiles multiply!`,
    
    `${name} brings the magic of ${theme.toLowerCase()} adventures right to your doorstep! This ${size} bouncy castle is perfect for parties, events, and celebrations. Professionally cleaned, safety inspected, and available for £${price} per day. Create memories that will last a lifetime!`
  ];
  
  return alternatives[Math.floor(Math.random() * alternatives.length)];
} 