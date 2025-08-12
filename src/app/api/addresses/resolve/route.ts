import { NextRequest, NextResponse } from 'next/server';

// Resolve a selected suggestion to a normalized address + coordinates.
// Prefer getAddress.io details when GETADDRESS_API_KEY is set; else OS Places; else Geoapify reverse/search.

export const runtime = 'nodejs';

interface GeoapifyGeocodeResult {
  formatted: string;
  housenumber?: string;
  street?: string;
  city?: string;
  postcode?: string;
  county?: string;
  country_code?: string;
  lat?: number;
  lon?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, coordinates } = body as { label?: string; coordinates?: { lat: number; lng: number } | null };

    const getAddressKey = process.env.GETADDRESS_API_KEY;
    if (getAddressKey && label) {
      // getAddress.io: pass the suggestion id to /get
      // The client currently sends only label & optional coordinates; we can look up by text as a fallback.
      const url = new URL('https://api.getaddress.io/find/' + encodeURIComponent(label));
      url.searchParams.set('api-key', getAddressKey);
      url.searchParams.set('expand', 'true');
      const upstream = await fetch(url.toString(), { cache: 'no-store' });
      if (upstream.ok) {
        const data = await upstream.json();
        // getAddress returns postcode, addresses[], and lat/lng when expand=true
        const first = Array.isArray(data.addresses) ? data.addresses[0] : null;
        if (first) {
          // first.line_1..line_4, town_or_city, county, postcode, latitude, longitude
          const streetParts = [first.line_1, first.line_2, first.line_3, first.line_4].filter(Boolean);
          return NextResponse.json({
            address: {
              street: streetParts.join(', '),
              city: String(first.town_or_city || ''),
              postcode: String(data.postcode || ''),
              county: first.county || undefined,
              country: 'GB',
            },
            formatted: `${streetParts.join(', ')}, ${first.town_or_city || ''} ${data.postcode || ''}`.trim(),
            coordinates:
              typeof data.latitude === 'number' && typeof data.longitude === 'number'
                ? { lat: data.latitude, lng: data.longitude }
                : coordinates || null,
          });
        }
      }
    }

    const osKey = process.env.OS_PLACES_API_KEY;
    if (osKey && label) {
      // OS Places 'find' returns DPA with ADDRESS and coordinates; reuse that
      const url = new URL('https://api.os.uk/search/places/v1/find');
      url.searchParams.set('query', label);
      url.searchParams.set('key', osKey);
      url.searchParams.set('maxresults', '1');
      url.searchParams.set('output_srs', 'WGS84');
      url.searchParams.set('dataset', 'DPA');
      const upstream = await fetch(url.toString(), { cache: 'no-store' });
      if (upstream.ok) {
        const data = (await upstream.json()) as { results?: Array<{ DPA?: any }> };
        const dpa = data.results?.[0]?.DPA;
        if (dpa) {
          return NextResponse.json({
            address: {
              street: String(dpa.THOROUGHFARE_NAME || ''),
              city: String(dpa.POST_TOWN || ''),
              postcode: String(dpa.POSTCODE || ''),
              county: dpa.DEPENDENT_LOCALITY || dpa.DOUBLE_DEPENDENT_LOCALITY || undefined,
              country: 'GB',
            },
            formatted: String(dpa.ADDRESS || label),
            coordinates:
              typeof dpa.LAT === 'number' && typeof dpa.LNG === 'number'
                ? { lat: dpa.LAT, lng: dpa.LNG }
                : coordinates || null,
          });
        }
      }
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing OS_PLACES_API_KEY and GEOAPIFY_API_KEY' }, { status: 500 });
    }

    // If we already have coordinates, try to reverse geocode to normalize fields
    if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
      const url = new URL('https://api.geoapify.com/v1/geocode/reverse');
      url.searchParams.set('lat', String(coordinates.lat));
      url.searchParams.set('lon', String(coordinates.lng));
      url.searchParams.set('format', 'json');
      url.searchParams.set('apiKey', apiKey);
      const upstream = await fetch(url.toString(), { cache: 'no-store' });
      if (upstream.ok) {
        const data = (await upstream.json()) as { results?: GeoapifyGeocodeResult[] };
        const first = data.results?.[0];
        if (first) {
          return NextResponse.json({
            address: {
              street: [first.housenumber, first.street].filter(Boolean).join(' ').trim(),
              city: first.city || '',
              postcode: first.postcode || '',
              county: first.county || undefined,
              country: (first.country_code || 'gb').toUpperCase(),
            },
            formatted: first.formatted || label || '',
            coordinates: { lat: first.lat ?? coordinates.lat, lng: first.lon ?? coordinates.lng },
          });
        }
      }
      // Fallback with provided label if reverse failed
      return NextResponse.json({
        address: {
          street: '',
          city: '',
          postcode: '',
          country: 'GB',
        },
        formatted: label || '',
        coordinates,
      });
    }

    // If no coordinates given, forward geocode the label
    if (label && label.trim().length > 0) {
      const url = new URL('https://api.geoapify.com/v1/geocode/search');
      url.searchParams.set('text', label);
      url.searchParams.set('filter', 'countrycode:gb');
      url.searchParams.set('format', 'json');
      url.searchParams.set('apiKey', apiKey);
      const upstream = await fetch(url.toString(), { cache: 'no-store' });
      if (!upstream.ok) {
        const msg = await upstream.text();
        return NextResponse.json({ error: 'Address provider error', details: msg }, { status: 502 });
      }
      const data = (await upstream.json()) as { results?: GeoapifyGeocodeResult[] };
      const first = data.results?.[0];
      if (!first) {
        return NextResponse.json({ error: 'Address not found' }, { status: 404 });
      }
      return NextResponse.json({
        address: {
          street: [first.housenumber, first.street].filter(Boolean).join(' ').trim(),
          city: first.city || '',
          postcode: first.postcode || '',
          county: first.county || undefined,
          country: (first.country_code || 'gb').toUpperCase(),
        },
        formatted: first.formatted || label,
        coordinates: { lat: first.lat ?? 0, lng: first.lon ?? 0 },
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Resolve address error:', error);
    return NextResponse.json({ error: 'Failed to resolve address' }, { status: 500 });
  }
}


