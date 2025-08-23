const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/repos", async (req, res) => {
  try {
    const response = await fetch("https://api.github.com/orgs/30osob-studio/repos", {
      headers: { "User-Agent": "node.js" }
    });

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
