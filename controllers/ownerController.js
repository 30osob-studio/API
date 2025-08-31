const { convertEmptyToNull } = require("../utils/githubApi");
const dataCache = require("../utils/cache");

const getOwner = async (req, res) => {
  try {
    const owner = await dataCache.getOwner("30osob-studio");
    const readme = await dataCache.getOwnerReadme("30osob-studio");

    const ownerWithReadme = {
      ...owner,
      readme: readme
    };

    const { fields } = req.query;

    if (fields) {
      const fieldList = fields.split(',').map(field => field.trim());
      const filteredOwner = {};

      fieldList.forEach(field => {
        if (ownerWithReadme.hasOwnProperty(field)) {
          filteredOwner[field] = ownerWithReadme[field];
        }
      });

      return res.json(convertEmptyToNull(filteredOwner));
    }

    res.json(convertEmptyToNull(ownerWithReadme));
  } catch (error) {
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

const getOwnerRepos = async (req, res) => {
  try {
    const repos = await dataCache.getOwnerRepos("30osob-studio");

    const { fields, repoFields, languageFields } = req.query;

    let filteredRepos = repos.filter(repo =>
      repo.topics && Array.isArray(repo.topics) && repo.topics.length > 0
    );

    if (repoFields) {
      const repoFieldList = repoFields.split(',').map(field => field.trim());
      filteredRepos = repos.map(repo => {
        const filteredRepo = {};
        repoFieldList.forEach(field => {
          if (field !== 'languages' && field !== 'readme' && field !== 'repo_image' && repo.hasOwnProperty(field)) {
            filteredRepo[field] = repo[field];
          }
        });

        if (repoFieldList.includes('languages')) {
          if (languageFields) {
            const languageFieldList = languageFields.split(',').map(field => field.trim());
            const filteredLanguages = {};
            languageFieldList.forEach(field => {
              if (repo.languages && repo.languages.hasOwnProperty(field)) {
                filteredLanguages[field] = repo.languages[field];
              }
            });
            filteredRepo.languages = filteredLanguages;
          } else {
            filteredRepo.languages = repo.languages;
          }
        }

        if (repoFieldList.includes('readme')) {
          filteredRepo.readme = repo.readme;
        }

        if (repoFieldList.includes('repo_image')) {
          filteredRepo.repo_image = repo.repo_image;
        }

        return filteredRepo;
      });
    }

    if (fields && !repoFields) {
      const fieldList = fields.split(',').map(field => field.trim());
      filteredRepos = repos.map(repo => {
        const filteredRepo = {};
        fieldList.forEach(field => {
          if (repo.hasOwnProperty(field)) {
            filteredRepo[field] = repo[field];
          }
        });
        return filteredRepo;
      });
    }

    res.json(convertEmptyToNull(filteredRepos));
  } catch (error) {
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

module.exports = { getOwner, getOwnerRepos };
