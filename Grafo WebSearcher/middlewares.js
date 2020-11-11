const PreOpStack = require('express').Router();
const PostOpStack = require('express').Router();
const wafutils = require('mini-waf/wafutils');
const express = require('express');
const path = require('path');

PreOpStack.use('/', express.static(path.resolve(__dirname, 'static')));

PreOpStack.use((req, res, next) => {
  wafutils.DisplayNewConnection(req);
  return next();
});

PostOpStack.use((req, res, next) => {
  return res.redirect('/');
});

module.exports = {
  PreOpMiddlewares: PreOpStack,
  PostOpMiddlewares: PostOpStack
}
