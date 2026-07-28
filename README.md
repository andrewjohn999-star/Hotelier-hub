# Hotelier Hub

## What's real vs. placeholder now

| Feature | Status |
|---|---|
| Nearby Hotels | **Real.** Sourced live from OpenStreetMap via a free, keyless lookup (postcodes.io + Overpass API). DN22 7XG should now show The West Retford Hotel, Ye Olde Bell, etc. |
| Room rates | Still not available — no free source exists; would need a Booking.com/Expedia partner integration |
| Reviews | Still placeholder — the *hotel name* shown is real, but the review text itself is sample data (Google/Tripadvisor/Booking.com reviews need their own API approvals) |
| UK Hotel Trade News / Local News | **Wired to Google Search** (Custom Search JSON API), needs your API key set up (below) |
| Dish/Drink of the day, Today for the Team | Real, seasonal, from `data/*.json`, changes daily |
| Dark/Light/Ocean/Sunset themes | Working, saved per-device, dark is default |
| Hamburger menu (Home / About / Privacy) | Working |
| Hotel picker + "remember my hotel" | Working, saved in a cookie for a year |
| Cookie consent banner | Working — see the Privacy Policy page for what it covers |

## Why not just scrape Google for news?

Worth restating clearly since it came up: querying Google's search results
pages directly (rather than their API) breaks Google's terms of service and
breaks in production whenever they tweak their HTML — not something built
here. What **is** built here is Google's own **Custom Search JSON API**,
which really does return Google search results, legitimately, via API.

## Setting up real news (one-time)

This needs a **Git-connected Netlify site**, not drag-and-drop — Netlify Drop
only publishes static files and can't run serverless functions (the hotel
lookup, which is already working, also needs this).

1. Push this folder to a new GitHub repo, connect it in Netlify
   (**Add new site > Import an existing project**)
2. Go to [programmablesearchengine.google.com](https://programmablesearchengine.google.com),
   create a search engine set to **search the entire web**, copy its
   **Search engine ID** (this is your `cx` value)
3. In [Google Cloud Console](https://console.cloud.google.com), enable the
   **Custom Search API** and create an API key
4. In Netlify: **Site configuration > Environment variables**, add:
   - `GOOGLE_CSE_KEY` = your API key
   - `GOOGLE_CSE_CX` = your search engine ID
5. Deploy

Free tier is 100 searches/day combined across both news panels — worth
knowing if you get heavy traffic. Google may ask you to attach a billing
method to the Cloud project even to use the free tier; you shouldn't be
charged as long as you stay under the daily quota, but flagging it so it's
not a surprise.

The hotel lookup (`netlify/functions/hotels.js`) needs **no key at all** —
it's already live once you're on a Git-connected deploy.

## Legal pages

`about.html` and `privacy.html` are included and linked from the menu. The
privacy policy is a genuine starting draft that accurately describes what the
site currently stores (a cookie for your selected hotel, a cookie for cookie
consent itself, and local storage for theme preference — nothing else right
now). It has two placeholders to fill in (`[add date]`, `[add contact email]`)
and a clear note that it needs a solicitor's review before you rely on it,
especially once real guest data, staff logins, or analytics get added.

## Next steps

Want more variety in the dish/drink/tip pools, real Google/Tripadvisor
reviews wired in, or help with the GitHub → Netlify connection? Just say
which one.
