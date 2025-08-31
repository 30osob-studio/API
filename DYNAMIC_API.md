# Dynamiczne API - Dokumentacja

## Przegląd

API zostało rozszerzone o system dynamicznego odświeżania danych, który zapewnia:

1. **Automatyczne odświeżanie** - dane są odświeżane co 30 sekund
2. **Inteligentny cache** - dane są cachowane na 30 sekund dla optymalizacji
3. **Wymuszone odświeżanie** - możliwość wymuszenia odświeżenia danych
4. **Zarządzanie cache** - możliwość sprawdzenia i czyszczenia cache
5. **Rate limiting** - automatyczne zarządzanie limitami GitHub API

## Nowe Endpointy

### 1. Wymuszenie odświeżenia danych

**POST** `/repos/refresh`

Wymusza odświeżenie danych z GitHub API i zwraca świeże dane.

**Parametry query (opcjonalne):**
- `fields` - lista pól do zwrócenia
- `repoFields` - lista pól repozytoriów
- `languageFields` - lista pól języków

**Przykład:**
```bash
POST /repos/refresh?fields=name,last_change,topics
```

### 2. Informacje o cache

**GET** `/repos/cache/info`

Zwraca informacje o stanie cache.

**Przykład:**
```bash
GET /repos/cache/info
```

**Odpowiedź:**
```json
{
  "cacheInfo": {
    "orgRepos_30osob-studio": {
      "age": "15s",
      "isStale": false,
      "lastRefresh": "2024-01-15T10:30:00.000Z"
    }
  },
  "cacheTimeout": "30s",
  "timestamp": "2024-01-15T10:32:00.000Z"
}
```

### 3. Czyszczenie cache

**DELETE** `/repos/cache`

Czyści cały cache.

**Przykład:**
```bash
DELETE /repos/cache
```

### 4. Parametr fresh

**GET** `/repos?fresh=true`

Wymusza odświeżenie danych podczas pobierania.

**Przykład:**
```bash
GET /repos?fresh=true&fields=name,last_change
```

## Automatyczne Odświeżanie

### 1. Uruchomienie automatycznego odświeżania

**POST** `/auto-refresh/start`

**Body:**
```json
{
  "org": "30osob-studio",
  "interval": 30
}
```

- `org` - nazwa organizacji (opcjonalne, domyślnie "30osob-studio")
- `interval` - interwał w sekundach (opcjonalne, domyślnie 30)

### 2. Zatrzymanie automatycznego odświeżania

**DELETE** `/auto-refresh/stop/:org`

**Przykład:**
```bash
DELETE /auto-refresh/stop/30osob-studio
```

### 3. Zatrzymanie wszystkich automatycznych odświeżeń

**DELETE** `/auto-refresh/stop-all`

### 4. Zmiana interwału

**PUT** `/auto-refresh/interval/:org`

**Body:**
```json
{
  "interval": 60
}
```

### 5. Status automatycznego odświeżania

**GET** `/auto-refresh/status`

## Strony demonstracyjne

### 1. Strona z auto-refresh co sekundę
**URL**: `/live`
- Automatyczne odświeżanie co sekundę przez JavaScript
- Licznik odświeżeń i czas połączenia
- Kontrola auto-refresh

### 2. Strona SSE (Server-Sent Events)
**URL**: `/sse-test`
- Połączenie SSE z serwerem
- Dane przychodzą automatycznie
- Logi i status połączenia

### 3. Strona WebSocket
**URL**: `/ws-test`
- Połączenie WebSocket
- Dwukierunkowa komunikacja

## Jak to działa

### 1. Cache System

- **TTL**: 30 sekund - dane są cachowane na 30 sekund
- **Inteligentne odświeżanie**: cache jest sprawdzany przed każdym żądaniem
- **Optymalizacja**: mniej zapytań do GitHub API
- **Parametr `fresh=true`**: nadal dostępny dla wymuszenia odświeżenia

### 2. Automatyczne Odświeżanie

- **Domyślnie**: uruchomione co 30 sekund
- **Rate limiting**: automatyczne zarządzanie limitami GitHub API
- **Retry logic**: automatyczne ponowne próby przy błędach
- **Logowanie**: wszystkie operacje są logowane

### 3. Rate Limiting i Retry

- **Opóźnienie między żądaniami**: 1 sekunda
- **Maksymalne próby**: 3
- **Exponential backoff**: zwiększające opóźnienia przy błędach
- **Automatyczne czekanie**: przy przekroczeniu limitów GitHub API

### 4. Dynamiczne wartości

Wszystkie dane zawierają dynamiczne pola:
- `live_seconds_elapsed` - sekundy od ostatniej zmiany
- `live_time_formatted` - sformatowany czas
- `current_timestamp` - aktualny timestamp
- `live_request_time` - czas żądania

## Przykłady użycia

### Pobranie świeżych danych
```bash
curl -X GET "http://localhost:3000/repos?fresh=true"
```

### Wymuszenie odświeżenia
```bash
curl -X POST "http://localhost:3000/repos/refresh"
```

### Sprawdzenie cache
```bash
curl -X GET "http://localhost:3000/repos/cache/info"
```

### Uruchomienie auto-refresh co 60 sekund
```bash
curl -X POST "http://localhost:3000/auto-refresh/start" \
  -H "Content-Type: application/json" \
  -d '{"interval": 60}'
```

### Sprawdzenie statusu auto-refresh
```bash
curl -X GET "http://localhost:3000/auto-refresh/status"
```

## Korzyści

1. **Optymalne wykorzystanie GitHub API** - cache zmniejsza liczbę zapytań
2. **Automatyczne zarządzanie limitami** - retry logic i rate limiting
3. **Zawsze aktualne dane** - automatyczne odświeżanie co 30 sekund
4. **Kontrola nad danymi** - możliwość wymuszenia odświeżenia
5. **Dynamiczne wartości** - wszystkie pola są aktualizowane w czasie rzeczywistym
6. **Stabilność** - automatyczne ponowne próby przy błędach

## Limity i optymalizacja

- **GitHub API**: 5000 requests/hour (uwierzytelnione)
- **Auto-refresh**: co 30 sekund = 120 requests/hour
- **Cache TTL**: 30 sekund
- **Rate limiting**: 1 sekunda między żądaniami
- **Retry**: maksymalnie 3 próby z exponential backoff
