require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/repos", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.github.com/orgs/30osob-studio/repos",
      {
        headers: {
          "User-Agent": "node.js",
          "Authorization": `token ${process.env.API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Błąd pobierania danych z GitHuba" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Błąd:", error);
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
});

app.get("/owner", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.github.com/orgs/30osob-studio/members?role=admin",
      {
        headers: {
          "User-Agent": "node.js",
          "Authorization": `token ${process.env.API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Błąd pobierania właściciela" });
    }

    const data = await response.json();
    res.json(data[0]);
  } catch (error) {
    console.error("Błąd:", error);
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
});

app.get("/owner/repos", async (req, res) => {
  try {
    const ownerResponse = await fetch(
      "https://api.github.com/orgs/30osob-studio/members?role=admin",
      {
        headers: {
          "User-Agent": "node.js",
          "Authorization": `token ${process.env.API_TOKEN}`,
        },
      }
    );

    if (!ownerResponse.ok) {
      return res.status(ownerResponse.status).json({ error: "Błąd pobierania właściciela" });
    }

    const ownerData = await ownerResponse.json();
    const ownerLogin = ownerData[0].login;

    const reposResponse = await fetch(
      `https://api.github.com/users/${ownerLogin}/repos`,
      {
        headers: {
          "User-Agent": "node.js",
          "Authorization": `token ${process.env.API_TOKEN}`,
        },
      }
    );

    if (!reposResponse.ok) {
      return res.status(reposResponse.status).json({ error: "Błąd pobierania repozytoriów" });
    }

    const repos = await reposResponse.json();
    res.json(repos);
  } catch (error) {
    console.error("Błąd:", error);
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});