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
  return {
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    topics: repo.topics,
    homepage: repo.homepage,
    open_issues_count: repo.open_issues_count,
    default_branch: repo.default_branch,
    license: repo.license,
  };
}


function mapLanguagesData(languages) {
  return languages;
}

async function fetchOrgReposWithLanguages(org) {
  const repos = await fetchJSON(`https://api.github.com/orgs/${org}/repos`);
  return Promise.all(
    repos.map(async (repo) => {
      const languages = await fetchJSON(`https://api.github.com/repos/${org}/${repo.name}/languages`);
      return {
        ...mapRepoData(repo),
        languages: mapLanguagesData(languages)
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
      return {
        ...mapRepoData(repo),
        languages: mapLanguagesData(languages)
      };
    })
  );
}

module.exports = {
  fetchOrgReposWithLanguages,
  fetchOwner,
  fetchOwnerReposWithLanguages,
  mapUserData,
  mapRepoData,
  mapLanguagesData,
};
