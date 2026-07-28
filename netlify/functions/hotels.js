// Netlify Function: /.netlify/functions/hotels
//
// Looks up real hotels near a UK postcode using two free, keyless services:
//   1. postcodes.io      -> turns the postcode into latitude/longitude
//   2. Overpass API (OSM) -> finds tourism=hotel / guest_house points nearby
//
// No API key or billing account needed for either service.
// Room rates are NOT available here (see README) -- that still needs a
// Booking.com/Expedia partner integration.

exports.handler = async function (event) {
  const postcode = (event.queryStringParameters && event.queryStringParameters.postcode || "").trim();

  if (!postcode) {
    return { statusCode: 200, body: JSON.stringify({ error: "No postcode supplied.", hotels: [] }) };
  }

  try {
    // Step 1: geocode the postcode
    const geoRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    const geoData = await geoRes.json();

    if (geoData.status !== 200 || !geoData.result) {
      return { statusCode: 200, body: JSON.stringify({ error: "Postcode not recognised.", hotels: [] }) };
    }

    const { latitude, longitude } = geoData.result;

    // Step 2: find nearby hotels via Overpass (OpenStreetMap)
    // Try a couple of mirrors in case the primary is overloaded or rate-limited,
    // which the public Overpass service is prone to at busy times.
    const radiusMeters = 8000;
    const query = `
      [out:json][timeout:15];
      (
        node["tourism"~"^(hotel|guest_house)$"](around:${radiusMeters},${latitude},${longitude});
        way["tourism"~"^(hotel|guest_house)$"](around:${radiusMeters},${latitude},${longitude});
      );
      out center 20;
    `;

    const mirrors = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.private.coffee/api/interpreter"
    ];

    let overpassData = null;
    let lastError = null;

    for (const mirror of mirrors) {
      try {
        const overpassRes = await fetch(mirror, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "User-Agent": "HotelierHub/1.0 (Netlify Function; hotel lookup for a UK hotelier dashboard)"
          },
          body: query
        });
        if (overpassRes.ok) {
          overpassData = await overpassRes.json();
          break;
        } else {
          const bodyText = await overpassRes.text().catch(() => "");
          lastError = `${mirror} returned ${overpassRes.status}${bodyText ? ": " + bodyText.slice(0, 150) : ""}`;
        }
      } catch (e) {
        lastError = `${mirror} failed: ${e.message}`;
      }
    }

    if (!overpassData) {
      return { statusCode: 200, body: JSON.stringify({ error: "Hotel lookup failed. Details: " + (lastError || "unknown"), hotels: [] }) };
    }

    function haversine(lat1, lon1, lat2, lon2){
      const R = 6371;
      const dLat = (lat2-lat1) * Math.PI/180;
      const dLon = (lon2-lon1) * Math.PI/180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    const hotels = (overpassData.elements || [])
      .map(el => {
        const name = el.tags && el.tags.name;
        if (!name) return null;
        const lat = el.lat || (el.center && el.center.lat);
        const lon = el.lon || (el.center && el.center.lon);
        if (lat == null || lon == null) return null;
        const distKm = haversine(latitude, longitude, lat, lon);
        return {
          name,
          distanceMiles: Math.round(distKm * 0.621371 * 10) / 10,
          address: [el.tags["addr:housenumber"], el.tags["addr:street"], el.tags["addr:city"]].filter(Boolean).join(" ") || null
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceMiles - b.distanceMiles)
      .slice(0, 10);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotels })
    };

  } catch (err) {
    return { statusCode: 200, body: JSON.stringify({ error: "Could not look up hotels right now.", hotels: [] }) };
  }
};
