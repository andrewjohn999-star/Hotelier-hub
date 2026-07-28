// Netlify Function: /.netlify/functions/news
//
// Runs a Google search via the official Custom Search JSON API and returns
// the results as headline-style items. This is Google's own API, not
// scraping search results pages (which breaks Google's terms and is not
// something built here).
//
// Setup needed (see README.md):
//   1. Create a Programmable Search Engine at programmablesearchengine.google.com
//      (set it to search the whole web), copy its Search engine ID (cx).
//   2. Enable the "Custom Search API" in Google Cloud Console and create an API key.
//   3. In Netlify: Site configuration > Environment variables, add:
//        GOOGLE_CSE_KEY = your API key
//        GOOGLE_CSE_CX  = your search engine ID
//
// Free tier: 100 searches/day across both panels combined.

exports.handler = async function (event) {
  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  if (!key || !cx) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        error: "GOOGLE_CSE_KEY / GOOGLE_CSE_CX are not set in this site's environment variables yet.",
        articles: []
      })
    };
  }

  const type = (event.queryStringParameters && event.queryStringParameters.type) || "trade";
  const region = (event.queryStringParameters && event.queryStringParameters.region) || "";

  let query;
  if (type === "local" && region) {
    query = `${region} news`;
  } else {
    query = "UK hotel industry news";
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}&num=6&sort=date`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: data.error.message || "Google Search returned an error.", articles: [] })
      };
    }

    const articles = (data.items || []).map(item => ({
      title: item.title,
      source: item.displayLink,
      url: item.link,
      publishedAt: null
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles })
    };
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({ error: "Could not reach Google Search right now.", articles: [] })
    };
  }
};
