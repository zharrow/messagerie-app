/**
 * HTTP client wrapper for inter-service communication
 * Automatically includes internal secret header
 */

const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

/**
 * Make an internal service request
 * @param {string} url - Full URL to call
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': INTERNAL_SECRET,
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * GET request
 */
async function get(url, options = {}) {
  return request(url, { ...options, method: 'GET' });
}

/**
 * POST request
 */
async function post(url, body, options = {}) {
  return request(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * PUT request
 */
async function put(url, body, options = {}) {
  return request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

/**
 * DELETE request
 */
async function del(url, options = {}) {
  return request(url, { ...options, method: 'DELETE' });
}

module.exports = {
  request,
  get,
  post,
  put,
  del
};