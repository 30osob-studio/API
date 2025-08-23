const { fetchOrgReposWithLanguages } = require("../utils/githubApi");

const getOrgRepos = async (req, res) => {
  try {
    const reposWithLanguages = await fetchOrgReposWithLanguages("30osob-studio");
    res.json(reposWithLanguages);
  } catch (error) {
    console.error("Błąd:", error);
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

module.exports = { getOrgRepos };
