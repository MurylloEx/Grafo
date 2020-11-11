const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(path.resolve(__dirname, 'sqlite/grafo.sqlite'));

//#region [ FUNÇÕES ADAPTADAS DO SQLITE ]

/**Responsável por executar as consultas na ordem correta.
 * @param {function} callback Callback assíncrono usado na serialização das consultas.
 */
function sqlite_serialize(callback) {
  db.serialize(callback);
}

/**Retorna o número de linhas obtidas em uma consulta ao sqlite.
 * @param {any} result Valor retornado em uma das seguintes funções: sqlite_fetch_row, sqlite_fetch_rows.
 */
function sqlite_num_rows(result) {
  if (typeof result === 'object') {
    if (Array.isArray(result)) {
      return result.length;
    } else {
      return 1;
    }
  } else {
    return 0;
  }
}

/**Recupera apenas a primeira linha que encontrar referente à consulta executada.
 * @param {string} query Uma string de consulta, exemplo: SELECT * FROM users.
 * @param {string[]} params Uma lista ou matriz de strings para inserir no banco de dados.
 */
async function sqlite_fetch_row(query, params) {
  return new Promise((resolve, _reject) => {
    try {
      db.get(query, params, (_err, row) => { resolve(row); });
    } catch (e) { resolve(null); }
  });
}

/**Recupera todas as linhas encontradas referentes à consulta executada.
 * @param {string} query Uma string de consulta, exemplo: SELECT * FROM users.
 * @param {string[]} params Uma lista ou matriz de strings para inserir no banco de dados.
 */
async function sqlite_fetch_rows(query, params) {
  return new Promise((resolve, _reject) => {
    try {
      db.all(query, params, (_err, rows) => { resolve(rows); });
    } catch (e) { resolve(null); }
  });
}

/**Função utilizada para executar um comando de inserção, alteração ou exclusão no banco de dados. Esta função não retorna nenhum valor, exceto um status booleano indicando se o comando foi bem-sucedido.
 * @param {string} query Uma string de consulta, exemplo: INSERT INTO users (name, email) VALUES ('muryllo', 'muryllo(a)gmail.com').
 * @param {string[]} params Uma lista ou matriz de strings para inserir no banco de dados.
 */
async function sqlite_query_exec(query, params) {
  return new Promise((resolve, _reject) => {
    try {
      db.prepare(query).run(params).finalize((err) => { resolve(!err); });
    } catch (e) { resolve(false); }
  });
}

/**Retorna o número de linhas alteradas, inseridas ou removidas na última operação INSERT, UPDATE ou DELETE.
 */
async function sqlite_affected_rows() {
  return new Promise(async (resolve, _reject) => {
    resolve(
      (await sqlite_fetch_row(`SELECT CHANGES() AS AffectedRows;`, [])).AffectedRows
    );
  });
}

/**Retorna o id da última linha inserida no banco de dados. */
async function sqlite_last_insert_row_id() {
  return new Promise(async (resolve, _reject) => {
    resolve(
      (await sqlite_fetch_row(`SELECT LAST_INSERT_ROWID() AS RowId;`, [])).RowId
    );
  });
}

//#endregion

async function query_search_websites(searchTerm, page){
  if (isNaN(Number(page)))
    return false;
  if (Number(page) < 0)
    return false;
  page = Number(page);
  searchTerm = String(searchTerm).split(new RegExp(/[ ,\\/]/g));
  let params = [];
  for (let i = 0; i < searchTerm.length; i++){
    for (let x = 0; x < 3; x++){
      params.push(searchTerm[i]);
    }
  }
  let sql = `SELECT DISTINCT id, site_url, site_title, site_description FROM websites WHERE 1!=1`;
  for (let k = 0; k < searchTerm.length; k++){
    sql += ` OR (site_url LIKE '%'||?||'%' OR site_title LIKE '%'||?||'%' OR site_description LIKE '%'||?||'%')`;
  }
  sql += `ORDER BY id ASC LIMIT ${(page-1)*10},${10};`;
  let results = await sqlite_fetch_rows(sql, params);
  if (sqlite_num_rows(results) > 0){
    return results;
  } else {
    return false;
  }
}

module.exports = {
  query_search_websites
};