const { URL } = require('url');
const parse = require('parse5');
const crawlers = require('./crawlers');

function NormalizeURI(uri) {
  return String(uri)
    .replace(new RegExp(crawlers.REGEXP_FILTER_ATTRIBUTE), '')
    .replace(new RegExp(crawlers.REGEXP_FILTER_RIGHT_QUOTES), '');
}

function NormalizeTitle(titleTag) {
  return String(titleTag)
    .replace(new RegExp(crawlers.REGEXP_FILTER_LEFT_TITLE), '')
    .replace(new RegExp(crawlers.REGEXP_FILTER_RIGHT_TITLE), '').trim();
}

function NormalizeDescription(descTag) {
  try {
    return parse.parseFragment(descTag).childNodes[0].attrs.filter((attr, _idx, _arr) => {
      if (attr.name == 'content')
        return true;
      return false;
    })[0]['value'].trim();
  } catch (e) {
    return '';
  }
}

function NormalizeAbsolutePath(baseUrl, relPath) {
  return (new URL(relPath, baseUrl)).href;
}


module.exports = {
  NormalizeURI,
  NormalizeTitle,
  NormalizeDescription,
  NormalizeAbsolutePath
};