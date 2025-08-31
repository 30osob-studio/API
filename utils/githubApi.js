const fetch = require("node-fetch");

const headers = {
  "User-Agent": "node.js",
  "Authorization": `token ${process.env.API_TOKEN}`,
};

// Rate limiting and retry configuration
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

let lastRequestTime = 0;

// Rate limiting function
function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  lastRequestTime = now;
  return Promise.resolve();
}

// Retry function with exponential backoff
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i <= retries; i++) {
    try {
      await rateLimit();
      const res = await fetch(url, { headers });

      if (res.status === 403) {
        // Rate limit exceeded
        const retryAfter = res.headers.get('Retry-After') || 60;
        console.log(`Rate limit exceeded. Waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (res.status === 429) {
        // Too many requests
        const retryAfter = res.headers.get('Retry-After') || 60;
        console.log(`Too many requests. Waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Fetch error: ${res.status} - ${res.statusText}`);
      }

      return await res.json();

    } catch (error) {
      if (i === retries) {
        throw error;
      }

      console.log(`Attempt ${i + 1} failed: ${error.message}. Retrying in ${RETRY_DELAY * (i + 1)}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
}

function convertEmptyToNull(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (typeof obj === 'string') {
    return obj.trim() === '' ? null : obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return null;
    }
    return obj.map(item => convertEmptyToNull(item));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const convertedValue = convertEmptyToNull(value);
      if (convertedValue !== null) {
        result[key] = convertedValue;
      }
    }
    return Object.keys(result).length === 0 ? null : result;
  }

  return obj;
}

async function fetchJSON(url) {
  return await fetchWithRetry(url);
}

function mapUserData(user) {
  const userData = {
    avatar_url: user.avatar_url,
    html_url: user.html_url,
    name: user.name,
    company: user.company,
    location: user.location,
    email: user.email,
    bio: user.bio,
    twitter_username: user.twitter_username,
    public_repos: user.public_repos,
    // Dynamiczne pola dla czasu rzeczywistego
    current_timestamp: new Date().toISOString(),
    live_request_time: new Date().toLocaleTimeString(),
    live_request_date: new Date().toLocaleDateString(),
    live_unix_timestamp: Date.now(),
    // Dodatkowe dynamiczne informacje
    live_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    live_locale: Intl.DateTimeFormat().resolvedOptions().locale,
  };

  return convertEmptyToNull(userData);
}

function mapRepoData(repo) {
  const pushedAt = repo.pushed_at ? new Date(repo.pushed_at) : null;
  const updatedAt = repo.updated_at ? new Date(repo.updated_at) : null;

  let lastChange = null;
  let secondsElapsed = null;
  let millisecondsElapsed = null;
  let timeFormatted = null;
  let ageInWords = null;

  if (pushedAt || updatedAt) {
    const mostRecent = pushedAt && updatedAt
      ? (pushedAt > updatedAt ? pushedAt : updatedAt)
      : (pushedAt || updatedAt);

    const now = new Date();
    const diffInMs = now - mostRecent;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Zapisz dokładną liczbę sekund dla dynamicznego wyświetlania
    secondsElapsed = diffInSeconds;
    millisecondsElapsed = diffInMs;

    // Dynamiczny format czasu
    timeFormatted = `${diffInDays.toString().padStart(2, '0')}:${(diffInHours % 24).toString().padStart(2, '0')}:${(diffInMinutes % 60).toString().padStart(2, '0')}:${(diffInSeconds % 60).toString().padStart(2, '0')}`;

    // Dynamiczny opis wieku
    if (diffInDays > 0) {
      ageInWords = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      ageInWords = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      ageInWords = `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      ageInWords = `${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''} ago`;
    }

    if (diffInDays > 0) {
      lastChange = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      lastChange = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      lastChange = `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      lastChange = `${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''} ago`;
    }
  }

  const repoData = {
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    last_change: lastChange,
    // Dynamiczne pola dla czasu rzeczywistego
    live_seconds_elapsed: secondsElapsed,
    live_milliseconds_elapsed: millisecondsElapsed,
    live_time_formatted: timeFormatted,
    live_age_in_words: ageInWords,
    // Aktualny timestamp dla pełnej dynamiki
    current_timestamp: new Date().toISOString(),
    // Dodatkowe dynamiczne pola
    live_request_time: new Date().toLocaleTimeString(),
    live_request_date: new Date().toLocaleDateString(),
    live_unix_timestamp: Date.now(),
    topics: repo.topics,
    homepage: repo.homepage && repo.homepage.trim() !== '' ? repo.homepage : null,
    open_issues_count: repo.open_issues_count,
    default_branch: repo.default_branch,
    license: repo.license,
    size: repo.size,
    contributors: repo.contributors || [],
    repo_image: repo.repo_image || null
  };

  return convertEmptyToNull(repoData);
}


function mapLanguagesData(languages) {
  if (!languages || Object.keys(languages).length === 0) {
    return null;
  }

  const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);

  const result = {};

  Object.entries(languages).forEach(([language, bytes]) => {
    const percentage = ((bytes / totalBytes) * 100).toFixed(1);
    result[language] = parseFloat(percentage);
  });

  return convertEmptyToNull(result);
}

