const mime = require('mime-types');
const axios = require('axios').default;
const normalizers = require('./normalizers');
const crawlers = require('./crawlers');

async function LoadRemoteResource(uri) {
  return new Promise((resolve, _reject) => {
    let handler = (response) => {
      if ((typeof response == 'undefined') || !response['data'])
        return resolve(null);
      let mimeType = mime.lookup(mime.extension(response.headers['content-type']));
      let allowedMimes = [
        mime.lookup('html'), mime.lookup('xhtml'),
        mime.lookup('xml'), mime.lookup('php')
      ];
      if (allowedMimes.includes(mimeType))
        return resolve(response.data);
      return resolve(null);
    }
    axios.get(uri, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36' //'Grafo Web-Crawler v1.0 (+https://www.grafo.nav.seg.br) Your site is being mapped!'
      },
      timeout: 3000,
      maxRedirects: 2
    }).then(handler).catch((reason) => { handler(reason.response); });
  });
}

async function CreateUriMapping(uri, depth) {
  return new Promise(async (resolve, _reject) => {
    try {
      //Se a profundidade máxima já foi atingida, paramos com o mapeamento.
      if (depth <= 0)
        return resolve(void (0));

      //Carrega dados da página para a memória;
      let data = await LoadRemoteResource(uri);
      //Se a página não retornar nada, paramos de extrair os dados.
      if (data === null)
        return resolve(void (0));

      //Extraímos as informações mais importantes:
      //[1] Título, [2] Descrição, [3] Outras URLs (Vértices) para o grafo.
      let meta = {
        GenericLinks: crawlers.ExtractPattern(crawlers.REGEXP_GENERIC_LINKS, data),
        SourceLinks:  crawlers.ExtractPattern(crawlers.REGEXP_SOURCE_LINKS, data),
        Ipv4Links:    crawlers.ExtractPattern(crawlers.REGEXP_IPV4_LINKS, data),
        Description:  crawlers.ExtractPattern(crawlers.REGEXP_TAG_DESCRIPTION, data)[0] || '<meta name="description" content="Infelizmente não identificamos a descrição dessa página.">',
        Title:        crawlers.ExtractPattern(crawlers.REGEXP_TAG_TITLE, data)[0] || '<title>Sem título</title>'
      };

      //Normaliza e corrige títulos mal-formados.
      meta.Title = normalizers.NormalizeTitle(meta.Title);
      //Normaliza e corrige descrições mal-formadas.
      meta.Description = normalizers.NormalizeDescription(meta.Description);
      //Normaliza, corrige e torna absoluta links mal-formados.
      meta.SourceLinks = meta.SourceLinks.map((val) => { return normalizers.NormalizeAbsolutePath(uri, normalizers.NormalizeURI(val)); });

      //Junta todos os links (Vértices) encontrados nessa página.
      let Vertices = meta.GenericLinks.concat(meta.SourceLinks.concat(meta.Ipv4Links));

      //Retorna os vértices encontrados nessa pásina
      return resolve({
        Uri: uri,
        Title: meta.Title,
        Description: meta.Description,
        Vertices: [...new Set(Vertices)],
        Depth: depth
      });
    } catch (e) {
      return resolve(void (0));
    }
  });
}

async function GetSubVertices(vertex, evt) {
  let vertices = [];
  for (let k = 0; k < vertex.Vertices.length; k++) {
    let innerVertex = await CreateUriMapping(vertex.Vertices[k], vertex.Depth - 1);
    if (typeof innerVertex != 'undefined') {
      evt.emit('vertices', innerVertex);
      vertices.push(innerVertex);
    }
  }
  return vertices;
}

async function GrafoWebCrawler(uri, depth, evt, sites) {
  let Vertex = await CreateUriMapping(uri, depth, evt);
  let KnownSites = sites;
  if (typeof Vertex == 'undefined') {
    evt.emit('timeout', {});
  } else {
    evt.emit('vertices', Vertex);
    let subVertices = await GetSubVertices(Vertex, evt);
    while (!!subVertices[0] && (subVertices[0].Depth > 0)) {
      for (let k = 0; k < subVertices.length; k++) {
        evt.emit('vertices', subVertices[k]);
      }
      for (let k = 0; k < subVertices.length; k++) {
        if (!KnownSites[subVertices[k]]){
          KnownSites[subVertices[k]] = true;
          subVertices = await GetSubVertices(subVertices[k], evt);
        }
      }
    }
  }

}

module.exports = {
  LoadRemoteResource,
  CreateUriMapping,
  GetSubVertices,
  GrafoWebCrawler
};