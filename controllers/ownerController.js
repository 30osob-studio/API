const { fetchOwner, fetchOwnerReposWithLanguages, fetchOwnerReadme, mapUserData, mapRepoData, mapLanguagesData } = require("../utils/githubApi");

const getOwner = async (req, res) => {
  try {
    const owner = await fetchOwner("30osob-studio");
    const readme = await fetchOwnerReadme("30osob-studio");

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

      return res.json(filteredOwner);
    }

    res.json(ownerWithReadme);
  } catch (error) {
    console.error("Błąd:", error);
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

const getOwnerRepos = async (req, res) => {
  try {
    const repos = await fetchOwnerReposWithLanguages("30osob-studio");

    const { fields, repoFields, languageFields } = req.query;

    let filteredRepos = repos;

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

    res.json(filteredRepos);
  } catch (error) {
    console.error("Błąd:", error);
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

module.exports = { getOwner, getOwnerRepos };