function mapOrganizationData(org) {
  const orgData = {
    avatar_url: org.avatar_url,
    description: org.description,
    name: org.name,
    location: org.location,
    email: org.email,
    twitter_username: org.twitter_username,
    public_repos: org.public_repos,
    html_url: org.html_url,
    // Dynamiczne pola dla czasu rzeczywistego
    current_timestamp: new Date().toISOString(),
    live_request_time: new Date().toLocaleTimeString(),
    live_request_date: new Date().toLocaleDateString(),
    live_unix_timestamp: Date.now(),
    // Dodatkowe dynamiczne informacje
    live_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    live_locale: Intl.DateTimeFormat().resolvedOptions().locale,
  };

  return convertEmptyToNull(orgData);
}

async function fetchOrganization(org) {
  const orgData = await fetchJSON(`https://api.github.com/orgs/${org}`);
  return mapOrganizationData(orgData);
}

async function fetchOrgReposWithLanguages(org) {
  const repos = await fetchJSON(`https://api.github.com/orgs/${org}/repos`);
  const publicRepos = repos.filter(repo => !repo.private && repo.name !== '.github');

  return Promise.all(
    publicRepos.map(async (repo) => {
      const languages = await fetchJSON(`https://api.github.com/repos/${org}/${repo.name}/languages`);
      const readme = await fetchRepoReadme(org, repo.name);
      const contributors = await fetchRepoContributors(org, repo.name);
      const repo_image = extractFirstLineFromReadme(readme);
      return {
        ...mapRepoData({ ...repo, repo_image }),
        languages: mapLanguagesData(languages),
        readme: readme,
        contributors: contributors
      };
    })
  );
}

async function fetchOwner(org) {
  const members = await fetchJSON(`https://api.github.com/orgs/${org}/members?role=admin`);
  if (!members || members.length === 0) {
    throw new Error('No admin members found for organization');
  }

  const ownerLogin = members[0].login;

  const ownerDetails = await fetchJSON(`https://api.github.com/users/${ownerLogin}`);
  return mapUserData(ownerDetails);
}

async function fetchOwnerReposWithLanguages(org) {
  const members = await fetchJSON(`https://api.github.com/orgs/${org}/members?role=admin`);
  if (!members || members.length === 0) {
    throw new Error('No admin members found for organization');
  }

  const ownerLogin = members[0].login;

  const repos = await fetchJSON(`https://api.github.com/users/${ownerLogin}/repos`);
  const publicRepos = repos.filter(repo =>
    !repo.private &&
    repo.name !== '.github' &&
    repo.name !== ownerLogin
  );

  return Promise.all(
    publicRepos.map(async (repo) => {
      const languages = await fetchJSON(`https://api.github.com/repos/${ownerLogin}/${repo.name}/languages`);
      const readme = await fetchRepoReadme(ownerLogin, repo.name);
      const repo_image = extractFirstLineFromReadme(readme);
      return {
        ...mapRepoData({ ...repo, repo_image }),
        languages: mapLanguagesData(languages),
        readme: readme
      };
    })
  );
}

async function fetchOwnerReadme(org) {
  const members = await fetchJSON(`https://api.github.com/orgs/${org}/members?role=admin`);
  if (!members || members.length === 0) {
    throw new Error('No admin members found for organization');
  }

  const ownerLogin = members[0].login;

  try {
    const response = await fetch(`https://raw.githubusercontent.com/${ownerLogin}/${ownerLogin}/refs/heads/main/README.md`);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    return null;
  }
}

async function fetchOrgProfileReadme(org) {
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${org}/.github/refs/heads/main/profile/README.md`);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    return null;
  }
}

async function fetchRepoReadme(org, repoName) {
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${org}/${repoName}/refs/heads/main/README.md`);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    return null;
  }
}

async function fetchRepoContributors(org, repoName) {
  try {
    const contributors = await fetchJSON(`https://api.github.com/repos/${org}/${repoName}/contributors`);

    const contributorsWithDetails = await Promise.all(
      contributors.map(async (contributor) => {
        try {
          const userDetails = await fetchJSON(`https://api.github.com/users/${contributor.login}`);
          return {
            login: contributor.login,
            name: userDetails.name || contributor.login,
            avatar_url: contributor.avatar_url,
            html_url: contributor.html_url
          };
        } catch (error) {
          return {
            login: contributor.login,
            name: contributor.login,
            avatar_url: contributor.avatar_url,
            html_url: contributor.html_url
          };
        }
      })
    );

    return convertEmptyToNull(contributorsWithDetails);
  } catch (error) {
    return null;
  }
}

function extractFirstLineFromReadme(readme) {
  if (!readme) return null;
  const lines = readme.split('\n');
  const firstLine = lines[0].trim();

  const imageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/;
  const match = firstLine.match(imageRegex);

  if (match) {
    return match[1];
  }

  return firstLine || null;
}

module.exports = {
  fetchOrgReposWithLanguages,
  fetchOwner,
  fetchOwnerReposWithLanguages,
  fetchOwnerReadme,
  fetchOrgProfileReadme,
  fetchRepoReadme,
  fetchRepoContributors,
  fetchOrganization,
  mapUserData,
  mapRepoData,
  mapLanguagesData,
  mapOrganizationData,
  extractFirstLineFromReadme,
  convertEmptyToNull,
};