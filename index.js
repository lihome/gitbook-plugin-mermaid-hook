var path         = require('path');
var readFileSync = require('fs').readFileSync;
var url          = require('url');

var phantom = require('phantom');
var Q       = require('q');


const PHANTOMJS_MODULE = require.resolve('phantomjs')
//const PHANTOMJS_BIN = path.resolve(PHANTOMJS_MODULE, '../../bin', 'phantomjs')
const PHANTOMJS_BIN = "/home/lihome/GitBook/Library/Import/es/node_modules/phantomjs/bin/phantomjs";


var mermaidRegex = /^```mermaid((.*[\r\n]+)+?)?```$/im;

function processMermaidBlockList(page) {

  var match = mermaidRegex.exec(page.content);
  if (!match) return page;
  
  var rawBlock = match[0];
  var mermaidContent = match[1];

  return processBlock(mermaidContent).then(function(ret) {
    page.content = page.content.replace(rawBlock, ret);
    return processMermaidBlockList(page);
  });  
}


function processBlock(body) {
  return convertToSvg(body)
      .then(function (svgCode) {
        return svgCode.replace(/mermaidChart1/g, getId());
      });
}

function convertToSvg(mermaidCode) {
  var deferred = Q.defer();
  phantom.create({binary: PHANTOMJS_BIN}, function (ph) {
    ph.createPage(function (page) {

      var htmlPagePath = path.join(__dirname, 'convert/converter.html');

      page.open(htmlPagePath, function (status) {
        page.evaluate(
          function (code) {
            return renderToSvg1(code);
          },
          function (result) {
            ph.exit();

            deferred.resolve(result);
          },
          mermaidCode);
      });
    });
  });

  return deferred.promise;
}

function getId() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return "mermaidChart-" + s4() + s4();
}

module.exports = {
  hooks: {
    'page:before': processMermaidBlockList
  }
};
