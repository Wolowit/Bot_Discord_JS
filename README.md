# Bot Discord with MEVN

---

### Project setup

#### config

```
touch config/TOKEN.js
```

#### config bot token in config/TOKEN.js

```javascript
BOT_TOKEN = 'add your token here'

module.exports = BOT_TOKEN
```

#### runing the bot in dev-mode

```properties
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# fetch logs, -f follow log output
docker logs [name of your bot container] -f
```

> runing the bot in prod-mode need to set local environment variable

---

## Frontend for discord bot

### Project setup

```
cd vue-frontend
npm install
```

#### Compiles and hot-reloads for development

```
npm run serve
```

#### Compiles and minifies for production

```
npm run build
```

#### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

---

## Features

- on Discord

  - play
  - stop
  - skip
  - on/off bot

- web application

  - show song playing
  - show top played song
