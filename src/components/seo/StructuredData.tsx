interface StructuredDataProps {
  type: 'LocalBusiness' | 'Product' | 'Service' | 'BreadcrumbList';
  data: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Local Business structured data for the main site
export function LocalBusinessStructuredData() {
  const localBusinessData = {
    name: 'T&S Bouncy Castle Hire',
    description: 'Professional bouncy castle hire service in Edwinstowe and surrounding areas. Fully insured, safe, and fun inflatables for parties, events, and celebrations.',
    '@type': 'LocalBusiness',
    '@context': 'https://schema.org',
    url: 'https://www.bouncy-castle-hire.com',
    logo: 'https://www.bouncy-castle-hire.com/favicon/android-chrome-512x512.png',
    image: [
      'https://www.bouncy-castle-hire.com/IMG_2360.JPEG',
      'https://www.bouncy-castle-hire.com/IMG_2361.JPEG',
      'https://www.bouncy-castle-hire.com/IMG_2362.JPEG'
    ],
    telephone: '+44-7835-094187',
    email: 'info@bouncy-castle-hire.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '85 Sixth Ave',
      addressLocality: 'Edwinstowe',
      addressRegion: 'Mansfield',
      postalCode: 'NG21 9PW',
      addressCountry: 'GB'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 53.2004, // Approximate coordinates for Edwinstowe
      longitude: -1.0681
    },
    openingHours: [
      'Mo-Fr 09:00-18:00',
      'Sa 09:00-17:00',
      'Su 10:00-16:00'
    ],
    areaServed: [
      {
        '@type': 'City',
        name: 'Edwinstowe'
      },
      {
        '@type': 'City', 
        name: 'Mansfield'
      },
      {
        '@type': 'City',
        name: 'Newark'
      },
      {
        '@type': 'City',
        name: 'Worksop'
      },
      {
        '@type': 'City',
        name: 'Ollerton'
      },
      {
        '@type': 'City',
        name: 'Nottingham'
      },
      {
        '@type': 'City',
        name: 'Bilsthorpe'
      },
      {
        '@type': 'State',
        name: 'Nottinghamshire'
      }
    ],
    serviceType: 'Bouncy Castle Hire',
    priceRange: '££',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Bouncy Castle Hire Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Children\'s Bouncy Castle Hire',
            description: 'Safe and fun bouncy castles perfect for children\'s parties and events'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Adult Bouncy Castle Hire',
            description: 'Sturdy bouncy castles suitable for adult parties and corporate events'
          }
        },
        {
          '@type': 'Service',
          name: 'Event Equipment Hire',
          description: 'Complete party equipment hire including bouncy castles and inflatables'
        }
      ]
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61577881314560'
      // Instagram coming soon
    ]
  };

  return <StructuredData type="LocalBusiness" data={localBusinessData} />;
}

// Breadcrumb structured data
export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const breadcrumbData = {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return <StructuredData type="BreadcrumbList" data={breadcrumbData} />;
}