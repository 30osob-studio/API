const fetch = require("node-fetch");

const headers = {
  "User-Agent": "node.js",
  "Authorization": `token ${process.env.API_TOKEN}`,
};

async function fetchJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
  return res.json();
}

function mapUserData(user) {
  return {
    avatar_url: user.avatar_url,
    html_url: user.html_url,
    name: user.name,
    company: user.company,
    location: user.location,
    email: user.email,
    bio: user.bio,
    twitter_username: user.twitter_username,
    public_repos: user.public_repos,
  };
}

function mapRepoData(repo) {
  const pushedAt = repo.pushed_at ? new Date(repo.pushed_at) : null;
  const updatedAt = repo.updated_at ? new Date(repo.updated_at) : null;

  let lastChange = null;
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

  return {
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    last_change: lastChange,
    topics: repo.topics,
    homepage: repo.homepage && repo.homepage.trim() !== '' ? repo.homepage : null,
    open_issues_count: repo.open_issues_count,
    default_branch: repo.default_branch,
    license: repo.license,
    contributors: repo.contributors || [],
    repo_image: repo.repo_image || null
  };
}


function mapLanguagesData(languages) {
  return languages;
}

function mapOrganizationData(org) {
  return {
    avatar_url: org.avatar_url,
    description: org.description,
    name: org.name,
    location: org.location,
    email: org.email,
    twitter_username: org.twitter_username,
    public_repos: org.public_repos,
    html_url: org.html_url,
  };
}

async function fetchOrganization(org) {
  const orgData = await fetchJSON(`https://api.github.com/orgs/${org}`);
  return mapOrganizationData(orgData);
}

async function fetchOrgReposWithLanguages(org) {
  const repos = await fetchJSON(`https://api.github.com/orgs/${org}/repos`);
  return Promise.all(
    repos.map(async (repo) => {
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
  return Promise.all(
    repos.map(async (repo) => {
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
    return contributors.map(contributor => ({
      login: contributor.login,
      avatar_url: contributor.avatar_url,
      html_url: contributor.html_url
    }));
  } catch (error) {
    console.error(`Error fetching contributors for ${org}/${repoName}:`, error);
    return [];
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
};
