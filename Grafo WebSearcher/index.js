const path = require('path');
const express = require('express');
const queries = require('./queries');
const Middlewares = require('./middlewares');
const decode = require('unescape');
const Entities = require('html-entities').AllHtmlEntities;

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use(Middlewares.PreOpMiddlewares);

function UnescapeSpecialChars(str) {
  const SPECIAL_CHARSET = new RegExp(/&#\d{2,6};/ig);
  const FOUND_CHARS = String(str || '').match(SPECIAL_CHARSET) || [];
  let newStr = String(str || '');
  for (let idx = 0; idx < FOUND_CHARS.length; idx++) {
    newStr = newStr.replace(FOUND_CHARS[idx], `${String.fromCharCode(Number(FOUND_CHARS[idx].replace(/[^0-9]/ig, '')))}`);
  }
  return Entities.decode(decode(newStr, 'all'));
}


app.get('/', async (req, res) => {
  if (req.query.q && req.query.page){
    if (isNaN(Number(req.query.page)))
      return res.render('search', {});
    let results = await queries.query_search_websites(req.query.q, req.query.page);
    if (results !== false){
      for (let k = 0; k < results.length; k++){
        results[k].site_title = UnescapeSpecialChars(results[k].site_title);
        results[k].site_description = UnescapeSpecialChars(results[k].site_description);
      }
    }
    res.render('results', {
      HasResults: (results !== false),
      Results: results,
      SearchTerm: req.query.q,
      Page: Number(req.query.page)
    });
  } else {
    res.render('search', {});
  }
});

app.get('/howitworks', (req, res) => {
  res.render('howitworks');
});

app.get('/algorithm', (req, res) => {
  res.render('/');
});

app.get('/webcrawler', (req, res) => {
  res.render('webcrawler');
});

app.use(Middlewares.PostOpMiddlewares);

app.listen(14200, () => {
  console.log('O servidor está rodando na porta 14200!');
});