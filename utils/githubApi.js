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

async function fetchOrgReposWithLanguages(org) {
  const repos = await fetchJSON(`https://api.github.com/orgs/${org}/repos`);
  return Promise.all(
    repos.map(async (repo) => {
      const languages = await fetchJSON(`https://api.github.com/repos/${org}/${repo.name}/languages`);
      return { ...repo, languages };
    })
  );
}

async function fetchOwner(org) {
  const members = await fetchJSON(`https://api.github.com/orgs/${org}/members?role=admin`);
  return members[0];
}

async function fetchOwnerReposWithLanguages(org) {
  const owner = await fetchOwner(org);
  const repos = await fetchJSON(`https://api.github.com/users/${owner.login}/repos`);
  return Promise.all(
    repos.map(async (repo) => {
      const languages = await fetchJSON(`https://api.github.com/repos/${owner.login}/${repo.name}/languages`);
      return { ...repo, languages };
    })
  );
}

module.exports = {
  fetchOrgReposWithLanguages,
  fetchOwner,
  fetchOwnerReposWithLanguages,
};
