import adapter from '@sveltejs/adapter-static'

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    // ponytail: fallback makes this a SPA — all routes served from index.html offline
    adapter: adapter({ fallback: 'index.html' })
  }
}
