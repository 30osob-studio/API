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
   login: user.login,
    avatar_url: user.avatar_url,
    html_url: user.html_url,
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
  return mapUserData(members[0]);
}

async function fetchOwnerReposWithLanguages(org) {
  const owner = await fetchOwner(org);
  const repos = await fetchJSON(`https://api.github.com/users/${owner.login}/repos`);
  return Promise.all(
    repos.map(async (repo) => {
      const languages = await fetchJSON(`https://api.github.com/repos/${owner.login}/${repo.name}/languages`);
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
