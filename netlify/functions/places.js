exports.handler = async (event) => {
  const { input, place_id } = event.queryStringParameters || {};
  const key = process.env.GOOGLE_PLACES_KEY;

  if (!key) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API key not configured' }),
    };
  }

  let url;
  if (place_id) {
    url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=address_components&key=${key}`;
  } else if (input) {
    url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:us&types=address&key=${key}`;
  } else {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing input or place_id parameter' }),
    };
  }

  const response = await fetch(url);
  const data = await response.json();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};
