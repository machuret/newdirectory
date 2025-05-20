export default async function handler(request, response) {
  console.log('[JSON-PROXY] Received Request Headers:', JSON.stringify(request.headers, null, 2));
  // Set CORS headers
  // IMPORTANT: For production, update allowedOrigins with your specific frontend domain(s)
  // e.g., https://your-app-name.vercel.app, and for local dev if using `vercel dev` (often http://localhost:5173 or similar)
  const allowedOrigins = [
    'http://127.0.0.1:55728',    // Your local dev server (from previous logs)
    'http://localhost:5173',      // Vite's typical default local dev server port
    'http://localhost:3000',      // Your current React local dev server
    'http://localhost:5176',      // New Vite local dev server port
    'https://newdirectory-three.vercel.app', // Your deployed Vercel frontend
    'https://newdirectory-ec5r8fdaa-gabriel-machurets-projects.vercel.app' // Proxy's own Vercel project URL
  ]; // Add your Vercel app URL here once known
  const origin = request.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Optionally, deny requests from other origins or handle them differently
    // For now, if origin is not in allowedOrigins, it won't get the ACAO header
    // You might want to log or explicitly deny if origin is present but not allowed.
    console.warn(`[JSON-PROXY] Origin ${origin} not in allowedOrigins.`);
  }
  
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Added Authorization for potential future use

  // Handle OPTIONS requests for CORS preflight
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const targetUrl = request.query.url;

  if (!targetUrl) {
    response.status(400).json({ error: 'Missing target URL parameter ("url")' });
    return;
  }

  let decodedTargetUrl;
  try {
    decodedTargetUrl = decodeURIComponent(targetUrl);
    if (!decodedTargetUrl.startsWith('http://') && !decodedTargetUrl.startsWith('https://')) {
      throw new Error('Invalid URL scheme. URL must start with http:// or https://');
    }
  } catch (e) {
    response.status(400).json({ error: 'Invalid or malformed target URL parameter.', details: e.message });
    return;
  }

  try {
    // Prepare headers for the outgoing request if needed (e.g., forwarding an API key)
    // For now, we are not forwarding any specific headers from the client to the target, but this is where you could add them.
    const requestHeaders = {};
    // Example: if you had an Apify token to pass from an environment variable on Vercel:
    // if (decodedTargetUrl.includes('api.apify.com') && process.env.APIFY_TOKEN) {
    //   requestHeaders['Authorization'] = `Bearer ${process.env.APIFY_TOKEN}`;
    // }

    const fetchResponse = await fetch(decodedTargetUrl, { headers: requestHeaders });
    
    if (!fetchResponse.ok) {
      let errorBody = `Failed to fetch from target: ${fetchResponse.status} ${fetchResponse.statusText}`;
      try {
        const externalError = await fetchResponse.json();
        errorBody = (externalError && typeof externalError === 'object' && externalError.message) 
                      ? externalError.message 
                      : (typeof externalError === 'string' ? externalError : JSON.stringify(externalError));
      } catch (e) { /* If error response isn't JSON, stick with the status text */ }
      
      console.error(`[Vercel Function] Error fetching from target URL [${decodedTargetUrl}]: ${fetchResponse.status} ${fetchResponse.statusText}. Body: ${errorBody}`);
      response.status(fetchResponse.status).json({ 
        error: `Failed to fetch from target URL: ${fetchResponse.status} ${fetchResponse.statusText}`,
        details: errorBody 
      });
      return;
    }

    // Pass through relevant headers from the target response to the client if necessary
    // For instance, content-type
    response.setHeader('Content-Type', fetchResponse.headers.get('Content-Type') || 'application/json');
    const data = await fetchResponse.json(); // Assuming the target always returns JSON
    response.status(200).json(data);

  } catch (error) {
    console.error(`[Vercel Function] Error processing proxy request for [${decodedTargetUrl}]:`, error);
    let errorMessage = 'Internal server error in Vercel function proxy.';
    if (error instanceof TypeError && error.message.includes('Only absolute URLs are supported')){
        errorMessage = 'The provided URL was not an absolute URL. Please ensure it starts with http:// or https://.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    response.status(500).json({ error: 'Proxying failed.', details: errorMessage });
  }
}
