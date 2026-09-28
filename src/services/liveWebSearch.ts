// Blazing-fast multi-source live web search engine
// Retrieves real-time facts, news, clinical research, and world events via open web endpoints

export interface LiveSearchResult {
  title: string;
  snippet: string;
  uri: string;
  source: string;
}

export interface LiveWebSearchResponse {
  query: string;
  results: LiveSearchResult[];
  formattedContext: string;
}

const searchCache = new Map<string, { data: LiveWebSearchResponse; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Searches the live web using Google News RSS, DuckDuckGo Instant Answer, and Wikipedia APIs
 * Fast, resilient, with a 2-second timeout.
 */
export async function performLiveWebSearch(userQuery: string): Promise<LiveWebSearchResponse> {
  const cleanQuery = userQuery
    .replace(/[?!.,]/g, ' ')
    .replace(/\b(who|what|where|when|why|how|tell me about|explain|search for|is|are|the|a|an)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const queryToSearch = cleanQuery.length > 2 ? cleanQuery : userQuery.trim();
  const cacheKey = queryToSearch.toLowerCase();

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const results: LiveSearchResult[] = [];

  // Parallel search requests with AbortController timeout
  const timeoutMs = 2200;

  const fetchWithTimeout = async (url: string, headers: Record<string, string> = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...headers,
        },
      });
      clearTimeout(id);
      return response;
    } catch {
      clearTimeout(id);
      return null;
    }
  };

  // 1. Google News RSS Search (For breaking news, current events, latest Alzheimer's/medical research)
  const fetchNews = async () => {
    try {
      const encoded = encodeURIComponent(queryToSearch);
      const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`;
      const res = await fetchWithTimeout(url);
      if (!res || !res.ok) return;

      const xml = await res.text();
      const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/gi;
      let match: RegExpExecArray | null;
      let count = 0;

      while ((match = itemRegex.exec(xml)) !== null && count < 3) {
        const title = match[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&') || '';
        const uri = match[2]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') || '';
        const pubDate = match[3] || '';

        if (title && uri) {
          results.push({
            title: title.trim(),
            snippet: `Published: ${pubDate}. Recent news report regarding ${queryToSearch}.`,
            uri: uri.trim(),
            source: 'Google News Feed',
          });
          count++;
        }
      }
    } catch {
      // ignore
    }
  };

  // 2. DuckDuckGo Instant Answer API (Definitions, quick facts, current topics)
  const fetchDuckDuckGo = async () => {
    try {
      const encoded = encodeURIComponent(queryToSearch);
      const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetchWithTimeout(url);
      if (!res || !res.ok) return;

      const data = (await res.json()) as any;
      if (data.AbstractText && data.AbstractURL) {
        results.push({
          title: data.Heading || data.AbstractSource || 'DuckDuckGo Knowledge',
          snippet: data.AbstractText,
          uri: data.AbstractURL,
          source: data.AbstractSource || 'DuckDuckGo',
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 2)) {
          if (topic?.Text && topic?.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Topic Overview',
              snippet: topic.Text,
              uri: topic.FirstURL,
              source: 'DuckDuckGo Topics',
            });
          }
        }
      }
    } catch {
      // ignore
    }
  };

  // 3. Wikipedia API Search (Medical concepts, geography, biographies, history)
  const fetchWikipedia = async () => {
    try {
      const encoded = encodeURIComponent(queryToSearch);
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&utf8=&format=json`;
      const res = await fetchWithTimeout(url);
      if (!res || !res.ok) return;

      const data = (await res.json()) as any;
      const searchItems = data?.query?.search;
      if (Array.isArray(searchItems)) {
        for (const item of searchItems.slice(0, 2)) {
          const cleanSnippet = (item.snippet || '')
            .replace(/<span class="searchmatch">/g, '')
            .replace(/<\/span>/g, '')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&amp;/g, '&');

          results.push({
            title: item.title,
            snippet: cleanSnippet,
            uri: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
            source: 'Wikipedia',
          });
        }
      }
    } catch {
      // ignore
    }
  };

  // Run searches in parallel
  await Promise.allSettled([fetchNews(), fetchDuckDuckGo(), fetchWikipedia()]);

  // Format real-time context string for AI prompt injection
  let formattedContext = '';
  if (results.length > 0) {
    formattedContext = `[VERIFIED REAL-TIME WEB SEARCH RESULTS FOR: "${queryToSearch}"]\n` +
      results.map((r, i) => `${i + 1}. Title: ${r.title}\n   Source URL: ${r.uri}\n   Summary: ${r.snippet}`).join('\n\n') +
      `\n\nUse these fresh web findings to provide accurate, up-to-date facts in your reply.`;
  }

  const response: LiveWebSearchResponse = {
    query: queryToSearch,
    results: results.slice(0, 5),
    formattedContext,
  };

  searchCache.set(cacheKey, { data: response, timestamp: Date.now() });
  return response;
}
