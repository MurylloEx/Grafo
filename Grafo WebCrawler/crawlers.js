//Essas são as expressões regulares de extração de dados
//utilizadas para obter os principais metadados.
const REGEXP_GENERIC_LINKS = new RegExp(/https?:\/\/[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9_\-\.]+(?:[a-zA-Z0-9_\-\/~%+()&#@!.?=]+)?/mg);
const REGEXP_SOURCE_LINKS = new RegExp(/(?:(?:href|src|action)\s*=\s*"[a-zA-Z0-9_\-\/~%+()&#@!.?=]+")/mg);
const REGEXP_IPV4_LINKS = new RegExp(/(?:https?:\/\/)?(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:1[0-9]{2}|2[0-4][0-9]|25[0-5]|[1-9][0-9]|[0-9])(?::\d{1,5})?(?:[a-zA-Z0-9_\-\/~%+()&#@!.?=]*)/mg);
const REGEXP_TAG_TITLE = new RegExp(/<title[^<>]*>.+<\/title>/img);
const REGEXP_TAG_DESCRIPTION = new RegExp(/(?:<meta[^\/<>]+?name\s*=\s*"description"[^\/<>]+?content\s*=\s*"[^"]+"(?:.|\s)*?\/?>|<meta[^\/<>]+?content\s*=\s*"[^"]+"[^\/<>]+?name\s*=\s*"description"(?:.|\s)*?\/?>)/img);

//Essas são as expressões regulares de filtro para remover
//strings que sejam indesejáveis no texto estraído.
const REGEXP_FILTER_ATTRIBUTE = new RegExp(/^(?:src|href|action)="/igm);
const REGEXP_FILTER_RIGHT_QUOTES = new RegExp(/"$/gm);
const REGEXP_FILTER_LEFT_TITLE = new RegExp(/^(?:<title[^<>]*>)/igm);
const REGEXP_FILTER_RIGHT_TITLE = new RegExp(/(?:<\/title>)$/igm);

function ExtractPattern(expression, text) {
  return String(text).match(new RegExp(expression)) || [];
}

module.exports = {
  REGEXP_GENERIC_LINKS,
  REGEXP_SOURCE_LINKS,
  REGEXP_IPV4_LINKS,
  REGEXP_TAG_TITLE,
  REGEXP_TAG_DESCRIPTION,
  REGEXP_FILTER_ATTRIBUTE,
  REGEXP_FILTER_RIGHT_QUOTES,
  REGEXP_FILTER_LEFT_TITLE,
  REGEXP_FILTER_RIGHT_TITLE,
  ExtractPattern
};