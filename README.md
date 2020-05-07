<p align="center">
  <a href="https://www.toonin.ml" target="_blank">
    <img alt="Toonin Icon" width="100" src="https://github.com/grey-software/toonin/raw/master/assets/icon.png">
  </a>
</p>

# Toonin

[![CircleCI](https://circleci.com/gh/grey-software/toonin/tree/master.svg?style=svg)](https://circleci.com/gh/grey-software/toonin/tree/master) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/d7e992618c424b9a8f1604bf7bb00403)](https://www.codacy.com/gh/grey-software/toonin?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=grey-software/toonin&amp;utm_campaign=Badge_Grade) [![Netlify Status](https://api.netlify.com/api/v1/badges/fc6849cb-e7ae-4de9-be09-660d51342bf6/deploy-status)](https://app.netlify.com/sites/toonin/deploys)

Toonin is a Chrome Extension coupled with a web app that allows your friends to Tune In to what you're listening to. 

## Overview

Toonin consists of a Chrome extension, a web application, and a signaling server. WebRTC is used to stream the music from the provider to its peers. 

In order to exchange information, a signaling server must exist between the provider (Chrome Extension) and the peers (Web App)


## Development setup

```sh
npm run setup
```

## Running Toonin

Toonin comes with a launch script that launches the server and app simultaneuously: 

```sh 
npm run launch
```

### Running the web app independently
```sh
npm run app
```

### Running the signalling server independently
```sh
npm run server
```
