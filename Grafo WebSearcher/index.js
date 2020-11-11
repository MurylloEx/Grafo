const path = require('path');
const express = require('express');
const queries = require('./queries');
const Middlewares = require('./middlewares');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use(Middlewares.PreOpMiddlewares);

app.get('/', async (req, res) => {
  if (req.query.q && req.query.page){
    if (isNaN(Number(req.query.page)))
      return res.render('search', {});
    let results = await queries.query_search_websites(req.query.q, req.query.page);
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
  res.render('howitworks');
});

app.get('/', (req, res) => {
  res.render('howitworks');
});

app.use(Middlewares.PostOpMiddlewares);

app.listen(14200, () => {
  console.log('O servidor está rodando na porta 14200!');
});