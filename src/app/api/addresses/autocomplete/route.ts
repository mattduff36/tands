import { NextRequest, NextResponse } from 'next/server';

// UK address autocomplete proxy.
// Prefer getAddress.io (PAF-backed, free tier) when GETADDRESS_API_KEY is set.
// Else prefer Ordnance Survey Places when OS_PLACES_API_KEY is set.
// Fallback to Geoapify when neither key is available.

export const runtime = 'nodejs';

interface GeoapifyResult {
  place_id: string | number;
  formatted: string;
  country_code?: string;
  lat?: number;
  lon?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '8', 10), 15);

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const getAddressKey = process.env.GETADDRESS_API_KEY;
    if (getAddressKey) {
      // getAddress.io Autocomplete
      // Docs: https://getaddress.io/autocomplete
      const url = new URL(`https://api.getaddress.io/autocomplete/${encodeURIComponent(query)}`);
      url.searchParams.set('api-key', getAddressKey);
      url.searchParams.set('top', String(limit));

      const upstream = await fetch(url.toString(), { cache: 'no-store' });
      if (!upstream.ok) {
        const text = await upstream.text();
        return NextResponse.json({ error: 'getAddress.io error', details: text }, { status: 502 });
      }
      const data = (await upstream.json()) as { suggestions?: Array<{ id: string; address: string }> };
      const suggestions = (data.suggestions || []).map((s) => ({
        id: s.id,
        label: s.address,
        coordinates: null,
      }));
      return NextResponse.json({ suggestions });
    }

    const osKey = process.env.OS_PLACES_API_KEY;
    if (osKey) {
      const url = new URL('https://api.os.uk/search/places/v1/find');
      url.searchParams.set('query', query);
      url.searchParams.set('key', osKey);
      url.searchParams.set('maxresults', String(limit));
      url.searchParams.set('output_srs', 'WGS84');
      url.searchParams.set('dataset', 'DPA');

      const upstream = await fetch(url.toString(), { cache: 'no-store' });
      if (!upstream.ok) {
        const text = await upstream.text();
        return NextResponse.json({ error: 'OS Places error', details: text }, { status: 502 });
      }
      const data = (await upstream.json()) as { results?: Array<{ DPA?: any }> };
      const suggestions = (data.results || [])
        .map((item) => item.DPA)
        .filter(Boolean)
        .map((dpa) => ({
          id: String(dpa.UPRN || dpa.BUILDING_NUMBER || dpa.ADDRESS),
          label: String(dpa.ADDRESS || ''),
          coordinates:
            typeof dpa.LAT === 'number' && typeof dpa.LNG === 'number'
              ? { lat: dpa.LAT, lng: dpa.LNG }
              : null,
        }));
      return NextResponse.json({ suggestions });
    }

    // Fallback to Geoapify if OS key not present
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing OS_PLACES_API_KEY and GEOAPIFY_API_KEY' }, { status: 500 });
    }

    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text', query);
    url.searchParams.set('filter', 'countrycode:gb');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('format', 'json');
    url.searchParams.set('bias', 'proximity:-1.0681,53.2004');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('apiKey', apiKey);

    const upstream = await fetch(url.toString(), { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json({ error: 'Address provider error', details: text }, { status: 502 });
    }

    const raw = await upstream.json();
    const results: Array<any> = Array.isArray(raw?.results)
      ? raw.results
      : Array.isArray(raw?.features)
        ? raw.features.map((f: any) => ({
            place_id: f?.properties?.place_id ?? f?.properties?.datasource?.raw?.osm_id ?? f?.properties?.osm_id ?? `${f?.properties?.place_id ?? ''}-${f?.properties?.osm_id ?? ''}`,
            formatted: f?.properties?.formatted ?? f?.properties?.address_line2 ?? f?.properties?.address_line1 ?? '',
            country_code: f?.properties?.country_code,
            lat: f?.properties?.lat ?? f?.geometry?.coordinates?.[1],
            lon: f?.properties?.lon ?? f?.geometry?.coordinates?.[0],
          }))
        : [];
    const suggestions = results
      .filter((r: any) => ((r.country_code || 'gb') as string).toLowerCase() === 'gb')
      .map((r: any) => ({
        id: String(r.place_id ?? r.formatted ?? `${r.lat},${r.lon}`),
        label: r.formatted,
        coordinates: r.lat != null && r.lon != null ? { lat: Number(r.lat), lng: Number(r.lon) } : null,
      }));
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json({ error: 'Failed to fetch address suggestions' }, { status: 500 });
  }
}


