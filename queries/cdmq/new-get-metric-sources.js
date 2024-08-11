var cdm = require('./cdm');
var program = require('commander');
var bigQuerySize = 262144;

program.version('0.1.0').option('--run <uuid>').option('-u, --url <host:port>').parse(process.argv);

function esRequest(host, idx, q) {
  return new Promise((resolve, reject) => {
    var url = 'http://' + host + '/' + 'cdmv7dev-' + idx;
    console.log("esRequest() url:" + url + "q:" + JSON.stringify(q, null, 2));
    // The var q can be an object or a string.  If you are submitting NDJSON
    // for a _msearch, it must be a [multi-line] string.
    if (typeof q === 'object') {
      q = JSON.stringify(q);
    }
    var http = require('http');
    const options = {
        body: q, method: 'POST', headers: { 'Content-Type': 'application/json' } };
    var req = http.request(url, options, function(res) {
      var chunks = [];
      res.on("data", function (chunk) {
            chunks.push(chunk);
      });
      res.on("end", function () {
        var body = Buffer.concat(chunks);
        var response = JSON.parse(body);
        //console.log("response: " + JSON.stringify(response, null, 2));
        // Here you RESOLVE promise result
        resolve(response);
        return response;
      });
    });
    req.end();
  });
}

async function getSources(url, runId) {
  var q = {
    query: { bool: { filter: [{ term: { 'run.id': runId } }] } },
    aggs: {
      source: { terms: { field: 'metric_desc.source', size: bigQuerySize } }
    },
    size: 0
  };
  var data = await esRequest(url, 'metric_desc/_search', q);
  //console.log("getMetricSource() resp: " + JSON.stringify(data, null, 2));
  if (Array.isArray(data.aggregations.source.buckets)) {
    var sources = [];
    data.aggregations.source.buckets.forEach((element) => {
      sources.push(element.key);
    });
    console.log("returning metric sources");
    return sources;
  }
};

console.log("about to call getSOurces");
var result = getSources(program.url, program.run);
console.log("return from getSOurces");
//console.log("result:" + result);

