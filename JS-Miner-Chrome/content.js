function analyzeScriptsOnPage() {
    return new Promise((resolve, reject) => {
      const scripts = document.getElementsByTagName('script');
      let results = [];
      let fetchPromises = [];
      const urlRegex = /https?:\/\/[^\s'"]+/gi;
      const tokenRegex = /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
      const apiRegex = /\b(GET|POST|PUT|DELETE|PATCH)\s+(https?:\/\/[^\s'"]+)/gi;
      const ajaxRegex = /\$.ajax\({\s*method:\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`],\s*.*url:\s*['"`]([^'"`]+)['"`]/gi;
      const fetchRegex = /fetch\(['"`]([^'"`]+)['"`],\s*{\s*method:\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]/gi;
      const cookieRegex = /document\.cookie\s*=\s*(['"`])([^'";]+)\1/g;
      const storageRegex = /\b(localStorage|sessionStorage)\.setItem\s*\(\s*['"`]([^'"]+)['"`]\s*,\s*['"`]([^'"]+)['"`]\s*\)/gi;
      const headerRegex = /setRequestHeader\s*\(\s*['"`]([^'"]+)['"`]\s*,\s*['"`]([^'"]+)['"`]\s*\)/gi;
      const filePathRegex = /['"`]([^'"`]+\.(js|jsx|ts|tsx|scss|css|html|htm))['"`]/gi;
  
      console.log('Analyzing scripts on page:', scripts.length);
  
      for (let script of scripts) {
        if (script.src) {
          console.log('Fetching script:', script.src);
          fetchPromises.push(
            fetch(script.src)
              .then((response) => response.text())
              .then((data) => {
                console.log('Fetched data from:', script.src);
                console.log('Script content:', data);
  
                let match;
                const scriptResults = {
                  script: script.src,
                  urls: new Set(),
                  tokens: new Set(),
                  requests: new Set(),
                  cookies: new Set(),
                  storage: new Set(),
                  headers: new Set(),
                  files: new Set()
                };
  
                while ((match = urlRegex.exec(data))) {
                  console.log('URL found:', match[0]);
                  scriptResults.urls.add(match[0]);
                }
                while ((match = tokenRegex.exec(data))) {
                  console.log('Token found:', match[0]);
                  scriptResults.tokens.add(match[0]);
                }
                while ((match = apiRegex.exec(data))) {
                  console.log('API Endpoint found:', match[0]);
                  scriptResults.requests.add(`${match[1]}: ${match[2]}`);
                }
                while ((match = ajaxRegex.exec(data))) {
                  console.log('AJAX API Endpoint found:', match[2]);
                  scriptResults.requests.add(`${match[1]}: ${match[2]}`);
                }
                while ((match = fetchRegex.exec(data))) {
                  console.log('Fetch API Endpoint found:', match[1]);
                  scriptResults.requests.add(`${match[2]}: ${match[1]}`);
                }
                while ((match = cookieRegex.exec(data))) {
                  console.log('Cookie creation detected:', match[2]);
                  scriptResults.cookies.add(match[2]);
                }
                while ((match = storageRegex.exec(data))) {
                  console.log('Storage usage detected:', `Key: ${match[2]}, Value: ${match[3]}`);
                  scriptResults.storage.add(`Key: ${match[2]}, Value: ${match[3]}`);
                }
                while ((match = headerRegex.exec(data))) {
                  console.log('Header setting detected:', `Header: ${match[1]}, Value: ${match[2]}`);
                  scriptResults.headers.add(`Header: ${match[1]}, Value: ${match[2]}`);
                }
                while ((match = filePathRegex.exec(data))) {
                  console.log('File path detected:', match[1]);
                  scriptResults.files.add(match[1]);
                }
  
                results.push({
                  script: scriptResults.script,
                  urls: Array.from(scriptResults.urls),
                  tokens: Array.from(scriptResults.tokens),
                  requests: Array.from(scriptResults.requests),
                  cookies: Array.from(scriptResults.cookies),
                  storage: Array.from(scriptResults.storage),
                  headers: Array.from(scriptResults.headers),
                  files: Array.from(scriptResults.files)
                });
              })
              .catch((error) => console.error(`Error fetching script: ${script.src}`, error))
          );
        }
      }
  
      Promise.all(fetchPromises)
        .then(() => {
          console.log('All fetches completed. Results:', results);
          resolve(results);
        })
        .catch((error) => {
          console.error('Error during fetch:', error);
          reject(error);
        });
    });
  }
  
  (async function() {
    console.log('Content script loaded');
    const results = await analyzeScriptsOnPage();
    console.log('Scan results:', results);
    return results;
  })();
  