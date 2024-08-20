//var cdm = require('./cdm');
var request = require('sync-request');
var program = require('commander');
var http = require('http');
var bigQuerySize = 262144;

program.version('0.1.0').option('--run <uuid>').option('-u, --url <host:port>').parse(process.argv);

function esRequest(host, idx, q) {
  var url = 'http://' + host + '/' + 'cdmv7dev-' + idx;
  console.log('url:' + url);
  console.log('q:' + JSON.stringify(q, null, 2));
  // The var q can be an object or a string.  If you are submitting NDJSON
  // for a _msearch, it must be a [multi-line] string.
  if (typeof q === 'object') {
    q = JSON.stringify(q);
  }
  console.log('esRequest() url:' + url + 'q:\n' + q);
  var resp = request('POST', url, {
    body: q,
    headers: { 'Content-Type': 'application/json' }
  });

  return JSON.parse(resp.getBody());
}

function asyncEsRequest(host, idx, q) {
  return new Promise((resolve, reject) => {
    var url = 'http://' + host + '/' + 'cdmv7dev-' + idx;
    console.log('url:' + url);
    console.log('q:' + JSON.stringify(q, null, 2));
    // The var q can be an object or a string.  If you are submitting NDJSON
    // for a _msearch, it must be a [multi-line] string.
    if (typeof q === 'object') {
      q = JSON.stringify(q);
    }
    console.log('url:' + url);
    const options = {
      body: q,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    var req = http.request(url, options, function (res) {
      var chunks = [];
      res.on('data', function (chunk) {
        chunks.push(chunk);
      });
      res.on('end', function () {
        var body = Buffer.concat(chunks);
        var result = JSON.parse(body);
        console.log('result: ' + JSON.stringify(result, null, 2));
        // Here you RESOLVE promise result
        resolve(result);
        return result;
      });
    });
    req.end();
  });
}

async function getSources(url, runId) {
  //var q = {
  //query: { bool: { filter: [{ term: { 'run.id': runId } }] } },
  //aggs: {
  //source: { terms: { field: 'metric_desc.source', size: bigQuerySize } }
  //},
  //size: 2
  //};

  var q = {
    query: { bool: { filter: [{ term: { 'run.id': runId } }] } },
    size: 2
  };

  var data = esRequest(url, 'metric_desc/_search', q);
  //var data = await asyncEsRequest(url, 'metric_desc/_search', q);

  console.log('getMetricSource() data: ' + JSON.stringify(data, null, 2));

  if (typeof data === 'object' && 'aggregations' in data && Array.isArray(data.aggregations.source.buckets)) {
    var sources = [];
    data.aggregations.source.buckets.forEach((element) => {
      sources.push(element.key);
    });
    console.log('returning metric sources');
    return sources;
  }
}

console.log('about to call getSources');
var result = getSources(program.url, program.run);
console.log('return from getSources');
//console.log("result:" + result);
