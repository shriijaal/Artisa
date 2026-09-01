const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
};

export default authFetch;
