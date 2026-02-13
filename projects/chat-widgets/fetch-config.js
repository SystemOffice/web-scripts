const DEFAULT_CONFIG = {
  zoom: { enabled: false },
  anthology: { enabled: false },
  chatbot: { enabled: false }
};

export async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.ok) {
      return await response.json();
    }
  } finally {
    clearTimeout(timer);
  }

  return null;
}

export async function loadClientConfig(windowRef, configServiceUrl, timeoutMs) {
  if (windowRef.CHAT_WIDGET_CONFIG) {
    return windowRef.CHAT_WIDGET_CONFIG;
  }

  try {
    const domain = windowRef.location.hostname;
    const config = await fetchWithTimeout(`${configServiceUrl}/config/${domain}`, timeoutMs);
    if (config) return config;
  } catch (error) {
    console.warn('Could not load client config, using defaults');
  }

  return DEFAULT_CONFIG;
}
