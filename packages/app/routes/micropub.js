const express = require('express');
const JSONCache = require('redis-json');
const micropub = require('@indiekit/micropub');
const Publication = require('@indiekit/publication');

const config = require('./../config');

const router = new express.Router();

// Configure publication
const publication = (async () => {
  const {client} = config;
  const app = await client.hgetall('app');
  const pub = await client.hgetall('pub');

  // Detirmine publisher
  const publisherId = app.publisherId || 'github';
  const Publisher = require(`@indiekit/publisher-${publisherId}`);
  const publisherConfig = await client.hgetall(publisherId);

  return new Publication({
    configPath: pub.configPath,
    defaults: require('@indiekit/config-jekyll'),
    publisher: new Publisher(publisherConfig),
    tmpdir: config.tmpdir,
    me: pub.me
  });
})();

// Get publication configuration
(async () => {
  const {client} = config;
  const pub = await publication;
  const mediaStore = new JSONCache(client, {
    prefix: 'media:'
  });
  const postStore = new JSONCache(client, {
    prefix: 'post:'
  });

  // Micropub endpoint
  router.use('/micropub', micropub({
    config: await pub.getConfig(),
    mediaStore,
    postStore
  }));
})();

module.exports = router;
