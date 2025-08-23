const { fetchOwner, fetchOwnerReposWithLanguages } = require("../utils/githubApi");

const getOwner = async (req, res) => {
  try {
    const owner = await fetchOwner("30osob-studio");
    res.json(owner);
  } catch (error) {
    console.error("Błąd:", error);
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

const getOwnerRepos = async (req, res) => {
  try {
    const repos = await fetchOwnerReposWithLanguages("30osob-studio");
    res.json(repos);
  } catch (error) {
    console.error("Błąd:", error);
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

module.exports = { getOwner, getOwnerRepos };
