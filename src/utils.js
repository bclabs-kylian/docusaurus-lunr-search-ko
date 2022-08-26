const path = require('path')
const fs = require('fs')
const lunr = require('lunr')
const minimatch = require('minimatch')

/**
 * Based on code from https://github.com/cmfcmf/docusaurus-search-local/
 * by Christian Flach, licensed under the MIT license.
 */
function generateLunrClientJS(outDir, language = "en") {
    if (Array.isArray(language) && language.length === 1) {
        language = language[0];
    }
    let lunrClient =
        "// THIS FILE IS AUTOGENERATED\n" +
        "// DO NOT EDIT THIS FILE!\n\n" +
        'import * as lunr from "lunr";\n';

    if (language !== "en") {
        require("lunr-languages/lunr.stemmer.support")(lunr);
        lunrClient += 'require("lunr-languages/lunr.stemmer.support")(lunr);\n';
        if (Array.isArray(language)) {
            language
                .filter(code => code !== "en")
                .forEach(code => {
                    if (code === 'ja' || code === 'jp') {
                        require("lunr-languages/tinyseg")(lunr);
                        lunrClient += 'require("lunr-languages/tinyseg")(lunr);\n';
                    }
                    require(`lunr-languages/lunr.${code}`)(lunr);
                    lunrClient += `require("lunr-languages/lunr.${code}")(lunr);\n`;
                });
            require("lunr-languages/lunr.multi")(lunr);
            lunrClient += `require("lunr-languages/lunr.multi")(lunr);\n`;
        } else {
            require(`lunr-languages/lunr.${language}`)(lunr);
            lunrClient += `require("lunr-languages/lunr.${language}")(lunr);\n`;
        }
    }
    lunrClient += `export default lunr;\n`;

    const lunrClientPath = path.join(outDir, "lunr.client.js");
    fs.writeFileSync(lunrClientPath, lunrClient);

    if (language !== "en") {
        if (Array.isArray(language)) {
            return lunr.multiLanguage(...language);
        } else {
            return lunr[language];
        }
    }
    return null;
}

function getFilePaths(routesPaths, outDir, baseUrl, options = {}) {
    const files = []
    const addedFiles = new Set();
    const { excludeRoutes = [], indexBaseUrl = false } = options
    const meta = {
        excludedCount: 0,
    }

    routesPaths.forEach((route) => {
        if (route === `${baseUrl}404.html`) return
        let filePath;
        if (!indexBaseUrl){
          if (route === baseUrl) {
            // Special case for index.html
            route = route.substr(baseUrl.length)
            filePath = path.join(outDir, route, "index.html")
          } else {
            route = route.substr(baseUrl.length)
            filePath = path.join(outDir, `${route}.html`)
          }
        } else {
          route = route.substr(baseUrl.length)
          filePath = path.join(outDir, route, "index.html")
        }
        // In case docs only mode routesPaths has baseUrl twice
        if(addedFiles.has(filePath)) return
        if (excludeRoutes.some((excludePattern) => minimatch(route, excludePattern))) {
            meta.excludedCount++
            return
        }
        files.push({
            path: filePath,
            url: route,
        });
        addedFiles.add(filePath);
    })
    return [files, meta]
}

module.exports = {
    generateLunrClientJS,
    getFilePaths,
}
