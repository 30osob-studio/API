const { fetchOrgReposWithLanguages, mapRepoData, mapLanguagesData } = require("../utils/githubApi");

const getOrgRepos = async (req, res) => {
  try {
    const reposWithLanguages = await fetchOrgReposWithLanguages("30osob-studio");

    const { fields, repoFields, languageFields } = req.query;

    let filteredRepos = reposWithLanguages.filter(repo =>
      repo.topics && Array.isArray(repo.topics) && repo.topics.length > 0
    );

    if (repoFields) {
      const repoFieldList = repoFields.split(',').map(field => field.trim());
      filteredRepos = reposWithLanguages.map(repo => {
        const filteredRepo = {};
        repoFieldList.forEach(field => {
          if (field !== 'languages' && field !== 'readme' && field !== 'contributors' && field !== 'repo_image' && repo.hasOwnProperty(field)) {
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

        if (repoFieldList.includes('contributors')) {
          filteredRepo.contributors = repo.contributors;
        }

        if (repoFieldList.includes('repo_image')) {
          filteredRepo.repo_image = repo.repo_image;
        }

        return filteredRepo;
      });
    }

    if (fields && !repoFields) {
      const fieldList = fields.split(',').map(field => field.trim());
      filteredRepos = reposWithLanguages.map(repo => {
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

module.exports = { getOrgRepos };
