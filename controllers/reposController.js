const { convertEmptyToNull } = require("../utils/githubApi");
const dataCache = require("../utils/cache");

const getOrgRepos = async (req, res) => {
  try {
    const { fields, repoFields, languageFields, fresh } = req.query;

    const reposWithLanguages = fresh === 'true'
      ? await dataCache.refreshOrgRepos("30osob-studio")
      : await dataCache.getOrgRepos("30osob-studio");

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

    res.json(convertEmptyToNull(filteredRepos));
  } catch (error) {
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

const refreshOrgRepos = async (req, res) => {
  try {
    const reposWithLanguages = await dataCache.refreshOrgRepos("30osob-studio");

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

    res.json({
      message: "Dane zostały odświeżone",
      timestamp: new Date().toISOString(),
      data: convertEmptyToNull(filteredRepos)
    });
  } catch (error) {
    res.status(500).json({ error: "Wewnętrzny błąd serwera podczas odświeżania" });
  }
};

const getCacheInfo = async (req, res) => {
  try {
    const cacheInfo = dataCache.getCacheInfo();
    res.json({
      cacheInfo,
      cacheTimeout: "disabled",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

const clearCache = async (req, res) => {
  try {
    dataCache.clearCache();
    res.json({
      message: "Cache został wyczyszczony",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

const testCache = async (req, res) => {
  try {
    const cacheInfo = dataCache.getCacheInfo();
    const testData = await dataCache.getOrgRepos("30osob-studio");

    res.json({
      cacheInfo,
      dataLength: testData ? testData.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

module.exports = { getOrgRepos, refreshOrgRepos, getCacheInfo, clearCache, testCache };
