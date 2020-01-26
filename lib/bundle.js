(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/Users/phx/Sync/sign-search/lib/search-engine/engine.js":[function(require,module,exports){
const SearchLibrary=require("../search-library/library-web"),VectorLibrary=require("../vector-library/library"),SearchQuery=require("./query"),VU=require("../vector-utilities"),fsutil=require("../util");class SearchEngine{constructor(r){this.ready=!1,this.readyHandlers=[],this.config=r}async load(){try{[this.searchLibrary,this.vectorLibrary]=await Promise.all([new SearchLibrary({path:this.config.searchLibraryPath}).open(),new VectorLibrary({path:this.config.vectorLibraryPath,fs:{readFile:fsutil.fetchLikeFile},digest:fsutil.digestOnWeb}).open()])}catch(r){throw this.readyHandlers.forEach(([e,a])=>a(r)),this.readyHandlers=[],r}this.ready=!0,this.readyHandlers.forEach(([r,e])=>r(this)),this.readyHandlers=[]}awaitReady(){return this.ready?Promise.resolve(this):new Promise((r,e)=>{this.readyHandlers.push([r,e])})}async query(r){await this.awaitReady();let e=new SearchQuery(r);await e.vectorize(this.vectorLibrary);let a=e.hashtags.filter(r=>r.positive).map(r=>r.text),t=e.hashtags.filter(r=>!r.positive).map(r=>r.text);return(await this.searchLibrary.query(r=>{if(a.some(e=>!r.tags.includes(e)))return!1;if(t.some(e=>r.tags.includes(e)))return!1;return e.keywords.map(e=>Math.min(...r.terms.map(r=>e.distance(r)))).reduce((r,e)=>r+e,0)+r.termDiversity/500})).sort((r,e)=>r.distance-e.distance)}async getTags(){return await this.awaitReady(),this.searchLibrary.getTags()}}module.exports=SearchEngine;

},{"../search-library/library-web":"/Users/phx/Sync/sign-search/lib/search-library/library-web.js","../util":"/Users/phx/Sync/sign-search/lib/util.js","../vector-library/library":"/Users/phx/Sync/sign-search/lib/vector-library/library.js","../vector-utilities":"/Users/phx/Sync/sign-search/lib/vector-utilities.js","./query":"/Users/phx/Sync/sign-search/lib/search-engine/query.js"}],"/Users/phx/Sync/sign-search/lib/search-engine/query.js":[function(require,module,exports){
const VU=require("../vector-utilities");class SearchQuery{constructor(t){this.rawTokens=t.trim().split(/[\t\n,?!;:\[\]\(\){} "”“]+/).filter(t=>t.toString().trim().length>0),this.tokens=this.rawTokens.map(t=>{if(t.match(/^-#([a-zA-Z0-9._-]+)$/))return new HashtagToken(t.slice(2),!1);if(t.match(/^#([a-zA-Z0-9._-]+)$/))return new HashtagToken(t.slice(1),!0);{let r=t.trim().replace(/‘/g,"'");return(r.match(/[a-z]/)||r.length<2)&&(r=r.toLowerCase()),new KeywordToken(r)}})}async vectorize(t){return this.tokens=await Promise.all(this.tokens.map(async r=>{if(r.constructor==KeywordToken){let e=await t.lookup(r);return e?new WordVector(r,e):r}return r})),this}get keywords(){return this.tokens.filter(t=>t.constructor==KeywordToken||t.constructor==WordVector)}get hashtags(){return this.tokens.filter(t=>t.constructor==HashtagToken)}toString(){return this.tokens.join(" ")}}class HashtagToken{constructor(t,r=!0){this.text=t.toString(),this.positive=!!r}toString(){return`${this.positive?"#":"-#"}${this.text}`}}class KeywordToken{constructor(t){this.text=t.toString()}distance(t){return"string"==typeof t&&t==this.text?0:"string"==typeof t&&t.toLowerCase()==this.text.toLowerCase()?.1:10}toString(){return this.text}toQuery(){return this.text}}class WordVector{constructor(t,r){this.text=t.toString(),this.vector=r}distance(t){return Array.isArray(t)?VU.distanceSquared(this.vector,t):10}toString(){return this.text}toQuery(){return this.vector}}SearchQuery.HashtagToken=HashtagToken,SearchQuery.KeywordToken=KeywordToken,SearchQuery.WordVector=WordVector,module.exports=SearchQuery;

},{"../vector-utilities":"/Users/phx/Sync/sign-search/lib/vector-utilities.js"}],"/Users/phx/Sync/sign-search/lib/search-engine/view-paginator.js":[function(require,module,exports){
const html={};class PaginatorComponent{constructor(e){this.length=e.length||1,this.selected=e.selected||0,this.getURL=e.getURL||(e=>`?page=${e}`)}timesMap(e,t){if(e<=0)return[];let n=[];for(let r=0;r<e;r++)n.push(t(r));return n}toHTML(){return function(){var e=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),t=document.createElement("div");return t.setAttribute("id","pagination"),e(t,["\n      ",arguments[0],"\n    "]),t}(this.timesMap(this.length,e=>(function(){var e=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),t=document.createElement("a");return t.setAttribute("href",arguments[0]),t.setAttribute("aria-label","Page "+arguments[1]),t.setAttribute("aria-current",arguments[2]),e(t,[arguments[3]]),t})(this.getURL(e),e+1,this.selected==e?"page":"",e+1)))}}module.exports=PaginatorComponent;

},{"/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js":"/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"}],"/Users/phx/Sync/sign-search/lib/search-engine/view-result.js":[function(require,module,exports){
const html={};class SearchResultPanel{constructor(t={}){this.config=t,this.config.mediaIndex=this.config.mediaIndex||0,this.result=t.result||null,this.forcedWarnings=[]}setData(t){this.result=t,this.config.onChange&&this.config.onChange(this)}addWarning({type:t,text:e}){this.forcedWarnings.push({type:t,text:e}),this.config.onChange&&this.config.onChange(this)}removeWarning(t){this.forcedWarnings=this.forcedWarnings.filter(e=>e.type!=t),this.config.onChange&&this.config.onChange(this)}toHTML(){return this.result&&this.result.isFetched()?this.toPopulatedHTML():this.toPlaceholderHTML()}getWarnings(){let t=this.config.warnings||{};return[...Object.keys(t).filter(t=>this.result.tags.includes(t)).map(e=>t[e]),...this.forcedWarnings]}toID(...t){return this.result?["result",this.result.id,...t].join("-"):""}toMediaViewer(){let t=(t,e)=>(t.preventDefault(),t.stopPropagation(),this.config.mediaIndex+=e,this.config.onChange(this),!1),e=this.config.mediaIndex>0,i=this.config.mediaIndex<this.result.media.length-1,s=this.result.media[this.config.mediaIndex];return function(){var t=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),e=document.createElement("div");e.setAttribute("class","video_player");var i=document.createElement("picture");i.setAttribute("aria-hidden","true"),i.setAttribute("data-nanomorph-component-id",arguments[1]+"/media/"+arguments[2]),i.setAttribute("class","video_thumb");var s=document.createElement("video");s.setAttribute("muted","muted"),s.setAttribute("preload","preload"),s.setAttribute("autoplay","autoplay"),s.setAttribute("loop","loop"),s.setAttribute("playsinline","playsinline"),s.setAttribute("class","video_thumb"),t(s,["\n          ",arguments[0],"\n        "]),t(i,["\n        ",arguments[3],"\n        ",s,"\n      "]);var n=document.createElement("button");n.setAttribute("aria-label","Previous Video"),n.onclick=arguments[4],n.setAttribute("style",arguments[5]),n.setAttribute("class","prev_vid"),t(n,[arguments[6]]);var r=document.createElement("button");return r.setAttribute("aria-label","Next Video"),r.onclick=arguments[7],r.setAttribute("style",arguments[8]),r.setAttribute("class","next_vid"),t(r,[arguments[9]]),t(e,["\n      ",i,"\n      ",n,"\n      ",r,"\n    "]),e}(s.map(t=>(function(){var t=document.createElement("source");return t.setAttribute("src",arguments[0]),t.setAttribute("type",arguments[1]),t})(t.url,t.type)),this.result.id,this.config.mediaIndex,s.map(t=>(function(){var t=document.createElement("source");return t.setAttribute("srcset",arguments[0]),t.setAttribute("type",arguments[1]),t})(t.url,t.type)),e=>t(e,-1),e?"":"display: none","<",e=>t(e,1),i?"":"display: none",">")}toPopulatedHTML(){return function(){var t=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),e=document.createElement("a");e.setAttribute("href",arguments[5]),e.setAttribute("referrerpolicy","origin"),e.setAttribute("rel","external"),e.setAttribute("id",arguments[6]),e.setAttribute("aria-labelledby",arguments[7]),e.setAttribute("role","link"),e.setAttribute("class","result "+arguments[8]);var i=document.createElement("h2");i.setAttribute("id",arguments[0]),i.setAttribute("class","keywords"),t(i,[arguments[1]]);var s=document.createElement("cite");s.setAttribute("class","link"),t(s,[arguments[2]]);var n=document.createElement("div");n.setAttribute("class","tags"),t(n,[arguments[3]]);var r=document.createElement("div");return r.setAttribute("class","mini_def"),t(r,[arguments[4]]),t(e,["\n      ",arguments[9],"\n      ",i,"\n      ",s,"\n      ",n,"\n      ",arguments[10],"\n      ",r,"\n    "]),e}(this.toID("keywords"),this.result.title||this.result.keywords.join(", "),this.result.link,this.result.tags.map(t=>`#${t}`).join(" "),this.result.body,this.result.link,this.toID(),this.toID("keywords"),this.getWarnings().map(t=>t.type).join(" "),this.toMediaViewer(),this.getWarnings().map(t=>(function(){var t=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),e=document.createElement("div");return e.setAttribute("class","alert "+arguments[0]),t(e,[arguments[1]]),e})(t.type,t.text)))}toPlaceholderHTML(){return function(){var t=document.createElement("a");return t.setAttribute("aria-hidden","true"),t.setAttribute("class","result placeholder "+arguments[0]),t}(this.getWarnings().map(t=>t.type).join(" "))}}module.exports=SearchResultPanel;

},{"/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js":"/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"}],"/Users/phx/Sync/sign-search/lib/search-library/definition.js":[function(require,module,exports){
class SearchDefinition{constructor({title:i,keywords:t,tags:s,link:e,media:r,body:n,provider:o,id:d}={}){this.title=i||null,this.keywords=t||[],this.tags=s||[],this.link=e||null,this.media=r||[],this.body=n||null,this.provider=o||null,this.id=d||null}get uri(){return`${this.provider||"unknown"}:${this.id||this.link||"unknown"}`}inspect(){return`<${this.constructor.name} [${uri}]: ${this.title||this.keywords.join(", ")}>`}toJSON(){return{title:this.title,keywords:this.keywords,tags:this.tags,link:this.link,media:this.media,body:this.body,provider:this.provider,id:this.id}}}module.exports=SearchDefinition;

},{}],"/Users/phx/Sync/sign-search/lib/search-library/library-web.js":[function(require,module,exports){
const SearchLibrary=require("./library"),fsutil=require("../util");class SearchLibraryWeb extends SearchLibrary{constructor(r){super({fs:{readFile:fsutil.fetchLikeFile},...r})}}module.exports=SearchLibraryWeb;

},{"../util":"/Users/phx/Sync/sign-search/lib/util.js","./library":"/Users/phx/Sync/sign-search/lib/search-library/library.js"}],"/Users/phx/Sync/sign-search/lib/search-library/library.js":[function(require,module,exports){
(function (Buffer){
const SearchResultDefinition=require("./result-definition"),Util=require("../util"),VU=require("../vector-utilities"),cbor=require("borc");class SearchLibrary{constructor(t={}){this.index=[],this.settings={version:4,vectorBits:8,vectorSize:300,vectorScaling:0,buildTimestamp:Date.now(),mediaSets:[],buildID:Date.now()},Object.keys(this.settings).map(i=>this.settings[i]=t[i]||this.settings[i]),this.settings.mediaSets=(t.mediaFormats||[]).map(t=>t.getMediaInfo()),this.config=Object.assign({definitionsPerShard:50},t),this.path=t.path,this.log=t.log||(t=>console.log(t))}async loadEverything(){await this.open(this.path);for(let t of this.index)await t.fetch()}async open(){let t=cbor.decode(await this.config.fs.readFile(`${this.path}/index.cbor`));this.settings=t.settings;let i=t.symbols.map(t=>{if("string"==typeof t)return t;if(Buffer.isBuffer(t)){return Util.unpackFloats(t,this.settings.vectorBits,this.settings.vectorSize).map(t=>t*this.settings.vectorScaling)}});this.index=[];for(let[e,s]of t.index){let t=e.map(t=>i[t]);for(let[e,a]of s){let s=e.map(t=>i[t]),n=Math.max(...VU.diversity(...s.filter(t=>Array.isArray(t))));Util.chunk(a,2).forEach(i=>{this.index.push(new SearchResultDefinition({library:this,definitionPath:i,tags:t,terms:s,termDiversity:n}))})}}return this}async addDefinition(t){let i=t.toJSON&&t.toJSON()||t,e=i.keywords;this.config.cleanupKeywords&&(e=e.map(t=>{let i=t.trim().replace(/‘/g,"'");return(i.match(/[a-z]/)||i.length<2)&&(i=i.toLowerCase()),i})),e=await Promise.all(e.map(async t=>this.config.vectorLibrary&&await this.config.vectorLibrary.lookup(t)||t));let s=[];for(let t of i.media){let i=this.config.mediaFormats.filter(i=>i.accepts(t.getExtension())),e={};for(let s of i)e[s.getMediaInfo().extension]=await this.config.mediaCache.cache({media:t,format:s});i.length>0&&s.push(e)}let a=new SearchResultDefinition(Object.assign(i,{library:this,terms:e,termDiversity:Math.max(...VU.diversity(...e.filter(t=>Array.isArray(t)))),media:s,preloaded:!0}));this.index.push(a)}async query(t){let i=await this.config.fs.readFile(`${this.path}/buildID.txt`);return i.toString()!=this.settings.buildID.toString()&&(this.log(`Reloading dataset because dataset buildID is ${i} but locally loaded dataset is ${this.settings.buildID}`),await this.load()),this.index.map(i=>{let e=Object.create(i);return e.distance=t(i),e}).filter(t=>"number"==typeof t.distance).sort((t,i)=>t.distance-i.distance)}async save(){let t=[],i={},e=e=>{let s=JSON.stringify(e);if(i[s])return i[s];let a=t.length;if(Array.isArray(e)){let i=Util.packFloats(e.map(t=>t/this.settings.vectorScaling),this.settings.vectorBits,this.settings.vectorSize);t.push(Buffer.from(i))}else t.push(e.toString());return i[s]=a};if(this.config.vectorLibrary){this.settings.vectorScaling=0;for(let t of this.index){let i=t.terms.filter(t=>"string"!=typeof t);if(i.length<1)continue;let e=Math.max(...i.flat().map(Math.abs));this.settings.vectorScaling<e&&(this.settings.vectorScaling=e)}}let s={};{this.log("Writing content out to shard files");let t=0;for(let i of Util.chunkIterable(this.index,this.config.definitionsPerShard)){let a=[];i.forEach(i=>{i._definitionPath=[t,a.length],a.push(i.toJSON());let n=i.tags.map(e).sort().join("\n"),r=s[n]=s[n]||{},o=i.terms.map(e).sort().join("\n");r[o]=[...r[o]||[],...i._definitionPath]});let n=cbor.encode(a);await this.config.fs.ensureDir(`${this.path}/definitions/${this.settings.buildID}`),await this.config.fs.writeFile(`${this.path}/definitions/${this.settings.buildID}/${t}.cbor`,n),this.config.gzip&&await this.config.fs.writeFile(`${this.path}/definitions/${this.settings.buildID}/${t}.cbor.gz`,await this.config.gzip(n)),t+=1}}this.log("Encoding and writing index...");let a=cbor.encode({settings:this.settings,symbols:t,index:Util.objectToMap(s,t=>t.split("\n").map(t=>parseInt(t)),t=>Util.objectToMap(t,t=>t.split("\n").map(t=>parseInt(t))))});await this.config.fs.writeFile(`${this.path}/index.cbor`,a),this.config.gzip&&await this.config.fs.writeFile(`${this.path}/index.cbor.gz`,await this.config.gzip(a)),await this.config.fs.writeFile(`${this.path}/buildID.txt`,this.settings.buildID.toString())}async cleanup(){(await this.config.fs.readdir(`${this.path}/definitions`)).forEach(t=>{t!==this.settings.buildID&&this.config.fs.remove(`${this.path}/definitions/${t}`)}),await this.mediaCache.cleanup()}async _fetchDefinitionData(t){let i=t._definitionPath[0],e=await this.config.fs.readFile(`${this.path}/definitions/${this.settings.buildID}/${i}.cbor`);return cbor.decode(e)[t._definitionPath[1]]}}module.exports=SearchLibrary;

}).call(this,require("buffer").Buffer)

},{"../util":"/Users/phx/Sync/sign-search/lib/util.js","../vector-utilities":"/Users/phx/Sync/sign-search/lib/vector-utilities.js","./result-definition":"/Users/phx/Sync/sign-search/lib/search-library/result-definition.js","borc":"/Users/phx/Sync/sign-search/node_modules/borc/src/index.js","buffer":"/Users/phx/Sync/sign-search/node_modules/buffer/index.js"}],"/Users/phx/Sync/sign-search/lib/search-library/result-definition.js":[function(require,module,exports){
const SearchDefinition=require("./definition"),Util=require("../util");class SearchResultDefinition extends SearchDefinition{constructor(i={}){super(i),this.library=i.library,this.terms=i.terms||[],this.termDiversity=i.termDiversity||0,i.hash&&(this._hash=i.hash,this._hashString=Util.bytesToBase16(i.hash)),this._definitionPath=i.definitionPath,this._fetched=i.preloaded||!1}isFetched(){return this._fetched}async fetch(){if(this._fetched)return this;let i=await this.library._fetchDefinitionData(this);return this.title=i.title,this.keywords=i.keywordss,this.tags=i.tags,this.link=i.link,this.body=i.body,this.provider=i.provider,this.id=i.id||i.link,this.media=i.media.map(i=>Object.keys(i).map(t=>Object.assign(Object.create(this.library.settings.mediaSets.find(i=>i.extension==t)||{}),{url:`${this.library.baseURL}/${i[t]}`}))),this._fetched=!0,this}}module.exports=SearchResultDefinition;

},{"../util":"/Users/phx/Sync/sign-search/lib/util.js","./definition":"/Users/phx/Sync/sign-search/lib/search-library/definition.js"}],"/Users/phx/Sync/sign-search/lib/user-interface.js":[function(require,module,exports){
const SearchEngine=require("./search-engine/engine"),ResultView=require("./search-engine/view-result"),Paginator=require("./search-engine/view-paginator"),html={},morph=require("nanomorph"),parseDuration=require("parse-duration"),delay=require("delay"),qs=(...e)=>document.querySelector(...e),qsa=(...e)=>document.querySelectorAll(...e);class FindSignUI{constructor(e){this.config=e,this.searchEngine=new SearchEngine(e),this._lastQueryText=null}async load(){await this.searchEngine.load()}awaitReady(){return this.searchEngine.awaitReady()}async addHooks(){window.onhashchange=(()=>this.onHashChange(location.hash.replace(/^#/,""))),qs(this.config.searchForm).onsubmit=(e=>{let t=qs(this.config.searchInput).value;e.preventDefault(),location.href=`#${encodeURIComponent(t)}/0`}),""!=location.hash&&"#"!=location.hash&&this.onHashChange(location.hash.replace(/^#/,""))}onHashChange(e){""==e?this.renderHome(e):this.renderSearch(e)}renderHome(e){location.hash="#",qs("html > body").className="home",qs(this.config.resultsContainer).innerHTML="",qs(this.config.paginationContainer).innerHTML="",qs(this.config.searchInput).value="",qs(this.config.searchInput).focus()}async renderSearch(e){let[t,n]=e.split("/").map(e=>decodeURIComponent(e));if(0==t.trim().length)return location.href="#";if(qs(this.config.searchInput).value=t,this.searchEngine.ready?this.ariaNotice("Loading…","off").focus():this.visualNotice("Loading…"),this._lastQueryText!==t&&(this.results=await this.searchEngine.query(t),this._lastQueryText=t),0==this.results.length)return this.visualNotice("No search results found.","live");qs("html > body").className="results",qs(this.config.resultsContainer).innerHTML="",qs(this.config.paginationContainer).innerHTML="",this.displayResults=this.results.slice(parseInt(n),parseInt(n)+this.config.resultsPerPage);let s=Promise.all(this.displayResults.map(async(e,t)=>{await delay(t*this.config.tileAppendDelay);let n=new ResultView({warnings:this.config.warnings,result:e,onChange:()=>morph(s,n.toHTML())}),s=n.toHTML();qs(this.config.resultsContainer).append(s),this.config.lowRankWarning&&e.distance>this.config.lowRankWarning.threshold&&n.addWarning(this.config.lowRankWarning),n.setData(await e.fetch())}));await s;let i=new Paginator({length:Math.min(this.results.length/this.config.resultsPerPage,this.config.maxPages),selected:Math.floor(parseInt(n)/this.config.resultsPerPage),getURL:e=>`#${encodeURIComponent(t)}/${e*this.config.resultsPerPage}`});morph(qs(this.config.paginationContainer),i.toHTML()),this.ariaNotice("Search results updated.","off").focus()}visualNotice(e,t="polite"){qs("html > body").className="notice",qs(this.config.paginationContainer).innerHTML="";let n=qs(this.config.resultsContainer);n.innerHTML="",n.append(function(){var e=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),t=document.createElement("div");return t.setAttribute("aria-live",arguments[0]),t.setAttribute("class","notice_box"),e(t,[arguments[1]]),t}(t,e))}ariaNotice(e,t="polite"){[...qsa("div.aria_notice")].forEach(e=>e.remove());let n=function(){var e=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),t=document.createElement("div");return t.setAttribute("tabindex","-1"),t.setAttribute("aria-live",arguments[0]),t.setAttribute("style","position: absolute; top: -1000px"),t.setAttribute("class","aria_notice"),e(t,[arguments[1]]),t}(t,e);return qs(this.config.resultsContainer).before(n),n}async renderHashtagList(e){await this.awaitReady();let t=qs(e),n=await this.searchEngine.getTags();t.innerHTML="";for(let e of Object.keys(n).sort((e,t)=>n[t]-n[e]))t.append(function(){var e=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),t=document.createElement("li"),n=document.createElement("a");return n.setAttribute("href",arguments[0]),e(n,["#",arguments[1]]),e(t,[n," (",arguments[2],")"]),t}(`./#${encodeURIComponent(`#${e}`)}/0`,e,n[e]))}}let ui=window.ui=new FindSignUI({languageName:"Auslan",searchLibraryPath:"datasets/search-index",vectorLibraryPath:"datasets/cc-en-300-8bit",resultsPerPage:10,maxPages:8,homeButton:"#header",searchForm:"#search_form",searchInput:"#search_box",resultsContainer:"#results",paginationContainer:"#pagination",tileAppendDelay:parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--fade-time-offset").trim()),warnings:{invented:{type:"invented",text:"Informal, colloqual sign. Professionals should not use."},homesign:{type:"home-sign",text:"This is listed as a Home Sign, not an established widespread part of Auslan."},"home-sign":{type:"home-sign",text:"This is listed as a Home Sign, not an established widespread part of Auslan."}}});"true"==document.body.dataset.hook&&ui.addHooks(),ui.load(),document.body.dataset.hashtagList&&ui.renderHashtagList(document.body.dataset.hashtagList);

},{"./search-engine/engine":"/Users/phx/Sync/sign-search/lib/search-engine/engine.js","./search-engine/view-paginator":"/Users/phx/Sync/sign-search/lib/search-engine/view-paginator.js","./search-engine/view-result":"/Users/phx/Sync/sign-search/lib/search-engine/view-result.js","/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js":"/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js","delay":"/Users/phx/Sync/sign-search/node_modules/delay/index.js","nanomorph":"/Users/phx/Sync/sign-search/node_modules/nanomorph/index.js","parse-duration":"/Users/phx/Sync/sign-search/node_modules/parse-duration/index.js"}],"/Users/phx/Sync/sign-search/lib/util.js":[function(require,module,exports){
(function (Buffer){
let Util={intToBits:(t,e)=>{let r=t.toString(2);return"0".repeat(e-r.length)+r},bitsToInt:t=>parseInt(t,2),sintToBits:(t,e)=>{let r=e-1,i=Math.abs(t).toString(2);return(t<0?"1":"0")+"0".repeat(r-i.length)+i},bitsToSint:t=>{let e=t.slice(0,1),r=t.slice(1),i=parseInt(r,2);return"0"==e?+i:-i},bytesToBits:t=>Array.from(t,t=>Util.intToBits(t,8)).join(""),bitsToBytes:t=>Array.from(Util.chunkIterable(t,8),t=>Util.bitsToInt(t)),bytesToPrefixBits:(t,e=0)=>Util.bytesToBits(t.slice(0,Math.ceil(e/8))).slice(0,e),bytesToBase16:t=>Array.from(t,t=>bytesToBase16Table[t]).join(""),base16ToBytes:t=>new Uint8Array(Array.from(Util.chunkIterable(t,2),t=>parseInt(t,16))),packFloats:(t,e)=>{let r=t.map(t=>Math.round(t*(2**e-1-1))).map(t=>Util.sintToBits(t,e)).join("");return r.length%8!=0&&(r+="0".repeat(8-r.length%8)),Util.bitsToBytes(r)},unpackFloats:(t,e,r)=>{let i=Util.bytesToBits(t);return Util.timesMap(r,t=>{return Util.bitsToSint(i.slice(t*e,(t+1)*e))/(2**e-1-1)})},base16ObjectToUint8Map:t=>Util.objectToMap(t,t=>new Uint8Array(Util.base16ToBytes(t))),objectToMap:(t,e=(t=>t),r=(t=>t))=>{let i=new Map;for(let o in t)i.set(e(o),r(t[o]));return i},encodeUTF8:t=>(this._utf8_encoder||(this._utf8_encoder=new TextEncoder("utf-8")),this._utf8_encoder.encode(t)),decodeUTF8:t=>(this._utf8_decoder||(this._utf8_decoder=new TextDecoder("utf-8")),this._utf8_decoder.decode(t)),times:(t,e)=>{let r=0;for(;r<t;)e(r,t),r+=1},timesMap:(t,e)=>Array.from(Util.timesMapIterable(t,e)),timesMapIterable:function*(t,e){let r=0;for(;r<t;)yield e(r,t),r+=1},chunk:(t,e,r=1/0)=>Array.from(Util.chunkIterable(t,e,r)),chunkIterable:function*(t,e,r=1/0){let i=t[Symbol.iterator]();for(;r>0;){let o=[];for(;o.length<e;){let e=i.next();if(e.done)return void(o.length>0&&(yield"string"==typeof t?o.join(""):o));o.push(e.value)}yield"string"==typeof t?o.join(""):o,r-=1}},fetchLikeFile:async t=>{let e=await fetch(t,{mode:"same-origin"});if(!e.ok)throw new Error(`Server responded with error code! "${e.status}" while loading "${t}" Search Library`);return Buffer.from(await e.arrayBuffer())},digestOnWeb:async(t,e)=>{return t={sha1:"SHA-1",sha256:"SHA-256",sha384:"SHA-384",sha512:"SHA-512"}[t]||t,new Uint8Array(await crypto.subtle.digest(t,e))}};const bytesToBase16Table=Util.timesMap(256,t=>("00"+t.toString(16).toLowerCase()).slice(-2));module.exports=Util;

}).call(this,require("buffer").Buffer)

},{"buffer":"/Users/phx/Sync/sign-search/node_modules/buffer/index.js"}],"/Users/phx/Sync/sign-search/lib/vector-library/library.js":[function(require,module,exports){
(function (Buffer){
const fsutil=require("../util"),cbor=require("borc");class VectorLibrary{constructor(t={}){this.config=t,this.settings={hashFunction:this.config.hashFunction||"sha256",vectorSize:this.config.vectorSize||300,vectorBits:this.config.vectorBits||8,buildTimestamp:this.config.buildTimestamp||Date.now(),prefixBits:this.config.prefixBits||7,shardBits:this.config.shardBits||13}}async open(){return this.settings=JSON.parse(await this.config.fs.readFile(`${this.config.path}/settings.json`)),this}async getWordInfo(t){this.config.textFilter&&(t=this.config.textFilter(t));let i=await this.config.digest(this.settings.hashFunction,fsutil.encodeUTF8(t)),s=parseInt(fsutil.bytesToPrefixBits(i,this.settings.prefixBits),2),e=parseInt(fsutil.bytesToPrefixBits(i,this.settings.shardBits),2);return{filtered:t,prefixID:s,shardID:e,path:`${this.config.path}/shards/${s}/${e}.cbor`}}async addDefinition(t,i){let{path:s,filtered:e}=await this.getWordInfo(t),n=Math.max(...i.map(Math.abs)),a=i.map(t=>t/n),o=fsutil.packFloats(a,this.settings.vectorBits),r=Buffer.concat([e,n,o].map(t=>cbor.encode(t)));await this.config.fs.ensureFile(s),await this.config.fs.appendFile(s,r)}async lookup(t){let{path:i,filtered:s}=await this.getWordInfo(t),e=cbor.decodeAll(await this.config.fs.readFile(i));for(let[t,i,n]of fsutil.chunkIterable(e,3))if(s==t){return fsutil.unpackFloats(n,this.settings.vectorBits,this.settings.vectorSize).map(t=>t*i)}}async save(){await this.config.fs.writeFile(`${this.config.path}/settings.json`,fsutil.encodeUTF8(JSON.stringify(this.settings,null,2)))}}module.exports=VectorLibrary;

}).call(this,require("buffer").Buffer)

},{"../util":"/Users/phx/Sync/sign-search/lib/util.js","borc":"/Users/phx/Sync/sign-search/node_modules/borc/src/index.js","buffer":"/Users/phx/Sync/sign-search/node_modules/buffer/index.js"}],"/Users/phx/Sync/sign-search/lib/vector-utilities.js":[function(require,module,exports){
const VU={add:(...e)=>e.reduce((e,t)=>e.map((e,l)=>e+t[l])),multiply:(e,t)=>e.map(e=>e.map((e,l)=>e*t[l])),mean:(...e)=>VU.multiply([VU.add(...e)],VU.build(1/e.length,e[0].length))[0],build:(e,t)=>{let l=[];for(let r=0;r<t;r++)l.push(e);return l},distanceSquared:(e,t)=>{let l=0;for(let r=0;r<e.length;r++){const d=e[r]-t[r];l+=d*d}return l},diversity:(...e)=>{if(e.length<=1)return[0];let t=VU.mean(...e);return e.map(e=>VU.distanceSquared(e,t))}};"object"==typeof module&&(module.exports=VU);

},{}],"/Users/phx/Sync/sign-search/node_modules/base64-js/index.js":[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],"/Users/phx/Sync/sign-search/node_modules/bignumber.js/bignumber.js":[function(require,module,exports){
;(function (globalObject) {
  'use strict';

/*
 *      bignumber.js v9.0.0
 *      A JavaScript library for arbitrary-precision arithmetic.
 *      https://github.com/MikeMcl/bignumber.js
 *      Copyright (c) 2019 Michael Mclaughlin <M8ch88l@gmail.com>
 *      MIT Licensed.
 *
 *      BigNumber.prototype methods     |  BigNumber methods
 *                                      |
 *      absoluteValue            abs    |  clone
 *      comparedTo                      |  config               set
 *      decimalPlaces            dp     |      DECIMAL_PLACES
 *      dividedBy                div    |      ROUNDING_MODE
 *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
 *      exponentiatedBy          pow    |      RANGE
 *      integerValue                    |      CRYPTO
 *      isEqualTo                eq     |      MODULO_MODE
 *      isFinite                        |      POW_PRECISION
 *      isGreaterThan            gt     |      FORMAT
 *      isGreaterThanOrEqualTo   gte    |      ALPHABET
 *      isInteger                       |  isBigNumber
 *      isLessThan               lt     |  maximum              max
 *      isLessThanOrEqualTo      lte    |  minimum              min
 *      isNaN                           |  random
 *      isNegative                      |  sum
 *      isPositive                      |
 *      isZero                          |
 *      minus                           |
 *      modulo                   mod    |
 *      multipliedBy             times  |
 *      negated                         |
 *      plus                            |
 *      precision                sd     |
 *      shiftedBy                       |
 *      squareRoot               sqrt   |
 *      toExponential                   |
 *      toFixed                         |
 *      toFormat                        |
 *      toFraction                      |
 *      toJSON                          |
 *      toNumber                        |
 *      toPrecision                     |
 *      toString                        |
 *      valueOf                         |
 *
 */


  var BigNumber,
    isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
    mathceil = Math.ceil,
    mathfloor = Math.floor,

    bignumberError = '[BigNumber Error] ',
    tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

    BASE = 1e14,
    LOG_BASE = 14,
    MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
    // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
    POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    SQRT_BASE = 1e7,

    // EDITABLE
    // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
    // the arguments to toExponential, toFixed, toFormat, and toPrecision.
    MAX = 1E9;                                   // 0 to MAX_INT32


  /*
   * Create and return a BigNumber constructor.
   */
  function clone(configObject) {
    var div, convertBase, parseNumeric,
      P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
      ONE = new BigNumber(1),


      //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


      // The default values below must be integers within the inclusive ranges stated.
      // The values can also be changed at run-time using BigNumber.set.

      // The maximum number of decimal places for operations involving division.
      DECIMAL_PLACES = 20,                     // 0 to MAX

      // The rounding mode used when rounding to the above decimal places, and when using
      // toExponential, toFixed, toFormat and toPrecision, and round (default value).
      // UP         0 Away from zero.
      // DOWN       1 Towards zero.
      // CEIL       2 Towards +Infinity.
      // FLOOR      3 Towards -Infinity.
      // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
      // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
      // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
      // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
      // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
      ROUNDING_MODE = 4,                       // 0 to 8

      // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

      // The exponent value at and beneath which toString returns exponential notation.
      // Number type: -7
      TO_EXP_NEG = -7,                         // 0 to -MAX

      // The exponent value at and above which toString returns exponential notation.
      // Number type: 21
      TO_EXP_POS = 21,                         // 0 to MAX

      // RANGE : [MIN_EXP, MAX_EXP]

      // The minimum exponent value, beneath which underflow to zero occurs.
      // Number type: -324  (5e-324)
      MIN_EXP = -1e7,                          // -1 to -MAX

      // The maximum exponent value, above which overflow to Infinity occurs.
      // Number type:  308  (1.7976931348623157e+308)
      // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
      MAX_EXP = 1e7,                           // 1 to MAX

      // Whether to use cryptographically-secure random number generation, if available.
      CRYPTO = false,                          // true or false

      // The modulo mode used when calculating the modulus: a mod n.
      // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
      // The remainder (r) is calculated as: r = a - n * q.
      //
      // UP        0 The remainder is positive if the dividend is negative, else is negative.
      // DOWN      1 The remainder has the same sign as the dividend.
      //             This modulo mode is commonly known as 'truncated division' and is
      //             equivalent to (a % n) in JavaScript.
      // FLOOR     3 The remainder has the same sign as the divisor (Python %).
      // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
      // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
      //             The remainder is always positive.
      //
      // The truncated division, floored division, Euclidian division and IEEE 754 remainder
      // modes are commonly used for the modulus operation.
      // Although the other rounding modes can also be used, they may not give useful results.
      MODULO_MODE = 1,                         // 0 to 9

      // The maximum number of significant digits of the result of the exponentiatedBy operation.
      // If POW_PRECISION is 0, there will be unlimited significant digits.
      POW_PRECISION = 0,                    // 0 to MAX

      // The format specification used by the BigNumber.prototype.toFormat method.
      FORMAT = {
        prefix: '',
        groupSize: 3,
        secondaryGroupSize: 0,
        groupSeparator: ',',
        decimalSeparator: '.',
        fractionGroupSize: 0,
        fractionGroupSeparator: '\xA0',      // non-breaking space
        suffix: ''
      },

      // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
      // '-', '.', whitespace, or repeated character.
      // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
      ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';


    //------------------------------------------------------------------------------------------


    // CONSTRUCTOR


    /*
     * The BigNumber constructor and exported function.
     * Create and return a new instance of a BigNumber object.
     *
     * v {number|string|BigNumber} A numeric value.
     * [b] {number} The base of v. Integer, 2 to ALPHABET.length inclusive.
     */
    function BigNumber(v, b) {
      var alphabet, c, caseChanged, e, i, isNum, len, str,
        x = this;

      // Enable constructor call without `new`.
      if (!(x instanceof BigNumber)) return new BigNumber(v, b);

      if (b == null) {

        if (v && v._isBigNumber === true) {
          x.s = v.s;

          if (!v.c || v.e > MAX_EXP) {
            x.c = x.e = null;
          } else if (v.e < MIN_EXP) {
            x.c = [x.e = 0];
          } else {
            x.e = v.e;
            x.c = v.c.slice();
          }

          return;
        }

        if ((isNum = typeof v == 'number') && v * 0 == 0) {

          // Use `1 / n` to handle minus zero also.
          x.s = 1 / v < 0 ? (v = -v, -1) : 1;

          // Fast path for integers, where n < 2147483648 (2**31).
          if (v === ~~v) {
            for (e = 0, i = v; i >= 10; i /= 10, e++);

            if (e > MAX_EXP) {
              x.c = x.e = null;
            } else {
              x.e = e;
              x.c = [v];
            }

            return;
          }

          str = String(v);
        } else {

          if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);

          x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
        }

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +str.slice(i + 1);
          str = str.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = str.length;
        }

      } else {

        // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
        intCheck(b, 2, ALPHABET.length, 'Base');

        // Allow exponential notation to be used with base 10 argument, while
        // also rounding to DECIMAL_PLACES as with other bases.
        if (b == 10) {
          x = new BigNumber(v);
          return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
        }

        str = String(v);

        if (isNum = typeof v == 'number') {

          // Avoid potential interpretation of Infinity and NaN as base 44+ values.
          if (v * 0 != 0) return parseNumeric(x, str, isNum, b);

          x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;

          // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
          if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
            throw Error
             (tooManyDigits + v);
          }
        } else {
          x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
        }

        alphabet = ALPHABET.slice(0, b);
        e = i = 0;

        // Check that str is a valid base b number.
        // Don't use RegExp, so alphabet can contain special characters.
        for (len = str.length; i < len; i++) {
          if (alphabet.indexOf(c = str.charAt(i)) < 0) {
            if (c == '.') {

              // If '.' is not the first character and it has not be found before.
              if (i > e) {
                e = len;
                continue;
              }
            } else if (!caseChanged) {

              // Allow e.g. hexadecimal 'FF' as well as 'ff'.
              if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                  str == str.toLowerCase() && (str = str.toUpperCase())) {
                caseChanged = true;
                i = -1;
                e = 0;
                continue;
              }
            }

            return parseNumeric(x, String(v), isNum, b);
          }
        }

        // Prevent later check for length on converted number.
        isNum = false;
        str = convertBase(str, b, 10, x.s);

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
        else e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(--len) === 48;);

      if (str = str.slice(i, ++len)) {
        len -= i;

        // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
        if (isNum && BigNumber.DEBUG &&
          len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
            throw Error
             (tooManyDigits + (x.s * v));
        }

         // Overflow?
        if ((e = e - i - 1) > MAX_EXP) {

          // Infinity.
          x.c = x.e = null;

        // Underflow?
        } else if (e < MIN_EXP) {

          // Zero.
          x.c = [x.e = 0];
        } else {
          x.e = e;
          x.c = [];

          // Transform base

          // e is the base 10 exponent.
          // i is where to slice str to get the first element of the coefficient array.
          i = (e + 1) % LOG_BASE;
          if (e < 0) i += LOG_BASE;  // i < 1

          if (i < len) {
            if (i) x.c.push(+str.slice(0, i));

            for (len -= LOG_BASE; i < len;) {
              x.c.push(+str.slice(i, i += LOG_BASE));
            }

            i = LOG_BASE - (str = str.slice(i)).length;
          } else {
            i -= len;
          }

          for (; i--; str += '0');
          x.c.push(+str);
        }
      } else {

        // Zero.
        x.c = [x.e = 0];
      }
    }


    // CONSTRUCTOR PROPERTIES


    BigNumber.clone = clone;

    BigNumber.ROUND_UP = 0;
    BigNumber.ROUND_DOWN = 1;
    BigNumber.ROUND_CEIL = 2;
    BigNumber.ROUND_FLOOR = 3;
    BigNumber.ROUND_HALF_UP = 4;
    BigNumber.ROUND_HALF_DOWN = 5;
    BigNumber.ROUND_HALF_EVEN = 6;
    BigNumber.ROUND_HALF_CEIL = 7;
    BigNumber.ROUND_HALF_FLOOR = 8;
    BigNumber.EUCLID = 9;


    /*
     * Configure infrequently-changing library-wide settings.
     *
     * Accept an object with the following optional properties (if the value of a property is
     * a number, it must be an integer within the inclusive range stated):
     *
     *   DECIMAL_PLACES   {number}           0 to MAX
     *   ROUNDING_MODE    {number}           0 to 8
     *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
     *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
     *   CRYPTO           {boolean}          true or false
     *   MODULO_MODE      {number}           0 to 9
     *   POW_PRECISION       {number}           0 to MAX
     *   ALPHABET         {string}           A string of two or more unique characters which does
     *                                       not contain '.'.
     *   FORMAT           {object}           An object with some of the following properties:
     *     prefix                 {string}
     *     groupSize              {number}
     *     secondaryGroupSize     {number}
     *     groupSeparator         {string}
     *     decimalSeparator       {string}
     *     fractionGroupSize      {number}
     *     fractionGroupSeparator {string}
     *     suffix                 {string}
     *
     * (The values assigned to the above FORMAT object properties are not checked for validity.)
     *
     * E.g.
     * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
     *
     * Ignore properties/parameters set to null or undefined, except for ALPHABET.
     *
     * Return an object with the properties current values.
     */
    BigNumber.config = BigNumber.set = function (obj) {
      var p, v;

      if (obj != null) {

        if (typeof obj == 'object') {

          // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            DECIMAL_PLACES = v;
          }

          // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
          // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
            v = obj[p];
            intCheck(v, 0, 8, p);
            ROUNDING_MODE = v;
          }

          // EXPONENTIAL_AT {number|number[]}
          // Integer, -MAX to MAX inclusive or
          // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
          // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, 0, p);
              intCheck(v[1], 0, MAX, p);
              TO_EXP_NEG = v[0];
              TO_EXP_POS = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
            }
          }

          // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
          // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
          // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
          if (obj.hasOwnProperty(p = 'RANGE')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, -1, p);
              intCheck(v[1], 1, MAX, p);
              MIN_EXP = v[0];
              MAX_EXP = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              if (v) {
                MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
              } else {
                throw Error
                 (bignumberError + p + ' cannot be zero: ' + v);
              }
            }
          }

          // CRYPTO {boolean} true or false.
          // '[BigNumber Error] CRYPTO not true or false: {v}'
          // '[BigNumber Error] crypto unavailable'
          if (obj.hasOwnProperty(p = 'CRYPTO')) {
            v = obj[p];
            if (v === !!v) {
              if (v) {
                if (typeof crypto != 'undefined' && crypto &&
                 (crypto.getRandomValues || crypto.randomBytes)) {
                  CRYPTO = v;
                } else {
                  CRYPTO = !v;
                  throw Error
                   (bignumberError + 'crypto unavailable');
                }
              } else {
                CRYPTO = v;
              }
            } else {
              throw Error
               (bignumberError + p + ' not true or false: ' + v);
            }
          }

          // MODULO_MODE {number} Integer, 0 to 9 inclusive.
          // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
            v = obj[p];
            intCheck(v, 0, 9, p);
            MODULO_MODE = v;
          }

          // POW_PRECISION {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            POW_PRECISION = v;
          }

          // FORMAT {object}
          // '[BigNumber Error] FORMAT not an object: {v}'
          if (obj.hasOwnProperty(p = 'FORMAT')) {
            v = obj[p];
            if (typeof v == 'object') FORMAT = v;
            else throw Error
             (bignumberError + p + ' not an object: ' + v);
          }

          // ALPHABET {string}
          // '[BigNumber Error] ALPHABET invalid: {v}'
          if (obj.hasOwnProperty(p = 'ALPHABET')) {
            v = obj[p];

            // Disallow if only one character,
            // or if it contains '+', '-', '.', whitespace, or a repeated character.
            if (typeof v == 'string' && !/^.$|[+-.\s]|(.).*\1/.test(v)) {
              ALPHABET = v;
            } else {
              throw Error
               (bignumberError + p + ' invalid: ' + v);
            }
          }

        } else {

          // '[BigNumber Error] Object expected: {v}'
          throw Error
           (bignumberError + 'Object expected: ' + obj);
        }
      }

      return {
        DECIMAL_PLACES: DECIMAL_PLACES,
        ROUNDING_MODE: ROUNDING_MODE,
        EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
        RANGE: [MIN_EXP, MAX_EXP],
        CRYPTO: CRYPTO,
        MODULO_MODE: MODULO_MODE,
        POW_PRECISION: POW_PRECISION,
        FORMAT: FORMAT,
        ALPHABET: ALPHABET
      };
    };


    /*
     * Return true if v is a BigNumber instance, otherwise return false.
     *
     * If BigNumber.DEBUG is true, throw if a BigNumber instance is not well-formed.
     *
     * v {any}
     *
     * '[BigNumber Error] Invalid BigNumber: {v}'
     */
    BigNumber.isBigNumber = function (v) {
      if (!v || v._isBigNumber !== true) return false;
      if (!BigNumber.DEBUG) return true;

      var i, n,
        c = v.c,
        e = v.e,
        s = v.s;

      out: if ({}.toString.call(c) == '[object Array]') {

        if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {

          // If the first element is zero, the BigNumber value must be zero.
          if (c[0] === 0) {
            if (e === 0 && c.length === 1) return true;
            break out;
          }

          // Calculate number of digits that c[0] should have, based on the exponent.
          i = (e + 1) % LOG_BASE;
          if (i < 1) i += LOG_BASE;

          // Calculate number of digits of c[0].
          //if (Math.ceil(Math.log(c[0] + 1) / Math.LN10) == i) {
          if (String(c[0]).length == i) {

            for (i = 0; i < c.length; i++) {
              n = c[i];
              if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
            }

            // Last element cannot be zero, unless it is the only element.
            if (n !== 0) return true;
          }
        }

      // Infinity/NaN
      } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
        return true;
      }

      throw Error
        (bignumberError + 'Invalid BigNumber: ' + v);
    };


    /*
     * Return a new BigNumber whose value is the maximum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.maximum = BigNumber.max = function () {
      return maxOrMin(arguments, P.lt);
    };


    /*
     * Return a new BigNumber whose value is the minimum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.minimum = BigNumber.min = function () {
      return maxOrMin(arguments, P.gt);
    };


    /*
     * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
     * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
     * zeros are produced).
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
     * '[BigNumber Error] crypto unavailable'
     */
    BigNumber.random = (function () {
      var pow2_53 = 0x20000000000000;

      // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
      // Check if Math.random() produces more than 32 bits of randomness.
      // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
      // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
      var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
       ? function () { return mathfloor(Math.random() * pow2_53); }
       : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
         (Math.random() * 0x800000 | 0); };

      return function (dp) {
        var a, b, e, k, v,
          i = 0,
          c = [],
          rand = new BigNumber(ONE);

        if (dp == null) dp = DECIMAL_PLACES;
        else intCheck(dp, 0, MAX);

        k = mathceil(dp / LOG_BASE);

        if (CRYPTO) {

          // Browsers supporting crypto.getRandomValues.
          if (crypto.getRandomValues) {

            a = crypto.getRandomValues(new Uint32Array(k *= 2));

            for (; i < k;) {

              // 53 bits:
              // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
              // 11111 11111111 11111111 11111111 11100000 00000000 00000000
              // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
              //                                     11111 11111111 11111111
              // 0x20000 is 2^21.
              v = a[i] * 0x20000 + (a[i + 1] >>> 11);

              // Rejection sampling:
              // 0 <= v < 9007199254740992
              // Probability that v >= 9e15, is
              // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
              if (v >= 9e15) {
                b = crypto.getRandomValues(new Uint32Array(2));
                a[i] = b[0];
                a[i + 1] = b[1];
              } else {

                // 0 <= v <= 8999999999999999
                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 2;
              }
            }
            i = k / 2;

          // Node.js supporting crypto.randomBytes.
          } else if (crypto.randomBytes) {

            // buffer
            a = crypto.randomBytes(k *= 7);

            for (; i < k;) {

              // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
              // 0x100000000 is 2^32, 0x1000000 is 2^24
              // 11111 11111111 11111111 11111111 11111111 11111111 11111111
              // 0 <= v < 9007199254740992
              v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                 (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                 (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

              if (v >= 9e15) {
                crypto.randomBytes(7).copy(a, i);
              } else {

                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 7;
              }
            }
            i = k / 7;
          } else {
            CRYPTO = false;
            throw Error
             (bignumberError + 'crypto unavailable');
          }
        }

        // Use Math.random.
        if (!CRYPTO) {

          for (; i < k;) {
            v = random53bitInt();
            if (v < 9e15) c[i++] = v % 1e14;
          }
        }

        k = c[--i];
        dp %= LOG_BASE;

        // Convert trailing digits to zeros according to dp.
        if (k && dp) {
          v = POWS_TEN[LOG_BASE - dp];
          c[i] = mathfloor(k / v) * v;
        }

        // Remove trailing elements which are zero.
        for (; c[i] === 0; c.pop(), i--);

        // Zero?
        if (i < 0) {
          c = [e = 0];
        } else {

          // Remove leading elements which are zero and adjust exponent accordingly.
          for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

          // Count the digits of the first element of c to determine leading zeros, and...
          for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

          // adjust the exponent accordingly.
          if (i < LOG_BASE) e -= LOG_BASE - i;
        }

        rand.e = e;
        rand.c = c;
        return rand;
      };
    })();


    /*
     * Return a BigNumber whose value is the sum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.sum = function () {
      var i = 1,
        args = arguments,
        sum = new BigNumber(args[0]);
      for (; i < args.length;) sum = sum.plus(args[i++]);
      return sum;
    };


    // PRIVATE FUNCTIONS


    // Called by BigNumber and BigNumber.prototype.toString.
    convertBase = (function () {
      var decimal = '0123456789';

      /*
       * Convert string of baseIn to an array of numbers of baseOut.
       * Eg. toBaseOut('255', 10, 16) returns [15, 15].
       * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
       */
      function toBaseOut(str, baseIn, baseOut, alphabet) {
        var j,
          arr = [0],
          arrL,
          i = 0,
          len = str.length;

        for (; i < len;) {
          for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

          arr[0] += alphabet.indexOf(str.charAt(i++));

          for (j = 0; j < arr.length; j++) {

            if (arr[j] > baseOut - 1) {
              if (arr[j + 1] == null) arr[j + 1] = 0;
              arr[j + 1] += arr[j] / baseOut | 0;
              arr[j] %= baseOut;
            }
          }
        }

        return arr.reverse();
      }

      // Convert a numeric string of baseIn to a numeric string of baseOut.
      // If the caller is toString, we are converting from base 10 to baseOut.
      // If the caller is BigNumber, we are converting from baseIn to base 10.
      return function (str, baseIn, baseOut, sign, callerIsToString) {
        var alphabet, d, e, k, r, x, xc, y,
          i = str.indexOf('.'),
          dp = DECIMAL_PLACES,
          rm = ROUNDING_MODE;

        // Non-integer.
        if (i >= 0) {
          k = POW_PRECISION;

          // Unlimited precision.
          POW_PRECISION = 0;
          str = str.replace('.', '');
          y = new BigNumber(baseIn);
          x = y.pow(str.length - i);
          POW_PRECISION = k;

          // Convert str as if an integer, then restore the fraction part by dividing the
          // result by its base raised to a power.

          y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
           10, baseOut, decimal);
          y.e = y.c.length;
        }

        // Convert the number as integer.

        xc = toBaseOut(str, baseIn, baseOut, callerIsToString
         ? (alphabet = ALPHABET, decimal)
         : (alphabet = decimal, ALPHABET));

        // xc now represents str as an integer and converted to baseOut. e is the exponent.
        e = k = xc.length;

        // Remove trailing zeros.
        for (; xc[--k] == 0; xc.pop());

        // Zero?
        if (!xc[0]) return alphabet.charAt(0);

        // Does str represent an integer? If so, no need for the division.
        if (i < 0) {
          --e;
        } else {
          x.c = xc;
          x.e = e;

          // The sign is needed for correct rounding.
          x.s = sign;
          x = div(x, y, dp, rm, baseOut);
          xc = x.c;
          r = x.r;
          e = x.e;
        }

        // xc now represents str converted to baseOut.

        // THe index of the rounding digit.
        d = e + dp + 1;

        // The rounding digit: the digit to the right of the digit that may be rounded up.
        i = xc[d];

        // Look at the rounding digits and mode to determine whether to round up.

        k = baseOut / 2;
        r = r || d < 0 || xc[d + 1] != null;

        r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
              : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
               rm == (x.s < 0 ? 8 : 7));

        // If the index of the rounding digit is not greater than zero, or xc represents
        // zero, then the result of the base conversion is zero or, if rounding up, a value
        // such as 0.00001.
        if (d < 1 || !xc[0]) {

          // 1^-dp or 0
          str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
        } else {

          // Truncate xc to the required number of decimal places.
          xc.length = d;

          // Round up?
          if (r) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (--baseOut; ++xc[--d] > baseOut;) {
              xc[d] = 0;

              if (!d) {
                ++e;
                xc = [1].concat(xc);
              }
            }
          }

          // Determine trailing zeros.
          for (k = xc.length; !xc[--k];);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

          // Add leading zeros, decimal point and trailing zeros as required.
          str = toFixedPoint(str, e, alphabet.charAt(0));
        }

        // The caller will add the sign.
        return str;
      };
    })();


    // Perform division in the specified base. Called by div and convertBase.
    div = (function () {

      // Assume non-zero x and k.
      function multiply(x, k, base) {
        var m, temp, xlo, xhi,
          carry = 0,
          i = x.length,
          klo = k % SQRT_BASE,
          khi = k / SQRT_BASE | 0;

        for (x = x.slice(); i--;) {
          xlo = x[i] % SQRT_BASE;
          xhi = x[i] / SQRT_BASE | 0;
          m = khi * xlo + xhi * klo;
          temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
          carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
          x[i] = temp % base;
        }

        if (carry) x = [carry].concat(x);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, cmp;

        if (aL != bL) {
          cmp = aL > bL ? 1 : -1;
        } else {

          for (i = cmp = 0; i < aL; i++) {

            if (a[i] != b[i]) {
              cmp = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return cmp;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1; a.splice(0, 1));
      }

      // x: dividend, y: divisor.
      return function (x, y, dp, rm, base) {
        var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
          yL, yz,
          s = x.s == y.s ? 1 : -1,
          xc = x.c,
          yc = y.c;

        // Either NaN, Infinity or 0?
        if (!xc || !xc[0] || !yc || !yc[0]) {

          return new BigNumber(

           // Return NaN if either NaN, or both Infinity or 0.
           !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

            // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
            xc && xc[0] == 0 || !yc ? s * 0 : s / 0
         );
        }

        q = new BigNumber(s);
        qc = q.c = [];
        e = x.e - y.e;
        s = dp + e + 1;

        if (!base) {
          base = BASE;
          e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
          s = s / LOG_BASE | 0;
        }

        // Result exponent may be one less then the current value of e.
        // The coefficients of the BigNumbers from convertBase may have trailing zeros.
        for (i = 0; yc[i] == (xc[i] || 0); i++);

        if (yc[i] > (xc[i] || 0)) e--;

        if (s < 0) {
          qc.push(1);
          more = true;
        } else {
          xL = xc.length;
          yL = yc.length;
          i = 0;
          s += 2;

          // Normalise xc and yc so highest order digit of yc is >= base / 2.

          n = mathfloor(base / (yc[0] + 1));

          // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
          // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
          if (n > 1) {
            yc = multiply(yc, n, base);
            xc = multiply(xc, n, base);
            yL = yc.length;
            xL = xc.length;
          }

          xi = yL;
          rem = xc.slice(0, yL);
          remL = rem.length;

          // Add zeros to make remainder as long as divisor.
          for (; remL < yL; rem[remL++] = 0);
          yz = yc.slice();
          yz = [0].concat(yz);
          yc0 = yc[0];
          if (yc[1] >= base / 2) yc0++;
          // Not necessary, but to prevent trial digit n > base, when using base 3.
          // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

          do {
            n = 0;

            // Compare divisor and remainder.
            cmp = compare(yc, rem, yL, remL);

            // If divisor < remainder.
            if (cmp < 0) {

              // Calculate trial digit, n.

              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

              // n is how many times the divisor goes into the current remainder.
              n = mathfloor(rem0 / yc0);

              //  Algorithm:
              //  product = divisor multiplied by trial digit (n).
              //  Compare product and remainder.
              //  If product is greater than remainder:
              //    Subtract divisor from product, decrement trial digit.
              //  Subtract product from remainder.
              //  If product was less than remainder at the last compare:
              //    Compare new remainder and divisor.
              //    If remainder is greater than divisor:
              //      Subtract divisor from remainder, increment trial digit.

              if (n > 1) {

                // n may be > base only when base is 3.
                if (n >= base) n = base - 1;

                // product = divisor * trial digit.
                prod = multiply(yc, n, base);
                prodL = prod.length;
                remL = rem.length;

                // Compare product and remainder.
                // If product > remainder then trial digit n too high.
                // n is 1 too high about 5% of the time, and is not known to have
                // ever been more than 1 too high.
                while (compare(prod, rem, prodL, remL) == 1) {
                  n--;

                  // Subtract divisor from product.
                  subtract(prod, yL < prodL ? yz : yc, prodL, base);
                  prodL = prod.length;
                  cmp = 1;
                }
              } else {

                // n is 0 or 1, cmp is -1.
                // If n is 0, there is no need to compare yc and rem again below,
                // so change cmp to 1 to avoid it.
                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                if (n == 0) {

                  // divisor < remainder, so n must be at least 1.
                  cmp = n = 1;
                }

                // product = divisor
                prod = yc.slice();
                prodL = prod.length;
              }

              if (prodL < remL) prod = [0].concat(prod);

              // Subtract product from remainder.
              subtract(rem, prod, remL, base);
              remL = rem.length;

               // If product was < remainder.
              if (cmp == -1) {

                // Compare divisor and new remainder.
                // If divisor < new remainder, subtract divisor from remainder.
                // Trial digit n too low.
                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                while (compare(yc, rem, yL, remL) < 1) {
                  n++;

                  // Subtract divisor from remainder.
                  subtract(rem, yL < remL ? yz : yc, remL, base);
                  remL = rem.length;
                }
              }
            } else if (cmp === 0) {
              n++;
              rem = [0];
            } // else cmp === 1 and n will be 0

            // Add the next digit, n, to the result array.
            qc[i++] = n;

            // Update the remainder.
            if (rem[0]) {
              rem[remL++] = xc[xi] || 0;
            } else {
              rem = [xc[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] != null) && s--);

          more = rem[0] != null;

          // Leading zero?
          if (!qc[0]) qc.splice(0, 1);
        }

        if (base == BASE) {

          // To calculate q.e, first get the number of digits of qc[0].
          for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

          round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

        // Caller is convertBase.
        } else {
          q.e = e;
          q.r = +more;
        }

        return q;
      };
    })();


    /*
     * Return a string representing the value of BigNumber n in fixed-point or exponential
     * notation rounded to the specified decimal places or significant digits.
     *
     * n: a BigNumber.
     * i: the index of the last digit required (i.e. the digit that may be rounded up).
     * rm: the rounding mode.
     * id: 1 (toExponential) or 2 (toPrecision).
     */
    function format(n, i, rm, id) {
      var c0, e, ne, len, str;

      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);

      if (!n.c) return n.toString();

      c0 = n.c[0];
      ne = n.e;

      if (i == null) {
        str = coeffToString(n.c);
        str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS)
         ? toExponential(str, ne)
         : toFixedPoint(str, ne, '0');
      } else {
        n = round(new BigNumber(n), i, rm);

        // n.e may have changed if the value was rounded up.
        e = n.e;

        str = coeffToString(n.c);
        len = str.length;

        // toPrecision returns exponential notation if the number of significant digits
        // specified is less than the number of digits necessary to represent the integer
        // part of the value in fixed-point notation.

        // Exponential notation.
        if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

          // Append zeros?
          for (; len < i; str += '0', len++);
          str = toExponential(str, e);

        // Fixed-point notation.
        } else {
          i -= ne;
          str = toFixedPoint(str, e, '0');

          // Append zeros?
          if (e + 1 > len) {
            if (--i > 0) for (str += '.'; i--; str += '0');
          } else {
            i += e - len;
            if (i > 0) {
              if (e + 1 == len) str += '.';
              for (; i--; str += '0');
            }
          }
        }
      }

      return n.s < 0 && c0 ? '-' + str : str;
    }


    // Handle BigNumber.max and BigNumber.min.
    function maxOrMin(args, method) {
      var n,
        i = 1,
        m = new BigNumber(args[0]);

      for (; i < args.length; i++) {
        n = new BigNumber(args[i]);

        // If any number is NaN, return NaN.
        if (!n.s) {
          m = n;
          break;
        } else if (method.call(m, n)) {
          m = n;
        }
      }

      return m;
    }


    /*
     * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
     * Called by minus, plus and times.
     */
    function normalise(n, c, e) {
      var i = 1,
        j = c.length;

       // Remove trailing zeros.
      for (; !c[--j]; c.pop());

      // Calculate the base 10 exponent. First get the number of digits of c[0].
      for (j = c[0]; j >= 10; j /= 10, i++);

      // Overflow?
      if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

        // Infinity.
        n.c = n.e = null;

      // Underflow?
      } else if (e < MIN_EXP) {

        // Zero.
        n.c = [n.e = 0];
      } else {
        n.e = e;
        n.c = c;
      }

      return n;
    }


    // Handle values that fail the validity test in BigNumber.
    parseNumeric = (function () {
      var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
        dotAfter = /^([^.]+)\.$/,
        dotBefore = /^\.([^.]+)$/,
        isInfinityOrNaN = /^-?(Infinity|NaN)$/,
        whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

      return function (x, str, isNum, b) {
        var base,
          s = isNum ? str : str.replace(whitespaceOrPlus, '');

        // No exception on ±Infinity or NaN.
        if (isInfinityOrNaN.test(s)) {
          x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
        } else {
          if (!isNum) {

            // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
            s = s.replace(basePrefix, function (m, p1, p2) {
              base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
              return !b || b == base ? p1 : m;
            });

            if (b) {
              base = b;

              // E.g. '1.' to '1', '.1' to '0.1'
              s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
            }

            if (str != s) return new BigNumber(s, base);
          }

          // '[BigNumber Error] Not a number: {n}'
          // '[BigNumber Error] Not a base {b} number: {n}'
          if (BigNumber.DEBUG) {
            throw Error
              (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
          }

          // NaN
          x.s = null;
        }

        x.c = x.e = null;
      }
    })();


    /*
     * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
     * If r is truthy, it is known that there are more digits after the rounding digit.
     */
    function round(x, sd, rm, r) {
      var d, i, j, k, n, ni, rd,
        xc = x.c,
        pows10 = POWS_TEN;

      // if x is not Infinity or NaN...
      if (xc) {

        // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
        // n is a base 1e14 number, the value of the element of array x.c containing rd.
        // ni is the index of n within x.c.
        // d is the number of digits of n.
        // i is the index of rd within n including leading zeros.
        // j is the actual index of rd within n (if < 0, rd is a leading zero).
        out: {

          // Get the number of digits of the first element of xc.
          for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
          i = sd - d;

          // If the rounding digit is in the first element of xc...
          if (i < 0) {
            i += LOG_BASE;
            j = sd;
            n = xc[ni = 0];

            // Get the rounding digit at index j of n.
            rd = n / pows10[d - j - 1] % 10 | 0;
          } else {
            ni = mathceil((i + 1) / LOG_BASE);

            if (ni >= xc.length) {

              if (r) {

                // Needed by sqrt.
                for (; xc.length <= ni; xc.push(0));
                n = rd = 0;
                d = 1;
                i %= LOG_BASE;
                j = i - LOG_BASE + 1;
              } else {
                break out;
              }
            } else {
              n = k = xc[ni];

              // Get the number of digits of n.
              for (d = 1; k >= 10; k /= 10, d++);

              // Get the index of rd within n.
              i %= LOG_BASE;

              // Get the index of rd within n, adjusted for leading zeros.
              // The number of leading zeros of n is given by LOG_BASE - d.
              j = i - LOG_BASE + d;

              // Get the rounding digit at index j of n.
              rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
            }
          }

          r = r || sd < 0 ||

          // Are there any non-zero digits after the rounding digit?
          // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
          // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
           xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

          r = rm < 4
           ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
           : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
             rm == (x.s < 0 ? 8 : 7));

          if (sd < 1 || !xc[0]) {
            xc.length = 0;

            if (r) {

              // Convert sd to decimal places.
              sd -= x.e + 1;

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
              x.e = -sd || 0;
            } else {

              // Zero.
              xc[0] = x.e = 0;
            }

            return x;
          }

          // Remove excess digits.
          if (i == 0) {
            xc.length = ni;
            k = 1;
            ni--;
          } else {
            xc.length = ni + 1;
            k = pows10[LOG_BASE - i];

            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of n.
            xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
          }

          // Round up?
          if (r) {

            for (; ;) {

              // If the digit to be rounded up is in the first element of xc...
              if (ni == 0) {

                // i will be the length of xc[0] before k is added.
                for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                j = xc[0] += k;
                for (k = 1; j >= 10; j /= 10, k++);

                // if i != k the length has increased.
                if (i != k) {
                  x.e++;
                  if (xc[0] == BASE) xc[0] = 1;
                }

                break;
              } else {
                xc[ni] += k;
                if (xc[ni] != BASE) break;
                xc[ni--] = 0;
                k = 1;
              }
            }
          }

          // Remove trailing zeros.
          for (i = xc.length; xc[--i] === 0; xc.pop());
        }

        // Overflow? Infinity.
        if (x.e > MAX_EXP) {
          x.c = x.e = null;

        // Underflow? Zero.
        } else if (x.e < MIN_EXP) {
          x.c = [x.e = 0];
        }
      }

      return x;
    }


    function valueOf(n) {
      var str,
        e = n.e;

      if (e === null) return n.toString();

      str = coeffToString(n.c);

      str = e <= TO_EXP_NEG || e >= TO_EXP_POS
        ? toExponential(str, e)
        : toFixedPoint(str, e, '0');

      return n.s < 0 ? '-' + str : str;
    }


    // PROTOTYPE/INSTANCE METHODS


    /*
     * Return a new BigNumber whose value is the absolute value of this BigNumber.
     */
    P.absoluteValue = P.abs = function () {
      var x = new BigNumber(this);
      if (x.s < 0) x.s = 1;
      return x;
    };


    /*
     * Return
     *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
     *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
     *   0 if they have the same value,
     *   or null if the value of either is NaN.
     */
    P.comparedTo = function (y, b) {
      return compare(this, new BigNumber(y, b));
    };


    /*
     * If dp is undefined or null or true or false, return the number of decimal places of the
     * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     *
     * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.decimalPlaces = P.dp = function (dp, rm) {
      var c, n, v,
        x = this;

      if (dp != null) {
        intCheck(dp, 0, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), dp + x.e + 1, rm);
      }

      if (!(c = x.c)) return null;
      n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

      // Subtract the number of trailing zeros of the last number.
      if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
      if (n < 0) n = 0;

      return n;
    };


    /*
     *  n / 0 = I
     *  n / N = N
     *  n / I = 0
     *  0 / n = 0
     *  0 / 0 = N
     *  0 / N = N
     *  0 / I = 0
     *  N / n = N
     *  N / 0 = N
     *  N / N = N
     *  N / I = N
     *  I / n = I
     *  I / 0 = I
     *  I / N = N
     *  I / I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
     * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.dividedBy = P.div = function (y, b) {
      return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
    };


    /*
     * Return a new BigNumber whose value is the integer part of dividing the value of this
     * BigNumber by the value of BigNumber(y, b).
     */
    P.dividedToIntegerBy = P.idiv = function (y, b) {
      return div(this, new BigNumber(y, b), 0, 1);
    };


    /*
     * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
     *
     * If m is present, return the result modulo m.
     * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
     * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
     *
     * The modular power operation works efficiently when x, n, and m are integers, otherwise it
     * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
     *
     * n {number|string|BigNumber} The exponent. An integer.
     * [m] {number|string|BigNumber} The modulus.
     *
     * '[BigNumber Error] Exponent not an integer: {n}'
     */
    P.exponentiatedBy = P.pow = function (n, m) {
      var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
        x = this;

      n = new BigNumber(n);

      // Allow NaN and ±Infinity, but not other non-integers.
      if (n.c && !n.isInteger()) {
        throw Error
          (bignumberError + 'Exponent not an integer: ' + valueOf(n));
      }

      if (m != null) m = new BigNumber(m);

      // Exponent of MAX_SAFE_INTEGER is 15.
      nIsBig = n.e > 14;

      // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
      if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

        // The sign of the result of pow when x is negative depends on the evenness of n.
        // If +n overflows to ±Infinity, the evenness of n would be not be known.
        y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
        return m ? y.mod(m) : y;
      }

      nIsNeg = n.s < 0;

      if (m) {

        // x % m returns NaN if abs(m) is zero, or m is NaN.
        if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

        isModExp = !nIsNeg && x.isInteger() && m.isInteger();

        if (isModExp) x = x.mod(m);

      // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
      // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
      } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
        // [1, 240000000]
        ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
        // [80000000000000]  [99999750000000]
        : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

        // If x is negative and n is odd, k = -0, else k = 0.
        k = x.s < 0 && isOdd(n) ? -0 : 0;

        // If x >= 1, k = ±Infinity.
        if (x.e > -1) k = 1 / k;

        // If n is negative return ±0, else return ±Infinity.
        return new BigNumber(nIsNeg ? 1 / k : k);

      } else if (POW_PRECISION) {

        // Truncating each coefficient array to a length of k after each multiplication
        // equates to truncating significant digits to POW_PRECISION + [28, 41],
        // i.e. there will be a minimum of 28 guard digits retained.
        k = mathceil(POW_PRECISION / LOG_BASE + 2);
      }

      if (nIsBig) {
        half = new BigNumber(0.5);
        if (nIsNeg) n.s = 1;
        nIsOdd = isOdd(n);
      } else {
        i = Math.abs(+valueOf(n));
        nIsOdd = i % 2;
      }

      y = new BigNumber(ONE);

      // Performs 54 loop iterations for n of 9007199254740991.
      for (; ;) {

        if (nIsOdd) {
          y = y.times(x);
          if (!y.c) break;

          if (k) {
            if (y.c.length > k) y.c.length = k;
          } else if (isModExp) {
            y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
          }
        }

        if (i) {
          i = mathfloor(i / 2);
          if (i === 0) break;
          nIsOdd = i % 2;
        } else {
          n = n.times(half);
          round(n, n.e + 1, 1);

          if (n.e > 14) {
            nIsOdd = isOdd(n);
          } else {
            i = +valueOf(n);
            if (i === 0) break;
            nIsOdd = i % 2;
          }
        }

        x = x.times(x);

        if (k) {
          if (x.c && x.c.length > k) x.c.length = k;
        } else if (isModExp) {
          x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
        }
      }

      if (isModExp) return y;
      if (nIsNeg) y = ONE.div(y);

      return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
     * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
     */
    P.integerValue = function (rm) {
      var n = new BigNumber(this);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(n, n.e + 1, rm);
    };


    /*
     * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isEqualTo = P.eq = function (y, b) {
      return compare(this, new BigNumber(y, b)) === 0;
    };


    /*
     * Return true if the value of this BigNumber is a finite number, otherwise return false.
     */
    P.isFinite = function () {
      return !!this.c;
    };


    /*
     * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isGreaterThan = P.gt = function (y, b) {
      return compare(this, new BigNumber(y, b)) > 0;
    };


    /*
     * Return true if the value of this BigNumber is greater than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

    };


    /*
     * Return true if the value of this BigNumber is an integer, otherwise return false.
     */
    P.isInteger = function () {
      return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
    };


    /*
     * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isLessThan = P.lt = function (y, b) {
      return compare(this, new BigNumber(y, b)) < 0;
    };


    /*
     * Return true if the value of this BigNumber is less than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isLessThanOrEqualTo = P.lte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
    };


    /*
     * Return true if the value of this BigNumber is NaN, otherwise return false.
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this BigNumber is negative, otherwise return false.
     */
    P.isNegative = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this BigNumber is positive, otherwise return false.
     */
    P.isPositive = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
     */
    P.isZero = function () {
      return !!this.c && this.c[0] == 0;
    };


    /*
     *  n - 0 = n
     *  n - N = N
     *  n - I = -I
     *  0 - n = -n
     *  0 - 0 = 0
     *  0 - N = N
     *  0 - I = -I
     *  N - n = N
     *  N - 0 = N
     *  N - N = N
     *  N - I = N
     *  I - n = I
     *  I - 0 = I
     *  I - N = N
     *  I - I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber minus the value of
     * BigNumber(y, b).
     */
    P.minus = function (y, b) {
      var i, j, t, xLTy,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
      if (a != b) {
        y.s = -b;
        return x.plus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Either Infinity?
        if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

        // Either zero?
        if (!xc[0] || !yc[0]) {

          // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
          return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

           // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
           ROUNDING_MODE == 3 ? -0 : 0);
        }
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Determine which is the bigger number.
      if (a = xe - ye) {

        if (xLTy = a < 0) {
          a = -a;
          t = xc;
        } else {
          ye = xe;
          t = yc;
        }

        t.reverse();

        // Prepend zeros to equalise exponents.
        for (b = a; b--; t.push(0));
        t.reverse();
      } else {

        // Exponents equal. Check digit by digit.
        j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

        for (a = b = 0; b < j; b++) {

          if (xc[b] != yc[b]) {
            xLTy = xc[b] < yc[b];
            break;
          }
        }
      }

      // x < y? Point xc to the array of the bigger number.
      if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

      b = (j = yc.length) - (i = xc.length);

      // Append zeros to xc if shorter.
      // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
      if (b > 0) for (; b--; xc[i++] = 0);
      b = BASE - 1;

      // Subtract yc from xc.
      for (; j > a;) {

        if (xc[--j] < yc[j]) {
          for (i = j; i && !xc[--i]; xc[i] = b);
          --xc[i];
          xc[j] += BASE;
        }

        xc[j] -= yc[j];
      }

      // Remove leading zeros and adjust exponent accordingly.
      for (; xc[0] == 0; xc.splice(0, 1), --ye);

      // Zero?
      if (!xc[0]) {

        // Following IEEE 754 (2008) 6.3,
        // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
        y.s = ROUNDING_MODE == 3 ? -1 : 1;
        y.c = [y.e = 0];
        return y;
      }

      // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
      // for finite x and y.
      return normalise(y, xc, ye);
    };


    /*
     *   n % 0 =  N
     *   n % N =  N
     *   n % I =  n
     *   0 % n =  0
     *  -0 % n = -0
     *   0 % 0 =  N
     *   0 % N =  N
     *   0 % I =  0
     *   N % n =  N
     *   N % 0 =  N
     *   N % N =  N
     *   N % I =  N
     *   I % n =  N
     *   I % 0 =  N
     *   I % N =  N
     *   I % I =  N
     *
     * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
     * BigNumber(y, b). The result depends on the value of MODULO_MODE.
     */
    P.modulo = P.mod = function (y, b) {
      var q, s,
        x = this;

      y = new BigNumber(y, b);

      // Return NaN if x is Infinity or NaN, or y is NaN or zero.
      if (!x.c || !y.s || y.c && !y.c[0]) {
        return new BigNumber(NaN);

      // Return x if y is Infinity or x is zero.
      } else if (!y.c || x.c && !x.c[0]) {
        return new BigNumber(x);
      }

      if (MODULO_MODE == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // r = x - qy    where  0 <= r < abs(y)
        s = y.s;
        y.s = 1;
        q = div(x, y, 0, 3);
        y.s = s;
        q.s *= s;
      } else {
        q = div(x, y, 0, MODULO_MODE);
      }

      y = x.minus(q.times(y));

      // To match JavaScript %, ensure sign of zero is sign of dividend.
      if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

      return y;
    };


    /*
     *  n * 0 = 0
     *  n * N = N
     *  n * I = I
     *  0 * n = 0
     *  0 * 0 = 0
     *  0 * N = N
     *  0 * I = N
     *  N * n = N
     *  N * 0 = N
     *  N * N = N
     *  N * I = N
     *  I * n = I
     *  I * 0 = N
     *  I * N = N
     *  I * I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
     * of BigNumber(y, b).
     */
    P.multipliedBy = P.times = function (y, b) {
      var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
        base, sqrtBase,
        x = this,
        xc = x.c,
        yc = (y = new BigNumber(y, b)).c;

      // Either NaN, ±Infinity or ±0?
      if (!xc || !yc || !xc[0] || !yc[0]) {

        // Return NaN if either is NaN, or one is 0 and the other is Infinity.
        if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
          y.c = y.e = y.s = null;
        } else {
          y.s *= x.s;

          // Return ±Infinity if either is ±Infinity.
          if (!xc || !yc) {
            y.c = y.e = null;

          // Return ±0 if either is ±0.
          } else {
            y.c = [0];
            y.e = 0;
          }
        }

        return y;
      }

      e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
      y.s *= x.s;
      xcL = xc.length;
      ycL = yc.length;

      // Ensure xc points to longer array and xcL to its length.
      if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

      // Initialise the result array with zeros.
      for (i = xcL + ycL, zc = []; i--; zc.push(0));

      base = BASE;
      sqrtBase = SQRT_BASE;

      for (i = ycL; --i >= 0;) {
        c = 0;
        ylo = yc[i] % sqrtBase;
        yhi = yc[i] / sqrtBase | 0;

        for (k = xcL, j = i + k; j > i;) {
          xlo = xc[--k] % sqrtBase;
          xhi = xc[k] / sqrtBase | 0;
          m = yhi * xlo + xhi * ylo;
          xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
          c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
          zc[j--] = xlo % base;
        }

        zc[j] = c;
      }

      if (c) {
        ++e;
      } else {
        zc.splice(0, 1);
      }

      return normalise(y, zc, e);
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber negated,
     * i.e. multiplied by -1.
     */
    P.negated = function () {
      var x = new BigNumber(this);
      x.s = -x.s || null;
      return x;
    };


    /*
     *  n + 0 = n
     *  n + N = N
     *  n + I = I
     *  0 + n = n
     *  0 + 0 = 0
     *  0 + N = N
     *  0 + I = I
     *  N + n = N
     *  N + 0 = N
     *  N + N = N
     *  N + I = N
     *  I + n = I
     *  I + 0 = I
     *  I + N = N
     *  I + I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber plus the value of
     * BigNumber(y, b).
     */
    P.plus = function (y, b) {
      var t,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
       if (a != b) {
        y.s = -b;
        return x.minus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Return ±Infinity if either ±Infinity.
        if (!xc || !yc) return new BigNumber(a / 0);

        // Either zero?
        // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
        if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
      if (a = xe - ye) {
        if (a > 0) {
          ye = xe;
          t = yc;
        } else {
          a = -a;
          t = xc;
        }

        t.reverse();
        for (; a--; t.push(0));
        t.reverse();
      }

      a = xc.length;
      b = yc.length;

      // Point xc to the longer array, and b to the shorter length.
      if (a - b < 0) t = yc, yc = xc, xc = t, b = a;

      // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
      for (a = 0; b;) {
        a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
        xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
      }

      if (a) {
        xc = [a].concat(xc);
        ++ye;
      }

      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      // ye = MAX_EXP + 1 possible
      return normalise(y, xc, ye);
    };


    /*
     * If sd is undefined or null or true or false, return the number of significant digits of
     * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     * If sd is true include integer-part trailing zeros in the count.
     *
     * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
     *                     boolean: whether to count integer-part trailing zeros: true or false.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.precision = P.sd = function (sd, rm) {
      var c, n, v,
        x = this;

      if (sd != null && sd !== !!sd) {
        intCheck(sd, 1, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), sd, rm);
      }

      if (!(c = x.c)) return null;
      v = c.length - 1;
      n = v * LOG_BASE + 1;

      if (v = c[v]) {

        // Subtract the number of trailing zeros of the last element.
        for (; v % 10 == 0; v /= 10, n--);

        // Add the number of digits of the first element.
        for (v = c[0]; v >= 10; v /= 10, n++);
      }

      if (sd && x.e + 1 > n) n = x.e + 1;

      return n;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
     * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
     *
     * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
     */
    P.shiftedBy = function (k) {
      intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
      return this.times('1e' + k);
    };


    /*
     *  sqrt(-n) =  N
     *  sqrt(N) =  N
     *  sqrt(-I) =  N
     *  sqrt(I) =  I
     *  sqrt(0) =  0
     *  sqrt(-0) = -0
     *
     * Return a new BigNumber whose value is the square root of the value of this BigNumber,
     * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.squareRoot = P.sqrt = function () {
      var m, n, r, rep, t,
        x = this,
        c = x.c,
        s = x.s,
        e = x.e,
        dp = DECIMAL_PLACES + 4,
        half = new BigNumber('0.5');

      // Negative/NaN/Infinity/zero?
      if (s !== 1 || !c || !c[0]) {
        return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
      }

      // Initial estimate.
      s = Math.sqrt(+valueOf(x));

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = coeffToString(c);
        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(+n);
        e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '1e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new BigNumber(n);
      } else {
        r = new BigNumber(s + '');
      }

      // Check for zero.
      // r could be zero if MIN_EXP is changed after the this value was created.
      // This would cause a division by zero (x/t) and hence Infinity below, which would cause
      // coeffToString to throw.
      if (r.c[0]) {
        e = r.e;
        s = e + dp;
        if (s < 3) s = 0;

        // Newton-Raphson iteration.
        for (; ;) {
          t = r;
          r = half.times(t.plus(div(x, t, dp, 1)));

          if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

            // The exponent of r may here be one less than the final result exponent,
            // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
            // are indexed correctly.
            if (r.e < e) --s;
            n = n.slice(s - 3, s + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
            // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
            // iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the
              // exact result as the nines may infinitely repeat.
              if (!rep) {
                round(t, t.e + DECIMAL_PLACES + 2, 0);

                if (t.times(t).eq(x)) {
                  r = t;
                  break;
                }
              }

              dp += 4;
              s += 4;
              rep = 1;
            } else {

              // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
              // result. If not, then there are further digits and m will be truthy.
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                round(r, r.e + DECIMAL_PLACES + 2, 1);
                m = !r.times(r).eq(x);
              }

              break;
            }
          }
        }
      }

      return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
    };


    /*
     * Return a string representing the value of this BigNumber in exponential notation and
     * rounded using ROUNDING_MODE to dp fixed decimal places.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toExponential = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp++;
      }
      return format(this, dp, rm, 1);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounding
     * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
     * but e.g. (-0.00001).toFixed(0) is '-0'.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toFixed = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp = dp + this.e + 1;
      }
      return format(this, dp, rm);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounded
     * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
     * of the format or FORMAT object (see BigNumber.set).
     *
     * The formatting object may contain some or all of the properties shown below.
     *
     * FORMAT = {
     *   prefix: '',
     *   groupSize: 3,
     *   secondaryGroupSize: 0,
     *   groupSeparator: ',',
     *   decimalSeparator: '.',
     *   fractionGroupSize: 0,
     *   fractionGroupSeparator: '\xA0',      // non-breaking space
     *   suffix: ''
     * };
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     * [format] {object} Formatting options. See FORMAT pbject above.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     * '[BigNumber Error] Argument not an object: {format}'
     */
    P.toFormat = function (dp, rm, format) {
      var str,
        x = this;

      if (format == null) {
        if (dp != null && rm && typeof rm == 'object') {
          format = rm;
          rm = null;
        } else if (dp && typeof dp == 'object') {
          format = dp;
          dp = rm = null;
        } else {
          format = FORMAT;
        }
      } else if (typeof format != 'object') {
        throw Error
          (bignumberError + 'Argument not an object: ' + format);
      }

      str = x.toFixed(dp, rm);

      if (x.c) {
        var i,
          arr = str.split('.'),
          g1 = +format.groupSize,
          g2 = +format.secondaryGroupSize,
          groupSeparator = format.groupSeparator || '',
          intPart = arr[0],
          fractionPart = arr[1],
          isNeg = x.s < 0,
          intDigits = isNeg ? intPart.slice(1) : intPart,
          len = intDigits.length;

        if (g2) i = g1, g1 = g2, g2 = i, len -= i;

        if (g1 > 0 && len > 0) {
          i = len % g1 || g1;
          intPart = intDigits.substr(0, i);
          for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
          if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
          if (isNeg) intPart = '-' + intPart;
        }

        str = fractionPart
         ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
          ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
           '$&' + (format.fractionGroupSeparator || ''))
          : fractionPart)
         : intPart;
      }

      return (format.prefix || '') + str + (format.suffix || '');
    };


    /*
     * Return an array of two BigNumbers representing the value of this BigNumber as a simple
     * fraction with an integer numerator and an integer denominator.
     * The denominator will be a positive non-zero value less than or equal to the specified
     * maximum denominator. If a maximum denominator is not specified, the denominator will be
     * the lowest value necessary to represent the number exactly.
     *
     * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
     *
     * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
     */
    P.toFraction = function (md) {
      var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
        x = this,
        xc = x.c;

      if (md != null) {
        n = new BigNumber(md);

        // Throw if md is less than one or is not an integer, unless it is Infinity.
        if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
          throw Error
            (bignumberError + 'Argument ' +
              (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
        }
      }

      if (!xc) return new BigNumber(x);

      d = new BigNumber(ONE);
      n1 = d0 = new BigNumber(ONE);
      d1 = n0 = new BigNumber(ONE);
      s = coeffToString(xc);

      // Determine initial denominator.
      // d is a power of 10 and the minimum max denominator that specifies the value exactly.
      e = d.e = s.length - x.e - 1;
      d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
      md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

      exp = MAX_EXP;
      MAX_EXP = 1 / 0;
      n = new BigNumber(s);

      // n0 = d1 = 0
      n0.c[0] = 0;

      for (; ;)  {
        q = div(n, d, 0, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.comparedTo(md) == 1) break;
        d0 = d1;
        d1 = d2;
        n1 = n0.plus(q.times(d2 = n1));
        n0 = d2;
        d = n.minus(q.times(d2 = d));
        n = d2;
      }

      d2 = div(md.minus(d0), d1, 0, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;
      e = e * 2;

      // Determine which fraction is closer to x, n0/d0 or n1/d1
      r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
          div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

      MAX_EXP = exp;

      return r;
    };


    /*
     * Return the value of this BigNumber converted to a number primitive.
     */
    P.toNumber = function () {
      return +valueOf(this);
    };


    /*
     * Return a string representing the value of this BigNumber rounded to sd significant digits
     * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
     * necessary to represent the integer part of the value in fixed-point notation, then use
     * exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.toPrecision = function (sd, rm) {
      if (sd != null) intCheck(sd, 1, MAX);
      return format(this, sd, rm, 2);
    };


    /*
     * Return a string representing the value of this BigNumber in base b, or base 10 if b is
     * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
     * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
     * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
     * TO_EXP_NEG, return exponential notation.
     *
     * [b] {number} Integer, 2 to ALPHABET.length inclusive.
     *
     * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
     */
    P.toString = function (b) {
      var str,
        n = this,
        s = n.s,
        e = n.e;

      // Infinity or NaN?
      if (e === null) {
        if (s) {
          str = 'Infinity';
          if (s < 0) str = '-' + str;
        } else {
          str = 'NaN';
        }
      } else {
        if (b == null) {
          str = e <= TO_EXP_NEG || e >= TO_EXP_POS
           ? toExponential(coeffToString(n.c), e)
           : toFixedPoint(coeffToString(n.c), e, '0');
        } else if (b === 10) {
          n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
          str = toFixedPoint(coeffToString(n.c), n.e, '0');
        } else {
          intCheck(b, 2, ALPHABET.length, 'Base');
          str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
        }

        if (s < 0 && n.c[0]) str = '-' + str;
      }

      return str;
    };


    /*
     * Return as toString, but do not accept a base argument, and include the minus sign for
     * negative zero.
     */
    P.valueOf = P.toJSON = function () {
      return valueOf(this);
    };


    P._isBigNumber = true;

    if (configObject != null) BigNumber.set(configObject);

    return BigNumber;
  }


  // PRIVATE HELPER FUNCTIONS

  // These functions don't need access to variables,
  // e.g. DECIMAL_PLACES, in the scope of the `clone` function above.


  function bitFloor(n) {
    var i = n | 0;
    return n > 0 || n === i ? i : i - 1;
  }


  // Return a coefficient array as a string of base 10 digits.
  function coeffToString(a) {
    var s, z,
      i = 1,
      j = a.length,
      r = a[0] + '';

    for (; i < j;) {
      s = a[i++] + '';
      z = LOG_BASE - s.length;
      for (; z--; s = '0' + s);
      r += s;
    }

    // Determine trailing zeros.
    for (j = r.length; r.charCodeAt(--j) === 48;);

    return r.slice(0, j + 1 || 1);
  }


  // Compare the value of BigNumbers x and y.
  function compare(x, y) {
    var a, b,
      xc = x.c,
      yc = y.c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either NaN?
    if (!i || !j) return null;

    a = xc && !xc[0];
    b = yc && !yc[0];

    // Either zero?
    if (a || b) return a ? b ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    a = i < 0;
    b = k == l;

    // Either Infinity?
    if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

    // Compare exponents.
    if (!b) return k > l ^ a ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
  }


  /*
   * Check that n is a primitive number, an integer, and in range, otherwise throw.
   */
  function intCheck(n, min, max, name) {
    if (n < min || n > max || n !== mathfloor(n)) {
      throw Error
       (bignumberError + (name || 'Argument') + (typeof n == 'number'
         ? n < min || n > max ? ' out of range: ' : ' not an integer: '
         : ' not a primitive number: ') + String(n));
    }
  }


  // Assumes finite n.
  function isOdd(n) {
    var k = n.c.length - 1;
    return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
  }


  function toExponential(str, e) {
    return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
     (e < 0 ? 'e' : 'e+') + e;
  }


  function toFixedPoint(str, e, z) {
    var len, zs;

    // Negative exponent?
    if (e < 0) {

      // Prepend zeros.
      for (zs = z + '.'; ++e; zs += z);
      str = zs + str;

    // Positive exponent
    } else {
      len = str.length;

      // Append zeros.
      if (++e > len) {
        for (zs = z, e -= len; --e; zs += z);
        str += zs;
      } else if (e < len) {
        str = str.slice(0, e) + '.' + str.slice(e);
      }
    }

    return str;
  }


  // EXPORT


  BigNumber = clone();
  BigNumber['default'] = BigNumber.BigNumber = BigNumber;

  // AMD.
  if (typeof define == 'function' && define.amd) {
    define(function () { return BigNumber; });

  // Node.js and other environments that support module.exports.
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = BigNumber;

  // Browser.
  } else {
    if (!globalObject) {
      globalObject = typeof self != 'undefined' && self ? self : window;
    }

    globalObject.BigNumber = BigNumber;
  }
})(this);

},{}],"/Users/phx/Sync/sign-search/node_modules/borc/src/constants.js":[function(require,module,exports){
'use strict'

const Bignumber = require('bignumber.js').BigNumber

exports.MT = {
  POS_INT: 0,
  NEG_INT: 1,
  BYTE_STRING: 2,
  UTF8_STRING: 3,
  ARRAY: 4,
  MAP: 5,
  TAG: 6,
  SIMPLE_FLOAT: 7
}

exports.TAG = {
  DATE_STRING: 0,
  DATE_EPOCH: 1,
  POS_BIGINT: 2,
  NEG_BIGINT: 3,
  DECIMAL_FRAC: 4,
  BIGFLOAT: 5,
  BASE64URL_EXPECTED: 21,
  BASE64_EXPECTED: 22,
  BASE16_EXPECTED: 23,
  CBOR: 24,
  URI: 32,
  BASE64URL: 33,
  BASE64: 34,
  REGEXP: 35,
  MIME: 36
}

exports.NUMBYTES = {
  ZERO: 0,
  ONE: 24,
  TWO: 25,
  FOUR: 26,
  EIGHT: 27,
  INDEFINITE: 31
}

exports.SIMPLE = {
  FALSE: 20,
  TRUE: 21,
  NULL: 22,
  UNDEFINED: 23
}

exports.SYMS = {
  NULL: Symbol('null'),
  UNDEFINED: Symbol('undef'),
  PARENT: Symbol('parent'),
  BREAK: Symbol('break'),
  STREAM: Symbol('stream')
}

exports.SHIFT32 = Math.pow(2, 32)
exports.SHIFT16 = Math.pow(2, 16)

exports.MAX_SAFE_HIGH = 0x1fffff
exports.NEG_ONE = new Bignumber(-1)
exports.TEN = new Bignumber(10)
exports.TWO = new Bignumber(2)

exports.PARENT = {
  ARRAY: 0,
  OBJECT: 1,
  MAP: 2,
  TAG: 3,
  BYTE_STRING: 4,
  UTF8_STRING: 5
}

},{"bignumber.js":"/Users/phx/Sync/sign-search/node_modules/bignumber.js/bignumber.js"}],"/Users/phx/Sync/sign-search/node_modules/borc/src/decoder.asm.js":[function(require,module,exports){
module.exports = function decodeAsm (stdlib, foreign, buffer) {
  'use asm'

  // -- Imports

  var heap = new stdlib.Uint8Array(buffer)
  // var log = foreign.log
  var pushInt = foreign.pushInt
  var pushInt32 = foreign.pushInt32
  var pushInt32Neg = foreign.pushInt32Neg
  var pushInt64 = foreign.pushInt64
  var pushInt64Neg = foreign.pushInt64Neg
  var pushFloat = foreign.pushFloat
  var pushFloatSingle = foreign.pushFloatSingle
  var pushFloatDouble = foreign.pushFloatDouble
  var pushTrue = foreign.pushTrue
  var pushFalse = foreign.pushFalse
  var pushUndefined = foreign.pushUndefined
  var pushNull = foreign.pushNull
  var pushInfinity = foreign.pushInfinity
  var pushInfinityNeg = foreign.pushInfinityNeg
  var pushNaN = foreign.pushNaN
  var pushNaNNeg = foreign.pushNaNNeg

  var pushArrayStart = foreign.pushArrayStart
  var pushArrayStartFixed = foreign.pushArrayStartFixed
  var pushArrayStartFixed32 = foreign.pushArrayStartFixed32
  var pushArrayStartFixed64 = foreign.pushArrayStartFixed64
  var pushObjectStart = foreign.pushObjectStart
  var pushObjectStartFixed = foreign.pushObjectStartFixed
  var pushObjectStartFixed32 = foreign.pushObjectStartFixed32
  var pushObjectStartFixed64 = foreign.pushObjectStartFixed64

  var pushByteString = foreign.pushByteString
  var pushByteStringStart = foreign.pushByteStringStart
  var pushUtf8String = foreign.pushUtf8String
  var pushUtf8StringStart = foreign.pushUtf8StringStart

  var pushSimpleUnassigned = foreign.pushSimpleUnassigned

  var pushTagStart = foreign.pushTagStart
  var pushTagStart4 = foreign.pushTagStart4
  var pushTagStart8 = foreign.pushTagStart8
  var pushTagUnassigned = foreign.pushTagUnassigned

  var pushBreak = foreign.pushBreak

  var pow = stdlib.Math.pow

  // -- Constants


  // -- Mutable Variables

  var offset = 0
  var inputLength = 0
  var code = 0

  // Decode a cbor string represented as Uint8Array
  // which is allocated on the heap from 0 to inputLength
  //
  // input - Int
  //
  // Returns Code - Int,
  // Success = 0
  // Error > 0
  function parse (input) {
    input = input | 0

    offset = 0
    inputLength = input

    while ((offset | 0) < (inputLength | 0)) {
      code = jumpTable[heap[offset] & 255](heap[offset] | 0) | 0

      if ((code | 0) > 0) {
        break
      }
    }

    return code | 0
  }

  // -- Helper Function

  function checkOffset (n) {
    n = n | 0

    if ((((offset | 0) + (n | 0)) | 0) < (inputLength | 0)) {
      return 0
    }

    return 1
  }

  function readUInt16 (n) {
    n = n | 0

    return (
      (heap[n | 0] << 8) | heap[(n + 1) | 0]
    ) | 0
  }

  function readUInt32 (n) {
    n = n | 0

    return (
      (heap[n | 0] << 24) | (heap[(n + 1) | 0] << 16) | (heap[(n + 2) | 0] << 8) | heap[(n + 3) | 0]
    ) | 0
  }

  // -- Initial Byte Handlers

  function INT_P (octet) {
    octet = octet | 0

    pushInt(octet | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function UINT_P_8 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushInt(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2) | 0

    return 0
  }

  function UINT_P_16 (octet) {
    octet = octet | 0

    if (checkOffset(2) | 0) {
      return 1
    }

    pushInt(
      readUInt16((offset + 1) | 0) | 0
    )

    offset = (offset + 3) | 0

    return 0
  }

  function UINT_P_32 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushInt32(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function UINT_P_64 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushInt64(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function INT_N (octet) {
    octet = octet | 0

    pushInt((-1 - ((octet - 32) | 0)) | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function UINT_N_8 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushInt(
      (-1 - (heap[(offset + 1) | 0] | 0)) | 0
    )

    offset = (offset + 2) | 0

    return 0
  }

  function UINT_N_16 (octet) {
    octet = octet | 0

    var val = 0

    if (checkOffset(2) | 0) {
      return 1
    }

    val = readUInt16((offset + 1) | 0) | 0
    pushInt((-1 - (val | 0)) | 0)

    offset = (offset + 3) | 0

    return 0
  }

  function UINT_N_32 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushInt32Neg(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function UINT_N_64 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushInt64Neg(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function BYTE_STRING (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var step = 0

    step = (octet - 64) | 0
    if (checkOffset(step | 0) | 0) {
      return 1
    }

    start = (offset + 1) | 0
    end = (((offset + 1) | 0) + (step | 0)) | 0

    pushByteString(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function BYTE_STRING_8 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(1) | 0) {
      return 1
    }

    length = heap[(offset + 1) | 0] | 0
    start = (offset + 2) | 0
    end = (((offset + 2) | 0) + (length | 0)) | 0

    if (checkOffset((length + 1) | 0) | 0) {
      return 1
    }

    pushByteString(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function BYTE_STRING_16 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(2) | 0) {
      return 1
    }

    length = readUInt16((offset + 1) | 0) | 0
    start = (offset + 3) | 0
    end = (((offset + 3) | 0) + (length | 0)) | 0


    if (checkOffset((length + 2) | 0) | 0) {
      return 1
    }

    pushByteString(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function BYTE_STRING_32 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(4) | 0) {
      return 1
    }

    length = readUInt32((offset + 1) | 0) | 0
    start = (offset + 5) | 0
    end = (((offset + 5) | 0) + (length | 0)) | 0


    if (checkOffset((length + 4) | 0) | 0) {
      return 1
    }

    pushByteString(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function BYTE_STRING_64 (octet) {
    // NOT IMPLEMENTED
    octet = octet | 0

    return 1
  }

  function BYTE_STRING_BREAK (octet) {
    octet = octet | 0

    pushByteStringStart()

    offset = (offset + 1) | 0

    return 0
  }

  function UTF8_STRING (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var step = 0

    step = (octet - 96) | 0

    if (checkOffset(step | 0) | 0) {
      return 1
    }

    start = (offset + 1) | 0
    end = (((offset + 1) | 0) + (step | 0)) | 0

    pushUtf8String(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function UTF8_STRING_8 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(1) | 0) {
      return 1
    }

    length = heap[(offset + 1) | 0] | 0
    start = (offset + 2) | 0
    end = (((offset + 2) | 0) + (length | 0)) | 0

    if (checkOffset((length + 1) | 0) | 0) {
      return 1
    }

    pushUtf8String(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function UTF8_STRING_16 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(2) | 0) {
      return 1
    }

    length = readUInt16((offset + 1) | 0) | 0
    start = (offset + 3) | 0
    end = (((offset + 3) | 0) + (length | 0)) | 0

    if (checkOffset((length + 2) | 0) | 0) {
      return 1
    }

    pushUtf8String(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function UTF8_STRING_32 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(4) | 0) {
      return 1
    }

    length = readUInt32((offset + 1) | 0) | 0
    start = (offset + 5) | 0
    end = (((offset + 5) | 0) + (length | 0)) | 0

    if (checkOffset((length + 4) | 0) | 0) {
      return 1
    }

    pushUtf8String(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function UTF8_STRING_64 (octet) {
    // NOT IMPLEMENTED
    octet = octet | 0

    return 1
  }

  function UTF8_STRING_BREAK (octet) {
    octet = octet | 0

    pushUtf8StringStart()

    offset = (offset + 1) | 0

    return 0
  }

  function ARRAY (octet) {
    octet = octet | 0

    pushArrayStartFixed((octet - 128) | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function ARRAY_8 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushArrayStartFixed(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2) | 0

    return 0
  }

  function ARRAY_16 (octet) {
    octet = octet | 0

    if (checkOffset(2) | 0) {
      return 1
    }

    pushArrayStartFixed(
      readUInt16((offset + 1) | 0) | 0
    )

    offset = (offset + 3) | 0

    return 0
  }

  function ARRAY_32 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushArrayStartFixed32(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function ARRAY_64 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushArrayStartFixed64(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function ARRAY_BREAK (octet) {
    octet = octet | 0

    pushArrayStart()

    offset = (offset + 1) | 0

    return 0
  }

  function MAP (octet) {
    octet = octet | 0

    var step = 0

    step = (octet - 160) | 0

    if (checkOffset(step | 0) | 0) {
      return 1
    }

    pushObjectStartFixed(step | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function MAP_8 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushObjectStartFixed(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2) | 0

    return 0
  }

  function MAP_16 (octet) {
    octet = octet | 0

    if (checkOffset(2) | 0) {
      return 1
    }

    pushObjectStartFixed(
      readUInt16((offset + 1) | 0) | 0
    )

    offset = (offset + 3) | 0

    return 0
  }

  function MAP_32 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushObjectStartFixed32(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function MAP_64 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushObjectStartFixed64(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function MAP_BREAK (octet) {
    octet = octet | 0

    pushObjectStart()

    offset = (offset + 1) | 0

    return 0
  }

  function TAG_KNOWN (octet) {
    octet = octet | 0

    pushTagStart((octet - 192| 0) | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BIGNUM_POS (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BIGNUM_NEG (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_FRAC (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BIGNUM_FLOAT (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_UNASSIGNED (octet) {
    octet = octet | 0

    pushTagStart((octet - 192| 0) | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BASE64_URL (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BASE64 (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BASE16 (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_MORE_1 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushTagStart(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2 | 0)

    return 0
  }

  function TAG_MORE_2 (octet) {
    octet = octet | 0

    if (checkOffset(2) | 0) {
      return 1
    }

    pushTagStart(
      readUInt16((offset + 1) | 0) | 0
    )

    offset = (offset + 3 | 0)

    return 0
  }

  function TAG_MORE_4 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushTagStart4(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5 | 0)

    return 0
  }

  function TAG_MORE_8 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushTagStart8(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9 | 0)

    return 0
  }

  function SIMPLE_UNASSIGNED (octet) {
    octet = octet | 0

    pushSimpleUnassigned(((octet | 0) - 224) | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_FALSE (octet) {
    octet = octet | 0

    pushFalse()

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_TRUE (octet) {
    octet = octet | 0

    pushTrue()

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_NULL (octet) {
    octet = octet | 0

    pushNull()

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_UNDEFINED (octet) {
    octet = octet | 0

    pushUndefined()

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_BYTE (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushSimpleUnassigned(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2)  | 0

    return 0
  }

  function SIMPLE_FLOAT_HALF (octet) {
    octet = octet | 0

    var f = 0
    var g = 0
    var sign = 1.0
    var exp = 0.0
    var mant = 0.0
    var r = 0.0
    if (checkOffset(2) | 0) {
      return 1
    }

    f = heap[(offset + 1) | 0] | 0
    g = heap[(offset + 2) | 0] | 0

    if ((f | 0) & 0x80) {
      sign = -1.0
    }

    exp = +(((f | 0) & 0x7C) >> 2)
    mant = +((((f | 0) & 0x03) << 8) | g)

    if (+exp == 0.0) {
      pushFloat(+(
        (+sign) * +5.9604644775390625e-8 * (+mant)
      ))
    } else if (+exp == 31.0) {
      if (+sign == 1.0) {
        if (+mant > 0.0) {
          pushNaN()
        } else {
          pushInfinity()
        }
      } else {
        if (+mant > 0.0) {
          pushNaNNeg()
        } else {
          pushInfinityNeg()
        }
      }
    } else {
      pushFloat(+(
        +sign * pow(+2, +(+exp - 25.0)) * +(1024.0 + mant)
      ))
    }

    offset = (offset + 3) | 0

    return 0
  }

  function SIMPLE_FLOAT_SINGLE (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushFloatSingle(
      heap[(offset + 1) | 0] | 0,
      heap[(offset + 2) | 0] | 0,
      heap[(offset + 3) | 0] | 0,
      heap[(offset + 4) | 0] | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function SIMPLE_FLOAT_DOUBLE (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushFloatDouble(
      heap[(offset + 1) | 0] | 0,
      heap[(offset + 2) | 0] | 0,
      heap[(offset + 3) | 0] | 0,
      heap[(offset + 4) | 0] | 0,
      heap[(offset + 5) | 0] | 0,
      heap[(offset + 6) | 0] | 0,
      heap[(offset + 7) | 0] | 0,
      heap[(offset + 8) | 0] | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function ERROR (octet) {
    octet = octet | 0

    return 1
  }

  function BREAK (octet) {
    octet = octet | 0

    pushBreak()

    offset = (offset + 1) | 0

    return 0
  }

  // -- Jump Table

  var jumpTable = [
    // Integer 0x00..0x17 (0..23)
    INT_P, // 0x00
    INT_P, // 0x01
    INT_P, // 0x02
    INT_P, // 0x03
    INT_P, // 0x04
    INT_P, // 0x05
    INT_P, // 0x06
    INT_P, // 0x07
    INT_P, // 0x08
    INT_P, // 0x09
    INT_P, // 0x0A
    INT_P, // 0x0B
    INT_P, // 0x0C
    INT_P, // 0x0D
    INT_P, // 0x0E
    INT_P, // 0x0F
    INT_P, // 0x10
    INT_P, // 0x11
    INT_P, // 0x12
    INT_P, // 0x13
    INT_P, // 0x14
    INT_P, // 0x15
    INT_P, // 0x16
    INT_P, // 0x17
    // Unsigned integer (one-byte uint8_t follows)
    UINT_P_8, // 0x18
    // Unsigned integer (two-byte uint16_t follows)
    UINT_P_16, // 0x19
    // Unsigned integer (four-byte uint32_t follows)
    UINT_P_32, // 0x1a
    // Unsigned integer (eight-byte uint64_t follows)
    UINT_P_64, // 0x1b
    ERROR, // 0x1c
    ERROR, // 0x1d
    ERROR, // 0x1e
    ERROR, // 0x1f
    // Negative integer -1-0x00..-1-0x17 (-1..-24)
    INT_N, // 0x20
    INT_N, // 0x21
    INT_N, // 0x22
    INT_N, // 0x23
    INT_N, // 0x24
    INT_N, // 0x25
    INT_N, // 0x26
    INT_N, // 0x27
    INT_N, // 0x28
    INT_N, // 0x29
    INT_N, // 0x2A
    INT_N, // 0x2B
    INT_N, // 0x2C
    INT_N, // 0x2D
    INT_N, // 0x2E
    INT_N, // 0x2F
    INT_N, // 0x30
    INT_N, // 0x31
    INT_N, // 0x32
    INT_N, // 0x33
    INT_N, // 0x34
    INT_N, // 0x35
    INT_N, // 0x36
    INT_N, // 0x37
    // Negative integer -1-n (one-byte uint8_t for n follows)
    UINT_N_8, // 0x38
    // Negative integer -1-n (two-byte uint16_t for n follows)
    UINT_N_16, // 0x39
    // Negative integer -1-n (four-byte uint32_t for nfollows)
    UINT_N_32, // 0x3a
    // Negative integer -1-n (eight-byte uint64_t for n follows)
    UINT_N_64, // 0x3b
    ERROR, // 0x3c
    ERROR, // 0x3d
    ERROR, // 0x3e
    ERROR, // 0x3f
    // byte string (0x00..0x17 bytes follow)
    BYTE_STRING, // 0x40
    BYTE_STRING, // 0x41
    BYTE_STRING, // 0x42
    BYTE_STRING, // 0x43
    BYTE_STRING, // 0x44
    BYTE_STRING, // 0x45
    BYTE_STRING, // 0x46
    BYTE_STRING, // 0x47
    BYTE_STRING, // 0x48
    BYTE_STRING, // 0x49
    BYTE_STRING, // 0x4A
    BYTE_STRING, // 0x4B
    BYTE_STRING, // 0x4C
    BYTE_STRING, // 0x4D
    BYTE_STRING, // 0x4E
    BYTE_STRING, // 0x4F
    BYTE_STRING, // 0x50
    BYTE_STRING, // 0x51
    BYTE_STRING, // 0x52
    BYTE_STRING, // 0x53
    BYTE_STRING, // 0x54
    BYTE_STRING, // 0x55
    BYTE_STRING, // 0x56
    BYTE_STRING, // 0x57
    // byte string (one-byte uint8_t for n, and then n bytes follow)
    BYTE_STRING_8, // 0x58
    // byte string (two-byte uint16_t for n, and then n bytes follow)
    BYTE_STRING_16, // 0x59
    // byte string (four-byte uint32_t for n, and then n bytes follow)
    BYTE_STRING_32, // 0x5a
    // byte string (eight-byte uint64_t for n, and then n bytes follow)
    BYTE_STRING_64, // 0x5b
    ERROR, // 0x5c
    ERROR, // 0x5d
    ERROR, // 0x5e
    // byte string, byte strings follow, terminated by "break"
    BYTE_STRING_BREAK, // 0x5f
    // UTF-8 string (0x00..0x17 bytes follow)
    UTF8_STRING, // 0x60
    UTF8_STRING, // 0x61
    UTF8_STRING, // 0x62
    UTF8_STRING, // 0x63
    UTF8_STRING, // 0x64
    UTF8_STRING, // 0x65
    UTF8_STRING, // 0x66
    UTF8_STRING, // 0x67
    UTF8_STRING, // 0x68
    UTF8_STRING, // 0x69
    UTF8_STRING, // 0x6A
    UTF8_STRING, // 0x6B
    UTF8_STRING, // 0x6C
    UTF8_STRING, // 0x6D
    UTF8_STRING, // 0x6E
    UTF8_STRING, // 0x6F
    UTF8_STRING, // 0x70
    UTF8_STRING, // 0x71
    UTF8_STRING, // 0x72
    UTF8_STRING, // 0x73
    UTF8_STRING, // 0x74
    UTF8_STRING, // 0x75
    UTF8_STRING, // 0x76
    UTF8_STRING, // 0x77
    // UTF-8 string (one-byte uint8_t for n, and then n bytes follow)
    UTF8_STRING_8, // 0x78
    // UTF-8 string (two-byte uint16_t for n, and then n bytes follow)
    UTF8_STRING_16, // 0x79
    // UTF-8 string (four-byte uint32_t for n, and then n bytes follow)
    UTF8_STRING_32, // 0x7a
    // UTF-8 string (eight-byte uint64_t for n, and then n bytes follow)
    UTF8_STRING_64, // 0x7b
    // UTF-8 string, UTF-8 strings follow, terminated by "break"
    ERROR, // 0x7c
    ERROR, // 0x7d
    ERROR, // 0x7e
    UTF8_STRING_BREAK, // 0x7f
    // array (0x00..0x17 data items follow)
    ARRAY, // 0x80
    ARRAY, // 0x81
    ARRAY, // 0x82
    ARRAY, // 0x83
    ARRAY, // 0x84
    ARRAY, // 0x85
    ARRAY, // 0x86
    ARRAY, // 0x87
    ARRAY, // 0x88
    ARRAY, // 0x89
    ARRAY, // 0x8A
    ARRAY, // 0x8B
    ARRAY, // 0x8C
    ARRAY, // 0x8D
    ARRAY, // 0x8E
    ARRAY, // 0x8F
    ARRAY, // 0x90
    ARRAY, // 0x91
    ARRAY, // 0x92
    ARRAY, // 0x93
    ARRAY, // 0x94
    ARRAY, // 0x95
    ARRAY, // 0x96
    ARRAY, // 0x97
    // array (one-byte uint8_t fo, and then n data items follow)
    ARRAY_8, // 0x98
    // array (two-byte uint16_t for n, and then n data items follow)
    ARRAY_16, // 0x99
    // array (four-byte uint32_t for n, and then n data items follow)
    ARRAY_32, // 0x9a
    // array (eight-byte uint64_t for n, and then n data items follow)
    ARRAY_64, // 0x9b
    // array, data items follow, terminated by "break"
    ERROR, // 0x9c
    ERROR, // 0x9d
    ERROR, // 0x9e
    ARRAY_BREAK, // 0x9f
    // map (0x00..0x17 pairs of data items follow)
    MAP, // 0xa0
    MAP, // 0xa1
    MAP, // 0xa2
    MAP, // 0xa3
    MAP, // 0xa4
    MAP, // 0xa5
    MAP, // 0xa6
    MAP, // 0xa7
    MAP, // 0xa8
    MAP, // 0xa9
    MAP, // 0xaA
    MAP, // 0xaB
    MAP, // 0xaC
    MAP, // 0xaD
    MAP, // 0xaE
    MAP, // 0xaF
    MAP, // 0xb0
    MAP, // 0xb1
    MAP, // 0xb2
    MAP, // 0xb3
    MAP, // 0xb4
    MAP, // 0xb5
    MAP, // 0xb6
    MAP, // 0xb7
    // map (one-byte uint8_t for n, and then n pairs of data items follow)
    MAP_8, // 0xb8
    // map (two-byte uint16_t for n, and then n pairs of data items follow)
    MAP_16, // 0xb9
    // map (four-byte uint32_t for n, and then n pairs of data items follow)
    MAP_32, // 0xba
    // map (eight-byte uint64_t for n, and then n pairs of data items follow)
    MAP_64, // 0xbb
    ERROR, // 0xbc
    ERROR, // 0xbd
    ERROR, // 0xbe
    // map, pairs of data items follow, terminated by "break"
    MAP_BREAK, // 0xbf
    // Text-based date/time (data item follows; see Section 2.4.1)
    TAG_KNOWN, // 0xc0
    // Epoch-based date/time (data item follows; see Section 2.4.1)
    TAG_KNOWN, // 0xc1
    // Positive bignum (data item "byte string" follows)
    TAG_KNOWN, // 0xc2
    // Negative bignum (data item "byte string" follows)
    TAG_KNOWN, // 0xc3
    // Decimal Fraction (data item "array" follows; see Section 2.4.3)
    TAG_KNOWN, // 0xc4
    // Bigfloat (data item "array" follows; see Section 2.4.3)
    TAG_KNOWN, // 0xc5
    // (tagged item)
    TAG_UNASSIGNED, // 0xc6
    TAG_UNASSIGNED, // 0xc7
    TAG_UNASSIGNED, // 0xc8
    TAG_UNASSIGNED, // 0xc9
    TAG_UNASSIGNED, // 0xca
    TAG_UNASSIGNED, // 0xcb
    TAG_UNASSIGNED, // 0xcc
    TAG_UNASSIGNED, // 0xcd
    TAG_UNASSIGNED, // 0xce
    TAG_UNASSIGNED, // 0xcf
    TAG_UNASSIGNED, // 0xd0
    TAG_UNASSIGNED, // 0xd1
    TAG_UNASSIGNED, // 0xd2
    TAG_UNASSIGNED, // 0xd3
    TAG_UNASSIGNED, // 0xd4
    // Expected Conversion (data item follows; see Section 2.4.4.2)
    TAG_UNASSIGNED, // 0xd5
    TAG_UNASSIGNED, // 0xd6
    TAG_UNASSIGNED, // 0xd7
    // (more tagged items, 1/2/4/8 bytes and then a data item follow)
    TAG_MORE_1, // 0xd8
    TAG_MORE_2, // 0xd9
    TAG_MORE_4, // 0xda
    TAG_MORE_8, // 0xdb
    ERROR, // 0xdc
    ERROR, // 0xdd
    ERROR, // 0xde
    ERROR, // 0xdf
    // (simple value)
    SIMPLE_UNASSIGNED, // 0xe0
    SIMPLE_UNASSIGNED, // 0xe1
    SIMPLE_UNASSIGNED, // 0xe2
    SIMPLE_UNASSIGNED, // 0xe3
    SIMPLE_UNASSIGNED, // 0xe4
    SIMPLE_UNASSIGNED, // 0xe5
    SIMPLE_UNASSIGNED, // 0xe6
    SIMPLE_UNASSIGNED, // 0xe7
    SIMPLE_UNASSIGNED, // 0xe8
    SIMPLE_UNASSIGNED, // 0xe9
    SIMPLE_UNASSIGNED, // 0xea
    SIMPLE_UNASSIGNED, // 0xeb
    SIMPLE_UNASSIGNED, // 0xec
    SIMPLE_UNASSIGNED, // 0xed
    SIMPLE_UNASSIGNED, // 0xee
    SIMPLE_UNASSIGNED, // 0xef
    SIMPLE_UNASSIGNED, // 0xf0
    SIMPLE_UNASSIGNED, // 0xf1
    SIMPLE_UNASSIGNED, // 0xf2
    SIMPLE_UNASSIGNED, // 0xf3
    // False
    SIMPLE_FALSE, // 0xf4
    // True
    SIMPLE_TRUE, // 0xf5
    // Null
    SIMPLE_NULL, // 0xf6
    // Undefined
    SIMPLE_UNDEFINED, // 0xf7
    // (simple value, one byte follows)
    SIMPLE_BYTE, // 0xf8
    // Half-Precision Float (two-byte IEEE 754)
    SIMPLE_FLOAT_HALF, // 0xf9
    // Single-Precision Float (four-byte IEEE 754)
    SIMPLE_FLOAT_SINGLE, // 0xfa
    // Double-Precision Float (eight-byte IEEE 754)
    SIMPLE_FLOAT_DOUBLE, // 0xfb
    ERROR, // 0xfc
    ERROR, // 0xfd
    ERROR, // 0xfe
    // "break" stop code
    BREAK // 0xff
  ]

  // --

  return {
    parse: parse
  }
}

},{}],"/Users/phx/Sync/sign-search/node_modules/borc/src/decoder.js":[function(require,module,exports){
(function (global,Buffer){
'use strict'

const ieee754 = require('ieee754')
const Bignumber = require('bignumber.js').BigNumber

const parser = require('./decoder.asm')
const utils = require('./utils')
const c = require('./constants')
const Simple = require('./simple')
const Tagged = require('./tagged')
const { URL } = require('iso-url')

/**
 * Transform binary cbor data into JavaScript objects.
 */
class Decoder {
  /**
   * @param {Object} [opts={}]
   * @param {number} [opts.size=65536] - Size of the allocated heap.
   */
  constructor (opts) {
    opts = opts || {}

    if (!opts.size || opts.size < 0x10000) {
      opts.size = 0x10000
    } else {
      // Ensure the size is a power of 2
      opts.size = utils.nextPowerOf2(opts.size)
    }

    // Heap use to share the input with the parser
    this._heap = new ArrayBuffer(opts.size)
    this._heap8 = new Uint8Array(this._heap)
    this._buffer = Buffer.from(this._heap)

    this._reset()

    // Known tags
    this._knownTags = Object.assign({
      0: (val) => new Date(val),
      1: (val) => new Date(val * 1000),
      2: (val) => utils.arrayBufferToBignumber(val),
      3: (val) => c.NEG_ONE.minus(utils.arrayBufferToBignumber(val)),
      4: (v) => {
        // const v = new Uint8Array(val)
        return c.TEN.pow(v[0]).times(v[1])
      },
      5: (v) => {
        // const v = new Uint8Array(val)
        return c.TWO.pow(v[0]).times(v[1])
      },
      32: (val) => new URL(val),
      35: (val) => new RegExp(val)
    }, opts.tags)

    // Initialize asm based parser
    this.parser = parser(global, {
      log: console.log.bind(console),
      pushInt: this.pushInt.bind(this),
      pushInt32: this.pushInt32.bind(this),
      pushInt32Neg: this.pushInt32Neg.bind(this),
      pushInt64: this.pushInt64.bind(this),
      pushInt64Neg: this.pushInt64Neg.bind(this),
      pushFloat: this.pushFloat.bind(this),
      pushFloatSingle: this.pushFloatSingle.bind(this),
      pushFloatDouble: this.pushFloatDouble.bind(this),
      pushTrue: this.pushTrue.bind(this),
      pushFalse: this.pushFalse.bind(this),
      pushUndefined: this.pushUndefined.bind(this),
      pushNull: this.pushNull.bind(this),
      pushInfinity: this.pushInfinity.bind(this),
      pushInfinityNeg: this.pushInfinityNeg.bind(this),
      pushNaN: this.pushNaN.bind(this),
      pushNaNNeg: this.pushNaNNeg.bind(this),
      pushArrayStart: this.pushArrayStart.bind(this),
      pushArrayStartFixed: this.pushArrayStartFixed.bind(this),
      pushArrayStartFixed32: this.pushArrayStartFixed32.bind(this),
      pushArrayStartFixed64: this.pushArrayStartFixed64.bind(this),
      pushObjectStart: this.pushObjectStart.bind(this),
      pushObjectStartFixed: this.pushObjectStartFixed.bind(this),
      pushObjectStartFixed32: this.pushObjectStartFixed32.bind(this),
      pushObjectStartFixed64: this.pushObjectStartFixed64.bind(this),
      pushByteString: this.pushByteString.bind(this),
      pushByteStringStart: this.pushByteStringStart.bind(this),
      pushUtf8String: this.pushUtf8String.bind(this),
      pushUtf8StringStart: this.pushUtf8StringStart.bind(this),
      pushSimpleUnassigned: this.pushSimpleUnassigned.bind(this),
      pushTagUnassigned: this.pushTagUnassigned.bind(this),
      pushTagStart: this.pushTagStart.bind(this),
      pushTagStart4: this.pushTagStart4.bind(this),
      pushTagStart8: this.pushTagStart8.bind(this),
      pushBreak: this.pushBreak.bind(this)
    }, this._heap)
  }

  get _depth () {
    return this._parents.length
  }

  get _currentParent () {
    return this._parents[this._depth - 1]
  }

  get _ref () {
    return this._currentParent.ref
  }

  // Finish the current parent
  _closeParent () {
    var p = this._parents.pop()

    if (p.length > 0) {
      throw new Error(`Missing ${p.length} elements`)
    }

    switch (p.type) {
      case c.PARENT.TAG:
        this._push(
          this.createTag(p.ref[0], p.ref[1])
        )
        break
      case c.PARENT.BYTE_STRING:
        this._push(this.createByteString(p.ref, p.length))
        break
      case c.PARENT.UTF8_STRING:
        this._push(this.createUtf8String(p.ref, p.length))
        break
      case c.PARENT.MAP:
        if (p.values % 2 > 0) {
          throw new Error('Odd number of elements in the map')
        }
        this._push(this.createMap(p.ref, p.length))
        break
      case c.PARENT.OBJECT:
        if (p.values % 2 > 0) {
          throw new Error('Odd number of elements in the map')
        }
        this._push(this.createObject(p.ref, p.length))
        break
      case c.PARENT.ARRAY:
        this._push(this.createArray(p.ref, p.length))
        break
      default:
        break
    }

    if (this._currentParent && this._currentParent.type === c.PARENT.TAG) {
      this._dec()
    }
  }

  // Reduce the expected length of the current parent by one
  _dec () {
    const p = this._currentParent
    // The current parent does not know the epxected child length

    if (p.length < 0) {
      return
    }

    p.length--

    // All children were seen, we can close the current parent
    if (p.length === 0) {
      this._closeParent()
    }
  }

  // Push any value to the current parent
  _push (val, hasChildren) {
    const p = this._currentParent
    p.values++

    switch (p.type) {
      case c.PARENT.ARRAY:
      case c.PARENT.BYTE_STRING:
      case c.PARENT.UTF8_STRING:
        if (p.length > -1) {
          this._ref[this._ref.length - p.length] = val
        } else {
          this._ref.push(val)
        }
        this._dec()
        break
      case c.PARENT.OBJECT:
        if (p.tmpKey != null) {
          this._ref[p.tmpKey] = val
          p.tmpKey = null
          this._dec()
        } else {
          p.tmpKey = val

          if (typeof p.tmpKey !== 'string') {
            // too bad, convert to a Map
            p.type = c.PARENT.MAP
            p.ref = utils.buildMap(p.ref)
          }
        }
        break
      case c.PARENT.MAP:
        if (p.tmpKey != null) {
          this._ref.set(p.tmpKey, val)
          p.tmpKey = null
          this._dec()
        } else {
          p.tmpKey = val
        }
        break
      case c.PARENT.TAG:
        this._ref.push(val)
        if (!hasChildren) {
          this._dec()
        }
        break
      default:
        throw new Error('Unknown parent type')
    }
  }

  // Create a new parent in the parents list
  _createParent (obj, type, len) {
    this._parents[this._depth] = {
      type: type,
      length: len,
      ref: obj,
      values: 0,
      tmpKey: null
    }
  }

  // Reset all state back to the beginning, also used for initiatlization
  _reset () {
    this._res = []
    this._parents = [{
      type: c.PARENT.ARRAY,
      length: -1,
      ref: this._res,
      values: 0,
      tmpKey: null
    }]
  }

  // -- Interface to customize deoding behaviour
  createTag (tagNumber, value) {
    const typ = this._knownTags[tagNumber]

    if (!typ) {
      return new Tagged(tagNumber, value)
    }

    return typ(value)
  }

  createMap (obj, len) {
    return obj
  }

  createObject (obj, len) {
    return obj
  }

  createArray (arr, len) {
    return arr
  }

  createByteString (raw, len) {
    return Buffer.concat(raw)
  }

  createByteStringFromHeap (start, end) {
    if (start === end) {
      return Buffer.alloc(0)
    }

    return Buffer.from(this._heap.slice(start, end))
  }

  createInt (val) {
    return val
  }

  createInt32 (f, g) {
    return utils.buildInt32(f, g)
  }

  createInt64 (f1, f2, g1, g2) {
    return utils.buildInt64(f1, f2, g1, g2)
  }

  createFloat (val) {
    return val
  }

  createFloatSingle (a, b, c, d) {
    return ieee754.read([a, b, c, d], 0, false, 23, 4)
  }

  createFloatDouble (a, b, c, d, e, f, g, h) {
    return ieee754.read([a, b, c, d, e, f, g, h], 0, false, 52, 8)
  }

  createInt32Neg (f, g) {
    return -1 - utils.buildInt32(f, g)
  }

  createInt64Neg (f1, f2, g1, g2) {
    const f = utils.buildInt32(f1, f2)
    const g = utils.buildInt32(g1, g2)

    if (f > c.MAX_SAFE_HIGH) {
      return c.NEG_ONE.minus(new Bignumber(f).times(c.SHIFT32).plus(g))
    }

    return -1 - ((f * c.SHIFT32) + g)
  }

  createTrue () {
    return true
  }

  createFalse () {
    return false
  }

  createNull () {
    return null
  }

  createUndefined () {
    return void 0
  }

  createInfinity () {
    return Infinity
  }

  createInfinityNeg () {
    return -Infinity
  }

  createNaN () {
    return NaN
  }

  createNaNNeg () {
    return -NaN
  }

  createUtf8String (raw, len) {
    return raw.join('')
  }

  createUtf8StringFromHeap (start, end) {
    if (start === end) {
      return ''
    }

    return this._buffer.toString('utf8', start, end)
  }

  createSimpleUnassigned (val) {
    return new Simple(val)
  }

  // -- Interface for decoder.asm.js

  pushInt (val) {
    this._push(this.createInt(val))
  }

  pushInt32 (f, g) {
    this._push(this.createInt32(f, g))
  }

  pushInt64 (f1, f2, g1, g2) {
    this._push(this.createInt64(f1, f2, g1, g2))
  }

  pushFloat (val) {
    this._push(this.createFloat(val))
  }

  pushFloatSingle (a, b, c, d) {
    this._push(this.createFloatSingle(a, b, c, d))
  }

  pushFloatDouble (a, b, c, d, e, f, g, h) {
    this._push(this.createFloatDouble(a, b, c, d, e, f, g, h))
  }

  pushInt32Neg (f, g) {
    this._push(this.createInt32Neg(f, g))
  }

  pushInt64Neg (f1, f2, g1, g2) {
    this._push(this.createInt64Neg(f1, f2, g1, g2))
  }

  pushTrue () {
    this._push(this.createTrue())
  }

  pushFalse () {
    this._push(this.createFalse())
  }

  pushNull () {
    this._push(this.createNull())
  }

  pushUndefined () {
    this._push(this.createUndefined())
  }

  pushInfinity () {
    this._push(this.createInfinity())
  }

  pushInfinityNeg () {
    this._push(this.createInfinityNeg())
  }

  pushNaN () {
    this._push(this.createNaN())
  }

  pushNaNNeg () {
    this._push(this.createNaNNeg())
  }

  pushArrayStart () {
    this._createParent([], c.PARENT.ARRAY, -1)
  }

  pushArrayStartFixed (len) {
    this._createArrayStartFixed(len)
  }

  pushArrayStartFixed32 (len1, len2) {
    const len = utils.buildInt32(len1, len2)
    this._createArrayStartFixed(len)
  }

  pushArrayStartFixed64 (len1, len2, len3, len4) {
    const len = utils.buildInt64(len1, len2, len3, len4)
    this._createArrayStartFixed(len)
  }

  pushObjectStart () {
    this._createObjectStartFixed(-1)
  }

  pushObjectStartFixed (len) {
    this._createObjectStartFixed(len)
  }

  pushObjectStartFixed32 (len1, len2) {
    const len = utils.buildInt32(len1, len2)
    this._createObjectStartFixed(len)
  }

  pushObjectStartFixed64 (len1, len2, len3, len4) {
    const len = utils.buildInt64(len1, len2, len3, len4)
    this._createObjectStartFixed(len)
  }

  pushByteStringStart () {
    this._parents[this._depth] = {
      type: c.PARENT.BYTE_STRING,
      length: -1,
      ref: [],
      values: 0,
      tmpKey: null
    }
  }

  pushByteString (start, end) {
    this._push(this.createByteStringFromHeap(start, end))
  }

  pushUtf8StringStart () {
    this._parents[this._depth] = {
      type: c.PARENT.UTF8_STRING,
      length: -1,
      ref: [],
      values: 0,
      tmpKey: null
    }
  }

  pushUtf8String (start, end) {
    this._push(this.createUtf8StringFromHeap(start, end))
  }

  pushSimpleUnassigned (val) {
    this._push(this.createSimpleUnassigned(val))
  }

  pushTagStart (tag) {
    this._parents[this._depth] = {
      type: c.PARENT.TAG,
      length: 1,
      ref: [tag]
    }
  }

  pushTagStart4 (f, g) {
    this.pushTagStart(utils.buildInt32(f, g))
  }

  pushTagStart8 (f1, f2, g1, g2) {
    this.pushTagStart(utils.buildInt64(f1, f2, g1, g2))
  }

  pushTagUnassigned (tagNumber) {
    this._push(this.createTag(tagNumber))
  }

  pushBreak () {
    if (this._currentParent.length > -1) {
      throw new Error('Unexpected break')
    }

    this._closeParent()
  }

  _createObjectStartFixed (len) {
    if (len === 0) {
      this._push(this.createObject({}))
      return
    }

    this._createParent({}, c.PARENT.OBJECT, len)
  }

  _createArrayStartFixed (len) {
    if (len === 0) {
      this._push(this.createArray([]))
      return
    }

    this._createParent(new Array(len), c.PARENT.ARRAY, len)
  }

  _decode (input) {
    if (input.byteLength === 0) {
      throw new Error('Input too short')
    }

    this._reset()
    this._heap8.set(input)
    const code = this.parser.parse(input.byteLength)

    if (this._depth > 1) {
      while (this._currentParent.length === 0) {
        this._closeParent()
      }
      if (this._depth > 1) {
        throw new Error('Undeterminated nesting')
      }
    }

    if (code > 0) {
      throw new Error('Failed to parse')
    }

    if (this._res.length === 0) {
      throw new Error('No valid result')
    }
  }

  // -- Public Interface

  decodeFirst (input) {
    this._decode(input)

    return this._res[0]
  }

  decodeAll (input) {
    this._decode(input)

    return this._res
  }

  /**
   * Decode the first cbor object.
   *
   * @param {Buffer|string} input
   * @param {string} [enc='hex'] - Encoding used if a string is passed.
   * @returns {*}
   */
  static decode (input, enc) {
    if (typeof input === 'string') {
      input = Buffer.from(input, enc || 'hex')
    }

    const dec = new Decoder({ size: input.length })
    return dec.decodeFirst(input)
  }

  /**
   * Decode all cbor objects.
   *
   * @param {Buffer|string} input
   * @param {string} [enc='hex'] - Encoding used if a string is passed.
   * @returns {Array<*>}
   */
  static decodeAll (input, enc) {
    if (typeof input === 'string') {
      input = Buffer.from(input, enc || 'hex')
    }

    const dec = new Decoder({ size: input.length })
    return dec.decodeAll(input)
  }
}

Decoder.decodeFirst = Decoder.decode

module.exports = Decoder

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"./constants":"/Users/phx/Sync/sign-search/node_modules/borc/src/constants.js","./decoder.asm":"/Users/phx/Sync/sign-search/node_modules/borc/src/decoder.asm.js","./simple":"/Users/phx/Sync/sign-search/node_modules/borc/src/simple.js","./tagged":"/Users/phx/Sync/sign-search/node_modules/borc/src/tagged.js","./utils":"/Users/phx/Sync/sign-search/node_modules/borc/src/utils.js","bignumber.js":"/Users/phx/Sync/sign-search/node_modules/bignumber.js/bignumber.js","buffer":"/Users/phx/Sync/sign-search/node_modules/buffer/index.js","ieee754":"/Users/phx/Sync/sign-search/node_modules/ieee754/index.js","iso-url":"/Users/phx/Sync/sign-search/node_modules/iso-url/index.js"}],"/Users/phx/Sync/sign-search/node_modules/borc/src/diagnose.js":[function(require,module,exports){
(function (Buffer){
'use strict'

const Decoder = require('./decoder')
const utils = require('./utils')

/**
 * Output the diagnostic format from a stream of CBOR bytes.
 *
 */
class Diagnose extends Decoder {
  createTag (tagNumber, value) {
    return `${tagNumber}(${value})`
  }

  createInt (val) {
    return super.createInt(val).toString()
  }

  createInt32 (f, g) {
    return super.createInt32(f, g).toString()
  }

  createInt64 (f1, f2, g1, g2) {
    return super.createInt64(f1, f2, g1, g2).toString()
  }

  createInt32Neg (f, g) {
    return super.createInt32Neg(f, g).toString()
  }

  createInt64Neg (f1, f2, g1, g2) {
    return super.createInt64Neg(f1, f2, g1, g2).toString()
  }

  createTrue () {
    return 'true'
  }

  createFalse () {
    return 'false'
  }

  createFloat (val) {
    const fl = super.createFloat(val)
    if (utils.isNegativeZero(val)) {
      return '-0_1'
    }

    return `${fl}_1`
  }

  createFloatSingle (a, b, c, d) {
    const fl = super.createFloatSingle(a, b, c, d)
    return `${fl}_2`
  }

  createFloatDouble (a, b, c, d, e, f, g, h) {
    const fl = super.createFloatDouble(a, b, c, d, e, f, g, h)
    return `${fl}_3`
  }

  createByteString (raw, len) {
    const val = raw.join(', ')

    if (len === -1) {
      return `(_ ${val})`
    }
    return `h'${val}`
  }

  createByteStringFromHeap (start, end) {
    const val = (Buffer.from(
      super.createByteStringFromHeap(start, end)
    )).toString('hex')

    return `h'${val}'`
  }

  createInfinity () {
    return 'Infinity_1'
  }

  createInfinityNeg () {
    return '-Infinity_1'
  }

  createNaN () {
    return 'NaN_1'
  }

  createNaNNeg () {
    return '-NaN_1'
  }

  createNull () {
    return 'null'
  }

  createUndefined () {
    return 'undefined'
  }

  createSimpleUnassigned (val) {
    return `simple(${val})`
  }

  createArray (arr, len) {
    const val = super.createArray(arr, len)

    if (len === -1) {
      // indefinite
      return `[_ ${val.join(', ')}]`
    }

    return `[${val.join(', ')}]`
  }

  createMap (map, len) {
    const val = super.createMap(map)
    const list = Array.from(val.keys())
      .reduce(collectObject(val), '')

    if (len === -1) {
      return `{_ ${list}}`
    }

    return `{${list}}`
  }

  createObject (obj, len) {
    const val = super.createObject(obj)
    const map = Object.keys(val)
      .reduce(collectObject(val), '')

    if (len === -1) {
      return `{_ ${map}}`
    }

    return `{${map}}`
  }

  createUtf8String (raw, len) {
    const val = raw.join(', ')

    if (len === -1) {
      return `(_ ${val})`
    }

    return `"${val}"`
  }

  createUtf8StringFromHeap (start, end) {
    const val = (Buffer.from(
      super.createUtf8StringFromHeap(start, end)
    )).toString('utf8')

    return `"${val}"`
  }

  static diagnose (input, enc) {
    if (typeof input === 'string') {
      input = Buffer.from(input, enc || 'hex')
    }

    const dec = new Diagnose()
    return dec.decodeFirst(input)
  }
}

module.exports = Diagnose

function collectObject (val) {
  return (acc, key) => {
    if (acc) {
      return `${acc}, ${key}: ${val[key]}`
    }
    return `${key}: ${val[key]}`
  }
}

}).call(this,require("buffer").Buffer)

},{"./decoder":"/Users/phx/Sync/sign-search/node_modules/borc/src/decoder.js","./utils":"/Users/phx/Sync/sign-search/node_modules/borc/src/utils.js","buffer":"/Users/phx/Sync/sign-search/node_modules/buffer/index.js"}],"/Users/phx/Sync/sign-search/node_modules/borc/src/encoder.js":[function(require,module,exports){
(function (Buffer){
'use strict'

const { URL } = require('iso-url')
const Bignumber = require('bignumber.js').BigNumber

const utils = require('./utils')
const constants = require('./constants')
const MT = constants.MT
const NUMBYTES = constants.NUMBYTES
const SHIFT32 = constants.SHIFT32
const SYMS = constants.SYMS
const TAG = constants.TAG
const HALF = (constants.MT.SIMPLE_FLOAT << 5) | constants.NUMBYTES.TWO
const FLOAT = (constants.MT.SIMPLE_FLOAT << 5) | constants.NUMBYTES.FOUR
const DOUBLE = (constants.MT.SIMPLE_FLOAT << 5) | constants.NUMBYTES.EIGHT
const TRUE = (constants.MT.SIMPLE_FLOAT << 5) | constants.SIMPLE.TRUE
const FALSE = (constants.MT.SIMPLE_FLOAT << 5) | constants.SIMPLE.FALSE
const UNDEFINED = (constants.MT.SIMPLE_FLOAT << 5) | constants.SIMPLE.UNDEFINED
const NULL = (constants.MT.SIMPLE_FLOAT << 5) | constants.SIMPLE.NULL

const MAXINT_BN = new Bignumber('0x20000000000000')
const BUF_NAN = Buffer.from('f97e00', 'hex')
const BUF_INF_NEG = Buffer.from('f9fc00', 'hex')
const BUF_INF_POS = Buffer.from('f97c00', 'hex')

function toType (obj) {
  // [object Type]
  // --------8---1
  return ({}).toString.call(obj).slice(8, -1)
}

/**
 * Transform JavaScript values into CBOR bytes
 *
 */
class Encoder {
  /**
   * @param {Object} [options={}]
   * @param {function(Buffer)} options.stream
   */
  constructor (options) {
    options = options || {}

    this.streaming = typeof options.stream === 'function'
    this.onData = options.stream

    this.semanticTypes = [
      [URL, this._pushUrl],
      [Bignumber, this._pushBigNumber]
    ]

    const addTypes = options.genTypes || []
    const len = addTypes.length
    for (let i = 0; i < len; i++) {
      this.addSemanticType(
        addTypes[i][0],
        addTypes[i][1]
      )
    }

    this._reset()
  }

  addSemanticType (type, fun) {
    const len = this.semanticTypes.length
    for (let i = 0; i < len; i++) {
      const typ = this.semanticTypes[i][0]
      if (typ === type) {
        const old = this.semanticTypes[i][1]
        this.semanticTypes[i][1] = fun
        return old
      }
    }
    this.semanticTypes.push([type, fun])
    return null
  }

  push (val) {
    if (!val) {
      return true
    }

    this.result[this.offset] = val
    this.resultMethod[this.offset] = 0
    this.resultLength[this.offset] = val.length
    this.offset++

    if (this.streaming) {
      this.onData(this.finalize())
    }

    return true
  }

  pushWrite (val, method, len) {
    this.result[this.offset] = val
    this.resultMethod[this.offset] = method
    this.resultLength[this.offset] = len
    this.offset++

    if (this.streaming) {
      this.onData(this.finalize())
    }

    return true
  }

  _pushUInt8 (val) {
    return this.pushWrite(val, 1, 1)
  }

  _pushUInt16BE (val) {
    return this.pushWrite(val, 2, 2)
  }

  _pushUInt32BE (val) {
    return this.pushWrite(val, 3, 4)
  }

  _pushDoubleBE (val) {
    return this.pushWrite(val, 4, 8)
  }

  _pushNaN () {
    return this.push(BUF_NAN)
  }

  _pushInfinity (obj) {
    const half = (obj < 0) ? BUF_INF_NEG : BUF_INF_POS
    return this.push(half)
  }

  _pushFloat (obj) {
    const b2 = Buffer.allocUnsafe(2)

    if (utils.writeHalf(b2, obj)) {
      if (utils.parseHalf(b2) === obj) {
        return this._pushUInt8(HALF) && this.push(b2)
      }
    }

    const b4 = Buffer.allocUnsafe(4)
    b4.writeFloatBE(obj, 0)
    if (b4.readFloatBE(0) === obj) {
      return this._pushUInt8(FLOAT) && this.push(b4)
    }

    return this._pushUInt8(DOUBLE) && this._pushDoubleBE(obj)
  }

  _pushInt (obj, mt, orig) {
    const m = mt << 5
    if (obj < 24) {
      return this._pushUInt8(m | obj)
    }

    if (obj <= 0xff) {
      return this._pushUInt8(m | NUMBYTES.ONE) && this._pushUInt8(obj)
    }

    if (obj <= 0xffff) {
      return this._pushUInt8(m | NUMBYTES.TWO) && this._pushUInt16BE(obj)
    }

    if (obj <= 0xffffffff) {
      return this._pushUInt8(m | NUMBYTES.FOUR) && this._pushUInt32BE(obj)
    }

    if (obj <= Number.MAX_SAFE_INTEGER) {
      return this._pushUInt8(m | NUMBYTES.EIGHT) &&
        this._pushUInt32BE(Math.floor(obj / SHIFT32)) &&
        this._pushUInt32BE(obj % SHIFT32)
    }

    if (mt === MT.NEG_INT) {
      return this._pushFloat(orig)
    }

    return this._pushFloat(obj)
  }

  _pushIntNum (obj) {
    if (obj < 0) {
      return this._pushInt(-obj - 1, MT.NEG_INT, obj)
    } else {
      return this._pushInt(obj, MT.POS_INT)
    }
  }

  _pushNumber (obj) {
    switch (false) {
      case (obj === obj): // eslint-disable-line
        return this._pushNaN(obj)
      case isFinite(obj):
        return this._pushInfinity(obj)
      case ((obj % 1) !== 0):
        return this._pushIntNum(obj)
      default:
        return this._pushFloat(obj)
    }
  }

  _pushString (obj) {
    const len = Buffer.byteLength(obj, 'utf8')
    return this._pushInt(len, MT.UTF8_STRING) && this.pushWrite(obj, 5, len)
  }

  _pushBoolean (obj) {
    return this._pushUInt8(obj ? TRUE : FALSE)
  }

  _pushUndefined (obj) {
    return this._pushUInt8(UNDEFINED)
  }

  _pushArray (gen, obj) {
    const len = obj.length
    if (!gen._pushInt(len, MT.ARRAY)) {
      return false
    }
    for (let j = 0; j < len; j++) {
      if (!gen.pushAny(obj[j])) {
        return false
      }
    }
    return true
  }

  _pushTag (tag) {
    return this._pushInt(tag, MT.TAG)
  }

  _pushDate (gen, obj) {
    // Round date, to get seconds since 1970-01-01 00:00:00 as defined in
    // Sec. 2.4.1 and get a possibly more compact encoding. Note that it is
    // still allowed to encode fractions of seconds which can be achieved by
    // changing overwriting the encode function for Date objects.
    return gen._pushTag(TAG.DATE_EPOCH) && gen.pushAny(Math.round(obj / 1000))
  }

  _pushBuffer (gen, obj) {
    return gen._pushInt(obj.length, MT.BYTE_STRING) && gen.push(obj)
  }

  _pushNoFilter (gen, obj) {
    return gen._pushBuffer(gen, obj.slice())
  }

  _pushRegexp (gen, obj) {
    return gen._pushTag(TAG.REGEXP) && gen.pushAny(obj.source)
  }

  _pushSet (gen, obj) {
    if (!gen._pushInt(obj.size, MT.ARRAY)) {
      return false
    }
    for (let x of obj) {
      if (!gen.pushAny(x)) {
        return false
      }
    }
    return true
  }

  _pushUrl (gen, obj) {
    return gen._pushTag(TAG.URI) && gen.pushAny(obj.format())
  }

  _pushBigint (obj) {
    let tag = TAG.POS_BIGINT
    if (obj.isNegative()) {
      obj = obj.negated().minus(1)
      tag = TAG.NEG_BIGINT
    }
    let str = obj.toString(16)
    if (str.length % 2) {
      str = '0' + str
    }
    const buf = Buffer.from(str, 'hex')
    return this._pushTag(tag) && this._pushBuffer(this, buf)
  }

  _pushBigNumber (gen, obj) {
    if (obj.isNaN()) {
      return gen._pushNaN()
    }
    if (!obj.isFinite()) {
      return gen._pushInfinity(obj.isNegative() ? -Infinity : Infinity)
    }
    if (obj.isInteger()) {
      return gen._pushBigint(obj)
    }
    if (!(gen._pushTag(TAG.DECIMAL_FRAC) &&
      gen._pushInt(2, MT.ARRAY))) {
      return false
    }

    const dec = obj.decimalPlaces()
    const slide = obj.multipliedBy(new Bignumber(10).pow(dec))
    if (!gen._pushIntNum(-dec)) {
      return false
    }
    if (slide.abs().isLessThan(MAXINT_BN)) {
      return gen._pushIntNum(slide.toNumber())
    } else {
      return gen._pushBigint(slide)
    }
  }

  _pushMap (gen, obj) {
    if (!gen._pushInt(obj.size, MT.MAP)) {
      return false
    }

    return this._pushRawMap(
      obj.size,
      Array.from(obj)
    )
  }

  _pushObject (obj) {
    if (!obj) {
      return this._pushUInt8(NULL)
    }

    var len = this.semanticTypes.length
    for (var i = 0; i < len; i++) {
      if (obj instanceof this.semanticTypes[i][0]) {
        return this.semanticTypes[i][1].call(obj, this, obj)
      }
    }

    var f = obj.encodeCBOR
    if (typeof f === 'function') {
      return f.call(obj, this)
    }

    var keys = Object.keys(obj)
    var keyLength = keys.length
    if (!this._pushInt(keyLength, MT.MAP)) {
      return false
    }

    return this._pushRawMap(
      keyLength,
      keys.map((k) => [k, obj[k]])
    )
  }

  _pushRawMap (len, map) {
    // Sort keys for canoncialization
    // 1. encode key
    // 2. shorter key comes before longer key
    // 3. same length keys are sorted with lower
    //    byte value before higher

    map = map.map(function (a) {
      a[0] = Encoder.encode(a[0])
      return a
    }).sort(utils.keySorter)

    for (var j = 0; j < len; j++) {
      if (!this.push(map[j][0])) {
        return false
      }

      if (!this.pushAny(map[j][1])) {
        return false
      }
    }

    return true
  }

  /**
   * Alias for `.pushAny`
   *
   * @param {*} obj
   * @returns {boolean} true on success
   */
  write (obj) {
    return this.pushAny(obj)
  }

  /**
   * Push any supported type onto the encoded stream
   *
   * @param {any} obj
   * @returns {boolean} true on success
   */
  pushAny (obj) {
    var typ = toType(obj)

    switch (typ) {
      case 'Number':
        return this._pushNumber(obj)
      case 'String':
        return this._pushString(obj)
      case 'Boolean':
        return this._pushBoolean(obj)
      case 'Object':
        return this._pushObject(obj)
      case 'Array':
        return this._pushArray(this, obj)
      case 'Uint8Array':
        return this._pushBuffer(this, Buffer.isBuffer(obj) ? obj : Buffer.from(obj))
      case 'Null':
        return this._pushUInt8(NULL)
      case 'Undefined':
        return this._pushUndefined(obj)
      case 'Map':
        return this._pushMap(this, obj)
      case 'Set':
        return this._pushSet(this, obj)
      case 'URL':
        return this._pushUrl(this, obj)
      case 'BigNumber':
        return this._pushBigNumber(this, obj)
      case 'Date':
        return this._pushDate(this, obj)
      case 'RegExp':
        return this._pushRegexp(this, obj)
      case 'Symbol':
        switch (obj) {
          case SYMS.NULL:
            return this._pushObject(null)
          case SYMS.UNDEFINED:
            return this._pushUndefined(void 0)
          // TODO: Add pluggable support for other symbols
          default:
            throw new Error('Unknown symbol: ' + obj.toString())
        }
      default:
        throw new Error('Unknown type: ' + typeof obj + ', ' + (obj ? obj.toString() : ''))
    }
  }

  finalize () {
    if (this.offset === 0) {
      return null
    }

    var result = this.result
    var resultLength = this.resultLength
    var resultMethod = this.resultMethod
    var offset = this.offset

    // Determine the size of the buffer
    var size = 0
    var i = 0

    for (; i < offset; i++) {
      size += resultLength[i]
    }

    var res = Buffer.allocUnsafe(size)
    var index = 0
    var length = 0

    // Write the content into the result buffer
    for (i = 0; i < offset; i++) {
      length = resultLength[i]

      switch (resultMethod[i]) {
        case 0:
          result[i].copy(res, index)
          break
        case 1:
          res.writeUInt8(result[i], index, true)
          break
        case 2:
          res.writeUInt16BE(result[i], index, true)
          break
        case 3:
          res.writeUInt32BE(result[i], index, true)
          break
        case 4:
          res.writeDoubleBE(result[i], index, true)
          break
        case 5:
          res.write(result[i], index, length, 'utf8')
          break
        default:
          throw new Error('unkown method')
      }

      index += length
    }

    var tmp = res

    this._reset()

    return tmp
  }

  _reset () {
    this.result = []
    this.resultMethod = []
    this.resultLength = []
    this.offset = 0
  }

  /**
   * Encode the given value
   * @param {*} o
   * @returns {Buffer}
   */
  static encode (o) {
    const enc = new Encoder()
    const ret = enc.pushAny(o)
    if (!ret) {
      throw new Error('Failed to encode input')
    }

    return enc.finalize()
  }
}

module.exports = Encoder

}).call(this,require("buffer").Buffer)

},{"./constants":"/Users/phx/Sync/sign-search/node_modules/borc/src/constants.js","./utils":"/Users/phx/Sync/sign-search/node_modules/borc/src/utils.js","bignumber.js":"/Users/phx/Sync/sign-search/node_modules/bignumber.js/bignumber.js","buffer":"/Users/phx/Sync/sign-search/node_modules/buffer/index.js","iso-url":"/Users/phx/Sync/sign-search/node_modules/iso-url/index.js"}],"/Users/phx/Sync/sign-search/node_modules/borc/src/index.js":[function(require,module,exports){
'use strict'

// exports.Commented = require('./commented')
exports.Diagnose = require('./diagnose')
exports.Decoder = require('./decoder')
exports.Encoder = require('./encoder')
exports.Simple = require('./simple')
exports.Tagged = require('./tagged')

// exports.comment = exports.Commented.comment
exports.decodeAll = exports.Decoder.decodeAll
exports.decodeFirst = exports.Decoder.decodeFirst
exports.diagnose = exports.Diagnose.diagnose
exports.encode = exports.Encoder.encode
exports.decode = exports.Decoder.decode

exports.leveldb = {
  decode: exports.Decoder.decodeAll,
  encode: exports.Encoder.encode,
  buffer: true,
  name: 'cbor'
}

},{"./decoder":"/Users/phx/Sync/sign-search/node_modules/borc/src/decoder.js","./diagnose":"/Users/phx/Sync/sign-search/node_modules/borc/src/diagnose.js","./encoder":"/Users/phx/Sync/sign-search/node_modules/borc/src/encoder.js","./simple":"/Users/phx/Sync/sign-search/node_modules/borc/src/simple.js","./tagged":"/Users/phx/Sync/sign-search/node_modules/borc/src/tagged.js"}],"/Users/phx/Sync/sign-search/node_modules/borc/src/simple.js":[function(require,module,exports){
'use strict'

const constants = require('./constants')
const MT = constants.MT
const SIMPLE = constants.SIMPLE
const SYMS = constants.SYMS

/**
 * A CBOR Simple Value that does not map onto a known constant.
 */
class Simple {
  /**
   * Creates an instance of Simple.
   *
   * @param {integer} value - the simple value's integer value
   */
  constructor (value) {
    if (typeof value !== 'number') {
      throw new Error('Invalid Simple type: ' + (typeof value))
    }
    if ((value < 0) || (value > 255) || ((value | 0) !== value)) {
      throw new Error('value must be a small positive integer: ' + value)
    }
    this.value = value
  }

  /**
   * Debug string for simple value
   *
   * @returns {string} simple(value)
   */
  toString () {
    return 'simple(' + this.value + ')'
  }

  /**
   * Debug string for simple value
   *
   * @returns {string} simple(value)
   */
  inspect () {
    return 'simple(' + this.value + ')'
  }

  /**
   * Push the simple value onto the CBOR stream
   *
   * @param {cbor.Encoder} gen The generator to push onto
   * @returns {number}
   */
  encodeCBOR (gen) {
    return gen._pushInt(this.value, MT.SIMPLE_FLOAT)
  }

  /**
   * Is the given object a Simple?
   *
   * @param {any} obj - object to test
   * @returns {bool} - is it Simple?
   */
  static isSimple (obj) {
    return obj instanceof Simple
  }

  /**
   * Decode from the CBOR additional information into a JavaScript value.
   * If the CBOR item has no parent, return a "safe" symbol instead of
   * `null` or `undefined`, so that the value can be passed through a
   * stream in object mode.
   *
   * @param {Number} val - the CBOR additional info to convert
   * @param {bool} hasParent - Does the CBOR item have a parent?
   * @returns {(null|undefined|Boolean|Symbol)} - the decoded value
   */
  static decode (val, hasParent) {
    if (hasParent == null) {
      hasParent = true
    }
    switch (val) {
      case SIMPLE.FALSE:
        return false
      case SIMPLE.TRUE:
        return true
      case SIMPLE.NULL:
        if (hasParent) {
          return null
        } else {
          return SYMS.NULL
        }
      case SIMPLE.UNDEFINED:
        if (hasParent) {
          return void 0
        } else {
          return SYMS.UNDEFINED
        }
      case -1:
        if (!hasParent) {
          throw new Error('Invalid BREAK')
        }
        return SYMS.BREAK
      default:
        return new Simple(val)
    }
  }
}

module.exports = Simple

},{"./constants":"/Users/phx/Sync/sign-search/node_modules/borc/src/constants.js"}],"/Users/phx/Sync/sign-search/node_modules/borc/src/tagged.js":[function(require,module,exports){
'use strict'

/**
 * A CBOR tagged item, where the tag does not have semantics specified at the
 * moment, or those semantics threw an error during parsing. Typically this will
 * be an extension point you're not yet expecting.
 */
class Tagged {
  /**
   * Creates an instance of Tagged.
   *
   * @param {Number} tag - the number of the tag
   * @param {any} value - the value inside the tag
   * @param {Error} err - the error that was thrown parsing the tag, or null
   */
  constructor (tag, value, err) {
    this.tag = tag
    this.value = value
    this.err = err
    if (typeof this.tag !== 'number') {
      throw new Error('Invalid tag type (' + (typeof this.tag) + ')')
    }
    if ((this.tag < 0) || ((this.tag | 0) !== this.tag)) {
      throw new Error('Tag must be a positive integer: ' + this.tag)
    }
  }

  /**
   * Convert to a String
   *
   * @returns {String} string of the form '1(2)'
   */
  toString () {
    return `${this.tag}(${JSON.stringify(this.value)})`
  }

  /**
   * Push the simple value onto the CBOR stream
   *
   * @param {cbor.Encoder} gen The generator to push onto
   * @returns {number}
   */
  encodeCBOR (gen) {
    gen._pushTag(this.tag)
    return gen.pushAny(this.value)
  }

  /**
   * If we have a converter for this type, do the conversion.  Some converters
   * are built-in.  Additional ones can be passed in.  If you want to remove
   * a built-in converter, pass a converter in whose value is 'null' instead
   * of a function.
   *
   * @param {Object} converters - keys in the object are a tag number, the value
   *   is a function that takes the decoded CBOR and returns a JavaScript value
   *   of the appropriate type.  Throw an exception in the function on errors.
   * @returns {any} - the converted item
   */
  convert (converters) {
    var er, f
    f = converters != null ? converters[this.tag] : void 0
    if (typeof f !== 'function') {
      f = Tagged['_tag' + this.tag]
      if (typeof f !== 'function') {
        return this
      }
    }
    try {
      return f.call(Tagged, this.value)
    } catch (error) {
      er = error
      this.err = er
      return this
    }
  }
}

module.exports = Tagged

},{}],"/Users/phx/Sync/sign-search/node_modules/borc/src/utils.js":[function(require,module,exports){
(function (Buffer){
'use strict'

const Bignumber = require('bignumber.js').BigNumber

const constants = require('./constants')
const SHIFT32 = constants.SHIFT32
const SHIFT16 = constants.SHIFT16
const MAX_SAFE_HIGH = 0x1fffff

exports.parseHalf = function parseHalf (buf) {
  var exp, mant, sign
  sign = buf[0] & 0x80 ? -1 : 1
  exp = (buf[0] & 0x7C) >> 2
  mant = ((buf[0] & 0x03) << 8) | buf[1]
  if (!exp) {
    return sign * 5.9604644775390625e-8 * mant
  } else if (exp === 0x1f) {
    return sign * (mant ? 0 / 0 : 2e308)
  } else {
    return sign * Math.pow(2, exp - 25) * (1024 + mant)
  }
}

function toHex (n) {
  if (n < 16) {
    return '0' + n.toString(16)
  }

  return n.toString(16)
}

exports.arrayBufferToBignumber = function (buf) {
  const len = buf.byteLength
  let res = ''
  for (let i = 0; i < len; i++) {
    res += toHex(buf[i])
  }

  return new Bignumber(res, 16)
}

// convert an Object into a Map
exports.buildMap = (obj) => {
  const res = new Map()
  const keys = Object.keys(obj)
  const length = keys.length
  for (let i = 0; i < length; i++) {
    res.set(keys[i], obj[keys[i]])
  }
  return res
}

exports.buildInt32 = (f, g) => {
  return f * SHIFT16 + g
}

exports.buildInt64 = (f1, f2, g1, g2) => {
  const f = exports.buildInt32(f1, f2)
  const g = exports.buildInt32(g1, g2)

  if (f > MAX_SAFE_HIGH) {
    return new Bignumber(f).times(SHIFT32).plus(g)
  } else {
    return (f * SHIFT32) + g
  }
}

exports.writeHalf = function writeHalf (buf, half) {
  // assume 0, -0, NaN, Infinity, and -Infinity have already been caught

  // HACK: everyone settle in.  This isn't going to be pretty.
  // Translate cn-cbor's C code (from Carsten Borman):

  // uint32_t be32;
  // uint16_t be16, u16;
  // union {
  //   float f;
  //   uint32_t u;
  // } u32;
  // u32.f = float_val;

  const u32 = Buffer.allocUnsafe(4)
  u32.writeFloatBE(half, 0)
  const u = u32.readUInt32BE(0)

  // if ((u32.u & 0x1FFF) == 0) { /* worth trying half */

  // hildjj: If the lower 13 bits are 0, we won't lose anything in the conversion
  if ((u & 0x1FFF) !== 0) {
    return false
  }

  //   int s16 = (u32.u >> 16) & 0x8000;
  //   int exp = (u32.u >> 23) & 0xff;
  //   int mant = u32.u & 0x7fffff;

  var s16 = (u >> 16) & 0x8000 // top bit is sign
  const exp = (u >> 23) & 0xff // then 5 bits of exponent
  const mant = u & 0x7fffff

  //   if (exp == 0 && mant == 0)
  //     ;              /* 0.0, -0.0 */

  // hildjj: zeros already handled.  Assert if you don't believe me.

  //   else if (exp >= 113 && exp <= 142) /* normalized */
  //     s16 += ((exp - 112) << 10) + (mant >> 13);
  if ((exp >= 113) && (exp <= 142)) {
    s16 += ((exp - 112) << 10) + (mant >> 13)

  //   else if (exp >= 103 && exp < 113) { /* denorm, exp16 = 0 */
  //     if (mant & ((1 << (126 - exp)) - 1))
  //       goto float32;         /* loss of precision */
  //     s16 += ((mant + 0x800000) >> (126 - exp));
  } else if ((exp >= 103) && (exp < 113)) {
    if (mant & ((1 << (126 - exp)) - 1)) {
      return false
    }
    s16 += ((mant + 0x800000) >> (126 - exp))

    //   } else if (exp == 255 && mant == 0) { /* Inf */
    //     s16 += 0x7c00;

    // hildjj: Infinity already handled

  //   } else
  //     goto float32;           /* loss of range */
  } else {
    return false
  }

  //   ensure_writable(3);
  //   u16 = s16;
  //   be16 = hton16p((const uint8_t*)&u16);
  buf.writeUInt16BE(s16, 0)
  return true
}

exports.keySorter = function (a, b) {
  var lenA = a[0].byteLength
  var lenB = b[0].byteLength

  if (lenA > lenB) {
    return 1
  }

  if (lenB > lenA) {
    return -1
  }

  return a[0].compare(b[0])
}

// Adapted from http://www.2ality.com/2012/03/signedzero.html
exports.isNegativeZero = (x) => {
  return x === 0 && (1 / x < 0)
}

exports.nextPowerOf2 = (n) => {
  let count = 0
  // First n in the below condition is for
  // the case where n is 0
  if (n && !(n & (n - 1))) {
    return n
  }

  while (n !== 0) {
    n >>= 1
    count += 1
  }

  return 1 << count
}

}).call(this,require("buffer").Buffer)

},{"./constants":"/Users/phx/Sync/sign-search/node_modules/borc/src/constants.js","bignumber.js":"/Users/phx/Sync/sign-search/node_modules/bignumber.js/bignumber.js","buffer":"/Users/phx/Sync/sign-search/node_modules/buffer/index.js"}],"/Users/phx/Sync/sign-search/node_modules/buffer/index.js":[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)

},{"base64-js":"/Users/phx/Sync/sign-search/node_modules/base64-js/index.js","buffer":"/Users/phx/Sync/sign-search/node_modules/buffer/index.js","ieee754":"/Users/phx/Sync/sign-search/node_modules/ieee754/index.js"}],"/Users/phx/Sync/sign-search/node_modules/delay/index.js":[function(require,module,exports){
'use strict';

const createAbortError = () => {
	const error = new Error('Delay aborted');
	error.name = 'AbortError';
	return error;
};

const createDelay = ({clearTimeout: defaultClear, setTimeout: set, willResolve}) => (ms, {value, signal} = {}) => {
	if (signal && signal.aborted) {
		return Promise.reject(createAbortError());
	}

	let timeoutId;
	let settle;
	let rejectFn;
	const clear = defaultClear || clearTimeout;

	const signalListener = () => {
		clear(timeoutId);
		rejectFn(createAbortError());
	};

	const cleanup = () => {
		if (signal) {
			signal.removeEventListener('abort', signalListener);
		}
	};

	const delayPromise = new Promise((resolve, reject) => {
		settle = () => {
			cleanup();
			if (willResolve) {
				resolve(value);
			} else {
				reject(value);
			}
		};

		rejectFn = reject;
		timeoutId = (set || setTimeout)(settle, ms);
	});

	if (signal) {
		signal.addEventListener('abort', signalListener, {once: true});
	}

	delayPromise.clear = () => {
		clear(timeoutId);
		timeoutId = null;
		cleanup();
		settle();
	};

	return delayPromise;
};

const delay = createDelay({willResolve: true});
delay.reject = createDelay({willResolve: false});
delay.createWithTimers = ({clearTimeout, setTimeout}) => {
	const delay = createDelay({clearTimeout, setTimeout, willResolve: true});
	delay.reject = createDelay({clearTimeout, setTimeout, willResolve: false});
	return delay;
};

module.exports = delay;
// TODO: Remove this for the next major release
module.exports.default = delay;

},{}],"/Users/phx/Sync/sign-search/node_modules/ieee754/index.js":[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"/Users/phx/Sync/sign-search/node_modules/iso-url/index.js":[function(require,module,exports){
'use strict';

const {
    URLWithLegacySupport,
    format,
    URLSearchParams,
    defaultBase
} = require('./src/url');
const relative = require('./src/relative');

module.exports = {
    URL: URLWithLegacySupport,
    URLSearchParams,
    format,
    relative,
    defaultBase
};

},{"./src/relative":"/Users/phx/Sync/sign-search/node_modules/iso-url/src/relative.js","./src/url":"/Users/phx/Sync/sign-search/node_modules/iso-url/src/url-browser.js"}],"/Users/phx/Sync/sign-search/node_modules/iso-url/src/relative.js":[function(require,module,exports){
'use strict';

const { URLWithLegacySupport, format } = require('./url');

module.exports = (url, location = {}, protocolMap = {}, defaultProtocol) => {
    let protocol = location.protocol ?
        location.protocol.replace(':', '') :
        'http';

    // Check protocol map
    protocol = (protocolMap[protocol] || defaultProtocol || protocol) + ':';
    let urlParsed;

    try {
        urlParsed = new URLWithLegacySupport(url);
    } catch (err) {
        urlParsed = {};
    }

    const base = Object.assign({}, location, {
        protocol: protocol || urlParsed.protocol,
        host: location.host || urlParsed.host
    });

    return new URLWithLegacySupport(url, format(base)).toString();
};

},{"./url":"/Users/phx/Sync/sign-search/node_modules/iso-url/src/url-browser.js"}],"/Users/phx/Sync/sign-search/node_modules/iso-url/src/url-browser.js":[function(require,module,exports){
'use strict';

const defaultBase = self.location ?
    self.location.protocol + '//' + self.location.host :
    '';
const URL = self.URL;

class URLWithLegacySupport {
    constructor(url, base = defaultBase) {
        this.super = new URL(url, base);
        this.path = this.pathname + this.search;
        this.auth =
            this.username && this.password ?
                this.username + ':' + this.password :
                null;

        this.query =
            this.search && this.search.startsWith('?') ?
                this.search.slice(1) :
                null;
    }

    get hash() {
        return this.super.hash;
    }
    get host() {
        return this.super.host;
    }
    get hostname() {
        return this.super.hostname;
    }
    get href() {
        return this.super.href;
    }
    get origin() {
        return this.super.origin;
    }
    get password() {
        return this.super.password;
    }
    get pathname() {
        return this.super.pathname;
    }
    get port() {
        return this.super.port;
    }
    get protocol() {
        return this.super.protocol;
    }
    get search() {
        return this.super.search;
    }
    get searchParams() {
        return this.super.searchParams;
    }
    get username() {
        return this.super.username;
    }

    set hash(hash) {
        this.super.hash = hash;
    }
    set host(host) {
        this.super.host = host;
    }
    set hostname(hostname) {
        this.super.hostname = hostname;
    }
    set href(href) {
        this.super.href = href;
    }
    set origin(origin) {
        this.super.origin = origin;
    }
    set password(password) {
        this.super.password = password;
    }
    set pathname(pathname) {
        this.super.pathname = pathname;
    }
    set port(port) {
        this.super.port = port;
    }
    set protocol(protocol) {
        this.super.protocol = protocol;
    }
    set search(search) {
        this.super.search = search;
    }
    set searchParams(searchParams) {
        this.super.searchParams = searchParams;
    }
    set username(username) {
        this.super.username = username;
    }

    createObjectURL(o) {
        return this.super.createObjectURL(o);
    }
    revokeObjectURL(o) {
        this.super.revokeObjectURL(o);
    }
    toJSON() {
        return this.super.toJSON();
    }
    toString() {
        return this.super.toString();
    }
    format() {
        return this.toString();
    }
}

function format(obj) {
    if (typeof obj === 'string') {
        const url = new URL(obj);

        return url.toString();
    }

    if (!(obj instanceof URL)) {
        const userPass =
            obj.username && obj.password ?
                `${obj.username}:${obj.password}@` :
                '';
        const auth = obj.auth ? obj.auth + '@' : '';
        const port = obj.port ? ':' + obj.port : '';
        const protocol = obj.protocol ? obj.protocol + '//' : '';
        const host = obj.host || '';
        const hostname = obj.hostname || '';
        const search = obj.search || (obj.query ? '?' + obj.query : '');
        const hash = obj.hash || '';
        const pathname = obj.pathname || '';
        const path = obj.path || pathname + search;

        return `${protocol}${userPass || auth}${host ||
            hostname + port}${path}${hash}`;
    }
}

module.exports = {
    URLWithLegacySupport,
    URLSearchParams: self.URLSearchParams,
    defaultBase,
    format
};

},{}],"/Users/phx/Sync/sign-search/node_modules/nanoassert/index.js":[function(require,module,exports){
assert.notEqual = notEqual
assert.notOk = notOk
assert.equal = equal
assert.ok = assert

module.exports = assert

function equal (a, b, m) {
  assert(a == b, m) // eslint-disable-line eqeqeq
}

function notEqual (a, b, m) {
  assert(a != b, m) // eslint-disable-line eqeqeq
}

function notOk (t, m) {
  assert(!t, m)
}

function assert (t, m) {
  if (!t) throw new Error(m || 'AssertionError')
}

},{}],"/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js":[function(require,module,exports){
"use strict";var trailingNewlineRegex=/\n[\s]+$/,leadingNewlineRegex=/^\n[\s]+/,trailingSpaceRegex=/[\s]+$/,leadingSpaceRegex=/^[\s]+/,multiSpaceRegex=/[\n\s]+/g,TEXT_TAGS=["a","abbr","b","bdi","bdo","br","cite","data","dfn","em","i","kbd","mark","q","rp","rt","rtc","ruby","s","amp","small","span","strong","sub","sup","time","u","var","wbr"],VERBATIM_TAGS=["code","pre","textarea"];module.exports=function e(a,l){if(Array.isArray(l))for(var n,i,r=a.nodeName.toLowerCase(),d=!1,t=0,g=l.length;t<g;t++){var p=l[t];if(Array.isArray(p))e(a,p);else{("number"==typeof p||"boolean"==typeof p||"function"==typeof p||p instanceof Date||p instanceof RegExp)&&(p=p.toString());var o=a.childNodes[a.childNodes.length-1];if("string"==typeof p)d=!0,o&&"#text"===o.nodeName?o.nodeValue+=p:(p=a.ownerDocument.createTextNode(p),a.appendChild(p),o=p),t===g-1&&(d=!1,-1===TEXT_TAGS.indexOf(r)&&-1===VERBATIM_TAGS.indexOf(r)?""===(n=o.nodeValue.replace(leadingNewlineRegex,"").replace(trailingSpaceRegex,"").replace(trailingNewlineRegex,"").replace(multiSpaceRegex," "))?a.removeChild(o):o.nodeValue=n:-1===VERBATIM_TAGS.indexOf(r)&&(i=0===t?"":" ",n=o.nodeValue.replace(leadingNewlineRegex,i).replace(leadingSpaceRegex," ").replace(trailingSpaceRegex,"").replace(trailingNewlineRegex,"").replace(multiSpaceRegex," "),o.nodeValue=n));else if(p&&p.nodeType){d&&(d=!1,-1===TEXT_TAGS.indexOf(r)&&-1===VERBATIM_TAGS.indexOf(r)?""===(n=o.nodeValue.replace(leadingNewlineRegex,"").replace(trailingNewlineRegex," ").replace(multiSpaceRegex," "))?a.removeChild(o):o.nodeValue=n:-1===VERBATIM_TAGS.indexOf(r)&&(n=o.nodeValue.replace(leadingSpaceRegex," ").replace(leadingNewlineRegex,"").replace(trailingNewlineRegex," ").replace(multiSpaceRegex," "),o.nodeValue=n));var c=p.nodeName;c&&(r=c.toLowerCase()),a.appendChild(p)}}}};

},{}],"/Users/phx/Sync/sign-search/node_modules/nanomorph/index.js":[function(require,module,exports){
var assert = require('nanoassert')
var morph = require('./lib/morph')

var TEXT_NODE = 3
// var DEBUG = false

module.exports = nanomorph

// Morph one tree into another tree
//
// no parent
//   -> same: diff and walk children
//   -> not same: replace and return
// old node doesn't exist
//   -> insert new node
// new node doesn't exist
//   -> delete old node
// nodes are not the same
//   -> diff nodes and apply patch to old node
// nodes are the same
//   -> walk all child nodes and append to old node
function nanomorph (oldTree, newTree, options) {
  // if (DEBUG) {
  //   console.log(
  //   'nanomorph\nold\n  %s\nnew\n  %s',
  //   oldTree && oldTree.outerHTML,
  //   newTree && newTree.outerHTML
  // )
  // }
  assert.equal(typeof oldTree, 'object', 'nanomorph: oldTree should be an object')
  assert.equal(typeof newTree, 'object', 'nanomorph: newTree should be an object')

  if (options && options.childrenOnly) {
    updateChildren(newTree, oldTree)
    return oldTree
  }

  assert.notEqual(
    newTree.nodeType,
    11,
    'nanomorph: newTree should have one root node (which is not a DocumentFragment)'
  )

  return walk(newTree, oldTree)
}

// Walk and morph a dom tree
function walk (newNode, oldNode) {
  // if (DEBUG) {
  //   console.log(
  //   'walk\nold\n  %s\nnew\n  %s',
  //   oldNode && oldNode.outerHTML,
  //   newNode && newNode.outerHTML
  // )
  // }
  if (!oldNode) {
    return newNode
  } else if (!newNode) {
    return null
  } else if (newNode.isSameNode && newNode.isSameNode(oldNode)) {
    return oldNode
  } else if (newNode.tagName !== oldNode.tagName || getComponentId(newNode) !== getComponentId(oldNode)) {
    return newNode
  } else {
    morph(newNode, oldNode)
    updateChildren(newNode, oldNode)
    return oldNode
  }
}

function getComponentId (node) {
  return node.dataset ? node.dataset.nanomorphComponentId : undefined
}

// Update the children of elements
// (obj, obj) -> null
function updateChildren (newNode, oldNode) {
  // if (DEBUG) {
  //   console.log(
  //   'updateChildren\nold\n  %s\nnew\n  %s',
  //   oldNode && oldNode.outerHTML,
  //   newNode && newNode.outerHTML
  // )
  // }
  var oldChild, newChild, morphed, oldMatch

  // The offset is only ever increased, and used for [i - offset] in the loop
  var offset = 0

  for (var i = 0; ; i++) {
    oldChild = oldNode.childNodes[i]
    newChild = newNode.childNodes[i - offset]
    // if (DEBUG) {
    //   console.log(
    //   '===\n- old\n  %s\n- new\n  %s',
    //   oldChild && oldChild.outerHTML,
    //   newChild && newChild.outerHTML
    // )
    // }
    // Both nodes are empty, do nothing
    if (!oldChild && !newChild) {
      break

    // There is no new child, remove old
    } else if (!newChild) {
      oldNode.removeChild(oldChild)
      i--

    // There is no old child, add new
    } else if (!oldChild) {
      oldNode.appendChild(newChild)
      offset++

    // Both nodes are the same, morph
    } else if (same(newChild, oldChild)) {
      morphed = walk(newChild, oldChild)
      if (morphed !== oldChild) {
        oldNode.replaceChild(morphed, oldChild)
        offset++
      }

    // Both nodes do not share an ID or a placeholder, try reorder
    } else {
      oldMatch = null

      // Try and find a similar node somewhere in the tree
      for (var j = i; j < oldNode.childNodes.length; j++) {
        if (same(oldNode.childNodes[j], newChild)) {
          oldMatch = oldNode.childNodes[j]
          break
        }
      }

      // If there was a node with the same ID or placeholder in the old list
      if (oldMatch) {
        morphed = walk(newChild, oldMatch)
        if (morphed !== oldMatch) offset++
        oldNode.insertBefore(morphed, oldChild)

      // It's safe to morph two nodes in-place if neither has an ID
      } else if (!newChild.id && !oldChild.id) {
        morphed = walk(newChild, oldChild)
        if (morphed !== oldChild) {
          oldNode.replaceChild(morphed, oldChild)
          offset++
        }

      // Insert the node at the index if we couldn't morph or find a matching node
      } else {
        oldNode.insertBefore(newChild, oldChild)
        offset++
      }
    }
  }
}

function same (a, b) {
  if (a.id) return a.id === b.id
  if (a.isSameNode) return a.isSameNode(b)
  if (a.tagName !== b.tagName) return false
  if (a.type === TEXT_NODE) return a.nodeValue === b.nodeValue
  return false
}

},{"./lib/morph":"/Users/phx/Sync/sign-search/node_modules/nanomorph/lib/morph.js","nanoassert":"/Users/phx/Sync/sign-search/node_modules/nanoassert/index.js"}],"/Users/phx/Sync/sign-search/node_modules/nanomorph/lib/events.js":[function(require,module,exports){
module.exports = [
  // attribute events (can be set with attributes)
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmousemove',
  'onmouseout',
  'onmouseenter',
  'onmouseleave',
  'ontouchcancel',
  'ontouchend',
  'ontouchmove',
  'ontouchstart',
  'ondragstart',
  'ondrag',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondrop',
  'ondragend',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onunload',
  'onabort',
  'onerror',
  'onresize',
  'onscroll',
  'onselect',
  'onchange',
  'onsubmit',
  'onreset',
  'onfocus',
  'onblur',
  'oninput',
  // other common events
  'oncontextmenu',
  'onfocusin',
  'onfocusout'
]

},{}],"/Users/phx/Sync/sign-search/node_modules/nanomorph/lib/morph.js":[function(require,module,exports){
var events = require('./events')
var eventsLength = events.length

var ELEMENT_NODE = 1
var TEXT_NODE = 3
var COMMENT_NODE = 8

module.exports = morph

// diff elements and apply the resulting patch to the old node
// (obj, obj) -> null
function morph (newNode, oldNode) {
  var nodeType = newNode.nodeType
  var nodeName = newNode.nodeName

  if (nodeType === ELEMENT_NODE) {
    copyAttrs(newNode, oldNode)
  }

  if (nodeType === TEXT_NODE || nodeType === COMMENT_NODE) {
    if (oldNode.nodeValue !== newNode.nodeValue) {
      oldNode.nodeValue = newNode.nodeValue
    }
  }

  // Some DOM nodes are weird
  // https://github.com/patrick-steele-idem/morphdom/blob/master/src/specialElHandlers.js
  if (nodeName === 'INPUT') updateInput(newNode, oldNode)
  else if (nodeName === 'OPTION') updateOption(newNode, oldNode)
  else if (nodeName === 'TEXTAREA') updateTextarea(newNode, oldNode)

  copyEvents(newNode, oldNode)
}

function copyAttrs (newNode, oldNode) {
  var oldAttrs = oldNode.attributes
  var newAttrs = newNode.attributes
  var attrNamespaceURI = null
  var attrValue = null
  var fromValue = null
  var attrName = null
  var attr = null

  for (var i = newAttrs.length - 1; i >= 0; --i) {
    attr = newAttrs[i]
    attrName = attr.name
    attrNamespaceURI = attr.namespaceURI
    attrValue = attr.value
    if (attrNamespaceURI) {
      attrName = attr.localName || attrName
      fromValue = oldNode.getAttributeNS(attrNamespaceURI, attrName)
      if (fromValue !== attrValue) {
        oldNode.setAttributeNS(attrNamespaceURI, attrName, attrValue)
      }
    } else {
      if (!oldNode.hasAttribute(attrName)) {
        oldNode.setAttribute(attrName, attrValue)
      } else {
        fromValue = oldNode.getAttribute(attrName)
        if (fromValue !== attrValue) {
          // apparently values are always cast to strings, ah well
          if (attrValue === 'null' || attrValue === 'undefined') {
            oldNode.removeAttribute(attrName)
          } else {
            oldNode.setAttribute(attrName, attrValue)
          }
        }
      }
    }
  }

  // Remove any extra attributes found on the original DOM element that
  // weren't found on the target element.
  for (var j = oldAttrs.length - 1; j >= 0; --j) {
    attr = oldAttrs[j]
    if (attr.specified !== false) {
      attrName = attr.name
      attrNamespaceURI = attr.namespaceURI

      if (attrNamespaceURI) {
        attrName = attr.localName || attrName
        if (!newNode.hasAttributeNS(attrNamespaceURI, attrName)) {
          oldNode.removeAttributeNS(attrNamespaceURI, attrName)
        }
      } else {
        if (!newNode.hasAttributeNS(null, attrName)) {
          oldNode.removeAttribute(attrName)
        }
      }
    }
  }
}

function copyEvents (newNode, oldNode) {
  for (var i = 0; i < eventsLength; i++) {
    var ev = events[i]
    if (newNode[ev]) {           // if new element has a whitelisted attribute
      oldNode[ev] = newNode[ev]  // update existing element
    } else if (oldNode[ev]) {    // if existing element has it and new one doesnt
      oldNode[ev] = undefined    // remove it from existing element
    }
  }
}

function updateOption (newNode, oldNode) {
  updateAttribute(newNode, oldNode, 'selected')
}

// The "value" attribute is special for the <input> element since it sets the
// initial value. Changing the "value" attribute without changing the "value"
// property will have no effect since it is only used to the set the initial
// value. Similar for the "checked" attribute, and "disabled".
function updateInput (newNode, oldNode) {
  var newValue = newNode.value
  var oldValue = oldNode.value

  updateAttribute(newNode, oldNode, 'checked')
  updateAttribute(newNode, oldNode, 'disabled')

  if (newValue !== oldValue) {
    oldNode.setAttribute('value', newValue)
    oldNode.value = newValue
  }

  if (newValue === 'null') {
    oldNode.value = ''
    oldNode.removeAttribute('value')
  }

  if (!newNode.hasAttributeNS(null, 'value')) {
    oldNode.removeAttribute('value')
  } else if (oldNode.type === 'range') {
    // this is so elements like slider move their UI thingy
    oldNode.value = newValue
  }
}

function updateTextarea (newNode, oldNode) {
  var newValue = newNode.value
  if (newValue !== oldNode.value) {
    oldNode.value = newValue
  }

  if (oldNode.firstChild && oldNode.firstChild.nodeValue !== newValue) {
    // Needed for IE. Apparently IE sets the placeholder as the
    // node value and vise versa. This ignores an empty update.
    if (newValue === '' && oldNode.firstChild.nodeValue === oldNode.placeholder) {
      return
    }

    oldNode.firstChild.nodeValue = newValue
  }
}

function updateAttribute (newNode, oldNode, name) {
  if (newNode[name] !== oldNode[name]) {
    oldNode[name] = newNode[name]
    if (newNode[name]) {
      oldNode.setAttribute(name, '')
    } else {
      oldNode.removeAttribute(name)
    }
  }
}

},{"./events":"/Users/phx/Sync/sign-search/node_modules/nanomorph/lib/events.js"}],"/Users/phx/Sync/sign-search/node_modules/parse-duration/index.js":[function(require,module,exports){
'use strict'

var duration = /(-?\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμ]*)/ig

module.exports = parse

/**
 * conversion ratios
 */

parse.nanosecond =
parse.ns = 1 / 1e6

parse['μs'] =
parse.microsecond = 1 / 1e3

parse.millisecond =
parse.ms = 1

parse.second =
parse.sec =
parse.s = parse.ms * 1000

parse.minute =
parse.min =
parse.m = parse.s * 60

parse.hour =
parse.hr =
parse.h = parse.m * 60

parse.day =
parse.d = parse.h * 24

parse.week =
parse.wk =
parse.w = parse.d * 7

parse.b =
parse.month = parse.d * (365.25 / 12)

parse.year =
parse.yr =
parse.y = parse.d * 365.25

/**
 * convert `str` to ms
 *
 * @param {String} str
 * @return {Number}
 */

function parse(str){
  var result = 0
  // ignore commas
  str = str.replace(/(\d),(\d)/g, '$1$2')
  str.replace(duration, function(_, n, units){
    units = parse[units]
      || parse[units.toLowerCase().replace(/s$/, '')]
      || 1
    result += parseFloat(n, 10) * units
  })
  return result
}

},{}]},{},["/Users/phx/Sync/sign-search/lib/user-interface.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvc2VhcmNoLWVuZ2luZS9lbmdpbmUuanMiLCJsaWIvc2VhcmNoLWVuZ2luZS9xdWVyeS5qcyIsImxpYi9zZWFyY2gtZW5naW5lL3ZpZXctcGFnaW5hdG9yLmpzIiwibGliL3NlYXJjaC1lbmdpbmUvdmlldy1yZXN1bHQuanMiLCJsaWIvc2VhcmNoLWxpYnJhcnkvZGVmaW5pdGlvbi5qcyIsImxpYi9zZWFyY2gtbGlicmFyeS9saWJyYXJ5LXdlYi5qcyIsImxpYi9zZWFyY2gtbGlicmFyeS9saWJyYXJ5LmpzIiwibGliL3NlYXJjaC1saWJyYXJ5L3Jlc3VsdC1kZWZpbml0aW9uLmpzIiwibGliL3VzZXItaW50ZXJmYWNlLmpzIiwibGliL3V0aWwuanMiLCJsaWIvdmVjdG9yLWxpYnJhcnkvbGlicmFyeS5qcyIsImxpYi92ZWN0b3ItdXRpbGl0aWVzLmpzIiwibm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iaWdudW1iZXIuanMvYmlnbnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL2JvcmMvc3JjL2NvbnN0YW50cy5qcyIsIm5vZGVfbW9kdWxlcy9ib3JjL3NyYy9kZWNvZGVyLmFzbS5qcyIsIm5vZGVfbW9kdWxlcy9ib3JjL3NyYy9kZWNvZGVyLmpzIiwibm9kZV9tb2R1bGVzL2JvcmMvc3JjL2RpYWdub3NlLmpzIiwibm9kZV9tb2R1bGVzL2JvcmMvc3JjL2VuY29kZXIuanMiLCJub2RlX21vZHVsZXMvYm9yYy9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYm9yYy9zcmMvc2ltcGxlLmpzIiwibm9kZV9tb2R1bGVzL2JvcmMvc3JjL3RhZ2dlZC5qcyIsIm5vZGVfbW9kdWxlcy9ib3JjL3NyYy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVsYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pc28tdXJsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2lzby11cmwvc3JjL3JlbGF0aXZlLmpzIiwibm9kZV9tb2R1bGVzL2lzby11cmwvc3JjL3VybC1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL25hbm9hc3NlcnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbmFub2h0bWwvbGliL2FwcGVuZC1jaGlsZC5qcyIsIm5vZGVfbW9kdWxlcy9uYW5vbW9ycGgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbmFub21vcnBoL2xpYi9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvbmFub21vcnBoL2xpYi9tb3JwaC5qcyIsIm5vZGVfbW9kdWxlcy9wYXJzZS1kdXJhdGlvbi9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLE1BQU0sY0FBZ0IsUUFBUSxpQ0FDeEIsY0FBZ0IsUUFBUSw2QkFDeEIsWUFBYyxRQUFRLFdBQ3RCLEdBQUssUUFBUSx1QkFDYixPQUFTLFFBQVEsV0FFdkIsTUFBTSxhQUlKLFlBQVksR0FDVixLQUFLLE9BQVEsRUFDYixLQUFLLGNBQWdCLEdBQ3JCLEtBQUssT0FBUyxFQUloQixhQUNFLEtBQ0csS0FBSyxjQUFlLEtBQUsscUJBQXVCLFFBQVEsSUFBSSxDQUMzRCxJQUFLLGNBQWMsQ0FBRSxLQUFNLEtBQUssT0FBTyxvQkFBc0IsT0FDN0QsSUFBSyxjQUFjLENBQ2pCLEtBQU0sS0FBSyxPQUFPLGtCQUNsQixHQUFJLENBQUUsU0FBVSxPQUFPLGVBQ3ZCLE9BQVEsT0FBTyxjQUNiLFNBRU4sTUFBTyxHQUdQLE1BRkEsS0FBSyxjQUFjLFFBQVEsRUFBRSxFQUFTLEtBQVksRUFBTyxJQUN6RCxLQUFLLGNBQWdCLEdBQ2YsRUFFUixLQUFLLE9BQVEsRUFDYixLQUFLLGNBQWMsUUFBUSxFQUFFLEVBQVMsS0FBWSxFQUFRLE9BQzFELEtBQUssY0FBZ0IsR0FJdkIsYUFDRSxPQUFJLEtBQUssTUFDQSxRQUFRLFFBQVEsTUFFaEIsSUFBSSxRQUFRLENBQUMsRUFBUyxLQUMzQixLQUFLLGNBQWMsS0FBSyxDQUFDLEVBQVMsTUFNeEMsWUFBWSxTQUNKLEtBQUssYUFHWCxJQUFJLEVBQVEsSUFBSSxZQUFZLFNBRXRCLEVBQU0sVUFBVSxLQUFLLGVBRzNCLElBQUksRUFBZSxFQUFNLFNBQVMsT0FBTyxHQUFNLEVBQUUsVUFBVSxJQUFJLEdBQUssRUFBRSxNQUNsRSxFQUFlLEVBQU0sU0FBUyxPQUFPLElBQU0sRUFBRSxVQUFVLElBQUksR0FBSyxFQUFFLE1Ba0J0RSxhQWhCb0IsS0FBSyxjQUFjLE1BQU8sSUFDNUMsR0FBSSxFQUFhLEtBQUssSUFBUSxFQUFPLEtBQUssU0FBUyxJQUFPLE9BQU8sRUFDakUsR0FBSSxFQUFhLEtBQUssR0FBTyxFQUFPLEtBQUssU0FBUyxJQUFPLE9BQU8sRUFVaEUsT0FSZ0IsRUFBTSxTQUFTLElBQUksR0FFakMsS0FBSyxPQUFPLEVBQU8sTUFBTSxJQUFJLEdBQWMsRUFBVSxTQUFTLE1BSWpDLE9BQU8sQ0FBQyxFQUFFLElBQUssRUFBSSxFQUFHLEdBRTVCLEVBQU8sY0FBZ0IsT0FJbkMsS0FBSyxDQUFDLEVBQUUsSUFBTSxFQUFFLFNBQVcsRUFBRSxVQUk5QyxnQkFFRSxhQURNLEtBQUssYUFDSixLQUFLLGNBQWMsV0FJOUIsT0FBTyxRQUFVOzs7QUN2RmpCLE1BQU0sR0FBSyxRQUFRLHVCQUduQixNQUFNLFlBQ0osWUFBWSxHQUVWLEtBQUssVUFBWSxFQUFVLE9BQU8sTUFBTSw4QkFBOEIsT0FBTyxHQUFLLEVBQUUsV0FBVyxPQUFPLE9BQVMsR0FHL0csS0FBSyxPQUFTLEtBQUssVUFBVSxJQUFLLElBQ2hDLEdBQUksRUFBUyxNQUFNLHlCQUNqQixPQUFPLElBQUksYUFBYSxFQUFTLE1BQU0sSUFBSSxHQUN0QyxHQUFJLEVBQVMsTUFBTSx3QkFDeEIsT0FBTyxJQUFJLGFBQWEsRUFBUyxNQUFNLElBQUksR0FDdEMsQ0FFTCxJQUFJLEVBQWMsRUFBUyxPQUFPLFFBQVEsS0FBTSxLQUloRCxPQUZJLEVBQVksTUFBTSxVQUFZLEVBQVksT0FBUyxLQUFHLEVBQWMsRUFBWSxlQUU3RSxJQUFJLGFBQWEsTUFNOUIsZ0JBQWdCLEdBYWQsT0FaQSxLQUFLLGFBQWUsUUFBUSxJQUFJLEtBQUssT0FBTyxJQUFJLE1BQU8sSUFDckQsR0FBSSxFQUFNLGFBQWUsYUFBYyxDQUNyQyxJQUFJLFFBQWUsRUFBYyxPQUFPLEdBQ3hDLE9BQUksRUFDSyxJQUFJLFdBQVcsRUFBTyxHQUV0QixFQUdULE9BQU8sS0FHSixLQUlULGVBQ0UsT0FBTyxLQUFLLE9BQU8sT0FBTyxHQUFVLEVBQU0sYUFBZSxjQUFnQixFQUFNLGFBQWUsWUFJaEcsZUFDRSxPQUFPLEtBQUssT0FBTyxPQUFPLEdBQVMsRUFBTSxhQUFlLGNBSTFELFdBQ0UsT0FBTyxLQUFLLE9BQU8sS0FBSyxNQUs1QixNQUFNLGFBQ0osWUFBWSxFQUFNLEdBQVcsR0FDM0IsS0FBSyxLQUFPLEVBQUssV0FDakIsS0FBSyxXQUFhLEVBR3BCLFdBQWEsU0FBVyxLQUFLLFNBQVcsSUFBTSxPQUFRLEtBQUssUUFJN0QsTUFBTSxhQUNKLFlBQVksR0FDVixLQUFLLEtBQU8sRUFBSyxXQUluQixTQUFTLEdBQ1AsTUFBb0IsaUJBQWhCLEdBQTRCLEdBQVEsS0FBSyxLQUNwQyxFQUNrQixpQkFBaEIsR0FBNEIsRUFBSyxlQUFpQixLQUFLLEtBQUssY0FDOUQsR0FFQSxHQUtYLFdBQWEsT0FBTyxLQUFLLEtBRXpCLFVBQVksT0FBTyxLQUFLLE1BSTFCLE1BQU0sV0FDSixZQUFZLEVBQU0sR0FDaEIsS0FBSyxLQUFPLEVBQUssV0FDakIsS0FBSyxPQUFTLEVBSWhCLFNBQVMsR0FDUCxPQUFJLE1BQU0sUUFBUSxHQUNULEdBQUcsZ0JBQWdCLEtBQUssT0FBUSxHQUVoQyxHQUtYLFdBQWEsT0FBTyxLQUFLLEtBRXpCLFVBQVksT0FBTyxLQUFLLFFBRzFCLFlBQVksYUFBZSxhQUMzQixZQUFZLGFBQWUsYUFDM0IsWUFBWSxXQUFlLFdBRTNCLE9BQU8sUUFBVTs7O0FDbkhqQixNQUFNLEtBQU8sR0FFYixNQUFNLG1CQU1KLFlBQVksR0FDVixLQUFLLE9BQVMsRUFBTyxRQUFVLEVBQy9CLEtBQUssU0FBVyxFQUFPLFVBQVksRUFDbkMsS0FBSyxPQUFTLEVBQU8sUUFBTSxDQUFNLFlBQWMsS0FJakQsU0FBUyxFQUFPLEdBQ2QsR0FBSSxHQUFTLEVBQUcsTUFBTyxHQUN2QixJQUFJLEVBQVMsR0FDYixJQUFLLElBQUksRUFBSSxFQUFHLEVBQUksRUFBTyxJQUN6QixFQUFPLEtBQUssRUFBRyxJQUVqQixPQUFPLEVBR1QsU0FDRSxPQUFPLHFOQUFBLHNYQVNYLE9BQU8sUUFBVTs7O0FDcENqQixNQUFNLEtBQU8sR0FFYixNQUFNLGtCQUlKLFlBQVksRUFBUyxJQUNuQixLQUFLLE9BQVMsRUFDZCxLQUFLLE9BQU8sV0FBYSxLQUFLLE9BQU8sWUFBYyxFQUNuRCxLQUFLLE9BQVMsRUFBTyxRQUFVLEtBQy9CLEtBQUssZUFBaUIsR0FHeEIsUUFBUSxHQUNOLEtBQUssT0FBUyxFQUNWLEtBQUssT0FBTyxVQUFVLEtBQUssT0FBTyxTQUFTLE1BR2pELFlBQVcsS0FBRSxFQUFJLEtBQUUsSUFDakIsS0FBSyxlQUFlLEtBQUssQ0FBRSxLQUFBLEVBQU0sS0FBQSxJQUM3QixLQUFLLE9BQU8sVUFBVSxLQUFLLE9BQU8sU0FBUyxNQUdqRCxjQUFjLEdBQ1osS0FBSyxlQUFpQixLQUFLLGVBQWUsT0FBTyxHQUFXLEVBQVEsTUFBUSxHQUN4RSxLQUFLLE9BQU8sVUFBVSxLQUFLLE9BQU8sU0FBUyxNQUlqRCxTQUNFLE9BQUksS0FBSyxRQUFVLEtBQUssT0FBTyxZQUN0QixLQUFLLGtCQUVMLEtBQUssb0JBS2hCLGNBQ0UsSUFBSSxFQUFXLEtBQUssT0FBTyxVQUFZLEdBRXZDLE1BQU8sSUFETyxPQUFPLEtBQUssR0FBVSxPQUFPLEdBQU8sS0FBSyxPQUFPLEtBQUssU0FBUyxJQUN6RCxJQUFJLEdBQU8sRUFBUyxPQUFXLEtBQUssZ0JBSXpELFFBQVEsR0FDTixPQUFJLEtBQUssT0FDQSxDQUFDLFNBQVUsS0FBSyxPQUFPLE1BQU8sR0FBTSxLQUFLLEtBRXpDLEdBSVgsZ0JBRUUsSUFBSSxFQUFjLENBQUMsRUFBTyxLQUN4QixFQUFNLGlCQUNOLEVBQU0sa0JBQ04sS0FBSyxPQUFPLFlBQWMsRUFDMUIsS0FBSyxPQUFPLFNBQVMsT0FDZCxHQUlMLEVBQWMsS0FBSyxPQUFPLFdBQWEsRUFDdkMsRUFBYyxLQUFLLE9BQU8sV0FBYSxLQUFLLE9BQU8sTUFBTSxPQUFTLEVBRWxFLEVBQVUsS0FBSyxPQUFPLE1BQU0sS0FBSyxPQUFPLFlBRzVDLE9BQU8scXFDQUFBLDRhQWNULGtCQVVFLE9BVGdCLGk1QkFBQSxzZ0JBWWxCLG9CQUNFLE9BQU8sc0pBQUEsK0NBSVgsT0FBTyxRQUFVOzs7QUNuR2pCLE1BQU0saUJBRUosYUFBWSxNQUFFLEVBQUssU0FBRSxFQUFRLEtBQUUsRUFBSSxLQUFFLEVBQUksTUFBRSxFQUFLLEtBQUUsRUFBSSxTQUFFLEVBQVEsR0FBRSxHQUFPLElBQ3ZFLEtBQUssTUFBUSxHQUFTLEtBQ3RCLEtBQUssU0FBVyxHQUFZLEdBQzVCLEtBQUssS0FBTyxHQUFRLEdBQ3BCLEtBQUssS0FBTyxHQUFRLEtBQ3BCLEtBQUssTUFBUSxHQUFTLEdBQ3RCLEtBQUssS0FBTyxHQUFRLEtBQ3BCLEtBQUssU0FBVyxHQUFZLEtBQzVCLEtBQUssR0FBSyxHQUFNLEtBR2xCLFVBQ0UsU0FBVSxLQUFLLFVBQVksYUFBYSxLQUFLLElBQU0sS0FBSyxNQUFRLFlBR2xFLFVBQ0UsVUFBVyxLQUFLLFlBQVksU0FBUyxTQUFTLEtBQUssT0FBUyxLQUFLLFNBQVMsS0FBSyxTQUdqRixTQUNFLE1BQU8sQ0FDTCxNQUFPLEtBQUssTUFDWixTQUFVLEtBQUssU0FDZixLQUFNLEtBQUssS0FDWCxLQUFNLEtBQUssS0FDWCxNQUFPLEtBQUssTUFDWixLQUFNLEtBQUssS0FDWCxTQUFVLEtBQUssU0FDZixHQUFJLEtBQUssS0FLZixPQUFPLFFBQVU7OztBQ3JDakIsTUFBTSxjQUFnQixRQUFRLGFBQ3hCLE9BQVMsUUFBUSxXQUV2QixNQUFNLHlCQUF5QixjQUM3QixZQUFZLEdBQ1YsTUFBTSxDQUNKLEdBQUksQ0FBRSxTQUFVLE9BQU8sa0JBQ3BCLEtBS1QsT0FBTyxRQUFVOzs7O0FDWGpCLE1BQU0sdUJBQXlCLFFBQVEsdUJBQ2pDLEtBQU8sUUFBUSxXQUNmLEdBQUssUUFBUSx1QkFDYixLQUFPLFFBQVEsUUFHckIsTUFBTSxjQVVKLFlBQVksRUFBUyxJQUVuQixLQUFLLE1BQVEsR0FFYixLQUFLLFNBQVcsQ0FDZCxRQUFTLEVBQ1QsV0FBWSxFQUNaLFdBQVksSUFDWixjQUFlLEVBQ2YsZUFBZ0IsS0FBSyxNQUNyQixVQUFXLEdBQ1gsUUFBUyxLQUFLLE9BR2hCLE9BQU8sS0FBSyxLQUFLLFVBQVUsSUFBSyxHQUFPLEtBQUssU0FBUyxHQUFPLEVBQU8sSUFBUSxLQUFLLFNBQVMsSUFHekYsS0FBSyxTQUFTLFdBQWEsRUFBTyxjQUFnQixJQUFJLElBQUksR0FBSyxFQUFFLGdCQUdqRSxLQUFLLE9BQVMsT0FBTyxPQUFPLENBQzFCLG9CQUFxQixJQUNwQixHQUNILEtBQUssS0FBTyxFQUFPLEtBRW5CLEtBQUssSUFBTSxFQUFPLEtBQVEsQ0FBQSxHQUFRLFFBQVEsSUFBSSxJQUloRCw2QkFDUSxLQUFLLEtBQUssS0FBSyxNQUdyQixJQUFBLElBQVMsS0FBVSxLQUFLLFlBQ2hCLEVBQU8sUUFNakIsYUFFRSxJQUFJLEVBQU8sS0FBSyxhQUFhLEtBQUssT0FBTyxHQUFHLFlBQVksS0FBSyxvQkFJN0QsS0FBSyxTQUFXLEVBQUssU0FHckIsSUFBSSxFQUFVLEVBQUssUUFBUSxJQUFJLElBQzdCLEdBQXFCLGlCQUFWLEVBQ1QsT0FBTyxFQUNGLEdBQUksT0FBTyxTQUFTLEdBQVEsQ0FFakMsT0FEYSxLQUFLLGFBQWEsRUFBTyxLQUFLLFNBQVMsV0FBWSxLQUFLLFNBQVMsWUFDaEUsSUFBSSxHQUFLLEVBQUksS0FBSyxTQUFTLGtCQUs3QyxLQUFLLE1BQVEsR0FFYixJQUFBLElBQVUsRUFBWSxLQUFZLEVBQUssTUFBTyxDQUM1QyxJQUFJLEVBQU8sRUFBVyxJQUFJLEdBQVMsRUFBUSxJQUUzQyxJQUFBLElBQVUsRUFBYSxLQUFvQixFQUFTLENBQ2xELElBQUksRUFBUSxFQUFZLElBQUksR0FBUyxFQUFRLElBRXpDLEVBQWdCLEtBQUssT0FBTyxHQUFHLGFBQWEsRUFBTSxPQUFPLEdBQUssTUFBTSxRQUFRLE1BQ2hGLEtBQUssTUFBTSxFQUFpQixHQUFHLFFBQVMsSUFDdEMsS0FBSyxNQUFNLEtBQUssSUFBSSx1QkFBdUIsQ0FDekMsUUFBUyxLQUFNLGVBQUEsRUFBZ0IsS0FBQSxFQUFNLE1BQUEsRUFBTyxjQUFBLFFBTXBELE9BQU8sS0FPVCxvQkFBb0IsR0FDbEIsSUFBSSxFQUFRLEVBQVcsUUFBVSxFQUFXLFVBQWEsRUFDckQsRUFBUSxFQUFLLFNBQ2IsS0FBSyxPQUFPLGtCQUNkLEVBQVEsRUFBTSxJQUFJLElBRWhCLElBQUksRUFBYyxFQUFRLE9BQU8sUUFBUSxLQUFNLEtBRy9DLE9BREksRUFBWSxNQUFNLFVBQVksRUFBWSxPQUFTLEtBQUcsRUFBYyxFQUFZLGVBQzdFLEtBS1gsUUFBYyxRQUFRLElBQUksRUFBTSxJQUFJLE1BQUEsR0FBa0IsS0FBSyxPQUFPLHFCQUF1QixLQUFLLE9BQU8sY0FBYyxPQUFPLElBQWEsSUFHdkksSUFBSSxFQUFRLEdBQ1osSUFBQSxJQUFTLEtBQWEsRUFBSyxNQUFPLENBQ2hDLElBQUksRUFBa0IsS0FBSyxPQUFPLGFBQWEsT0FBTyxHQUFVLEVBQU8sUUFBUSxFQUFVLGlCQUNyRixFQUFXLEdBQ2YsSUFBQSxJQUFTLEtBQVcsRUFDbEIsRUFBUyxFQUFRLGVBQWUsaUJBQW1CLEtBQUssT0FBTyxXQUFXLE1BQU0sQ0FBRSxNQUFPLEVBQVcsT0FBUSxJQUUxRyxFQUFnQixPQUFTLEdBQUcsRUFBTSxLQUFLLEdBSTdDLElBQUksRUFBUyxJQUFJLHVCQUF1QixPQUFPLE9BQU8sRUFBTSxDQUMxRCxRQUFTLEtBQU0sTUFBQSxFQUNmLGNBQWUsS0FBSyxPQUFPLEdBQUcsYUFBYSxFQUFNLE9BQU8sR0FBSyxNQUFNLFFBQVEsTUFDM0UsTUFBQSxFQUFPLFdBQVcsS0FJcEIsS0FBSyxNQUFNLEtBQUssR0FhbEIsWUFBWSxHQUNWLElBQUksUUFBdUIsS0FBSyxPQUFPLEdBQUcsWUFBWSxLQUFLLG9CQVEzRCxPQVBJLEVBQWUsWUFBYyxLQUFLLFNBQVMsUUFBUSxhQUVyRCxLQUFLLG9EQUFvRCxtQ0FBZ0QsS0FBSyxTQUFTLGlCQUNqSCxLQUFLLFFBSU4sS0FBSyxNQUFNLElBQUssSUFDckIsSUFBSSxFQUFlLE9BQU8sT0FBTyxHQUVqQyxPQURBLEVBQWEsU0FBVyxFQUFTLEdBQzFCLElBQ04sT0FBTyxHQUV5QixpQkFBMUIsRUFBYSxVQUNwQixLQUFLLENBQUMsRUFBRSxJQUVSLEVBQUUsU0FBVyxFQUFFLFVBT25CLGFBRUUsSUFBSSxFQUFVLEdBQ1YsRUFBZ0IsR0FFaEIsRUFBVSxJQUNaLElBQUksRUFBWSxLQUFLLFVBQVUsR0FDL0IsR0FBSSxFQUFjLEdBQVksT0FBTyxFQUFjLEdBR25ELElBQUksRUFBYyxFQUFRLE9BRTFCLEdBQUksTUFBTSxRQUFRLEdBQU8sQ0FDdkIsSUFBSSxFQUFTLEtBQUssV0FBVyxFQUFLLElBQUksR0FBSyxFQUFJLEtBQUssU0FBUyxlQUFnQixLQUFLLFNBQVMsV0FBWSxLQUFLLFNBQVMsWUFDckgsRUFBUSxLQUFLLE9BQU8sS0FBSyxTQUV6QixFQUFRLEtBQUssRUFBSyxZQUlwQixPQUFPLEVBQWMsR0FBYSxHQUlwQyxHQUFJLEtBQUssT0FBTyxjQUFlLENBQzdCLEtBQUssU0FBUyxjQUFnQixFQUM5QixJQUFBLElBQVMsS0FBYyxLQUFLLE1BQU8sQ0FDakMsSUFBSSxFQUFVLEVBQVcsTUFBTSxPQUFPLEdBQW1CLGlCQUFQLEdBQ2xELEdBQUksRUFBUSxPQUFTLEVBQUcsU0FDeEIsSUFBSSxFQUFlLEtBQUssT0FBUSxFQUFRLE9BQU8sSUFBSSxLQUFLLE1BQ3BELEtBQUssU0FBUyxjQUFnQixJQUNoQyxLQUFLLFNBQVMsY0FBZ0IsSUFNcEMsSUFBSSxFQUFRLEdBQ1osQ0FFRSxLQUFLLElBQUksc0NBQ1QsSUFBSSxFQUFVLEVBQ2QsSUFBQSxJQUFTLEtBQVMsS0FBSyxjQUFjLEtBQUssTUFBTyxLQUFLLE9BQU8scUJBQXNCLENBQ2pGLElBQUksRUFBYSxHQUNqQixFQUFNLFFBQVEsSUFFWixFQUFXLGdCQUFrQixDQUFDLEVBQVMsRUFBVyxRQUNsRCxFQUFXLEtBQUssRUFBVyxVQUkzQixJQUFJLEVBQVUsRUFBVyxLQUFLLElBQUksR0FBUSxPQUFPLEtBQUssTUFFbEQsRUFBZ0IsRUFBTSxHQUFXLEVBQU0sSUFBWSxHQUVuRCxFQUFhLEVBQVcsTUFBTSxJQUFJLEdBQVEsT0FBTyxLQUFLLE1BQzFELEVBQWMsR0FBYyxJQUFLLEVBQWMsSUFBZSxNQUFRLEVBQVcsbUJBSW5GLElBQUksRUFBYyxLQUFLLE9BQU8sU0FDeEIsS0FBSyxPQUFPLEdBQUcsYUFBYSxLQUFLLG9CQUFvQixLQUFLLFNBQVMsaUJBQ25FLEtBQUssT0FBTyxHQUFHLGFBQWEsS0FBSyxvQkFBb0IsS0FBSyxTQUFTLFdBQVcsU0FBZ0IsR0FDaEcsS0FBSyxPQUFPLFlBQVksS0FBSyxPQUFPLEdBQUcsYUFBYSxLQUFLLG9CQUFvQixLQUFLLFNBQVMsV0FBVyxrQkFBeUIsS0FBSyxPQUFPLEtBQUssSUFDcEosR0FBVyxHQUtmLEtBQUssSUFBSSxpQ0FDVCxJQUFJLEVBQWMsS0FBSyxPQUFPLENBQzVCLFNBQVUsS0FBSyxTQUNmLFFBQUEsRUFDQSxNQUFPLEtBQUssWUFBWSxFQUN0QixHQUFPLEVBQUksTUFBTSxNQUFNLElBQUksR0FBSyxTQUFTLElBQ3pDLEdBQWMsS0FBSyxZQUFZLEVBQzdCLEdBQU8sRUFBSSxNQUFNLE1BQU0sSUFBSSxHQUFLLFNBQVMsY0FJekMsS0FBSyxPQUFPLEdBQUcsYUFBYSxLQUFLLGtCQUFtQixHQUN0RCxLQUFLLE9BQU8sWUFBWSxLQUFLLE9BQU8sR0FBRyxhQUFhLEtBQUssMkJBQTRCLEtBQUssT0FBTyxLQUFLLFVBR3BHLEtBQUssT0FBTyxHQUFHLGFBQWEsS0FBSyxtQkFBb0IsS0FBSyxTQUFTLFFBQVEsWUFNbkYsdUJBRXFCLEtBQUssT0FBTyxHQUFHLFdBQVcsS0FBSyxxQkFDM0MsUUFBUSxJQUNULElBQVksS0FBSyxTQUFTLFNBQVMsS0FBSyxPQUFPLEdBQUcsVUFBVSxLQUFLLG9CQUFvQixhQUdyRixLQUFLLFdBQVcsVUFNeEIsMkJBQTJCLEdBRXpCLElBQUksRUFBVSxFQUFPLGdCQUFnQixHQUNqQyxRQUFvQixLQUFLLE9BQU8sR0FBRyxZQUFZLEtBQUssb0JBQW9CLEtBQUssU0FBUyxXQUFXLFVBRXJHLE9BRGdCLEtBQUssT0FBTyxHQUNYLEVBQU8sZ0JBQWdCLEtBSTVDLE9BQU8sUUFBVTs7Ozs7QUM3UmpCLE1BQU0saUJBQW1CLFFBQVEsZ0JBQzNCLEtBQU8sUUFBUSxXQUVyQixNQUFNLCtCQUErQixpQkFDbkMsWUFBWSxFQUFTLElBQ25CLE1BQU0sR0FDTixLQUFLLFFBQVUsRUFBTyxRQUN0QixLQUFLLE1BQVEsRUFBTyxPQUFTLEdBQzdCLEtBQUssY0FBZ0IsRUFBTyxlQUFpQixFQUN6QyxFQUFPLE9BQ1QsS0FBSyxNQUFRLEVBQU8sS0FDcEIsS0FBSyxZQUFjLEtBQUssY0FBYyxFQUFPLE9BRS9DLEtBQUssZ0JBQWtCLEVBQU8sZUFDOUIsS0FBSyxTQUFXLEVBQU8sWUFBYSxFQUd0QyxZQUFjLE9BQU8sS0FBSyxTQUkxQixjQUNFLEdBQUksS0FBSyxTQUFVLE9BQU8sS0FFMUIsSUFBSSxRQUFjLEtBQUssUUFBUSxxQkFBcUIsTUFlcEQsT0FiQSxLQUFLLE1BQVcsRUFBTSxNQUN0QixLQUFLLFNBQVcsRUFBTSxVQUN0QixLQUFLLEtBQVcsRUFBTSxLQUN0QixLQUFLLEtBQVcsRUFBTSxLQUN0QixLQUFLLEtBQVcsRUFBTSxLQUN0QixLQUFLLFNBQVcsRUFBTSxTQUN0QixLQUFLLEdBQVcsRUFBTSxJQUFNLEVBQU0sS0FFbEMsS0FBSyxNQUFXLEVBQU0sTUFBTSxJQUFJLEdBQzlCLE9BQU8sS0FBSyxHQUFTLElBQUksR0FBYSxPQUFPLE9BQU8sT0FBTyxPQUFPLEtBQUssUUFBUSxTQUFTLFVBQVUsS0FBSyxHQUFTLEVBQU0sV0FBYSxJQUFjLElBQUssQ0FBRSxPQUFRLEtBQUssUUFBUSxXQUFXLEVBQVEsU0FHbE0sS0FBSyxVQUFXLEVBQ1QsTUFJWCxPQUFPLFFBQVU7OztBQzVDakIsTUFBTSxhQUFlLFFBQVEsMEJBQ3ZCLFdBQWEsUUFBUSwrQkFDckIsVUFBWSxRQUFRLGtDQUNwQixLQUFPLEdBQ1AsTUFBUSxRQUFRLGFBQ2hCLGNBQWdCLFFBQVEsa0JBQ3hCLE1BQVEsUUFBUSxTQUVoQixHQUFLLElBQUksSUFBUSxTQUFTLGlCQUFpQixHQUMzQyxJQUFNLElBQUksSUFBUSxTQUFTLG9CQUFvQixHQUVyRCxNQUFNLFdBQ0osWUFBWSxHQUNWLEtBQUssT0FBUyxFQUNkLEtBQUssYUFBZSxJQUFJLGFBQWEsR0FDckMsS0FBSyxlQUFpQixLQUl4QixtQkFDUSxLQUFLLGFBQWEsT0FJMUIsYUFBZSxPQUFPLEtBQUssYUFBYSxhQUV4QyxpQkFDRSxPQUFPLGFBQWUsS0FBSyxLQUFLLGFBQWEsU0FBUyxLQUFLLFFBQVEsS0FBTSxNQUV6RSxHQUFHLEtBQUssT0FBTyxZQUFZLFNBQVcsQ0FBQSxJQUNwQyxJQUFJLEVBQVksR0FBRyxLQUFLLE9BQU8sYUFBYSxNQUM1QyxFQUFNLGlCQUNOLFNBQVMsU0FBVyxtQkFBbUIsU0FHcEIsSUFBakIsU0FBUyxNQUErQixLQUFqQixTQUFTLE1BQWEsS0FBSyxhQUFhLFNBQVMsS0FBSyxRQUFRLEtBQU0sS0FHakcsYUFBYSxHQUNDLElBQVIsRUFDRixLQUFLLFdBQVcsR0FFaEIsS0FBSyxhQUFhLEdBS3RCLFdBQVcsR0FDVCxTQUFTLEtBQU8sSUFDaEIsR0FBRyxlQUFlLFVBQVksT0FDOUIsR0FBRyxLQUFLLE9BQU8sa0JBQWtCLFVBQVksR0FDN0MsR0FBRyxLQUFLLE9BQU8scUJBQXFCLFVBQVksR0FDaEQsR0FBRyxLQUFLLE9BQU8sYUFBYSxNQUFRLEdBQ3BDLEdBQUcsS0FBSyxPQUFPLGFBQWEsUUFNOUIsbUJBQW1CLEdBQ2pCLElBQUssRUFBVyxHQUFVLEVBQUssTUFBTSxLQUFLLElBQUksR0FBSyxtQkFBbUIsSUFDdEUsR0FBK0IsR0FBM0IsRUFBVSxPQUFPLE9BQWEsT0FBTyxTQUFTLEtBQU8sSUFrQnpELEdBZkEsR0FBRyxLQUFLLE9BQU8sYUFBYSxNQUFRLEVBRS9CLEtBQUssYUFBYSxNQUlyQixLQUFLLFdBQVcsV0FBWSxPQUFPLFFBSG5DLEtBQUssYUFBYSxZQU9oQixLQUFLLGlCQUFtQixJQUMxQixLQUFLLGNBQWdCLEtBQUssYUFBYSxNQUFNLEdBQzdDLEtBQUssZUFBaUIsR0FHRyxHQUF2QixLQUFLLFFBQVEsT0FDZixPQUFPLEtBQUssYUFBYSwyQkFBNEIsUUFHckQsR0FBRyxlQUFlLFVBQVksVUFHOUIsR0FBRyxLQUFLLE9BQU8sa0JBQWtCLFVBQVksR0FDN0MsR0FBRyxLQUFLLE9BQU8scUJBQXFCLFVBQVksR0FJbEQsS0FBSyxlQUFpQixLQUFLLFFBQVEsTUFBTSxTQUFTLEdBQVMsU0FBUyxHQUFVLEtBQUssT0FBTyxnQkFHMUYsSUFBSSxFQUFrQixRQUFRLElBQUksS0FBSyxlQUFlLElBQUksTUFBTyxFQUFRLFdBRWpFLE1BQU0sRUFBUSxLQUFLLE9BQU8saUJBR2hDLElBQUksRUFBTyxJQUFJLFdBQVcsQ0FDeEIsU0FBVSxLQUFLLE9BQU8sU0FDdEIsT0FBUSxFQUNSLFNBQVUsSUFBSyxNQUFNLEVBQVMsRUFBSyxZQUlqQyxFQUFVLEVBQUssU0FDbkIsR0FBRyxLQUFLLE9BQU8sa0JBQWtCLE9BQU8sR0FHcEMsS0FBSyxPQUFPLGdCQUFrQixFQUFPLFNBQVcsS0FBSyxPQUFPLGVBQWUsV0FDN0UsRUFBSyxXQUFXLEtBQUssT0FBTyxnQkFJOUIsRUFBSyxjQUFjLEVBQU8sa0JBSXRCLEVBR04sSUFBSSxFQUFZLElBQUksVUFBVSxDQUM1QixPQUFRLEtBQUssSUFBSSxLQUFLLFFBQVEsT0FBUyxLQUFLLE9BQU8sZUFBZ0IsS0FBSyxPQUFPLFVBQy9FLFNBQVUsS0FBSyxNQUFNLFNBQVMsR0FBVSxLQUFLLE9BQU8sZ0JBQ3BELE9BQVMsT0FBZSxtQkFBbUIsTUFBYyxFQUFVLEtBQUssT0FBTyxtQkFJakYsTUFBTSxHQUFHLEtBQUssT0FBTyxxQkFBc0IsRUFBVSxVQUdyRCxLQUFLLFdBQVcsMEJBQTJCLE9BQU8sUUFJcEQsYUFBYSxFQUFNLEVBQVcsVUFDNUIsR0FBRyxlQUFlLFVBQVksU0FDOUIsR0FBRyxLQUFLLE9BQU8scUJBQXFCLFVBQVksR0FDaEQsSUFBSSxFQUFhLEdBQUcsS0FBSyxPQUFPLGtCQUNoQyxFQUFXLFVBQVksR0FDdkIsRUFBVyxPQUFPLDZPQUFBLE9BSXBCLFdBQVcsRUFBTSxFQUFXLFVBQzFCLElBQUksSUFBSSxvQkFBb0IsUUFBUSxHQUFLLEVBQUUsVUFDM0MsSUFBSSxFQUFTLHlVQUFBLE1BRWIsT0FEQSxHQUFHLEtBQUssT0FBTyxrQkFBa0IsT0FBTyxHQUNqQyxFQUdULHdCQUF3QixTQUNoQixLQUFLLGFBQ1gsSUFBSSxFQUFPLEdBQUcsR0FDVixRQUFhLEtBQUssYUFBYSxVQUVuQyxFQUFLLFVBQVksR0FFakIsSUFBSyxJQUFJLEtBQU8sT0FBTyxLQUFLLEdBQU0sS0FBSyxDQUFDLEVBQUUsSUFBSyxFQUFLLEdBQUssRUFBSyxJQUM1RCxFQUFLLE9BQU8sbVFBQUEsaURBS2xCLElBQUksR0FBSyxPQUFPLEdBQUssSUFBSSxXQUFXLENBQ2xDLGFBQWMsU0FDZCxrQkFBbUIsd0JBQ25CLGtCQUFtQiwwQkFDbkIsZUFBZ0IsR0FDaEIsU0FBVSxFQUNWLFdBQVksVUFDWixXQUFZLGVBQ1osWUFBYSxjQUNiLGlCQUFrQixXQUNsQixvQkFBcUIsY0FDckIsZ0JBQWlCLGNBQWMsaUJBQWlCLFNBQVMsaUJBQWlCLGlCQUFpQixzQkFBc0IsUUFDakgsU0FBVSxDQUNSLFNBQVksQ0FBRSxLQUFNLFdBQVksS0FBTSwyREFDdEMsU0FBWSxDQUFFLEtBQU0sWUFBYSxLQUFNLGdGQUN2QyxZQUFhLENBQUUsS0FBTSxZQUFhLEtBQU0sbUZBVVYsUUFBOUIsU0FBUyxLQUFLLFFBQVEsTUFBZ0IsR0FBRyxXQUU3QyxHQUFHLE9BRUMsU0FBUyxLQUFLLFFBQVEsYUFBYSxHQUFHLGtCQUFrQixTQUFTLEtBQUssUUFBUTs7OztBQzlMbEYsSUFBSSxLQUFPLENBRVQsVUFBVyxDQUFDLEVBQVEsS0FJbEIsSUFBSSxFQUFVLEVBQU8sU0FBUyxHQUU5QixNQUFRLElBQUssT0FBTyxFQUFPLEVBQVEsUUFBVSxHQUkvQyxVQUFZLEdBR0gsU0FBUyxFQUFjLEdBSWhDLFdBQVksQ0FBQyxFQUFRLEtBTW5CLElBQUksRUFBaUIsRUFBTyxFQUN4QixFQUFVLEtBQUssSUFBSSxHQUFRLFNBQVMsR0FFeEMsT0FBUSxFQUFTLEVBQUksSUFBSSxLQUFRLElBQUssT0FBTyxFQUFpQixFQUFRLFFBQVUsR0FJbEYsV0FBYSxJQUdYLElBQUksRUFBYSxFQUFhLE1BQU0sRUFBRyxHQUNuQyxFQUFjLEVBQWEsTUFBTSxHQUNqQyxFQUFXLFNBQVMsRUFBYSxHQUNyQyxNQUFxQixLQUFkLEdBQXFCLEdBQVksR0FJMUMsWUFBYyxHQUNMLE1BQU0sS0FBSyxFQUFXLEdBQUssS0FBSyxVQUFVLEVBQUcsSUFBSSxLQUFLLElBRy9ELFlBQWMsR0FFTCxNQUFNLEtBQUssS0FBSyxjQUFjLEVBQWMsR0FBSSxHQUFTLEtBQUssVUFBVSxJQUlqRixrQkFBbUIsQ0FBQyxFQUFXLEVBQWtCLElBQ3hDLEtBQUssWUFBWSxFQUFVLE1BQU0sRUFBRyxLQUFLLEtBQUssRUFBa0IsS0FBSyxNQUFNLEVBQUcsR0FJdkYsY0FBZ0IsR0FDUCxNQUFNLEtBQUssRUFBVyxHQUFPLG1CQUFtQixJQUFNLEtBQUssSUFHcEUsY0FBZ0IsR0FFUCxJQUFJLFdBQVcsTUFBTSxLQUFLLEtBQUssY0FBYyxFQUFjLEdBQUksR0FBVSxTQUFTLEVBQVEsTUFJbkcsV0FBWSxDQUFDLEVBQVEsS0FDbkIsSUFDSSxFQURRLEVBQU8sSUFBSSxHQUFPLEtBQUssTUFBTSxHQUFRLEdBQU0sRUFBZSxFQUFLLEtBQzFELElBQUksR0FBUSxLQUFLLFdBQVcsRUFBTSxJQUFlLEtBQUssSUFFdkUsT0FESSxFQUFLLE9BQVMsR0FBSyxJQUFHLEdBQVMsSUFBSyxPQUFPLEVBQUssRUFBSyxPQUFTLElBQzNELEtBQUssWUFBWSxJQUkxQixhQUFjLENBQUMsRUFBTyxFQUFjLEtBQ2xDLElBQUksRUFBTyxLQUFLLFlBQVksR0FDNUIsT0FBTyxLQUFLLFNBQVMsRUFBYSxJQUVoQyxPQURXLEtBQUssV0FBVyxFQUFLLE1BQU0sRUFBUSxHQUFlLEVBQVEsR0FBSyxLQUMxRCxHQUFNLEVBQWUsRUFBTSxNQVEvQyx1QkFBeUIsR0FDaEIsS0FBSyxZQUFZLEVBQVMsR0FBYSxJQUFJLFdBQVcsS0FBSyxjQUFjLEtBS2xGLFlBQWEsQ0FBQyxFQUFRLEVBQVksQ0FBQSxHQUFNLEdBQUcsRUFBYyxDQUFBLEdBQU0sTUFDN0QsSUFBSSxFQUFNLElBQUksSUFDZCxJQUFBLElBQVMsS0FBZ0IsRUFDdkIsRUFBSSxJQUFJLEVBQVMsR0FBZSxFQUFXLEVBQU8sS0FFcEQsT0FBTyxHQU1ULFdBQWEsSUFDTixLQUFLLGdCQUFlLEtBQUssY0FBZ0IsSUFBSSxZQUFZLFVBQ3ZELEtBQUssY0FBYyxPQUFPLElBR25DLFdBQWEsSUFDTixLQUFLLGdCQUFlLEtBQUssY0FBZ0IsSUFBSSxZQUFZLFVBQ3ZELEtBQUssY0FBYyxPQUFPLElBSW5DLE1BQU8sQ0FBQyxFQUFPLEtBQ2IsSUFBSSxFQUFRLEVBQ1osS0FBTyxFQUFRLEdBQ2IsRUFBUyxFQUFPLEdBQ2hCLEdBQVMsR0FLYixTQUFVLENBQUMsRUFBTyxJQUNULE1BQU0sS0FBSyxLQUFLLGlCQUFpQixFQUFPLElBSWpELGlCQUFrQixVQUFXLEVBQU8sR0FDbEMsSUFBSSxFQUFRLEVBQ1osS0FBTyxFQUFRLFNBQ1AsRUFBUyxFQUFPLEdBQ3RCLEdBQVMsR0FNYixNQUFPLENBQUMsRUFBVyxFQUFXLEVBQVksRUFBQSxJQUNqQyxNQUFNLEtBQUssS0FBSyxjQUFjLEVBQVcsRUFBVyxJQUs3RCxjQUFlLFVBQVUsRUFBVyxFQUFXLEVBQVksRUFBQSxHQUN6RCxJQUFJLEVBQVEsRUFBVSxPQUFPLFlBQzdCLEtBQU8sRUFBWSxHQUFHLENBQ3BCLElBQUksRUFBUSxHQUNaLEtBQU8sRUFBTSxPQUFTLEdBQVcsQ0FDL0IsSUFBSSxFQUFTLEVBQU0sT0FDbkIsR0FBSSxFQUFPLEtBRVQsWUFESSxFQUFNLE9BQVMsU0FBK0IsaUJBQWQsRUFBMEIsRUFBTSxLQUFLLElBQU0sSUFHL0UsRUFBTSxLQUFLLEVBQU8sWUFHTSxpQkFBZCxFQUEwQixFQUFNLEtBQUssSUFBTSxFQUN6RCxHQUFhLElBTWpCLGNBQWUsTUFBQSxJQUNiLElBQUksUUFBYSxNQUFNLEVBQU0sQ0FBRSxLQUFNLGdCQUNyQyxJQUFLLEVBQUssR0FBSSxNQUFNLElBQUksNENBQTRDLEVBQUssMEJBQTBCLHFCQUNuRyxPQUFPLE9BQU8sV0FBVyxFQUFLLGdCQUloQyxZQUFhLE1BQU8sRUFBTSxLQUd4QixPQURBLEVBRGMsQ0FBQyxLQUFNLFFBQVMsT0FBUSxVQUFXLE9BQVEsVUFBVyxPQUFRLFdBQy9ELElBQVMsRUFDZixJQUFJLGlCQUFpQixPQUFPLE9BQU8sT0FBTyxFQUFNLE1BSTNELE1BQU0sbUJBQXFCLEtBQUssU0FBUyxJQUFTLElBQy9DLEtBQU8sRUFBTyxTQUFTLElBQUksZUFBZSxPQUFPLElBR3BELE9BQU8sUUFBVTs7Ozs7O0FDL0tqQixNQUFNLE9BQVMsUUFBUSxXQUNqQixLQUFPLFFBQVEsUUFHckIsTUFBTSxjQVVKLFlBQVksRUFBUyxJQUNuQixLQUFLLE9BQVMsRUFJZCxLQUFLLFNBQVcsQ0FDZCxhQUFjLEtBQUssT0FBTyxjQUFnQixTQUMxQyxXQUFZLEtBQUssT0FBTyxZQUFjLElBQ3RDLFdBQVksS0FBSyxPQUFPLFlBQWMsRUFDdEMsZUFBZ0IsS0FBSyxPQUFPLGdCQUFrQixLQUFLLE1BQ25ELFdBQVksS0FBSyxPQUFPLFlBQWMsRUFDdEMsVUFBVyxLQUFLLE9BQU8sV0FBYSxJQUt4QyxhQUVFLE9BREEsS0FBSyxTQUFXLEtBQUssWUFBWSxLQUFLLE9BQU8sR0FBRyxZQUFZLEtBQUssT0FBTyx1QkFDakUsS0FLVCxrQkFBa0IsR0FDWixLQUFLLE9BQU8sYUFBWSxFQUFhLEtBQUssT0FBTyxXQUFXLElBQ2hFLElBQUksUUFBaUIsS0FBSyxPQUFPLE9BQU8sS0FBSyxTQUFTLGFBQWMsT0FBTyxXQUFXLElBQ2xGLEVBQVcsU0FBUyxPQUFPLGtCQUFrQixFQUFVLEtBQUssU0FBUyxZQUFhLEdBQ2xGLEVBQVcsU0FBUyxPQUFPLGtCQUFrQixFQUFVLEtBQUssU0FBUyxXQUFZLEdBQ3JGLE1BQU8sQ0FBRSxTQUFVLEVBQVksU0FBQSxFQUFVLFFBQUEsRUFBUyxRQUFTLEtBQUssT0FBTyxlQUFlLEtBQVksVUFJcEcsb0JBQW9CLEVBQVksR0FFOUIsSUFBTSxLQUFNLEVBQVIsU0FBbUIsU0FBbUIsS0FBSyxZQUFZLEdBR3ZELEVBQWMsS0FBSyxPQUFPLEVBQVksSUFBSSxLQUFLLE1BRS9DLEVBQWUsRUFBWSxJQUFJLEdBQUssRUFBSSxHQUV4QyxFQUFlLE9BQU8sV0FBVyxFQUFjLEtBQUssU0FBUyxZQUU3RCxFQUFhLE9BQU8sT0FBTyxDQUFDLEVBQVUsRUFBYSxHQUFjLElBQUksR0FBSyxLQUFLLE9BQU8sV0FFcEYsS0FBSyxPQUFPLEdBQUcsV0FBVyxTQUMxQixLQUFLLE9BQU8sR0FBRyxXQUFXLEVBQVcsR0FJN0MsYUFBYSxHQUVYLElBQU0sS0FBTSxFQUFSLFNBQW1CLFNBQW1CLEtBQUssWUFBWSxHQUV2RCxFQUFZLEtBQUssZ0JBQWdCLEtBQUssT0FBTyxHQUFHLFNBQVMsSUFFN0QsSUFBQSxJQUFVLEVBQVcsRUFBYSxLQUFpQixPQUFPLGNBQWMsRUFBVyxHQUNqRixHQUFJLEdBQVksRUFBVyxDQUV6QixPQURtQixPQUFPLGFBQWEsRUFBYyxLQUFLLFNBQVMsV0FBWSxLQUFLLFNBQVMsWUFDekUsSUFBSSxHQUFLLEVBQUksSUFNdkMsbUJBQ1EsS0FBSyxPQUFPLEdBQUcsYUFBYSxLQUFLLE9BQU8scUJBQXNCLE9BQU8sV0FBVyxLQUFLLFVBQVUsS0FBSyxTQUFVLEtBQU0sTUFJOUgsT0FBTyxRQUFVOzs7OztBQy9GakIsTUFBTSxHQUFLLENBRVQsSUFBSyxJQUFJLElBQVcsRUFBUSxPQUFPLENBQUMsRUFBRSxJQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUssSUFBTyxFQUFNLEVBQUUsS0FHdEUsU0FBVSxDQUFDLEVBQU0sSUFDZixFQUFLLElBQUssR0FBUSxFQUFLLElBQUksQ0FBQyxFQUFHLElBQUssRUFBSSxFQUFJLEtBRzlDLEtBQU0sSUFBSSxJQUFRLEdBQUcsU0FBUyxDQUFDLEdBQUcsT0FBTyxJQUFRLEdBQUcsTUFBTSxFQUFJLEVBQUssT0FBUSxFQUFLLEdBQUcsU0FBUyxHQUc1RixNQUFPLENBQUMsRUFBTyxLQUNiLElBQUksRUFBUSxHQUNaLElBQUssSUFBSSxFQUFJLEVBQUcsRUFBSSxFQUFNLElBQUssRUFBTSxLQUFLLEdBQzFDLE9BQU8sR0FJVCxnQkFBaUIsQ0FBQyxFQUFHLEtBQ25CLElBQUksRUFBUyxFQUNiLElBQUssSUFBSSxFQUFJLEVBQUcsRUFBSSxFQUFFLE9BQVEsSUFBSyxDQUNqQyxNQUFNLEVBQU8sRUFBRSxHQUFLLEVBQUUsR0FDdEIsR0FBVSxFQUFPLEVBRW5CLE9BQU8sR0FLVCxVQUFXLElBQUksS0FFYixHQUFJLEVBQVEsUUFBVSxFQUFHLE1BQU8sQ0FBQyxHQUVqQyxJQUFJLEVBQWEsR0FBRyxRQUFRLEdBRTVCLE9BQU8sRUFBUSxJQUFJLEdBQUssR0FBRyxnQkFBZ0IsRUFBRyxNQUk1QixpQkFBbEIsU0FDRixPQUFPLFFBQVU7OztBQzFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3QxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3Z6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDN21CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4Z0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBLGFBRUEsSUFBSSxxQkFBdUIsV0FDdkIsb0JBQXNCLFdBQ3RCLG1CQUFxQixTQUNyQixrQkFBb0IsU0FDcEIsZ0JBQWtCLFdBRWxCLFVBQVksQ0FDZCxJQUFLLE9BQVEsSUFBSyxNQUFPLE1BQU8sS0FBTSxPQUFRLE9BQVEsTUFBTyxLQUFNLElBQ25FLE1BQU8sT0FBUSxJQUFLLEtBQU0sS0FBTSxNQUFPLE9BQVEsSUFBSyxNQUFPLFFBQVMsT0FDcEUsU0FBVSxNQUFPLE1BQU8sT0FBUSxJQUFLLE1BQU8sT0FHMUMsY0FBZ0IsQ0FDbEIsT0FBUSxNQUFPLFlBR2pCLE9BQU8sUUFBVSxTQUFTLEVBQWEsRUFBSSxHQUN6QyxHQUFLLE1BQU0sUUFBUSxHQU9uQixJQUxBLElBR0ksRUFBTyxFQUhQLEVBQVcsRUFBRyxTQUFTLGNBRXZCLEdBQVUsRUFHTCxFQUFJLEVBQUcsRUFBTSxFQUFPLE9BQVEsRUFBSSxFQUFLLElBQUssQ0FDakQsSUFBSSxFQUFPLEVBQU8sR0FDbEIsR0FBSSxNQUFNLFFBQVEsR0FDaEIsRUFBWSxFQUFJLE9BRGxCLEVBS29CLGlCQUFULEdBQ08sa0JBQVQsR0FDUyxtQkFBVCxHQUNQLGFBQWdCLE1BQ2hCLGFBQWdCLFVBQ2hCLEVBQU8sRUFBSyxZQUdkLElBQUksRUFBWSxFQUFHLFdBQVcsRUFBRyxXQUFXLE9BQVMsR0FHckQsR0FBb0IsaUJBQVQsRUFDVCxHQUFVLEVBR04sR0FBb0MsVUFBdkIsRUFBVSxTQUN6QixFQUFVLFdBQWEsR0FJdkIsRUFBTyxFQUFHLGNBQWMsZUFBZSxHQUN2QyxFQUFHLFlBQVksR0FDZixFQUFZLEdBS1YsSUFBTSxFQUFNLElBQ2QsR0FBVSxHQUcyQixJQUFqQyxVQUFVLFFBQVEsS0FDaUIsSUFBckMsY0FBYyxRQUFRLEdBTVIsTUFMZCxFQUFRLEVBQVUsVUFDZixRQUFRLG9CQUFxQixJQUM3QixRQUFRLG1CQUFvQixJQUM1QixRQUFRLHFCQUFzQixJQUM5QixRQUFRLGdCQUFpQixNQUUxQixFQUFHLFlBQVksR0FFZixFQUFVLFVBQVksR0FFc0IsSUFBckMsY0FBYyxRQUFRLEtBSS9CLEVBQWUsSUFBTixFQUFVLEdBQUssSUFDeEIsRUFBUSxFQUFVLFVBQ2YsUUFBUSxvQkFBcUIsR0FDN0IsUUFBUSxrQkFBbUIsS0FDM0IsUUFBUSxtQkFBb0IsSUFDNUIsUUFBUSxxQkFBc0IsSUFDOUIsUUFBUSxnQkFBaUIsS0FDNUIsRUFBVSxVQUFZLFNBS3JCLEdBQUksR0FBUSxFQUFLLFNBQVUsQ0FFNUIsSUFDRixHQUFVLEdBSTJCLElBQWpDLFVBQVUsUUFBUSxLQUNpQixJQUFyQyxjQUFjLFFBQVEsR0FPUixNQU5kLEVBQVEsRUFBVSxVQUNmLFFBQVEsb0JBQXFCLElBQzdCLFFBQVEscUJBQXNCLEtBQzlCLFFBQVEsZ0JBQWlCLE1BSTFCLEVBQUcsWUFBWSxHQUVmLEVBQVUsVUFBWSxHQUdzQixJQUFyQyxjQUFjLFFBQVEsS0FDL0IsRUFBUSxFQUFVLFVBQ2YsUUFBUSxrQkFBbUIsS0FDM0IsUUFBUSxvQkFBcUIsSUFDN0IsUUFBUSxxQkFBc0IsS0FDOUIsUUFBUSxnQkFBaUIsS0FDNUIsRUFBVSxVQUFZLElBSzFCLElBQUksRUFBWSxFQUFLLFNBQ2pCLElBQVcsRUFBVyxFQUFVLGVBR3BDLEVBQUcsWUFBWTs7O0FDaElyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3QgU2VhcmNoTGlicmFyeSA9IHJlcXVpcmUoJy4uL3NlYXJjaC1saWJyYXJ5L2xpYnJhcnktd2ViJylcbmNvbnN0IFZlY3RvckxpYnJhcnkgPSByZXF1aXJlKCcuLi92ZWN0b3ItbGlicmFyeS9saWJyYXJ5JylcbmNvbnN0IFNlYXJjaFF1ZXJ5ID0gcmVxdWlyZSgnLi9xdWVyeScpXG5jb25zdCBWVSA9IHJlcXVpcmUoJy4uL3ZlY3Rvci11dGlsaXRpZXMnKVxuY29uc3QgZnN1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5cbmNsYXNzIFNlYXJjaEVuZ2luZSB7XG4gIC8vIHJlcXVpcmVzIGEgY29uZmlnIG9iamVjdCBjb250YWluaW5nOlxuICAvLyAgIHNlYXJjaExpYnJhcnlQYXRoOiBwYXRoIHRvIHNlYXJjaCBsaWJyYXJ5IGRpcmVjdG9yeVxuICAvLyAgIHZlY3RvckxpYnJhcnlQYXRoOiBwYXRoIHRvIHZlY3RvciBsaWJyYXJ5IGRpcmVjdG9yeVxuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICB0aGlzLnJlYWR5ID0gZmFsc2VcbiAgICB0aGlzLnJlYWR5SGFuZGxlcnMgPSBbXVxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnXG4gIH1cblxuICAvLyBsb2FkIHRoZSBuZWNlc3NhcnkgaW5kZXggZGF0YSB0byBiZSByZWFkeSB0byBhY2NlcHQgcXVlcmllc1xuICBhc3luYyBsb2FkKCkge1xuICAgIHRyeSB7XG4gICAgICBbdGhpcy5zZWFyY2hMaWJyYXJ5LCB0aGlzLnZlY3RvckxpYnJhcnldID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAobmV3IFNlYXJjaExpYnJhcnkoeyBwYXRoOiB0aGlzLmNvbmZpZy5zZWFyY2hMaWJyYXJ5UGF0aCB9KSkub3BlbigpLFxuICAgICAgICAobmV3IFZlY3RvckxpYnJhcnkoe1xuICAgICAgICAgIHBhdGg6IHRoaXMuY29uZmlnLnZlY3RvckxpYnJhcnlQYXRoLFxuICAgICAgICAgIGZzOiB7IHJlYWRGaWxlOiBmc3V0aWwuZmV0Y2hMaWtlRmlsZSB9LFxuICAgICAgICAgIGRpZ2VzdDogZnN1dGlsLmRpZ2VzdE9uV2ViXG4gICAgICAgIH0pKS5vcGVuKClcbiAgICAgIF0pXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLnJlYWR5SGFuZGxlcnMuZm9yRWFjaCgoW3Jlc29sdmUsIHJlamVjdF0pID0+IHJlamVjdChlcnIpKVxuICAgICAgdGhpcy5yZWFkeUhhbmRsZXJzID0gW11cbiAgICAgIHRocm93IGVyclxuICAgIH1cbiAgICB0aGlzLnJlYWR5ID0gdHJ1ZVxuICAgIHRoaXMucmVhZHlIYW5kbGVycy5mb3JFYWNoKChbcmVzb2x2ZSwgcmVqZWN0XSkgPT4gcmVzb2x2ZSh0aGlzKSlcbiAgICB0aGlzLnJlYWR5SGFuZGxlcnMgPSBbXVxuICB9XG5cbiAgLy8gcmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgb25jZSB0aGUgc2VhcmNoIGVuZ2luZSBpcyBmdWxseSBsb2FkZWQgYW5kIHJlYWR5IHRvIGFjY2VwdCBxdWVyaWVzXG4gIGF3YWl0UmVhZHkoKSB7XG4gICAgaWYgKHRoaXMucmVhZHkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5yZWFkeUhhbmRsZXJzLnB1c2goW3Jlc29sdmUsIHJlamVjdF0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIHJldHVybnMgYSBsaXN0IG9mIHNlYXJjaCByZXN1bHQgb2JqZWN0cywgd2hpY2ggY2FuIGJlIHBhc3NlZCB0byBAZmV0Y2ggdG8gYXN5bmNyb25vdXNseSBsb2FkIHNlYXJjaCByZXN1bHQgcHJlc2VudGF0aW9uIGluZm9ybWF0aW9uXG4gIGFzeW5jIHF1ZXJ5KHF1ZXJ5VGV4dCkge1xuICAgIGF3YWl0IHRoaXMuYXdhaXRSZWFkeSgpXG5cbiAgICAvLyBwYXJzZSB0aGUgcXVlcnkgc2VhcmNoIGlucHV0IHRleHQgaW4gdG8gdG9rZW5zXG4gICAgbGV0IHF1ZXJ5ID0gbmV3IFNlYXJjaFF1ZXJ5KHF1ZXJ5VGV4dClcbiAgICAvLyBsb29rdXAgZXZlcnkga2V5d29yZCBhbmQgcmVwbGFjZSBpdCB3aXRoIGEgd29yZCB2ZWN0b3IgaWYgcG9zc2libGVcbiAgICBhd2FpdCBxdWVyeS52ZWN0b3JpemUodGhpcy52ZWN0b3JMaWJyYXJ5KVxuXG4gICAgLy8gZmlsdGVyIHJlc3VsdHMgZm9yIGhhc2h0YWcgbWF0Y2hpbmdcbiAgICBsZXQgcG9zaXRpdmVUYWdzID0gcXVlcnkuaGFzaHRhZ3MuZmlsdGVyKHggPT4gIHgucG9zaXRpdmUpLm1hcCh4ID0+IHgudGV4dClcbiAgICBsZXQgbmVnYXRpdmVUYWdzID0gcXVlcnkuaGFzaHRhZ3MuZmlsdGVyKHggPT4gIXgucG9zaXRpdmUpLm1hcCh4ID0+IHgudGV4dClcbiAgICAvLyBxdWVyeSB0aGUgc2VhcmNoIGluZGV4IGZvciB0aGVzZSBrZXl3b3JkcyAoYm90aCB2ZWN0b3JzIGFuZCBwbGFpbnRleHQpXG4gICAgbGV0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnNlYXJjaExpYnJhcnkucXVlcnkoKHJlc3VsdCk9PiB7XG4gICAgICBpZiAocG9zaXRpdmVUYWdzLnNvbWUodGFnID0+ICFyZXN1bHQudGFncy5pbmNsdWRlcyh0YWcpKSkgcmV0dXJuIGZhbHNlIC8vIGV4Y2x1ZGUgbm9uIG1hdGNoaW5nIHBvc2l0aXZlIHRhZ3NcbiAgICAgIGlmIChuZWdhdGl2ZVRhZ3Muc29tZSh0YWcgPT4gcmVzdWx0LnRhZ3MuaW5jbHVkZXModGFnKSkpIHJldHVybiBmYWxzZSAvLyBleGNsdWRlIGlmIGFueSBhbnRpdGFncyBtYXRjaFxuXG4gICAgICBsZXQgZGlzdGFuY2VzID0gcXVlcnkua2V5d29yZHMubWFwKHF1ZXJ5VGVybSA9PlxuICAgICAgICAvLyByZXR1cm4gdGhlIGJlc3QgbWF0Y2ggb2YgdGhlIHF1ZXJ5IHRlcm1zIGFnYWluc3QgZWFjaCByZXN1bHQgdGVybVxuICAgICAgICBNYXRoLm1pbiguLi5yZXN1bHQudGVybXMubWFwKHJlc3VsdFRlcm0gPT4gcXVlcnlUZXJtLmRpc3RhbmNlKHJlc3VsdFRlcm0pKSlcbiAgICAgIClcblxuICAgICAgLy8gYWRkIHRoZSBkaXN0YW5jZXMgdG9nZXRoZXIgZm9yIGVhY2ggcmVzdWx0IHRlcm1cbiAgICAgIGxldCBhZGRlZERpc3RhbmNlcyA9IGRpc3RhbmNlcy5yZWR1Y2UoKHgseSk9PiB4ICsgeSwgMClcbiAgICAgIC8vIGNhbGN1bGF0ZSBhIGZpbmFsIGRpc3RhbmNlIGJ5IGFkZGluZyB0ZXJtIGRpdmVyc2l0eSBzY29yZVxuICAgICAgcmV0dXJuIGFkZGVkRGlzdGFuY2VzICsgKHJlc3VsdC50ZXJtRGl2ZXJzaXR5IC8gNTAwKVxuICAgIH0pXG5cbiAgICAvLyBzb3J0IHJlc3VsdHMgYW5kIHJldHVybiB0aGVtXG4gICAgcmV0dXJuIHJlc3VsdHMuc29ydCgoYSxiKSA9PiBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZSlcbiAgfVxuXG4gIC8vIHJldHVybnMgYW4gb2JqZWN0LCB3aXRoIGhhc2h0YWcgdGV4dCBsYWJlbHMgYXMga2V5cywgYW5kIGludGVnZXJzIGFzIHZhbHVlcywgdGhlIGludGVnZXIgaXMgdGhlIHRvdGFsIG51bWJlciBvZiBzZWFyY2ggcmVzdWx0cyBmZWF0dXJpbmcgdGhhdCBoYXNodGFnXG4gIGFzeW5jIGdldFRhZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5hd2FpdFJlYWR5KClcbiAgICByZXR1cm4gdGhpcy5zZWFyY2hMaWJyYXJ5LmdldFRhZ3MoKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2VhcmNoRW5naW5lIiwiY29uc3QgVlUgPSByZXF1aXJlKCcuLi92ZWN0b3ItdXRpbGl0aWVzJylcblxuLy8gUGFyc2VzIHRleHQgc2VhcmNoIHN0cmluZ3MgYW5kIHJldHVybnMgc3RydWN0dXJlZCBkYXRhIGRlc2NyaWJpbmcgdGhlIHRva2VucyBpbiB0aGUgcXVlcnkgbGlrZSBoYXNodGFncyBhbmQga2V5d29yZHNcbmNsYXNzIFNlYXJjaFF1ZXJ5IHtcbiAgY29uc3RydWN0b3IocXVlcnlUZXh0KSB7XG4gICAgLy8gdG9rZW5pc2Ugc2VhcmNoIHN0cmluZyBpbiB0byBpbmRpdmlkdWFsIHBpZWNlc1xuICAgIHRoaXMucmF3VG9rZW5zID0gcXVlcnlUZXh0LnRyaW0oKS5zcGxpdCgvW1xcdFxcbiw/ITs6XFxbXFxdXFwoXFwpe30gXCLigJ3igJxdKy8pLmZpbHRlcih4ID0+IHgudG9TdHJpbmcoKS50cmltKCkubGVuZ3RoID4gMClcblxuICAgIC8vIG1hcCBlYWNoIHBpZWNlIGluIHRvIGEgdG9rZW4gb2JqZWN0XG4gICAgdGhpcy50b2tlbnMgPSB0aGlzLnJhd1Rva2Vucy5tYXAoKHJhd1Rva2VuKSA9PiB7XG4gICAgICBpZiAocmF3VG9rZW4ubWF0Y2goL14tIyhbYS16QS1aMC05Ll8tXSspJC8pKSB7XG4gICAgICAgIHJldHVybiBuZXcgSGFzaHRhZ1Rva2VuKHJhd1Rva2VuLnNsaWNlKDIpLCBmYWxzZSlcbiAgICAgIH0gZWxzZSBpZiAocmF3VG9rZW4ubWF0Y2goL14jKFthLXpBLVowLTkuXy1dKykkLykpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBIYXNodGFnVG9rZW4ocmF3VG9rZW4uc2xpY2UoMSksIHRydWUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBub3JtYWxpc2UgdW5pY29kZSBhcG9zdHJvcGhlcyBpbiB0byBhc2NpaSBhcG9zdHJvcGhlc1xuICAgICAgICBsZXQgY2xlYW5lZFRlcm0gPSByYXdUb2tlbi50cmltKCkucmVwbGFjZSgv4oCYL2csIFwiJ1wiKVxuICAgICAgICAvLyBpZiB0aGUga2V5d29yZCBjb250YWlucyBhbnkgbG93ZXIgY2FzZSBsZXR0ZXJzIChub3QgYW4gYWNyb255bSksIG9yIGlzIGEgc2luZ2xlIGxldHRlciwgbG93ZXJjYXNlIGl0XG4gICAgICAgIGlmIChjbGVhbmVkVGVybS5tYXRjaCgvW2Etel0vKSB8fCBjbGVhbmVkVGVybS5sZW5ndGggPCAyKSBjbGVhbmVkVGVybSA9IGNsZWFuZWRUZXJtLnRvTG93ZXJDYXNlKClcblxuICAgICAgICByZXR1cm4gbmV3IEtleXdvcmRUb2tlbihjbGVhbmVkVGVybSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLy8gdHJhbnNmb3JtcyBrZXl3b3JkcyBpbiB0byBXb3JkIFZlY3RvcnNcbiAgYXN5bmMgdmVjdG9yaXplKHZlY3RvckxpYnJhcnkpIHtcbiAgICB0aGlzLnRva2VucyA9IGF3YWl0IFByb21pc2UuYWxsKHRoaXMudG9rZW5zLm1hcChhc3luYyAodG9rZW4pID0+IHtcbiAgICAgIGlmICh0b2tlbi5jb25zdHJ1Y3RvciA9PSBLZXl3b3JkVG9rZW4pIHtcbiAgICAgICAgbGV0IHZlY3RvciA9IGF3YWl0IHZlY3RvckxpYnJhcnkubG9va3VwKHRva2VuKVxuICAgICAgICBpZiAodmVjdG9yKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBXb3JkVmVjdG9yKHRva2VuLCB2ZWN0b3IpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRva2VuXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0b2tlblxuICAgICAgfVxuICAgIH0pKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBnZXQgYW4gYXJyYXkgb2Yga2V5d29yZHMgaW4gdGhlIHNlYXJjaCBxdWVyeVxuICBnZXQga2V5d29yZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9rZW5zLmZpbHRlcih0b2tlbiA9PiAodG9rZW4uY29uc3RydWN0b3IgPT0gS2V5d29yZFRva2VuIHx8IHRva2VuLmNvbnN0cnVjdG9yID09IFdvcmRWZWN0b3IpKVxuICB9XG5cbiAgLy8gZ2V0IGFuIGFycmF5IG9mIGhhc2h0YWdzIGluIHRoZSBzZWFyY2ggcXVlcnlcbiAgZ2V0IGhhc2h0YWdzKCkge1xuICAgIHJldHVybiB0aGlzLnRva2Vucy5maWx0ZXIodG9rZW4gPT4gdG9rZW4uY29uc3RydWN0b3IgPT0gSGFzaHRhZ1Rva2VuKVxuICB9XG5cbiAgLy8gYnVpbGQgYW4gZXF1aXZpbGVudCBxdWVyeSB0byB3aGF0IHdhcyBvcmlnaW5hbGx5IHF1ZXJpZWQgZnJvbSB0aGUgc3RydWN0dXJlZCBkYXRhXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLnRva2Vucy5qb2luKCcgJylcbiAgfVxufVxuXG4vLyByZXByZXNlbnRzIGEgcGFyc2VkIGhhc2h0YWdcbmNsYXNzIEhhc2h0YWdUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHRleHQsIHBvc2l0aXZlID0gdHJ1ZSkge1xuICAgIHRoaXMudGV4dCA9IHRleHQudG9TdHJpbmcoKVxuICAgIHRoaXMucG9zaXRpdmUgPSAhIXBvc2l0aXZlXG4gIH1cblxuICB0b1N0cmluZygpIHsgcmV0dXJuIGAkeyB0aGlzLnBvc2l0aXZlID8gJyMnIDogJy0jJyB9JHt0aGlzLnRleHR9YH1cbn1cblxuLy8gcmVwcmVzZW50cyBhIHBsYWludGV4dCBrZXl3b3JkXG5jbGFzcyBLZXl3b3JkVG9rZW4ge1xuICBjb25zdHJ1Y3Rvcih0ZXh0KSB7XG4gICAgdGhpcy50ZXh0ID0gdGV4dC50b1N0cmluZygpXG4gIH1cblxuICAvLyByZXR1cm4gdmVjdG9yIGRpc3RhbmNlIChmdWRnZWQsIGJlY2F1c2UgdGhpcyBrZXl3b3JkIGxhY2tzIGEgdmVjdG9yKVxuICBkaXN0YW5jZSh0ZXJtKSB7XG4gICAgaWYgKHR5cGVvZih0ZXJtKSA9PSAnc3RyaW5nJyAmJiB0ZXJtID09IHRoaXMudGV4dCkge1xuICAgICAgcmV0dXJuIDBcbiAgICB9IGVsc2UgaWYgKHR5cGVvZih0ZXJtKSA9PSAnc3RyaW5nJyAmJiB0ZXJtLnRvTG93ZXJDYXNlKCkgPT0gdGhpcy50ZXh0LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgIHJldHVybiAwLjFcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDEwXG4gICAgfVxuICB9XG5cbiAgLy8gY29udmVydCB0byB0ZXh0IGZvciBkaXNwbGF5XG4gIHRvU3RyaW5nKCkgeyByZXR1cm4gdGhpcy50ZXh0IH1cbiAgLy8gY29udmVydCB0byB0aGUgZm9ybWF0IHVzZWQgYnkgU2VhcmNoTGlicmFyeVJlYWRlciBsb29rdXBzXG4gIHRvUXVlcnkoKSB7IHJldHVybiB0aGlzLnRleHQgfVxufVxuXG4vLyByZXByZXNlbnRzIGEgd29yZCB2ZWN0b3IsIHRoZSBvdXRwdXQgb2YgdGhlIFNlYXJjaFF1ZXJ5I3ZlY3Rvcml6ZSBtZXRob2RcbmNsYXNzIFdvcmRWZWN0b3Ige1xuICBjb25zdHJ1Y3Rvcih0ZXh0LCB2ZWN0b3IpIHtcbiAgICB0aGlzLnRleHQgPSB0ZXh0LnRvU3RyaW5nKClcbiAgICB0aGlzLnZlY3RvciA9IHZlY3RvclxuICB9XG5cbiAgLy8gcmV0dXJuIHZlY3RvciBkaXN0YW5jZVxuICBkaXN0YW5jZSh0ZXJtKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodGVybSkpIHtcbiAgICAgIHJldHVybiBWVS5kaXN0YW5jZVNxdWFyZWQodGhpcy52ZWN0b3IsIHRlcm0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAxMFxuICAgIH1cbiAgfVxuXG4gIC8vIGNvbnZlcnQgdG8gdGV4dCBmb3IgZGlzcGxheVxuICB0b1N0cmluZygpIHsgcmV0dXJuIHRoaXMudGV4dCB9XG4gIC8vIGNvbnZlcnQgdG8gdGhlIGZvcm1hdCB1c2VkIGJ5IFNlYXJjaExpYnJhcnlSZWFkZXIgbG9va3Vwc1xuICB0b1F1ZXJ5KCkgeyByZXR1cm4gdGhpcy52ZWN0b3IgfVxufVxuXG5TZWFyY2hRdWVyeS5IYXNodGFnVG9rZW4gPSBIYXNodGFnVG9rZW5cblNlYXJjaFF1ZXJ5LktleXdvcmRUb2tlbiA9IEtleXdvcmRUb2tlblxuU2VhcmNoUXVlcnkuV29yZFZlY3RvciAgID0gV29yZFZlY3RvclxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaFF1ZXJ5IiwiLy8gUGFnaW5hdG9yIHdpZGdldCBnZW5lcmF0ZXMgYSBsaXN0IG9mIHBhZ2UgYnV0dG9ucyB3aXRoIG9uZSBzZWxlY3RlZFxuXG5jb25zdCBodG1sID0gcmVxdWlyZSgnbmFub2h0bWwnKVxuXG5jbGFzcyBQYWdpbmF0b3JDb21wb25lbnQge1xuICAvLyBjb25zdHJ1Y3QgYSBwYWdpbmF0b3Igdmlld1xuICAvLyBhY2NlcHRzIGEgY29uZmlnIG9iamVjdDpcbiAgLy8gICBsZW5ndGg6IChkZWZhdWx0IDEpIHRvdGFsIG51bWJlciBvZiBwYWdlcyB0byBkaXNwbGF5XG4gIC8vICAgc2VsZWN0ZWQ6IChkZWZhdWx0IDApIHplcm8gaW5kZXhlZCBjdXJyZW50bHkgc2VsZWN0ZWQgcGFnZVxuICAvLyAgIGdldFVSTDogKGRlZmF1bHQgYD9wYWdlPSR7cGFnZU51bX1gKSBhIGZ1bmN0aW9uLCB3aGljaCBpcyBnaXZlbiBhIHBhZ2UgbnVtYmVyLCBhbmQgcmV0dXJucyBhIHVybCB0byB0aGF0IHBhZ2VcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgdGhpcy5sZW5ndGggPSBjb25maWcubGVuZ3RoIHx8IDFcbiAgICB0aGlzLnNlbGVjdGVkID0gY29uZmlnLnNlbGVjdGVkIHx8IDBcbiAgICB0aGlzLmdldFVSTCA9IGNvbmZpZy5nZXRVUkwgfHwgKCh4KT0+IGA/cGFnZT0ke3h9YClcbiAgfVxuXG4gIC8vIHNpbXBsZSByZWltcGxlbWVudGF0aW9uIG9mIFJ1YnkncyBJbnRlZ2VyLnRpbWVzIG1ldGhvZFxuICB0aW1lc01hcCh0aW1lcywgZm4pIHtcbiAgICBpZiAodGltZXMgPD0gMCkgcmV0dXJuIFtdXG4gICAgbGV0IHJlc3VsdCA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aW1lczsgaSsrKSB7XG4gICAgICByZXN1bHQucHVzaChmbihpKSlcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgdG9IVE1MKCkge1xuICAgIHJldHVybiBodG1sYFxuICAgIDxkaXYgaWQ9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAke3RoaXMudGltZXNNYXAodGhpcy5sZW5ndGgsIChuKSA9PlxuICAgICAgICBodG1sYDxhIGhyZWY9XCIke3RoaXMuZ2V0VVJMKG4pfVwiIGFyaWEtbGFiZWw9XCJQYWdlICR7biArIDF9XCIgYXJpYS1jdXJyZW50PVwiJHt0aGlzLnNlbGVjdGVkID09IG4gPyBcInBhZ2VcIiA6IFwiXCJ9XCI+JHtuICsgMX08L2E+YFxuICAgICAgKX1cbiAgICA8L2Rpdj5gXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYWdpbmF0b3JDb21wb25lbnQiLCJjb25zdCBodG1sID0gcmVxdWlyZSgnbmFub2h0bWwnKVxuXG5jbGFzcyBTZWFyY2hSZXN1bHRQYW5lbCB7XG4gIC8vIGFjY2VwdHMgYSBjb25maWcgb2JqZWN0LCB3aGljaCBpbmNsdWRlczpcbiAgLy8gd2FybmluZ3M6IGFuIG9iamVjdCB3aG9zZSBrZXlzIGFyZSBoYXNodGFncywgYW5kIHZhbHVlcyBhcmUgb2JqZWN0cyBpbiB0aGUgZm9ybWF0IHsgdHlwZTogJ2NzcyBjbGFzcyBuYW1lJywgdGV4dDogJ3BsYWludGV4dCBhbGVydCB0byBzaG93IHRvIHVzZXInIH1cbiAgLy8gb25DaGFuZ2U6IGEgZnVuY3Rpb24gd2hpY2ggd2hlbiBleGVjdXRlZCB3aWxsIGNhbGwgdG9IVE1MKCkgYW5kIHJlaW5zZXJ0IHRoZSBjb21wb25lbnQgaW4gdG8gdGhlIHBhZ2Ugd2l0aCB1cGRhdGVkIGRhdGFcbiAgY29uc3RydWN0b3IoY29uZmlnID0ge30pIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgIHRoaXMuY29uZmlnLm1lZGlhSW5kZXggPSB0aGlzLmNvbmZpZy5tZWRpYUluZGV4IHx8IDBcbiAgICB0aGlzLnJlc3VsdCA9IGNvbmZpZy5yZXN1bHQgfHwgbnVsbFxuICAgIHRoaXMuZm9yY2VkV2FybmluZ3MgPSBbXVxuICB9XG5cbiAgc2V0RGF0YShyZXN1bHREYXRhKSB7XG4gICAgdGhpcy5yZXN1bHQgPSByZXN1bHREYXRhXG4gICAgaWYgKHRoaXMuY29uZmlnLm9uQ2hhbmdlKSB0aGlzLmNvbmZpZy5vbkNoYW5nZSh0aGlzKVxuICB9XG5cbiAgYWRkV2FybmluZyh7IHR5cGUsIHRleHQgfSkge1xuICAgIHRoaXMuZm9yY2VkV2FybmluZ3MucHVzaCh7IHR5cGUsIHRleHQgfSlcbiAgICBpZiAodGhpcy5jb25maWcub25DaGFuZ2UpIHRoaXMuY29uZmlnLm9uQ2hhbmdlKHRoaXMpXG4gIH1cblxuICByZW1vdmVXYXJuaW5nKHR5cGUpIHtcbiAgICB0aGlzLmZvcmNlZFdhcm5pbmdzID0gdGhpcy5mb3JjZWRXYXJuaW5ncy5maWx0ZXIod2FybmluZyA9PiB3YXJuaW5nLnR5cGUgIT0gdHlwZSlcbiAgICBpZiAodGhpcy5jb25maWcub25DaGFuZ2UpIHRoaXMuY29uZmlnLm9uQ2hhbmdlKHRoaXMpXG4gIH1cblxuICAvLyBnZXQgaHRtbCAoRE9NIGVsZW1lbnRzIG9uIGJyb3dzZXIsIHN0cmluZyBvbiBub2RlanMpIHJlbmRlcmluZyBvZiB0aGlzIHNlYXJjaCByZXN1bHQgY29tcG9uZW50XG4gIHRvSFRNTCgpIHtcbiAgICBpZiAodGhpcy5yZXN1bHQgJiYgdGhpcy5yZXN1bHQuaXNGZXRjaGVkKCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnRvUG9wdWxhdGVkSFRNTCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnRvUGxhY2Vob2xkZXJIVE1MKClcbiAgICB9XG4gIH1cblxuICAvLyBnZXQgYW4gYXJyYXkgb2Ygd2FybmluZ3MgdG8gZGlzcGxheSBvbiB0aGlzIHNlYXJjaCByZXN1bHRcbiAgZ2V0V2FybmluZ3MoKSB7XG4gICAgbGV0IHRyaWdnZXJzID0gdGhpcy5jb25maWcud2FybmluZ3MgfHwge31cbiAgICBsZXQgbWF0Y2hlcyA9IE9iamVjdC5rZXlzKHRyaWdnZXJzKS5maWx0ZXIodGFnID0+IHRoaXMucmVzdWx0LnRhZ3MuaW5jbHVkZXModGFnKSlcbiAgICByZXR1cm4gWy4uLm1hdGNoZXMubWFwKHRhZyA9PiB0cmlnZ2Vyc1t0YWddICksIC4uLnRoaXMuZm9yY2VkV2FybmluZ3NdXG4gIH1cblxuICAvLyBnZXQgYW4gSUQgdG8gdXNlIHdpdGggdGhpcyBlbGVtZW50XG4gIHRvSUQoLi4ucGF0aCkge1xuICAgIGlmICh0aGlzLnJlc3VsdCkge1xuICAgICAgcmV0dXJuIFsncmVzdWx0JywgdGhpcy5yZXN1bHQuaWQsIC4uLnBhdGhdLmpvaW4oJy0nKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gIH1cblxuICB0b01lZGlhVmlld2VyKCkge1xuICAgIC8vIG9uQ2xpY2sgaGFuZGxlciBmb3IgYXJyb3cgYnV0dG9ucyBvbiBtZWRpYSBjYXJvdXNlbFxuICAgIGxldCBhZGp1c3RNZWRpYSA9IChldmVudCwgYWRqdXN0bWVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIHRoaXMuY29uZmlnLm1lZGlhSW5kZXggKz0gYWRqdXN0bWVudFxuICAgICAgdGhpcy5jb25maWcub25DaGFuZ2UodGhpcylcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIHNob3VsZCB0aGUgcHJldmlvdXMvbmV4dCB2aWRlbyBidXR0b25zIGJlIHZpc2libGUgdG8gdGhlIHVzZXIgYW5kIHZpc2libGUgdG8gc2NyZWVucmVhZGVyIHVzZXJzXG4gICAgbGV0IHNob3dQcmV2QnRuID0gdGhpcy5jb25maWcubWVkaWFJbmRleCA+IDBcbiAgICBsZXQgc2hvd05leHRCdG4gPSB0aGlzLmNvbmZpZy5tZWRpYUluZGV4IDwgdGhpcy5yZXN1bHQubWVkaWEubGVuZ3RoIC0gMVxuICAgIC8vIGdldCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIHBpZWNlIG9mIG1lZGlh4oCZcyBzb3VyY2UgbGlzdFxuICAgIGxldCBzb3VyY2VzID0gdGhpcy5yZXN1bHQubWVkaWFbdGhpcy5jb25maWcubWVkaWFJbmRleF1cblxuICAgIC8vIGJ1aWxkIG1lZGlhIHZpZXdlciBET01cbiAgICByZXR1cm4gaHRtbGBcbiAgICA8ZGl2IGNsYXNzPVwidmlkZW9fcGxheWVyXCI+XG4gICAgICA8cGljdHVyZSBjbGFzcz1cInZpZGVvX3RodW1iXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgZGF0YS1uYW5vbW9ycGgtY29tcG9uZW50LWlkPVwiJHt0aGlzLnJlc3VsdC5pZH0vbWVkaWEvJHt0aGlzLmNvbmZpZy5tZWRpYUluZGV4fVwiPlxuICAgICAgICAke3NvdXJjZXMubWFwKHNvdXJjZSA9PiBodG1sYDxzb3VyY2Ugc3Jjc2V0PVwiJHtzb3VyY2UudXJsfVwiIHR5cGU9XCIke3NvdXJjZS50eXBlfVwiPmAgKX1cbiAgICAgICAgPHZpZGVvIGNsYXNzPVwidmlkZW9fdGh1bWJcIiBtdXRlZCBwcmVsb2FkIGF1dG9wbGF5IGxvb3AgcGxheXNpbmxpbmU+XG4gICAgICAgICAgJHtzb3VyY2VzLm1hcChzb3VyY2UgPT4gaHRtbGA8c291cmNlIHNyYz1cIiR7c291cmNlLnVybH1cIiB0eXBlPVwiJHtzb3VyY2UudHlwZX1cIj5gICl9XG4gICAgICAgIDwvdmlkZW8+XG4gICAgICA8L3BpY3R1cmU+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwicHJldl92aWRcIiBhcmlhLWxhYmVsPVwiUHJldmlvdXMgVmlkZW9cIiBvbmNsaWNrPSR7KGUpPT4gYWRqdXN0TWVkaWEoZSwgLTEpfSBzdHlsZT1cIiR7c2hvd1ByZXZCdG4gPyAnJyA6ICdkaXNwbGF5OiBub25lJ31cIj4ke1wiPFwifTwvYnV0dG9uPlxuICAgICAgPGJ1dHRvbiBjbGFzcz1cIm5leHRfdmlkXCIgYXJpYS1sYWJlbD1cIk5leHQgVmlkZW9cIiBvbmNsaWNrPSR7KGUpPT4gYWRqdXN0TWVkaWEoZSwgKzEpfSBzdHlsZT1cIiR7c2hvd05leHRCdG4gPyAnJyA6ICdkaXNwbGF5OiBub25lJ31cIj4ke1wiPlwifTwvYnV0dG9uPlxuICAgIDwvZGl2PmBcbiAgfVxuXG4gIC8vIGJ1aWxkIGEgZnVsbHkgcG9wdWxhdGVkIHNlYXJjaCByZXN1bHQgaHRtbCB0aGluZ29cbiAgdG9Qb3B1bGF0ZWRIVE1MKCkge1xuICAgIGxldCBjb21wb25lbnQgPSBodG1sYFxuICAgIDxhIGNsYXNzPVwicmVzdWx0ICR7dGhpcy5nZXRXYXJuaW5ncygpLm1hcCh4ID0+IHgudHlwZSkuam9pbignICcpfVwiIGhyZWY9XCIke3RoaXMucmVzdWx0Lmxpbmt9XCIgcmVmZXJyZXJwb2xpY3k9XCJvcmlnaW5cIiByZWw9XCJleHRlcm5hbFwiIGlkPVwiJHt0aGlzLnRvSUQoKX1cIiBhcmlhLWxhYmVsbGVkYnk9XCIke3RoaXMudG9JRCgna2V5d29yZHMnKX1cIiByb2xlPWxpbms+XG4gICAgICAke3RoaXMudG9NZWRpYVZpZXdlcigpfVxuICAgICAgPGgyIGNsYXNzPVwia2V5d29yZHNcIiBpZD1cIiR7dGhpcy50b0lEKCdrZXl3b3JkcycpfVwiPiR7dGhpcy5yZXN1bHQudGl0bGUgfHwgdGhpcy5yZXN1bHQua2V5d29yZHMuam9pbignLCAnKX08L2gyPlxuICAgICAgPGNpdGUgY2xhc3M9XCJsaW5rXCI+JHt0aGlzLnJlc3VsdC5saW5rfTwvY2l0ZT5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0YWdzXCI+JHt0aGlzLnJlc3VsdC50YWdzLm1hcCh4ID0+IGAjJHt4fWApLmpvaW4oJyAnKX08L2Rpdj5cbiAgICAgICR7dGhpcy5nZXRXYXJuaW5ncygpLm1hcCh3YXJuaW5nID0+IGh0bWxgPGRpdiBjbGFzcz1cImFsZXJ0ICR7d2FybmluZy50eXBlfVwiPiR7d2FybmluZy50ZXh0fTwvZGl2PmApfVxuICAgICAgPGRpdiBjbGFzcz1cIm1pbmlfZGVmXCI+JHt0aGlzLnJlc3VsdC5ib2R5fTwvZGl2PlxuICAgIDwvYT5gXG4gICAgcmV0dXJuIGNvbXBvbmVudFxuICB9XG5cbiAgdG9QbGFjZWhvbGRlckhUTUwoKSB7XG4gICAgcmV0dXJuIGh0bWxgPGEgY2xhc3M9XCJyZXN1bHQgcGxhY2Vob2xkZXIgJHt0aGlzLmdldFdhcm5pbmdzKCkubWFwKHggPT4geC50eXBlKS5qb2luKCcgJyl9XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9hPmBcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaFJlc3VsdFBhbmVsIiwiLy8gVGhpcyBjbGFzcyByZXByZXNlbnRzIGFuIGVudHJ5IGluIHRoZSBzZWFyY2ggaW5kZXhcbi8vIGl0IHByb3ZpZGVzIGFjY2VzcyB0byBldmVyeXRoaW5nIHRoZSBzZWFyY2ggaW5kZXggZW5jb2RlcywgYW5kIGNhbiBsb2FkIGluIHRoZSBzZWFyY2ggZGVmaW5pdGlvbiBkYXRhXG5cbmNsYXNzIFNlYXJjaERlZmluaXRpb24ge1xuICAvLyBhY2NlcHRzIGEgZmV0Y2ggZnVuY3Rpb24sIGEgdGFnIGxpc3QsIGFuZCBhIHdvcmQgbGlzdFxuICBjb25zdHJ1Y3Rvcih7IHRpdGxlLCBrZXl3b3JkcywgdGFncywgbGluaywgbWVkaWEsIGJvZHksIHByb3ZpZGVyLCBpZCB9ID0ge30pIHtcbiAgICB0aGlzLnRpdGxlID0gdGl0bGUgfHwgbnVsbFxuICAgIHRoaXMua2V5d29yZHMgPSBrZXl3b3JkcyB8fCBbXVxuICAgIHRoaXMudGFncyA9IHRhZ3MgfHwgW11cbiAgICB0aGlzLmxpbmsgPSBsaW5rIHx8IG51bGxcbiAgICB0aGlzLm1lZGlhID0gbWVkaWEgfHwgW11cbiAgICB0aGlzLmJvZHkgPSBib2R5IHx8IG51bGxcbiAgICB0aGlzLnByb3ZpZGVyID0gcHJvdmlkZXIgfHwgbnVsbFxuICAgIHRoaXMuaWQgPSBpZCB8fCBudWxsXG4gIH1cblxuICBnZXQgdXJpKCkge1xuICAgIHJldHVybiBgJHt0aGlzLnByb3ZpZGVyIHx8ICd1bmtub3duJ306JHt0aGlzLmlkIHx8IHRoaXMubGluayB8fCAndW5rbm93bid9YFxuICB9XG5cbiAgaW5zcGVjdCgpIHtcbiAgICByZXR1cm4gYDwke3RoaXMuY29uc3RydWN0b3IubmFtZX0gWyR7dXJpfV06ICR7dGhpcy50aXRsZSB8fCB0aGlzLmtleXdvcmRzLmpvaW4oJywgJyl9PmBcbiAgfVxuXG4gIHRvSlNPTigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGU6IHRoaXMudGl0bGUsXG4gICAgICBrZXl3b3JkczogdGhpcy5rZXl3b3JkcyxcbiAgICAgIHRhZ3M6IHRoaXMudGFncyxcbiAgICAgIGxpbms6IHRoaXMubGluayxcbiAgICAgIG1lZGlhOiB0aGlzLm1lZGlhLFxuICAgICAgYm9keTogdGhpcy5ib2R5LFxuICAgICAgcHJvdmlkZXI6IHRoaXMucHJvdmlkZXIsXG4gICAgICBpZDogdGhpcy5pZFxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaERlZmluaXRpb24iLCIvLyBTZWFyY2hMaWJyYXJ5IHNldHVwIGJ5IGRlZmF1bHQgd2l0aCBXZWIgQVBJJ3MgaG9va2VkIHVwIGZvciByZWFkIG9ubHkgc2VhcmNoIGxpYnJhcnkgYWNjZXNzXG5jb25zdCBTZWFyY2hMaWJyYXJ5ID0gcmVxdWlyZSgnLi9saWJyYXJ5JylcbmNvbnN0IGZzdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKVxuXG5jbGFzcyBTZWFyY2hMaWJyYXJ5V2ViIGV4dGVuZHMgU2VhcmNoTGlicmFyeSB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgIHN1cGVyKHtcbiAgICAgIGZzOiB7IHJlYWRGaWxlOiBmc3V0aWwuZmV0Y2hMaWtlRmlsZSB9LFxuICAgICAgLi4uY29uZmlnXG4gICAgfSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaExpYnJhcnlXZWIiLCIvLyBTZWFyY2ggSW5kZXggdjQgZm9ybWF0XG4vLyBpbXBsZW1lbnRzIGJvdGggcmVhZCBhbmQgd3JpdGUgZnVuY3Rpb25hbGl0eVxuY29uc3QgU2VhcmNoUmVzdWx0RGVmaW5pdGlvbiA9IHJlcXVpcmUoJy4vcmVzdWx0LWRlZmluaXRpb24nKVxuY29uc3QgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKVxuY29uc3QgVlUgPSByZXF1aXJlKCcuLi92ZWN0b3ItdXRpbGl0aWVzJylcbmNvbnN0IGNib3IgPSByZXF1aXJlKCdib3JjJylcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpXG5cbmNsYXNzIFNlYXJjaExpYnJhcnkge1xuICAvLyBCdWlsZCBhIFNlYXJjaExpYnJhcnkgaW50ZXJmYWNlXG4gIC8vIGNvbmZpZyBvYmplY3Qgc2hvdWxkIGF0IGxlYXN0IGNvbnRhaW46XG4gIC8vICAgZnM6IGFuIG9iamVjdCwgd2hpY2ggaXMgYSBwcm9taXNpZmllZCB2ZXJzaW9uIG9mIG5vZGUncyBmcyAoZS5nLiBmcy1leHRyYSBwYWNrYWdlKSwgb3IgYXQgbGVhc3QgYSByZWFkRmlsZSBmdW5jdGlvbiBmb3IgY2xpZW50IHNpZGUgd2ViIHVzZVxuICAvLyAgIHBhdGg6IHBhdGggdG8gdGhlIGZvbGRlciBpbiB3aGljaCB0aGUgc2VhcmNoIGxpYnJhcnkgd2lsbCBiZSByZWFkIG9yIGJ1aWx0XG4gIC8vIGlmIHlvdSBhcmUgdXNpbmcgd29yZCB2ZWN0b3Igc2VhcmNoaW5nICh5b3Ugc2hvdWxkISEpIHlvdSB3aWxsIGFsc28gbmVlZFxuICAvLyAgIHZlY3RvckxpYnJhcnk6IGFuIG9wZW4gaW5zdGFuY2Ugb2YgLi4vdmVjdG9yLWxpYnJhcnkvcmVhZGVyLmpzLCBiYWNrZWQgYnkgYSBzdWl0YWJsZSB3b3JkIHZlY3RvciBkYXRhc2V0ICh0aGlzIGNhbiBiZSBnZW5lcmF0ZWQgZnJvbSBmYXN0dGV4dCB1c2luZyB1dGlsaXRpZXMgaW4gL3Rvb2xzKVxuICAvLyBmb3Igc2VydmVyIHNpZGUgaW5kZXggYnVpbGRpbmcsIHlvdSdsbCBhbHNvIG5lZWQgdG8gcHJvdmlkZTpcbiAgLy8gICBtZWRpYUNhY2hlOiBhbiBvYmplY3Qgd2hpY2ggcmVzcG9uZHMgdG8gdGhlIGludGVyZmFjZSBvZiAuL21lZGlhLWNhY2hlLmpzLCB3aGljaCBjYW4gdHJhbnNjb2RlLCBjYWNoZSwgYW5kIGdpdmUgb3V0IHJlbGF0aXZlIHBhdGhzIHRvIGVuY29kZWQgdmlkZW8gZmlsZXNcbiAgLy8gICBtZWRpYUZvcm1hdHM6IGFuIGFycmF5LCBjb250YWluaW5nIGluaXRpYWxpemVkIG1lZGlhIGVuY29kZXJzLCBpbXBsZW1lbnRpbmcgdGhlIGludGVyZmFjZSBmb3VuZCBpbiBtZWRpYS1mb3JtYXQtaGFuZGJyYWtlLmpzXG4gIGNvbnN0cnVjdG9yKGNvbmZpZyA9IHt9KSB7XG4gICAgLy8gc2VhcmNoIGluZGV4IGRhdGEsIGNvbnRhaW5zIGEgbGlzdCBvZiBkZWZpbml0aW9uc1xuICAgIHRoaXMuaW5kZXggPSBbXVxuICAgIC8vIGRlZmF1bHQgc2V0dGluZ3MgLSB0aGlzIGRhdGEgaXMgd3JpdHRlbiBpbiB0byB0aGUgc2VhcmNoIGluZGV4IGFuZCBjb250cm9scyBwYXJzaW5nXG4gICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgIHZlcnNpb246IDQsXG4gICAgICB2ZWN0b3JCaXRzOiA4LFxuICAgICAgdmVjdG9yU2l6ZTogMzAwLFxuICAgICAgdmVjdG9yU2NhbGluZzogMCwgLy8gdGhpcyBpcyBhdXRvbWF0aWNhbGx5IGNhbGN1bGF0ZWQgaW4gdGhlIHNhdmUoKSBzdGVwXG4gICAgICBidWlsZFRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgIG1lZGlhU2V0czogW10sXG4gICAgICBidWlsZElEOiBEYXRlLm5vdygpLFxuICAgIH1cbiAgICAvLyBvdmVycmlkZSBkZWZhdWx0cyB3aXRoIGFueSBjb25maWd1ZWQgb3B0aW9ucyB3aXRoIG1hdGNoaW5nIGtleXNcbiAgICBPYmplY3Qua2V5cyh0aGlzLnNldHRpbmdzKS5tYXAoIGtleSA9PiB0aGlzLnNldHRpbmdzW2tleV0gPSBjb25maWdba2V5XSB8fCB0aGlzLnNldHRpbmdzW2tleV0gKVxuXG4gICAgLy8gc2V0dXAgbWVkaWFTZXRzIGRhdGFcbiAgICB0aGlzLnNldHRpbmdzLm1lZGlhU2V0cyA9IChjb25maWcubWVkaWFGb3JtYXRzIHx8IFtdKS5tYXAoeCA9PiB4LmdldE1lZGlhSW5mbygpKVxuXG4gICAgLy8gY29uZmlnIG9iamVjdCBzdG9yZXMgYW55IGV4dHJhIHN0dWZmIHRvb1xuICAgIHRoaXMuY29uZmlnID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBkZWZpbml0aW9uc1BlclNoYXJkOiA1MCwgLy8gZGVmYXVsdFxuICAgIH0sIGNvbmZpZylcbiAgICB0aGlzLnBhdGggPSBjb25maWcucGF0aFxuICAgIGFzc2VydCh0aGlzLnBhdGgsIFwicGF0aCBvcHRpb24gaXMgbm90IG9wdGlvbmFsXCIpIC8vIHZlcmlmeSBhIHBhdGggd2FzIHN1cHBsaWVkXG4gICAgdGhpcy5sb2cgPSBjb25maWcubG9nIHx8ICh0ZXh0ID0+IGNvbnNvbGUubG9nKHRleHQpKVxuICB9XG5cbiAgLy8gb3BlbiBhIHNlYXJjaCBpbmRleCwgbG9hZGluZyBhbGwgc2VhcmNoIHJlc3VsdHMgaW4gdG8gbWVtb3J5LiBUaGV5IGNhbiB0aGVuIGJlIG1vZGlmaWVkIGFuZCBAc2F2ZShwYXRoKSBjYW4gYmUgdXNlZCB0byB3cml0ZSBvdXQgdGhlIG1vZGlmaWVkIHZlcnNpb25cbiAgYXN5bmMgbG9hZEV2ZXJ5dGhpbmcoKSB7XG4gICAgYXdhaXQgdGhpcy5vcGVuKHRoaXMucGF0aClcblxuICAgIC8vIHByZWZldGNoIGFsbCB0aGUgZGVmaW5pdGlvbnMgdG9vXG4gICAgZm9yIChsZXQgcmVzdWx0IG9mIHRoaXMuaW5kZXgpIHtcbiAgICAgIGF3YWl0IHJlc3VsdC5mZXRjaCgpXG4gICAgfVxuICB9XG5cbiAgXG4gIC8vIG9wZW4gYSBzZWFyY2ggaW5kZXggYXQgYSBjZXJ0YWluIHBhdGgsIHRoaXMgc2hvdWxkIGJlIHRoZSBwYXRoIHRvIHRoZSByb290IGRpcmVjdG9yeSwgd2l0aG91dCBhIHRyYWlsaW5nIHNsYXNoXG4gIGFzeW5jIG9wZW4oKSB7XG4gICAgLy8gZGVjb2RlIHRoZSBzZWFyY2ggaW5kZXggZGF0YSB1c2luZyBjYm9yXG4gICAgbGV0IGRhdGEgPSBjYm9yLmRlY29kZShhd2FpdCB0aGlzLmNvbmZpZy5mcy5yZWFkRmlsZShgJHt0aGlzLnBhdGh9L2luZGV4LmNib3JgKSlcblxuICAgIC8vIGNvcHkgaW4gdGhlIHNldHRpbmdzIG9iamVjdFxuICAgIGFzc2VydC5lcXVhbChkYXRhLnNldHRpbmdzLnZlcnNpb24sIDQpXG4gICAgdGhpcy5zZXR0aW5ncyA9IGRhdGEuc2V0dGluZ3NcblxuICAgIC8vIGltcG9ydCB0aGUgc3ltYm9scywgY29udmVydGluZyBidWZmZXJzIGluIHRvIHZlY3RvcnNcbiAgICBsZXQgc3ltYm9scyA9IGRhdGEuc3ltYm9scy5tYXAodmFsdWUgPT4ge1xuICAgICAgaWYgKHR5cGVvZih2YWx1ZSkgPT0gJ3N0cmluZycpIHsgLy8gc3RyaW5ncyBhcmUganVzdCBpbXBvcnRlZCBkaXJlY3RseVxuICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgIH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSkgeyAvLyBkZWNvZGUgYSB2ZWN0b3JcbiAgICAgICAgbGV0IGZsb2F0cyA9IFV0aWwudW5wYWNrRmxvYXRzKHZhbHVlLCB0aGlzLnNldHRpbmdzLnZlY3RvckJpdHMsIHRoaXMuc2V0dGluZ3MudmVjdG9yU2l6ZSlcbiAgICAgICAgcmV0dXJuIGZsb2F0cy5tYXAoZiA9PiBmICogdGhpcy5zZXR0aW5ncy52ZWN0b3JTY2FsaW5nKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICAvLyBkZWNvZGUgdGhlIHNlYXJjaCBpbmRleCBzdHJ1Y3R1cmVcbiAgICB0aGlzLmluZGV4ID0gW11cbiAgICAvLyB0aGUgcm9vdCBpcyBhIG1hcCB3aXRoIGFycmF5cyBvZiB0YWcgc3ltYm9scyBhcyBrZXlzIGFuZCBhcnJheXMgb2YgZW50cmllcyBhcyB2YWx1ZXNcbiAgICBmb3IgKGxldCBbdGFnU3ltYm9scywgZW50cmllc10gb2YgZGF0YS5pbmRleCkge1xuICAgICAgbGV0IHRhZ3MgPSB0YWdTeW1ib2xzLm1hcChpbmRleCA9PiBzeW1ib2xzW2luZGV4XSlcbiAgICAgIC8vIGZvciBlYWNoIGVudHJ5IGluIHRoZSB0YWcgbGlzdCwgd2UgZ2V0IGEgbnVtYmVyIG9mIGRlZmluaXRpb25zIGFzc29jaWF0ZWQgd2l0aCBhIHRlcm0gbGlzdFxuICAgICAgZm9yIChsZXQgW3Rlcm1TeW1ib2xzLCBkZWZpbml0aW9uUGF0aHNdIG9mIGVudHJpZXMpIHtcbiAgICAgICAgbGV0IHRlcm1zID0gdGVybVN5bWJvbHMubWFwKGluZGV4ID0+IHN5bWJvbHNbaW5kZXhdKVxuICAgICAgICAvLyBjcmVhdGUgc2VhcmNoIHJlc3VsdCBlbnRyaWVzIGluIHRoZSBpbmRleCBmb3IgZXZlcnkgZGVmaW5pdGlvbiBiZWhpbmQgdGhpcyBjb21iaW5hdGlvbiBvZiB0YWdzIGFuZCB0ZXJtc1xuICAgICAgICBsZXQgdGVybURpdmVyc2l0eSA9IE1hdGgubWF4KC4uLlZVLmRpdmVyc2l0eSguLi50ZXJtcy5maWx0ZXIoeCA9PiBBcnJheS5pc0FycmF5KHgpKSkpXG4gICAgICAgIFV0aWwuY2h1bmsoZGVmaW5pdGlvblBhdGhzLCAyKS5mb3JFYWNoKChkZWZpbml0aW9uUGF0aCkgPT4ge1xuICAgICAgICAgIHRoaXMuaW5kZXgucHVzaChuZXcgU2VhcmNoUmVzdWx0RGVmaW5pdGlvbih7XG4gICAgICAgICAgICBsaWJyYXJ5OiB0aGlzLCBkZWZpbml0aW9uUGF0aCwgdGFncywgdGVybXMsIHRlcm1EaXZlcnNpdHlcbiAgICAgICAgICB9KSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuXG4gIC8vIGFjY2VwdHMgYSBTZWFyY2hEZWZpbml0aW9uIGluc3RhbmNlIChzZWUgLi9kZWZpbml0aW9uLmpzKVxuICAvLyBhcHBlbmRzIHRoZSBzZWFyY2ggZGVmaW5pdGlvbiB0byB0aGUgc2VhcmNoIGluZGV4XG4gIGFzeW5jIGFkZERlZmluaXRpb24oZGVmaW5pdGlvbikge1xuICAgIGxldCBkYXRhID0gKGRlZmluaXRpb24udG9KU09OICYmIGRlZmluaXRpb24udG9KU09OKCkpIHx8IGRlZmluaXRpb25cbiAgICBsZXQgdGVybXMgPSBkYXRhLmtleXdvcmRzXG4gICAgaWYgKHRoaXMuY29uZmlnLmNsZWFudXBLZXl3b3Jkcykge1xuICAgICAgdGVybXMgPSB0ZXJtcy5tYXAoa2V5d29yZCA9PiB7XG4gICAgICAgIC8vIGNsZWFuIHVwIGtleXdvcmRzIGEgYml0XG4gICAgICAgIGxldCBjbGVhbmVkV29yZCA9IGtleXdvcmQudHJpbSgpLnJlcGxhY2UoL+KAmC9nLCBcIidcIilcbiAgICAgICAgLy8gaWYgaXQncyBub3QgYWxsIGNhcHMgbGlrZSBhbiBhY3JvbnltLCBsb3dlcmNhc2UgaXRcbiAgICAgICAgaWYgKGNsZWFuZWRXb3JkLm1hdGNoKC9bYS16XS8pIHx8IGNsZWFuZWRXb3JkLmxlbmd0aCA8IDIpIGNsZWFuZWRXb3JkID0gY2xlYW5lZFdvcmQudG9Mb3dlckNhc2UoKVxuICAgICAgICByZXR1cm4gY2xlYW5lZFdvcmRcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gdHJhbnNsYXRlIGtleXdvcmRzIGluIHRvIHZlY3RvcnMgd2hlcmUgcG9zc2libGVcbiAgICB0ZXJtcyA9IGF3YWl0IFByb21pc2UuYWxsKHRlcm1zLm1hcChhc3luYyBrZXl3b3JkID0+ICh0aGlzLmNvbmZpZy52ZWN0b3JMaWJyYXJ5ICYmIGF3YWl0IHRoaXMuY29uZmlnLnZlY3RvckxpYnJhcnkubG9va3VwKGtleXdvcmQpKSB8fCBrZXl3b3JkKSlcbiAgICBcbiAgICAvLyBlbmNvZGUgYW5kIGNhY2hlIGFueSB1bmNhY2hlZCBtZWRpYVxuICAgIGxldCBtZWRpYSA9IFtdXG4gICAgZm9yIChsZXQgbWVkaWFJdGVtIG9mIGRhdGEubWVkaWEpIHtcbiAgICAgIGxldCBjYXBhYmxlRW5jb2RlcnMgPSB0aGlzLmNvbmZpZy5tZWRpYUZvcm1hdHMuZmlsdGVyKGZvcm1hdCA9PiBmb3JtYXQuYWNjZXB0cyhtZWRpYUl0ZW0uZ2V0RXh0ZW5zaW9uKCkpKVxuICAgICAgbGV0IHZlcnNpb25zID0ge31cbiAgICAgIGZvciAobGV0IGVuY29kZXIgb2YgY2FwYWJsZUVuY29kZXJzKSB7XG4gICAgICAgIHZlcnNpb25zW2VuY29kZXIuZ2V0TWVkaWFJbmZvKCkuZXh0ZW5zaW9uXSA9IGF3YWl0IHRoaXMuY29uZmlnLm1lZGlhQ2FjaGUuY2FjaGUoeyBtZWRpYTogbWVkaWFJdGVtLCBmb3JtYXQ6IGVuY29kZXIgfSlcbiAgICAgIH1cbiAgICAgIGlmIChjYXBhYmxlRW5jb2RlcnMubGVuZ3RoID4gMCkgbWVkaWEucHVzaCh2ZXJzaW9ucylcbiAgICB9XG5cbiAgICAvLyBidWlsZCB0aGUgc2VhcmNoIGRlZmluaXRpb24gb2JqZWN0XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBTZWFyY2hSZXN1bHREZWZpbml0aW9uKE9iamVjdC5hc3NpZ24oZGF0YSwge1xuICAgICAgbGlicmFyeTogdGhpcywgdGVybXMsXG4gICAgICB0ZXJtRGl2ZXJzaXR5OiBNYXRoLm1heCguLi5WVS5kaXZlcnNpdHkoLi4udGVybXMuZmlsdGVyKHggPT4gQXJyYXkuaXNBcnJheSh4KSkpKSxcbiAgICAgIG1lZGlhLCBwcmVsb2FkZWQ6IHRydWUsXG4gICAgfSkpXG5cbiAgICAvLyBhZGQgdGhlIHNlYXJjaCByZXN1bHQgZGVmaW5pdGlvbiB0byBvdXIgaW5kZXhcbiAgICB0aGlzLmluZGV4LnB1c2gocmVzdWx0KVxuICB9XG5cblxuXG4gIC8vIHF1ZXJ5IHRoZSBzZWFyY2ggaW5kZXhcbiAgLy8gZmlsdGVyRm4gd2lsbCBiZSBjYWxsZWQgZm9yIGV2ZXJ5IHNlYXJjaCByZXN1bHQgaW4gdGhlIGluZGV4LCBhbmQgc2hvdWxkIHJldHVybiBhIG51bWJlciwgb3IgZmFsc2VcbiAgLy8gd2hlbiBmaWx0ZXJGbihyZXN1bHQpIHJldHVybnMgZmFsc2UsIHRoZSBzZWFyY2ggcmVzdWx0IHdvbnQgYmUgaW5jbHVkZWQgaW4gdGhlIG91dHB1dFxuICAvLyB3aGVuIGZpbHRlckZuKHJlc3VsdCkgcmV0dXJucyBhIG51bWJlciwgaXQgd2lsbCBiZSB0cmVhdGVkIGFzIGEgcmFuaywgYW5kIHRoZSByZXN1bHRzIHdpbGwgYmUgc29ydGVkIGFjY29yZGluZyB0byB0aGlzIHJhbmssIHdpdGhcbiAgLy8gbG93ZXIgbnVtYmVycyBhdCB0aGUgdG9wIG9mIHRoZSBsaXN0XG4gIC8vIE5vdGU6IHF1ZXJ5IGNoZWNrcyBpZiB0aGUgaW5kZXggaGFzIGJlZW4gbW9kaWZpZWQsIGJ5IHN0YXRpbmcgdGhlIGluZGV4IGZpbGUsIGFuZCB3aWxsIHJlbG9hZCB0aGUgaW5kZXggaWYgdGhlIGRhdGFzZXQgaGFzIGJlZW5cbiAgLy8gdXBkYXRlZCwgc28gaXQgd2lsbCBvZnRlbiByZXR1cm4gcXVpY2tseSwgYnV0IG1heSByZXR1cm4gc2xvd2x5IGlmIHRoZSBpbmRleCBuZWVkcyB0byBiZSByZWxvYWRlZC5cbiAgLy8gWW91ciBVSSBzaG91bGQgZGlzcGxheSBhIG5vdGljZSB0byB0aGUgdXNlciBpZiBxdWVyeSBpcyB0YWtpbmcgbW9yZSB0aGFuIGEgbW9tZW50IHRvIHJlc29sdmUsIGluZGljYXRpbmcgcmVzdWx0cyBhcmUgbG9hZGluZy5cbiAgYXN5bmMgcXVlcnkoZmlsdGVyRm4pIHtcbiAgICBsZXQgY3VycmVudEJ1aWxkSUQgPSBhd2FpdCB0aGlzLmNvbmZpZy5mcy5yZWFkRmlsZShgJHt0aGlzLnBhdGh9L2J1aWxkSUQudHh0YClcbiAgICBpZiAoY3VycmVudEJ1aWxkSUQudG9TdHJpbmcoKSAhPSB0aGlzLnNldHRpbmdzLmJ1aWxkSUQudG9TdHJpbmcoKSkge1xuICAgICAgLy8gd2UgbmVlZCB0byByZWxvYWRcbiAgICAgIHRoaXMubG9nKGBSZWxvYWRpbmcgZGF0YXNldCBiZWNhdXNlIGRhdGFzZXQgYnVpbGRJRCBpcyAke2N1cnJlbnRCdWlsZElEfSBidXQgbG9jYWxseSBsb2FkZWQgZGF0YXNldCBpcyAke3RoaXMuc2V0dGluZ3MuYnVpbGRJRH1gKVxuICAgICAgYXdhaXQgdGhpcy5sb2FkKClcbiAgICB9XG5cbiAgICAvLyBjYWxsIGZpbHRlckZuIG9uIGEgcmVmZXJlbmNlIGNvcHkgb2YgdGhlIHNlYXJjaCByZXN1bHRzLCBzdG9yaW5nIHJhbmsgdG8gLmRpc3RhbmNlIHByb3BlcnR5XG4gICAgcmV0dXJuIHRoaXMuaW5kZXgubWFwKChyZXN1bHQpID0+IHtcbiAgICAgIGxldCByYW5rZWRSZXN1bHQgPSBPYmplY3QuY3JlYXRlKHJlc3VsdClcbiAgICAgIHJhbmtlZFJlc3VsdC5kaXN0YW5jZSA9IGZpbHRlckZuKHJlc3VsdClcbiAgICAgIHJldHVybiByYW5rZWRSZXN1bHRcbiAgICB9KS5maWx0ZXIocmFua2VkUmVzdWx0ID0+XG4gICAgICAvLyBmaWx0ZXIgb3V0IGFueSByZXN1bHRzIHRoYXQgZGlkbid0IHJldHVybiBhIE51bWJlclxuICAgICAgdHlwZW9mKHJhbmtlZFJlc3VsdC5kaXN0YW5jZSkgPT0gJ251bWJlcidcbiAgICApLnNvcnQoKGEsYik9PlxuICAgICAgLy8gc29ydCByZXN1bHRzIGJhc2VkIG9uIGRpc3RhbmNlIHJhbmtpbmdcbiAgICAgIGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlXG4gICAgKVxuICB9XG5cblxuXG4gIC8vIHdyaXRlIGV2ZXJ5dGhpbmcgb3V0IHRvIHRoZSBmaWxlc3lzdGVtXG4gIGFzeW5jIHNhdmUoKSB7XG4gICAgLy8gU3ltYm9sIHRhYmxlIGJ1aWxkZXI6XG4gICAgbGV0IHN5bWJvbHMgPSBbXVxuICAgIGxldCBzeW1ib2xzTG9va3VwID0ge31cbiAgICAvLyBzeW1ib2wgZ2V0dGVyOiBhY2NlcHRzIGEgc3RyaW5nLCBvciBhcnJheSBvZiB0aGlzLnNldHRpbmdzLnZlY3RvclNpemUgZmxvYXRzLCBhbmQgcmV0dXJucyBhbiBpbnRlZ2VyIGluZGV4XG4gICAgbGV0IHN5bWJvbCA9IChkYXRhKT0+IHtcbiAgICAgIGxldCBsb29rdXBLZXkgPSBKU09OLnN0cmluZ2lmeShkYXRhKVxuICAgICAgaWYgKHN5bWJvbHNMb29rdXBbbG9va3VwS2V5XSkgcmV0dXJuIHN5bWJvbHNMb29rdXBbbG9va3VwS2V5XVxuXG4gICAgICAvLyBhZGQgdGhpcyBzeW1ib2wgdG8gdGhlIHN5bWJvbCB0YWJsZVxuICAgICAgbGV0IHN5bWJvbEluZGV4ID0gc3ltYm9scy5sZW5ndGhcbiAgICAgIC8vIHNjYWxlIHZlY3RvcnMgZG93blxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgbGV0IGZsb2F0cyA9IFV0aWwucGFja0Zsb2F0cyhkYXRhLm1hcCh4ID0+IHggLyB0aGlzLnNldHRpbmdzLnZlY3RvclNjYWxpbmcpLCB0aGlzLnNldHRpbmdzLnZlY3RvckJpdHMsIHRoaXMuc2V0dGluZ3MudmVjdG9yU2l6ZSlcbiAgICAgICAgc3ltYm9scy5wdXNoKEJ1ZmZlci5mcm9tKGZsb2F0cykpXG4gICAgICB9IGVsc2UgeyAvLyBzdHJpbmdzIGp1c3QgZ28gaW4gYXMgcmVndWxhciBzdHJpbmdzXG4gICAgICAgIHN5bWJvbHMucHVzaChkYXRhLnRvU3RyaW5nKCkpXG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHJldHVybiB0aGUgaW5kZXggbnVtYmVyIG9mIHRoZSBzeW1ib2wsIGFuZCBjYWNoZSB0aGlzIGFuc3dlciBmb3IgbGF0ZXJcbiAgICAgIHJldHVybiBzeW1ib2xzTG9va3VwW2xvb2t1cEtleV0gPSBzeW1ib2xJbmRleFxuICAgIH1cblxuICAgIC8vIGZpZ3VyZSBvdXQgb3VyIGlkZWFsIHNjYWxpbmcgZmFjdG9yIGlmIHdlJ3JlIGJ1aWxkaW5nIHdpdGggdmVjdG9yc1xuICAgIGlmICh0aGlzLmNvbmZpZy52ZWN0b3JMaWJyYXJ5KSB7XG4gICAgICB0aGlzLnNldHRpbmdzLnZlY3RvclNjYWxpbmcgPSAwXG4gICAgICBmb3IgKGxldCBkZWZpbml0aW9uIG9mIHRoaXMuaW5kZXgpIHtcbiAgICAgICAgbGV0IHZlY3RvcnMgPSBkZWZpbml0aW9uLnRlcm1zLmZpbHRlcih4ID0+IHR5cGVvZih4KSAhPT0gJ3N0cmluZycpXG4gICAgICAgIGlmICh2ZWN0b3JzLmxlbmd0aCA8IDEpIGNvbnRpbnVlXG4gICAgICAgIGxldCBsb2NhbFNjYWxpbmcgPSBNYXRoLm1heCguLi4odmVjdG9ycy5mbGF0KCkubWFwKE1hdGguYWJzKSkpXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnZlY3RvclNjYWxpbmcgPCBsb2NhbFNjYWxpbmcpIHtcbiAgICAgICAgICB0aGlzLnNldHRpbmdzLnZlY3RvclNjYWxpbmcgPSBsb2NhbFNjYWxpbmdcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGdlbmVyYXRpbmcgc2hhcmRzIGRhdGEsIHNjb3BlZCB0byBhIGJsb2NrIHRvIG1hbmFnZSBtZW1vcnkgYmV0dGVyXG4gICAgbGV0IGluZGV4ID0ge30gLy8gb2JqZWN0IGtleWVkIGJ5IHRhZyBsaXN0cyBpbiB0aGUgZm9ybSBcInN5bWJvbFxcbnN5bWJvbFxcbnN5bWJvbFwiIHdoZXJlIHN5bWJvbHMgYXJlIHNvcnRlZCBudW1iZXJzIGZyb20gc3ltYm9sKClcbiAgICB7XG4gICAgICAvLyBnZW5lcmF0ZSBzaGFyZHNcbiAgICAgIHRoaXMubG9nKGBXcml0aW5nIGNvbnRlbnQgb3V0IHRvIHNoYXJkIGZpbGVzYClcbiAgICAgIGxldCBzaGFyZElEID0gMFxuICAgICAgZm9yIChsZXQgYmF0Y2ggb2YgVXRpbC5jaHVua0l0ZXJhYmxlKHRoaXMuaW5kZXgsIHRoaXMuY29uZmlnLmRlZmluaXRpb25zUGVyU2hhcmQpKSB7XG4gICAgICAgIGxldCBzaGFyZEFycmF5ID0gW11cbiAgICAgICAgYmF0Y2guZm9yRWFjaChkZWZpbml0aW9uID0+IHtcbiAgICAgICAgICAvLyBmZXRjaCBleGlzdGluZyBkZWZpbml0aW9uIGFycmF5IG9yIGNyZWF0ZSBhIG5ldyBvbmVcbiAgICAgICAgICBkZWZpbml0aW9uLl9kZWZpbml0aW9uUGF0aCA9IFtzaGFyZElELCBzaGFyZEFycmF5Lmxlbmd0aF1cbiAgICAgICAgICBzaGFyZEFycmF5LnB1c2goZGVmaW5pdGlvbi50b0pTT04oKSlcbiAgXG4gICAgICAgICAgLy8gYWRkIHRvIGluZGV4IGRhdGEgc3RydWN0dXJlXG4gICAgICAgICAgLy8gYnVpbGQgdGFnIGxpc3RcbiAgICAgICAgICBsZXQgdGFnTGlzdCA9IGRlZmluaXRpb24udGFncy5tYXAoc3ltYm9sKS5zb3J0KCkuam9pbignXFxuJylcbiAgICAgICAgICAvLyBmaW5kIG9yIGNyZWF0ZSB0YWcgZ3JvdXBcbiAgICAgICAgICBsZXQgaW5kZXhUYWdHcm91cCA9IGluZGV4W3RhZ0xpc3RdID0gaW5kZXhbdGFnTGlzdF0gfHwge31cbiAgICAgICAgICAvLyBmaW5kIG9yIGNyZWF0ZSBkZWZpbml0aW9uIGluZm8gJiBpbmNyZW1lbnQgbnVtYmVyIG9mIGRlZmluaXRpb25zXG4gICAgICAgICAgbGV0IHN5bWJvbExpc3QgPSBkZWZpbml0aW9uLnRlcm1zLm1hcChzeW1ib2wpLnNvcnQoKS5qb2luKCdcXG4nKVxuICAgICAgICAgIGluZGV4VGFnR3JvdXBbc3ltYm9sTGlzdF0gPSBbLi4uKGluZGV4VGFnR3JvdXBbc3ltYm9sTGlzdF0gfHwgW10pLCAuLi5kZWZpbml0aW9uLl9kZWZpbml0aW9uUGF0aF1cbiAgICAgICAgfSlcblxuICAgICAgICAvLyBjb252ZXJ0IGRlZmluaXRpb25zIHRvIGNib3JcbiAgICAgICAgbGV0IHNoYXJkQnVmZmVyID0gY2Jvci5lbmNvZGUoc2hhcmRBcnJheSlcbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuZnMuZW5zdXJlRGlyKGAke3RoaXMucGF0aH0vZGVmaW5pdGlvbnMvJHt0aGlzLnNldHRpbmdzLmJ1aWxkSUR9YClcbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuZnMud3JpdGVGaWxlKGAke3RoaXMucGF0aH0vZGVmaW5pdGlvbnMvJHt0aGlzLnNldHRpbmdzLmJ1aWxkSUR9LyR7c2hhcmRJRH0uY2JvcmAsIHNoYXJkQnVmZmVyKVxuICAgICAgICBpZiAodGhpcy5jb25maWcuZ3ppcCkgYXdhaXQgdGhpcy5jb25maWcuZnMud3JpdGVGaWxlKGAke3RoaXMucGF0aH0vZGVmaW5pdGlvbnMvJHt0aGlzLnNldHRpbmdzLmJ1aWxkSUR9LyR7c2hhcmRJRH0uY2Jvci5nemAsIGF3YWl0IHRoaXMuY29uZmlnLmd6aXAoc2hhcmRCdWZmZXIpKVxuICAgICAgICBzaGFyZElEICs9IDFcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB3cml0ZSBvdXQgdGhlIGluZGV4IGZpbGVcbiAgICB0aGlzLmxvZyhgRW5jb2RpbmcgYW5kIHdyaXRpbmcgaW5kZXguLi5gKVxuICAgIGxldCBpbmRleEJ1ZmZlciA9IGNib3IuZW5jb2RlKHtcbiAgICAgIHNldHRpbmdzOiB0aGlzLnNldHRpbmdzLFxuICAgICAgc3ltYm9scywgXG4gICAgICBpbmRleDogVXRpbC5vYmplY3RUb01hcChpbmRleCxcbiAgICAgICAga2V5ID0+IGtleS5zcGxpdCgnXFxuJykubWFwKHggPT4gcGFyc2VJbnQoeCkpLFxuICAgICAgICB0ZXJtT2JqZWN0ID0+IFV0aWwub2JqZWN0VG9NYXAodGVybU9iamVjdCxcbiAgICAgICAgICBrZXkgPT4ga2V5LnNwbGl0KCdcXG4nKS5tYXAoeCA9PiBwYXJzZUludCh4KSlcbiAgICAgICAgKVxuICAgICAgKSxcbiAgICB9KVxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmZzLndyaXRlRmlsZShgJHt0aGlzLnBhdGh9L2luZGV4LmNib3JgLCBpbmRleEJ1ZmZlcilcbiAgICBpZiAodGhpcy5jb25maWcuZ3ppcCkgYXdhaXQgdGhpcy5jb25maWcuZnMud3JpdGVGaWxlKGAke3RoaXMucGF0aH0vaW5kZXguY2Jvci5nemAsIGF3YWl0IHRoaXMuY29uZmlnLmd6aXAoaW5kZXhCdWZmZXIpKVxuXG4gICAgLy8gZ2VuZXJhdGUgdGhlIGJ1aWxkSUQgZmlsZSwgc28gY2xpZW50IHNpZGUgYXBwcyBjYW4gZWFzaWx5IGNoZWNrIGlmIHRoZSBpbmRleCB0aGV5IGhhdmUgbG9hZGVkIGlzIHVwIHRvIGRhdGVcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5mcy53cml0ZUZpbGUoYCR7dGhpcy5wYXRofS9idWlsZElELnR4dGAsIHRoaXMuc2V0dGluZ3MuYnVpbGRJRC50b1N0cmluZygpKVxuICB9XG5cblxuXG4gIC8vIGdhcmJhZ2UgY29sbGVjdGlvbiBvZiBvbGQgdW5uZWVkZWQgZmlsZXNcbiAgYXN5bmMgY2xlYW51cCgpIHtcbiAgICAvLyBjbGVhbiB1cCBvbGQgZGVmaW5pdGlvbnMgdGhhdCBhcmUgbm93IG9ic29sZXRlXG4gICAgbGV0IGJ1aWxkcyA9IGF3YWl0IHRoaXMuY29uZmlnLmZzLnJlYWRkaXIoYCR7dGhpcy5wYXRofS9kZWZpbml0aW9uc2ApXG4gICAgYnVpbGRzLmZvckVhY2goYnVpbGRJRCA9PiB7XG4gICAgICBpZiAoYnVpbGRJRCAhPT0gdGhpcy5zZXR0aW5ncy5idWlsZElEKSB0aGlzLmNvbmZpZy5mcy5yZW1vdmUoYCR7dGhpcy5wYXRofS9kZWZpbml0aW9ucy8ke2J1aWxkSUR9YClcbiAgICB9KVxuICAgIC8vIGNsZWFuIHVwIG9sZCBtZWRpYSBpbiB0aGUgY2FjaGUgdGhhdCBpcyBubyBsb25nZXIgcmVmZXJlbmNlZFxuICAgIGF3YWl0IHRoaXMubWVkaWFDYWNoZS5jbGVhbnVwKClcbiAgfVxuXG5cbiAgLy8vLy8gSW50ZXJuYWwgLy8vLy8vXG4gIC8vIGZldGNoZXMgYSBzaGFyZCBmaWxlLCBhbmQgbG9hZHMgaXQgaW4gdG8gYWxsIFNlYXJjaFJlc3VsdERlZmluaXRpb24gb2JqZWN0cyB3aGljaCBpdCBoYXMgZGF0YSBmb3JcbiAgYXN5bmMgX2ZldGNoRGVmaW5pdGlvbkRhdGEocmVzdWx0KSB7XG4gICAgLy8gY2FsY3VsYXRlIHVybCwgbG9hZCBzaGFyZCBmaWxlLCBkZWNvZGUgaXRcbiAgICBsZXQgc2hhcmRJRCA9IHJlc3VsdC5fZGVmaW5pdGlvblBhdGhbMF1cbiAgICBsZXQgc2hhcmRCdWZmZXIgPSBhd2FpdCB0aGlzLmNvbmZpZy5mcy5yZWFkRmlsZShgJHt0aGlzLnBhdGh9L2RlZmluaXRpb25zLyR7dGhpcy5zZXR0aW5ncy5idWlsZElEfS8ke3NoYXJkSUR9LmNib3JgKVxuICAgIGxldCBzaGFyZERhdGEgPSBjYm9yLmRlY29kZShzaGFyZEJ1ZmZlcilcbiAgICByZXR1cm4gc2hhcmREYXRhW3Jlc3VsdC5fZGVmaW5pdGlvblBhdGhbMV1dXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hMaWJyYXJ5IiwiLy8gUmVwcmVzZW50cyBhIHNlYXJjaCByZXN1bHQsIGFzIHJldHVybmVkIGJ5IFNlYXJjaExpYnJhcnlSZWFkZXJcbmNvbnN0IFNlYXJjaERlZmluaXRpb24gPSByZXF1aXJlKCcuL2RlZmluaXRpb24nKVxuY29uc3QgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKVxuXG5jbGFzcyBTZWFyY2hSZXN1bHREZWZpbml0aW9uIGV4dGVuZHMgU2VhcmNoRGVmaW5pdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHZhbHVlcyA9IHt9KSB7XG4gICAgc3VwZXIodmFsdWVzKVxuICAgIHRoaXMubGlicmFyeSA9IHZhbHVlcy5saWJyYXJ5XG4gICAgdGhpcy50ZXJtcyA9IHZhbHVlcy50ZXJtcyB8fCBbXVxuICAgIHRoaXMudGVybURpdmVyc2l0eSA9IHZhbHVlcy50ZXJtRGl2ZXJzaXR5IHx8IDBcbiAgICBpZiAodmFsdWVzLmhhc2gpIHtcbiAgICAgIHRoaXMuX2hhc2ggPSB2YWx1ZXMuaGFzaFxuICAgICAgdGhpcy5faGFzaFN0cmluZyA9IFV0aWwuYnl0ZXNUb0Jhc2UxNih2YWx1ZXMuaGFzaClcbiAgICB9XG4gICAgdGhpcy5fZGVmaW5pdGlvblBhdGggPSB2YWx1ZXMuZGVmaW5pdGlvblBhdGhcbiAgICB0aGlzLl9mZXRjaGVkID0gdmFsdWVzLnByZWxvYWRlZCB8fCBmYWxzZVxuICB9XG5cbiAgaXNGZXRjaGVkKCkgeyByZXR1cm4gdGhpcy5fZmV0Y2hlZCB9XG5cbiAgLy8gZmV0Y2hlcyBzZWFyY2ggcmVzdWx0IGRhdGEsIGlmIGl0J3Mgbm90IGFscmVhZHkgcG9wdWxhdGVkXG4gIC8vIHJldHVybnMgYSBwcm9taXNlIHJlc29sdmluZyB3aGVuIGl0IGxvYWRlZFxuICBhc3luYyBmZXRjaCgpIHtcbiAgICBpZiAodGhpcy5fZmV0Y2hlZCkgcmV0dXJuIHRoaXNcbiAgICAvLyBmZXRjaCB0aGUgZGF0YSwgYW5kIHN0b3JlIGl0IHRvIHRoZSBvcmlnaW5hbCBTZWFyY2hSZXN1bHREZWZpbml0aW9uIGluIHRoZSBwcm90b3R5cGVcbiAgICBsZXQgY2h1bmsgPSBhd2FpdCB0aGlzLmxpYnJhcnkuX2ZldGNoRGVmaW5pdGlvbkRhdGEodGhpcylcblxuICAgIHRoaXMudGl0bGUgICAgPSBjaHVuay50aXRsZVxuICAgIHRoaXMua2V5d29yZHMgPSBjaHVuay5rZXl3b3Jkc3NcbiAgICB0aGlzLnRhZ3MgICAgID0gY2h1bmsudGFnc1xuICAgIHRoaXMubGluayAgICAgPSBjaHVuay5saW5rXG4gICAgdGhpcy5ib2R5ICAgICA9IGNodW5rLmJvZHlcbiAgICB0aGlzLnByb3ZpZGVyID0gY2h1bmsucHJvdmlkZXJcbiAgICB0aGlzLmlkICAgICAgID0gY2h1bmsuaWQgfHwgY2h1bmsubGlua1xuICAgIC8vIGF1Z21lbnQgbWVkaWEgd2l0aCByaWNoIG9iamVjdCBpbmhlcnRpbmcgb3RoZXIgaW5mbyBmcm9tIHRoZSBzZWFyY2ggbGlicmFyeSdzIG1lZGlhU2V0cyBzZXR0aW5nLCBhbmQgYnVpbGRpbmcgdGhlIGZ1bGwgdmlkZW8gcGF0aCBhcyBhIHVybFxuICAgIHRoaXMubWVkaWEgICAgPSBjaHVuay5tZWRpYS5tYXAoZm9ybWF0cyA9PiBcbiAgICAgIE9iamVjdC5rZXlzKGZvcm1hdHMpLm1hcChleHRlbnNpb24gPT4gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKHRoaXMubGlicmFyeS5zZXR0aW5ncy5tZWRpYVNldHMuZmluZChtZWRpYSA9PiBtZWRpYS5leHRlbnNpb24gPT0gZXh0ZW5zaW9uKSB8fCB7fSksIHsgdXJsOiBgJHt0aGlzLmxpYnJhcnkuYmFzZVVSTH0vJHtmb3JtYXRzW2V4dGVuc2lvbl19YCB9KSApXG4gICAgKVxuXG4gICAgdGhpcy5fZmV0Y2hlZCA9IHRydWVcbiAgICByZXR1cm4gdGhpc1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2VhcmNoUmVzdWx0RGVmaW5pdGlvbiIsImNvbnN0IFNlYXJjaEVuZ2luZSA9IHJlcXVpcmUoJy4vc2VhcmNoLWVuZ2luZS9lbmdpbmUnKVxuY29uc3QgUmVzdWx0VmlldyA9IHJlcXVpcmUoJy4vc2VhcmNoLWVuZ2luZS92aWV3LXJlc3VsdCcpXG5jb25zdCBQYWdpbmF0b3IgPSByZXF1aXJlKCcuL3NlYXJjaC1lbmdpbmUvdmlldy1wYWdpbmF0b3InKVxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJ25hbm9odG1sJylcbmNvbnN0IG1vcnBoID0gcmVxdWlyZSgnbmFub21vcnBoJylcbmNvbnN0IHBhcnNlRHVyYXRpb24gPSByZXF1aXJlKCdwYXJzZS1kdXJhdGlvbicpXG5jb25zdCBkZWxheSA9IHJlcXVpcmUoJ2RlbGF5JylcblxuY29uc3QgcXMgPSAoLi4uYXJncyk9PiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKC4uLmFyZ3MpXG5jb25zdCBxc2EgPSAoLi4uYXJncyk9PiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKC4uLmFyZ3MpXG5cbmNsYXNzIEZpbmRTaWduVUkge1xuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgIHRoaXMuc2VhcmNoRW5naW5lID0gbmV3IFNlYXJjaEVuZ2luZShjb25maWcpXG4gICAgdGhpcy5fbGFzdFF1ZXJ5VGV4dCA9IG51bGwgLy8gc3RvcmUgbGFzdCBxdWVyeSB0byBhdm9pZCByZXJ1bm5pbmcgc2VhcmNoZXMgaWYgdGhleSdyZSBhbHJlYWR5IHVwIHRvIGRhdGVcbiAgfVxuXG4gIC8vIGxvYWQgZGF0YXNldHNcbiAgYXN5bmMgbG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLnNlYXJjaEVuZ2luZS5sb2FkKClcbiAgfVxuXG4gIC8vIHJldHVybnMgYSBwcm9taXNlLCB3aGljaCByZXNvbHZlcyB3aGVuIGRhdGEgaXMgbG9hZGVkIGFuZCBzZWFyY2ggZW5naW5lIGlzIGludGVyYWN0aXZlXG4gIGF3YWl0UmVhZHkoKSB7IHJldHVybiB0aGlzLnNlYXJjaEVuZ2luZS5hd2FpdFJlYWR5KCkgfVxuXG4gIGFzeW5jIGFkZEhvb2tzKCkge1xuICAgIHdpbmRvdy5vbmhhc2hjaGFuZ2UgPSAoKT0+IHRoaXMub25IYXNoQ2hhbmdlKGxvY2F0aW9uLmhhc2gucmVwbGFjZSgvXiMvLCAnJykpXG5cbiAgICBxcyh0aGlzLmNvbmZpZy5zZWFyY2hGb3JtKS5vbnN1Ym1pdCA9IGV2ZW50ID0+IHtcbiAgICAgIGxldCBxdWVyeVRleHQgPSBxcyh0aGlzLmNvbmZpZy5zZWFyY2hJbnB1dCkudmFsdWVcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGxvY2F0aW9uLmhyZWYgPSBgIyR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5VGV4dCl9LzBgXG4gICAgfVxuXG4gICAgaWYgKGxvY2F0aW9uLmhhc2ggIT0gJycgJiYgbG9jYXRpb24uaGFzaCAhPSAnIycpIHRoaXMub25IYXNoQ2hhbmdlKGxvY2F0aW9uLmhhc2gucmVwbGFjZSgvXiMvLCAnJykpXG4gIH1cblxuICBvbkhhc2hDaGFuZ2UoaGFzaCkge1xuICAgIGlmIChoYXNoID09ICcnKSB7XG4gICAgICB0aGlzLnJlbmRlckhvbWUoaGFzaClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZW5kZXJTZWFyY2goaGFzaClcbiAgICB9XG4gIH1cblxuICAvLyByZW5kZXIgaG9tZXBhZ2VcbiAgcmVuZGVySG9tZShoYXNoKSB7XG4gICAgbG9jYXRpb24uaGFzaCA9IFwiI1wiXG4gICAgcXMoJ2h0bWwgPiBib2R5JykuY2xhc3NOYW1lID0gJ2hvbWUnXG4gICAgcXModGhpcy5jb25maWcucmVzdWx0c0NvbnRhaW5lcikuaW5uZXJIVE1MID0gJydcbiAgICBxcyh0aGlzLmNvbmZpZy5wYWdpbmF0aW9uQ29udGFpbmVyKS5pbm5lckhUTUwgPSAnJ1xuICAgIHFzKHRoaXMuY29uZmlnLnNlYXJjaElucHV0KS52YWx1ZSA9ICcnXG4gICAgcXModGhpcy5jb25maWcuc2VhcmNoSW5wdXQpLmZvY3VzKClcbiAgICAvLyB3ZWxjb21lIHNjcmVlbnJlYWRlciB1c2Vyc1xuICAgIC8vdGhpcy5hcmlhTm90aWNlKFwiV2VsY29tZSB0byBGaW5kIFNpZ24uIEVudGVyIGEgc2VhcmNoIHF1ZXJ5XCIsICdwb2xpdGUnKVxuICB9XG5cbiAgLy8gcmVuZGVyIHNlYXJjaCByZXN1bHRzIHBhZ2VcbiAgYXN5bmMgcmVuZGVyU2VhcmNoKGhhc2gpIHtcbiAgICBsZXQgW3F1ZXJ5VGV4dCwgb2Zmc2V0XSA9IGhhc2guc3BsaXQoJy8nKS5tYXAoeCA9PiBkZWNvZGVVUklDb21wb25lbnQoeCkpXG4gICAgaWYgKHF1ZXJ5VGV4dC50cmltKCkubGVuZ3RoID09IDApIHJldHVybiBsb2NhdGlvbi5ocmVmID0gXCIjXCJcblxuICAgIC8vIGVuc3VyZSBzZWFyY2ggYm94IGlzIGNvcnJlY3RseSBmaWxsZWRcbiAgICBxcyh0aGlzLmNvbmZpZy5zZWFyY2hJbnB1dCkudmFsdWUgPSBxdWVyeVRleHRcblxuICAgIGlmICghdGhpcy5zZWFyY2hFbmdpbmUucmVhZHkpIHtcbiAgICAgIHRoaXMudmlzdWFsTm90aWNlKFwiTG9hZGluZ+KAplwiKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBtb3ZlIHNjcmVlbnJlYWRlciBhdHRlbnRpb24gdG8ganVzdCBhYm92ZSB0aGUgcmVzdWx0cyBsaXN0LCBhbHNvIHNjcm9sbCB1cFxuICAgICAgdGhpcy5hcmlhTm90aWNlKFwiTG9hZGluZ+KAplwiLCBcIm9mZlwiKS5mb2N1cygpXG4gICAgfVxuICAgIFxuICAgIC8vIHF1ZXJ5IHRoZSBzZWFyY2ggZW5naW5lLi4uXG4gICAgaWYgKHRoaXMuX2xhc3RRdWVyeVRleHQgIT09IHF1ZXJ5VGV4dCkge1xuICAgICAgdGhpcy5yZXN1bHRzID0gYXdhaXQgdGhpcy5zZWFyY2hFbmdpbmUucXVlcnkocXVlcnlUZXh0KVxuICAgICAgdGhpcy5fbGFzdFF1ZXJ5VGV4dCA9IHF1ZXJ5VGV4dFxuICAgIH1cblxuICAgIGlmICh0aGlzLnJlc3VsdHMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLnZpc3VhbE5vdGljZShcIk5vIHNlYXJjaCByZXN1bHRzIGZvdW5kLlwiLCAnbGl2ZScpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHVwZGF0ZSBjc3MgdG8gcGFnZSBtb2RlXG4gICAgICBxcygnaHRtbCA+IGJvZHknKS5jbGFzc05hbWUgPSAncmVzdWx0cydcblxuICAgICAgLy8gY2xlYXIgdGhlIHZpZXdzXG4gICAgICBxcyh0aGlzLmNvbmZpZy5yZXN1bHRzQ29udGFpbmVyKS5pbm5lckhUTUwgPSAnJ1xuICAgICAgcXModGhpcy5jb25maWcucGFnaW5hdGlvbkNvbnRhaW5lcikuaW5uZXJIVE1MID0gJydcbiAgICB9XG5cbiAgICAvLyBzbGljZSBvdXQgdGhlIGdyb3VwIHRvIGRpc3BsYXlcbiAgICB0aGlzLmRpc3BsYXlSZXN1bHRzID0gdGhpcy5yZXN1bHRzLnNsaWNlKHBhcnNlSW50KG9mZnNldCksIHBhcnNlSW50KG9mZnNldCkgKyB0aGlzLmNvbmZpZy5yZXN1bHRzUGVyUGFnZSlcblxuICAgIC8vIGFkZCBhbGwgdGhlIHNlYXJjaCByZXN1bHQgdGlsZXMgdG8gdGhlIHJlc3VsdHMgPGRpdj5cbiAgICBsZXQgZmluaXNoZWRMb2FkaW5nID0gUHJvbWlzZS5hbGwodGhpcy5kaXNwbGF5UmVzdWx0cy5tYXAoYXN5bmMgKHJlc3VsdCwgaW5kZXgpID0+IHtcbiAgICAgIC8vIGltcGxlbWVudCB0aGUgc2xvdyB0aWxlIGluIGVmZmVjdFxuICAgICAgYXdhaXQgZGVsYXkoaW5kZXggKiB0aGlzLmNvbmZpZy50aWxlQXBwZW5kRGVsYXkpXG5cbiAgICAgIC8vIGNyZWF0ZSBhIHJlc3VsdCB2aWV3XG4gICAgICBsZXQgdmlldyA9IG5ldyBSZXN1bHRWaWV3KHtcbiAgICAgICAgd2FybmluZ3M6IHRoaXMuY29uZmlnLndhcm5pbmdzLFxuICAgICAgICByZXN1bHQ6IHJlc3VsdCxcbiAgICAgICAgb25DaGFuZ2U6ICgpPT4gbW9ycGgoZWxlbWVudCwgdmlldy50b0hUTUwoKSlcbiAgICAgIH0pXG5cbiAgICAgIC8vIGFkZCB0aGUgcmVzdWx0IHBsYWNlaG9sZGVyIHRvIHRoZSBzZWFyY2ggcmVzdWx0cyA8ZGl2PlxuICAgICAgbGV0IGVsZW1lbnQgPSB2aWV3LnRvSFRNTCgpXG4gICAgICBxcyh0aGlzLmNvbmZpZy5yZXN1bHRzQ29udGFpbmVyKS5hcHBlbmQoZWxlbWVudClcblxuICAgICAgLy8gaWYgdGhlIHJlc3VsdCBpcyBsb3cgcmFuaywgYWRkIGEgbG93IHJhbmsgd2FybmluZ1xuICAgICAgaWYgKHRoaXMuY29uZmlnLmxvd1JhbmtXYXJuaW5nICYmIHJlc3VsdC5kaXN0YW5jZSA+IHRoaXMuY29uZmlnLmxvd1JhbmtXYXJuaW5nLnRocmVzaG9sZCkge1xuICAgICAgICB2aWV3LmFkZFdhcm5pbmcodGhpcy5jb25maWcubG93UmFua1dhcm5pbmcpXG4gICAgICB9XG5cbiAgICAgIC8vIHdhaXQgZm9yIHNlYXJjaCByZXN1bHRzIGRhdGEgdG8gbG9hZCBpbiBhbmQgdXBkYXRlIHRoZSBzZWFyY2ggcmVzdWx0IHZpZXdcbiAgICAgIHZpZXcuc2V0RGF0YShhd2FpdCByZXN1bHQuZmV0Y2goKSlcbiAgICB9KSlcblxuICAgIC8vIHdhaXQgZm9yIGFsbCB0aGUgc2VhcmNoIHJlc3VsdHMgdG8gZmluaXNoIGxvYWRpbmcgaW5cbiAgICBhd2FpdCBmaW5pc2hlZExvYWRpbmdcblxuICAgIC8vIGFkZCBhIHBhZ2luYXRvclxuICAgIGxldCBwYWdpbmF0b3IgPSBuZXcgUGFnaW5hdG9yKHtcbiAgICAgIGxlbmd0aDogTWF0aC5taW4odGhpcy5yZXN1bHRzLmxlbmd0aCAvIHRoaXMuY29uZmlnLnJlc3VsdHNQZXJQYWdlLCB0aGlzLmNvbmZpZy5tYXhQYWdlcyksXG4gICAgICBzZWxlY3RlZDogTWF0aC5mbG9vcihwYXJzZUludChvZmZzZXQpIC8gdGhpcy5jb25maWcucmVzdWx0c1BlclBhZ2UpLFxuICAgICAgZ2V0VVJMOiAocGFnZU51bSk9PiBgIyR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5VGV4dCl9LyR7cGFnZU51bSAqIHRoaXMuY29uZmlnLnJlc3VsdHNQZXJQYWdlfWBcbiAgICB9KVxuXG4gICAgLy8gdXBkYXRlIHRoZSBwYWdpbmF0aW9uIHdpZGdldFxuICAgIG1vcnBoKHFzKHRoaXMuY29uZmlnLnBhZ2luYXRpb25Db250YWluZXIpLCBwYWdpbmF0b3IudG9IVE1MKCkpXG5cbiAgICAvLyBtb3ZlIHNjcmVlbnJlYWRlciBhdHRlbnRpb24gdG8ganVzdCBhYm92ZSB0aGUgcmVzdWx0cyBsaXN0LCBhbmQgYW5ub3VuY2UgdGhleSdyZSByZWFkeVxuICAgIHRoaXMuYXJpYU5vdGljZShcIlNlYXJjaCByZXN1bHRzIHVwZGF0ZWQuXCIsIFwib2ZmXCIpLmZvY3VzKClcbiAgfVxuXG4gIC8vIHJlcGxhY2VzIHRoZSBjb250ZW50IG9mIHRoZSBwYWdlIHdpdGggYSBub3RpY2UsIHdoaWNoIGlzIGFsc28gcmVhZCBieSBhcmlhXG4gIHZpc3VhbE5vdGljZSh0ZXh0LCBhcmlhTGl2ZSA9ICdwb2xpdGUnKSB7XG4gICAgcXMoJ2h0bWwgPiBib2R5JykuY2xhc3NOYW1lID0gJ25vdGljZSdcbiAgICBxcyh0aGlzLmNvbmZpZy5wYWdpbmF0aW9uQ29udGFpbmVyKS5pbm5lckhUTUwgPSAnJ1xuICAgIGxldCByZXN1bHRzQm94ID0gcXModGhpcy5jb25maWcucmVzdWx0c0NvbnRhaW5lcilcbiAgICByZXN1bHRzQm94LmlubmVySFRNTCA9ICcnXG4gICAgcmVzdWx0c0JveC5hcHBlbmQoaHRtbGA8ZGl2IGNsYXNzPVwibm90aWNlX2JveFwiIGFyaWEtbGl2ZT1cIiR7YXJpYUxpdmV9XCI+JHt0ZXh0fTwvZGl2PmApXG4gIH1cblxuICAvLyBjcmVhdGVzIGFuIGludmlzaWJsZSBhcmlhIG5vdGljZSB3aGljaCBzZWxmIGRlc3RydWN0cyB3aGVuIGl0IGJsdXJzXG4gIGFyaWFOb3RpY2UodGV4dCwgYXJpYUxpdmUgPSAncG9saXRlJykge1xuICAgIFsuLi5xc2EoJ2Rpdi5hcmlhX25vdGljZScpXS5mb3JFYWNoKHggPT4geC5yZW1vdmUoKSlcbiAgICBsZXQgbm90aWNlID0gaHRtbGA8ZGl2IGNsYXNzPVwiYXJpYV9ub3RpY2VcIiB0YWJpbmRleD1cIi0xXCIgYXJpYS1saXZlPVwiJHthcmlhTGl2ZX1cIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAtMTAwMHB4XCI+JHt0ZXh0fTwvZGl2PmBcbiAgICBxcyh0aGlzLmNvbmZpZy5yZXN1bHRzQ29udGFpbmVyKS5iZWZvcmUobm90aWNlKVxuICAgIHJldHVybiBub3RpY2VcbiAgfVxuXG4gIGFzeW5jIHJlbmRlckhhc2h0YWdMaXN0KHNlbGVjdG9yKSB7XG4gICAgYXdhaXQgdGhpcy5hd2FpdFJlYWR5KClcbiAgICBsZXQgbGlzdCA9IHFzKHNlbGVjdG9yKVxuICAgIGxldCB0YWdzID0gYXdhaXQgdGhpcy5zZWFyY2hFbmdpbmUuZ2V0VGFncygpXG4gICAgLy8gZW1wdHkgdGhlIGxpc3RcbiAgICBsaXN0LmlubmVySFRNTCA9ICcnXG4gICAgLy8gYWRkIGxpc3QgaXRlbXMgd2l0aCBsaW5rcyB0byBleGFtcGxlIHRhZyBzZWFyY2hlc1xuICAgIGZvciAobGV0IHRhZyBvZiBPYmplY3Qua2V5cyh0YWdzKS5zb3J0KChhLGIpPT4gdGFnc1tiXSAtIHRhZ3NbYV0pKSB7XG4gICAgICBsaXN0LmFwcGVuZChodG1sYDxsaT48YSBocmVmPVwiJHtgLi8jJHtlbmNvZGVVUklDb21wb25lbnQoYCMke3RhZ31gKX0vMGB9XCI+IyR7dGFnfTwvYT4gKCR7dGFnc1t0YWddfSk8L2xpPmApXG4gICAgfVxuICB9XG59XG5cbmxldCB1aSA9IHdpbmRvdy51aSA9IG5ldyBGaW5kU2lnblVJKHtcbiAgbGFuZ3VhZ2VOYW1lOiBcIkF1c2xhblwiLFxuICBzZWFyY2hMaWJyYXJ5UGF0aDogXCJkYXRhc2V0cy9zZWFyY2gtaW5kZXhcIixcbiAgdmVjdG9yTGlicmFyeVBhdGg6IFwiZGF0YXNldHMvY2MtZW4tMzAwLThiaXRcIixcbiAgcmVzdWx0c1BlclBhZ2U6IDEwLFxuICBtYXhQYWdlczogOCxcbiAgaG9tZUJ1dHRvbjogJyNoZWFkZXInLFxuICBzZWFyY2hGb3JtOiAnI3NlYXJjaF9mb3JtJyxcbiAgc2VhcmNoSW5wdXQ6ICcjc2VhcmNoX2JveCcsXG4gIHJlc3VsdHNDb250YWluZXI6ICcjcmVzdWx0cycsXG4gIHBhZ2luYXRpb25Db250YWluZXI6ICcjcGFnaW5hdGlvbicsXG4gIHRpbGVBcHBlbmREZWxheTogcGFyc2VEdXJhdGlvbihnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZSgnLS1mYWRlLXRpbWUtb2Zmc2V0JykudHJpbSgpKSxcbiAgd2FybmluZ3M6IHtcbiAgICBcImludmVudGVkXCI6IHsgdHlwZTogJ2ludmVudGVkJywgdGV4dDogXCJJbmZvcm1hbCwgY29sbG9xdWFsIHNpZ24uIFByb2Zlc3Npb25hbHMgc2hvdWxkIG5vdCB1c2UuXCIgfSxcbiAgICBcImhvbWVzaWduXCI6IHsgdHlwZTogJ2hvbWUtc2lnbicsIHRleHQ6IFwiVGhpcyBpcyBsaXN0ZWQgYXMgYSBIb21lIFNpZ24sIG5vdCBhbiBlc3RhYmxpc2hlZCB3aWRlc3ByZWFkIHBhcnQgb2YgQXVzbGFuLlwiIH0sXG4gICAgXCJob21lLXNpZ25cIjogeyB0eXBlOiAnaG9tZS1zaWduJywgdGV4dDogXCJUaGlzIGlzIGxpc3RlZCBhcyBhIEhvbWUgU2lnbiwgbm90IGFuIGVzdGFibGlzaGVkIHdpZGVzcHJlYWQgcGFydCBvZiBBdXNsYW4uXCIgfVxuICB9LFxuICAvLyBsb3dSYW5rV2FybmluZzoge1xuICAvLyAgIHRocmVzaG9sZDogMS4wLFxuICAvLyAgIHR5cGU6ICdsb3ctcmFuaycsXG4gIC8vICAgdGV4dDogXCJUaGlzIHNlYXJjaCByZXN1bHQgaXMgdmVyeSBsb3cgcmFuayBmb3IgdGhpcyBzZWFyY2ggcXVlcnkuXCJcbiAgLy8gfVxufSlcblxuLy8gaWYgdGhpcyBpcyB0aGUgc2VhcmNoIGVuZ2luZSBpbnRlcmZhY2UsIGhvb2sgYWxsIHRoYXQgc3R1ZmYgdXBcbmlmIChkb2N1bWVudC5ib2R5LmRhdGFzZXQuaG9vayA9PSAndHJ1ZScpIHVpLmFkZEhvb2tzKClcbi8vIHJlZ2FyZGxlc3MsIGxvYWQgb3VyIGRhdGFzZXRzLCB3ZSBtaWdodCBiZSBvbiB0aGUgYWJvdXQgcGFnZVxudWkubG9hZCgpXG4vLyBpZiBhIGhhc2h0YWcgbGlzdCBpcyByZXF1ZXN0ZWQsIGRpc3BsYXkgaXRcbmlmIChkb2N1bWVudC5ib2R5LmRhdGFzZXQuaGFzaHRhZ0xpc3QpIHVpLnJlbmRlckhhc2h0YWdMaXN0KGRvY3VtZW50LmJvZHkuZGF0YXNldC5oYXNodGFnTGlzdCkiLCIvLyBnZW5lcmFsIHV0aWxpdGllcyBsaWJyYXJ5IG9mIHVzZWZ1bCBmdW5jdGlvbnMgdGhhdCBnZXQgcmV1c2VkIGEgbG90XG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKVxuXG5cbmxldCBVdGlsID0ge1xuICAvLyBlbmNvZGUgYSAocG9zaXRpdmUgb3IgMCkgaW50ZWdlciB0byBhIGJpbmFyeSBzdHJpbmdcbiAgaW50VG9CaXRzOiAobnVtYmVyLCBzaXplKSA9PiB7XG4gICAgYXNzZXJ0KCFOdW1iZXIuaXNOYU4obnVtYmVyKSwgYE51bWJlciBpcyBOYU4hIENhbm5vdCBlbmNvZGUgdG8gaW50YClcbiAgICBhc3NlcnQobnVtYmVyID09IE1hdGgucm91bmQobnVtYmVyKSwgYE51bWJlciBtdXN0IGJlIGEgd2hvbGUgbnVtYmVyYClcbiAgICBhc3NlcnQobnVtYmVyID49IDAsIGBOdW1iZXIgaXMgbmVnYXRpdmUhIENhbm5vdCBlbmNvZGUgdG8gaW50YClcbiAgICBsZXQgZW5jb2RlZCA9IG51bWJlci50b1N0cmluZygyKVxuICAgIGFzc2VydChlbmNvZGVkLmxlbmd0aCA8PSBzaXplLCBgSW5wdXQgbnVtYmVyICR7bnVtYmVyfSB0b28gbGFyZ2UgdG8gZml0IGluICR7c2l6ZX0gZGlnaXRzIHdpdGggYmluYXJ5IGVuY29kaW5nYClcbiAgICByZXR1cm4gKCcwJykucmVwZWF0KHNpemUgLSBlbmNvZGVkLmxlbmd0aCkgKyBlbmNvZGVkXG4gIH0sXG5cbiAgLy8gZGVjb2RlIGEgYmluYXJ5IHN0cmluZyBpbiB0byBhIHBvc2l0aXZlIG9yIDAgaW50ZWdlclxuICBiaXRzVG9JbnQ6IChiaW5hcnlTdHJpbmcpID0+IHtcbiAgICBhc3NlcnQoYmluYXJ5U3RyaW5nLm1hdGNoKC9eWzAxXSskLyksICdTdHJpbmcgY29udGFpbnMgY2hhcmFjdGVycyB0aGF0IGFyZSBub3QgYmluYXJ5JylcbiAgICBhc3NlcnQoYmluYXJ5U3RyaW5nLmxlbmd0aCA8PSA1MywgYFN0cmluZyBpcyB0b28gbG9uZyB0byBwYXJzZSBpbiB0byBhIHNpbmdsZSBpbnQgcmVsaWFibHlgKVxuICAgIHJldHVybiBwYXJzZUludChiaW5hcnlTdHJpbmcsIDIpXG4gIH0sXG5cbiAgLy8gZW5jb2RlIGEgc2lnbmVkIGludCB0byBhIHNldCBudW1iZXIgb2YgYml0cyB1c2luZyAyJ3MgY29tcGxpbWVudCBlbmNvZGluZ1xuICBzaW50VG9CaXRzOiAobnVtYmVyLCBzaXplKSA9PiB7XG4gICAgYXNzZXJ0KHNpemUgPj0gMiwgYFNpemUgY2Fubm90IGJlIHVuZGVyIDJgKVxuICAgIGFzc2VydCghTnVtYmVyLmlzTmFOKG51bWJlciksIGBOdW1iZXIgaXMgTmFOISBDYW5ub3QgZW5jb2RlIHRvIHNpZ25lZCBpbnRgKVxuICAgIGFzc2VydChudW1iZXIgPT0gTWF0aC5yb3VuZChudW1iZXIpLCBgTnVtYmVyIG11c3QgYmUgYSB3aG9sZSBudW1iZXJgKVxuICAgIGFzc2VydChudW1iZXIgPCAyICoqIChzaXplIC0gMSksIGBOdW1iZXIgaXMgdG9vIHNtYWxsIHRvIGZpdCBpbiB0aGUgc3BlY2lmaWVkIHNpemVgKVxuICAgIGFzc2VydChudW1iZXIgPiAwIC0gKDIgKiogKHNpemUgLSAxKSksIGBOdW1iZXIgaXMgdG9vIGxhcmdlIHRvIGZpdCBpbiB0aGUgc3BlY2lmaWVkIHNpemVgKVxuICAgIGxldCB0cnVlTnVtYmVyU2l6ZSA9IHNpemUgLSAxXG4gICAgbGV0IGVuY29kZWQgPSBNYXRoLmFicyhudW1iZXIpLnRvU3RyaW5nKDIpXG4gICAgYXNzZXJ0KGVuY29kZWQubGVuZ3RoIDw9IHRydWVOdW1iZXJTaXplKVxuICAgIHJldHVybiAobnVtYmVyIDwgMCA/ICcxJzonMCcpICsgKCcwJykucmVwZWF0KHRydWVOdW1iZXJTaXplIC0gZW5jb2RlZC5sZW5ndGgpICsgZW5jb2RlZFxuICB9LFxuXG4gIC8vIGRlY29kZSBiaW5hcnkgc3RyaW5nIGluIHRvIGEgc2lnbmVkIGludGVnZXJcbiAgYml0c1RvU2ludDogKGJpbmFyeVN0cmluZykgPT4ge1xuICAgIGFzc2VydChiaW5hcnlTdHJpbmcubWF0Y2goL15bMDFdKyQvKSwgJ1N0cmluZyBjb250YWlucyBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCBiaW5hcnknKVxuICAgIGFzc2VydChiaW5hcnlTdHJpbmcubGVuZ3RoIDw9IDUzLCBgU3RyaW5nIGlzIHRvbyBsb25nIHRvIHBhcnNlIGluIHRvIGEgc2luZ2xlIHNpZ25lZCBpbnQgcmVsaWFibHlgKVxuICAgIGxldCBjb21wbGltZW50ID0gYmluYXJ5U3RyaW5nLnNsaWNlKDAsIDEpXG4gICAgbGV0IG51bWVyaWNCaXRzID0gYmluYXJ5U3RyaW5nLnNsaWNlKDEpXG4gICAgbGV0IGFic29sdXRlID0gcGFyc2VJbnQobnVtZXJpY0JpdHMsIDIpXG4gICAgcmV0dXJuIGNvbXBsaW1lbnQgPT0gJzAnID8gK2Fic29sdXRlIDogLWFic29sdXRlXG4gIH0sXG5cbiAgLy8gZW5jb2RlIGEgYnl0ZSBhcnJheSB0byBhIGJpbmFyeSBzdHJpbmdcbiAgYnl0ZXNUb0JpdHM6IChieXRlQXJyYXkpID0+IHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShieXRlQXJyYXksIHggPT4gVXRpbC5pbnRUb0JpdHMoeCwgOCkpLmpvaW4oJycpXG4gIH0sXG5cbiAgYml0c1RvQnl0ZXM6IChiaW5hcnlTdHJpbmcpID0+IHtcbiAgICBhc3NlcnQoYmluYXJ5U3RyaW5nLmxlbmd0aCAlIDggPT0gMCwgXCJCaW5hcnkgc3RyaW5nIGlucHV0IG11c3QgYmUgYSBtdWx0aXBsZSBvZiA4IGNoYXJhY3RlcnNcIilcbiAgICByZXR1cm4gQXJyYXkuZnJvbShVdGlsLmNodW5rSXRlcmFibGUoYmluYXJ5U3RyaW5nLCA4KSwgY2h1bmsgPT4gVXRpbC5iaXRzVG9JbnQoY2h1bmspKVxuICB9LFxuXG4gIC8vIGxpa2UgYnl0ZXNUb0JpdHMsIGJ1dCBvbmx5IHJldHVybnMgdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgcHJlZml4IGJpdHNcbiAgYnl0ZXNUb1ByZWZpeEJpdHM6IChieXRlQXJyYXksIHByZWZpeEJpdExlbmd0aCA9IDApID0+IHtcbiAgICByZXR1cm4gVXRpbC5ieXRlc1RvQml0cyhieXRlQXJyYXkuc2xpY2UoMCwgTWF0aC5jZWlsKHByZWZpeEJpdExlbmd0aCAvIDgpKSkuc2xpY2UoMCwgcHJlZml4Qml0TGVuZ3RoKVxuICB9LFxuXG4gIC8vIGNvbnZlcnQgYSBieXRlIGFycmF5IGluIHRvIGEgbG93ZXJjYXNlIGJhc2UxNiByZXByZXNlbnRhdGlvblxuICBieXRlc1RvQmFzZTE2OiAoYnl0ZUFycmF5KSA9PiB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oYnl0ZUFycmF5LCBudW0gPT4gYnl0ZXNUb0Jhc2UxNlRhYmxlW251bV0pLmpvaW4oJycpXG4gIH0sXG5cbiAgYmFzZTE2VG9CeXRlczogKGJhc2UxNlN0cmluZykgPT4ge1xuICAgIGFzc2VydChiYXNlMTZTdHJpbmcubGVuZ3RoICUgMiA9PSAwLCBcIkJhc2UgMTYgU3RyaW5nIGlucHV0IG11c3QgYmUgYSBtdWx0aXBsZSBvZiAyIGNoYXJhY3RlcnNcIilcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoQXJyYXkuZnJvbShVdGlsLmNodW5rSXRlcmFibGUoYmFzZTE2U3RyaW5nLCAyKSwgbmliYmxlID0+IHBhcnNlSW50KG5pYmJsZSwgMTYpKSlcbiAgfSxcblxuICAvLyBwYWNrIGEgc2V0IG9mIGZsb2F0cyBpbiB0aGUgLTEuMCB0byArMS4wIHJhbmdlIGluIHRvIGludHMgd2l0aCBhcmJpdHJhcnkgcHJlY2lzaW9uXG4gIHBhY2tGbG9hdHM6IChmbG9hdHMsIGJpdFByZWNpc2lvbikgPT4ge1xuICAgIGxldCBzaW50cyA9IGZsb2F0cy5tYXAobnVtID0+IE1hdGgucm91bmQobnVtICogKCgyICoqIChiaXRQcmVjaXNpb24gLSAxKSAtIDEpKSkpXG4gICAgbGV0IGJpdHMgPSBzaW50cy5tYXAoc2ludCA9PiBVdGlsLnNpbnRUb0JpdHMoc2ludCwgYml0UHJlY2lzaW9uKSkuam9pbignJylcbiAgICBpZiAoYml0cy5sZW5ndGggJSA4ICE9IDApIGJpdHMgKz0gKCcwJykucmVwZWF0KDggLSAoYml0cy5sZW5ndGggJSA4KSlcbiAgICByZXR1cm4gVXRpbC5iaXRzVG9CeXRlcyhiaXRzKVxuICB9LFxuXG4gIC8vIHVucGFjayBhIHNlcmllcyBvZiBhcmJpdHJhcnkgcHJlY2lzaW9uIGZsb2F0cyAodHJ1bHkgZml4ZWQgcG9pbnQgbnVtYmVycykgZnJvbSBhIHNldCBvZiBieXRlcyAoaS5lLiB3b3JkIHZlY3RvcnMpXG4gIHVucGFja0Zsb2F0czogKGJ5dGVzLCBiaXRQcmVjaXNpb24sIHRvdGFsRmxvYXRzKSA9PiB7XG4gICAgbGV0IGJpdHMgPSBVdGlsLmJ5dGVzVG9CaXRzKGJ5dGVzKVxuICAgIHJldHVybiBVdGlsLnRpbWVzTWFwKHRvdGFsRmxvYXRzLCBpbmRleCA9PiB7XG4gICAgICBsZXQgc2ludCA9IFV0aWwuYml0c1RvU2ludChiaXRzLnNsaWNlKGluZGV4ICogYml0UHJlY2lzaW9uLCAoaW5kZXggKyAxKSAqIGJpdFByZWNpc2lvbikpXG4gICAgICByZXR1cm4gc2ludCAvICgoMiAqKiAoYml0UHJlY2lzaW9uIC0gMSkpIC0gMSlcbiAgICB9KVxuICB9LFxuXG4gIC8vIE9iamVjdCBjb252ZXJzaW9uIHN0dWZmXG5cbiAgLy8gYWNjZXB0cyBhbiBvYmplY3Qgd2l0aCBiYXNlMTYga2V5cyBhbmQgYW55IHZhbHVlc1xuICAvLyByZXR1cm5zIGEgTWFwIHdpdGggVWludDhBcnJheSBrZXlzIGFuZCB2YWx1ZXMgY29waWVkIGluXG4gIGJhc2UxNk9iamVjdFRvVWludDhNYXA6IChvYmplY3QpID0+IHtcbiAgICByZXR1cm4gVXRpbC5vYmplY3RUb01hcChvYmplY3QsIChrZXlTdHJpbmcpPT4gbmV3IFVpbnQ4QXJyYXkoVXRpbC5iYXNlMTZUb0J5dGVzKGtleVN0cmluZykpKVxuICB9LFxuXG4gIC8vIGFjY2VwdHMgYW4gb2JqZWN0IGFzIGlucHV0LCBhbmQgdXNlcyBhbiBvcHRpb25hbCBrZXlNYXAgZnVuY3Rpb24gdG8gdHJhbnNmb3JtIHRoZSBrZXlzIGluIHRvXG4gIC8vIGFueSBvdGhlciBmb3JtYXQsIHRoZW4gYnVpbGRzIGEgbWFwIHVzaW5nIHRoYXQgZm9ybWF0IGFuZCByZXR1cm5zIGl0XG4gIG9iamVjdFRvTWFwOiAob2JqZWN0LCBrZXlNYXBGbiA9ICh4KSA9PiB4LCB2YWx1ZU1hcEZuID0gKHgpID0+IHgpID0+IHtcbiAgICBsZXQgbWFwID0gbmV3IE1hcCgpXG4gICAgZm9yIChsZXQgcHJvcGVydHlOYW1lIGluIG9iamVjdCkge1xuICAgICAgbWFwLnNldChrZXlNYXBGbihwcm9wZXJ0eU5hbWUpLCB2YWx1ZU1hcEZuKG9iamVjdFtwcm9wZXJ0eU5hbWVdKSlcbiAgICB9XG4gICAgcmV0dXJuIG1hcFxuICB9LFxuXG5cbiAgLy8gZW5jb2RlL2RlY29kZSBhIGJ1ZmZlciAobGlrZSB0aGF0IHJldHVybmVkIGJ5IGZldGNoKSBpbiB0byBhIHJlZ3VsYXIgc3RyaW5nXG4gIC8vIHJldHVybnMgYSBwcm9taXNlXG4gIGVuY29kZVVURjg6IChzdHJpbmcpID0+IHtcbiAgICBpZiAoIXRoaXMuX3V0ZjhfZW5jb2RlcikgdGhpcy5fdXRmOF9lbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCd1dGYtOCcpXG4gICAgcmV0dXJuIHRoaXMuX3V0ZjhfZW5jb2Rlci5lbmNvZGUoc3RyaW5nKVxuICB9LFxuXG4gIGRlY29kZVVURjg6IChidWZmZXIpID0+IHtcbiAgICBpZiAoIXRoaXMuX3V0ZjhfZGVjb2RlcikgdGhpcy5fdXRmOF9kZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCd1dGYtOCcpXG4gICAgcmV0dXJuIHRoaXMuX3V0ZjhfZGVjb2Rlci5kZWNvZGUoYnVmZmVyKVxuICB9LFxuXG4gIC8vIGV4ZWN1dGUgYSBjYWxsYmFjayB4IG1hbnkgdGltZXNcbiAgdGltZXM6ICh0aW1lcywgY2FsbGJhY2spID0+IHtcbiAgICBsZXQgaW5kZXggPSAwXG4gICAgd2hpbGUgKGluZGV4IDwgdGltZXMpIHtcbiAgICAgIGNhbGxiYWNrKGluZGV4LCB0aW1lcylcbiAgICAgIGluZGV4ICs9IDFcbiAgICB9XG4gIH0sXG5cbiAgLy8gYSBzZXQgbnVtYmVyIG9mIHRpbWVzLCBhIGNhbGxiYWNrIGlzIGNhbGxlZCB3aXRoIChpbmRleCwgdGltZXMpLCByZXR1cm5pbmcgYSByZWd1bGFyIEFycmF5IG9mIHRoZSByZXR1cm4gdmFsdWVzXG4gIHRpbWVzTWFwOiAodGltZXMsIGNhbGxiYWNrKSA9PiB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oVXRpbC50aW1lc01hcEl0ZXJhYmxlKHRpbWVzLCBjYWxsYmFjaykpXG4gIH0sXG5cbiAgLy8gcmV0dXJucyBhbiBpdGVyYWJsZSB3aGljaCBjYWxscyBhIGNhbGxiYWNrIHdpdGggKGluZGV4LCB0aW1lcykgYHRpbWVzYCBtYW55IHRpbWVzLCByZXR1cm5pbmcgdGhlIHJlc3VsdHMgb2YgdGhlIGNhbGxiYWNrXG4gIHRpbWVzTWFwSXRlcmFibGU6IGZ1bmN0aW9uICoodGltZXMsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGluZGV4ID0gMFxuICAgIHdoaWxlIChpbmRleCA8IHRpbWVzKSB7XG4gICAgICB5aWVsZCBjYWxsYmFjayhpbmRleCwgdGltZXMpXG4gICAgICBpbmRleCArPSAxXG4gICAgfVxuICB9LFxuXG4gIC8vIGdpdmVuIGEgc2xpY2VhYmxlIG9iamVjdCBsaWtlIGFuIEFycmF5LCBCdWZmZXIsIG9yIFN0cmluZywgcmV0dXJucyBhbiBhcnJheSBvZiBzbGljZXMsIGNodW5rU2l6ZSBsYXJnZSwgdXAgdG8gbWF4Q2h1bmtzIG9yIHRoZSB3aG9sZSB0aGluZ1xuICAvLyB0aGUgbGFzdCBjaHVuayBtYXkgbm90IGJlIGZ1bGwgc2l6ZVxuICBjaHVuazogKHNsaWNlYWJsZSwgY2h1bmtTaXplLCBtYXhDaHVua3MgPSBJbmZpbml0eSkgPT4ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKFV0aWwuY2h1bmtJdGVyYWJsZShzbGljZWFibGUsIGNodW5rU2l6ZSwgbWF4Q2h1bmtzKSlcbiAgfSxcblxuICAvLyBpdGVyYWJsZSB2ZXJzaW9uLCB0YWtlcyBhbiBpdGVyYWJsZSBhcyBpbnB1dCwgYW5kIHByb3ZpZGVzIGFuIGl0ZXJhYmxlIGFzIG91dHB1dCB3aXRoIGVudHJpZXMgZ3JvdXBlZCBpbiB0byBhcnJheXNcbiAgLy8gc3RyaW5ncyBhcyBpbnB1dHMgYXJlIGEgc3BlY2lhbCBjYXNlOiB5b3UgZ2V0IHN0cmluZ3MgYXMgb3V0cHV0IChjb25jYXRpbmF0aW5nIHRoZSBjaGFyYWN0ZXJzIHRvZ2V0aGVyKVxuICBjaHVua0l0ZXJhYmxlOiBmdW5jdGlvbiooc2xpY2VhYmxlLCBjaHVua1NpemUsIG1heENodW5rcyA9IEluZmluaXR5KSB7XG4gICAgbGV0IGlucHV0ID0gc2xpY2VhYmxlW1N5bWJvbC5pdGVyYXRvcl0oKVxuICAgIHdoaWxlIChtYXhDaHVua3MgPiAwKSB7XG4gICAgICBsZXQgY2h1bmsgPSBbXVxuICAgICAgd2hpbGUgKGNodW5rLmxlbmd0aCA8IGNodW5rU2l6ZSkge1xuICAgICAgICBsZXQgb3V0cHV0ID0gaW5wdXQubmV4dCgpXG4gICAgICAgIGlmIChvdXRwdXQuZG9uZSkge1xuICAgICAgICAgIGlmIChjaHVuay5sZW5ndGggPiAwKSB5aWVsZCAodHlwZW9mKHNsaWNlYWJsZSkgPT0gJ3N0cmluZycpID8gY2h1bmsuam9pbignJykgOiBjaHVua1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNodW5rLnB1c2gob3V0cHV0LnZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB5aWVsZCAodHlwZW9mKHNsaWNlYWJsZSkgPT0gJ3N0cmluZycpID8gY2h1bmsuam9pbignJykgOiBjaHVua1xuICAgICAgbWF4Q2h1bmtzIC09IDFcbiAgICB9XG4gIH0sXG5cblxuICAvLyBzb21lIGNvbW1vbiBicm93c2VyIHRoaW5naWVzXG4gIGZldGNoTGlrZUZpbGU6IGFzeW5jIChwYXRoKSA9PiB7XG4gICAgbGV0IGRhdGEgPSBhd2FpdCBmZXRjaChwYXRoLCB7IG1vZGU6ICdzYW1lLW9yaWdpbicgfSlcbiAgICBpZiAoIWRhdGEub2spIHRocm93IG5ldyBFcnJvcihgU2VydmVyIHJlc3BvbmRlZCB3aXRoIGVycm9yIGNvZGUhIFwiJHtkYXRhLnN0YXR1c31cIiB3aGlsZSBsb2FkaW5nIFwiJHtwYXRofVwiIFNlYXJjaCBMaWJyYXJ5YClcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oYXdhaXQgZGF0YS5hcnJheUJ1ZmZlcigpKVxuICB9LFxuXG4gIC8vIHNpbXBsaWZpZWQgZGlnZXN0cyBvZiBzaG9ydCBidWZmZXJzXG4gIGRpZ2VzdE9uV2ViOiBhc3luYyAoYWxnbywgZGF0YSkgPT4ge1xuICAgIGNvbnN0IGFsZ29zID0ge3NoYTE6IFwiU0hBLTFcIiwgc2hhMjU2OiBcIlNIQS0yNTZcIiwgc2hhMzg0OiBcIlNIQS0zODRcIiwgc2hhNTEyOiBcIlNIQS01MTJcIn1cbiAgICBhbGdvID0gYWxnb3NbYWxnb10gfHwgYWxnb1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChhbGdvLCBkYXRhKSlcbiAgfSxcbn1cblxuY29uc3QgYnl0ZXNUb0Jhc2UxNlRhYmxlID0gVXRpbC50aW1lc01hcCgyICoqIDgsIChudW1iZXIpPT5cbiAgKCcwMCcgKyBudW1iZXIudG9TdHJpbmcoMTYpLnRvTG93ZXJDYXNlKCkpLnNsaWNlKC0yKVxuKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWwiLCIvLyBWZWN0b3IgTGlicmFyeSB2ZXJzaW9uIDNcbi8vIHRoaXMgdmVyc2lvbiB3b3JrcyBlZmZlY3RpdmVseSB0aGUgc2FtZSB3YXkgYXMgdmVyc2lvbiAyLCBidXQgc3RvcmVzIHNoYXJkcyBhcyBjYm9yIHN0cmVhbXNcbi8vIGFuZCB1bmlmaWVzIGJ1aWxkaW5nIGFuZCByZWFkaW5nIGluIHRvIG9uZSBjbGFzcywgYW5kIGFkZCdzIGF1dG9tYXRpYyB2ZWN0b3Igc2NhbGluZ1xuXG4vLyBjb25maWcgaXMgc3RvcmVkIGFzIHJlZ3VsYXIganNvbiBmb3IgaHVtYW4gcmVhZGFiaWxpdHksIGFuZCBjb250YWlucyB0aGUgc2V0dGluZ3Mgb2JqZWN0XG5cbi8vIHNoYXJkIGZpbGVzIGNvbnRhaW4gYSBzdHJlYW0gb2YgY2JvciBlbnRyaWVzLCBlYWNoIGdyb3VwIG9mIGZvdXIgZW50cmllcyByZXByZXNlbnRpbmcgYSBwYWlyXG4vLyB0aGUgb3JkZXIgb2YgdGhlc2UgY29tcG9uZW50cyBhcmU6XG4vLyAgIDE6IDxzdHJpbmc+IHRleHQgd29yZFxuLy8gICAyOiA8ZmxvYXQ+IHNjYWxpbmcgdmFsdWVcbi8vICAgMzogPFVpbnQ4QXJyYXk+IHZlY3RvckRhdGFcblxuY29uc3QgZnN1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5jb25zdCBjYm9yID0gcmVxdWlyZSgnYm9yYycpXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKVxuXG5jbGFzcyBWZWN0b3JMaWJyYXJ5IHtcbiAgLy8gSW5pdGlhbGlzZSBhIFZlY3RvciBMaWJyYXJ5IHJlYWRlci93cml0ZXJcbiAgLy8gUmVxdWlyZWQgZm9yIHJlYWQgb25seSB1c2U6XG4gIC8vICAgZnM6IHsgcmVhZEZpbGUocGF0aCkgfSAvLyByZWFkRmlsZSBtdXN0IHJldHVybiBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2l0aCBhIFVpbnQ4QXJyYXlcbiAgLy8gICBkaWdlc3QoYWxnbywgYnVmZmVyKSAvLyBhY2NlcHRzIGFuIGFsZ29yaXRobSBsaWtlIHNoYTI1NiwgYW5kIGEgVWludDhBcnJheSBvZiBkYXRhIHRvIGRpZ2VzdCwgcmV0dXJucyBhIHByb21pc2UgcmVzb2x2aW5nIHdpdGggYSBVaW50OEFycmF5IGhhc2hcbiAgLy8gICBwYXRoOiA8c3RyaW5nPiAvLyBhIHN0cmluZyBwYXRoIHRvIHRoZSB2ZWN0b3IgbGlicmFyeSBvbiB0aGUgZmlsZXN5c3RlbVxuICAvLyBSZXF1aXJlZCBmb3Igd3JpdGluZzpcbiAgLy8gICBmczogcmVmZXJlbmNlIHRvIHJlcXVpcmUoJ2ZzLWV4dHJhJykgb3IgYSBzaW1pbGFyIHByb21pc2lmaWVkIGZzIGltcGxlbWVudGF0aW9uXG4gIC8vIE9wdGlvbmFsOlxuICAvLyAgIHRleHRGaWx0ZXI6IGEgZnVuY3Rpb24gd2hpY2ggdHJhbnNmb3JtcyB3b3JkIHN0cmluZ3MgdG8gYSBjb25zaXN0ZW50IGZvcm1hdCAoaS5lLiBsb3dlcmNhc2UpXG4gIGNvbnN0cnVjdG9yKGNvbmZpZyA9IHt9KSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICBhc3NlcnQodGhpcy5jb25maWcuZnMsIGBcImZzXCIgaXMgYSByZXF1aXJlZCBjb25maWd1cmFibGUgb3B0aW9uYClcbiAgICBhc3NlcnQodGhpcy5jb25maWcucGF0aCwgYFwicGF0aFwiIGlzIGEgcmVxdWlyZWQgY29uZmlndXJhYmxlIG9wdGlvbmApXG4gICAgYXNzZXJ0KHRoaXMuY29uZmlnLmRpZ2VzdCwgYFwiZGlnZXN0XCIgaXMgYSByZXF1aXJlZCBjb25maWd1cmFibGUgb3B0aW9uYClcbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgaGFzaEZ1bmN0aW9uOiB0aGlzLmNvbmZpZy5oYXNoRnVuY3Rpb24gfHwgJ3NoYTI1NicsXG4gICAgICB2ZWN0b3JTaXplOiB0aGlzLmNvbmZpZy52ZWN0b3JTaXplIHx8IDMwMCxcbiAgICAgIHZlY3RvckJpdHM6IHRoaXMuY29uZmlnLnZlY3RvckJpdHMgfHwgOCxcbiAgICAgIGJ1aWxkVGltZXN0YW1wOiB0aGlzLmNvbmZpZy5idWlsZFRpbWVzdGFtcCB8fCBEYXRlLm5vdygpLFxuICAgICAgcHJlZml4Qml0czogdGhpcy5jb25maWcucHJlZml4Qml0cyB8fCA3LFxuICAgICAgc2hhcmRCaXRzOiB0aGlzLmNvbmZpZy5zaGFyZEJpdHMgfHwgMTMsXG4gICAgfVxuICB9XG5cbiAgLy8gbG9hZCB0aGUgc2V0dGluZ3MgZnJvbSBhbiBleGlzdGluZyBidWlsZFxuICBhc3luYyBvcGVuKCkge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBKU09OLnBhcnNlKGF3YWl0IHRoaXMuY29uZmlnLmZzLnJlYWRGaWxlKGAke3RoaXMuY29uZmlnLnBhdGh9L3NldHRpbmdzLmpzb25gKSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gdGFrZXMgYSB3b3JkIHN0cmluZyBhcyBpbnB1dCwgYW5kIGNhbGN1bGF0ZXMgd2hpY2ggc2hhcmQgaXQgc2hvdWxkIGdvIGluXG4gIC8vIGluIHJlYWRpbmcgbW9kZSwgbWFrZSBzdXJlIHRvIG9wZW4oKSB0aGUgbGlicmFyeSBmaXJzdCAtIHNldHRpbmdzLmpzb24gZGF0YSBpcyBpbXBvcnRhbnQhXG4gIGFzeW5jIGdldFdvcmRJbmZvKHN0cmluZ1dvcmQpIHtcbiAgICBpZiAodGhpcy5jb25maWcudGV4dEZpbHRlcikgc3RyaW5nV29yZCA9IHRoaXMuY29uZmlnLnRleHRGaWx0ZXIoc3RyaW5nV29yZClcbiAgICBsZXQgd29yZEhhc2ggPSBhd2FpdCB0aGlzLmNvbmZpZy5kaWdlc3QodGhpcy5zZXR0aW5ncy5oYXNoRnVuY3Rpb24sIGZzdXRpbC5lbmNvZGVVVEY4KHN0cmluZ1dvcmQpKVxuICAgIGxldCBwcmVmaXhJRCA9IHBhcnNlSW50KGZzdXRpbC5ieXRlc1RvUHJlZml4Qml0cyh3b3JkSGFzaCwgdGhpcy5zZXR0aW5ncy5wcmVmaXhCaXRzKSwgMilcbiAgICBsZXQgc2hhcmRJRCAgPSBwYXJzZUludChmc3V0aWwuYnl0ZXNUb1ByZWZpeEJpdHMod29yZEhhc2gsIHRoaXMuc2V0dGluZ3Muc2hhcmRCaXRzKSwgMilcbiAgICByZXR1cm4geyBmaWx0ZXJlZDogc3RyaW5nV29yZCwgcHJlZml4SUQsIHNoYXJkSUQsIHBhdGg6IGAke3RoaXMuY29uZmlnLnBhdGh9L3NoYXJkcy8ke3ByZWZpeElEfS8ke3NoYXJkSUR9LmNib3JgIH1cbiAgfVxuXG4gIC8vIGFkZCBhIGRlZmluaXRpb24gdG8gdGhlIFZlY3RvciBMaWJyYXJ5XG4gIGFzeW5jIGFkZERlZmluaXRpb24oc3RyaW5nV29yZCwgdmVjdG9yQXJyYXkpIHtcbiAgICAvLyBncmFiIGluZm8gYWJvdXQgdGhpcyB3b3JkIGFuZCB3aGljaCBzaGFyZCBpdCBzaG91bGQgbGl2ZSBpblxuICAgIGxldCB7IHBhdGg6IHNoYXJkUGF0aCwgZmlsdGVyZWQgfSA9IGF3YWl0IHRoaXMuZ2V0V29yZEluZm8oc3RyaW5nV29yZClcbiAgICBcbiAgICAvLyBmaWd1cmUgb3V0IHdoYXQgdGhlIGxhcmdlc3QgbnVtYmVyIGluIHRoZSB2ZWN0b3IgaXMgdG8gdXNlIGFzIGEgc2NhbGluZyB2YWx1ZVxuICAgIGxldCB2ZWN0b3JTY2FsZSA9IE1hdGgubWF4KC4uLnZlY3RvckFycmF5Lm1hcChNYXRoLmFicykpXG4gICAgLy8gc2NhbGUgdGhlIGRpZ2l0cyBhY2NvcmRpbmdseVxuICAgIGxldCBzY2FsZWRWZWN0b3IgPSB2ZWN0b3JBcnJheS5tYXAoeCA9PiB4IC8gdmVjdG9yU2NhbGUpXG4gICAgLy8gcGFjayB0aGUgbnVtYmVycyBpbiB0byBhIGJ1ZmZlciBvZiBpbnRlZ2Vyc1xuICAgIGxldCBwYWNrZWRWZWN0b3IgPSBmc3V0aWwucGFja0Zsb2F0cyhzY2FsZWRWZWN0b3IsIHRoaXMuc2V0dGluZ3MudmVjdG9yQml0cylcbiAgICAvLyBjYm9yIGVuY29kZSBlYWNoIHBpZWNlIGFuZCBhcHBlbmQgdGhlbVxuICAgIGxldCBhcHBlbmREYXRhID0gQnVmZmVyLmNvbmNhdChbZmlsdGVyZWQsIHZlY3RvclNjYWxlLCBwYWNrZWRWZWN0b3JdLm1hcCh4ID0+IGNib3IuZW5jb2RlKHgpKSlcbiAgICAvLyB3cml0ZSBvdXQgdGhlIG5ldyBkZWZpbml0aW9uIGRhdGEgdG8gdGhlIGNvcnJlY3Qgc2hhcmRcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5mcy5lbnN1cmVGaWxlKHNoYXJkUGF0aClcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5mcy5hcHBlbmRGaWxlKHNoYXJkUGF0aCwgYXBwZW5kRGF0YSlcbiAgfVxuXG4gIC8vIGxvb2t1cCBhIHdvcmQgaW4gdGhlIHZlY3RvciBsaWJyYXJ5XG4gIGFzeW5jIGxvb2t1cChzdHJpbmdXb3JkKSB7XG4gICAgLy8gZ3JhYiBpbmZvIGFib3V0IHRoaXMgd29yZFxuICAgIGxldCB7IHBhdGg6IHNoYXJkUGF0aCwgZmlsdGVyZWQgfSA9IGF3YWl0IHRoaXMuZ2V0V29yZEluZm8oc3RyaW5nV29yZClcbiAgICAvLyBsb2FkIHNoYXJkIGRhdGFcbiAgICBsZXQgc2hhcmREYXRhID0gY2Jvci5kZWNvZGVBbGwoYXdhaXQgdGhpcy5jb25maWcuZnMucmVhZEZpbGUoc2hhcmRQYXRoKSlcbiAgICAvLyBpdGVyYXRlIHRocm91Z2ggZW50cmllcyBpbiB0aGlzIHNoYXJkIHVudGlsIHdlIGZpbmQgYSBtYXRjaFxuICAgIGZvciAobGV0IFtjaHVua1dvcmQsIHZlY3RvclNjYWxlLCBwYWNrZWRWZWN0b3JdIG9mIGZzdXRpbC5jaHVua0l0ZXJhYmxlKHNoYXJkRGF0YSwgMykpIHtcbiAgICAgIGlmIChmaWx0ZXJlZCA9PSBjaHVua1dvcmQpIHtcbiAgICAgICAgbGV0IHNjYWxlZFZlY3RvciA9IGZzdXRpbC51bnBhY2tGbG9hdHMocGFja2VkVmVjdG9yLCB0aGlzLnNldHRpbmdzLnZlY3RvckJpdHMsIHRoaXMuc2V0dGluZ3MudmVjdG9yU2l6ZSlcbiAgICAgICAgcmV0dXJuIHNjYWxlZFZlY3Rvci5tYXAoeCA9PiB4ICogdmVjdG9yU2NhbGUpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gZmluaXNoIHdyaXRpbmcgdG8gYSB2ZWN0b3IgbGlicmFyeVxuICBhc3luYyBzYXZlKCkge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmZzLndyaXRlRmlsZShgJHt0aGlzLmNvbmZpZy5wYXRofS9zZXR0aW5ncy5qc29uYCwgZnN1dGlsLmVuY29kZVVURjgoSlNPTi5zdHJpbmdpZnkodGhpcy5zZXR0aW5ncywgbnVsbCwgMikpKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yTGlicmFyeSIsIi8vIFRoaXMgaXMgYSBzaW1wbGUgb2JqZWN0IGZ1bGwgb2YgdXNlZnVsIHZlY3RvciBtYW5pcHVsYXRpb24gZnVuY3Rpb25zXG5jb25zdCBWVSA9IHtcbiAgLy8gYWRkIGEgYnVuY2ggb2YgdmVjdG9ycyB0b2dldGhlclxuICBhZGQ6ICguLi52ZWN0b3JzKT0+IHZlY3RvcnMucmVkdWNlKChhLGIpPT4gYS5tYXAoKG51bSwgaWR4KT0+IG51bSArIGJbaWR4XSkpLFxuXG4gIC8vIG11bHRpcGx5IGEgbGlzdCBvZiB2ZWN0b3JzIHRvZ2V0aGVyXG4gIG11bHRpcGx5OiAobGlzdCwgbXVsKT0+XG4gICAgbGlzdC5tYXAoKGxlZnQpPT4gbGVmdC5tYXAoKG4sIGkpPT4gbiAqIG11bFtpXSkpLFxuXG4gIC8vIG1lYW4gYXZlcmFnZSB0aGUgdmVjdG9ycyB0b2dldGhlclxuICBtZWFuOiAoLi4ubGlzdCk9PiBWVS5tdWx0aXBseShbVlUuYWRkKC4uLmxpc3QpXSwgVlUuYnVpbGQoMSAvIGxpc3QubGVuZ3RoLCBsaXN0WzBdLmxlbmd0aCkpWzBdLFxuXG4gIC8vIGJ1aWxkIGEgbmV3IHZlY3RvciwgY29udGFpbmluZyB2YWx1ZSBmb3IgZXZlcnkgZW50cnksIHdpdGggc2l6ZSBtYW55IGRpbWVuc2lvbnNcbiAgYnVpbGQ6ICh2YWx1ZSwgc2l6ZSk9PiB7XG4gICAgbGV0IGZpbmFsID0gW11cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykgZmluYWwucHVzaCh2YWx1ZSlcbiAgICByZXR1cm4gZmluYWxcbiAgfSxcblxuICAvLyBjYWxjdWxhdGUgc3F1YXJlZCBFdWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjdG9ycywgYWRhcHRlZCBmcm9tIGhvdyB0ZW5zb3JmbG93LWpzIGRvZXMgaXRcbiAgZGlzdGFuY2VTcXVhcmVkOiAoYSwgYik9PiB7XG4gICAgbGV0IHJlc3VsdCA9IDBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpZmYgPSBhW2ldIC0gYltpXVxuICAgICAgcmVzdWx0ICs9IGRpZmYgKiBkaWZmXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICAvLyBjYWxjdWxhdGUgaG93IGRpZmZlcmVudCB0aGUgbWVhbmluZyBvZiB0aGUgd29yZHMgaW4gdGhlIGxpc3QgaXMgZnJvbSB0aGUgYXZlcmFnZSBvZiBhbGwgb2YgdGhlbVxuICAvLyByZXR1cm5zIGFuIGFycmF5IG9mIGRpc3RhbmNlcyBmcm9tIHRoZSBtZWFuXG4gIGRpdmVyc2l0eTogKC4uLnZlY3RvcnMpPT4ge1xuICAgIC8vIHNraXAgaWYgdGhlcmUgYXJlIDAgb3IgMSB2ZWN0b3JzXG4gICAgaWYgKHZlY3RvcnMubGVuZ3RoIDw9IDEpIHJldHVybiBbMF1cbiAgICAvLyBmaXJzdCBhdmVyYWdlIGFsbCB0aGUgdmVjdG9ycyB0b2dldGhlclxuICAgIGxldCBtZWFuVmVjdG9yID0gVlUubWVhbiguLi52ZWN0b3JzKVxuICAgIC8vIGNhbGN1bGF0ZSBob3cgZmFyIGZyb20gdGhlIGNlbnRlciBwb2ludCBlYWNoIHZlY3RvciBpc1xuICAgIHJldHVybiB2ZWN0b3JzLm1hcCh2ID0+IFZVLmRpc3RhbmNlU3F1YXJlZCh2LCBtZWFuVmVjdG9yKSlcbiAgfSxcbn1cblxuaWYgKHR5cGVvZihtb2R1bGUpID09ICdvYmplY3QnKVxuICBtb2R1bGUuZXhwb3J0cyA9IFZVIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcbmV4cG9ydHMudG9CeXRlQXJyYXkgPSB0b0J5dGVBcnJheVxuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheVxuXG52YXIgbG9va3VwID0gW11cbnZhciByZXZMb29rdXAgPSBbXVxudmFyIEFyciA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyA/IFVpbnQ4QXJyYXkgOiBBcnJheVxuXG52YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgbG9va3VwW2ldID0gY29kZVtpXVxuICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbn1cblxuLy8gU3VwcG9ydCBkZWNvZGluZyBVUkwtc2FmZSBiYXNlNjQgc3RyaW5ncywgYXMgTm9kZS5qcyBkb2VzLlxuLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVVJMX2FwcGxpY2F0aW9uc1xucmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG5yZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcblxuZnVuY3Rpb24gZ2V0TGVucyAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIFRyaW0gb2ZmIGV4dHJhIGJ5dGVzIGFmdGVyIHBsYWNlaG9sZGVyIGJ5dGVzIGFyZSBmb3VuZFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZWF0Z2FtbWl0L2Jhc2U2NC1qcy9pc3N1ZXMvNDJcbiAgdmFyIHZhbGlkTGVuID0gYjY0LmluZGV4T2YoJz0nKVxuICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlblxuXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSB2YWxpZExlbiA9PT0gbGVuXG4gICAgPyAwXG4gICAgOiA0IC0gKHZhbGlkTGVuICUgNClcblxuICByZXR1cm4gW3ZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW5dXG59XG5cbi8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoYjY0KSB7XG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIF9ieXRlTGVuZ3RoIChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG5cbiAgdmFyIGFyciA9IG5ldyBBcnIoX2J5dGVMZW5ndGgoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSlcblxuICB2YXIgY3VyQnl0ZSA9IDBcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIHZhciBsZW4gPSBwbGFjZUhvbGRlcnNMZW4gPiAwXG4gICAgPyB2YWxpZExlbiAtIDRcbiAgICA6IHZhbGlkTGVuXG5cbiAgdmFyIGlcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgMTIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8XG4gICAgICByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMikge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDEpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCA0KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPVxuICAgICAgKCh1aW50OFtpXSA8PCAxNikgJiAweEZGMDAwMCkgK1xuICAgICAgKCh1aW50OFtpICsgMV0gPDwgOCkgJiAweEZGMDApICtcbiAgICAgICh1aW50OFtpICsgMl0gJiAweEZGKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKFxuICAgICAgdWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKVxuICAgICkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAyXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdICtcbiAgICAgICc9PSdcbiAgICApXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArIHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMTBdICtcbiAgICAgIGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXSArXG4gICAgICAnPSdcbiAgICApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIjsoZnVuY3Rpb24gKGdsb2JhbE9iamVjdCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbi8qXHJcbiAqICAgICAgYmlnbnVtYmVyLmpzIHY5LjAuMFxyXG4gKiAgICAgIEEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBhcmJpdHJhcnktcHJlY2lzaW9uIGFyaXRobWV0aWMuXHJcbiAqICAgICAgaHR0cHM6Ly9naXRodWIuY29tL01pa2VNY2wvYmlnbnVtYmVyLmpzXHJcbiAqICAgICAgQ29weXJpZ2h0IChjKSAyMDE5IE1pY2hhZWwgTWNsYXVnaGxpbiA8TThjaDg4bEBnbWFpbC5jb20+XHJcbiAqICAgICAgTUlUIExpY2Vuc2VkLlxyXG4gKlxyXG4gKiAgICAgIEJpZ051bWJlci5wcm90b3R5cGUgbWV0aG9kcyAgICAgfCAgQmlnTnVtYmVyIG1ldGhvZHNcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBhYnNvbHV0ZVZhbHVlICAgICAgICAgICAgYWJzICAgIHwgIGNsb25lXHJcbiAqICAgICAgY29tcGFyZWRUbyAgICAgICAgICAgICAgICAgICAgICB8ICBjb25maWcgICAgICAgICAgICAgICBzZXRcclxuICogICAgICBkZWNpbWFsUGxhY2VzICAgICAgICAgICAgZHAgICAgIHwgICAgICBERUNJTUFMX1BMQUNFU1xyXG4gKiAgICAgIGRpdmlkZWRCeSAgICAgICAgICAgICAgICBkaXYgICAgfCAgICAgIFJPVU5ESU5HX01PREVcclxuICogICAgICBkaXZpZGVkVG9JbnRlZ2VyQnkgICAgICAgaWRpdiAgIHwgICAgICBFWFBPTkVOVElBTF9BVFxyXG4gKiAgICAgIGV4cG9uZW50aWF0ZWRCeSAgICAgICAgICBwb3cgICAgfCAgICAgIFJBTkdFXHJcbiAqICAgICAgaW50ZWdlclZhbHVlICAgICAgICAgICAgICAgICAgICB8ICAgICAgQ1JZUFRPXHJcbiAqICAgICAgaXNFcXVhbFRvICAgICAgICAgICAgICAgIGVxICAgICB8ICAgICAgTU9EVUxPX01PREVcclxuICogICAgICBpc0Zpbml0ZSAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICBQT1dfUFJFQ0lTSU9OXHJcbiAqICAgICAgaXNHcmVhdGVyVGhhbiAgICAgICAgICAgIGd0ICAgICB8ICAgICAgRk9STUFUXHJcbiAqICAgICAgaXNHcmVhdGVyVGhhbk9yRXF1YWxUbyAgIGd0ZSAgICB8ICAgICAgQUxQSEFCRVRcclxuICogICAgICBpc0ludGVnZXIgICAgICAgICAgICAgICAgICAgICAgIHwgIGlzQmlnTnVtYmVyXHJcbiAqICAgICAgaXNMZXNzVGhhbiAgICAgICAgICAgICAgIGx0ICAgICB8ICBtYXhpbXVtICAgICAgICAgICAgICBtYXhcclxuICogICAgICBpc0xlc3NUaGFuT3JFcXVhbFRvICAgICAgbHRlICAgIHwgIG1pbmltdW0gICAgICAgICAgICAgIG1pblxyXG4gKiAgICAgIGlzTmFOICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgcmFuZG9tXHJcbiAqICAgICAgaXNOZWdhdGl2ZSAgICAgICAgICAgICAgICAgICAgICB8ICBzdW1cclxuICogICAgICBpc1Bvc2l0aXZlICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBpc1plcm8gICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBtaW51cyAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBtb2R1bG8gICAgICAgICAgICAgICAgICAgbW9kICAgIHxcclxuICogICAgICBtdWx0aXBsaWVkQnkgICAgICAgICAgICAgdGltZXMgIHxcclxuICogICAgICBuZWdhdGVkICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBwbHVzICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBwcmVjaXNpb24gICAgICAgICAgICAgICAgc2QgICAgIHxcclxuICogICAgICBzaGlmdGVkQnkgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICBzcXVhcmVSb290ICAgICAgICAgICAgICAgc3FydCAgIHxcclxuICogICAgICB0b0V4cG9uZW50aWFsICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0ZpeGVkICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0Zvcm1hdCAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0ZyYWN0aW9uICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b0pTT04gICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b051bWJlciAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b1ByZWNpc2lvbiAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB0b1N0cmluZyAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICogICAgICB2YWx1ZU9mICAgICAgICAgICAgICAgICAgICAgICAgIHxcclxuICpcclxuICovXHJcblxyXG5cclxuICB2YXIgQmlnTnVtYmVyLFxyXG4gICAgaXNOdW1lcmljID0gL14tPyg/OlxcZCsoPzpcXC5cXGQqKT98XFwuXFxkKykoPzplWystXT9cXGQrKT8kL2ksXHJcbiAgICBtYXRoY2VpbCA9IE1hdGguY2VpbCxcclxuICAgIG1hdGhmbG9vciA9IE1hdGguZmxvb3IsXHJcblxyXG4gICAgYmlnbnVtYmVyRXJyb3IgPSAnW0JpZ051bWJlciBFcnJvcl0gJyxcclxuICAgIHRvb01hbnlEaWdpdHMgPSBiaWdudW1iZXJFcnJvciArICdOdW1iZXIgcHJpbWl0aXZlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzOiAnLFxyXG5cclxuICAgIEJBU0UgPSAxZTE0LFxyXG4gICAgTE9HX0JBU0UgPSAxNCxcclxuICAgIE1BWF9TQUZFX0lOVEVHRVIgPSAweDFmZmZmZmZmZmZmZmZmLCAgICAgICAgIC8vIDJeNTMgLSAxXHJcbiAgICAvLyBNQVhfSU5UMzIgPSAweDdmZmZmZmZmLCAgICAgICAgICAgICAgICAgICAvLyAyXjMxIC0gMVxyXG4gICAgUE9XU19URU4gPSBbMSwgMTAsIDEwMCwgMWUzLCAxZTQsIDFlNSwgMWU2LCAxZTcsIDFlOCwgMWU5LCAxZTEwLCAxZTExLCAxZTEyLCAxZTEzXSxcclxuICAgIFNRUlRfQkFTRSA9IDFlNyxcclxuXHJcbiAgICAvLyBFRElUQUJMRVxyXG4gICAgLy8gVGhlIGxpbWl0IG9uIHRoZSB2YWx1ZSBvZiBERUNJTUFMX1BMQUNFUywgVE9fRVhQX05FRywgVE9fRVhQX1BPUywgTUlOX0VYUCwgTUFYX0VYUCwgYW5kXHJcbiAgICAvLyB0aGUgYXJndW1lbnRzIHRvIHRvRXhwb25lbnRpYWwsIHRvRml4ZWQsIHRvRm9ybWF0LCBhbmQgdG9QcmVjaXNpb24uXHJcbiAgICBNQVggPSAxRTk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWF9JTlQzMlxyXG5cclxuXHJcbiAgLypcclxuICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIEJpZ051bWJlciBjb25zdHJ1Y3Rvci5cclxuICAgKi9cclxuICBmdW5jdGlvbiBjbG9uZShjb25maWdPYmplY3QpIHtcclxuICAgIHZhciBkaXYsIGNvbnZlcnRCYXNlLCBwYXJzZU51bWVyaWMsXHJcbiAgICAgIFAgPSBCaWdOdW1iZXIucHJvdG90eXBlID0geyBjb25zdHJ1Y3RvcjogQmlnTnVtYmVyLCB0b1N0cmluZzogbnVsbCwgdmFsdWVPZjogbnVsbCB9LFxyXG4gICAgICBPTkUgPSBuZXcgQmlnTnVtYmVyKDEpLFxyXG5cclxuXHJcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRURJVEFCTEUgQ09ORklHIERFRkFVTFRTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblxyXG4gICAgICAvLyBUaGUgZGVmYXVsdCB2YWx1ZXMgYmVsb3cgbXVzdCBiZSBpbnRlZ2VycyB3aXRoaW4gdGhlIGluY2x1c2l2ZSByYW5nZXMgc3RhdGVkLlxyXG4gICAgICAvLyBUaGUgdmFsdWVzIGNhbiBhbHNvIGJlIGNoYW5nZWQgYXQgcnVuLXRpbWUgdXNpbmcgQmlnTnVtYmVyLnNldC5cclxuXHJcbiAgICAgIC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlcyBmb3Igb3BlcmF0aW9ucyBpbnZvbHZpbmcgZGl2aXNpb24uXHJcbiAgICAgIERFQ0lNQUxfUExBQ0VTID0gMjAsICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhcclxuXHJcbiAgICAgIC8vIFRoZSByb3VuZGluZyBtb2RlIHVzZWQgd2hlbiByb3VuZGluZyB0byB0aGUgYWJvdmUgZGVjaW1hbCBwbGFjZXMsIGFuZCB3aGVuIHVzaW5nXHJcbiAgICAgIC8vIHRvRXhwb25lbnRpYWwsIHRvRml4ZWQsIHRvRm9ybWF0IGFuZCB0b1ByZWNpc2lvbiwgYW5kIHJvdW5kIChkZWZhdWx0IHZhbHVlKS5cclxuICAgICAgLy8gVVAgICAgICAgICAwIEF3YXkgZnJvbSB6ZXJvLlxyXG4gICAgICAvLyBET1dOICAgICAgIDEgVG93YXJkcyB6ZXJvLlxyXG4gICAgICAvLyBDRUlMICAgICAgIDIgVG93YXJkcyArSW5maW5pdHkuXHJcbiAgICAgIC8vIEZMT09SICAgICAgMyBUb3dhcmRzIC1JbmZpbml0eS5cclxuICAgICAgLy8gSEFMRl9VUCAgICA0IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB1cC5cclxuICAgICAgLy8gSEFMRl9ET1dOICA1IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCBkb3duLlxyXG4gICAgICAvLyBIQUxGX0VWRU4gIDYgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgZXZlbiBuZWlnaGJvdXIuXHJcbiAgICAgIC8vIEhBTEZfQ0VJTCAgNyBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdG93YXJkcyArSW5maW5pdHkuXHJcbiAgICAgIC8vIEhBTEZfRkxPT1IgOCBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdG93YXJkcyAtSW5maW5pdHkuXHJcbiAgICAgIFJPVU5ESU5HX01PREUgPSA0LCAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byA4XHJcblxyXG4gICAgICAvLyBFWFBPTkVOVElBTF9BVCA6IFtUT19FWFBfTkVHICwgVE9fRVhQX1BPU11cclxuXHJcbiAgICAgIC8vIFRoZSBleHBvbmVudCB2YWx1ZSBhdCBhbmQgYmVuZWF0aCB3aGljaCB0b1N0cmluZyByZXR1cm5zIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAvLyBOdW1iZXIgdHlwZTogLTdcclxuICAgICAgVE9fRVhQX05FRyA9IC03LCAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIC1NQVhcclxuXHJcbiAgICAgIC8vIFRoZSBleHBvbmVudCB2YWx1ZSBhdCBhbmQgYWJvdmUgd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgLy8gTnVtYmVyIHR5cGU6IDIxXHJcbiAgICAgIFRPX0VYUF9QT1MgPSAyMSwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhcclxuXHJcbiAgICAgIC8vIFJBTkdFIDogW01JTl9FWFAsIE1BWF9FWFBdXHJcblxyXG4gICAgICAvLyBUaGUgbWluaW11bSBleHBvbmVudCB2YWx1ZSwgYmVuZWF0aCB3aGljaCB1bmRlcmZsb3cgdG8gemVybyBvY2N1cnMuXHJcbiAgICAgIC8vIE51bWJlciB0eXBlOiAtMzI0ICAoNWUtMzI0KVxyXG4gICAgICBNSU5fRVhQID0gLTFlNywgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0xIHRvIC1NQVhcclxuXHJcbiAgICAgIC8vIFRoZSBtYXhpbXVtIGV4cG9uZW50IHZhbHVlLCBhYm92ZSB3aGljaCBvdmVyZmxvdyB0byBJbmZpbml0eSBvY2N1cnMuXHJcbiAgICAgIC8vIE51bWJlciB0eXBlOiAgMzA4ICAoMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDgpXHJcbiAgICAgIC8vIEZvciBNQVhfRVhQID4gMWU3LCBlLmcuIG5ldyBCaWdOdW1iZXIoJzFlMTAwMDAwMDAwJykucGx1cygxKSBtYXkgYmUgc2xvdy5cclxuICAgICAgTUFYX0VYUCA9IDFlNywgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAxIHRvIE1BWFxyXG5cclxuICAgICAgLy8gV2hldGhlciB0byB1c2UgY3J5cHRvZ3JhcGhpY2FsbHktc2VjdXJlIHJhbmRvbSBudW1iZXIgZ2VuZXJhdGlvbiwgaWYgYXZhaWxhYmxlLlxyXG4gICAgICBDUllQVE8gPSBmYWxzZSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRydWUgb3IgZmFsc2VcclxuXHJcbiAgICAgIC8vIFRoZSBtb2R1bG8gbW9kZSB1c2VkIHdoZW4gY2FsY3VsYXRpbmcgdGhlIG1vZHVsdXM6IGEgbW9kIG4uXHJcbiAgICAgIC8vIFRoZSBxdW90aWVudCAocSA9IGEgLyBuKSBpcyBjYWxjdWxhdGVkIGFjY29yZGluZyB0byB0aGUgY29ycmVzcG9uZGluZyByb3VuZGluZyBtb2RlLlxyXG4gICAgICAvLyBUaGUgcmVtYWluZGVyIChyKSBpcyBjYWxjdWxhdGVkIGFzOiByID0gYSAtIG4gKiBxLlxyXG4gICAgICAvL1xyXG4gICAgICAvLyBVUCAgICAgICAgMCBUaGUgcmVtYWluZGVyIGlzIHBvc2l0aXZlIGlmIHRoZSBkaXZpZGVuZCBpcyBuZWdhdGl2ZSwgZWxzZSBpcyBuZWdhdGl2ZS5cclxuICAgICAgLy8gRE9XTiAgICAgIDEgVGhlIHJlbWFpbmRlciBoYXMgdGhlIHNhbWUgc2lnbiBhcyB0aGUgZGl2aWRlbmQuXHJcbiAgICAgIC8vICAgICAgICAgICAgIFRoaXMgbW9kdWxvIG1vZGUgaXMgY29tbW9ubHkga25vd24gYXMgJ3RydW5jYXRlZCBkaXZpc2lvbicgYW5kIGlzXHJcbiAgICAgIC8vICAgICAgICAgICAgIGVxdWl2YWxlbnQgdG8gKGEgJSBuKSBpbiBKYXZhU2NyaXB0LlxyXG4gICAgICAvLyBGTE9PUiAgICAgMyBUaGUgcmVtYWluZGVyIGhhcyB0aGUgc2FtZSBzaWduIGFzIHRoZSBkaXZpc29yIChQeXRob24gJSkuXHJcbiAgICAgIC8vIEhBTEZfRVZFTiA2IFRoaXMgbW9kdWxvIG1vZGUgaW1wbGVtZW50cyB0aGUgSUVFRSA3NTQgcmVtYWluZGVyIGZ1bmN0aW9uLlxyXG4gICAgICAvLyBFVUNMSUQgICAgOSBFdWNsaWRpYW4gZGl2aXNpb24uIHEgPSBzaWduKG4pICogZmxvb3IoYSAvIGFicyhuKSkuXHJcbiAgICAgIC8vICAgICAgICAgICAgIFRoZSByZW1haW5kZXIgaXMgYWx3YXlzIHBvc2l0aXZlLlxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUaGUgdHJ1bmNhdGVkIGRpdmlzaW9uLCBmbG9vcmVkIGRpdmlzaW9uLCBFdWNsaWRpYW4gZGl2aXNpb24gYW5kIElFRUUgNzU0IHJlbWFpbmRlclxyXG4gICAgICAvLyBtb2RlcyBhcmUgY29tbW9ubHkgdXNlZCBmb3IgdGhlIG1vZHVsdXMgb3BlcmF0aW9uLlxyXG4gICAgICAvLyBBbHRob3VnaCB0aGUgb3RoZXIgcm91bmRpbmcgbW9kZXMgY2FuIGFsc28gYmUgdXNlZCwgdGhleSBtYXkgbm90IGdpdmUgdXNlZnVsIHJlc3VsdHMuXHJcbiAgICAgIE1PRFVMT19NT0RFID0gMSwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byA5XHJcblxyXG4gICAgICAvLyBUaGUgbWF4aW11bSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzIG9mIHRoZSByZXN1bHQgb2YgdGhlIGV4cG9uZW50aWF0ZWRCeSBvcGVyYXRpb24uXHJcbiAgICAgIC8vIElmIFBPV19QUkVDSVNJT04gaXMgMCwgdGhlcmUgd2lsbCBiZSB1bmxpbWl0ZWQgc2lnbmlmaWNhbnQgZGlnaXRzLlxyXG4gICAgICBQT1dfUFJFQ0lTSU9OID0gMCwgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAvLyBUaGUgZm9ybWF0IHNwZWNpZmljYXRpb24gdXNlZCBieSB0aGUgQmlnTnVtYmVyLnByb3RvdHlwZS50b0Zvcm1hdCBtZXRob2QuXHJcbiAgICAgIEZPUk1BVCA9IHtcclxuICAgICAgICBwcmVmaXg6ICcnLFxyXG4gICAgICAgIGdyb3VwU2l6ZTogMyxcclxuICAgICAgICBzZWNvbmRhcnlHcm91cFNpemU6IDAsXHJcbiAgICAgICAgZ3JvdXBTZXBhcmF0b3I6ICcsJyxcclxuICAgICAgICBkZWNpbWFsU2VwYXJhdG9yOiAnLicsXHJcbiAgICAgICAgZnJhY3Rpb25Hcm91cFNpemU6IDAsXHJcbiAgICAgICAgZnJhY3Rpb25Hcm91cFNlcGFyYXRvcjogJ1xceEEwJywgICAgICAvLyBub24tYnJlYWtpbmcgc3BhY2VcclxuICAgICAgICBzdWZmaXg6ICcnXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBUaGUgYWxwaGFiZXQgdXNlZCBmb3IgYmFzZSBjb252ZXJzaW9uLiBJdCBtdXN0IGJlIGF0IGxlYXN0IDIgY2hhcmFjdGVycyBsb25nLCB3aXRoIG5vICcrJyxcclxuICAgICAgLy8gJy0nLCAnLicsIHdoaXRlc3BhY2UsIG9yIHJlcGVhdGVkIGNoYXJhY3Rlci5cclxuICAgICAgLy8gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJF8nXHJcbiAgICAgIEFMUEhBQkVUID0gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eic7XHJcblxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cclxuICAgIC8vIENPTlNUUlVDVE9SXHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBUaGUgQmlnTnVtYmVyIGNvbnN0cnVjdG9yIGFuZCBleHBvcnRlZCBmdW5jdGlvbi5cclxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgbmV3IGluc3RhbmNlIG9mIGEgQmlnTnVtYmVyIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiB2IHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gQSBudW1lcmljIHZhbHVlLlxyXG4gICAgICogW2JdIHtudW1iZXJ9IFRoZSBiYXNlIG9mIHYuIEludGVnZXIsIDIgdG8gQUxQSEFCRVQubGVuZ3RoIGluY2x1c2l2ZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gQmlnTnVtYmVyKHYsIGIpIHtcclxuICAgICAgdmFyIGFscGhhYmV0LCBjLCBjYXNlQ2hhbmdlZCwgZSwgaSwgaXNOdW0sIGxlbiwgc3RyLFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgLy8gRW5hYmxlIGNvbnN0cnVjdG9yIGNhbGwgd2l0aG91dCBgbmV3YC5cclxuICAgICAgaWYgKCEoeCBpbnN0YW5jZW9mIEJpZ051bWJlcikpIHJldHVybiBuZXcgQmlnTnVtYmVyKHYsIGIpO1xyXG5cclxuICAgICAgaWYgKGIgPT0gbnVsbCkge1xyXG5cclxuICAgICAgICBpZiAodiAmJiB2Ll9pc0JpZ051bWJlciA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgeC5zID0gdi5zO1xyXG5cclxuICAgICAgICAgIGlmICghdi5jIHx8IHYuZSA+IE1BWF9FWFApIHtcclxuICAgICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodi5lIDwgTUlOX0VYUCkge1xyXG4gICAgICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB4LmUgPSB2LmU7XHJcbiAgICAgICAgICAgIHguYyA9IHYuYy5zbGljZSgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgoaXNOdW0gPSB0eXBlb2YgdiA9PSAnbnVtYmVyJykgJiYgdiAqIDAgPT0gMCkge1xyXG5cclxuICAgICAgICAgIC8vIFVzZSBgMSAvIG5gIHRvIGhhbmRsZSBtaW51cyB6ZXJvIGFsc28uXHJcbiAgICAgICAgICB4LnMgPSAxIC8gdiA8IDAgPyAodiA9IC12LCAtMSkgOiAxO1xyXG5cclxuICAgICAgICAgIC8vIEZhc3QgcGF0aCBmb3IgaW50ZWdlcnMsIHdoZXJlIG4gPCAyMTQ3NDgzNjQ4ICgyKiozMSkuXHJcbiAgICAgICAgICBpZiAodiA9PT0gfn52KSB7XHJcbiAgICAgICAgICAgIGZvciAoZSA9IDAsIGkgPSB2OyBpID49IDEwOyBpIC89IDEwLCBlKyspO1xyXG5cclxuICAgICAgICAgICAgaWYgKGUgPiBNQVhfRVhQKSB7XHJcbiAgICAgICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB4LmUgPSBlO1xyXG4gICAgICAgICAgICAgIHguYyA9IFt2XTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHN0ciA9IFN0cmluZyh2KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIGlmICghaXNOdW1lcmljLnRlc3Qoc3RyID0gU3RyaW5nKHYpKSkgcmV0dXJuIHBhcnNlTnVtZXJpYyh4LCBzdHIsIGlzTnVtKTtcclxuXHJcbiAgICAgICAgICB4LnMgPSBzdHIuY2hhckNvZGVBdCgwKSA9PSA0NSA/IChzdHIgPSBzdHIuc2xpY2UoMSksIC0xKSA6IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZWNpbWFsIHBvaW50P1xyXG4gICAgICAgIGlmICgoZSA9IHN0ci5pbmRleE9mKCcuJykpID4gLTEpIHN0ciA9IHN0ci5yZXBsYWNlKCcuJywgJycpO1xyXG5cclxuICAgICAgICAvLyBFeHBvbmVudGlhbCBmb3JtP1xyXG4gICAgICAgIGlmICgoaSA9IHN0ci5zZWFyY2goL2UvaSkpID4gMCkge1xyXG5cclxuICAgICAgICAgIC8vIERldGVybWluZSBleHBvbmVudC5cclxuICAgICAgICAgIGlmIChlIDwgMCkgZSA9IGk7XHJcbiAgICAgICAgICBlICs9ICtzdHIuc2xpY2UoaSArIDEpO1xyXG4gICAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCBpKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGUgPCAwKSB7XHJcblxyXG4gICAgICAgICAgLy8gSW50ZWdlci5cclxuICAgICAgICAgIGUgPSBzdHIubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBCYXNlIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtifSdcclxuICAgICAgICBpbnRDaGVjayhiLCAyLCBBTFBIQUJFVC5sZW5ndGgsICdCYXNlJyk7XHJcblxyXG4gICAgICAgIC8vIEFsbG93IGV4cG9uZW50aWFsIG5vdGF0aW9uIHRvIGJlIHVzZWQgd2l0aCBiYXNlIDEwIGFyZ3VtZW50LCB3aGlsZVxyXG4gICAgICAgIC8vIGFsc28gcm91bmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYXMgd2l0aCBvdGhlciBiYXNlcy5cclxuICAgICAgICBpZiAoYiA9PSAxMCkge1xyXG4gICAgICAgICAgeCA9IG5ldyBCaWdOdW1iZXIodik7XHJcbiAgICAgICAgICByZXR1cm4gcm91bmQoeCwgREVDSU1BTF9QTEFDRVMgKyB4LmUgKyAxLCBST1VORElOR19NT0RFKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0ciA9IFN0cmluZyh2KTtcclxuXHJcbiAgICAgICAgaWYgKGlzTnVtID0gdHlwZW9mIHYgPT0gJ251bWJlcicpIHtcclxuXHJcbiAgICAgICAgICAvLyBBdm9pZCBwb3RlbnRpYWwgaW50ZXJwcmV0YXRpb24gb2YgSW5maW5pdHkgYW5kIE5hTiBhcyBiYXNlIDQ0KyB2YWx1ZXMuXHJcbiAgICAgICAgICBpZiAodiAqIDAgIT0gMCkgcmV0dXJuIHBhcnNlTnVtZXJpYyh4LCBzdHIsIGlzTnVtLCBiKTtcclxuXHJcbiAgICAgICAgICB4LnMgPSAxIC8gdiA8IDAgPyAoc3RyID0gc3RyLnNsaWNlKDEpLCAtMSkgOiAxO1xyXG5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOdW1iZXIgcHJpbWl0aXZlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzOiB7bn0nXHJcbiAgICAgICAgICBpZiAoQmlnTnVtYmVyLkRFQlVHICYmIHN0ci5yZXBsYWNlKC9eMFxcLjAqfFxcLi8sICcnKS5sZW5ndGggPiAxNSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKHRvb01hbnlEaWdpdHMgKyB2KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeC5zID0gc3RyLmNoYXJDb2RlQXQoMCkgPT09IDQ1ID8gKHN0ciA9IHN0ci5zbGljZSgxKSwgLTEpIDogMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFscGhhYmV0ID0gQUxQSEFCRVQuc2xpY2UoMCwgYik7XHJcbiAgICAgICAgZSA9IGkgPSAwO1xyXG5cclxuICAgICAgICAvLyBDaGVjayB0aGF0IHN0ciBpcyBhIHZhbGlkIGJhc2UgYiBudW1iZXIuXHJcbiAgICAgICAgLy8gRG9uJ3QgdXNlIFJlZ0V4cCwgc28gYWxwaGFiZXQgY2FuIGNvbnRhaW4gc3BlY2lhbCBjaGFyYWN0ZXJzLlxyXG4gICAgICAgIGZvciAobGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAoYWxwaGFiZXQuaW5kZXhPZihjID0gc3RyLmNoYXJBdChpKSkgPCAwKSB7XHJcbiAgICAgICAgICAgIGlmIChjID09ICcuJykge1xyXG5cclxuICAgICAgICAgICAgICAvLyBJZiAnLicgaXMgbm90IHRoZSBmaXJzdCBjaGFyYWN0ZXIgYW5kIGl0IGhhcyBub3QgYmUgZm91bmQgYmVmb3JlLlxyXG4gICAgICAgICAgICAgIGlmIChpID4gZSkge1xyXG4gICAgICAgICAgICAgICAgZSA9IGxlbjtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICghY2FzZUNoYW5nZWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQWxsb3cgZS5nLiBoZXhhZGVjaW1hbCAnRkYnIGFzIHdlbGwgYXMgJ2ZmJy5cclxuICAgICAgICAgICAgICBpZiAoc3RyID09IHN0ci50b1VwcGVyQ2FzZSgpICYmIChzdHIgPSBzdHIudG9Mb3dlckNhc2UoKSkgfHxcclxuICAgICAgICAgICAgICAgICAgc3RyID09IHN0ci50b0xvd2VyQ2FzZSgpICYmIChzdHIgPSBzdHIudG9VcHBlckNhc2UoKSkpIHtcclxuICAgICAgICAgICAgICAgIGNhc2VDaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGkgPSAtMTtcclxuICAgICAgICAgICAgICAgIGUgPSAwO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VOdW1lcmljKHgsIFN0cmluZyh2KSwgaXNOdW0sIGIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHJldmVudCBsYXRlciBjaGVjayBmb3IgbGVuZ3RoIG9uIGNvbnZlcnRlZCBudW1iZXIuXHJcbiAgICAgICAgaXNOdW0gPSBmYWxzZTtcclxuICAgICAgICBzdHIgPSBjb252ZXJ0QmFzZShzdHIsIGIsIDEwLCB4LnMpO1xyXG5cclxuICAgICAgICAvLyBEZWNpbWFsIHBvaW50P1xyXG4gICAgICAgIGlmICgoZSA9IHN0ci5pbmRleE9mKCcuJykpID4gLTEpIHN0ciA9IHN0ci5yZXBsYWNlKCcuJywgJycpO1xyXG4gICAgICAgIGVsc2UgZSA9IHN0ci5sZW5ndGg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIERldGVybWluZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKGkgPSAwOyBzdHIuY2hhckNvZGVBdChpKSA9PT0gNDg7IGkrKyk7XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgIGZvciAobGVuID0gc3RyLmxlbmd0aDsgc3RyLmNoYXJDb2RlQXQoLS1sZW4pID09PSA0ODspO1xyXG5cclxuICAgICAgaWYgKHN0ciA9IHN0ci5zbGljZShpLCArK2xlbikpIHtcclxuICAgICAgICBsZW4gLT0gaTtcclxuXHJcbiAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIE51bWJlciBwcmltaXRpdmUgaGFzIG1vcmUgdGhhbiAxNSBzaWduaWZpY2FudCBkaWdpdHM6IHtufSdcclxuICAgICAgICBpZiAoaXNOdW0gJiYgQmlnTnVtYmVyLkRFQlVHICYmXHJcbiAgICAgICAgICBsZW4gPiAxNSAmJiAodiA+IE1BWF9TQUZFX0lOVEVHRVIgfHwgdiAhPT0gbWF0aGZsb29yKHYpKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKHRvb01hbnlEaWdpdHMgKyAoeC5zICogdikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgIC8vIE92ZXJmbG93P1xyXG4gICAgICAgIGlmICgoZSA9IGUgLSBpIC0gMSkgPiBNQVhfRVhQKSB7XHJcblxyXG4gICAgICAgICAgLy8gSW5maW5pdHkuXHJcbiAgICAgICAgICB4LmMgPSB4LmUgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBVbmRlcmZsb3c/XHJcbiAgICAgICAgfSBlbHNlIGlmIChlIDwgTUlOX0VYUCkge1xyXG5cclxuICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHguZSA9IGU7XHJcbiAgICAgICAgICB4LmMgPSBbXTtcclxuXHJcbiAgICAgICAgICAvLyBUcmFuc2Zvcm0gYmFzZVxyXG5cclxuICAgICAgICAgIC8vIGUgaXMgdGhlIGJhc2UgMTAgZXhwb25lbnQuXHJcbiAgICAgICAgICAvLyBpIGlzIHdoZXJlIHRvIHNsaWNlIHN0ciB0byBnZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgdGhlIGNvZWZmaWNpZW50IGFycmF5LlxyXG4gICAgICAgICAgaSA9IChlICsgMSkgJSBMT0dfQkFTRTtcclxuICAgICAgICAgIGlmIChlIDwgMCkgaSArPSBMT0dfQkFTRTsgIC8vIGkgPCAxXHJcblxyXG4gICAgICAgICAgaWYgKGkgPCBsZW4pIHtcclxuICAgICAgICAgICAgaWYgKGkpIHguYy5wdXNoKCtzdHIuc2xpY2UoMCwgaSkpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZW4gLT0gTE9HX0JBU0U7IGkgPCBsZW47KSB7XHJcbiAgICAgICAgICAgICAgeC5jLnB1c2goK3N0ci5zbGljZShpLCBpICs9IExPR19CQVNFKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGkgPSBMT0dfQkFTRSAtIChzdHIgPSBzdHIuc2xpY2UoaSkpLmxlbmd0aDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGkgLT0gbGVuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGZvciAoOyBpLS07IHN0ciArPSAnMCcpO1xyXG4gICAgICAgICAgeC5jLnB1c2goK3N0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgIHguYyA9IFt4LmUgPSAwXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBDT05TVFJVQ1RPUiBQUk9QRVJUSUVTXHJcblxyXG5cclxuICAgIEJpZ051bWJlci5jbG9uZSA9IGNsb25lO1xyXG5cclxuICAgIEJpZ051bWJlci5ST1VORF9VUCA9IDA7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfRE9XTiA9IDE7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfQ0VJTCA9IDI7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfRkxPT1IgPSAzO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfVVAgPSA0O1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRE9XTiA9IDU7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9FVkVOID0gNjtcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX0NFSUwgPSA3O1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRkxPT1IgPSA4O1xyXG4gICAgQmlnTnVtYmVyLkVVQ0xJRCA9IDk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBDb25maWd1cmUgaW5mcmVxdWVudGx5LWNoYW5naW5nIGxpYnJhcnktd2lkZSBzZXR0aW5ncy5cclxuICAgICAqXHJcbiAgICAgKiBBY2NlcHQgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBvcHRpb25hbCBwcm9wZXJ0aWVzIChpZiB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpc1xyXG4gICAgICogYSBudW1iZXIsIGl0IG11c3QgYmUgYW4gaW50ZWdlciB3aXRoaW4gdGhlIGluY2x1c2l2ZSByYW5nZSBzdGF0ZWQpOlxyXG4gICAgICpcclxuICAgICAqICAgREVDSU1BTF9QTEFDRVMgICB7bnVtYmVyfSAgICAgICAgICAgMCB0byBNQVhcclxuICAgICAqICAgUk9VTkRJTkdfTU9ERSAgICB7bnVtYmVyfSAgICAgICAgICAgMCB0byA4XHJcbiAgICAgKiAgIEVYUE9ORU5USUFMX0FUICAge251bWJlcnxudW1iZXJbXX0gIC1NQVggdG8gTUFYICBvciAgWy1NQVggdG8gMCwgMCB0byBNQVhdXHJcbiAgICAgKiAgIFJBTkdFICAgICAgICAgICAge251bWJlcnxudW1iZXJbXX0gIC1NQVggdG8gTUFYIChub3QgemVybykgIG9yICBbLU1BWCB0byAtMSwgMSB0byBNQVhdXHJcbiAgICAgKiAgIENSWVBUTyAgICAgICAgICAge2Jvb2xlYW59ICAgICAgICAgIHRydWUgb3IgZmFsc2VcclxuICAgICAqICAgTU9EVUxPX01PREUgICAgICB7bnVtYmVyfSAgICAgICAgICAgMCB0byA5XHJcbiAgICAgKiAgIFBPV19QUkVDSVNJT04gICAgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gTUFYXHJcbiAgICAgKiAgIEFMUEhBQkVUICAgICAgICAge3N0cmluZ30gICAgICAgICAgIEEgc3RyaW5nIG9mIHR3byBvciBtb3JlIHVuaXF1ZSBjaGFyYWN0ZXJzIHdoaWNoIGRvZXNcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90IGNvbnRhaW4gJy4nLlxyXG4gICAgICogICBGT1JNQVQgICAgICAgICAgIHtvYmplY3R9ICAgICAgICAgICBBbiBvYmplY3Qgd2l0aCBzb21lIG9mIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcclxuICAgICAqICAgICBwcmVmaXggICAgICAgICAgICAgICAgIHtzdHJpbmd9XHJcbiAgICAgKiAgICAgZ3JvdXBTaXplICAgICAgICAgICAgICB7bnVtYmVyfVxyXG4gICAgICogICAgIHNlY29uZGFyeUdyb3VwU2l6ZSAgICAge251bWJlcn1cclxuICAgICAqICAgICBncm91cFNlcGFyYXRvciAgICAgICAgIHtzdHJpbmd9XHJcbiAgICAgKiAgICAgZGVjaW1hbFNlcGFyYXRvciAgICAgICB7c3RyaW5nfVxyXG4gICAgICogICAgIGZyYWN0aW9uR3JvdXBTaXplICAgICAge251bWJlcn1cclxuICAgICAqICAgICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yIHtzdHJpbmd9XHJcbiAgICAgKiAgICAgc3VmZml4ICAgICAgICAgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICpcclxuICAgICAqIChUaGUgdmFsdWVzIGFzc2lnbmVkIHRvIHRoZSBhYm92ZSBGT1JNQVQgb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBjaGVja2VkIGZvciB2YWxpZGl0eS4pXHJcbiAgICAgKlxyXG4gICAgICogRS5nLlxyXG4gICAgICogQmlnTnVtYmVyLmNvbmZpZyh7IERFQ0lNQUxfUExBQ0VTIDogMjAsIFJPVU5ESU5HX01PREUgOiA0IH0pXHJcbiAgICAgKlxyXG4gICAgICogSWdub3JlIHByb3BlcnRpZXMvcGFyYW1ldGVycyBzZXQgdG8gbnVsbCBvciB1bmRlZmluZWQsIGV4Y2VwdCBmb3IgQUxQSEFCRVQuXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGFuIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIGN1cnJlbnQgdmFsdWVzLlxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIuY29uZmlnID0gQmlnTnVtYmVyLnNldCA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgdmFyIHAsIHY7XHJcblxyXG4gICAgICBpZiAob2JqICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT0gJ29iamVjdCcpIHtcclxuXHJcbiAgICAgICAgICAvLyBERUNJTUFMX1BMQUNFUyB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gREVDSU1BTF9QTEFDRVMge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0RFQ0lNQUxfUExBQ0VTJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaW50Q2hlY2sodiwgMCwgTUFYLCBwKTtcclxuICAgICAgICAgICAgREVDSU1BTF9QTEFDRVMgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJPVU5ESU5HX01PREUge251bWJlcn0gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBST1VORElOR19NT0RFIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdST1VORElOR19NT0RFJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaW50Q2hlY2sodiwgMCwgOCwgcCk7XHJcbiAgICAgICAgICAgIFJPVU5ESU5HX01PREUgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEVYUE9ORU5USUFMX0FUIHtudW1iZXJ8bnVtYmVyW119XHJcbiAgICAgICAgICAvLyBJbnRlZ2VyLCAtTUFYIHRvIE1BWCBpbmNsdXNpdmUgb3JcclxuICAgICAgICAgIC8vIFtpbnRlZ2VyIC1NQVggdG8gMCBpbmNsdXNpdmUsIDAgdG8gTUFYIGluY2x1c2l2ZV0uXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gRVhQT05FTlRJQUxfQVQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0VYUE9ORU5USUFMX0FUJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaWYgKHYgJiYgdi5wb3ApIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzBdLCAtTUFYLCAwLCBwKTtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzFdLCAwLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIFRPX0VYUF9ORUcgPSB2WzBdO1xyXG4gICAgICAgICAgICAgIFRPX0VYUF9QT1MgPSB2WzFdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGludENoZWNrKHYsIC1NQVgsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgICAgVE9fRVhQX05FRyA9IC0oVE9fRVhQX1BPUyA9IHYgPCAwID8gLXYgOiB2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJBTkdFIHtudW1iZXJ8bnVtYmVyW119IE5vbi16ZXJvIGludGVnZXIsIC1NQVggdG8gTUFYIGluY2x1c2l2ZSBvclxyXG4gICAgICAgICAgLy8gW2ludGVnZXIgLU1BWCB0byAtMSBpbmNsdXNpdmUsIGludGVnZXIgMSB0byBNQVggaW5jbHVzaXZlXS5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBSQU5HRSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V8Y2Fubm90IGJlIHplcm99OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnUkFOR0UnKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpZiAodiAmJiB2LnBvcCkge1xyXG4gICAgICAgICAgICAgIGludENoZWNrKHZbMF0sIC1NQVgsIC0xLCBwKTtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzFdLCAxLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIE1JTl9FWFAgPSB2WzBdO1xyXG4gICAgICAgICAgICAgIE1BWF9FWFAgPSB2WzFdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGludENoZWNrKHYsIC1NQVgsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgICAgIE1JTl9FWFAgPSAtKE1BWF9FWFAgPSB2IDwgMCA/IC12IDogdik7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgcCArICcgY2Fubm90IGJlIHplcm86ICcgKyB2KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDUllQVE8ge2Jvb2xlYW59IHRydWUgb3IgZmFsc2UuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQ1JZUFRPIG5vdCB0cnVlIG9yIGZhbHNlOiB7dn0nXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gY3J5cHRvIHVuYXZhaWxhYmxlJ1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0NSWVBUTycpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGlmICh2ID09PSAhIXYpIHtcclxuICAgICAgICAgICAgICBpZiAodikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjcnlwdG8gIT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvICYmXHJcbiAgICAgICAgICAgICAgICAgKGNyeXB0by5nZXRSYW5kb21WYWx1ZXMgfHwgY3J5cHRvLnJhbmRvbUJ5dGVzKSkge1xyXG4gICAgICAgICAgICAgICAgICBDUllQVE8gPSB2O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgQ1JZUFRPID0gIXY7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnY3J5cHRvIHVuYXZhaWxhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIENSWVBUTyA9IHY7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArIHAgKyAnIG5vdCB0cnVlIG9yIGZhbHNlOiAnICsgdik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBNT0RVTE9fTU9ERSB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIDkgaW5jbHVzaXZlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIE1PRFVMT19NT0RFIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdNT0RVTE9fTU9ERScpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIDksIHApO1xyXG4gICAgICAgICAgICBNT0RVTE9fTU9ERSA9IHY7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUE9XX1BSRUNJU0lPTiB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gUE9XX1BSRUNJU0lPTiB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnUE9XX1BSRUNJU0lPTicpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgIFBPV19QUkVDSVNJT04gPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEZPUk1BVCB7b2JqZWN0fVxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIEZPUk1BVCBub3QgYW4gb2JqZWN0OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnRk9STUFUJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSBGT1JNQVQgPSB2O1xyXG4gICAgICAgICAgICBlbHNlIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyBwICsgJyBub3QgYW4gb2JqZWN0OiAnICsgdik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQUxQSEFCRVQge3N0cmluZ31cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBBTFBIQUJFVCBpbnZhbGlkOiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnQUxQSEFCRVQnKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG5cclxuICAgICAgICAgICAgLy8gRGlzYWxsb3cgaWYgb25seSBvbmUgY2hhcmFjdGVyLFxyXG4gICAgICAgICAgICAvLyBvciBpZiBpdCBjb250YWlucyAnKycsICctJywgJy4nLCB3aGl0ZXNwYWNlLCBvciBhIHJlcGVhdGVkIGNoYXJhY3Rlci5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09ICdzdHJpbmcnICYmICEvXi4kfFsrLS5cXHNdfCguKS4qXFwxLy50ZXN0KHYpKSB7XHJcbiAgICAgICAgICAgICAgQUxQSEFCRVQgPSB2O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArIHAgKyAnIGludmFsaWQ6ICcgKyB2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBPYmplY3QgZXhwZWN0ZWQ6IHt2fSdcclxuICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ09iamVjdCBleHBlY3RlZDogJyArIG9iaik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIERFQ0lNQUxfUExBQ0VTOiBERUNJTUFMX1BMQUNFUyxcclxuICAgICAgICBST1VORElOR19NT0RFOiBST1VORElOR19NT0RFLFxyXG4gICAgICAgIEVYUE9ORU5USUFMX0FUOiBbVE9fRVhQX05FRywgVE9fRVhQX1BPU10sXHJcbiAgICAgICAgUkFOR0U6IFtNSU5fRVhQLCBNQVhfRVhQXSxcclxuICAgICAgICBDUllQVE86IENSWVBUTyxcclxuICAgICAgICBNT0RVTE9fTU9ERTogTU9EVUxPX01PREUsXHJcbiAgICAgICAgUE9XX1BSRUNJU0lPTjogUE9XX1BSRUNJU0lPTixcclxuICAgICAgICBGT1JNQVQ6IEZPUk1BVCxcclxuICAgICAgICBBTFBIQUJFVDogQUxQSEFCRVRcclxuICAgICAgfTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB2IGlzIGEgQmlnTnVtYmVyIGluc3RhbmNlLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICpcclxuICAgICAqIElmIEJpZ051bWJlci5ERUJVRyBpcyB0cnVlLCB0aHJvdyBpZiBhIEJpZ051bWJlciBpbnN0YW5jZSBpcyBub3Qgd2VsbC1mb3JtZWQuXHJcbiAgICAgKlxyXG4gICAgICogdiB7YW55fVxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBJbnZhbGlkIEJpZ051bWJlcjoge3Z9J1xyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIuaXNCaWdOdW1iZXIgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICBpZiAoIXYgfHwgdi5faXNCaWdOdW1iZXIgIT09IHRydWUpIHJldHVybiBmYWxzZTtcclxuICAgICAgaWYgKCFCaWdOdW1iZXIuREVCVUcpIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgdmFyIGksIG4sXHJcbiAgICAgICAgYyA9IHYuYyxcclxuICAgICAgICBlID0gdi5lLFxyXG4gICAgICAgIHMgPSB2LnM7XHJcblxyXG4gICAgICBvdXQ6IGlmICh7fS50b1N0cmluZy5jYWxsKGMpID09ICdbb2JqZWN0IEFycmF5XScpIHtcclxuXHJcbiAgICAgICAgaWYgKChzID09PSAxIHx8IHMgPT09IC0xKSAmJiBlID49IC1NQVggJiYgZSA8PSBNQVggJiYgZSA9PT0gbWF0aGZsb29yKGUpKSB7XHJcblxyXG4gICAgICAgICAgLy8gSWYgdGhlIGZpcnN0IGVsZW1lbnQgaXMgemVybywgdGhlIEJpZ051bWJlciB2YWx1ZSBtdXN0IGJlIHplcm8uXHJcbiAgICAgICAgICBpZiAoY1swXSA9PT0gMCkge1xyXG4gICAgICAgICAgICBpZiAoZSA9PT0gMCAmJiBjLmxlbmd0aCA9PT0gMSkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGJyZWFrIG91dDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDYWxjdWxhdGUgbnVtYmVyIG9mIGRpZ2l0cyB0aGF0IGNbMF0gc2hvdWxkIGhhdmUsIGJhc2VkIG9uIHRoZSBleHBvbmVudC5cclxuICAgICAgICAgIGkgPSAoZSArIDEpICUgTE9HX0JBU0U7XHJcbiAgICAgICAgICBpZiAoaSA8IDEpIGkgKz0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIG51bWJlciBvZiBkaWdpdHMgb2YgY1swXS5cclxuICAgICAgICAgIC8vaWYgKE1hdGguY2VpbChNYXRoLmxvZyhjWzBdICsgMSkgLyBNYXRoLkxOMTApID09IGkpIHtcclxuICAgICAgICAgIGlmIChTdHJpbmcoY1swXSkubGVuZ3RoID09IGkpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgbiA9IGNbaV07XHJcbiAgICAgICAgICAgICAgaWYgKG4gPCAwIHx8IG4gPj0gQkFTRSB8fCBuICE9PSBtYXRoZmxvb3IobikpIGJyZWFrIG91dDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTGFzdCBlbGVtZW50IGNhbm5vdCBiZSB6ZXJvLCB1bmxlc3MgaXQgaXMgdGhlIG9ubHkgZWxlbWVudC5cclxuICAgICAgICAgICAgaWYgKG4gIT09IDApIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIC8vIEluZmluaXR5L05hTlxyXG4gICAgICB9IGVsc2UgaWYgKGMgPT09IG51bGwgJiYgZSA9PT0gbnVsbCAmJiAocyA9PT0gbnVsbCB8fCBzID09PSAxIHx8IHMgPT09IC0xKSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgIChiaWdudW1iZXJFcnJvciArICdJbnZhbGlkIEJpZ051bWJlcjogJyArIHYpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIG1heGltdW0gb2YgdGhlIGFyZ3VtZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBhcmd1bWVudHMge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIubWF4aW11bSA9IEJpZ051bWJlci5tYXggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBtYXhPck1pbihhcmd1bWVudHMsIFAubHQpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIG1pbmltdW0gb2YgdGhlIGFyZ3VtZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBhcmd1bWVudHMge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIubWluaW11bSA9IEJpZ051bWJlci5taW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBtYXhPck1pbihhcmd1bWVudHMsIFAuZ3QpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2l0aCBhIHJhbmRvbSB2YWx1ZSBlcXVhbCB0byBvciBncmVhdGVyIHRoYW4gMCBhbmQgbGVzcyB0aGFuIDEsXHJcbiAgICAgKiBhbmQgd2l0aCBkcCwgb3IgREVDSU1BTF9QTEFDRVMgaWYgZHAgaXMgb21pdHRlZCwgZGVjaW1hbCBwbGFjZXMgKG9yIGxlc3MgaWYgdHJhaWxpbmdcclxuICAgICAqIHplcm9zIGFyZSBwcm9kdWNlZCkuXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7ZHB9J1xyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIGNyeXB0byB1bmF2YWlsYWJsZSdcclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLnJhbmRvbSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBwb3cyXzUzID0gMHgyMDAwMDAwMDAwMDAwMDtcclxuXHJcbiAgICAgIC8vIFJldHVybiBhIDUzIGJpdCBpbnRlZ2VyIG4sIHdoZXJlIDAgPD0gbiA8IDkwMDcxOTkyNTQ3NDA5OTIuXHJcbiAgICAgIC8vIENoZWNrIGlmIE1hdGgucmFuZG9tKCkgcHJvZHVjZXMgbW9yZSB0aGFuIDMyIGJpdHMgb2YgcmFuZG9tbmVzcy5cclxuICAgICAgLy8gSWYgaXQgZG9lcywgYXNzdW1lIGF0IGxlYXN0IDUzIGJpdHMgYXJlIHByb2R1Y2VkLCBvdGhlcndpc2UgYXNzdW1lIGF0IGxlYXN0IDMwIGJpdHMuXHJcbiAgICAgIC8vIDB4NDAwMDAwMDAgaXMgMl4zMCwgMHg4MDAwMDAgaXMgMl4yMywgMHgxZmZmZmYgaXMgMl4yMSAtIDEuXHJcbiAgICAgIHZhciByYW5kb201M2JpdEludCA9IChNYXRoLnJhbmRvbSgpICogcG93Ml81MykgJiAweDFmZmZmZlxyXG4gICAgICAgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBtYXRoZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvdzJfNTMpOyB9XHJcbiAgICAgICA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICgoTWF0aC5yYW5kb20oKSAqIDB4NDAwMDAwMDAgfCAwKSAqIDB4ODAwMDAwKSArXHJcbiAgICAgICAgIChNYXRoLnJhbmRvbSgpICogMHg4MDAwMDAgfCAwKTsgfTtcclxuXHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZHApIHtcclxuICAgICAgICB2YXIgYSwgYiwgZSwgaywgdixcclxuICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgYyA9IFtdLFxyXG4gICAgICAgICAgcmFuZCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuXHJcbiAgICAgICAgaWYgKGRwID09IG51bGwpIGRwID0gREVDSU1BTF9QTEFDRVM7XHJcbiAgICAgICAgZWxzZSBpbnRDaGVjayhkcCwgMCwgTUFYKTtcclxuXHJcbiAgICAgICAgayA9IG1hdGhjZWlsKGRwIC8gTE9HX0JBU0UpO1xyXG5cclxuICAgICAgICBpZiAoQ1JZUFRPKSB7XHJcblxyXG4gICAgICAgICAgLy8gQnJvd3NlcnMgc3VwcG9ydGluZyBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzLlxyXG4gICAgICAgICAgaWYgKGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGEgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50MzJBcnJheShrICo9IDIpKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgazspIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gNTMgYml0czpcclxuICAgICAgICAgICAgICAvLyAoKE1hdGgucG93KDIsIDMyKSAtIDEpICogTWF0aC5wb3coMiwgMjEpKS50b1N0cmluZygyKVxyXG4gICAgICAgICAgICAgIC8vIDExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExIDExMTAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwXHJcbiAgICAgICAgICAgICAgLy8gKChNYXRoLnBvdygyLCAzMikgLSAxKSA+Pj4gMTEpLnRvU3RyaW5nKDIpXHJcbiAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMTExMTEgMTExMTExMTEgMTExMTExMTFcclxuICAgICAgICAgICAgICAvLyAweDIwMDAwIGlzIDJeMjEuXHJcbiAgICAgICAgICAgICAgdiA9IGFbaV0gKiAweDIwMDAwICsgKGFbaSArIDFdID4+PiAxMSk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFJlamVjdGlvbiBzYW1wbGluZzpcclxuICAgICAgICAgICAgICAvLyAwIDw9IHYgPCA5MDA3MTk5MjU0NzQwOTkyXHJcbiAgICAgICAgICAgICAgLy8gUHJvYmFiaWxpdHkgdGhhdCB2ID49IDllMTUsIGlzXHJcbiAgICAgICAgICAgICAgLy8gNzE5OTI1NDc0MDk5MiAvIDkwMDcxOTkyNTQ3NDA5OTIgfj0gMC4wMDA4LCBpLmUuIDEgaW4gMTI1MVxyXG4gICAgICAgICAgICAgIGlmICh2ID49IDllMTUpIHtcclxuICAgICAgICAgICAgICAgIGIgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50MzJBcnJheSgyKSk7XHJcbiAgICAgICAgICAgICAgICBhW2ldID0gYlswXTtcclxuICAgICAgICAgICAgICAgIGFbaSArIDFdID0gYlsxXTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIDAgPD0gdiA8PSA4OTk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICAvLyAwIDw9ICh2ICUgMWUxNCkgPD0gOTk5OTk5OTk5OTk5OTlcclxuICAgICAgICAgICAgICAgIGMucHVzaCh2ICUgMWUxNCk7XHJcbiAgICAgICAgICAgICAgICBpICs9IDI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkgPSBrIC8gMjtcclxuXHJcbiAgICAgICAgICAvLyBOb2RlLmpzIHN1cHBvcnRpbmcgY3J5cHRvLnJhbmRvbUJ5dGVzLlxyXG4gICAgICAgICAgfSBlbHNlIGlmIChjcnlwdG8ucmFuZG9tQnl0ZXMpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJ1ZmZlclxyXG4gICAgICAgICAgICBhID0gY3J5cHRvLnJhbmRvbUJ5dGVzKGsgKj0gNyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGs7KSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIDB4MTAwMDAwMDAwMDAwMCBpcyAyXjQ4LCAweDEwMDAwMDAwMDAwIGlzIDJeNDBcclxuICAgICAgICAgICAgICAvLyAweDEwMDAwMDAwMCBpcyAyXjMyLCAweDEwMDAwMDAgaXMgMl4yNFxyXG4gICAgICAgICAgICAgIC8vIDExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExXHJcbiAgICAgICAgICAgICAgLy8gMCA8PSB2IDwgOTAwNzE5OTI1NDc0MDk5MlxyXG4gICAgICAgICAgICAgIHYgPSAoKGFbaV0gJiAzMSkgKiAweDEwMDAwMDAwMDAwMDApICsgKGFbaSArIDFdICogMHgxMDAwMDAwMDAwMCkgK1xyXG4gICAgICAgICAgICAgICAgIChhW2kgKyAyXSAqIDB4MTAwMDAwMDAwKSArIChhW2kgKyAzXSAqIDB4MTAwMDAwMCkgK1xyXG4gICAgICAgICAgICAgICAgIChhW2kgKyA0XSA8PCAxNikgKyAoYVtpICsgNV0gPDwgOCkgKyBhW2kgKyA2XTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKHYgPj0gOWUxNSkge1xyXG4gICAgICAgICAgICAgICAgY3J5cHRvLnJhbmRvbUJ5dGVzKDcpLmNvcHkoYSwgaSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAwIDw9ICh2ICUgMWUxNCkgPD0gOTk5OTk5OTk5OTk5OTlcclxuICAgICAgICAgICAgICAgIGMucHVzaCh2ICUgMWUxNCk7XHJcbiAgICAgICAgICAgICAgICBpICs9IDc7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkgPSBrIC8gNztcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIENSWVBUTyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ2NyeXB0byB1bmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVXNlIE1hdGgucmFuZG9tLlxyXG4gICAgICAgIGlmICghQ1JZUFRPKSB7XHJcblxyXG4gICAgICAgICAgZm9yICg7IGkgPCBrOykge1xyXG4gICAgICAgICAgICB2ID0gcmFuZG9tNTNiaXRJbnQoKTtcclxuICAgICAgICAgICAgaWYgKHYgPCA5ZTE1KSBjW2krK10gPSB2ICUgMWUxNDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGsgPSBjWy0taV07XHJcbiAgICAgICAgZHAgJT0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgIC8vIENvbnZlcnQgdHJhaWxpbmcgZGlnaXRzIHRvIHplcm9zIGFjY29yZGluZyB0byBkcC5cclxuICAgICAgICBpZiAoayAmJiBkcCkge1xyXG4gICAgICAgICAgdiA9IFBPV1NfVEVOW0xPR19CQVNFIC0gZHBdO1xyXG4gICAgICAgICAgY1tpXSA9IG1hdGhmbG9vcihrIC8gdikgKiB2O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIGVsZW1lbnRzIHdoaWNoIGFyZSB6ZXJvLlxyXG4gICAgICAgIGZvciAoOyBjW2ldID09PSAwOyBjLnBvcCgpLCBpLS0pO1xyXG5cclxuICAgICAgICAvLyBaZXJvP1xyXG4gICAgICAgIGlmIChpIDwgMCkge1xyXG4gICAgICAgICAgYyA9IFtlID0gMF07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgbGVhZGluZyBlbGVtZW50cyB3aGljaCBhcmUgemVybyBhbmQgYWRqdXN0IGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgICAgICAgZm9yIChlID0gLTEgOyBjWzBdID09PSAwOyBjLnNwbGljZSgwLCAxKSwgZSAtPSBMT0dfQkFTRSk7XHJcblxyXG4gICAgICAgICAgLy8gQ291bnQgdGhlIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudCBvZiBjIHRvIGRldGVybWluZSBsZWFkaW5nIHplcm9zLCBhbmQuLi5cclxuICAgICAgICAgIGZvciAoaSA9IDEsIHYgPSBjWzBdOyB2ID49IDEwOyB2IC89IDEwLCBpKyspO1xyXG5cclxuICAgICAgICAgIC8vIGFkanVzdCB0aGUgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgICAgICBpZiAoaSA8IExPR19CQVNFKSBlIC09IExPR19CQVNFIC0gaTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJhbmQuZSA9IGU7XHJcbiAgICAgICAgcmFuZC5jID0gYztcclxuICAgICAgICByZXR1cm4gcmFuZDtcclxuICAgICAgfTtcclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHN1bSBvZiB0aGUgYXJndW1lbnRzLlxyXG4gICAgICpcclxuICAgICAqIGFyZ3VtZW50cyB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIEJpZ051bWJlci5zdW0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBpID0gMSxcclxuICAgICAgICBhcmdzID0gYXJndW1lbnRzLFxyXG4gICAgICAgIHN1bSA9IG5ldyBCaWdOdW1iZXIoYXJnc1swXSk7XHJcbiAgICAgIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7KSBzdW0gPSBzdW0ucGx1cyhhcmdzW2krK10pO1xyXG4gICAgICByZXR1cm4gc3VtO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8gUFJJVkFURSBGVU5DVElPTlNcclxuXHJcblxyXG4gICAgLy8gQ2FsbGVkIGJ5IEJpZ051bWJlciBhbmQgQmlnTnVtYmVyLnByb3RvdHlwZS50b1N0cmluZy5cclxuICAgIGNvbnZlcnRCYXNlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGRlY2ltYWwgPSAnMDEyMzQ1Njc4OSc7XHJcblxyXG4gICAgICAvKlxyXG4gICAgICAgKiBDb252ZXJ0IHN0cmluZyBvZiBiYXNlSW4gdG8gYW4gYXJyYXkgb2YgbnVtYmVycyBvZiBiYXNlT3V0LlxyXG4gICAgICAgKiBFZy4gdG9CYXNlT3V0KCcyNTUnLCAxMCwgMTYpIHJldHVybnMgWzE1LCAxNV0uXHJcbiAgICAgICAqIEVnLiB0b0Jhc2VPdXQoJ2ZmJywgMTYsIDEwKSByZXR1cm5zIFsyLCA1LCA1XS5cclxuICAgICAgICovXHJcbiAgICAgIGZ1bmN0aW9uIHRvQmFzZU91dChzdHIsIGJhc2VJbiwgYmFzZU91dCwgYWxwaGFiZXQpIHtcclxuICAgICAgICB2YXIgaixcclxuICAgICAgICAgIGFyciA9IFswXSxcclxuICAgICAgICAgIGFyckwsXHJcbiAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAgIGZvciAoOyBpIDwgbGVuOykge1xyXG4gICAgICAgICAgZm9yIChhcnJMID0gYXJyLmxlbmd0aDsgYXJyTC0tOyBhcnJbYXJyTF0gKj0gYmFzZUluKTtcclxuXHJcbiAgICAgICAgICBhcnJbMF0gKz0gYWxwaGFiZXQuaW5kZXhPZihzdHIuY2hhckF0KGkrKykpO1xyXG5cclxuICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBhcnIubGVuZ3RoOyBqKyspIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcnJbal0gPiBiYXNlT3V0IC0gMSkge1xyXG4gICAgICAgICAgICAgIGlmIChhcnJbaiArIDFdID09IG51bGwpIGFycltqICsgMV0gPSAwO1xyXG4gICAgICAgICAgICAgIGFycltqICsgMV0gKz0gYXJyW2pdIC8gYmFzZU91dCB8IDA7XHJcbiAgICAgICAgICAgICAgYXJyW2pdICU9IGJhc2VPdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnIucmV2ZXJzZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBDb252ZXJ0IGEgbnVtZXJpYyBzdHJpbmcgb2YgYmFzZUluIHRvIGEgbnVtZXJpYyBzdHJpbmcgb2YgYmFzZU91dC5cclxuICAgICAgLy8gSWYgdGhlIGNhbGxlciBpcyB0b1N0cmluZywgd2UgYXJlIGNvbnZlcnRpbmcgZnJvbSBiYXNlIDEwIHRvIGJhc2VPdXQuXHJcbiAgICAgIC8vIElmIHRoZSBjYWxsZXIgaXMgQmlnTnVtYmVyLCB3ZSBhcmUgY29udmVydGluZyBmcm9tIGJhc2VJbiB0byBiYXNlIDEwLlxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHN0ciwgYmFzZUluLCBiYXNlT3V0LCBzaWduLCBjYWxsZXJJc1RvU3RyaW5nKSB7XHJcbiAgICAgICAgdmFyIGFscGhhYmV0LCBkLCBlLCBrLCByLCB4LCB4YywgeSxcclxuICAgICAgICAgIGkgPSBzdHIuaW5kZXhPZignLicpLFxyXG4gICAgICAgICAgZHAgPSBERUNJTUFMX1BMQUNFUyxcclxuICAgICAgICAgIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuXHJcbiAgICAgICAgLy8gTm9uLWludGVnZXIuXHJcbiAgICAgICAgaWYgKGkgPj0gMCkge1xyXG4gICAgICAgICAgayA9IFBPV19QUkVDSVNJT047XHJcblxyXG4gICAgICAgICAgLy8gVW5saW1pdGVkIHByZWNpc2lvbi5cclxuICAgICAgICAgIFBPV19QUkVDSVNJT04gPSAwO1xyXG4gICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoJy4nLCAnJyk7XHJcbiAgICAgICAgICB5ID0gbmV3IEJpZ051bWJlcihiYXNlSW4pO1xyXG4gICAgICAgICAgeCA9IHkucG93KHN0ci5sZW5ndGggLSBpKTtcclxuICAgICAgICAgIFBPV19QUkVDSVNJT04gPSBrO1xyXG5cclxuICAgICAgICAgIC8vIENvbnZlcnQgc3RyIGFzIGlmIGFuIGludGVnZXIsIHRoZW4gcmVzdG9yZSB0aGUgZnJhY3Rpb24gcGFydCBieSBkaXZpZGluZyB0aGVcclxuICAgICAgICAgIC8vIHJlc3VsdCBieSBpdHMgYmFzZSByYWlzZWQgdG8gYSBwb3dlci5cclxuXHJcbiAgICAgICAgICB5LmMgPSB0b0Jhc2VPdXQodG9GaXhlZFBvaW50KGNvZWZmVG9TdHJpbmcoeC5jKSwgeC5lLCAnMCcpLFxyXG4gICAgICAgICAgIDEwLCBiYXNlT3V0LCBkZWNpbWFsKTtcclxuICAgICAgICAgIHkuZSA9IHkuYy5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb252ZXJ0IHRoZSBudW1iZXIgYXMgaW50ZWdlci5cclxuXHJcbiAgICAgICAgeGMgPSB0b0Jhc2VPdXQoc3RyLCBiYXNlSW4sIGJhc2VPdXQsIGNhbGxlcklzVG9TdHJpbmdcclxuICAgICAgICAgPyAoYWxwaGFiZXQgPSBBTFBIQUJFVCwgZGVjaW1hbClcclxuICAgICAgICAgOiAoYWxwaGFiZXQgPSBkZWNpbWFsLCBBTFBIQUJFVCkpO1xyXG5cclxuICAgICAgICAvLyB4YyBub3cgcmVwcmVzZW50cyBzdHIgYXMgYW4gaW50ZWdlciBhbmQgY29udmVydGVkIHRvIGJhc2VPdXQuIGUgaXMgdGhlIGV4cG9uZW50LlxyXG4gICAgICAgIGUgPSBrID0geGMubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yICg7IHhjWy0ta10gPT0gMDsgeGMucG9wKCkpO1xyXG5cclxuICAgICAgICAvLyBaZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0pIHJldHVybiBhbHBoYWJldC5jaGFyQXQoMCk7XHJcblxyXG4gICAgICAgIC8vIERvZXMgc3RyIHJlcHJlc2VudCBhbiBpbnRlZ2VyPyBJZiBzbywgbm8gbmVlZCBmb3IgdGhlIGRpdmlzaW9uLlxyXG4gICAgICAgIGlmIChpIDwgMCkge1xyXG4gICAgICAgICAgLS1lO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4LmMgPSB4YztcclxuICAgICAgICAgIHguZSA9IGU7XHJcblxyXG4gICAgICAgICAgLy8gVGhlIHNpZ24gaXMgbmVlZGVkIGZvciBjb3JyZWN0IHJvdW5kaW5nLlxyXG4gICAgICAgICAgeC5zID0gc2lnbjtcclxuICAgICAgICAgIHggPSBkaXYoeCwgeSwgZHAsIHJtLCBiYXNlT3V0KTtcclxuICAgICAgICAgIHhjID0geC5jO1xyXG4gICAgICAgICAgciA9IHgucjtcclxuICAgICAgICAgIGUgPSB4LmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB4YyBub3cgcmVwcmVzZW50cyBzdHIgY29udmVydGVkIHRvIGJhc2VPdXQuXHJcblxyXG4gICAgICAgIC8vIFRIZSBpbmRleCBvZiB0aGUgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgZCA9IGUgKyBkcCArIDE7XHJcblxyXG4gICAgICAgIC8vIFRoZSByb3VuZGluZyBkaWdpdDogdGhlIGRpZ2l0IHRvIHRoZSByaWdodCBvZiB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgICAgICBpID0geGNbZF07XHJcblxyXG4gICAgICAgIC8vIExvb2sgYXQgdGhlIHJvdW5kaW5nIGRpZ2l0cyBhbmQgbW9kZSB0byBkZXRlcm1pbmUgd2hldGhlciB0byByb3VuZCB1cC5cclxuXHJcbiAgICAgICAgayA9IGJhc2VPdXQgLyAyO1xyXG4gICAgICAgIHIgPSByIHx8IGQgPCAwIHx8IHhjW2QgKyAxXSAhPSBudWxsO1xyXG5cclxuICAgICAgICByID0gcm0gPCA0ID8gKGkgIT0gbnVsbCB8fCByKSAmJiAocm0gPT0gMCB8fCBybSA9PSAoeC5zIDwgMCA/IDMgOiAyKSlcclxuICAgICAgICAgICAgICA6IGkgPiBrIHx8IGkgPT0gayAmJihybSA9PSA0IHx8IHIgfHwgcm0gPT0gNiAmJiB4Y1tkIC0gMV0gJiAxIHx8XHJcbiAgICAgICAgICAgICAgIHJtID09ICh4LnMgPCAwID8gOCA6IDcpKTtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlIGluZGV4IG9mIHRoZSByb3VuZGluZyBkaWdpdCBpcyBub3QgZ3JlYXRlciB0aGFuIHplcm8sIG9yIHhjIHJlcHJlc2VudHNcclxuICAgICAgICAvLyB6ZXJvLCB0aGVuIHRoZSByZXN1bHQgb2YgdGhlIGJhc2UgY29udmVyc2lvbiBpcyB6ZXJvIG9yLCBpZiByb3VuZGluZyB1cCwgYSB2YWx1ZVxyXG4gICAgICAgIC8vIHN1Y2ggYXMgMC4wMDAwMS5cclxuICAgICAgICBpZiAoZCA8IDEgfHwgIXhjWzBdKSB7XHJcblxyXG4gICAgICAgICAgLy8gMV4tZHAgb3IgMFxyXG4gICAgICAgICAgc3RyID0gciA/IHRvRml4ZWRQb2ludChhbHBoYWJldC5jaGFyQXQoMSksIC1kcCwgYWxwaGFiZXQuY2hhckF0KDApKSA6IGFscGhhYmV0LmNoYXJBdCgwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIFRydW5jYXRlIHhjIHRvIHRoZSByZXF1aXJlZCBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgICAgICB4Yy5sZW5ndGggPSBkO1xyXG5cclxuICAgICAgICAgIC8vIFJvdW5kIHVwP1xyXG4gICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFJvdW5kaW5nIHVwIG1heSBtZWFuIHRoZSBwcmV2aW91cyBkaWdpdCBoYXMgdG8gYmUgcm91bmRlZCB1cCBhbmQgc28gb24uXHJcbiAgICAgICAgICAgIGZvciAoLS1iYXNlT3V0OyArK3hjWy0tZF0gPiBiYXNlT3V0Oykge1xyXG4gICAgICAgICAgICAgIHhjW2RdID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKCFkKSB7XHJcbiAgICAgICAgICAgICAgICArK2U7XHJcbiAgICAgICAgICAgICAgICB4YyA9IFsxXS5jb25jYXQoeGMpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIERldGVybWluZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgIGZvciAoayA9IHhjLmxlbmd0aDsgIXhjWy0ta107KTtcclxuXHJcbiAgICAgICAgICAvLyBFLmcuIFs0LCAxMSwgMTVdIGJlY29tZXMgNGJmLlxyXG4gICAgICAgICAgZm9yIChpID0gMCwgc3RyID0gJyc7IGkgPD0gazsgc3RyICs9IGFscGhhYmV0LmNoYXJBdCh4Y1tpKytdKSk7XHJcblxyXG4gICAgICAgICAgLy8gQWRkIGxlYWRpbmcgemVyb3MsIGRlY2ltYWwgcG9pbnQgYW5kIHRyYWlsaW5nIHplcm9zIGFzIHJlcXVpcmVkLlxyXG4gICAgICAgICAgc3RyID0gdG9GaXhlZFBvaW50KHN0ciwgZSwgYWxwaGFiZXQuY2hhckF0KDApKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRoZSBjYWxsZXIgd2lsbCBhZGQgdGhlIHNpZ24uXHJcbiAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgICAgfTtcclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8vIFBlcmZvcm0gZGl2aXNpb24gaW4gdGhlIHNwZWNpZmllZCBiYXNlLiBDYWxsZWQgYnkgZGl2IGFuZCBjb252ZXJ0QmFzZS5cclxuICAgIGRpdiA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAvLyBBc3N1bWUgbm9uLXplcm8geCBhbmQgay5cclxuICAgICAgZnVuY3Rpb24gbXVsdGlwbHkoeCwgaywgYmFzZSkge1xyXG4gICAgICAgIHZhciBtLCB0ZW1wLCB4bG8sIHhoaSxcclxuICAgICAgICAgIGNhcnJ5ID0gMCxcclxuICAgICAgICAgIGkgPSB4Lmxlbmd0aCxcclxuICAgICAgICAgIGtsbyA9IGsgJSBTUVJUX0JBU0UsXHJcbiAgICAgICAgICBraGkgPSBrIC8gU1FSVF9CQVNFIHwgMDtcclxuXHJcbiAgICAgICAgZm9yICh4ID0geC5zbGljZSgpOyBpLS07KSB7XHJcbiAgICAgICAgICB4bG8gPSB4W2ldICUgU1FSVF9CQVNFO1xyXG4gICAgICAgICAgeGhpID0geFtpXSAvIFNRUlRfQkFTRSB8IDA7XHJcbiAgICAgICAgICBtID0ga2hpICogeGxvICsgeGhpICoga2xvO1xyXG4gICAgICAgICAgdGVtcCA9IGtsbyAqIHhsbyArICgobSAlIFNRUlRfQkFTRSkgKiBTUVJUX0JBU0UpICsgY2Fycnk7XHJcbiAgICAgICAgICBjYXJyeSA9ICh0ZW1wIC8gYmFzZSB8IDApICsgKG0gLyBTUVJUX0JBU0UgfCAwKSArIGtoaSAqIHhoaTtcclxuICAgICAgICAgIHhbaV0gPSB0ZW1wICUgYmFzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjYXJyeSkgeCA9IFtjYXJyeV0uY29uY2F0KHgpO1xyXG5cclxuICAgICAgICByZXR1cm4geDtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gY29tcGFyZShhLCBiLCBhTCwgYkwpIHtcclxuICAgICAgICB2YXIgaSwgY21wO1xyXG5cclxuICAgICAgICBpZiAoYUwgIT0gYkwpIHtcclxuICAgICAgICAgIGNtcCA9IGFMID4gYkwgPyAxIDogLTE7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBmb3IgKGkgPSBjbXAgPSAwOyBpIDwgYUw7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgaWYgKGFbaV0gIT0gYltpXSkge1xyXG4gICAgICAgICAgICAgIGNtcCA9IGFbaV0gPiBiW2ldID8gMSA6IC0xO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY21wO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBzdWJ0cmFjdChhLCBiLCBhTCwgYmFzZSkge1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuXHJcbiAgICAgICAgLy8gU3VidHJhY3QgYiBmcm9tIGEuXHJcbiAgICAgICAgZm9yICg7IGFMLS07KSB7XHJcbiAgICAgICAgICBhW2FMXSAtPSBpO1xyXG4gICAgICAgICAgaSA9IGFbYUxdIDwgYlthTF0gPyAxIDogMDtcclxuICAgICAgICAgIGFbYUxdID0gaSAqIGJhc2UgKyBhW2FMXSAtIGJbYUxdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yICg7ICFhWzBdICYmIGEubGVuZ3RoID4gMTsgYS5zcGxpY2UoMCwgMSkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB4OiBkaXZpZGVuZCwgeTogZGl2aXNvci5cclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICh4LCB5LCBkcCwgcm0sIGJhc2UpIHtcclxuICAgICAgICB2YXIgY21wLCBlLCBpLCBtb3JlLCBuLCBwcm9kLCBwcm9kTCwgcSwgcWMsIHJlbSwgcmVtTCwgcmVtMCwgeGksIHhMLCB5YzAsXHJcbiAgICAgICAgICB5TCwgeXosXHJcbiAgICAgICAgICBzID0geC5zID09IHkucyA/IDEgOiAtMSxcclxuICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciBOYU4sIEluZmluaXR5IG9yIDA/XHJcbiAgICAgICAgaWYgKCF4YyB8fCAheGNbMF0gfHwgIXljIHx8ICF5Y1swXSkge1xyXG5cclxuICAgICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKFxyXG5cclxuICAgICAgICAgICAvLyBSZXR1cm4gTmFOIGlmIGVpdGhlciBOYU4sIG9yIGJvdGggSW5maW5pdHkgb3IgMC5cclxuICAgICAgICAgICAheC5zIHx8ICF5LnMgfHwgKHhjID8geWMgJiYgeGNbMF0gPT0geWNbMF0gOiAheWMpID8gTmFOIDpcclxuXHJcbiAgICAgICAgICAgIC8vIFJldHVybiDCsTAgaWYgeCBpcyDCsTAgb3IgeSBpcyDCsUluZmluaXR5LCBvciByZXR1cm4gwrFJbmZpbml0eSBhcyB5IGlzIMKxMC5cclxuICAgICAgICAgICAgeGMgJiYgeGNbMF0gPT0gMCB8fCAheWMgPyBzICogMCA6IHMgLyAwXHJcbiAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxID0gbmV3IEJpZ051bWJlcihzKTtcclxuICAgICAgICBxYyA9IHEuYyA9IFtdO1xyXG4gICAgICAgIGUgPSB4LmUgLSB5LmU7XHJcbiAgICAgICAgcyA9IGRwICsgZSArIDE7XHJcblxyXG4gICAgICAgIGlmICghYmFzZSkge1xyXG4gICAgICAgICAgYmFzZSA9IEJBU0U7XHJcbiAgICAgICAgICBlID0gYml0Rmxvb3IoeC5lIC8gTE9HX0JBU0UpIC0gYml0Rmxvb3IoeS5lIC8gTE9HX0JBU0UpO1xyXG4gICAgICAgICAgcyA9IHMgLyBMT0dfQkFTRSB8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZXN1bHQgZXhwb25lbnQgbWF5IGJlIG9uZSBsZXNzIHRoZW4gdGhlIGN1cnJlbnQgdmFsdWUgb2YgZS5cclxuICAgICAgICAvLyBUaGUgY29lZmZpY2llbnRzIG9mIHRoZSBCaWdOdW1iZXJzIGZyb20gY29udmVydEJhc2UgbWF5IGhhdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yIChpID0gMDsgeWNbaV0gPT0gKHhjW2ldIHx8IDApOyBpKyspO1xyXG5cclxuICAgICAgICBpZiAoeWNbaV0gPiAoeGNbaV0gfHwgMCkpIGUtLTtcclxuXHJcbiAgICAgICAgaWYgKHMgPCAwKSB7XHJcbiAgICAgICAgICBxYy5wdXNoKDEpO1xyXG4gICAgICAgICAgbW9yZSA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHhMID0geGMubGVuZ3RoO1xyXG4gICAgICAgICAgeUwgPSB5Yy5sZW5ndGg7XHJcbiAgICAgICAgICBpID0gMDtcclxuICAgICAgICAgIHMgKz0gMjtcclxuXHJcbiAgICAgICAgICAvLyBOb3JtYWxpc2UgeGMgYW5kIHljIHNvIGhpZ2hlc3Qgb3JkZXIgZGlnaXQgb2YgeWMgaXMgPj0gYmFzZSAvIDIuXHJcblxyXG4gICAgICAgICAgbiA9IG1hdGhmbG9vcihiYXNlIC8gKHljWzBdICsgMSkpO1xyXG5cclxuICAgICAgICAgIC8vIE5vdCBuZWNlc3NhcnksIGJ1dCB0byBoYW5kbGUgb2RkIGJhc2VzIHdoZXJlIHljWzBdID09IChiYXNlIC8gMikgLSAxLlxyXG4gICAgICAgICAgLy8gaWYgKG4gPiAxIHx8IG4rKyA9PSAxICYmIHljWzBdIDwgYmFzZSAvIDIpIHtcclxuICAgICAgICAgIGlmIChuID4gMSkge1xyXG4gICAgICAgICAgICB5YyA9IG11bHRpcGx5KHljLCBuLCBiYXNlKTtcclxuICAgICAgICAgICAgeGMgPSBtdWx0aXBseSh4YywgbiwgYmFzZSk7XHJcbiAgICAgICAgICAgIHlMID0geWMubGVuZ3RoO1xyXG4gICAgICAgICAgICB4TCA9IHhjLmxlbmd0aDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB4aSA9IHlMO1xyXG4gICAgICAgICAgcmVtID0geGMuc2xpY2UoMCwgeUwpO1xyXG4gICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgLy8gQWRkIHplcm9zIHRvIG1ha2UgcmVtYWluZGVyIGFzIGxvbmcgYXMgZGl2aXNvci5cclxuICAgICAgICAgIGZvciAoOyByZW1MIDwgeUw7IHJlbVtyZW1MKytdID0gMCk7XHJcbiAgICAgICAgICB5eiA9IHljLnNsaWNlKCk7XHJcbiAgICAgICAgICB5eiA9IFswXS5jb25jYXQoeXopO1xyXG4gICAgICAgICAgeWMwID0geWNbMF07XHJcbiAgICAgICAgICBpZiAoeWNbMV0gPj0gYmFzZSAvIDIpIHljMCsrO1xyXG4gICAgICAgICAgLy8gTm90IG5lY2Vzc2FyeSwgYnV0IHRvIHByZXZlbnQgdHJpYWwgZGlnaXQgbiA+IGJhc2UsIHdoZW4gdXNpbmcgYmFzZSAzLlxyXG4gICAgICAgICAgLy8gZWxzZSBpZiAoYmFzZSA9PSAzICYmIHljMCA9PSAxKSB5YzAgPSAxICsgMWUtMTU7XHJcblxyXG4gICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICBuID0gMDtcclxuXHJcbiAgICAgICAgICAgIC8vIENvbXBhcmUgZGl2aXNvciBhbmQgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICBjbXAgPSBjb21wYXJlKHljLCByZW0sIHlMLCByZW1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIGRpdmlzb3IgPCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgIGlmIChjbXAgPCAwKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0cmlhbCBkaWdpdCwgbi5cclxuXHJcbiAgICAgICAgICAgICAgcmVtMCA9IHJlbVswXTtcclxuICAgICAgICAgICAgICBpZiAoeUwgIT0gcmVtTCkgcmVtMCA9IHJlbTAgKiBiYXNlICsgKHJlbVsxXSB8fCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gbiBpcyBob3cgbWFueSB0aW1lcyB0aGUgZGl2aXNvciBnb2VzIGludG8gdGhlIGN1cnJlbnQgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIG4gPSBtYXRoZmxvb3IocmVtMCAvIHljMCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vICBBbGdvcml0aG06XHJcbiAgICAgICAgICAgICAgLy8gIHByb2R1Y3QgPSBkaXZpc29yIG11bHRpcGxpZWQgYnkgdHJpYWwgZGlnaXQgKG4pLlxyXG4gICAgICAgICAgICAgIC8vICBDb21wYXJlIHByb2R1Y3QgYW5kIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAvLyAgSWYgcHJvZHVjdCBpcyBncmVhdGVyIHRoYW4gcmVtYWluZGVyOlxyXG4gICAgICAgICAgICAgIC8vICAgIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSBwcm9kdWN0LCBkZWNyZW1lbnQgdHJpYWwgZGlnaXQuXHJcbiAgICAgICAgICAgICAgLy8gIFN1YnRyYWN0IHByb2R1Y3QgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgLy8gIElmIHByb2R1Y3Qgd2FzIGxlc3MgdGhhbiByZW1haW5kZXIgYXQgdGhlIGxhc3QgY29tcGFyZTpcclxuICAgICAgICAgICAgICAvLyAgICBDb21wYXJlIG5ldyByZW1haW5kZXIgYW5kIGRpdmlzb3IuXHJcbiAgICAgICAgICAgICAgLy8gICAgSWYgcmVtYWluZGVyIGlzIGdyZWF0ZXIgdGhhbiBkaXZpc29yOlxyXG4gICAgICAgICAgICAgIC8vICAgICAgU3VidHJhY3QgZGl2aXNvciBmcm9tIHJlbWFpbmRlciwgaW5jcmVtZW50IHRyaWFsIGRpZ2l0LlxyXG5cclxuICAgICAgICAgICAgICBpZiAobiA+IDEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBuIG1heSBiZSA+IGJhc2Ugb25seSB3aGVuIGJhc2UgaXMgMy5cclxuICAgICAgICAgICAgICAgIGlmIChuID49IGJhc2UpIG4gPSBiYXNlIC0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBwcm9kdWN0ID0gZGl2aXNvciAqIHRyaWFsIGRpZ2l0LlxyXG4gICAgICAgICAgICAgICAgcHJvZCA9IG11bHRpcGx5KHljLCBuLCBiYXNlKTtcclxuICAgICAgICAgICAgICAgIHByb2RMID0gcHJvZC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb21wYXJlIHByb2R1Y3QgYW5kIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgIC8vIElmIHByb2R1Y3QgPiByZW1haW5kZXIgdGhlbiB0cmlhbCBkaWdpdCBuIHRvbyBoaWdoLlxyXG4gICAgICAgICAgICAgICAgLy8gbiBpcyAxIHRvbyBoaWdoIGFib3V0IDUlIG9mIHRoZSB0aW1lLCBhbmQgaXMgbm90IGtub3duIHRvIGhhdmVcclxuICAgICAgICAgICAgICAgIC8vIGV2ZXIgYmVlbiBtb3JlIHRoYW4gMSB0b28gaGlnaC5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKHByb2QsIHJlbSwgcHJvZEwsIHJlbUwpID09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgbi0tO1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gU3VidHJhY3QgZGl2aXNvciBmcm9tIHByb2R1Y3QuXHJcbiAgICAgICAgICAgICAgICAgIHN1YnRyYWN0KHByb2QsIHlMIDwgcHJvZEwgPyB5eiA6IHljLCBwcm9kTCwgYmFzZSk7XHJcbiAgICAgICAgICAgICAgICAgIHByb2RMID0gcHJvZC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgIGNtcCA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBuIGlzIDAgb3IgMSwgY21wIGlzIC0xLlxyXG4gICAgICAgICAgICAgICAgLy8gSWYgbiBpcyAwLCB0aGVyZSBpcyBubyBuZWVkIHRvIGNvbXBhcmUgeWMgYW5kIHJlbSBhZ2FpbiBiZWxvdyxcclxuICAgICAgICAgICAgICAgIC8vIHNvIGNoYW5nZSBjbXAgdG8gMSB0byBhdm9pZCBpdC5cclxuICAgICAgICAgICAgICAgIC8vIElmIG4gaXMgMSwgbGVhdmUgY21wIGFzIC0xLCBzbyB5YyBhbmQgcmVtIGFyZSBjb21wYXJlZCBhZ2Fpbi5cclxuICAgICAgICAgICAgICAgIGlmIChuID09IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIGRpdmlzb3IgPCByZW1haW5kZXIsIHNvIG4gbXVzdCBiZSBhdCBsZWFzdCAxLlxyXG4gICAgICAgICAgICAgICAgICBjbXAgPSBuID0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBwcm9kdWN0ID0gZGl2aXNvclxyXG4gICAgICAgICAgICAgICAgcHJvZCA9IHljLnNsaWNlKCk7XHJcbiAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgaWYgKHByb2RMIDwgcmVtTCkgcHJvZCA9IFswXS5jb25jYXQocHJvZCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFN1YnRyYWN0IHByb2R1Y3QgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgc3VidHJhY3QocmVtLCBwcm9kLCByZW1MLCBiYXNlKTtcclxuICAgICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgIC8vIElmIHByb2R1Y3Qgd2FzIDwgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIGlmIChjbXAgPT0gLTEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb21wYXJlIGRpdmlzb3IgYW5kIG5ldyByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBkaXZpc29yIDwgbmV3IHJlbWFpbmRlciwgc3VidHJhY3QgZGl2aXNvciBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgIC8vIFRyaWFsIGRpZ2l0IG4gdG9vIGxvdy5cclxuICAgICAgICAgICAgICAgIC8vIG4gaXMgMSB0b28gbG93IGFib3V0IDUlIG9mIHRoZSB0aW1lLCBhbmQgdmVyeSByYXJlbHkgMiB0b28gbG93LlxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGNvbXBhcmUoeWMsIHJlbSwgeUwsIHJlbUwpIDwgMSkge1xyXG4gICAgICAgICAgICAgICAgICBuKys7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBTdWJ0cmFjdCBkaXZpc29yIGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgICBzdWJ0cmFjdChyZW0sIHlMIDwgcmVtTCA/IHl6IDogeWMsIHJlbUwsIGJhc2UpO1xyXG4gICAgICAgICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY21wID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgbisrO1xyXG4gICAgICAgICAgICAgIHJlbSA9IFswXTtcclxuICAgICAgICAgICAgfSAvLyBlbHNlIGNtcCA9PT0gMSBhbmQgbiB3aWxsIGJlIDBcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgbmV4dCBkaWdpdCwgbiwgdG8gdGhlIHJlc3VsdCBhcnJheS5cclxuICAgICAgICAgICAgcWNbaSsrXSA9IG47XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgaWYgKHJlbVswXSkge1xyXG4gICAgICAgICAgICAgIHJlbVtyZW1MKytdID0geGNbeGldIHx8IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmVtID0gW3hjW3hpXV07XHJcbiAgICAgICAgICAgICAgcmVtTCA9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gd2hpbGUgKCh4aSsrIDwgeEwgfHwgcmVtWzBdICE9IG51bGwpICYmIHMtLSk7XHJcblxyXG4gICAgICAgICAgbW9yZSA9IHJlbVswXSAhPSBudWxsO1xyXG5cclxuICAgICAgICAgIC8vIExlYWRpbmcgemVybz9cclxuICAgICAgICAgIGlmICghcWNbMF0pIHFjLnNwbGljZSgwLCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChiYXNlID09IEJBU0UpIHtcclxuXHJcbiAgICAgICAgICAvLyBUbyBjYWxjdWxhdGUgcS5lLCBmaXJzdCBnZXQgdGhlIG51bWJlciBvZiBkaWdpdHMgb2YgcWNbMF0uXHJcbiAgICAgICAgICBmb3IgKGkgPSAxLCBzID0gcWNbMF07IHMgPj0gMTA7IHMgLz0gMTAsIGkrKyk7XHJcblxyXG4gICAgICAgICAgcm91bmQocSwgZHAgKyAocS5lID0gaSArIGUgKiBMT0dfQkFTRSAtIDEpICsgMSwgcm0sIG1vcmUpO1xyXG5cclxuICAgICAgICAvLyBDYWxsZXIgaXMgY29udmVydEJhc2UuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHEuZSA9IGU7XHJcbiAgICAgICAgICBxLnIgPSArbW9yZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBxO1xyXG4gICAgICB9O1xyXG4gICAgfSkoKTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIEJpZ051bWJlciBuIGluIGZpeGVkLXBvaW50IG9yIGV4cG9uZW50aWFsXHJcbiAgICAgKiBub3RhdGlvbiByb3VuZGVkIHRvIHRoZSBzcGVjaWZpZWQgZGVjaW1hbCBwbGFjZXMgb3Igc2lnbmlmaWNhbnQgZGlnaXRzLlxyXG4gICAgICpcclxuICAgICAqIG46IGEgQmlnTnVtYmVyLlxyXG4gICAgICogaTogdGhlIGluZGV4IG9mIHRoZSBsYXN0IGRpZ2l0IHJlcXVpcmVkIChpLmUuIHRoZSBkaWdpdCB0aGF0IG1heSBiZSByb3VuZGVkIHVwKS5cclxuICAgICAqIHJtOiB0aGUgcm91bmRpbmcgbW9kZS5cclxuICAgICAqIGlkOiAxICh0b0V4cG9uZW50aWFsKSBvciAyICh0b1ByZWNpc2lvbikuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGZvcm1hdChuLCBpLCBybSwgaWQpIHtcclxuICAgICAgdmFyIGMwLCBlLCBuZSwgbGVuLCBzdHI7XHJcblxyXG4gICAgICBpZiAocm0gPT0gbnVsbCkgcm0gPSBST1VORElOR19NT0RFO1xyXG4gICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuXHJcbiAgICAgIGlmICghbi5jKSByZXR1cm4gbi50b1N0cmluZygpO1xyXG5cclxuICAgICAgYzAgPSBuLmNbMF07XHJcbiAgICAgIG5lID0gbi5lO1xyXG5cclxuICAgICAgaWYgKGkgPT0gbnVsbCkge1xyXG4gICAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcobi5jKTtcclxuICAgICAgICBzdHIgPSBpZCA9PSAxIHx8IGlkID09IDIgJiYgKG5lIDw9IFRPX0VYUF9ORUcgfHwgbmUgPj0gVE9fRVhQX1BPUylcclxuICAgICAgICAgPyB0b0V4cG9uZW50aWFsKHN0ciwgbmUpXHJcbiAgICAgICAgIDogdG9GaXhlZFBvaW50KHN0ciwgbmUsICcwJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbiA9IHJvdW5kKG5ldyBCaWdOdW1iZXIobiksIGksIHJtKTtcclxuXHJcbiAgICAgICAgLy8gbi5lIG1heSBoYXZlIGNoYW5nZWQgaWYgdGhlIHZhbHVlIHdhcyByb3VuZGVkIHVwLlxyXG4gICAgICAgIGUgPSBuLmU7XHJcblxyXG4gICAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcobi5jKTtcclxuICAgICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyB0b1ByZWNpc2lvbiByZXR1cm5zIGV4cG9uZW50aWFsIG5vdGF0aW9uIGlmIHRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzXHJcbiAgICAgICAgLy8gc3BlY2lmaWVkIGlzIGxlc3MgdGhhbiB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBuZWNlc3NhcnkgdG8gcmVwcmVzZW50IHRoZSBpbnRlZ2VyXHJcbiAgICAgICAgLy8gcGFydCBvZiB0aGUgdmFsdWUgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24uXHJcblxyXG4gICAgICAgIC8vIEV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAgIGlmIChpZCA9PSAxIHx8IGlkID09IDIgJiYgKGkgPD0gZSB8fCBlIDw9IFRPX0VYUF9ORUcpKSB7XHJcblxyXG4gICAgICAgICAgLy8gQXBwZW5kIHplcm9zP1xyXG4gICAgICAgICAgZm9yICg7IGxlbiA8IGk7IHN0ciArPSAnMCcsIGxlbisrKTtcclxuICAgICAgICAgIHN0ciA9IHRvRXhwb25lbnRpYWwoc3RyLCBlKTtcclxuXHJcbiAgICAgICAgLy8gRml4ZWQtcG9pbnQgbm90YXRpb24uXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGkgLT0gbmU7XHJcbiAgICAgICAgICBzdHIgPSB0b0ZpeGVkUG9pbnQoc3RyLCBlLCAnMCcpO1xyXG5cclxuICAgICAgICAgIC8vIEFwcGVuZCB6ZXJvcz9cclxuICAgICAgICAgIGlmIChlICsgMSA+IGxlbikge1xyXG4gICAgICAgICAgICBpZiAoLS1pID4gMCkgZm9yIChzdHIgKz0gJy4nOyBpLS07IHN0ciArPSAnMCcpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaSArPSBlIC0gbGVuO1xyXG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcclxuICAgICAgICAgICAgICBpZiAoZSArIDEgPT0gbGVuKSBzdHIgKz0gJy4nO1xyXG4gICAgICAgICAgICAgIGZvciAoOyBpLS07IHN0ciArPSAnMCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbi5zIDwgMCAmJiBjMCA/ICctJyArIHN0ciA6IHN0cjtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gSGFuZGxlIEJpZ051bWJlci5tYXggYW5kIEJpZ051bWJlci5taW4uXHJcbiAgICBmdW5jdGlvbiBtYXhPck1pbihhcmdzLCBtZXRob2QpIHtcclxuICAgICAgdmFyIG4sXHJcbiAgICAgICAgaSA9IDEsXHJcbiAgICAgICAgbSA9IG5ldyBCaWdOdW1iZXIoYXJnc1swXSk7XHJcblxyXG4gICAgICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBuID0gbmV3IEJpZ051bWJlcihhcmdzW2ldKTtcclxuXHJcbiAgICAgICAgLy8gSWYgYW55IG51bWJlciBpcyBOYU4sIHJldHVybiBOYU4uXHJcbiAgICAgICAgaWYgKCFuLnMpIHtcclxuICAgICAgICAgIG0gPSBuO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfSBlbHNlIGlmIChtZXRob2QuY2FsbChtLCBuKSkge1xyXG4gICAgICAgICAgbSA9IG47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFN0cmlwIHRyYWlsaW5nIHplcm9zLCBjYWxjdWxhdGUgYmFzZSAxMCBleHBvbmVudCBhbmQgY2hlY2sgYWdhaW5zdCBNSU5fRVhQIGFuZCBNQVhfRVhQLlxyXG4gICAgICogQ2FsbGVkIGJ5IG1pbnVzLCBwbHVzIGFuZCB0aW1lcy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbm9ybWFsaXNlKG4sIGMsIGUpIHtcclxuICAgICAgdmFyIGkgPSAxLFxyXG4gICAgICAgIGogPSBjLmxlbmd0aDtcclxuXHJcbiAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgIGZvciAoOyAhY1stLWpdOyBjLnBvcCgpKTtcclxuXHJcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgYmFzZSAxMCBleHBvbmVudC4gRmlyc3QgZ2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIGNbMF0uXHJcbiAgICAgIGZvciAoaiA9IGNbMF07IGogPj0gMTA7IGogLz0gMTAsIGkrKyk7XHJcblxyXG4gICAgICAvLyBPdmVyZmxvdz9cclxuICAgICAgaWYgKChlID0gaSArIGUgKiBMT0dfQkFTRSAtIDEpID4gTUFYX0VYUCkge1xyXG5cclxuICAgICAgICAvLyBJbmZpbml0eS5cclxuICAgICAgICBuLmMgPSBuLmUgPSBudWxsO1xyXG5cclxuICAgICAgLy8gVW5kZXJmbG93P1xyXG4gICAgICB9IGVsc2UgaWYgKGUgPCBNSU5fRVhQKSB7XHJcblxyXG4gICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgbi5jID0gW24uZSA9IDBdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG4uZSA9IGU7XHJcbiAgICAgICAgbi5jID0gYztcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIEhhbmRsZSB2YWx1ZXMgdGhhdCBmYWlsIHRoZSB2YWxpZGl0eSB0ZXN0IGluIEJpZ051bWJlci5cclxuICAgIHBhcnNlTnVtZXJpYyA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBiYXNlUHJlZml4ID0gL14oLT8pMChbeGJvXSkoPz1cXHdbXFx3Ll0qJCkvaSxcclxuICAgICAgICBkb3RBZnRlciA9IC9eKFteLl0rKVxcLiQvLFxyXG4gICAgICAgIGRvdEJlZm9yZSA9IC9eXFwuKFteLl0rKSQvLFxyXG4gICAgICAgIGlzSW5maW5pdHlPck5hTiA9IC9eLT8oSW5maW5pdHl8TmFOKSQvLFxyXG4gICAgICAgIHdoaXRlc3BhY2VPclBsdXMgPSAvXlxccypcXCsoPz1bXFx3Ll0pfF5cXHMrfFxccyskL2c7XHJcblxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHgsIHN0ciwgaXNOdW0sIGIpIHtcclxuICAgICAgICB2YXIgYmFzZSxcclxuICAgICAgICAgIHMgPSBpc051bSA/IHN0ciA6IHN0ci5yZXBsYWNlKHdoaXRlc3BhY2VPclBsdXMsICcnKTtcclxuXHJcbiAgICAgICAgLy8gTm8gZXhjZXB0aW9uIG9uIMKxSW5maW5pdHkgb3IgTmFOLlxyXG4gICAgICAgIGlmIChpc0luZmluaXR5T3JOYU4udGVzdChzKSkge1xyXG4gICAgICAgICAgeC5zID0gaXNOYU4ocykgPyBudWxsIDogcyA8IDAgPyAtMSA6IDE7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICghaXNOdW0pIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJhc2VQcmVmaXggPSAvXigtPykwKFt4Ym9dKSg/PVxcd1tcXHcuXSokKS9pXHJcbiAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoYmFzZVByZWZpeCwgZnVuY3Rpb24gKG0sIHAxLCBwMikge1xyXG4gICAgICAgICAgICAgIGJhc2UgPSAocDIgPSBwMi50b0xvd2VyQ2FzZSgpKSA9PSAneCcgPyAxNiA6IHAyID09ICdiJyA/IDIgOiA4O1xyXG4gICAgICAgICAgICAgIHJldHVybiAhYiB8fCBiID09IGJhc2UgPyBwMSA6IG07XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGIpIHtcclxuICAgICAgICAgICAgICBiYXNlID0gYjtcclxuXHJcbiAgICAgICAgICAgICAgLy8gRS5nLiAnMS4nIHRvICcxJywgJy4xJyB0byAnMC4xJ1xyXG4gICAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoZG90QWZ0ZXIsICckMScpLnJlcGxhY2UoZG90QmVmb3JlLCAnMC4kMScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RyICE9IHMpIHJldHVybiBuZXcgQmlnTnVtYmVyKHMsIGJhc2UpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOb3QgYSBudW1iZXI6IHtufSdcclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOb3QgYSBiYXNlIHtifSBudW1iZXI6IHtufSdcclxuICAgICAgICAgIGlmIChCaWdOdW1iZXIuREVCVUcpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnTm90IGEnICsgKGIgPyAnIGJhc2UgJyArIGIgOiAnJykgKyAnIG51bWJlcjogJyArIHN0cik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gTmFOXHJcbiAgICAgICAgICB4LnMgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSkoKTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJvdW5kIHggdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0uIENoZWNrIGZvciBvdmVyL3VuZGVyLWZsb3cuXHJcbiAgICAgKiBJZiByIGlzIHRydXRoeSwgaXQgaXMga25vd24gdGhhdCB0aGVyZSBhcmUgbW9yZSBkaWdpdHMgYWZ0ZXIgdGhlIHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiByb3VuZCh4LCBzZCwgcm0sIHIpIHtcclxuICAgICAgdmFyIGQsIGksIGosIGssIG4sIG5pLCByZCxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICBwb3dzMTAgPSBQT1dTX1RFTjtcclxuXHJcbiAgICAgIC8vIGlmIHggaXMgbm90IEluZmluaXR5IG9yIE5hTi4uLlxyXG4gICAgICBpZiAoeGMpIHtcclxuXHJcbiAgICAgICAgLy8gcmQgaXMgdGhlIHJvdW5kaW5nIGRpZ2l0LCBpLmUuIHRoZSBkaWdpdCBhZnRlciB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAvLyBuIGlzIGEgYmFzZSAxZTE0IG51bWJlciwgdGhlIHZhbHVlIG9mIHRoZSBlbGVtZW50IG9mIGFycmF5IHguYyBjb250YWluaW5nIHJkLlxyXG4gICAgICAgIC8vIG5pIGlzIHRoZSBpbmRleCBvZiBuIHdpdGhpbiB4LmMuXHJcbiAgICAgICAgLy8gZCBpcyB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBuLlxyXG4gICAgICAgIC8vIGkgaXMgdGhlIGluZGV4IG9mIHJkIHdpdGhpbiBuIGluY2x1ZGluZyBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgIC8vIGogaXMgdGhlIGFjdHVhbCBpbmRleCBvZiByZCB3aXRoaW4gbiAoaWYgPCAwLCByZCBpcyBhIGxlYWRpbmcgemVybykuXHJcbiAgICAgICAgb3V0OiB7XHJcblxyXG4gICAgICAgICAgLy8gR2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHRoZSBmaXJzdCBlbGVtZW50IG9mIHhjLlxyXG4gICAgICAgICAgZm9yIChkID0gMSwgayA9IHhjWzBdOyBrID49IDEwOyBrIC89IDEwLCBkKyspO1xyXG4gICAgICAgICAgaSA9IHNkIC0gZDtcclxuXHJcbiAgICAgICAgICAvLyBJZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgaW4gdGhlIGZpcnN0IGVsZW1lbnQgb2YgeGMuLi5cclxuICAgICAgICAgIGlmIChpIDwgMCkge1xyXG4gICAgICAgICAgICBpICs9IExPR19CQVNFO1xyXG4gICAgICAgICAgICBqID0gc2Q7XHJcbiAgICAgICAgICAgIG4gPSB4Y1tuaSA9IDBdO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHRoZSByb3VuZGluZyBkaWdpdCBhdCBpbmRleCBqIG9mIG4uXHJcbiAgICAgICAgICAgIHJkID0gbiAvIHBvd3MxMFtkIC0gaiAtIDFdICUgMTAgfCAwO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbmkgPSBtYXRoY2VpbCgoaSArIDEpIC8gTE9HX0JBU0UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5pID49IHhjLmxlbmd0aCkge1xyXG5cclxuICAgICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE5lZWRlZCBieSBzcXJ0LlxyXG4gICAgICAgICAgICAgICAgZm9yICg7IHhjLmxlbmd0aCA8PSBuaTsgeGMucHVzaCgwKSk7XHJcbiAgICAgICAgICAgICAgICBuID0gcmQgPSAwO1xyXG4gICAgICAgICAgICAgICAgZCA9IDE7XHJcbiAgICAgICAgICAgICAgICBpICU9IExPR19CQVNFO1xyXG4gICAgICAgICAgICAgICAgaiA9IGkgLSBMT0dfQkFTRSArIDE7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrIG91dDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgbiA9IGsgPSB4Y1tuaV07XHJcblxyXG4gICAgICAgICAgICAgIC8vIEdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBuLlxyXG4gICAgICAgICAgICAgIGZvciAoZCA9IDE7IGsgPj0gMTA7IGsgLz0gMTAsIGQrKyk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEdldCB0aGUgaW5kZXggb2YgcmQgd2l0aGluIG4uXHJcbiAgICAgICAgICAgICAgaSAlPSBMT0dfQkFTRTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gR2V0IHRoZSBpbmRleCBvZiByZCB3aXRoaW4gbiwgYWRqdXN0ZWQgZm9yIGxlYWRpbmcgemVyb3MuXHJcbiAgICAgICAgICAgICAgLy8gVGhlIG51bWJlciBvZiBsZWFkaW5nIHplcm9zIG9mIG4gaXMgZ2l2ZW4gYnkgTE9HX0JBU0UgLSBkLlxyXG4gICAgICAgICAgICAgIGogPSBpIC0gTE9HX0JBU0UgKyBkO1xyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIHJvdW5kaW5nIGRpZ2l0IGF0IGluZGV4IGogb2Ygbi5cclxuICAgICAgICAgICAgICByZCA9IGogPCAwID8gMCA6IG4gLyBwb3dzMTBbZCAtIGogLSAxXSAlIDEwIHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHIgPSByIHx8IHNkIDwgMCB8fFxyXG5cclxuICAgICAgICAgIC8vIEFyZSB0aGVyZSBhbnkgbm9uLXplcm8gZGlnaXRzIGFmdGVyIHRoZSByb3VuZGluZyBkaWdpdD9cclxuICAgICAgICAgIC8vIFRoZSBleHByZXNzaW9uICBuICUgcG93czEwW2QgLSBqIC0gMV0gIHJldHVybnMgYWxsIGRpZ2l0cyBvZiBuIHRvIHRoZSByaWdodFxyXG4gICAgICAgICAgLy8gb2YgdGhlIGRpZ2l0IGF0IGosIGUuZy4gaWYgbiBpcyA5MDg3MTQgYW5kIGogaXMgMiwgdGhlIGV4cHJlc3Npb24gZ2l2ZXMgNzE0LlxyXG4gICAgICAgICAgIHhjW25pICsgMV0gIT0gbnVsbCB8fCAoaiA8IDAgPyBuIDogbiAlIHBvd3MxMFtkIC0gaiAtIDFdKTtcclxuXHJcbiAgICAgICAgICByID0gcm0gPCA0XHJcbiAgICAgICAgICAgPyAocmQgfHwgcikgJiYgKHJtID09IDAgfHwgcm0gPT0gKHgucyA8IDAgPyAzIDogMikpXHJcbiAgICAgICAgICAgOiByZCA+IDUgfHwgcmQgPT0gNSAmJiAocm0gPT0gNCB8fCByIHx8IHJtID09IDYgJiZcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIGRpZ2l0IHRvIHRoZSBsZWZ0IG9mIHRoZSByb3VuZGluZyBkaWdpdCBpcyBvZGQuXHJcbiAgICAgICAgICAgICgoaSA+IDAgPyBqID4gMCA/IG4gLyBwb3dzMTBbZCAtIGpdIDogMCA6IHhjW25pIC0gMV0pICUgMTApICYgMSB8fFxyXG4gICAgICAgICAgICAgcm0gPT0gKHgucyA8IDAgPyA4IDogNykpO1xyXG5cclxuICAgICAgICAgIGlmIChzZCA8IDEgfHwgIXhjWzBdKSB7XHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHNkIHRvIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAgICAgIHNkIC09IHguZSArIDE7XHJcblxyXG4gICAgICAgICAgICAgIC8vIDEsIDAuMSwgMC4wMSwgMC4wMDEsIDAuMDAwMSBldGMuXHJcbiAgICAgICAgICAgICAgeGNbMF0gPSBwb3dzMTBbKExPR19CQVNFIC0gc2QgJSBMT0dfQkFTRSkgJSBMT0dfQkFTRV07XHJcbiAgICAgICAgICAgICAgeC5lID0gLXNkIHx8IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICAgICAgeGNbMF0gPSB4LmUgPSAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgZXhjZXNzIGRpZ2l0cy5cclxuICAgICAgICAgIGlmIChpID09IDApIHtcclxuICAgICAgICAgICAgeGMubGVuZ3RoID0gbmk7XHJcbiAgICAgICAgICAgIGsgPSAxO1xyXG4gICAgICAgICAgICBuaS0tO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgeGMubGVuZ3RoID0gbmkgKyAxO1xyXG4gICAgICAgICAgICBrID0gcG93czEwW0xPR19CQVNFIC0gaV07XHJcblxyXG4gICAgICAgICAgICAvLyBFLmcuIDU2NzAwIGJlY29tZXMgNTYwMDAgaWYgNyBpcyB0aGUgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgICAgIC8vIGogPiAwIG1lYW5zIGkgPiBudW1iZXIgb2YgbGVhZGluZyB6ZXJvcyBvZiBuLlxyXG4gICAgICAgICAgICB4Y1tuaV0gPSBqID4gMCA/IG1hdGhmbG9vcihuIC8gcG93czEwW2QgLSBqXSAlIHBvd3MxMFtqXSkgKiBrIDogMDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgICAgIGlmIChyKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgOykge1xyXG5cclxuICAgICAgICAgICAgICAvLyBJZiB0aGUgZGlnaXQgdG8gYmUgcm91bmRlZCB1cCBpcyBpbiB0aGUgZmlyc3QgZWxlbWVudCBvZiB4Yy4uLlxyXG4gICAgICAgICAgICAgIGlmIChuaSA9PSAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaSB3aWxsIGJlIHRoZSBsZW5ndGggb2YgeGNbMF0gYmVmb3JlIGsgaXMgYWRkZWQuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAxLCBqID0geGNbMF07IGogPj0gMTA7IGogLz0gMTAsIGkrKyk7XHJcbiAgICAgICAgICAgICAgICBqID0geGNbMF0gKz0gaztcclxuICAgICAgICAgICAgICAgIGZvciAoayA9IDE7IGogPj0gMTA7IGogLz0gMTAsIGsrKyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgaSAhPSBrIHRoZSBsZW5ndGggaGFzIGluY3JlYXNlZC5cclxuICAgICAgICAgICAgICAgIGlmIChpICE9IGspIHtcclxuICAgICAgICAgICAgICAgICAgeC5lKys7XHJcbiAgICAgICAgICAgICAgICAgIGlmICh4Y1swXSA9PSBCQVNFKSB4Y1swXSA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHhjW25pXSArPSBrO1xyXG4gICAgICAgICAgICAgICAgaWYgKHhjW25pXSAhPSBCQVNFKSBicmVhaztcclxuICAgICAgICAgICAgICAgIHhjW25pLS1dID0gMDtcclxuICAgICAgICAgICAgICAgIGsgPSAxO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgIGZvciAoaSA9IHhjLmxlbmd0aDsgeGNbLS1pXSA9PT0gMDsgeGMucG9wKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT3ZlcmZsb3c/IEluZmluaXR5LlxyXG4gICAgICAgIGlmICh4LmUgPiBNQVhfRVhQKSB7XHJcbiAgICAgICAgICB4LmMgPSB4LmUgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBVbmRlcmZsb3c/IFplcm8uXHJcbiAgICAgICAgfSBlbHNlIGlmICh4LmUgPCBNSU5fRVhQKSB7XHJcbiAgICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4geDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gdmFsdWVPZihuKSB7XHJcbiAgICAgIHZhciBzdHIsXHJcbiAgICAgICAgZSA9IG4uZTtcclxuXHJcbiAgICAgIGlmIChlID09PSBudWxsKSByZXR1cm4gbi50b1N0cmluZygpO1xyXG5cclxuICAgICAgc3RyID0gY29lZmZUb1N0cmluZyhuLmMpO1xyXG5cclxuICAgICAgc3RyID0gZSA8PSBUT19FWFBfTkVHIHx8IGUgPj0gVE9fRVhQX1BPU1xyXG4gICAgICAgID8gdG9FeHBvbmVudGlhbChzdHIsIGUpXHJcbiAgICAgICAgOiB0b0ZpeGVkUG9pbnQoc3RyLCBlLCAnMCcpO1xyXG5cclxuICAgICAgcmV0dXJuIG4ucyA8IDAgPyAnLScgKyBzdHIgOiBzdHI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIFBST1RPVFlQRS9JTlNUQU5DRSBNRVRIT0RTXHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlci5cclxuICAgICAqL1xyXG4gICAgUC5hYnNvbHV0ZVZhbHVlID0gUC5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB4ID0gbmV3IEJpZ051bWJlcih0aGlzKTtcclxuICAgICAgaWYgKHgucyA8IDApIHgucyA9IDE7XHJcbiAgICAgIHJldHVybiB4O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVyblxyXG4gICAgICogICAxIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqICAgLTEgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICogICAwIGlmIHRoZXkgaGF2ZSB0aGUgc2FtZSB2YWx1ZSxcclxuICAgICAqICAgb3IgbnVsbCBpZiB0aGUgdmFsdWUgb2YgZWl0aGVyIGlzIE5hTi5cclxuICAgICAqL1xyXG4gICAgUC5jb21wYXJlZFRvID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogSWYgZHAgaXMgdW5kZWZpbmVkIG9yIG51bGwgb3IgdHJ1ZSBvciBmYWxzZSwgcmV0dXJuIHRoZSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgb2YgdGhlXHJcbiAgICAgKiB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciwgb3IgbnVsbCBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgwrFJbmZpbml0eSBvciBOYU4uXHJcbiAgICAgKlxyXG4gICAgICogT3RoZXJ3aXNlLCBpZiBkcCBpcyBhIG51bWJlciwgcmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICogQmlnTnVtYmVyIHJvdW5kZWQgdG8gYSBtYXhpbXVtIG9mIGRwIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yXHJcbiAgICAgKiBST1VORElOR19NT0RFIGlmIHJtIGlzIG9taXR0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlczogaW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7ZHB8cm19J1xyXG4gICAgICovXHJcbiAgICBQLmRlY2ltYWxQbGFjZXMgPSBQLmRwID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgICB2YXIgYywgbiwgdixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChkcCAhPSBudWxsKSB7XHJcbiAgICAgICAgaW50Q2hlY2soZHAsIDAsIE1BWCk7XHJcbiAgICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvdW5kKG5ldyBCaWdOdW1iZXIoeCksIGRwICsgeC5lICsgMSwgcm0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIShjID0geC5jKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgIG4gPSAoKHYgPSBjLmxlbmd0aCAtIDEpIC0gYml0Rmxvb3IodGhpcy5lIC8gTE9HX0JBU0UpKSAqIExPR19CQVNFO1xyXG5cclxuICAgICAgLy8gU3VidHJhY3QgdGhlIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvcyBvZiB0aGUgbGFzdCBudW1iZXIuXHJcbiAgICAgIGlmICh2ID0gY1t2XSkgZm9yICg7IHYgJSAxMCA9PSAwOyB2IC89IDEwLCBuLS0pO1xyXG4gICAgICBpZiAobiA8IDApIG4gPSAwO1xyXG5cclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gLyAwID0gSVxyXG4gICAgICogIG4gLyBOID0gTlxyXG4gICAgICogIG4gLyBJID0gMFxyXG4gICAgICogIDAgLyBuID0gMFxyXG4gICAgICogIDAgLyAwID0gTlxyXG4gICAgICogIDAgLyBOID0gTlxyXG4gICAgICogIDAgLyBJID0gMFxyXG4gICAgICogIE4gLyBuID0gTlxyXG4gICAgICogIE4gLyAwID0gTlxyXG4gICAgICogIE4gLyBOID0gTlxyXG4gICAgICogIE4gLyBJID0gTlxyXG4gICAgICogIEkgLyBuID0gSVxyXG4gICAgICogIEkgLyAwID0gSVxyXG4gICAgICogIEkgLyBOID0gTlxyXG4gICAgICogIEkgLyBJID0gTlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGRpdmlkZWQgYnkgdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWdOdW1iZXIoeSwgYiksIHJvdW5kZWQgYWNjb3JkaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFuZCBST1VORElOR19NT0RFLlxyXG4gICAgICovXHJcbiAgICBQLmRpdmlkZWRCeSA9IFAuZGl2ID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGRpdih0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpLCBERUNJTUFMX1BMQUNFUywgUk9VTkRJTkdfTU9ERSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgaW50ZWdlciBwYXJ0IG9mIGRpdmlkaW5nIHRoZSB2YWx1ZSBvZiB0aGlzXHJcbiAgICAgKiBCaWdOdW1iZXIgYnkgdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAqL1xyXG4gICAgUC5kaXZpZGVkVG9JbnRlZ2VyQnkgPSBQLmlkaXYgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gZGl2KHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYiksIDAsIDEpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgZXhwb25lbnRpYXRlZCBieSBuLlxyXG4gICAgICpcclxuICAgICAqIElmIG0gaXMgcHJlc2VudCwgcmV0dXJuIHRoZSByZXN1bHQgbW9kdWxvIG0uXHJcbiAgICAgKiBJZiBuIGlzIG5lZ2F0aXZlIHJvdW5kIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqIElmIFBPV19QUkVDSVNJT04gaXMgbm9uLXplcm8gYW5kIG0gaXMgbm90IHByZXNlbnQsIHJvdW5kIHRvIFBPV19QUkVDSVNJT04gdXNpbmcgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgbW9kdWxhciBwb3dlciBvcGVyYXRpb24gd29ya3MgZWZmaWNpZW50bHkgd2hlbiB4LCBuLCBhbmQgbSBhcmUgaW50ZWdlcnMsIG90aGVyd2lzZSBpdFxyXG4gICAgICogaXMgZXF1aXZhbGVudCB0byBjYWxjdWxhdGluZyB4LmV4cG9uZW50aWF0ZWRCeShuKS5tb2R1bG8obSkgd2l0aCBhIFBPV19QUkVDSVNJT04gb2YgMC5cclxuICAgICAqXHJcbiAgICAgKiBuIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gVGhlIGV4cG9uZW50LiBBbiBpbnRlZ2VyLlxyXG4gICAgICogW21dIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gVGhlIG1vZHVsdXMuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEV4cG9uZW50IG5vdCBhbiBpbnRlZ2VyOiB7bn0nXHJcbiAgICAgKi9cclxuICAgIFAuZXhwb25lbnRpYXRlZEJ5ID0gUC5wb3cgPSBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICB2YXIgaGFsZiwgaXNNb2RFeHAsIGksIGssIG1vcmUsIG5Jc0JpZywgbklzTmVnLCBuSXNPZGQsIHksXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICBuID0gbmV3IEJpZ051bWJlcihuKTtcclxuXHJcbiAgICAgIC8vIEFsbG93IE5hTiBhbmQgwrFJbmZpbml0eSwgYnV0IG5vdCBvdGhlciBub24taW50ZWdlcnMuXHJcbiAgICAgIGlmIChuLmMgJiYgIW4uaXNJbnRlZ2VyKCkpIHtcclxuICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ0V4cG9uZW50IG5vdCBhbiBpbnRlZ2VyOiAnICsgdmFsdWVPZihuKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChtICE9IG51bGwpIG0gPSBuZXcgQmlnTnVtYmVyKG0pO1xyXG5cclxuICAgICAgLy8gRXhwb25lbnQgb2YgTUFYX1NBRkVfSU5URUdFUiBpcyAxNS5cclxuICAgICAgbklzQmlnID0gbi5lID4gMTQ7XHJcblxyXG4gICAgICAvLyBJZiB4IGlzIE5hTiwgwrFJbmZpbml0eSwgwrEwIG9yIMKxMSwgb3IgbiBpcyDCsUluZmluaXR5LCBOYU4gb3IgwrEwLlxyXG4gICAgICBpZiAoIXguYyB8fCAheC5jWzBdIHx8IHguY1swXSA9PSAxICYmICF4LmUgJiYgeC5jLmxlbmd0aCA9PSAxIHx8ICFuLmMgfHwgIW4uY1swXSkge1xyXG5cclxuICAgICAgICAvLyBUaGUgc2lnbiBvZiB0aGUgcmVzdWx0IG9mIHBvdyB3aGVuIHggaXMgbmVnYXRpdmUgZGVwZW5kcyBvbiB0aGUgZXZlbm5lc3Mgb2Ygbi5cclxuICAgICAgICAvLyBJZiArbiBvdmVyZmxvd3MgdG8gwrFJbmZpbml0eSwgdGhlIGV2ZW5uZXNzIG9mIG4gd291bGQgYmUgbm90IGJlIGtub3duLlxyXG4gICAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKE1hdGgucG93KCt2YWx1ZU9mKHgpLCBuSXNCaWcgPyAyIC0gaXNPZGQobikgOiArdmFsdWVPZihuKSkpO1xyXG4gICAgICAgIHJldHVybiBtID8geS5tb2QobSkgOiB5O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBuSXNOZWcgPSBuLnMgPCAwO1xyXG5cclxuICAgICAgaWYgKG0pIHtcclxuXHJcbiAgICAgICAgLy8geCAlIG0gcmV0dXJucyBOYU4gaWYgYWJzKG0pIGlzIHplcm8sIG9yIG0gaXMgTmFOLlxyXG4gICAgICAgIGlmIChtLmMgPyAhbS5jWzBdIDogIW0ucykgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgICAgaXNNb2RFeHAgPSAhbklzTmVnICYmIHguaXNJbnRlZ2VyKCkgJiYgbS5pc0ludGVnZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKGlzTW9kRXhwKSB4ID0geC5tb2QobSk7XHJcblxyXG4gICAgICAvLyBPdmVyZmxvdyB0byDCsUluZmluaXR5OiA+PTIqKjFlMTAgb3IgPj0xLjAwMDAwMjQqKjFlMTUuXHJcbiAgICAgIC8vIFVuZGVyZmxvdyB0byDCsTA6IDw9MC43OSoqMWUxMCBvciA8PTAuOTk5OTk3NSoqMWUxNS5cclxuICAgICAgfSBlbHNlIGlmIChuLmUgPiA5ICYmICh4LmUgPiAwIHx8IHguZSA8IC0xIHx8ICh4LmUgPT0gMFxyXG4gICAgICAgIC8vIFsxLCAyNDAwMDAwMDBdXHJcbiAgICAgICAgPyB4LmNbMF0gPiAxIHx8IG5Jc0JpZyAmJiB4LmNbMV0gPj0gMjRlN1xyXG4gICAgICAgIC8vIFs4MDAwMDAwMDAwMDAwMF0gIFs5OTk5OTc1MDAwMDAwMF1cclxuICAgICAgICA6IHguY1swXSA8IDhlMTMgfHwgbklzQmlnICYmIHguY1swXSA8PSA5OTk5OTc1ZTcpKSkge1xyXG5cclxuICAgICAgICAvLyBJZiB4IGlzIG5lZ2F0aXZlIGFuZCBuIGlzIG9kZCwgayA9IC0wLCBlbHNlIGsgPSAwLlxyXG4gICAgICAgIGsgPSB4LnMgPCAwICYmIGlzT2RkKG4pID8gLTAgOiAwO1xyXG5cclxuICAgICAgICAvLyBJZiB4ID49IDEsIGsgPSDCsUluZmluaXR5LlxyXG4gICAgICAgIGlmICh4LmUgPiAtMSkgayA9IDEgLyBrO1xyXG5cclxuICAgICAgICAvLyBJZiBuIGlzIG5lZ2F0aXZlIHJldHVybiDCsTAsIGVsc2UgcmV0dXJuIMKxSW5maW5pdHkuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIobklzTmVnID8gMSAvIGsgOiBrKTtcclxuXHJcbiAgICAgIH0gZWxzZSBpZiAoUE9XX1BSRUNJU0lPTikge1xyXG5cclxuICAgICAgICAvLyBUcnVuY2F0aW5nIGVhY2ggY29lZmZpY2llbnQgYXJyYXkgdG8gYSBsZW5ndGggb2YgayBhZnRlciBlYWNoIG11bHRpcGxpY2F0aW9uXHJcbiAgICAgICAgLy8gZXF1YXRlcyB0byB0cnVuY2F0aW5nIHNpZ25pZmljYW50IGRpZ2l0cyB0byBQT1dfUFJFQ0lTSU9OICsgWzI4LCA0MV0sXHJcbiAgICAgICAgLy8gaS5lLiB0aGVyZSB3aWxsIGJlIGEgbWluaW11bSBvZiAyOCBndWFyZCBkaWdpdHMgcmV0YWluZWQuXHJcbiAgICAgICAgayA9IG1hdGhjZWlsKFBPV19QUkVDSVNJT04gLyBMT0dfQkFTRSArIDIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobklzQmlnKSB7XHJcbiAgICAgICAgaGFsZiA9IG5ldyBCaWdOdW1iZXIoMC41KTtcclxuICAgICAgICBpZiAobklzTmVnKSBuLnMgPSAxO1xyXG4gICAgICAgIG5Jc09kZCA9IGlzT2RkKG4pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGkgPSBNYXRoLmFicygrdmFsdWVPZihuKSk7XHJcbiAgICAgICAgbklzT2RkID0gaSAlIDI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcblxyXG4gICAgICAvLyBQZXJmb3JtcyA1NCBsb29wIGl0ZXJhdGlvbnMgZm9yIG4gb2YgOTAwNzE5OTI1NDc0MDk5MS5cclxuICAgICAgZm9yICg7IDspIHtcclxuXHJcbiAgICAgICAgaWYgKG5Jc09kZCkge1xyXG4gICAgICAgICAgeSA9IHkudGltZXMoeCk7XHJcbiAgICAgICAgICBpZiAoIXkuYykgYnJlYWs7XHJcblxyXG4gICAgICAgICAgaWYgKGspIHtcclxuICAgICAgICAgICAgaWYgKHkuYy5sZW5ndGggPiBrKSB5LmMubGVuZ3RoID0gaztcclxuICAgICAgICAgIH0gZWxzZSBpZiAoaXNNb2RFeHApIHtcclxuICAgICAgICAgICAgeSA9IHkubW9kKG0pOyAgICAvL3kgPSB5Lm1pbnVzKGRpdih5LCBtLCAwLCBNT0RVTE9fTU9ERSkudGltZXMobSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGkpIHtcclxuICAgICAgICAgIGkgPSBtYXRoZmxvb3IoaSAvIDIpO1xyXG4gICAgICAgICAgaWYgKGkgPT09IDApIGJyZWFrO1xyXG4gICAgICAgICAgbklzT2RkID0gaSAlIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG4gPSBuLnRpbWVzKGhhbGYpO1xyXG4gICAgICAgICAgcm91bmQobiwgbi5lICsgMSwgMSk7XHJcblxyXG4gICAgICAgICAgaWYgKG4uZSA+IDE0KSB7XHJcbiAgICAgICAgICAgIG5Jc09kZCA9IGlzT2RkKG4pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaSA9ICt2YWx1ZU9mKG4pO1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkgYnJlYWs7XHJcbiAgICAgICAgICAgIG5Jc09kZCA9IGkgJSAyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeCA9IHgudGltZXMoeCk7XHJcblxyXG4gICAgICAgIGlmIChrKSB7XHJcbiAgICAgICAgICBpZiAoeC5jICYmIHguYy5sZW5ndGggPiBrKSB4LmMubGVuZ3RoID0gaztcclxuICAgICAgICB9IGVsc2UgaWYgKGlzTW9kRXhwKSB7XHJcbiAgICAgICAgICB4ID0geC5tb2QobSk7ICAgIC8veCA9IHgubWludXMoZGl2KHgsIG0sIDAsIE1PRFVMT19NT0RFKS50aW1lcyhtKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaXNNb2RFeHApIHJldHVybiB5O1xyXG4gICAgICBpZiAobklzTmVnKSB5ID0gT05FLmRpdih5KTtcclxuXHJcbiAgICAgIHJldHVybiBtID8geS5tb2QobSkgOiBrID8gcm91bmQoeSwgUE9XX1BSRUNJU0lPTiwgUk9VTkRJTkdfTU9ERSwgbW9yZSkgOiB5O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gYW4gaW50ZWdlclxyXG4gICAgICogdXNpbmcgcm91bmRpbmcgbW9kZSBybSwgb3IgUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICpcclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3JtfSdcclxuICAgICAqL1xyXG4gICAgUC5pbnRlZ2VyVmFsdWUgPSBmdW5jdGlvbiAocm0pIHtcclxuICAgICAgdmFyIG4gPSBuZXcgQmlnTnVtYmVyKHRoaXMpO1xyXG4gICAgICBpZiAocm0gPT0gbnVsbCkgcm0gPSBST1VORElOR19NT0RFO1xyXG4gICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuICAgICAgcmV0dXJuIHJvdW5kKG4sIG4uZSArIDEsIHJtKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNFcXVhbFRvID0gUC5lcSA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpID09PSAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBhIGZpbml0ZSBudW1iZXIsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNGaW5pdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiAhIXRoaXMuYztcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgKiBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzR3JlYXRlclRoYW4gPSBQLmd0ID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSkgPiAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWdOdW1iZXIoeSwgYiksIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNHcmVhdGVyVGhhbk9yRXF1YWxUbyA9IFAuZ3RlID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIChiID0gY29tcGFyZSh0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpKSkgPT09IDEgfHwgYiA9PT0gMDtcclxuXHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGFuIGludGVnZXIsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNJbnRlZ2VyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gISF0aGlzLmMgJiYgYml0Rmxvb3IodGhpcy5lIC8gTE9HX0JBU0UpID4gdGhpcy5jLmxlbmd0aCAtIDI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc0xlc3NUaGFuID0gUC5sdCA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpIDwgMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzTGVzc1RoYW5PckVxdWFsVG8gPSBQLmx0ZSA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiAoYiA9IGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSkpID09PSAtMSB8fCBiID09PSAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBOYU4sIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNOYU4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiAhdGhpcy5zO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBuZWdhdGl2ZSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc05lZ2F0aXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zIDwgMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgcG9zaXRpdmUsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNQb3NpdGl2ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucyA+IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIDAgb3IgLTAsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNaZXJvID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gISF0aGlzLmMgJiYgdGhpcy5jWzBdID09IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gLSAwID0gblxyXG4gICAgICogIG4gLSBOID0gTlxyXG4gICAgICogIG4gLSBJID0gLUlcclxuICAgICAqICAwIC0gbiA9IC1uXHJcbiAgICAgKiAgMCAtIDAgPSAwXHJcbiAgICAgKiAgMCAtIE4gPSBOXHJcbiAgICAgKiAgMCAtIEkgPSAtSVxyXG4gICAgICogIE4gLSBuID0gTlxyXG4gICAgICogIE4gLSAwID0gTlxyXG4gICAgICogIE4gLSBOID0gTlxyXG4gICAgICogIE4gLSBJID0gTlxyXG4gICAgICogIEkgLSBuID0gSVxyXG4gICAgICogIEkgLSAwID0gSVxyXG4gICAgICogIEkgLSBOID0gTlxyXG4gICAgICogIEkgLSBJID0gTlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG1pbnVzIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICovXHJcbiAgICBQLm1pbnVzID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgdmFyIGksIGosIHQsIHhMVHksXHJcbiAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgYSA9IHgucztcclxuXHJcbiAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKHksIGIpO1xyXG4gICAgICBiID0geS5zO1xyXG5cclxuICAgICAgLy8gRWl0aGVyIE5hTj9cclxuICAgICAgaWYgKCFhIHx8ICFiKSByZXR1cm4gbmV3IEJpZ051bWJlcihOYU4pO1xyXG5cclxuICAgICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgICBpZiAoYSAhPSBiKSB7XHJcbiAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgcmV0dXJuIHgucGx1cyh5KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHhlID0geC5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeWUgPSB5LmUgLyBMT0dfQkFTRSxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgIGlmICgheGUgfHwgIXllKSB7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciBJbmZpbml0eT9cclxuICAgICAgICBpZiAoIXhjIHx8ICF5YykgcmV0dXJuIHhjID8gKHkucyA9IC1iLCB5KSA6IG5ldyBCaWdOdW1iZXIoeWMgPyB4IDogTmFOKTtcclxuXHJcbiAgICAgICAgLy8gRWl0aGVyIHplcm8/XHJcbiAgICAgICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgICAvLyBSZXR1cm4geSBpZiB5IGlzIG5vbi16ZXJvLCB4IGlmIHggaXMgbm9uLXplcm8sIG9yIHplcm8gaWYgYm90aCBhcmUgemVyby5cclxuICAgICAgICAgIHJldHVybiB5Y1swXSA/ICh5LnMgPSAtYiwgeSkgOiBuZXcgQmlnTnVtYmVyKHhjWzBdID8geCA6XHJcblxyXG4gICAgICAgICAgIC8vIElFRUUgNzU0ICgyMDA4KSA2LjM6IG4gLSBuID0gLTAgd2hlbiByb3VuZGluZyB0byAtSW5maW5pdHlcclxuICAgICAgICAgICBST1VORElOR19NT0RFID09IDMgPyAtMCA6IDApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgeGUgPSBiaXRGbG9vcih4ZSk7XHJcbiAgICAgIHllID0gYml0Rmxvb3IoeWUpO1xyXG4gICAgICB4YyA9IHhjLnNsaWNlKCk7XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggaXMgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgIGlmIChhID0geGUgLSB5ZSkge1xyXG5cclxuICAgICAgICBpZiAoeExUeSA9IGEgPCAwKSB7XHJcbiAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHllID0geGU7XHJcbiAgICAgICAgICB0ID0geWM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0LnJldmVyc2UoKTtcclxuXHJcbiAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAgICAgZm9yIChiID0gYTsgYi0tOyB0LnB1c2goMCkpO1xyXG4gICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBFeHBvbmVudHMgZXF1YWwuIENoZWNrIGRpZ2l0IGJ5IGRpZ2l0LlxyXG4gICAgICAgIGogPSAoeExUeSA9IChhID0geGMubGVuZ3RoKSA8IChiID0geWMubGVuZ3RoKSkgPyBhIDogYjtcclxuXHJcbiAgICAgICAgZm9yIChhID0gYiA9IDA7IGIgPCBqOyBiKyspIHtcclxuXHJcbiAgICAgICAgICBpZiAoeGNbYl0gIT0geWNbYl0pIHtcclxuICAgICAgICAgICAgeExUeSA9IHhjW2JdIDwgeWNbYl07XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8geCA8IHk/IFBvaW50IHhjIHRvIHRoZSBhcnJheSBvZiB0aGUgYmlnZ2VyIG51bWJlci5cclxuICAgICAgaWYgKHhMVHkpIHQgPSB4YywgeGMgPSB5YywgeWMgPSB0LCB5LnMgPSAteS5zO1xyXG5cclxuICAgICAgYiA9IChqID0geWMubGVuZ3RoKSAtIChpID0geGMubGVuZ3RoKTtcclxuXHJcbiAgICAgIC8vIEFwcGVuZCB6ZXJvcyB0byB4YyBpZiBzaG9ydGVyLlxyXG4gICAgICAvLyBObyBuZWVkIHRvIGFkZCB6ZXJvcyB0byB5YyBpZiBzaG9ydGVyIGFzIHN1YnRyYWN0IG9ubHkgbmVlZHMgdG8gc3RhcnQgYXQgeWMubGVuZ3RoLlxyXG4gICAgICBpZiAoYiA+IDApIGZvciAoOyBiLS07IHhjW2krK10gPSAwKTtcclxuICAgICAgYiA9IEJBU0UgLSAxO1xyXG5cclxuICAgICAgLy8gU3VidHJhY3QgeWMgZnJvbSB4Yy5cclxuICAgICAgZm9yICg7IGogPiBhOykge1xyXG5cclxuICAgICAgICBpZiAoeGNbLS1qXSA8IHljW2pdKSB7XHJcbiAgICAgICAgICBmb3IgKGkgPSBqOyBpICYmICF4Y1stLWldOyB4Y1tpXSA9IGIpO1xyXG4gICAgICAgICAgLS14Y1tpXTtcclxuICAgICAgICAgIHhjW2pdICs9IEJBU0U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB4Y1tqXSAtPSB5Y1tqXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgemVyb3MgYW5kIGFkanVzdCBleHBvbmVudCBhY2NvcmRpbmdseS5cclxuICAgICAgZm9yICg7IHhjWzBdID09IDA7IHhjLnNwbGljZSgwLCAxKSwgLS15ZSk7XHJcblxyXG4gICAgICAvLyBaZXJvP1xyXG4gICAgICBpZiAoIXhjWzBdKSB7XHJcblxyXG4gICAgICAgIC8vIEZvbGxvd2luZyBJRUVFIDc1NCAoMjAwOCkgNi4zLFxyXG4gICAgICAgIC8vIG4gLSBuID0gKzAgIGJ1dCAgbiAtIG4gPSAtMCAgd2hlbiByb3VuZGluZyB0b3dhcmRzIC1JbmZpbml0eS5cclxuICAgICAgICB5LnMgPSBST1VORElOR19NT0RFID09IDMgPyAtMSA6IDE7XHJcbiAgICAgICAgeS5jID0gW3kuZSA9IDBdO1xyXG4gICAgICAgIHJldHVybiB5O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBObyBuZWVkIHRvIGNoZWNrIGZvciBJbmZpbml0eSBhcyAreCAtICt5ICE9IEluZmluaXR5ICYmIC14IC0gLXkgIT0gSW5maW5pdHlcclxuICAgICAgLy8gZm9yIGZpbml0ZSB4IGFuZCB5LlxyXG4gICAgICByZXR1cm4gbm9ybWFsaXNlKHksIHhjLCB5ZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogICBuICUgMCA9ICBOXHJcbiAgICAgKiAgIG4gJSBOID0gIE5cclxuICAgICAqICAgbiAlIEkgPSAgblxyXG4gICAgICogICAwICUgbiA9ICAwXHJcbiAgICAgKiAgLTAgJSBuID0gLTBcclxuICAgICAqICAgMCAlIDAgPSAgTlxyXG4gICAgICogICAwICUgTiA9ICBOXHJcbiAgICAgKiAgIDAgJSBJID0gIDBcclxuICAgICAqICAgTiAlIG4gPSAgTlxyXG4gICAgICogICBOICUgMCA9ICBOXHJcbiAgICAgKiAgIE4gJSBOID0gIE5cclxuICAgICAqICAgTiAlIEkgPSAgTlxyXG4gICAgICogICBJICUgbiA9ICBOXHJcbiAgICAgKiAgIEkgJSAwID0gIE5cclxuICAgICAqICAgSSAlIE4gPSAgTlxyXG4gICAgICogICBJICUgSSA9ICBOXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbW9kdWxvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLiBUaGUgcmVzdWx0IGRlcGVuZHMgb24gdGhlIHZhbHVlIG9mIE1PRFVMT19NT0RFLlxyXG4gICAgICovXHJcbiAgICBQLm1vZHVsbyA9IFAubW9kID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgdmFyIHEsIHMsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcih5LCBiKTtcclxuXHJcbiAgICAgIC8vIFJldHVybiBOYU4gaWYgeCBpcyBJbmZpbml0eSBvciBOYU4sIG9yIHkgaXMgTmFOIG9yIHplcm8uXHJcbiAgICAgIGlmICgheC5jIHx8ICF5LnMgfHwgeS5jICYmICF5LmNbMF0pIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcihOYU4pO1xyXG5cclxuICAgICAgLy8gUmV0dXJuIHggaWYgeSBpcyBJbmZpbml0eSBvciB4IGlzIHplcm8uXHJcbiAgICAgIH0gZWxzZSBpZiAoIXkuYyB8fCB4LmMgJiYgIXguY1swXSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKHgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoTU9EVUxPX01PREUgPT0gOSkge1xyXG5cclxuICAgICAgICAvLyBFdWNsaWRpYW4gZGl2aXNpb246IHEgPSBzaWduKHkpICogZmxvb3IoeCAvIGFicyh5KSlcclxuICAgICAgICAvLyByID0geCAtIHF5ICAgIHdoZXJlICAwIDw9IHIgPCBhYnMoeSlcclxuICAgICAgICBzID0geS5zO1xyXG4gICAgICAgIHkucyA9IDE7XHJcbiAgICAgICAgcSA9IGRpdih4LCB5LCAwLCAzKTtcclxuICAgICAgICB5LnMgPSBzO1xyXG4gICAgICAgIHEucyAqPSBzO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHEgPSBkaXYoeCwgeSwgMCwgTU9EVUxPX01PREUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB5ID0geC5taW51cyhxLnRpbWVzKHkpKTtcclxuXHJcbiAgICAgIC8vIFRvIG1hdGNoIEphdmFTY3JpcHQgJSwgZW5zdXJlIHNpZ24gb2YgemVybyBpcyBzaWduIG9mIGRpdmlkZW5kLlxyXG4gICAgICBpZiAoIXkuY1swXSAmJiBNT0RVTE9fTU9ERSA9PSAxKSB5LnMgPSB4LnM7XHJcblxyXG4gICAgICByZXR1cm4geTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiAgbiAqIDAgPSAwXHJcbiAgICAgKiAgbiAqIE4gPSBOXHJcbiAgICAgKiAgbiAqIEkgPSBJXHJcbiAgICAgKiAgMCAqIG4gPSAwXHJcbiAgICAgKiAgMCAqIDAgPSAwXHJcbiAgICAgKiAgMCAqIE4gPSBOXHJcbiAgICAgKiAgMCAqIEkgPSBOXHJcbiAgICAgKiAgTiAqIG4gPSBOXHJcbiAgICAgKiAgTiAqIDAgPSBOXHJcbiAgICAgKiAgTiAqIE4gPSBOXHJcbiAgICAgKiAgTiAqIEkgPSBOXHJcbiAgICAgKiAgSSAqIG4gPSBJXHJcbiAgICAgKiAgSSAqIDAgPSBOXHJcbiAgICAgKiAgSSAqIE4gPSBOXHJcbiAgICAgKiAgSSAqIEkgPSBJXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbXVsdGlwbGllZCBieSB0aGUgdmFsdWVcclxuICAgICAqIG9mIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAqL1xyXG4gICAgUC5tdWx0aXBsaWVkQnkgPSBQLnRpbWVzID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgdmFyIGMsIGUsIGksIGosIGssIG0sIHhjTCwgeGxvLCB4aGksIHljTCwgeWxvLCB5aGksIHpjLFxyXG4gICAgICAgIGJhc2UsIHNxcnRCYXNlLFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgIHljID0gKHkgPSBuZXcgQmlnTnVtYmVyKHksIGIpKS5jO1xyXG5cclxuICAgICAgLy8gRWl0aGVyIE5hTiwgwrFJbmZpbml0eSBvciDCsTA/XHJcbiAgICAgIGlmICgheGMgfHwgIXljIHx8ICF4Y1swXSB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgLy8gUmV0dXJuIE5hTiBpZiBlaXRoZXIgaXMgTmFOLCBvciBvbmUgaXMgMCBhbmQgdGhlIG90aGVyIGlzIEluZmluaXR5LlxyXG4gICAgICAgIGlmICgheC5zIHx8ICF5LnMgfHwgeGMgJiYgIXhjWzBdICYmICF5YyB8fCB5YyAmJiAheWNbMF0gJiYgIXhjKSB7XHJcbiAgICAgICAgICB5LmMgPSB5LmUgPSB5LnMgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB5LnMgKj0geC5zO1xyXG5cclxuICAgICAgICAgIC8vIFJldHVybiDCsUluZmluaXR5IGlmIGVpdGhlciBpcyDCsUluZmluaXR5LlxyXG4gICAgICAgICAgaWYgKCF4YyB8fCAheWMpIHtcclxuICAgICAgICAgICAgeS5jID0geS5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAvLyBSZXR1cm4gwrEwIGlmIGVpdGhlciBpcyDCsTAuXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB5LmMgPSBbMF07XHJcbiAgICAgICAgICAgIHkuZSA9IDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZSA9IGJpdEZsb29yKHguZSAvIExPR19CQVNFKSArIGJpdEZsb29yKHkuZSAvIExPR19CQVNFKTtcclxuICAgICAgeS5zICo9IHgucztcclxuICAgICAgeGNMID0geGMubGVuZ3RoO1xyXG4gICAgICB5Y0wgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBFbnN1cmUgeGMgcG9pbnRzIHRvIGxvbmdlciBhcnJheSBhbmQgeGNMIHRvIGl0cyBsZW5ndGguXHJcbiAgICAgIGlmICh4Y0wgPCB5Y0wpIHpjID0geGMsIHhjID0geWMsIHljID0gemMsIGkgPSB4Y0wsIHhjTCA9IHljTCwgeWNMID0gaTtcclxuXHJcbiAgICAgIC8vIEluaXRpYWxpc2UgdGhlIHJlc3VsdCBhcnJheSB3aXRoIHplcm9zLlxyXG4gICAgICBmb3IgKGkgPSB4Y0wgKyB5Y0wsIHpjID0gW107IGktLTsgemMucHVzaCgwKSk7XHJcblxyXG4gICAgICBiYXNlID0gQkFTRTtcclxuICAgICAgc3FydEJhc2UgPSBTUVJUX0JBU0U7XHJcblxyXG4gICAgICBmb3IgKGkgPSB5Y0w7IC0taSA+PSAwOykge1xyXG4gICAgICAgIGMgPSAwO1xyXG4gICAgICAgIHlsbyA9IHljW2ldICUgc3FydEJhc2U7XHJcbiAgICAgICAgeWhpID0geWNbaV0gLyBzcXJ0QmFzZSB8IDA7XHJcblxyXG4gICAgICAgIGZvciAoayA9IHhjTCwgaiA9IGkgKyBrOyBqID4gaTspIHtcclxuICAgICAgICAgIHhsbyA9IHhjWy0ta10gJSBzcXJ0QmFzZTtcclxuICAgICAgICAgIHhoaSA9IHhjW2tdIC8gc3FydEJhc2UgfCAwO1xyXG4gICAgICAgICAgbSA9IHloaSAqIHhsbyArIHhoaSAqIHlsbztcclxuICAgICAgICAgIHhsbyA9IHlsbyAqIHhsbyArICgobSAlIHNxcnRCYXNlKSAqIHNxcnRCYXNlKSArIHpjW2pdICsgYztcclxuICAgICAgICAgIGMgPSAoeGxvIC8gYmFzZSB8IDApICsgKG0gLyBzcXJ0QmFzZSB8IDApICsgeWhpICogeGhpO1xyXG4gICAgICAgICAgemNbai0tXSA9IHhsbyAlIGJhc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB6Y1tqXSA9IGM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjKSB7XHJcbiAgICAgICAgKytlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHpjLnNwbGljZSgwLCAxKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5vcm1hbGlzZSh5LCB6YywgZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbmVnYXRlZCxcclxuICAgICAqIGkuZS4gbXVsdGlwbGllZCBieSAtMS5cclxuICAgICAqL1xyXG4gICAgUC5uZWdhdGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgeCA9IG5ldyBCaWdOdW1iZXIodGhpcyk7XHJcbiAgICAgIHgucyA9IC14LnMgfHwgbnVsbDtcclxuICAgICAgcmV0dXJuIHg7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gKyAwID0gblxyXG4gICAgICogIG4gKyBOID0gTlxyXG4gICAgICogIG4gKyBJID0gSVxyXG4gICAgICogIDAgKyBuID0gblxyXG4gICAgICogIDAgKyAwID0gMFxyXG4gICAgICogIDAgKyBOID0gTlxyXG4gICAgICogIDAgKyBJID0gSVxyXG4gICAgICogIE4gKyBuID0gTlxyXG4gICAgICogIE4gKyAwID0gTlxyXG4gICAgICogIE4gKyBOID0gTlxyXG4gICAgICogIE4gKyBJID0gTlxyXG4gICAgICogIEkgKyBuID0gSVxyXG4gICAgICogIEkgKyAwID0gSVxyXG4gICAgICogIEkgKyBOID0gTlxyXG4gICAgICogIEkgKyBJID0gSVxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHBsdXMgdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgKi9cclxuICAgIFAucGx1cyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciB0LFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIGEgPSB4LnM7XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcih5LCBiKTtcclxuICAgICAgYiA9IHkucztcclxuXHJcbiAgICAgIC8vIEVpdGhlciBOYU4/XHJcbiAgICAgIGlmICghYSB8fCAhYikgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgICAgIGlmIChhICE9IGIpIHtcclxuICAgICAgICB5LnMgPSAtYjtcclxuICAgICAgICByZXR1cm4geC5taW51cyh5KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHhlID0geC5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeWUgPSB5LmUgLyBMT0dfQkFTRSxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgIGlmICgheGUgfHwgIXllKSB7XHJcblxyXG4gICAgICAgIC8vIFJldHVybiDCsUluZmluaXR5IGlmIGVpdGhlciDCsUluZmluaXR5LlxyXG4gICAgICAgIGlmICgheGMgfHwgIXljKSByZXR1cm4gbmV3IEJpZ051bWJlcihhIC8gMCk7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIC8vIFJldHVybiB5IGlmIHkgaXMgbm9uLXplcm8sIHggaWYgeCBpcyBub24temVybywgb3IgemVybyBpZiBib3RoIGFyZSB6ZXJvLlxyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSByZXR1cm4geWNbMF0gPyB5IDogbmV3IEJpZ051bWJlcih4Y1swXSA/IHggOiBhICogMCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHhlID0gYml0Rmxvb3IoeGUpO1xyXG4gICAgICB5ZSA9IGJpdEZsb29yKHllKTtcclxuICAgICAgeGMgPSB4Yy5zbGljZSgpO1xyXG5cclxuICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuIEZhc3RlciB0byB1c2UgcmV2ZXJzZSB0aGVuIGRvIHVuc2hpZnRzLlxyXG4gICAgICBpZiAoYSA9IHhlIC0geWUpIHtcclxuICAgICAgICBpZiAoYSA+IDApIHtcclxuICAgICAgICAgIHllID0geGU7XHJcbiAgICAgICAgICB0ID0geWM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGEgPSAtYTtcclxuICAgICAgICAgIHQgPSB4YztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIGZvciAoOyBhLS07IHQucHVzaCgwKSk7XHJcbiAgICAgICAgdC5yZXZlcnNlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGEgPSB4Yy5sZW5ndGg7XHJcbiAgICAgIGIgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBQb2ludCB4YyB0byB0aGUgbG9uZ2VyIGFycmF5LCBhbmQgYiB0byB0aGUgc2hvcnRlciBsZW5ndGguXHJcbiAgICAgIGlmIChhIC0gYiA8IDApIHQgPSB5YywgeWMgPSB4YywgeGMgPSB0LCBiID0gYTtcclxuXHJcbiAgICAgIC8vIE9ubHkgc3RhcnQgYWRkaW5nIGF0IHljLmxlbmd0aCAtIDEgYXMgdGhlIGZ1cnRoZXIgZGlnaXRzIG9mIHhjIGNhbiBiZSBpZ25vcmVkLlxyXG4gICAgICBmb3IgKGEgPSAwOyBiOykge1xyXG4gICAgICAgIGEgPSAoeGNbLS1iXSA9IHhjW2JdICsgeWNbYl0gKyBhKSAvIEJBU0UgfCAwO1xyXG4gICAgICAgIHhjW2JdID0gQkFTRSA9PT0geGNbYl0gPyAwIDogeGNbYl0gJSBCQVNFO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoYSkge1xyXG4gICAgICAgIHhjID0gW2FdLmNvbmNhdCh4Yyk7XHJcbiAgICAgICAgKyt5ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgemVybywgYXMgK3ggKyAreSAhPSAwICYmIC14ICsgLXkgIT0gMFxyXG4gICAgICAvLyB5ZSA9IE1BWF9FWFAgKyAxIHBvc3NpYmxlXHJcbiAgICAgIHJldHVybiBub3JtYWxpc2UoeSwgeGMsIHllKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBJZiBzZCBpcyB1bmRlZmluZWQgb3IgbnVsbCBvciB0cnVlIG9yIGZhbHNlLCByZXR1cm4gdGhlIG51bWJlciBvZiBzaWduaWZpY2FudCBkaWdpdHMgb2ZcclxuICAgICAqIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciwgb3IgbnVsbCBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgwrFJbmZpbml0eSBvciBOYU4uXHJcbiAgICAgKiBJZiBzZCBpcyB0cnVlIGluY2x1ZGUgaW50ZWdlci1wYXJ0IHRyYWlsaW5nIHplcm9zIGluIHRoZSBjb3VudC5cclxuICAgICAqXHJcbiAgICAgKiBPdGhlcndpc2UsIGlmIHNkIGlzIGEgbnVtYmVyLCByZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzXHJcbiAgICAgKiBCaWdOdW1iZXIgcm91bmRlZCB0byBhIG1heGltdW0gb2Ygc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yXHJcbiAgICAgKiBST1VORElOR19NT0RFIGlmIHJtIGlzIG9taXR0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogc2Qge251bWJlcnxib29sZWFufSBudW1iZXI6IHNpZ25pZmljYW50IGRpZ2l0czogaW50ZWdlciwgMSB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICBib29sZWFuOiB3aGV0aGVyIHRvIGNvdW50IGludGVnZXItcGFydCB0cmFpbGluZyB6ZXJvczogdHJ1ZSBvciBmYWxzZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3NkfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC5wcmVjaXNpb24gPSBQLnNkID0gZnVuY3Rpb24gKHNkLCBybSkge1xyXG4gICAgICB2YXIgYywgbiwgdixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChzZCAhPSBudWxsICYmIHNkICE9PSAhIXNkKSB7XHJcbiAgICAgICAgaW50Q2hlY2soc2QsIDEsIE1BWCk7XHJcbiAgICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvdW5kKG5ldyBCaWdOdW1iZXIoeCksIHNkLCBybSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghKGMgPSB4LmMpKSByZXR1cm4gbnVsbDtcclxuICAgICAgdiA9IGMubGVuZ3RoIC0gMTtcclxuICAgICAgbiA9IHYgKiBMT0dfQkFTRSArIDE7XHJcblxyXG4gICAgICBpZiAodiA9IGNbdl0pIHtcclxuXHJcbiAgICAgICAgLy8gU3VidHJhY3QgdGhlIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvcyBvZiB0aGUgbGFzdCBlbGVtZW50LlxyXG4gICAgICAgIGZvciAoOyB2ICUgMTAgPT0gMDsgdiAvPSAxMCwgbi0tKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHRoZSBmaXJzdCBlbGVtZW50LlxyXG4gICAgICAgIGZvciAodiA9IGNbMF07IHYgPj0gMTA7IHYgLz0gMTAsIG4rKyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzZCAmJiB4LmUgKyAxID4gbikgbiA9IHguZSArIDE7XHJcblxyXG4gICAgICByZXR1cm4gbjtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBzaGlmdGVkIGJ5IGsgcGxhY2VzXHJcbiAgICAgKiAocG93ZXJzIG9mIDEwKS4gU2hpZnQgdG8gdGhlIHJpZ2h0IGlmIG4gPiAwLCBhbmQgdG8gdGhlIGxlZnQgaWYgbiA8IDAuXHJcbiAgICAgKlxyXG4gICAgICogayB7bnVtYmVyfSBJbnRlZ2VyLCAtTUFYX1NBRkVfSU5URUdFUiB0byBNQVhfU0FGRV9JTlRFR0VSIGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2t9J1xyXG4gICAgICovXHJcbiAgICBQLnNoaWZ0ZWRCeSA9IGZ1bmN0aW9uIChrKSB7XHJcbiAgICAgIGludENoZWNrKGssIC1NQVhfU0FGRV9JTlRFR0VSLCBNQVhfU0FGRV9JTlRFR0VSKTtcclxuICAgICAgcmV0dXJuIHRoaXMudGltZXMoJzFlJyArIGspO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBzcXJ0KC1uKSA9ICBOXHJcbiAgICAgKiAgc3FydChOKSA9ICBOXHJcbiAgICAgKiAgc3FydCgtSSkgPSAgTlxyXG4gICAgICogIHNxcnQoSSkgPSAgSVxyXG4gICAgICogIHNxcnQoMCkgPSAgMFxyXG4gICAgICogIHNxcnQoLTApID0gLTBcclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBzcXVhcmUgcm9vdCBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsXHJcbiAgICAgKiByb3VuZGVkIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqL1xyXG4gICAgUC5zcXVhcmVSb290ID0gUC5zcXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgbSwgbiwgciwgcmVwLCB0LFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIGMgPSB4LmMsXHJcbiAgICAgICAgcyA9IHgucyxcclxuICAgICAgICBlID0geC5lLFxyXG4gICAgICAgIGRwID0gREVDSU1BTF9QTEFDRVMgKyA0LFxyXG4gICAgICAgIGhhbGYgPSBuZXcgQmlnTnVtYmVyKCcwLjUnKTtcclxuXHJcbiAgICAgIC8vIE5lZ2F0aXZlL05hTi9JbmZpbml0eS96ZXJvP1xyXG4gICAgICBpZiAocyAhPT0gMSB8fCAhYyB8fCAhY1swXSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKCFzIHx8IHMgPCAwICYmICghYyB8fCBjWzBdKSA/IE5hTiA6IGMgPyB4IDogMSAvIDApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbml0aWFsIGVzdGltYXRlLlxyXG4gICAgICBzID0gTWF0aC5zcXJ0KCt2YWx1ZU9mKHgpKTtcclxuXHJcbiAgICAgIC8vIE1hdGguc3FydCB1bmRlcmZsb3cvb3ZlcmZsb3c/XHJcbiAgICAgIC8vIFBhc3MgeCB0byBNYXRoLnNxcnQgYXMgaW50ZWdlciwgdGhlbiBhZGp1c3QgdGhlIGV4cG9uZW50IG9mIHRoZSByZXN1bHQuXHJcbiAgICAgIGlmIChzID09IDAgfHwgcyA9PSAxIC8gMCkge1xyXG4gICAgICAgIG4gPSBjb2VmZlRvU3RyaW5nKGMpO1xyXG4gICAgICAgIGlmICgobi5sZW5ndGggKyBlKSAlIDIgPT0gMCkgbiArPSAnMCc7XHJcbiAgICAgICAgcyA9IE1hdGguc3FydCgrbik7XHJcbiAgICAgICAgZSA9IGJpdEZsb29yKChlICsgMSkgLyAyKSAtIChlIDwgMCB8fCBlICUgMik7XHJcblxyXG4gICAgICAgIGlmIChzID09IDEgLyAwKSB7XHJcbiAgICAgICAgICBuID0gJzFlJyArIGU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG4gPSBzLnRvRXhwb25lbnRpYWwoKTtcclxuICAgICAgICAgIG4gPSBuLnNsaWNlKDAsIG4uaW5kZXhPZignZScpICsgMSkgKyBlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgciA9IG5ldyBCaWdOdW1iZXIobik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgciA9IG5ldyBCaWdOdW1iZXIocyArICcnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ2hlY2sgZm9yIHplcm8uXHJcbiAgICAgIC8vIHIgY291bGQgYmUgemVybyBpZiBNSU5fRVhQIGlzIGNoYW5nZWQgYWZ0ZXIgdGhlIHRoaXMgdmFsdWUgd2FzIGNyZWF0ZWQuXHJcbiAgICAgIC8vIFRoaXMgd291bGQgY2F1c2UgYSBkaXZpc2lvbiBieSB6ZXJvICh4L3QpIGFuZCBoZW5jZSBJbmZpbml0eSBiZWxvdywgd2hpY2ggd291bGQgY2F1c2VcclxuICAgICAgLy8gY29lZmZUb1N0cmluZyB0byB0aHJvdy5cclxuICAgICAgaWYgKHIuY1swXSkge1xyXG4gICAgICAgIGUgPSByLmU7XHJcbiAgICAgICAgcyA9IGUgKyBkcDtcclxuICAgICAgICBpZiAocyA8IDMpIHMgPSAwO1xyXG5cclxuICAgICAgICAvLyBOZXd0b24tUmFwaHNvbiBpdGVyYXRpb24uXHJcbiAgICAgICAgZm9yICg7IDspIHtcclxuICAgICAgICAgIHQgPSByO1xyXG4gICAgICAgICAgciA9IGhhbGYudGltZXModC5wbHVzKGRpdih4LCB0LCBkcCwgMSkpKTtcclxuXHJcbiAgICAgICAgICBpZiAoY29lZmZUb1N0cmluZyh0LmMpLnNsaWNlKDAsIHMpID09PSAobiA9IGNvZWZmVG9TdHJpbmcoci5jKSkuc2xpY2UoMCwgcykpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBleHBvbmVudCBvZiByIG1heSBoZXJlIGJlIG9uZSBsZXNzIHRoYW4gdGhlIGZpbmFsIHJlc3VsdCBleHBvbmVudCxcclxuICAgICAgICAgICAgLy8gZS5nIDAuMDAwOTk5OSAoZS00KSAtLT4gMC4wMDEgKGUtMyksIHNvIGFkanVzdCBzIHNvIHRoZSByb3VuZGluZyBkaWdpdHNcclxuICAgICAgICAgICAgLy8gYXJlIGluZGV4ZWQgY29ycmVjdGx5LlxyXG4gICAgICAgICAgICBpZiAoci5lIDwgZSkgLS1zO1xyXG4gICAgICAgICAgICBuID0gbi5zbGljZShzIC0gMywgcyArIDEpO1xyXG5cclxuICAgICAgICAgICAgLy8gVGhlIDR0aCByb3VuZGluZyBkaWdpdCBtYXkgYmUgaW4gZXJyb3IgYnkgLTEgc28gaWYgdGhlIDQgcm91bmRpbmcgZGlnaXRzXHJcbiAgICAgICAgICAgIC8vIGFyZSA5OTk5IG9yIDQ5OTkgKGkuZS4gYXBwcm9hY2hpbmcgYSByb3VuZGluZyBib3VuZGFyeSkgY29udGludWUgdGhlXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdGlvbi5cclxuICAgICAgICAgICAgaWYgKG4gPT0gJzk5OTknIHx8ICFyZXAgJiYgbiA9PSAnNDk5OScpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gT24gdGhlIGZpcnN0IGl0ZXJhdGlvbiBvbmx5LCBjaGVjayB0byBzZWUgaWYgcm91bmRpbmcgdXAgZ2l2ZXMgdGhlXHJcbiAgICAgICAgICAgICAgLy8gZXhhY3QgcmVzdWx0IGFzIHRoZSBuaW5lcyBtYXkgaW5maW5pdGVseSByZXBlYXQuXHJcbiAgICAgICAgICAgICAgaWYgKCFyZXApIHtcclxuICAgICAgICAgICAgICAgIHJvdW5kKHQsIHQuZSArIERFQ0lNQUxfUExBQ0VTICsgMiwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHQudGltZXModCkuZXEoeCkpIHtcclxuICAgICAgICAgICAgICAgICAgciA9IHQ7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgZHAgKz0gNDtcclxuICAgICAgICAgICAgICBzICs9IDQ7XHJcbiAgICAgICAgICAgICAgcmVwID0gMTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgcm91bmRpbmcgZGlnaXRzIGFyZSBudWxsLCAwezAsNH0gb3IgNTB7MCwzfSwgY2hlY2sgZm9yIGV4YWN0XHJcbiAgICAgICAgICAgICAgLy8gcmVzdWx0LiBJZiBub3QsIHRoZW4gdGhlcmUgYXJlIGZ1cnRoZXIgZGlnaXRzIGFuZCBtIHdpbGwgYmUgdHJ1dGh5LlxyXG4gICAgICAgICAgICAgIGlmICghK24gfHwgIStuLnNsaWNlKDEpICYmIG4uY2hhckF0KDApID09ICc1Jykge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFRydW5jYXRlIHRvIHRoZSBmaXJzdCByb3VuZGluZyBkaWdpdC5cclxuICAgICAgICAgICAgICAgIHJvdW5kKHIsIHIuZSArIERFQ0lNQUxfUExBQ0VTICsgMiwgMSk7XHJcbiAgICAgICAgICAgICAgICBtID0gIXIudGltZXMocikuZXEoeCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJvdW5kKHIsIHIuZSArIERFQ0lNQUxfUExBQ0VTICsgMSwgUk9VTkRJTkdfTU9ERSwgbSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZXhwb25lbnRpYWwgbm90YXRpb24gYW5kXHJcbiAgICAgKiByb3VuZGVkIHVzaW5nIFJPVU5ESU5HX01PREUgdG8gZHAgZml4ZWQgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7ZHB8cm19J1xyXG4gICAgICovXHJcbiAgICBQLnRvRXhwb25lbnRpYWwgPSBmdW5jdGlvbiAoZHAsIHJtKSB7XHJcbiAgICAgIGlmIChkcCAhPSBudWxsKSB7XHJcbiAgICAgICAgaW50Q2hlY2soZHAsIDAsIE1BWCk7XHJcbiAgICAgICAgZHArKztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIGRwLCBybSwgMSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24gcm91bmRpbmdcclxuICAgICAqIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIFJPVU5ESU5HX01PREUgaWYgcm0gaXMgb21pdHRlZC5cclxuICAgICAqXHJcbiAgICAgKiBOb3RlOiBhcyB3aXRoIEphdmFTY3JpcHQncyBudW1iZXIgdHlwZSwgKC0wKS50b0ZpeGVkKDApIGlzICcwJyxcclxuICAgICAqIGJ1dCBlLmcuICgtMC4wMDAwMSkudG9GaXhlZCgwKSBpcyAnLTAnLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC50b0ZpeGVkID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgICBpZiAoZHAgIT0gbnVsbCkge1xyXG4gICAgICAgIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG4gICAgICAgIGRwID0gZHAgKyB0aGlzLmUgKyAxO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmb3JtYXQodGhpcywgZHAsIHJtKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpbiBmaXhlZC1wb2ludCBub3RhdGlvbiByb3VuZGVkXHJcbiAgICAgKiB1c2luZyBybSBvciBST1VORElOR19NT0RFIHRvIGRwIGRlY2ltYWwgcGxhY2VzLCBhbmQgZm9ybWF0dGVkIGFjY29yZGluZyB0byB0aGUgcHJvcGVydGllc1xyXG4gICAgICogb2YgdGhlIGZvcm1hdCBvciBGT1JNQVQgb2JqZWN0IChzZWUgQmlnTnVtYmVyLnNldCkuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIGZvcm1hdHRpbmcgb2JqZWN0IG1heSBjb250YWluIHNvbWUgb3IgYWxsIG9mIHRoZSBwcm9wZXJ0aWVzIHNob3duIGJlbG93LlxyXG4gICAgICpcclxuICAgICAqIEZPUk1BVCA9IHtcclxuICAgICAqICAgcHJlZml4OiAnJyxcclxuICAgICAqICAgZ3JvdXBTaXplOiAzLFxyXG4gICAgICogICBzZWNvbmRhcnlHcm91cFNpemU6IDAsXHJcbiAgICAgKiAgIGdyb3VwU2VwYXJhdG9yOiAnLCcsXHJcbiAgICAgKiAgIGRlY2ltYWxTZXBhcmF0b3I6ICcuJyxcclxuICAgICAqICAgZnJhY3Rpb25Hcm91cFNpemU6IDAsXHJcbiAgICAgKiAgIGZyYWN0aW9uR3JvdXBTZXBhcmF0b3I6ICdcXHhBMCcsICAgICAgLy8gbm9uLWJyZWFraW5nIHNwYWNlXHJcbiAgICAgKiAgIHN1ZmZpeDogJydcclxuICAgICAqIH07XHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICogW2Zvcm1hdF0ge29iamVjdH0gRm9ybWF0dGluZyBvcHRpb25zLiBTZWUgRk9STUFUIHBiamVjdCBhYm92ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCBub3QgYW4gb2JqZWN0OiB7Zm9ybWF0fSdcclxuICAgICAqL1xyXG4gICAgUC50b0Zvcm1hdCA9IGZ1bmN0aW9uIChkcCwgcm0sIGZvcm1hdCkge1xyXG4gICAgICB2YXIgc3RyLFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgaWYgKGZvcm1hdCA9PSBudWxsKSB7XHJcbiAgICAgICAgaWYgKGRwICE9IG51bGwgJiYgcm0gJiYgdHlwZW9mIHJtID09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICBmb3JtYXQgPSBybTtcclxuICAgICAgICAgIHJtID0gbnVsbDtcclxuICAgICAgICB9IGVsc2UgaWYgKGRwICYmIHR5cGVvZiBkcCA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgZm9ybWF0ID0gZHA7XHJcbiAgICAgICAgICBkcCA9IHJtID0gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZm9ybWF0ID0gRk9STUFUO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZm9ybWF0ICE9ICdvYmplY3QnKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdBcmd1bWVudCBub3QgYW4gb2JqZWN0OiAnICsgZm9ybWF0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc3RyID0geC50b0ZpeGVkKGRwLCBybSk7XHJcblxyXG4gICAgICBpZiAoeC5jKSB7XHJcbiAgICAgICAgdmFyIGksXHJcbiAgICAgICAgICBhcnIgPSBzdHIuc3BsaXQoJy4nKSxcclxuICAgICAgICAgIGcxID0gK2Zvcm1hdC5ncm91cFNpemUsXHJcbiAgICAgICAgICBnMiA9ICtmb3JtYXQuc2Vjb25kYXJ5R3JvdXBTaXplLFxyXG4gICAgICAgICAgZ3JvdXBTZXBhcmF0b3IgPSBmb3JtYXQuZ3JvdXBTZXBhcmF0b3IgfHwgJycsXHJcbiAgICAgICAgICBpbnRQYXJ0ID0gYXJyWzBdLFxyXG4gICAgICAgICAgZnJhY3Rpb25QYXJ0ID0gYXJyWzFdLFxyXG4gICAgICAgICAgaXNOZWcgPSB4LnMgPCAwLFxyXG4gICAgICAgICAgaW50RGlnaXRzID0gaXNOZWcgPyBpbnRQYXJ0LnNsaWNlKDEpIDogaW50UGFydCxcclxuICAgICAgICAgIGxlbiA9IGludERpZ2l0cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmIChnMikgaSA9IGcxLCBnMSA9IGcyLCBnMiA9IGksIGxlbiAtPSBpO1xyXG5cclxuICAgICAgICBpZiAoZzEgPiAwICYmIGxlbiA+IDApIHtcclxuICAgICAgICAgIGkgPSBsZW4gJSBnMSB8fCBnMTtcclxuICAgICAgICAgIGludFBhcnQgPSBpbnREaWdpdHMuc3Vic3RyKDAsIGkpO1xyXG4gICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkgKz0gZzEpIGludFBhcnQgKz0gZ3JvdXBTZXBhcmF0b3IgKyBpbnREaWdpdHMuc3Vic3RyKGksIGcxKTtcclxuICAgICAgICAgIGlmIChnMiA+IDApIGludFBhcnQgKz0gZ3JvdXBTZXBhcmF0b3IgKyBpbnREaWdpdHMuc2xpY2UoaSk7XHJcbiAgICAgICAgICBpZiAoaXNOZWcpIGludFBhcnQgPSAnLScgKyBpbnRQYXJ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RyID0gZnJhY3Rpb25QYXJ0XHJcbiAgICAgICAgID8gaW50UGFydCArIChmb3JtYXQuZGVjaW1hbFNlcGFyYXRvciB8fCAnJykgKyAoKGcyID0gK2Zvcm1hdC5mcmFjdGlvbkdyb3VwU2l6ZSlcclxuICAgICAgICAgID8gZnJhY3Rpb25QYXJ0LnJlcGxhY2UobmV3IFJlZ0V4cCgnXFxcXGR7JyArIGcyICsgJ31cXFxcQicsICdnJyksXHJcbiAgICAgICAgICAgJyQmJyArIChmb3JtYXQuZnJhY3Rpb25Hcm91cFNlcGFyYXRvciB8fCAnJykpXHJcbiAgICAgICAgICA6IGZyYWN0aW9uUGFydClcclxuICAgICAgICAgOiBpbnRQYXJ0O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKGZvcm1hdC5wcmVmaXggfHwgJycpICsgc3RyICsgKGZvcm1hdC5zdWZmaXggfHwgJycpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhbiBhcnJheSBvZiB0d28gQmlnTnVtYmVycyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGFzIGEgc2ltcGxlXHJcbiAgICAgKiBmcmFjdGlvbiB3aXRoIGFuIGludGVnZXIgbnVtZXJhdG9yIGFuZCBhbiBpbnRlZ2VyIGRlbm9taW5hdG9yLlxyXG4gICAgICogVGhlIGRlbm9taW5hdG9yIHdpbGwgYmUgYSBwb3NpdGl2ZSBub24temVybyB2YWx1ZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHNwZWNpZmllZFxyXG4gICAgICogbWF4aW11bSBkZW5vbWluYXRvci4gSWYgYSBtYXhpbXVtIGRlbm9taW5hdG9yIGlzIG5vdCBzcGVjaWZpZWQsIHRoZSBkZW5vbWluYXRvciB3aWxsIGJlXHJcbiAgICAgKiB0aGUgbG93ZXN0IHZhbHVlIG5lY2Vzc2FyeSB0byByZXByZXNlbnQgdGhlIG51bWJlciBleGFjdGx5LlxyXG4gICAgICpcclxuICAgICAqIFttZF0ge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfSBJbnRlZ2VyID49IDEsIG9yIEluZmluaXR5LiBUaGUgbWF4aW11bSBkZW5vbWluYXRvci5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX0gOiB7bWR9J1xyXG4gICAgICovXHJcbiAgICBQLnRvRnJhY3Rpb24gPSBmdW5jdGlvbiAobWQpIHtcclxuICAgICAgdmFyIGQsIGQwLCBkMSwgZDIsIGUsIGV4cCwgbiwgbjAsIG4xLCBxLCByLCBzLFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIHhjID0geC5jO1xyXG5cclxuICAgICAgaWYgKG1kICE9IG51bGwpIHtcclxuICAgICAgICBuID0gbmV3IEJpZ051bWJlcihtZCk7XHJcblxyXG4gICAgICAgIC8vIFRocm93IGlmIG1kIGlzIGxlc3MgdGhhbiBvbmUgb3IgaXMgbm90IGFuIGludGVnZXIsIHVubGVzcyBpdCBpcyBJbmZpbml0eS5cclxuICAgICAgICBpZiAoIW4uaXNJbnRlZ2VyKCkgJiYgKG4uYyB8fCBuLnMgIT09IDEpIHx8IG4ubHQoT05FKSkge1xyXG4gICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ0FyZ3VtZW50ICcgK1xyXG4gICAgICAgICAgICAgIChuLmlzSW50ZWdlcigpID8gJ291dCBvZiByYW5nZTogJyA6ICdub3QgYW4gaW50ZWdlcjogJykgKyB2YWx1ZU9mKG4pKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICgheGMpIHJldHVybiBuZXcgQmlnTnVtYmVyKHgpO1xyXG5cclxuICAgICAgZCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuICAgICAgbjEgPSBkMCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuICAgICAgZDEgPSBuMCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuICAgICAgcyA9IGNvZWZmVG9TdHJpbmcoeGMpO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIGluaXRpYWwgZGVub21pbmF0b3IuXHJcbiAgICAgIC8vIGQgaXMgYSBwb3dlciBvZiAxMCBhbmQgdGhlIG1pbmltdW0gbWF4IGRlbm9taW5hdG9yIHRoYXQgc3BlY2lmaWVzIHRoZSB2YWx1ZSBleGFjdGx5LlxyXG4gICAgICBlID0gZC5lID0gcy5sZW5ndGggLSB4LmUgLSAxO1xyXG4gICAgICBkLmNbMF0gPSBQT1dTX1RFTlsoZXhwID0gZSAlIExPR19CQVNFKSA8IDAgPyBMT0dfQkFTRSArIGV4cCA6IGV4cF07XHJcbiAgICAgIG1kID0gIW1kIHx8IG4uY29tcGFyZWRUbyhkKSA+IDAgPyAoZSA+IDAgPyBkIDogbjEpIDogbjtcclxuXHJcbiAgICAgIGV4cCA9IE1BWF9FWFA7XHJcbiAgICAgIE1BWF9FWFAgPSAxIC8gMDtcclxuICAgICAgbiA9IG5ldyBCaWdOdW1iZXIocyk7XHJcblxyXG4gICAgICAvLyBuMCA9IGQxID0gMFxyXG4gICAgICBuMC5jWzBdID0gMDtcclxuXHJcbiAgICAgIGZvciAoOyA7KSAge1xyXG4gICAgICAgIHEgPSBkaXYobiwgZCwgMCwgMSk7XHJcbiAgICAgICAgZDIgPSBkMC5wbHVzKHEudGltZXMoZDEpKTtcclxuICAgICAgICBpZiAoZDIuY29tcGFyZWRUbyhtZCkgPT0gMSkgYnJlYWs7XHJcbiAgICAgICAgZDAgPSBkMTtcclxuICAgICAgICBkMSA9IGQyO1xyXG4gICAgICAgIG4xID0gbjAucGx1cyhxLnRpbWVzKGQyID0gbjEpKTtcclxuICAgICAgICBuMCA9IGQyO1xyXG4gICAgICAgIGQgPSBuLm1pbnVzKHEudGltZXMoZDIgPSBkKSk7XHJcbiAgICAgICAgbiA9IGQyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkMiA9IGRpdihtZC5taW51cyhkMCksIGQxLCAwLCAxKTtcclxuICAgICAgbjAgPSBuMC5wbHVzKGQyLnRpbWVzKG4xKSk7XHJcbiAgICAgIGQwID0gZDAucGx1cyhkMi50aW1lcyhkMSkpO1xyXG4gICAgICBuMC5zID0gbjEucyA9IHgucztcclxuICAgICAgZSA9IGUgKiAyO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGZyYWN0aW9uIGlzIGNsb3NlciB0byB4LCBuMC9kMCBvciBuMS9kMVxyXG4gICAgICByID0gZGl2KG4xLCBkMSwgZSwgUk9VTkRJTkdfTU9ERSkubWludXMoeCkuYWJzKCkuY29tcGFyZWRUbyhcclxuICAgICAgICAgIGRpdihuMCwgZDAsIGUsIFJPVU5ESU5HX01PREUpLm1pbnVzKHgpLmFicygpKSA8IDEgPyBbbjEsIGQxXSA6IFtuMCwgZDBdO1xyXG5cclxuICAgICAgTUFYX0VYUCA9IGV4cDtcclxuXHJcbiAgICAgIHJldHVybiByO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgY29udmVydGVkIHRvIGEgbnVtYmVyIHByaW1pdGl2ZS5cclxuICAgICAqL1xyXG4gICAgUC50b051bWJlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICt2YWx1ZU9mKHRoaXMpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzXHJcbiAgICAgKiB1c2luZyByb3VuZGluZyBtb2RlIHJtIG9yIFJPVU5ESU5HX01PREUuIElmIHNkIGlzIGxlc3MgdGhhbiB0aGUgbnVtYmVyIG9mIGRpZ2l0c1xyXG4gICAgICogbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlciBwYXJ0IG9mIHRoZSB2YWx1ZSBpbiBmaXhlZC1wb2ludCBub3RhdGlvbiwgdGhlbiB1c2VcclxuICAgICAqIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICpcclxuICAgICAqIFtzZF0ge251bWJlcn0gU2lnbmlmaWNhbnQgZGlnaXRzLiBJbnRlZ2VyLCAxIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtzZHxybX0nXHJcbiAgICAgKi9cclxuICAgIFAudG9QcmVjaXNpb24gPSBmdW5jdGlvbiAoc2QsIHJtKSB7XHJcbiAgICAgIGlmIChzZCAhPSBudWxsKSBpbnRDaGVjayhzZCwgMSwgTUFYKTtcclxuICAgICAgcmV0dXJuIGZvcm1hdCh0aGlzLCBzZCwgcm0sIDIpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGJhc2UgYiwgb3IgYmFzZSAxMCBpZiBiIGlzXHJcbiAgICAgKiBvbWl0dGVkLiBJZiBhIGJhc2UgaXMgc3BlY2lmaWVkLCBpbmNsdWRpbmcgYmFzZSAxMCwgcm91bmQgYWNjb3JkaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFuZFxyXG4gICAgICogUk9VTkRJTkdfTU9ERS4gSWYgYSBiYXNlIGlzIG5vdCBzcGVjaWZpZWQsIGFuZCB0aGlzIEJpZ051bWJlciBoYXMgYSBwb3NpdGl2ZSBleHBvbmVudFxyXG4gICAgICogdGhhdCBpcyBlcXVhbCB0byBvciBncmVhdGVyIHRoYW4gVE9fRVhQX1BPUywgb3IgYSBuZWdhdGl2ZSBleHBvbmVudCBlcXVhbCB0byBvciBsZXNzIHRoYW5cclxuICAgICAqIFRPX0VYUF9ORUcsIHJldHVybiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBbYl0ge251bWJlcn0gSW50ZWdlciwgMiB0byBBTFBIQUJFVC5sZW5ndGggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBCYXNlIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtifSdcclxuICAgICAqL1xyXG4gICAgUC50b1N0cmluZyA9IGZ1bmN0aW9uIChiKSB7XHJcbiAgICAgIHZhciBzdHIsXHJcbiAgICAgICAgbiA9IHRoaXMsXHJcbiAgICAgICAgcyA9IG4ucyxcclxuICAgICAgICBlID0gbi5lO1xyXG5cclxuICAgICAgLy8gSW5maW5pdHkgb3IgTmFOP1xyXG4gICAgICBpZiAoZSA9PT0gbnVsbCkge1xyXG4gICAgICAgIGlmIChzKSB7XHJcbiAgICAgICAgICBzdHIgPSAnSW5maW5pdHknO1xyXG4gICAgICAgICAgaWYgKHMgPCAwKSBzdHIgPSAnLScgKyBzdHI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHN0ciA9ICdOYU4nO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoYiA9PSBudWxsKSB7XHJcbiAgICAgICAgICBzdHIgPSBlIDw9IFRPX0VYUF9ORUcgfHwgZSA+PSBUT19FWFBfUE9TXHJcbiAgICAgICAgICAgPyB0b0V4cG9uZW50aWFsKGNvZWZmVG9TdHJpbmcobi5jKSwgZSlcclxuICAgICAgICAgICA6IHRvRml4ZWRQb2ludChjb2VmZlRvU3RyaW5nKG4uYyksIGUsICcwJyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChiID09PSAxMCkge1xyXG4gICAgICAgICAgbiA9IHJvdW5kKG5ldyBCaWdOdW1iZXIobiksIERFQ0lNQUxfUExBQ0VTICsgZSArIDEsIFJPVU5ESU5HX01PREUpO1xyXG4gICAgICAgICAgc3RyID0gdG9GaXhlZFBvaW50KGNvZWZmVG9TdHJpbmcobi5jKSwgbi5lLCAnMCcpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpbnRDaGVjayhiLCAyLCBBTFBIQUJFVC5sZW5ndGgsICdCYXNlJyk7XHJcbiAgICAgICAgICBzdHIgPSBjb252ZXJ0QmFzZSh0b0ZpeGVkUG9pbnQoY29lZmZUb1N0cmluZyhuLmMpLCBlLCAnMCcpLCAxMCwgYiwgcywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocyA8IDAgJiYgbi5jWzBdKSBzdHIgPSAnLScgKyBzdHI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGFzIHRvU3RyaW5nLCBidXQgZG8gbm90IGFjY2VwdCBhIGJhc2UgYXJndW1lbnQsIGFuZCBpbmNsdWRlIHRoZSBtaW51cyBzaWduIGZvclxyXG4gICAgICogbmVnYXRpdmUgemVyby5cclxuICAgICAqL1xyXG4gICAgUC52YWx1ZU9mID0gUC50b0pTT04gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiB2YWx1ZU9mKHRoaXMpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgUC5faXNCaWdOdW1iZXIgPSB0cnVlO1xyXG5cclxuICAgIGlmIChjb25maWdPYmplY3QgIT0gbnVsbCkgQmlnTnVtYmVyLnNldChjb25maWdPYmplY3QpO1xyXG5cclxuICAgIHJldHVybiBCaWdOdW1iZXI7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gUFJJVkFURSBIRUxQRVIgRlVOQ1RJT05TXHJcblxyXG4gIC8vIFRoZXNlIGZ1bmN0aW9ucyBkb24ndCBuZWVkIGFjY2VzcyB0byB2YXJpYWJsZXMsXHJcbiAgLy8gZS5nLiBERUNJTUFMX1BMQUNFUywgaW4gdGhlIHNjb3BlIG9mIHRoZSBgY2xvbmVgIGZ1bmN0aW9uIGFib3ZlLlxyXG5cclxuXHJcbiAgZnVuY3Rpb24gYml0Rmxvb3Iobikge1xyXG4gICAgdmFyIGkgPSBuIHwgMDtcclxuICAgIHJldHVybiBuID4gMCB8fCBuID09PSBpID8gaSA6IGkgLSAxO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIFJldHVybiBhIGNvZWZmaWNpZW50IGFycmF5IGFzIGEgc3RyaW5nIG9mIGJhc2UgMTAgZGlnaXRzLlxyXG4gIGZ1bmN0aW9uIGNvZWZmVG9TdHJpbmcoYSkge1xyXG4gICAgdmFyIHMsIHosXHJcbiAgICAgIGkgPSAxLFxyXG4gICAgICBqID0gYS5sZW5ndGgsXHJcbiAgICAgIHIgPSBhWzBdICsgJyc7XHJcblxyXG4gICAgZm9yICg7IGkgPCBqOykge1xyXG4gICAgICBzID0gYVtpKytdICsgJyc7XHJcbiAgICAgIHogPSBMT0dfQkFTRSAtIHMubGVuZ3RoO1xyXG4gICAgICBmb3IgKDsgei0tOyBzID0gJzAnICsgcyk7XHJcbiAgICAgIHIgKz0gcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICBmb3IgKGogPSByLmxlbmd0aDsgci5jaGFyQ29kZUF0KC0taikgPT09IDQ4Oyk7XHJcblxyXG4gICAgcmV0dXJuIHIuc2xpY2UoMCwgaiArIDEgfHwgMSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgb2YgQmlnTnVtYmVycyB4IGFuZCB5LlxyXG4gIGZ1bmN0aW9uIGNvbXBhcmUoeCwgeSkge1xyXG4gICAgdmFyIGEsIGIsXHJcbiAgICAgIHhjID0geC5jLFxyXG4gICAgICB5YyA9IHkuYyxcclxuICAgICAgaSA9IHgucyxcclxuICAgICAgaiA9IHkucyxcclxuICAgICAgayA9IHguZSxcclxuICAgICAgbCA9IHkuZTtcclxuXHJcbiAgICAvLyBFaXRoZXIgTmFOP1xyXG4gICAgaWYgKCFpIHx8ICFqKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBhID0geGMgJiYgIXhjWzBdO1xyXG4gICAgYiA9IHljICYmICF5Y1swXTtcclxuXHJcbiAgICAvLyBFaXRoZXIgemVybz9cclxuICAgIGlmIChhIHx8IGIpIHJldHVybiBhID8gYiA/IDAgOiAtaiA6IGk7XHJcblxyXG4gICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgaWYgKGkgIT0gaikgcmV0dXJuIGk7XHJcblxyXG4gICAgYSA9IGkgPCAwO1xyXG4gICAgYiA9IGsgPT0gbDtcclxuXHJcbiAgICAvLyBFaXRoZXIgSW5maW5pdHk/XHJcbiAgICBpZiAoIXhjIHx8ICF5YykgcmV0dXJuIGIgPyAwIDogIXhjIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICAvLyBDb21wYXJlIGV4cG9uZW50cy5cclxuICAgIGlmICghYikgcmV0dXJuIGsgPiBsIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICBqID0gKGsgPSB4Yy5sZW5ndGgpIDwgKGwgPSB5Yy5sZW5ndGgpID8gayA6IGw7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBkaWdpdCBieSBkaWdpdC5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBqOyBpKyspIGlmICh4Y1tpXSAhPSB5Y1tpXSkgcmV0dXJuIHhjW2ldID4geWNbaV0gXiBhID8gMSA6IC0xO1xyXG5cclxuICAgIC8vIENvbXBhcmUgbGVuZ3Rocy5cclxuICAgIHJldHVybiBrID09IGwgPyAwIDogayA+IGwgXiBhID8gMSA6IC0xO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qXHJcbiAgICogQ2hlY2sgdGhhdCBuIGlzIGEgcHJpbWl0aXZlIG51bWJlciwgYW4gaW50ZWdlciwgYW5kIGluIHJhbmdlLCBvdGhlcndpc2UgdGhyb3cuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW50Q2hlY2sobiwgbWluLCBtYXgsIG5hbWUpIHtcclxuICAgIGlmIChuIDwgbWluIHx8IG4gPiBtYXggfHwgbiAhPT0gbWF0aGZsb29yKG4pKSB7XHJcbiAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAobmFtZSB8fCAnQXJndW1lbnQnKSArICh0eXBlb2YgbiA9PSAnbnVtYmVyJ1xyXG4gICAgICAgICA/IG4gPCBtaW4gfHwgbiA+IG1heCA/ICcgb3V0IG9mIHJhbmdlOiAnIDogJyBub3QgYW4gaW50ZWdlcjogJ1xyXG4gICAgICAgICA6ICcgbm90IGEgcHJpbWl0aXZlIG51bWJlcjogJykgKyBTdHJpbmcobikpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8vIEFzc3VtZXMgZmluaXRlIG4uXHJcbiAgZnVuY3Rpb24gaXNPZGQobikge1xyXG4gICAgdmFyIGsgPSBuLmMubGVuZ3RoIC0gMTtcclxuICAgIHJldHVybiBiaXRGbG9vcihuLmUgLyBMT0dfQkFTRSkgPT0gayAmJiBuLmNba10gJSAyICE9IDA7XHJcbiAgfVxyXG5cclxuXHJcbiAgZnVuY3Rpb24gdG9FeHBvbmVudGlhbChzdHIsIGUpIHtcclxuICAgIHJldHVybiAoc3RyLmxlbmd0aCA+IDEgPyBzdHIuY2hhckF0KDApICsgJy4nICsgc3RyLnNsaWNlKDEpIDogc3RyKSArXHJcbiAgICAgKGUgPCAwID8gJ2UnIDogJ2UrJykgKyBlO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIHRvRml4ZWRQb2ludChzdHIsIGUsIHopIHtcclxuICAgIHZhciBsZW4sIHpzO1xyXG5cclxuICAgIC8vIE5lZ2F0aXZlIGV4cG9uZW50P1xyXG4gICAgaWYgKGUgPCAwKSB7XHJcblxyXG4gICAgICAvLyBQcmVwZW5kIHplcm9zLlxyXG4gICAgICBmb3IgKHpzID0geiArICcuJzsgKytlOyB6cyArPSB6KTtcclxuICAgICAgc3RyID0genMgKyBzdHI7XHJcblxyXG4gICAgLy8gUG9zaXRpdmUgZXhwb25lbnRcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBBcHBlbmQgemVyb3MuXHJcbiAgICAgIGlmICgrK2UgPiBsZW4pIHtcclxuICAgICAgICBmb3IgKHpzID0geiwgZSAtPSBsZW47IC0tZTsgenMgKz0geik7XHJcbiAgICAgICAgc3RyICs9IHpzO1xyXG4gICAgICB9IGVsc2UgaWYgKGUgPCBsZW4pIHtcclxuICAgICAgICBzdHIgPSBzdHIuc2xpY2UoMCwgZSkgKyAnLicgKyBzdHIuc2xpY2UoZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3RyO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIEVYUE9SVFxyXG5cclxuXHJcbiAgQmlnTnVtYmVyID0gY2xvbmUoKTtcclxuICBCaWdOdW1iZXJbJ2RlZmF1bHQnXSA9IEJpZ051bWJlci5CaWdOdW1iZXIgPSBCaWdOdW1iZXI7XHJcblxyXG4gIC8vIEFNRC5cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZShmdW5jdGlvbiAoKSB7IHJldHVybiBCaWdOdW1iZXI7IH0pO1xyXG5cclxuICAvLyBOb2RlLmpzIGFuZCBvdGhlciBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLlxyXG4gIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBCaWdOdW1iZXI7XHJcblxyXG4gIC8vIEJyb3dzZXIuXHJcbiAgfSBlbHNlIHtcclxuICAgIGlmICghZ2xvYmFsT2JqZWN0KSB7XHJcbiAgICAgIGdsb2JhbE9iamVjdCA9IHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnICYmIHNlbGYgPyBzZWxmIDogd2luZG93O1xyXG4gICAgfVxyXG5cclxuICAgIGdsb2JhbE9iamVjdC5CaWdOdW1iZXIgPSBCaWdOdW1iZXI7XHJcbiAgfVxyXG59KSh0aGlzKTtcclxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IEJpZ251bWJlciA9IHJlcXVpcmUoJ2JpZ251bWJlci5qcycpLkJpZ051bWJlclxuXG5leHBvcnRzLk1UID0ge1xuICBQT1NfSU5UOiAwLFxuICBORUdfSU5UOiAxLFxuICBCWVRFX1NUUklORzogMixcbiAgVVRGOF9TVFJJTkc6IDMsXG4gIEFSUkFZOiA0LFxuICBNQVA6IDUsXG4gIFRBRzogNixcbiAgU0lNUExFX0ZMT0FUOiA3XG59XG5cbmV4cG9ydHMuVEFHID0ge1xuICBEQVRFX1NUUklORzogMCxcbiAgREFURV9FUE9DSDogMSxcbiAgUE9TX0JJR0lOVDogMixcbiAgTkVHX0JJR0lOVDogMyxcbiAgREVDSU1BTF9GUkFDOiA0LFxuICBCSUdGTE9BVDogNSxcbiAgQkFTRTY0VVJMX0VYUEVDVEVEOiAyMSxcbiAgQkFTRTY0X0VYUEVDVEVEOiAyMixcbiAgQkFTRTE2X0VYUEVDVEVEOiAyMyxcbiAgQ0JPUjogMjQsXG4gIFVSSTogMzIsXG4gIEJBU0U2NFVSTDogMzMsXG4gIEJBU0U2NDogMzQsXG4gIFJFR0VYUDogMzUsXG4gIE1JTUU6IDM2XG59XG5cbmV4cG9ydHMuTlVNQllURVMgPSB7XG4gIFpFUk86IDAsXG4gIE9ORTogMjQsXG4gIFRXTzogMjUsXG4gIEZPVVI6IDI2LFxuICBFSUdIVDogMjcsXG4gIElOREVGSU5JVEU6IDMxXG59XG5cbmV4cG9ydHMuU0lNUExFID0ge1xuICBGQUxTRTogMjAsXG4gIFRSVUU6IDIxLFxuICBOVUxMOiAyMixcbiAgVU5ERUZJTkVEOiAyM1xufVxuXG5leHBvcnRzLlNZTVMgPSB7XG4gIE5VTEw6IFN5bWJvbCgnbnVsbCcpLFxuICBVTkRFRklORUQ6IFN5bWJvbCgndW5kZWYnKSxcbiAgUEFSRU5UOiBTeW1ib2woJ3BhcmVudCcpLFxuICBCUkVBSzogU3ltYm9sKCdicmVhaycpLFxuICBTVFJFQU06IFN5bWJvbCgnc3RyZWFtJylcbn1cblxuZXhwb3J0cy5TSElGVDMyID0gTWF0aC5wb3coMiwgMzIpXG5leHBvcnRzLlNISUZUMTYgPSBNYXRoLnBvdygyLCAxNilcblxuZXhwb3J0cy5NQVhfU0FGRV9ISUdIID0gMHgxZmZmZmZcbmV4cG9ydHMuTkVHX09ORSA9IG5ldyBCaWdudW1iZXIoLTEpXG5leHBvcnRzLlRFTiA9IG5ldyBCaWdudW1iZXIoMTApXG5leHBvcnRzLlRXTyA9IG5ldyBCaWdudW1iZXIoMilcblxuZXhwb3J0cy5QQVJFTlQgPSB7XG4gIEFSUkFZOiAwLFxuICBPQkpFQ1Q6IDEsXG4gIE1BUDogMixcbiAgVEFHOiAzLFxuICBCWVRFX1NUUklORzogNCxcbiAgVVRGOF9TVFJJTkc6IDVcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVjb2RlQXNtIChzdGRsaWIsIGZvcmVpZ24sIGJ1ZmZlcikge1xuICAndXNlIGFzbSdcblxuICAvLyAtLSBJbXBvcnRzXG5cbiAgdmFyIGhlYXAgPSBuZXcgc3RkbGliLlVpbnQ4QXJyYXkoYnVmZmVyKVxuICAvLyB2YXIgbG9nID0gZm9yZWlnbi5sb2dcbiAgdmFyIHB1c2hJbnQgPSBmb3JlaWduLnB1c2hJbnRcbiAgdmFyIHB1c2hJbnQzMiA9IGZvcmVpZ24ucHVzaEludDMyXG4gIHZhciBwdXNoSW50MzJOZWcgPSBmb3JlaWduLnB1c2hJbnQzMk5lZ1xuICB2YXIgcHVzaEludDY0ID0gZm9yZWlnbi5wdXNoSW50NjRcbiAgdmFyIHB1c2hJbnQ2NE5lZyA9IGZvcmVpZ24ucHVzaEludDY0TmVnXG4gIHZhciBwdXNoRmxvYXQgPSBmb3JlaWduLnB1c2hGbG9hdFxuICB2YXIgcHVzaEZsb2F0U2luZ2xlID0gZm9yZWlnbi5wdXNoRmxvYXRTaW5nbGVcbiAgdmFyIHB1c2hGbG9hdERvdWJsZSA9IGZvcmVpZ24ucHVzaEZsb2F0RG91YmxlXG4gIHZhciBwdXNoVHJ1ZSA9IGZvcmVpZ24ucHVzaFRydWVcbiAgdmFyIHB1c2hGYWxzZSA9IGZvcmVpZ24ucHVzaEZhbHNlXG4gIHZhciBwdXNoVW5kZWZpbmVkID0gZm9yZWlnbi5wdXNoVW5kZWZpbmVkXG4gIHZhciBwdXNoTnVsbCA9IGZvcmVpZ24ucHVzaE51bGxcbiAgdmFyIHB1c2hJbmZpbml0eSA9IGZvcmVpZ24ucHVzaEluZmluaXR5XG4gIHZhciBwdXNoSW5maW5pdHlOZWcgPSBmb3JlaWduLnB1c2hJbmZpbml0eU5lZ1xuICB2YXIgcHVzaE5hTiA9IGZvcmVpZ24ucHVzaE5hTlxuICB2YXIgcHVzaE5hTk5lZyA9IGZvcmVpZ24ucHVzaE5hTk5lZ1xuXG4gIHZhciBwdXNoQXJyYXlTdGFydCA9IGZvcmVpZ24ucHVzaEFycmF5U3RhcnRcbiAgdmFyIHB1c2hBcnJheVN0YXJ0Rml4ZWQgPSBmb3JlaWduLnB1c2hBcnJheVN0YXJ0Rml4ZWRcbiAgdmFyIHB1c2hBcnJheVN0YXJ0Rml4ZWQzMiA9IGZvcmVpZ24ucHVzaEFycmF5U3RhcnRGaXhlZDMyXG4gIHZhciBwdXNoQXJyYXlTdGFydEZpeGVkNjQgPSBmb3JlaWduLnB1c2hBcnJheVN0YXJ0Rml4ZWQ2NFxuICB2YXIgcHVzaE9iamVjdFN0YXJ0ID0gZm9yZWlnbi5wdXNoT2JqZWN0U3RhcnRcbiAgdmFyIHB1c2hPYmplY3RTdGFydEZpeGVkID0gZm9yZWlnbi5wdXNoT2JqZWN0U3RhcnRGaXhlZFxuICB2YXIgcHVzaE9iamVjdFN0YXJ0Rml4ZWQzMiA9IGZvcmVpZ24ucHVzaE9iamVjdFN0YXJ0Rml4ZWQzMlxuICB2YXIgcHVzaE9iamVjdFN0YXJ0Rml4ZWQ2NCA9IGZvcmVpZ24ucHVzaE9iamVjdFN0YXJ0Rml4ZWQ2NFxuXG4gIHZhciBwdXNoQnl0ZVN0cmluZyA9IGZvcmVpZ24ucHVzaEJ5dGVTdHJpbmdcbiAgdmFyIHB1c2hCeXRlU3RyaW5nU3RhcnQgPSBmb3JlaWduLnB1c2hCeXRlU3RyaW5nU3RhcnRcbiAgdmFyIHB1c2hVdGY4U3RyaW5nID0gZm9yZWlnbi5wdXNoVXRmOFN0cmluZ1xuICB2YXIgcHVzaFV0ZjhTdHJpbmdTdGFydCA9IGZvcmVpZ24ucHVzaFV0ZjhTdHJpbmdTdGFydFxuXG4gIHZhciBwdXNoU2ltcGxlVW5hc3NpZ25lZCA9IGZvcmVpZ24ucHVzaFNpbXBsZVVuYXNzaWduZWRcblxuICB2YXIgcHVzaFRhZ1N0YXJ0ID0gZm9yZWlnbi5wdXNoVGFnU3RhcnRcbiAgdmFyIHB1c2hUYWdTdGFydDQgPSBmb3JlaWduLnB1c2hUYWdTdGFydDRcbiAgdmFyIHB1c2hUYWdTdGFydDggPSBmb3JlaWduLnB1c2hUYWdTdGFydDhcbiAgdmFyIHB1c2hUYWdVbmFzc2lnbmVkID0gZm9yZWlnbi5wdXNoVGFnVW5hc3NpZ25lZFxuXG4gIHZhciBwdXNoQnJlYWsgPSBmb3JlaWduLnB1c2hCcmVha1xuXG4gIHZhciBwb3cgPSBzdGRsaWIuTWF0aC5wb3dcblxuICAvLyAtLSBDb25zdGFudHNcblxuXG4gIC8vIC0tIE11dGFibGUgVmFyaWFibGVzXG5cbiAgdmFyIG9mZnNldCA9IDBcbiAgdmFyIGlucHV0TGVuZ3RoID0gMFxuICB2YXIgY29kZSA9IDBcblxuICAvLyBEZWNvZGUgYSBjYm9yIHN0cmluZyByZXByZXNlbnRlZCBhcyBVaW50OEFycmF5XG4gIC8vIHdoaWNoIGlzIGFsbG9jYXRlZCBvbiB0aGUgaGVhcCBmcm9tIDAgdG8gaW5wdXRMZW5ndGhcbiAgLy9cbiAgLy8gaW5wdXQgLSBJbnRcbiAgLy9cbiAgLy8gUmV0dXJucyBDb2RlIC0gSW50LFxuICAvLyBTdWNjZXNzID0gMFxuICAvLyBFcnJvciA+IDBcbiAgZnVuY3Rpb24gcGFyc2UgKGlucHV0KSB7XG4gICAgaW5wdXQgPSBpbnB1dCB8IDBcblxuICAgIG9mZnNldCA9IDBcbiAgICBpbnB1dExlbmd0aCA9IGlucHV0XG5cbiAgICB3aGlsZSAoKG9mZnNldCB8IDApIDwgKGlucHV0TGVuZ3RoIHwgMCkpIHtcbiAgICAgIGNvZGUgPSBqdW1wVGFibGVbaGVhcFtvZmZzZXRdICYgMjU1XShoZWFwW29mZnNldF0gfCAwKSB8IDBcblxuICAgICAgaWYgKChjb2RlIHwgMCkgPiAwKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvZGUgfCAwXG4gIH1cblxuICAvLyAtLSBIZWxwZXIgRnVuY3Rpb25cblxuICBmdW5jdGlvbiBjaGVja09mZnNldCAobikge1xuICAgIG4gPSBuIHwgMFxuXG4gICAgaWYgKCgoKG9mZnNldCB8IDApICsgKG4gfCAwKSkgfCAwKSA8IChpbnB1dExlbmd0aCB8IDApKSB7XG4gICAgICByZXR1cm4gMFxuICAgIH1cblxuICAgIHJldHVybiAxXG4gIH1cblxuICBmdW5jdGlvbiByZWFkVUludDE2IChuKSB7XG4gICAgbiA9IG4gfCAwXG5cbiAgICByZXR1cm4gKFxuICAgICAgKGhlYXBbbiB8IDBdIDw8IDgpIHwgaGVhcFsobiArIDEpIHwgMF1cbiAgICApIHwgMFxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFVJbnQzMiAobikge1xuICAgIG4gPSBuIHwgMFxuXG4gICAgcmV0dXJuIChcbiAgICAgIChoZWFwW24gfCAwXSA8PCAyNCkgfCAoaGVhcFsobiArIDEpIHwgMF0gPDwgMTYpIHwgKGhlYXBbKG4gKyAyKSB8IDBdIDw8IDgpIHwgaGVhcFsobiArIDMpIHwgMF1cbiAgICApIHwgMFxuICB9XG5cbiAgLy8gLS0gSW5pdGlhbCBCeXRlIEhhbmRsZXJzXG5cbiAgZnVuY3Rpb24gSU5UX1AgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hJbnQob2N0ZXQgfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFVJTlRfUF84IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMSkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hJbnQoaGVhcFsob2Zmc2V0ICsgMSkgfCAwXSB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMikgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVUlOVF9QXzE2IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMikgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hJbnQoXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAxKSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAzKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBVSU5UX1BfMzIgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg0KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEludDMyKFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAzKSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyA1KSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBVSU5UX1BfNjQgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg4KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEludDY0KFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAzKSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDUpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgNykgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgOSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gSU5UX04gKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hJbnQoKC0xIC0gKChvY3RldCAtIDMyKSB8IDApKSB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVUlOVF9OXzggKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgxKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEludChcbiAgICAgICgtMSAtIChoZWFwWyhvZmZzZXQgKyAxKSB8IDBdIHwgMCkpIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAyKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBVSU5UX05fMTYgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHZhciB2YWwgPSAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMikgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHZhbCA9IHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwXG4gICAgcHVzaEludCgoLTEgLSAodmFsIHwgMCkpIHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAzKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBVSU5UX05fMzIgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg0KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEludDMyTmVnKFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAzKSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyA1KSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBVSU5UX05fNjQgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg4KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEludDY0TmVnKFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAzKSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDUpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgNykgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgOSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gQllURV9TVFJJTkcgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHZhciBzdGFydCA9IDBcbiAgICB2YXIgZW5kID0gMFxuICAgIHZhciBzdGVwID0gMFxuXG4gICAgc3RlcCA9IChvY3RldCAtIDY0KSB8IDBcbiAgICBpZiAoY2hlY2tPZmZzZXQoc3RlcCB8IDApIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBzdGFydCA9IChvZmZzZXQgKyAxKSB8IDBcbiAgICBlbmQgPSAoKChvZmZzZXQgKyAxKSB8IDApICsgKHN0ZXAgfCAwKSkgfCAwXG5cbiAgICBwdXNoQnl0ZVN0cmluZyhzdGFydCB8IDAsIGVuZCB8IDApXG5cbiAgICBvZmZzZXQgPSBlbmQgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gQllURV9TVFJJTkdfOCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgdmFyIHN0YXJ0ID0gMFxuICAgIHZhciBlbmQgPSAwXG4gICAgdmFyIGxlbmd0aCA9IDBcblxuICAgIGlmIChjaGVja09mZnNldCgxKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgbGVuZ3RoID0gaGVhcFsob2Zmc2V0ICsgMSkgfCAwXSB8IDBcbiAgICBzdGFydCA9IChvZmZzZXQgKyAyKSB8IDBcbiAgICBlbmQgPSAoKChvZmZzZXQgKyAyKSB8IDApICsgKGxlbmd0aCB8IDApKSB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgobGVuZ3RoICsgMSkgfCAwKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEJ5dGVTdHJpbmcoc3RhcnQgfCAwLCBlbmQgfCAwKVxuXG4gICAgb2Zmc2V0ID0gZW5kIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIEJZVEVfU1RSSU5HXzE2IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICB2YXIgc3RhcnQgPSAwXG4gICAgdmFyIGVuZCA9IDBcbiAgICB2YXIgbGVuZ3RoID0gMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDIpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBsZW5ndGggPSByZWFkVUludDE2KChvZmZzZXQgKyAxKSB8IDApIHwgMFxuICAgIHN0YXJ0ID0gKG9mZnNldCArIDMpIHwgMFxuICAgIGVuZCA9ICgoKG9mZnNldCArIDMpIHwgMCkgKyAobGVuZ3RoIHwgMCkpIHwgMFxuXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoKGxlbmd0aCArIDIpIHwgMCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hCeXRlU3RyaW5nKHN0YXJ0IHwgMCwgZW5kIHwgMClcblxuICAgIG9mZnNldCA9IGVuZCB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBCWVRFX1NUUklOR18zMiAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgdmFyIHN0YXJ0ID0gMFxuICAgIHZhciBlbmQgPSAwXG4gICAgdmFyIGxlbmd0aCA9IDBcblxuICAgIGlmIChjaGVja09mZnNldCg0KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgbGVuZ3RoID0gcmVhZFVJbnQzMigob2Zmc2V0ICsgMSkgfCAwKSB8IDBcbiAgICBzdGFydCA9IChvZmZzZXQgKyA1KSB8IDBcbiAgICBlbmQgPSAoKChvZmZzZXQgKyA1KSB8IDApICsgKGxlbmd0aCB8IDApKSB8IDBcblxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KChsZW5ndGggKyA0KSB8IDApIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoQnl0ZVN0cmluZyhzdGFydCB8IDAsIGVuZCB8IDApXG5cbiAgICBvZmZzZXQgPSBlbmQgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gQllURV9TVFJJTkdfNjQgKG9jdGV0KSB7XG4gICAgLy8gTk9UIElNUExFTUVOVEVEXG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHJldHVybiAxXG4gIH1cblxuICBmdW5jdGlvbiBCWVRFX1NUUklOR19CUkVBSyAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaEJ5dGVTdHJpbmdTdGFydCgpXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVVRGOF9TVFJJTkcgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHZhciBzdGFydCA9IDBcbiAgICB2YXIgZW5kID0gMFxuICAgIHZhciBzdGVwID0gMFxuXG4gICAgc3RlcCA9IChvY3RldCAtIDk2KSB8IDBcblxuICAgIGlmIChjaGVja09mZnNldChzdGVwIHwgMCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHN0YXJ0ID0gKG9mZnNldCArIDEpIHwgMFxuICAgIGVuZCA9ICgoKG9mZnNldCArIDEpIHwgMCkgKyAoc3RlcCB8IDApKSB8IDBcblxuICAgIHB1c2hVdGY4U3RyaW5nKHN0YXJ0IHwgMCwgZW5kIHwgMClcblxuICAgIG9mZnNldCA9IGVuZCB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBVVEY4X1NUUklOR184IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICB2YXIgc3RhcnQgPSAwXG4gICAgdmFyIGVuZCA9IDBcbiAgICB2YXIgbGVuZ3RoID0gMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDEpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBsZW5ndGggPSBoZWFwWyhvZmZzZXQgKyAxKSB8IDBdIHwgMFxuICAgIHN0YXJ0ID0gKG9mZnNldCArIDIpIHwgMFxuICAgIGVuZCA9ICgoKG9mZnNldCArIDIpIHwgMCkgKyAobGVuZ3RoIHwgMCkpIHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KChsZW5ndGggKyAxKSB8IDApIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoVXRmOFN0cmluZyhzdGFydCB8IDAsIGVuZCB8IDApXG5cbiAgICBvZmZzZXQgPSBlbmQgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVVRGOF9TVFJJTkdfMTYgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHZhciBzdGFydCA9IDBcbiAgICB2YXIgZW5kID0gMFxuICAgIHZhciBsZW5ndGggPSAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMikgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIGxlbmd0aCA9IHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwXG4gICAgc3RhcnQgPSAob2Zmc2V0ICsgMykgfCAwXG4gICAgZW5kID0gKCgob2Zmc2V0ICsgMykgfCAwKSArIChsZW5ndGggfCAwKSkgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoKGxlbmd0aCArIDIpIHwgMCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hVdGY4U3RyaW5nKHN0YXJ0IHwgMCwgZW5kIHwgMClcblxuICAgIG9mZnNldCA9IGVuZCB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBVVEY4X1NUUklOR18zMiAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgdmFyIHN0YXJ0ID0gMFxuICAgIHZhciBlbmQgPSAwXG4gICAgdmFyIGxlbmd0aCA9IDBcblxuICAgIGlmIChjaGVja09mZnNldCg0KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgbGVuZ3RoID0gcmVhZFVJbnQzMigob2Zmc2V0ICsgMSkgfCAwKSB8IDBcbiAgICBzdGFydCA9IChvZmZzZXQgKyA1KSB8IDBcbiAgICBlbmQgPSAoKChvZmZzZXQgKyA1KSB8IDApICsgKGxlbmd0aCB8IDApKSB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgobGVuZ3RoICsgNCkgfCAwKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaFV0ZjhTdHJpbmcoc3RhcnQgfCAwLCBlbmQgfCAwKVxuXG4gICAgb2Zmc2V0ID0gZW5kIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFVURjhfU1RSSU5HXzY0IChvY3RldCkge1xuICAgIC8vIE5PVCBJTVBMRU1FTlRFRFxuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICByZXR1cm4gMVxuICB9XG5cbiAgZnVuY3Rpb24gVVRGOF9TVFJJTkdfQlJFQUsgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hVdGY4U3RyaW5nU3RhcnQoKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIEFSUkFZIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoQXJyYXlTdGFydEZpeGVkKChvY3RldCAtIDEyOCkgfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIEFSUkFZXzggKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgxKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEFycmF5U3RhcnRGaXhlZChoZWFwWyhvZmZzZXQgKyAxKSB8IDBdIHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAyKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBBUlJBWV8xNiAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDIpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoQXJyYXlTdGFydEZpeGVkKFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMykgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gQVJSQVlfMzIgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg0KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEFycmF5U3RhcnRGaXhlZDMyKFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAzKSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyA1KSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBBUlJBWV82NCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDgpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoQXJyYXlTdGFydEZpeGVkNjQoXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAxKSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDMpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgNSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyA3KSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyA5KSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBBUlJBWV9CUkVBSyAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaEFycmF5U3RhcnQoKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIE1BUCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgdmFyIHN0ZXAgPSAwXG5cbiAgICBzdGVwID0gKG9jdGV0IC0gMTYwKSB8IDBcblxuICAgIGlmIChjaGVja09mZnNldChzdGVwIHwgMCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hPYmplY3RTdGFydEZpeGVkKHN0ZXAgfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIE1BUF84IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMSkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hPYmplY3RTdGFydEZpeGVkKGhlYXBbKG9mZnNldCArIDEpIHwgMF0gfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDIpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIE1BUF8xNiAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDIpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoT2JqZWN0U3RhcnRGaXhlZChcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwXG4gICAgKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDMpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIE1BUF8zMiAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDQpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoT2JqZWN0U3RhcnRGaXhlZDMyKFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAzKSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyA1KSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBNQVBfNjQgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg4KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaE9iamVjdFN0YXJ0Rml4ZWQ2NChcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMykgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyA1KSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDcpIHwgMCkgfCAwXG4gICAgKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDkpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIE1BUF9CUkVBSyAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaE9iamVjdFN0YXJ0KClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfS05PV04gKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hUYWdTdGFydCgob2N0ZXQgLSAxOTJ8IDApIHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxIHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfQklHTlVNX1BPUyAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFRhZ1N0YXJ0KG9jdGV0IHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxIHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfQklHTlVNX05FRyAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFRhZ1N0YXJ0KG9jdGV0IHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxIHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfRlJBQyAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFRhZ1N0YXJ0KG9jdGV0IHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxIHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfQklHTlVNX0ZMT0FUIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoVGFnU3RhcnQob2N0ZXQgfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEgfCAwKVxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFRBR19VTkFTU0lHTkVEIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoVGFnU3RhcnQoKG9jdGV0IC0gMTkyfCAwKSB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX0JBU0U2NF9VUkwgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hUYWdTdGFydChvY3RldCB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX0JBU0U2NCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFRhZ1N0YXJ0KG9jdGV0IHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxIHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfQkFTRTE2IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoVGFnU3RhcnQob2N0ZXQgfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEgfCAwKVxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFRBR19NT1JFXzEgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgxKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaFRhZ1N0YXJ0KGhlYXBbKG9mZnNldCArIDEpIHwgMF0gfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDIgfCAwKVxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFRBR19NT1JFXzIgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgyKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaFRhZ1N0YXJ0KFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMyB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX01PUkVfNCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDQpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoVGFnU3RhcnQ0KFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAzKSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyA1IHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfTU9SRV84IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoOCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hUYWdTdGFydDgoXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAxKSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDMpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgNSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyA3KSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyA5IHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBTSU1QTEVfVU5BU1NJR05FRCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFNpbXBsZVVuYXNzaWduZWQoKChvY3RldCB8IDApIC0gMjI0KSB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gU0lNUExFX0ZBTFNFIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoRmFsc2UoKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFNJTVBMRV9UUlVFIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoVHJ1ZSgpXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gU0lNUExFX05VTEwgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hOdWxsKClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBTSU1QTEVfVU5ERUZJTkVEIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoVW5kZWZpbmVkKClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBTSU1QTEVfQllURSAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDEpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoU2ltcGxlVW5hc3NpZ25lZChoZWFwWyhvZmZzZXQgKyAxKSB8IDBdIHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAyKSAgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gU0lNUExFX0ZMT0FUX0hBTEYgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHZhciBmID0gMFxuICAgIHZhciBnID0gMFxuICAgIHZhciBzaWduID0gMS4wXG4gICAgdmFyIGV4cCA9IDAuMFxuICAgIHZhciBtYW50ID0gMC4wXG4gICAgdmFyIHIgPSAwLjBcbiAgICBpZiAoY2hlY2tPZmZzZXQoMikgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIGYgPSBoZWFwWyhvZmZzZXQgKyAxKSB8IDBdIHwgMFxuICAgIGcgPSBoZWFwWyhvZmZzZXQgKyAyKSB8IDBdIHwgMFxuXG4gICAgaWYgKChmIHwgMCkgJiAweDgwKSB7XG4gICAgICBzaWduID0gLTEuMFxuICAgIH1cblxuICAgIGV4cCA9ICsoKChmIHwgMCkgJiAweDdDKSA+PiAyKVxuICAgIG1hbnQgPSArKCgoKGYgfCAwKSAmIDB4MDMpIDw8IDgpIHwgZylcblxuICAgIGlmICgrZXhwID09IDAuMCkge1xuICAgICAgcHVzaEZsb2F0KCsoXG4gICAgICAgICgrc2lnbikgKiArNS45NjA0NjQ0Nzc1MzkwNjI1ZS04ICogKCttYW50KVxuICAgICAgKSlcbiAgICB9IGVsc2UgaWYgKCtleHAgPT0gMzEuMCkge1xuICAgICAgaWYgKCtzaWduID09IDEuMCkge1xuICAgICAgICBpZiAoK21hbnQgPiAwLjApIHtcbiAgICAgICAgICBwdXNoTmFOKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwdXNoSW5maW5pdHkoKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoK21hbnQgPiAwLjApIHtcbiAgICAgICAgICBwdXNoTmFOTmVnKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwdXNoSW5maW5pdHlOZWcoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHB1c2hGbG9hdCgrKFxuICAgICAgICArc2lnbiAqIHBvdygrMiwgKygrZXhwIC0gMjUuMCkpICogKygxMDI0LjAgKyBtYW50KVxuICAgICAgKSlcbiAgICB9XG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMykgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gU0lNUExFX0ZMT0FUX1NJTkdMRSAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDQpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoRmxvYXRTaW5nbGUoXG4gICAgICBoZWFwWyhvZmZzZXQgKyAxKSB8IDBdIHwgMCxcbiAgICAgIGhlYXBbKG9mZnNldCArIDIpIHwgMF0gfCAwLFxuICAgICAgaGVhcFsob2Zmc2V0ICsgMykgfCAwXSB8IDAsXG4gICAgICBoZWFwWyhvZmZzZXQgKyA0KSB8IDBdIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyA1KSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBTSU1QTEVfRkxPQVRfRE9VQkxFIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoOCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hGbG9hdERvdWJsZShcbiAgICAgIGhlYXBbKG9mZnNldCArIDEpIHwgMF0gfCAwLFxuICAgICAgaGVhcFsob2Zmc2V0ICsgMikgfCAwXSB8IDAsXG4gICAgICBoZWFwWyhvZmZzZXQgKyAzKSB8IDBdIHwgMCxcbiAgICAgIGhlYXBbKG9mZnNldCArIDQpIHwgMF0gfCAwLFxuICAgICAgaGVhcFsob2Zmc2V0ICsgNSkgfCAwXSB8IDAsXG4gICAgICBoZWFwWyhvZmZzZXQgKyA2KSB8IDBdIHwgMCxcbiAgICAgIGhlYXBbKG9mZnNldCArIDcpIHwgMF0gfCAwLFxuICAgICAgaGVhcFsob2Zmc2V0ICsgOCkgfCAwXSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgOSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gRVJST1IgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHJldHVybiAxXG4gIH1cblxuICBmdW5jdGlvbiBCUkVBSyAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaEJyZWFrKClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICAvLyAtLSBKdW1wIFRhYmxlXG5cbiAgdmFyIGp1bXBUYWJsZSA9IFtcbiAgICAvLyBJbnRlZ2VyIDB4MDAuLjB4MTcgKDAuLjIzKVxuICAgIElOVF9QLCAvLyAweDAwXG4gICAgSU5UX1AsIC8vIDB4MDFcbiAgICBJTlRfUCwgLy8gMHgwMlxuICAgIElOVF9QLCAvLyAweDAzXG4gICAgSU5UX1AsIC8vIDB4MDRcbiAgICBJTlRfUCwgLy8gMHgwNVxuICAgIElOVF9QLCAvLyAweDA2XG4gICAgSU5UX1AsIC8vIDB4MDdcbiAgICBJTlRfUCwgLy8gMHgwOFxuICAgIElOVF9QLCAvLyAweDA5XG4gICAgSU5UX1AsIC8vIDB4MEFcbiAgICBJTlRfUCwgLy8gMHgwQlxuICAgIElOVF9QLCAvLyAweDBDXG4gICAgSU5UX1AsIC8vIDB4MERcbiAgICBJTlRfUCwgLy8gMHgwRVxuICAgIElOVF9QLCAvLyAweDBGXG4gICAgSU5UX1AsIC8vIDB4MTBcbiAgICBJTlRfUCwgLy8gMHgxMVxuICAgIElOVF9QLCAvLyAweDEyXG4gICAgSU5UX1AsIC8vIDB4MTNcbiAgICBJTlRfUCwgLy8gMHgxNFxuICAgIElOVF9QLCAvLyAweDE1XG4gICAgSU5UX1AsIC8vIDB4MTZcbiAgICBJTlRfUCwgLy8gMHgxN1xuICAgIC8vIFVuc2lnbmVkIGludGVnZXIgKG9uZS1ieXRlIHVpbnQ4X3QgZm9sbG93cylcbiAgICBVSU5UX1BfOCwgLy8gMHgxOFxuICAgIC8vIFVuc2lnbmVkIGludGVnZXIgKHR3by1ieXRlIHVpbnQxNl90IGZvbGxvd3MpXG4gICAgVUlOVF9QXzE2LCAvLyAweDE5XG4gICAgLy8gVW5zaWduZWQgaW50ZWdlciAoZm91ci1ieXRlIHVpbnQzMl90IGZvbGxvd3MpXG4gICAgVUlOVF9QXzMyLCAvLyAweDFhXG4gICAgLy8gVW5zaWduZWQgaW50ZWdlciAoZWlnaHQtYnl0ZSB1aW50NjRfdCBmb2xsb3dzKVxuICAgIFVJTlRfUF82NCwgLy8gMHgxYlxuICAgIEVSUk9SLCAvLyAweDFjXG4gICAgRVJST1IsIC8vIDB4MWRcbiAgICBFUlJPUiwgLy8gMHgxZVxuICAgIEVSUk9SLCAvLyAweDFmXG4gICAgLy8gTmVnYXRpdmUgaW50ZWdlciAtMS0weDAwLi4tMS0weDE3ICgtMS4uLTI0KVxuICAgIElOVF9OLCAvLyAweDIwXG4gICAgSU5UX04sIC8vIDB4MjFcbiAgICBJTlRfTiwgLy8gMHgyMlxuICAgIElOVF9OLCAvLyAweDIzXG4gICAgSU5UX04sIC8vIDB4MjRcbiAgICBJTlRfTiwgLy8gMHgyNVxuICAgIElOVF9OLCAvLyAweDI2XG4gICAgSU5UX04sIC8vIDB4MjdcbiAgICBJTlRfTiwgLy8gMHgyOFxuICAgIElOVF9OLCAvLyAweDI5XG4gICAgSU5UX04sIC8vIDB4MkFcbiAgICBJTlRfTiwgLy8gMHgyQlxuICAgIElOVF9OLCAvLyAweDJDXG4gICAgSU5UX04sIC8vIDB4MkRcbiAgICBJTlRfTiwgLy8gMHgyRVxuICAgIElOVF9OLCAvLyAweDJGXG4gICAgSU5UX04sIC8vIDB4MzBcbiAgICBJTlRfTiwgLy8gMHgzMVxuICAgIElOVF9OLCAvLyAweDMyXG4gICAgSU5UX04sIC8vIDB4MzNcbiAgICBJTlRfTiwgLy8gMHgzNFxuICAgIElOVF9OLCAvLyAweDM1XG4gICAgSU5UX04sIC8vIDB4MzZcbiAgICBJTlRfTiwgLy8gMHgzN1xuICAgIC8vIE5lZ2F0aXZlIGludGVnZXIgLTEtbiAob25lLWJ5dGUgdWludDhfdCBmb3IgbiBmb2xsb3dzKVxuICAgIFVJTlRfTl84LCAvLyAweDM4XG4gICAgLy8gTmVnYXRpdmUgaW50ZWdlciAtMS1uICh0d28tYnl0ZSB1aW50MTZfdCBmb3IgbiBmb2xsb3dzKVxuICAgIFVJTlRfTl8xNiwgLy8gMHgzOVxuICAgIC8vIE5lZ2F0aXZlIGludGVnZXIgLTEtbiAoZm91ci1ieXRlIHVpbnQzMl90IGZvciBuZm9sbG93cylcbiAgICBVSU5UX05fMzIsIC8vIDB4M2FcbiAgICAvLyBOZWdhdGl2ZSBpbnRlZ2VyIC0xLW4gKGVpZ2h0LWJ5dGUgdWludDY0X3QgZm9yIG4gZm9sbG93cylcbiAgICBVSU5UX05fNjQsIC8vIDB4M2JcbiAgICBFUlJPUiwgLy8gMHgzY1xuICAgIEVSUk9SLCAvLyAweDNkXG4gICAgRVJST1IsIC8vIDB4M2VcbiAgICBFUlJPUiwgLy8gMHgzZlxuICAgIC8vIGJ5dGUgc3RyaW5nICgweDAwLi4weDE3IGJ5dGVzIGZvbGxvdylcbiAgICBCWVRFX1NUUklORywgLy8gMHg0MFxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDQxXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NDJcbiAgICBCWVRFX1NUUklORywgLy8gMHg0M1xuICAgIEJZVEVfU1RSSU5HLCAvLyAweDQ0XG4gICAgQllURV9TVFJJTkcsIC8vIDB4NDVcbiAgICBCWVRFX1NUUklORywgLy8gMHg0NlxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDQ3XG4gICAgQllURV9TVFJJTkcsIC8vIDB4NDhcbiAgICBCWVRFX1NUUklORywgLy8gMHg0OVxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDRBXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NEJcbiAgICBCWVRFX1NUUklORywgLy8gMHg0Q1xuICAgIEJZVEVfU1RSSU5HLCAvLyAweDREXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NEVcbiAgICBCWVRFX1NUUklORywgLy8gMHg0RlxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDUwXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NTFcbiAgICBCWVRFX1NUUklORywgLy8gMHg1MlxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDUzXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NTRcbiAgICBCWVRFX1NUUklORywgLy8gMHg1NVxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDU2XG4gICAgQllURV9TVFJJTkcsIC8vIDB4NTdcbiAgICAvLyBieXRlIHN0cmluZyAob25lLWJ5dGUgdWludDhfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3cpXG4gICAgQllURV9TVFJJTkdfOCwgLy8gMHg1OFxuICAgIC8vIGJ5dGUgc3RyaW5nICh0d28tYnl0ZSB1aW50MTZfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3cpXG4gICAgQllURV9TVFJJTkdfMTYsIC8vIDB4NTlcbiAgICAvLyBieXRlIHN0cmluZyAoZm91ci1ieXRlIHVpbnQzMl90IGZvciBuLCBhbmQgdGhlbiBuIGJ5dGVzIGZvbGxvdylcbiAgICBCWVRFX1NUUklOR18zMiwgLy8gMHg1YVxuICAgIC8vIGJ5dGUgc3RyaW5nIChlaWdodC1ieXRlIHVpbnQ2NF90IGZvciBuLCBhbmQgdGhlbiBuIGJ5dGVzIGZvbGxvdylcbiAgICBCWVRFX1NUUklOR182NCwgLy8gMHg1YlxuICAgIEVSUk9SLCAvLyAweDVjXG4gICAgRVJST1IsIC8vIDB4NWRcbiAgICBFUlJPUiwgLy8gMHg1ZVxuICAgIC8vIGJ5dGUgc3RyaW5nLCBieXRlIHN0cmluZ3MgZm9sbG93LCB0ZXJtaW5hdGVkIGJ5IFwiYnJlYWtcIlxuICAgIEJZVEVfU1RSSU5HX0JSRUFLLCAvLyAweDVmXG4gICAgLy8gVVRGLTggc3RyaW5nICgweDAwLi4weDE3IGJ5dGVzIGZvbGxvdylcbiAgICBVVEY4X1NUUklORywgLy8gMHg2MFxuICAgIFVURjhfU1RSSU5HLCAvLyAweDYxXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NjJcbiAgICBVVEY4X1NUUklORywgLy8gMHg2M1xuICAgIFVURjhfU1RSSU5HLCAvLyAweDY0XG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NjVcbiAgICBVVEY4X1NUUklORywgLy8gMHg2NlxuICAgIFVURjhfU1RSSU5HLCAvLyAweDY3XG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NjhcbiAgICBVVEY4X1NUUklORywgLy8gMHg2OVxuICAgIFVURjhfU1RSSU5HLCAvLyAweDZBXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NkJcbiAgICBVVEY4X1NUUklORywgLy8gMHg2Q1xuICAgIFVURjhfU1RSSU5HLCAvLyAweDZEXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NkVcbiAgICBVVEY4X1NUUklORywgLy8gMHg2RlxuICAgIFVURjhfU1RSSU5HLCAvLyAweDcwXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NzFcbiAgICBVVEY4X1NUUklORywgLy8gMHg3MlxuICAgIFVURjhfU1RSSU5HLCAvLyAweDczXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NzRcbiAgICBVVEY4X1NUUklORywgLy8gMHg3NVxuICAgIFVURjhfU1RSSU5HLCAvLyAweDc2XG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NzdcbiAgICAvLyBVVEYtOCBzdHJpbmcgKG9uZS1ieXRlIHVpbnQ4X3QgZm9yIG4sIGFuZCB0aGVuIG4gYnl0ZXMgZm9sbG93KVxuICAgIFVURjhfU1RSSU5HXzgsIC8vIDB4NzhcbiAgICAvLyBVVEYtOCBzdHJpbmcgKHR3by1ieXRlIHVpbnQxNl90IGZvciBuLCBhbmQgdGhlbiBuIGJ5dGVzIGZvbGxvdylcbiAgICBVVEY4X1NUUklOR18xNiwgLy8gMHg3OVxuICAgIC8vIFVURi04IHN0cmluZyAoZm91ci1ieXRlIHVpbnQzMl90IGZvciBuLCBhbmQgdGhlbiBuIGJ5dGVzIGZvbGxvdylcbiAgICBVVEY4X1NUUklOR18zMiwgLy8gMHg3YVxuICAgIC8vIFVURi04IHN0cmluZyAoZWlnaHQtYnl0ZSB1aW50NjRfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3cpXG4gICAgVVRGOF9TVFJJTkdfNjQsIC8vIDB4N2JcbiAgICAvLyBVVEYtOCBzdHJpbmcsIFVURi04IHN0cmluZ3MgZm9sbG93LCB0ZXJtaW5hdGVkIGJ5IFwiYnJlYWtcIlxuICAgIEVSUk9SLCAvLyAweDdjXG4gICAgRVJST1IsIC8vIDB4N2RcbiAgICBFUlJPUiwgLy8gMHg3ZVxuICAgIFVURjhfU1RSSU5HX0JSRUFLLCAvLyAweDdmXG4gICAgLy8gYXJyYXkgKDB4MDAuLjB4MTcgZGF0YSBpdGVtcyBmb2xsb3cpXG4gICAgQVJSQVksIC8vIDB4ODBcbiAgICBBUlJBWSwgLy8gMHg4MVxuICAgIEFSUkFZLCAvLyAweDgyXG4gICAgQVJSQVksIC8vIDB4ODNcbiAgICBBUlJBWSwgLy8gMHg4NFxuICAgIEFSUkFZLCAvLyAweDg1XG4gICAgQVJSQVksIC8vIDB4ODZcbiAgICBBUlJBWSwgLy8gMHg4N1xuICAgIEFSUkFZLCAvLyAweDg4XG4gICAgQVJSQVksIC8vIDB4ODlcbiAgICBBUlJBWSwgLy8gMHg4QVxuICAgIEFSUkFZLCAvLyAweDhCXG4gICAgQVJSQVksIC8vIDB4OENcbiAgICBBUlJBWSwgLy8gMHg4RFxuICAgIEFSUkFZLCAvLyAweDhFXG4gICAgQVJSQVksIC8vIDB4OEZcbiAgICBBUlJBWSwgLy8gMHg5MFxuICAgIEFSUkFZLCAvLyAweDkxXG4gICAgQVJSQVksIC8vIDB4OTJcbiAgICBBUlJBWSwgLy8gMHg5M1xuICAgIEFSUkFZLCAvLyAweDk0XG4gICAgQVJSQVksIC8vIDB4OTVcbiAgICBBUlJBWSwgLy8gMHg5NlxuICAgIEFSUkFZLCAvLyAweDk3XG4gICAgLy8gYXJyYXkgKG9uZS1ieXRlIHVpbnQ4X3QgZm8sIGFuZCB0aGVuIG4gZGF0YSBpdGVtcyBmb2xsb3cpXG4gICAgQVJSQVlfOCwgLy8gMHg5OFxuICAgIC8vIGFycmF5ICh0d28tYnl0ZSB1aW50MTZfdCBmb3IgbiwgYW5kIHRoZW4gbiBkYXRhIGl0ZW1zIGZvbGxvdylcbiAgICBBUlJBWV8xNiwgLy8gMHg5OVxuICAgIC8vIGFycmF5IChmb3VyLWJ5dGUgdWludDMyX3QgZm9yIG4sIGFuZCB0aGVuIG4gZGF0YSBpdGVtcyBmb2xsb3cpXG4gICAgQVJSQVlfMzIsIC8vIDB4OWFcbiAgICAvLyBhcnJheSAoZWlnaHQtYnl0ZSB1aW50NjRfdCBmb3IgbiwgYW5kIHRoZW4gbiBkYXRhIGl0ZW1zIGZvbGxvdylcbiAgICBBUlJBWV82NCwgLy8gMHg5YlxuICAgIC8vIGFycmF5LCBkYXRhIGl0ZW1zIGZvbGxvdywgdGVybWluYXRlZCBieSBcImJyZWFrXCJcbiAgICBFUlJPUiwgLy8gMHg5Y1xuICAgIEVSUk9SLCAvLyAweDlkXG4gICAgRVJST1IsIC8vIDB4OWVcbiAgICBBUlJBWV9CUkVBSywgLy8gMHg5ZlxuICAgIC8vIG1hcCAoMHgwMC4uMHgxNyBwYWlycyBvZiBkYXRhIGl0ZW1zIGZvbGxvdylcbiAgICBNQVAsIC8vIDB4YTBcbiAgICBNQVAsIC8vIDB4YTFcbiAgICBNQVAsIC8vIDB4YTJcbiAgICBNQVAsIC8vIDB4YTNcbiAgICBNQVAsIC8vIDB4YTRcbiAgICBNQVAsIC8vIDB4YTVcbiAgICBNQVAsIC8vIDB4YTZcbiAgICBNQVAsIC8vIDB4YTdcbiAgICBNQVAsIC8vIDB4YThcbiAgICBNQVAsIC8vIDB4YTlcbiAgICBNQVAsIC8vIDB4YUFcbiAgICBNQVAsIC8vIDB4YUJcbiAgICBNQVAsIC8vIDB4YUNcbiAgICBNQVAsIC8vIDB4YURcbiAgICBNQVAsIC8vIDB4YUVcbiAgICBNQVAsIC8vIDB4YUZcbiAgICBNQVAsIC8vIDB4YjBcbiAgICBNQVAsIC8vIDB4YjFcbiAgICBNQVAsIC8vIDB4YjJcbiAgICBNQVAsIC8vIDB4YjNcbiAgICBNQVAsIC8vIDB4YjRcbiAgICBNQVAsIC8vIDB4YjVcbiAgICBNQVAsIC8vIDB4YjZcbiAgICBNQVAsIC8vIDB4YjdcbiAgICAvLyBtYXAgKG9uZS1ieXRlIHVpbnQ4X3QgZm9yIG4sIGFuZCB0aGVuIG4gcGFpcnMgb2YgZGF0YSBpdGVtcyBmb2xsb3cpXG4gICAgTUFQXzgsIC8vIDB4YjhcbiAgICAvLyBtYXAgKHR3by1ieXRlIHVpbnQxNl90IGZvciBuLCBhbmQgdGhlbiBuIHBhaXJzIG9mIGRhdGEgaXRlbXMgZm9sbG93KVxuICAgIE1BUF8xNiwgLy8gMHhiOVxuICAgIC8vIG1hcCAoZm91ci1ieXRlIHVpbnQzMl90IGZvciBuLCBhbmQgdGhlbiBuIHBhaXJzIG9mIGRhdGEgaXRlbXMgZm9sbG93KVxuICAgIE1BUF8zMiwgLy8gMHhiYVxuICAgIC8vIG1hcCAoZWlnaHQtYnl0ZSB1aW50NjRfdCBmb3IgbiwgYW5kIHRoZW4gbiBwYWlycyBvZiBkYXRhIGl0ZW1zIGZvbGxvdylcbiAgICBNQVBfNjQsIC8vIDB4YmJcbiAgICBFUlJPUiwgLy8gMHhiY1xuICAgIEVSUk9SLCAvLyAweGJkXG4gICAgRVJST1IsIC8vIDB4YmVcbiAgICAvLyBtYXAsIHBhaXJzIG9mIGRhdGEgaXRlbXMgZm9sbG93LCB0ZXJtaW5hdGVkIGJ5IFwiYnJlYWtcIlxuICAgIE1BUF9CUkVBSywgLy8gMHhiZlxuICAgIC8vIFRleHQtYmFzZWQgZGF0ZS90aW1lIChkYXRhIGl0ZW0gZm9sbG93czsgc2VlIFNlY3Rpb24gMi40LjEpXG4gICAgVEFHX0tOT1dOLCAvLyAweGMwXG4gICAgLy8gRXBvY2gtYmFzZWQgZGF0ZS90aW1lIChkYXRhIGl0ZW0gZm9sbG93czsgc2VlIFNlY3Rpb24gMi40LjEpXG4gICAgVEFHX0tOT1dOLCAvLyAweGMxXG4gICAgLy8gUG9zaXRpdmUgYmlnbnVtIChkYXRhIGl0ZW0gXCJieXRlIHN0cmluZ1wiIGZvbGxvd3MpXG4gICAgVEFHX0tOT1dOLCAvLyAweGMyXG4gICAgLy8gTmVnYXRpdmUgYmlnbnVtIChkYXRhIGl0ZW0gXCJieXRlIHN0cmluZ1wiIGZvbGxvd3MpXG4gICAgVEFHX0tOT1dOLCAvLyAweGMzXG4gICAgLy8gRGVjaW1hbCBGcmFjdGlvbiAoZGF0YSBpdGVtIFwiYXJyYXlcIiBmb2xsb3dzOyBzZWUgU2VjdGlvbiAyLjQuMylcbiAgICBUQUdfS05PV04sIC8vIDB4YzRcbiAgICAvLyBCaWdmbG9hdCAoZGF0YSBpdGVtIFwiYXJyYXlcIiBmb2xsb3dzOyBzZWUgU2VjdGlvbiAyLjQuMylcbiAgICBUQUdfS05PV04sIC8vIDB4YzVcbiAgICAvLyAodGFnZ2VkIGl0ZW0pXG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4YzZcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhjN1xuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGM4XG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4YzlcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhjYVxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGNiXG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4Y2NcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhjZFxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGNlXG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4Y2ZcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhkMFxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGQxXG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4ZDJcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhkM1xuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGQ0XG4gICAgLy8gRXhwZWN0ZWQgQ29udmVyc2lvbiAoZGF0YSBpdGVtIGZvbGxvd3M7IHNlZSBTZWN0aW9uIDIuNC40LjIpXG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4ZDVcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhkNlxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGQ3XG4gICAgLy8gKG1vcmUgdGFnZ2VkIGl0ZW1zLCAxLzIvNC84IGJ5dGVzIGFuZCB0aGVuIGEgZGF0YSBpdGVtIGZvbGxvdylcbiAgICBUQUdfTU9SRV8xLCAvLyAweGQ4XG4gICAgVEFHX01PUkVfMiwgLy8gMHhkOVxuICAgIFRBR19NT1JFXzQsIC8vIDB4ZGFcbiAgICBUQUdfTU9SRV84LCAvLyAweGRiXG4gICAgRVJST1IsIC8vIDB4ZGNcbiAgICBFUlJPUiwgLy8gMHhkZFxuICAgIEVSUk9SLCAvLyAweGRlXG4gICAgRVJST1IsIC8vIDB4ZGZcbiAgICAvLyAoc2ltcGxlIHZhbHVlKVxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGUwXG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZTFcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlMlxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGUzXG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZTRcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlNVxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGU2XG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZTdcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlOFxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGU5XG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZWFcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlYlxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGVjXG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZWRcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlZVxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGVmXG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZjBcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhmMVxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGYyXG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZjNcbiAgICAvLyBGYWxzZVxuICAgIFNJTVBMRV9GQUxTRSwgLy8gMHhmNFxuICAgIC8vIFRydWVcbiAgICBTSU1QTEVfVFJVRSwgLy8gMHhmNVxuICAgIC8vIE51bGxcbiAgICBTSU1QTEVfTlVMTCwgLy8gMHhmNlxuICAgIC8vIFVuZGVmaW5lZFxuICAgIFNJTVBMRV9VTkRFRklORUQsIC8vIDB4ZjdcbiAgICAvLyAoc2ltcGxlIHZhbHVlLCBvbmUgYnl0ZSBmb2xsb3dzKVxuICAgIFNJTVBMRV9CWVRFLCAvLyAweGY4XG4gICAgLy8gSGFsZi1QcmVjaXNpb24gRmxvYXQgKHR3by1ieXRlIElFRUUgNzU0KVxuICAgIFNJTVBMRV9GTE9BVF9IQUxGLCAvLyAweGY5XG4gICAgLy8gU2luZ2xlLVByZWNpc2lvbiBGbG9hdCAoZm91ci1ieXRlIElFRUUgNzU0KVxuICAgIFNJTVBMRV9GTE9BVF9TSU5HTEUsIC8vIDB4ZmFcbiAgICAvLyBEb3VibGUtUHJlY2lzaW9uIEZsb2F0IChlaWdodC1ieXRlIElFRUUgNzU0KVxuICAgIFNJTVBMRV9GTE9BVF9ET1VCTEUsIC8vIDB4ZmJcbiAgICBFUlJPUiwgLy8gMHhmY1xuICAgIEVSUk9SLCAvLyAweGZkXG4gICAgRVJST1IsIC8vIDB4ZmVcbiAgICAvLyBcImJyZWFrXCIgc3RvcCBjb2RlXG4gICAgQlJFQUsgLy8gMHhmZlxuICBdXG5cbiAgLy8gLS1cblxuICByZXR1cm4ge1xuICAgIHBhcnNlOiBwYXJzZVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuY29uc3QgQmlnbnVtYmVyID0gcmVxdWlyZSgnYmlnbnVtYmVyLmpzJykuQmlnTnVtYmVyXG5cbmNvbnN0IHBhcnNlciA9IHJlcXVpcmUoJy4vZGVjb2Rlci5hc20nKVxuY29uc3QgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJylcbmNvbnN0IGMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpXG5jb25zdCBTaW1wbGUgPSByZXF1aXJlKCcuL3NpbXBsZScpXG5jb25zdCBUYWdnZWQgPSByZXF1aXJlKCcuL3RhZ2dlZCcpXG5jb25zdCB7IFVSTCB9ID0gcmVxdWlyZSgnaXNvLXVybCcpXG5cbi8qKlxuICogVHJhbnNmb3JtIGJpbmFyeSBjYm9yIGRhdGEgaW50byBKYXZhU2NyaXB0IG9iamVjdHMuXG4gKi9cbmNsYXNzIERlY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRzPXt9XVxuICAgKiBAcGFyYW0ge251bWJlcn0gW29wdHMuc2l6ZT02NTUzNl0gLSBTaXplIG9mIHRoZSBhbGxvY2F0ZWQgaGVhcC5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChvcHRzKSB7XG4gICAgb3B0cyA9IG9wdHMgfHwge31cblxuICAgIGlmICghb3B0cy5zaXplIHx8IG9wdHMuc2l6ZSA8IDB4MTAwMDApIHtcbiAgICAgIG9wdHMuc2l6ZSA9IDB4MTAwMDBcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRW5zdXJlIHRoZSBzaXplIGlzIGEgcG93ZXIgb2YgMlxuICAgICAgb3B0cy5zaXplID0gdXRpbHMubmV4dFBvd2VyT2YyKG9wdHMuc2l6ZSlcbiAgICB9XG5cbiAgICAvLyBIZWFwIHVzZSB0byBzaGFyZSB0aGUgaW5wdXQgd2l0aCB0aGUgcGFyc2VyXG4gICAgdGhpcy5faGVhcCA9IG5ldyBBcnJheUJ1ZmZlcihvcHRzLnNpemUpXG4gICAgdGhpcy5faGVhcDggPSBuZXcgVWludDhBcnJheSh0aGlzLl9oZWFwKVxuICAgIHRoaXMuX2J1ZmZlciA9IEJ1ZmZlci5mcm9tKHRoaXMuX2hlYXApXG5cbiAgICB0aGlzLl9yZXNldCgpXG5cbiAgICAvLyBLbm93biB0YWdzXG4gICAgdGhpcy5fa25vd25UYWdzID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAwOiAodmFsKSA9PiBuZXcgRGF0ZSh2YWwpLFxuICAgICAgMTogKHZhbCkgPT4gbmV3IERhdGUodmFsICogMTAwMCksXG4gICAgICAyOiAodmFsKSA9PiB1dGlscy5hcnJheUJ1ZmZlclRvQmlnbnVtYmVyKHZhbCksXG4gICAgICAzOiAodmFsKSA9PiBjLk5FR19PTkUubWludXModXRpbHMuYXJyYXlCdWZmZXJUb0JpZ251bWJlcih2YWwpKSxcbiAgICAgIDQ6ICh2KSA9PiB7XG4gICAgICAgIC8vIGNvbnN0IHYgPSBuZXcgVWludDhBcnJheSh2YWwpXG4gICAgICAgIHJldHVybiBjLlRFTi5wb3codlswXSkudGltZXModlsxXSlcbiAgICAgIH0sXG4gICAgICA1OiAodikgPT4ge1xuICAgICAgICAvLyBjb25zdCB2ID0gbmV3IFVpbnQ4QXJyYXkodmFsKVxuICAgICAgICByZXR1cm4gYy5UV08ucG93KHZbMF0pLnRpbWVzKHZbMV0pXG4gICAgICB9LFxuICAgICAgMzI6ICh2YWwpID0+IG5ldyBVUkwodmFsKSxcbiAgICAgIDM1OiAodmFsKSA9PiBuZXcgUmVnRXhwKHZhbClcbiAgICB9LCBvcHRzLnRhZ3MpXG5cbiAgICAvLyBJbml0aWFsaXplIGFzbSBiYXNlZCBwYXJzZXJcbiAgICB0aGlzLnBhcnNlciA9IHBhcnNlcihnbG9iYWwsIHtcbiAgICAgIGxvZzogY29uc29sZS5sb2cuYmluZChjb25zb2xlKSxcbiAgICAgIHB1c2hJbnQ6IHRoaXMucHVzaEludC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEludDMyOiB0aGlzLnB1c2hJbnQzMi5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEludDMyTmVnOiB0aGlzLnB1c2hJbnQzMk5lZy5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEludDY0OiB0aGlzLnB1c2hJbnQ2NC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEludDY0TmVnOiB0aGlzLnB1c2hJbnQ2NE5lZy5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEZsb2F0OiB0aGlzLnB1c2hGbG9hdC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEZsb2F0U2luZ2xlOiB0aGlzLnB1c2hGbG9hdFNpbmdsZS5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEZsb2F0RG91YmxlOiB0aGlzLnB1c2hGbG9hdERvdWJsZS5iaW5kKHRoaXMpLFxuICAgICAgcHVzaFRydWU6IHRoaXMucHVzaFRydWUuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hGYWxzZTogdGhpcy5wdXNoRmFsc2UuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hVbmRlZmluZWQ6IHRoaXMucHVzaFVuZGVmaW5lZC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaE51bGw6IHRoaXMucHVzaE51bGwuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hJbmZpbml0eTogdGhpcy5wdXNoSW5maW5pdHkuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hJbmZpbml0eU5lZzogdGhpcy5wdXNoSW5maW5pdHlOZWcuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hOYU46IHRoaXMucHVzaE5hTi5iaW5kKHRoaXMpLFxuICAgICAgcHVzaE5hTk5lZzogdGhpcy5wdXNoTmFOTmVnLmJpbmQodGhpcyksXG4gICAgICBwdXNoQXJyYXlTdGFydDogdGhpcy5wdXNoQXJyYXlTdGFydC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEFycmF5U3RhcnRGaXhlZDogdGhpcy5wdXNoQXJyYXlTdGFydEZpeGVkLmJpbmQodGhpcyksXG4gICAgICBwdXNoQXJyYXlTdGFydEZpeGVkMzI6IHRoaXMucHVzaEFycmF5U3RhcnRGaXhlZDMyLmJpbmQodGhpcyksXG4gICAgICBwdXNoQXJyYXlTdGFydEZpeGVkNjQ6IHRoaXMucHVzaEFycmF5U3RhcnRGaXhlZDY0LmJpbmQodGhpcyksXG4gICAgICBwdXNoT2JqZWN0U3RhcnQ6IHRoaXMucHVzaE9iamVjdFN0YXJ0LmJpbmQodGhpcyksXG4gICAgICBwdXNoT2JqZWN0U3RhcnRGaXhlZDogdGhpcy5wdXNoT2JqZWN0U3RhcnRGaXhlZC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaE9iamVjdFN0YXJ0Rml4ZWQzMjogdGhpcy5wdXNoT2JqZWN0U3RhcnRGaXhlZDMyLmJpbmQodGhpcyksXG4gICAgICBwdXNoT2JqZWN0U3RhcnRGaXhlZDY0OiB0aGlzLnB1c2hPYmplY3RTdGFydEZpeGVkNjQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hCeXRlU3RyaW5nOiB0aGlzLnB1c2hCeXRlU3RyaW5nLmJpbmQodGhpcyksXG4gICAgICBwdXNoQnl0ZVN0cmluZ1N0YXJ0OiB0aGlzLnB1c2hCeXRlU3RyaW5nU3RhcnQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hVdGY4U3RyaW5nOiB0aGlzLnB1c2hVdGY4U3RyaW5nLmJpbmQodGhpcyksXG4gICAgICBwdXNoVXRmOFN0cmluZ1N0YXJ0OiB0aGlzLnB1c2hVdGY4U3RyaW5nU3RhcnQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hTaW1wbGVVbmFzc2lnbmVkOiB0aGlzLnB1c2hTaW1wbGVVbmFzc2lnbmVkLmJpbmQodGhpcyksXG4gICAgICBwdXNoVGFnVW5hc3NpZ25lZDogdGhpcy5wdXNoVGFnVW5hc3NpZ25lZC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaFRhZ1N0YXJ0OiB0aGlzLnB1c2hUYWdTdGFydC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaFRhZ1N0YXJ0NDogdGhpcy5wdXNoVGFnU3RhcnQ0LmJpbmQodGhpcyksXG4gICAgICBwdXNoVGFnU3RhcnQ4OiB0aGlzLnB1c2hUYWdTdGFydDguYmluZCh0aGlzKSxcbiAgICAgIHB1c2hCcmVhazogdGhpcy5wdXNoQnJlYWsuYmluZCh0aGlzKVxuICAgIH0sIHRoaXMuX2hlYXApXG4gIH1cblxuICBnZXQgX2RlcHRoICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50cy5sZW5ndGhcbiAgfVxuXG4gIGdldCBfY3VycmVudFBhcmVudCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudHNbdGhpcy5fZGVwdGggLSAxXVxuICB9XG5cbiAgZ2V0IF9yZWYgKCkge1xuICAgIHJldHVybiB0aGlzLl9jdXJyZW50UGFyZW50LnJlZlxuICB9XG5cbiAgLy8gRmluaXNoIHRoZSBjdXJyZW50IHBhcmVudFxuICBfY2xvc2VQYXJlbnQgKCkge1xuICAgIHZhciBwID0gdGhpcy5fcGFyZW50cy5wb3AoKVxuXG4gICAgaWYgKHAubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nICR7cC5sZW5ndGh9IGVsZW1lbnRzYClcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHAudHlwZSkge1xuICAgICAgY2FzZSBjLlBBUkVOVC5UQUc6XG4gICAgICAgIHRoaXMuX3B1c2goXG4gICAgICAgICAgdGhpcy5jcmVhdGVUYWcocC5yZWZbMF0sIHAucmVmWzFdKVxuICAgICAgICApXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIGMuUEFSRU5ULkJZVEVfU1RSSU5HOlxuICAgICAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlQnl0ZVN0cmluZyhwLnJlZiwgcC5sZW5ndGgpKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBjLlBBUkVOVC5VVEY4X1NUUklORzpcbiAgICAgICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZVV0ZjhTdHJpbmcocC5yZWYsIHAubGVuZ3RoKSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgYy5QQVJFTlQuTUFQOlxuICAgICAgICBpZiAocC52YWx1ZXMgJSAyID4gMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT2RkIG51bWJlciBvZiBlbGVtZW50cyBpbiB0aGUgbWFwJylcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlTWFwKHAucmVmLCBwLmxlbmd0aCkpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIGMuUEFSRU5ULk9CSkVDVDpcbiAgICAgICAgaWYgKHAudmFsdWVzICUgMiA+IDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09kZCBudW1iZXIgb2YgZWxlbWVudHMgaW4gdGhlIG1hcCcpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZU9iamVjdChwLnJlZiwgcC5sZW5ndGgpKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBjLlBBUkVOVC5BUlJBWTpcbiAgICAgICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZUFycmF5KHAucmVmLCBwLmxlbmd0aCkpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVha1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9jdXJyZW50UGFyZW50ICYmIHRoaXMuX2N1cnJlbnRQYXJlbnQudHlwZSA9PT0gYy5QQVJFTlQuVEFHKSB7XG4gICAgICB0aGlzLl9kZWMoKVxuICAgIH1cbiAgfVxuXG4gIC8vIFJlZHVjZSB0aGUgZXhwZWN0ZWQgbGVuZ3RoIG9mIHRoZSBjdXJyZW50IHBhcmVudCBieSBvbmVcbiAgX2RlYyAoKSB7XG4gICAgY29uc3QgcCA9IHRoaXMuX2N1cnJlbnRQYXJlbnRcbiAgICAvLyBUaGUgY3VycmVudCBwYXJlbnQgZG9lcyBub3Qga25vdyB0aGUgZXB4ZWN0ZWQgY2hpbGQgbGVuZ3RoXG5cbiAgICBpZiAocC5sZW5ndGggPCAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBwLmxlbmd0aC0tXG5cbiAgICAvLyBBbGwgY2hpbGRyZW4gd2VyZSBzZWVuLCB3ZSBjYW4gY2xvc2UgdGhlIGN1cnJlbnQgcGFyZW50XG4gICAgaWYgKHAubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLl9jbG9zZVBhcmVudCgpXG4gICAgfVxuICB9XG5cbiAgLy8gUHVzaCBhbnkgdmFsdWUgdG8gdGhlIGN1cnJlbnQgcGFyZW50XG4gIF9wdXNoICh2YWwsIGhhc0NoaWxkcmVuKSB7XG4gICAgY29uc3QgcCA9IHRoaXMuX2N1cnJlbnRQYXJlbnRcbiAgICBwLnZhbHVlcysrXG5cbiAgICBzd2l0Y2ggKHAudHlwZSkge1xuICAgICAgY2FzZSBjLlBBUkVOVC5BUlJBWTpcbiAgICAgIGNhc2UgYy5QQVJFTlQuQllURV9TVFJJTkc6XG4gICAgICBjYXNlIGMuUEFSRU5ULlVURjhfU1RSSU5HOlxuICAgICAgICBpZiAocC5sZW5ndGggPiAtMSkge1xuICAgICAgICAgIHRoaXMuX3JlZlt0aGlzLl9yZWYubGVuZ3RoIC0gcC5sZW5ndGhdID0gdmFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fcmVmLnB1c2godmFsKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RlYygpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIGMuUEFSRU5ULk9CSkVDVDpcbiAgICAgICAgaWYgKHAudG1wS2V5ICE9IG51bGwpIHtcbiAgICAgICAgICB0aGlzLl9yZWZbcC50bXBLZXldID0gdmFsXG4gICAgICAgICAgcC50bXBLZXkgPSBudWxsXG4gICAgICAgICAgdGhpcy5fZGVjKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwLnRtcEtleSA9IHZhbFxuXG4gICAgICAgICAgaWYgKHR5cGVvZiBwLnRtcEtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIHRvbyBiYWQsIGNvbnZlcnQgdG8gYSBNYXBcbiAgICAgICAgICAgIHAudHlwZSA9IGMuUEFSRU5ULk1BUFxuICAgICAgICAgICAgcC5yZWYgPSB1dGlscy5idWlsZE1hcChwLnJlZilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgYy5QQVJFTlQuTUFQOlxuICAgICAgICBpZiAocC50bXBLZXkgIT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuX3JlZi5zZXQocC50bXBLZXksIHZhbClcbiAgICAgICAgICBwLnRtcEtleSA9IG51bGxcbiAgICAgICAgICB0aGlzLl9kZWMoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHAudG1wS2V5ID0gdmFsXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgYy5QQVJFTlQuVEFHOlxuICAgICAgICB0aGlzLl9yZWYucHVzaCh2YWwpXG4gICAgICAgIGlmICghaGFzQ2hpbGRyZW4pIHtcbiAgICAgICAgICB0aGlzLl9kZWMoKVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gcGFyZW50IHR5cGUnKVxuICAgIH1cbiAgfVxuXG4gIC8vIENyZWF0ZSBhIG5ldyBwYXJlbnQgaW4gdGhlIHBhcmVudHMgbGlzdFxuICBfY3JlYXRlUGFyZW50IChvYmosIHR5cGUsIGxlbikge1xuICAgIHRoaXMuX3BhcmVudHNbdGhpcy5fZGVwdGhdID0ge1xuICAgICAgdHlwZTogdHlwZSxcbiAgICAgIGxlbmd0aDogbGVuLFxuICAgICAgcmVmOiBvYmosXG4gICAgICB2YWx1ZXM6IDAsXG4gICAgICB0bXBLZXk6IG51bGxcbiAgICB9XG4gIH1cblxuICAvLyBSZXNldCBhbGwgc3RhdGUgYmFjayB0byB0aGUgYmVnaW5uaW5nLCBhbHNvIHVzZWQgZm9yIGluaXRpYXRsaXphdGlvblxuICBfcmVzZXQgKCkge1xuICAgIHRoaXMuX3JlcyA9IFtdXG4gICAgdGhpcy5fcGFyZW50cyA9IFt7XG4gICAgICB0eXBlOiBjLlBBUkVOVC5BUlJBWSxcbiAgICAgIGxlbmd0aDogLTEsXG4gICAgICByZWY6IHRoaXMuX3JlcyxcbiAgICAgIHZhbHVlczogMCxcbiAgICAgIHRtcEtleTogbnVsbFxuICAgIH1dXG4gIH1cblxuICAvLyAtLSBJbnRlcmZhY2UgdG8gY3VzdG9taXplIGRlb2RpbmcgYmVoYXZpb3VyXG4gIGNyZWF0ZVRhZyAodGFnTnVtYmVyLCB2YWx1ZSkge1xuICAgIGNvbnN0IHR5cCA9IHRoaXMuX2tub3duVGFnc1t0YWdOdW1iZXJdXG5cbiAgICBpZiAoIXR5cCkge1xuICAgICAgcmV0dXJuIG5ldyBUYWdnZWQodGFnTnVtYmVyLCB2YWx1ZSlcbiAgICB9XG5cbiAgICByZXR1cm4gdHlwKHZhbHVlKVxuICB9XG5cbiAgY3JlYXRlTWFwIChvYmosIGxlbikge1xuICAgIHJldHVybiBvYmpcbiAgfVxuXG4gIGNyZWF0ZU9iamVjdCAob2JqLCBsZW4pIHtcbiAgICByZXR1cm4gb2JqXG4gIH1cblxuICBjcmVhdGVBcnJheSAoYXJyLCBsZW4pIHtcbiAgICByZXR1cm4gYXJyXG4gIH1cblxuICBjcmVhdGVCeXRlU3RyaW5nIChyYXcsIGxlbikge1xuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KHJhdylcbiAgfVxuXG4gIGNyZWF0ZUJ5dGVTdHJpbmdGcm9tSGVhcCAoc3RhcnQsIGVuZCkge1xuICAgIGlmIChzdGFydCA9PT0gZW5kKSB7XG4gICAgICByZXR1cm4gQnVmZmVyLmFsbG9jKDApXG4gICAgfVxuXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHRoaXMuX2hlYXAuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cblxuICBjcmVhdGVJbnQgKHZhbCkge1xuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGNyZWF0ZUludDMyIChmLCBnKSB7XG4gICAgcmV0dXJuIHV0aWxzLmJ1aWxkSW50MzIoZiwgZylcbiAgfVxuXG4gIGNyZWF0ZUludDY0IChmMSwgZjIsIGcxLCBnMikge1xuICAgIHJldHVybiB1dGlscy5idWlsZEludDY0KGYxLCBmMiwgZzEsIGcyKVxuICB9XG5cbiAgY3JlYXRlRmxvYXQgKHZhbCkge1xuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGNyZWF0ZUZsb2F0U2luZ2xlIChhLCBiLCBjLCBkKSB7XG4gICAgcmV0dXJuIGllZWU3NTQucmVhZChbYSwgYiwgYywgZF0sIDAsIGZhbHNlLCAyMywgNClcbiAgfVxuXG4gIGNyZWF0ZUZsb2F0RG91YmxlIChhLCBiLCBjLCBkLCBlLCBmLCBnLCBoKSB7XG4gICAgcmV0dXJuIGllZWU3NTQucmVhZChbYSwgYiwgYywgZCwgZSwgZiwgZywgaF0sIDAsIGZhbHNlLCA1MiwgOClcbiAgfVxuXG4gIGNyZWF0ZUludDMyTmVnIChmLCBnKSB7XG4gICAgcmV0dXJuIC0xIC0gdXRpbHMuYnVpbGRJbnQzMihmLCBnKVxuICB9XG5cbiAgY3JlYXRlSW50NjROZWcgKGYxLCBmMiwgZzEsIGcyKSB7XG4gICAgY29uc3QgZiA9IHV0aWxzLmJ1aWxkSW50MzIoZjEsIGYyKVxuICAgIGNvbnN0IGcgPSB1dGlscy5idWlsZEludDMyKGcxLCBnMilcblxuICAgIGlmIChmID4gYy5NQVhfU0FGRV9ISUdIKSB7XG4gICAgICByZXR1cm4gYy5ORUdfT05FLm1pbnVzKG5ldyBCaWdudW1iZXIoZikudGltZXMoYy5TSElGVDMyKS5wbHVzKGcpKVxuICAgIH1cblxuICAgIHJldHVybiAtMSAtICgoZiAqIGMuU0hJRlQzMikgKyBnKVxuICB9XG5cbiAgY3JlYXRlVHJ1ZSAoKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGNyZWF0ZUZhbHNlICgpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGNyZWF0ZU51bGwgKCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjcmVhdGVVbmRlZmluZWQgKCkge1xuICAgIHJldHVybiB2b2lkIDBcbiAgfVxuXG4gIGNyZWF0ZUluZmluaXR5ICgpIHtcbiAgICByZXR1cm4gSW5maW5pdHlcbiAgfVxuXG4gIGNyZWF0ZUluZmluaXR5TmVnICgpIHtcbiAgICByZXR1cm4gLUluZmluaXR5XG4gIH1cblxuICBjcmVhdGVOYU4gKCkge1xuICAgIHJldHVybiBOYU5cbiAgfVxuXG4gIGNyZWF0ZU5hTk5lZyAoKSB7XG4gICAgcmV0dXJuIC1OYU5cbiAgfVxuXG4gIGNyZWF0ZVV0ZjhTdHJpbmcgKHJhdywgbGVuKSB7XG4gICAgcmV0dXJuIHJhdy5qb2luKCcnKVxuICB9XG5cbiAgY3JlYXRlVXRmOFN0cmluZ0Zyb21IZWFwIChzdGFydCwgZW5kKSB7XG4gICAgaWYgKHN0YXJ0ID09PSBlbmQpIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9idWZmZXIudG9TdHJpbmcoJ3V0ZjgnLCBzdGFydCwgZW5kKVxuICB9XG5cbiAgY3JlYXRlU2ltcGxlVW5hc3NpZ25lZCAodmFsKSB7XG4gICAgcmV0dXJuIG5ldyBTaW1wbGUodmFsKVxuICB9XG5cbiAgLy8gLS0gSW50ZXJmYWNlIGZvciBkZWNvZGVyLmFzbS5qc1xuXG4gIHB1c2hJbnQgKHZhbCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVJbnQodmFsKSlcbiAgfVxuXG4gIHB1c2hJbnQzMiAoZiwgZykge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVJbnQzMihmLCBnKSlcbiAgfVxuXG4gIHB1c2hJbnQ2NCAoZjEsIGYyLCBnMSwgZzIpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlSW50NjQoZjEsIGYyLCBnMSwgZzIpKVxuICB9XG5cbiAgcHVzaEZsb2F0ICh2YWwpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlRmxvYXQodmFsKSlcbiAgfVxuXG4gIHB1c2hGbG9hdFNpbmdsZSAoYSwgYiwgYywgZCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVGbG9hdFNpbmdsZShhLCBiLCBjLCBkKSlcbiAgfVxuXG4gIHB1c2hGbG9hdERvdWJsZSAoYSwgYiwgYywgZCwgZSwgZiwgZywgaCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVGbG9hdERvdWJsZShhLCBiLCBjLCBkLCBlLCBmLCBnLCBoKSlcbiAgfVxuXG4gIHB1c2hJbnQzMk5lZyAoZiwgZykge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVJbnQzMk5lZyhmLCBnKSlcbiAgfVxuXG4gIHB1c2hJbnQ2NE5lZyAoZjEsIGYyLCBnMSwgZzIpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlSW50NjROZWcoZjEsIGYyLCBnMSwgZzIpKVxuICB9XG5cbiAgcHVzaFRydWUgKCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVUcnVlKCkpXG4gIH1cblxuICBwdXNoRmFsc2UgKCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVGYWxzZSgpKVxuICB9XG5cbiAgcHVzaE51bGwgKCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVOdWxsKCkpXG4gIH1cblxuICBwdXNoVW5kZWZpbmVkICgpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlVW5kZWZpbmVkKCkpXG4gIH1cblxuICBwdXNoSW5maW5pdHkgKCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVJbmZpbml0eSgpKVxuICB9XG5cbiAgcHVzaEluZmluaXR5TmVnICgpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlSW5maW5pdHlOZWcoKSlcbiAgfVxuXG4gIHB1c2hOYU4gKCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVOYU4oKSlcbiAgfVxuXG4gIHB1c2hOYU5OZWcgKCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVOYU5OZWcoKSlcbiAgfVxuXG4gIHB1c2hBcnJheVN0YXJ0ICgpIHtcbiAgICB0aGlzLl9jcmVhdGVQYXJlbnQoW10sIGMuUEFSRU5ULkFSUkFZLCAtMSlcbiAgfVxuXG4gIHB1c2hBcnJheVN0YXJ0Rml4ZWQgKGxlbikge1xuICAgIHRoaXMuX2NyZWF0ZUFycmF5U3RhcnRGaXhlZChsZW4pXG4gIH1cblxuICBwdXNoQXJyYXlTdGFydEZpeGVkMzIgKGxlbjEsIGxlbjIpIHtcbiAgICBjb25zdCBsZW4gPSB1dGlscy5idWlsZEludDMyKGxlbjEsIGxlbjIpXG4gICAgdGhpcy5fY3JlYXRlQXJyYXlTdGFydEZpeGVkKGxlbilcbiAgfVxuXG4gIHB1c2hBcnJheVN0YXJ0Rml4ZWQ2NCAobGVuMSwgbGVuMiwgbGVuMywgbGVuNCkge1xuICAgIGNvbnN0IGxlbiA9IHV0aWxzLmJ1aWxkSW50NjQobGVuMSwgbGVuMiwgbGVuMywgbGVuNClcbiAgICB0aGlzLl9jcmVhdGVBcnJheVN0YXJ0Rml4ZWQobGVuKVxuICB9XG5cbiAgcHVzaE9iamVjdFN0YXJ0ICgpIHtcbiAgICB0aGlzLl9jcmVhdGVPYmplY3RTdGFydEZpeGVkKC0xKVxuICB9XG5cbiAgcHVzaE9iamVjdFN0YXJ0Rml4ZWQgKGxlbikge1xuICAgIHRoaXMuX2NyZWF0ZU9iamVjdFN0YXJ0Rml4ZWQobGVuKVxuICB9XG5cbiAgcHVzaE9iamVjdFN0YXJ0Rml4ZWQzMiAobGVuMSwgbGVuMikge1xuICAgIGNvbnN0IGxlbiA9IHV0aWxzLmJ1aWxkSW50MzIobGVuMSwgbGVuMilcbiAgICB0aGlzLl9jcmVhdGVPYmplY3RTdGFydEZpeGVkKGxlbilcbiAgfVxuXG4gIHB1c2hPYmplY3RTdGFydEZpeGVkNjQgKGxlbjEsIGxlbjIsIGxlbjMsIGxlbjQpIHtcbiAgICBjb25zdCBsZW4gPSB1dGlscy5idWlsZEludDY0KGxlbjEsIGxlbjIsIGxlbjMsIGxlbjQpXG4gICAgdGhpcy5fY3JlYXRlT2JqZWN0U3RhcnRGaXhlZChsZW4pXG4gIH1cblxuICBwdXNoQnl0ZVN0cmluZ1N0YXJ0ICgpIHtcbiAgICB0aGlzLl9wYXJlbnRzW3RoaXMuX2RlcHRoXSA9IHtcbiAgICAgIHR5cGU6IGMuUEFSRU5ULkJZVEVfU1RSSU5HLFxuICAgICAgbGVuZ3RoOiAtMSxcbiAgICAgIHJlZjogW10sXG4gICAgICB2YWx1ZXM6IDAsXG4gICAgICB0bXBLZXk6IG51bGxcbiAgICB9XG4gIH1cblxuICBwdXNoQnl0ZVN0cmluZyAoc3RhcnQsIGVuZCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVCeXRlU3RyaW5nRnJvbUhlYXAoc3RhcnQsIGVuZCkpXG4gIH1cblxuICBwdXNoVXRmOFN0cmluZ1N0YXJ0ICgpIHtcbiAgICB0aGlzLl9wYXJlbnRzW3RoaXMuX2RlcHRoXSA9IHtcbiAgICAgIHR5cGU6IGMuUEFSRU5ULlVURjhfU1RSSU5HLFxuICAgICAgbGVuZ3RoOiAtMSxcbiAgICAgIHJlZjogW10sXG4gICAgICB2YWx1ZXM6IDAsXG4gICAgICB0bXBLZXk6IG51bGxcbiAgICB9XG4gIH1cblxuICBwdXNoVXRmOFN0cmluZyAoc3RhcnQsIGVuZCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVVdGY4U3RyaW5nRnJvbUhlYXAoc3RhcnQsIGVuZCkpXG4gIH1cblxuICBwdXNoU2ltcGxlVW5hc3NpZ25lZCAodmFsKSB7XG4gICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZVNpbXBsZVVuYXNzaWduZWQodmFsKSlcbiAgfVxuXG4gIHB1c2hUYWdTdGFydCAodGFnKSB7XG4gICAgdGhpcy5fcGFyZW50c1t0aGlzLl9kZXB0aF0gPSB7XG4gICAgICB0eXBlOiBjLlBBUkVOVC5UQUcsXG4gICAgICBsZW5ndGg6IDEsXG4gICAgICByZWY6IFt0YWddXG4gICAgfVxuICB9XG5cbiAgcHVzaFRhZ1N0YXJ0NCAoZiwgZykge1xuICAgIHRoaXMucHVzaFRhZ1N0YXJ0KHV0aWxzLmJ1aWxkSW50MzIoZiwgZykpXG4gIH1cblxuICBwdXNoVGFnU3RhcnQ4IChmMSwgZjIsIGcxLCBnMikge1xuICAgIHRoaXMucHVzaFRhZ1N0YXJ0KHV0aWxzLmJ1aWxkSW50NjQoZjEsIGYyLCBnMSwgZzIpKVxuICB9XG5cbiAgcHVzaFRhZ1VuYXNzaWduZWQgKHRhZ051bWJlcikge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVUYWcodGFnTnVtYmVyKSlcbiAgfVxuXG4gIHB1c2hCcmVhayAoKSB7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRQYXJlbnQubGVuZ3RoID4gLTEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBicmVhaycpXG4gICAgfVxuXG4gICAgdGhpcy5fY2xvc2VQYXJlbnQoKVxuICB9XG5cbiAgX2NyZWF0ZU9iamVjdFN0YXJ0Rml4ZWQgKGxlbikge1xuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVPYmplY3Qoe30pKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5fY3JlYXRlUGFyZW50KHt9LCBjLlBBUkVOVC5PQkpFQ1QsIGxlbilcbiAgfVxuXG4gIF9jcmVhdGVBcnJheVN0YXJ0Rml4ZWQgKGxlbikge1xuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVBcnJheShbXSkpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLl9jcmVhdGVQYXJlbnQobmV3IEFycmF5KGxlbiksIGMuUEFSRU5ULkFSUkFZLCBsZW4pXG4gIH1cblxuICBfZGVjb2RlIChpbnB1dCkge1xuICAgIGlmIChpbnB1dC5ieXRlTGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lucHV0IHRvbyBzaG9ydCcpXG4gICAgfVxuXG4gICAgdGhpcy5fcmVzZXQoKVxuICAgIHRoaXMuX2hlYXA4LnNldChpbnB1dClcbiAgICBjb25zdCBjb2RlID0gdGhpcy5wYXJzZXIucGFyc2UoaW5wdXQuYnl0ZUxlbmd0aClcblxuICAgIGlmICh0aGlzLl9kZXB0aCA+IDEpIHtcbiAgICAgIHdoaWxlICh0aGlzLl9jdXJyZW50UGFyZW50Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLl9jbG9zZVBhcmVudCgpXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fZGVwdGggPiAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5kZXRlcm1pbmF0ZWQgbmVzdGluZycpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBwYXJzZScpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3Jlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdmFsaWQgcmVzdWx0JylcbiAgICB9XG4gIH1cblxuICAvLyAtLSBQdWJsaWMgSW50ZXJmYWNlXG5cbiAgZGVjb2RlRmlyc3QgKGlucHV0KSB7XG4gICAgdGhpcy5fZGVjb2RlKGlucHV0KVxuXG4gICAgcmV0dXJuIHRoaXMuX3Jlc1swXVxuICB9XG5cbiAgZGVjb2RlQWxsIChpbnB1dCkge1xuICAgIHRoaXMuX2RlY29kZShpbnB1dClcblxuICAgIHJldHVybiB0aGlzLl9yZXNcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNvZGUgdGhlIGZpcnN0IGNib3Igb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge0J1ZmZlcnxzdHJpbmd9IGlucHV0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbZW5jPSdoZXgnXSAtIEVuY29kaW5nIHVzZWQgaWYgYSBzdHJpbmcgaXMgcGFzc2VkLlxuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIHN0YXRpYyBkZWNvZGUgKGlucHV0LCBlbmMpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgaW5wdXQgPSBCdWZmZXIuZnJvbShpbnB1dCwgZW5jIHx8ICdoZXgnKVxuICAgIH1cblxuICAgIGNvbnN0IGRlYyA9IG5ldyBEZWNvZGVyKHsgc2l6ZTogaW5wdXQubGVuZ3RoIH0pXG4gICAgcmV0dXJuIGRlYy5kZWNvZGVGaXJzdChpbnB1dClcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNvZGUgYWxsIGNib3Igb2JqZWN0cy5cbiAgICpcbiAgICogQHBhcmFtIHtCdWZmZXJ8c3RyaW5nfSBpbnB1dFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2VuYz0naGV4J10gLSBFbmNvZGluZyB1c2VkIGlmIGEgc3RyaW5nIGlzIHBhc3NlZC5cbiAgICogQHJldHVybnMge0FycmF5PCo+fVxuICAgKi9cbiAgc3RhdGljIGRlY29kZUFsbCAoaW5wdXQsIGVuYykge1xuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpbnB1dCA9IEJ1ZmZlci5mcm9tKGlucHV0LCBlbmMgfHwgJ2hleCcpXG4gICAgfVxuXG4gICAgY29uc3QgZGVjID0gbmV3IERlY29kZXIoeyBzaXplOiBpbnB1dC5sZW5ndGggfSlcbiAgICByZXR1cm4gZGVjLmRlY29kZUFsbChpbnB1dClcbiAgfVxufVxuXG5EZWNvZGVyLmRlY29kZUZpcnN0ID0gRGVjb2Rlci5kZWNvZGVcblxubW9kdWxlLmV4cG9ydHMgPSBEZWNvZGVyXG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgRGVjb2RlciA9IHJlcXVpcmUoJy4vZGVjb2RlcicpXG5jb25zdCB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKVxuXG4vKipcbiAqIE91dHB1dCB0aGUgZGlhZ25vc3RpYyBmb3JtYXQgZnJvbSBhIHN0cmVhbSBvZiBDQk9SIGJ5dGVzLlxuICpcbiAqL1xuY2xhc3MgRGlhZ25vc2UgZXh0ZW5kcyBEZWNvZGVyIHtcbiAgY3JlYXRlVGFnICh0YWdOdW1iZXIsIHZhbHVlKSB7XG4gICAgcmV0dXJuIGAke3RhZ051bWJlcn0oJHt2YWx1ZX0pYFxuICB9XG5cbiAgY3JlYXRlSW50ICh2YWwpIHtcbiAgICByZXR1cm4gc3VwZXIuY3JlYXRlSW50KHZhbCkudG9TdHJpbmcoKVxuICB9XG5cbiAgY3JlYXRlSW50MzIgKGYsIGcpIHtcbiAgICByZXR1cm4gc3VwZXIuY3JlYXRlSW50MzIoZiwgZykudG9TdHJpbmcoKVxuICB9XG5cbiAgY3JlYXRlSW50NjQgKGYxLCBmMiwgZzEsIGcyKSB7XG4gICAgcmV0dXJuIHN1cGVyLmNyZWF0ZUludDY0KGYxLCBmMiwgZzEsIGcyKS50b1N0cmluZygpXG4gIH1cblxuICBjcmVhdGVJbnQzMk5lZyAoZiwgZykge1xuICAgIHJldHVybiBzdXBlci5jcmVhdGVJbnQzMk5lZyhmLCBnKS50b1N0cmluZygpXG4gIH1cblxuICBjcmVhdGVJbnQ2NE5lZyAoZjEsIGYyLCBnMSwgZzIpIHtcbiAgICByZXR1cm4gc3VwZXIuY3JlYXRlSW50NjROZWcoZjEsIGYyLCBnMSwgZzIpLnRvU3RyaW5nKClcbiAgfVxuXG4gIGNyZWF0ZVRydWUgKCkge1xuICAgIHJldHVybiAndHJ1ZSdcbiAgfVxuXG4gIGNyZWF0ZUZhbHNlICgpIHtcbiAgICByZXR1cm4gJ2ZhbHNlJ1xuICB9XG5cbiAgY3JlYXRlRmxvYXQgKHZhbCkge1xuICAgIGNvbnN0IGZsID0gc3VwZXIuY3JlYXRlRmxvYXQodmFsKVxuICAgIGlmICh1dGlscy5pc05lZ2F0aXZlWmVybyh2YWwpKSB7XG4gICAgICByZXR1cm4gJy0wXzEnXG4gICAgfVxuXG4gICAgcmV0dXJuIGAke2ZsfV8xYFxuICB9XG5cbiAgY3JlYXRlRmxvYXRTaW5nbGUgKGEsIGIsIGMsIGQpIHtcbiAgICBjb25zdCBmbCA9IHN1cGVyLmNyZWF0ZUZsb2F0U2luZ2xlKGEsIGIsIGMsIGQpXG4gICAgcmV0dXJuIGAke2ZsfV8yYFxuICB9XG5cbiAgY3JlYXRlRmxvYXREb3VibGUgKGEsIGIsIGMsIGQsIGUsIGYsIGcsIGgpIHtcbiAgICBjb25zdCBmbCA9IHN1cGVyLmNyZWF0ZUZsb2F0RG91YmxlKGEsIGIsIGMsIGQsIGUsIGYsIGcsIGgpXG4gICAgcmV0dXJuIGAke2ZsfV8zYFxuICB9XG5cbiAgY3JlYXRlQnl0ZVN0cmluZyAocmF3LCBsZW4pIHtcbiAgICBjb25zdCB2YWwgPSByYXcuam9pbignLCAnKVxuXG4gICAgaWYgKGxlbiA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBgKF8gJHt2YWx9KWBcbiAgICB9XG4gICAgcmV0dXJuIGBoJyR7dmFsfWBcbiAgfVxuXG4gIGNyZWF0ZUJ5dGVTdHJpbmdGcm9tSGVhcCAoc3RhcnQsIGVuZCkge1xuICAgIGNvbnN0IHZhbCA9IChCdWZmZXIuZnJvbShcbiAgICAgIHN1cGVyLmNyZWF0ZUJ5dGVTdHJpbmdGcm9tSGVhcChzdGFydCwgZW5kKVxuICAgICkpLnRvU3RyaW5nKCdoZXgnKVxuXG4gICAgcmV0dXJuIGBoJyR7dmFsfSdgXG4gIH1cblxuICBjcmVhdGVJbmZpbml0eSAoKSB7XG4gICAgcmV0dXJuICdJbmZpbml0eV8xJ1xuICB9XG5cbiAgY3JlYXRlSW5maW5pdHlOZWcgKCkge1xuICAgIHJldHVybiAnLUluZmluaXR5XzEnXG4gIH1cblxuICBjcmVhdGVOYU4gKCkge1xuICAgIHJldHVybiAnTmFOXzEnXG4gIH1cblxuICBjcmVhdGVOYU5OZWcgKCkge1xuICAgIHJldHVybiAnLU5hTl8xJ1xuICB9XG5cbiAgY3JlYXRlTnVsbCAoKSB7XG4gICAgcmV0dXJuICdudWxsJ1xuICB9XG5cbiAgY3JlYXRlVW5kZWZpbmVkICgpIHtcbiAgICByZXR1cm4gJ3VuZGVmaW5lZCdcbiAgfVxuXG4gIGNyZWF0ZVNpbXBsZVVuYXNzaWduZWQgKHZhbCkge1xuICAgIHJldHVybiBgc2ltcGxlKCR7dmFsfSlgXG4gIH1cblxuICBjcmVhdGVBcnJheSAoYXJyLCBsZW4pIHtcbiAgICBjb25zdCB2YWwgPSBzdXBlci5jcmVhdGVBcnJheShhcnIsIGxlbilcblxuICAgIGlmIChsZW4gPT09IC0xKSB7XG4gICAgICAvLyBpbmRlZmluaXRlXG4gICAgICByZXR1cm4gYFtfICR7dmFsLmpvaW4oJywgJyl9XWBcbiAgICB9XG5cbiAgICByZXR1cm4gYFske3ZhbC5qb2luKCcsICcpfV1gXG4gIH1cblxuICBjcmVhdGVNYXAgKG1hcCwgbGVuKSB7XG4gICAgY29uc3QgdmFsID0gc3VwZXIuY3JlYXRlTWFwKG1hcClcbiAgICBjb25zdCBsaXN0ID0gQXJyYXkuZnJvbSh2YWwua2V5cygpKVxuICAgICAgLnJlZHVjZShjb2xsZWN0T2JqZWN0KHZhbCksICcnKVxuXG4gICAgaWYgKGxlbiA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBge18gJHtsaXN0fX1gXG4gICAgfVxuXG4gICAgcmV0dXJuIGB7JHtsaXN0fX1gXG4gIH1cblxuICBjcmVhdGVPYmplY3QgKG9iaiwgbGVuKSB7XG4gICAgY29uc3QgdmFsID0gc3VwZXIuY3JlYXRlT2JqZWN0KG9iailcbiAgICBjb25zdCBtYXAgPSBPYmplY3Qua2V5cyh2YWwpXG4gICAgICAucmVkdWNlKGNvbGxlY3RPYmplY3QodmFsKSwgJycpXG5cbiAgICBpZiAobGVuID09PSAtMSkge1xuICAgICAgcmV0dXJuIGB7XyAke21hcH19YFxuICAgIH1cblxuICAgIHJldHVybiBgeyR7bWFwfX1gXG4gIH1cblxuICBjcmVhdGVVdGY4U3RyaW5nIChyYXcsIGxlbikge1xuICAgIGNvbnN0IHZhbCA9IHJhdy5qb2luKCcsICcpXG5cbiAgICBpZiAobGVuID09PSAtMSkge1xuICAgICAgcmV0dXJuIGAoXyAke3ZhbH0pYFxuICAgIH1cblxuICAgIHJldHVybiBgXCIke3ZhbH1cImBcbiAgfVxuXG4gIGNyZWF0ZVV0ZjhTdHJpbmdGcm9tSGVhcCAoc3RhcnQsIGVuZCkge1xuICAgIGNvbnN0IHZhbCA9IChCdWZmZXIuZnJvbShcbiAgICAgIHN1cGVyLmNyZWF0ZVV0ZjhTdHJpbmdGcm9tSGVhcChzdGFydCwgZW5kKVxuICAgICkpLnRvU3RyaW5nKCd1dGY4JylcblxuICAgIHJldHVybiBgXCIke3ZhbH1cImBcbiAgfVxuXG4gIHN0YXRpYyBkaWFnbm9zZSAoaW5wdXQsIGVuYykge1xuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpbnB1dCA9IEJ1ZmZlci5mcm9tKGlucHV0LCBlbmMgfHwgJ2hleCcpXG4gICAgfVxuXG4gICAgY29uc3QgZGVjID0gbmV3IERpYWdub3NlKClcbiAgICByZXR1cm4gZGVjLmRlY29kZUZpcnN0KGlucHV0KVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGlhZ25vc2VcblxuZnVuY3Rpb24gY29sbGVjdE9iamVjdCAodmFsKSB7XG4gIHJldHVybiAoYWNjLCBrZXkpID0+IHtcbiAgICBpZiAoYWNjKSB7XG4gICAgICByZXR1cm4gYCR7YWNjfSwgJHtrZXl9OiAke3ZhbFtrZXldfWBcbiAgICB9XG4gICAgcmV0dXJuIGAke2tleX06ICR7dmFsW2tleV19YFxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgeyBVUkwgfSA9IHJlcXVpcmUoJ2lzby11cmwnKVxuY29uc3QgQmlnbnVtYmVyID0gcmVxdWlyZSgnYmlnbnVtYmVyLmpzJykuQmlnTnVtYmVyXG5cbmNvbnN0IHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpXG5jb25zdCBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpXG5jb25zdCBNVCA9IGNvbnN0YW50cy5NVFxuY29uc3QgTlVNQllURVMgPSBjb25zdGFudHMuTlVNQllURVNcbmNvbnN0IFNISUZUMzIgPSBjb25zdGFudHMuU0hJRlQzMlxuY29uc3QgU1lNUyA9IGNvbnN0YW50cy5TWU1TXG5jb25zdCBUQUcgPSBjb25zdGFudHMuVEFHXG5jb25zdCBIQUxGID0gKGNvbnN0YW50cy5NVC5TSU1QTEVfRkxPQVQgPDwgNSkgfCBjb25zdGFudHMuTlVNQllURVMuVFdPXG5jb25zdCBGTE9BVCA9IChjb25zdGFudHMuTVQuU0lNUExFX0ZMT0FUIDw8IDUpIHwgY29uc3RhbnRzLk5VTUJZVEVTLkZPVVJcbmNvbnN0IERPVUJMRSA9IChjb25zdGFudHMuTVQuU0lNUExFX0ZMT0FUIDw8IDUpIHwgY29uc3RhbnRzLk5VTUJZVEVTLkVJR0hUXG5jb25zdCBUUlVFID0gKGNvbnN0YW50cy5NVC5TSU1QTEVfRkxPQVQgPDwgNSkgfCBjb25zdGFudHMuU0lNUExFLlRSVUVcbmNvbnN0IEZBTFNFID0gKGNvbnN0YW50cy5NVC5TSU1QTEVfRkxPQVQgPDwgNSkgfCBjb25zdGFudHMuU0lNUExFLkZBTFNFXG5jb25zdCBVTkRFRklORUQgPSAoY29uc3RhbnRzLk1ULlNJTVBMRV9GTE9BVCA8PCA1KSB8IGNvbnN0YW50cy5TSU1QTEUuVU5ERUZJTkVEXG5jb25zdCBOVUxMID0gKGNvbnN0YW50cy5NVC5TSU1QTEVfRkxPQVQgPDwgNSkgfCBjb25zdGFudHMuU0lNUExFLk5VTExcblxuY29uc3QgTUFYSU5UX0JOID0gbmV3IEJpZ251bWJlcignMHgyMDAwMDAwMDAwMDAwMCcpXG5jb25zdCBCVUZfTkFOID0gQnVmZmVyLmZyb20oJ2Y5N2UwMCcsICdoZXgnKVxuY29uc3QgQlVGX0lORl9ORUcgPSBCdWZmZXIuZnJvbSgnZjlmYzAwJywgJ2hleCcpXG5jb25zdCBCVUZfSU5GX1BPUyA9IEJ1ZmZlci5mcm9tKCdmOTdjMDAnLCAnaGV4JylcblxuZnVuY3Rpb24gdG9UeXBlIChvYmopIHtcbiAgLy8gW29iamVjdCBUeXBlXVxuICAvLyAtLS0tLS0tLTgtLS0xXG4gIHJldHVybiAoe30pLnRvU3RyaW5nLmNhbGwob2JqKS5zbGljZSg4LCAtMSlcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gSmF2YVNjcmlwdCB2YWx1ZXMgaW50byBDQk9SIGJ5dGVzXG4gKlxuICovXG5jbGFzcyBFbmNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV1cbiAgICogQHBhcmFtIHtmdW5jdGlvbihCdWZmZXIpfSBvcHRpb25zLnN0cmVhbVxuICAgKi9cbiAgY29uc3RydWN0b3IgKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gICAgdGhpcy5zdHJlYW1pbmcgPSB0eXBlb2Ygb3B0aW9ucy5zdHJlYW0gPT09ICdmdW5jdGlvbidcbiAgICB0aGlzLm9uRGF0YSA9IG9wdGlvbnMuc3RyZWFtXG5cbiAgICB0aGlzLnNlbWFudGljVHlwZXMgPSBbXG4gICAgICBbVVJMLCB0aGlzLl9wdXNoVXJsXSxcbiAgICAgIFtCaWdudW1iZXIsIHRoaXMuX3B1c2hCaWdOdW1iZXJdXG4gICAgXVxuXG4gICAgY29uc3QgYWRkVHlwZXMgPSBvcHRpb25zLmdlblR5cGVzIHx8IFtdXG4gICAgY29uc3QgbGVuID0gYWRkVHlwZXMubGVuZ3RoXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGhpcy5hZGRTZW1hbnRpY1R5cGUoXG4gICAgICAgIGFkZFR5cGVzW2ldWzBdLFxuICAgICAgICBhZGRUeXBlc1tpXVsxXVxuICAgICAgKVxuICAgIH1cblxuICAgIHRoaXMuX3Jlc2V0KClcbiAgfVxuXG4gIGFkZFNlbWFudGljVHlwZSAodHlwZSwgZnVuKSB7XG4gICAgY29uc3QgbGVuID0gdGhpcy5zZW1hbnRpY1R5cGVzLmxlbmd0aFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IHR5cCA9IHRoaXMuc2VtYW50aWNUeXBlc1tpXVswXVxuICAgICAgaWYgKHR5cCA9PT0gdHlwZSkge1xuICAgICAgICBjb25zdCBvbGQgPSB0aGlzLnNlbWFudGljVHlwZXNbaV1bMV1cbiAgICAgICAgdGhpcy5zZW1hbnRpY1R5cGVzW2ldWzFdID0gZnVuXG4gICAgICAgIHJldHVybiBvbGRcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zZW1hbnRpY1R5cGVzLnB1c2goW3R5cGUsIGZ1bl0pXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHB1c2ggKHZhbCkge1xuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHRoaXMucmVzdWx0W3RoaXMub2Zmc2V0XSA9IHZhbFxuICAgIHRoaXMucmVzdWx0TWV0aG9kW3RoaXMub2Zmc2V0XSA9IDBcbiAgICB0aGlzLnJlc3VsdExlbmd0aFt0aGlzLm9mZnNldF0gPSB2YWwubGVuZ3RoXG4gICAgdGhpcy5vZmZzZXQrK1xuXG4gICAgaWYgKHRoaXMuc3RyZWFtaW5nKSB7XG4gICAgICB0aGlzLm9uRGF0YSh0aGlzLmZpbmFsaXplKCkpXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHB1c2hXcml0ZSAodmFsLCBtZXRob2QsIGxlbikge1xuICAgIHRoaXMucmVzdWx0W3RoaXMub2Zmc2V0XSA9IHZhbFxuICAgIHRoaXMucmVzdWx0TWV0aG9kW3RoaXMub2Zmc2V0XSA9IG1ldGhvZFxuICAgIHRoaXMucmVzdWx0TGVuZ3RoW3RoaXMub2Zmc2V0XSA9IGxlblxuICAgIHRoaXMub2Zmc2V0KytcblxuICAgIGlmICh0aGlzLnN0cmVhbWluZykge1xuICAgICAgdGhpcy5vbkRhdGEodGhpcy5maW5hbGl6ZSgpKVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBfcHVzaFVJbnQ4ICh2YWwpIHtcbiAgICByZXR1cm4gdGhpcy5wdXNoV3JpdGUodmFsLCAxLCAxKVxuICB9XG5cbiAgX3B1c2hVSW50MTZCRSAodmFsKSB7XG4gICAgcmV0dXJuIHRoaXMucHVzaFdyaXRlKHZhbCwgMiwgMilcbiAgfVxuXG4gIF9wdXNoVUludDMyQkUgKHZhbCkge1xuICAgIHJldHVybiB0aGlzLnB1c2hXcml0ZSh2YWwsIDMsIDQpXG4gIH1cblxuICBfcHVzaERvdWJsZUJFICh2YWwpIHtcbiAgICByZXR1cm4gdGhpcy5wdXNoV3JpdGUodmFsLCA0LCA4KVxuICB9XG5cbiAgX3B1c2hOYU4gKCkge1xuICAgIHJldHVybiB0aGlzLnB1c2goQlVGX05BTilcbiAgfVxuXG4gIF9wdXNoSW5maW5pdHkgKG9iaikge1xuICAgIGNvbnN0IGhhbGYgPSAob2JqIDwgMCkgPyBCVUZfSU5GX05FRyA6IEJVRl9JTkZfUE9TXG4gICAgcmV0dXJuIHRoaXMucHVzaChoYWxmKVxuICB9XG5cbiAgX3B1c2hGbG9hdCAob2JqKSB7XG4gICAgY29uc3QgYjIgPSBCdWZmZXIuYWxsb2NVbnNhZmUoMilcblxuICAgIGlmICh1dGlscy53cml0ZUhhbGYoYjIsIG9iaikpIHtcbiAgICAgIGlmICh1dGlscy5wYXJzZUhhbGYoYjIpID09PSBvYmopIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hVSW50OChIQUxGKSAmJiB0aGlzLnB1c2goYjIpXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYjQgPSBCdWZmZXIuYWxsb2NVbnNhZmUoNClcbiAgICBiNC53cml0ZUZsb2F0QkUob2JqLCAwKVxuICAgIGlmIChiNC5yZWFkRmxvYXRCRSgwKSA9PT0gb2JqKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaFVJbnQ4KEZMT0FUKSAmJiB0aGlzLnB1c2goYjQpXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3B1c2hVSW50OChET1VCTEUpICYmIHRoaXMuX3B1c2hEb3VibGVCRShvYmopXG4gIH1cblxuICBfcHVzaEludCAob2JqLCBtdCwgb3JpZykge1xuICAgIGNvbnN0IG0gPSBtdCA8PCA1XG4gICAgaWYgKG9iaiA8IDI0KSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaFVJbnQ4KG0gfCBvYmopXG4gICAgfVxuXG4gICAgaWYgKG9iaiA8PSAweGZmKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaFVJbnQ4KG0gfCBOVU1CWVRFUy5PTkUpICYmIHRoaXMuX3B1c2hVSW50OChvYmopXG4gICAgfVxuXG4gICAgaWYgKG9iaiA8PSAweGZmZmYpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoVUludDgobSB8IE5VTUJZVEVTLlRXTykgJiYgdGhpcy5fcHVzaFVJbnQxNkJFKG9iailcbiAgICB9XG5cbiAgICBpZiAob2JqIDw9IDB4ZmZmZmZmZmYpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoVUludDgobSB8IE5VTUJZVEVTLkZPVVIpICYmIHRoaXMuX3B1c2hVSW50MzJCRShvYmopXG4gICAgfVxuXG4gICAgaWYgKG9iaiA8PSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUikge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hVSW50OChtIHwgTlVNQllURVMuRUlHSFQpICYmXG4gICAgICAgIHRoaXMuX3B1c2hVSW50MzJCRShNYXRoLmZsb29yKG9iaiAvIFNISUZUMzIpKSAmJlxuICAgICAgICB0aGlzLl9wdXNoVUludDMyQkUob2JqICUgU0hJRlQzMilcbiAgICB9XG5cbiAgICBpZiAobXQgPT09IE1ULk5FR19JTlQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoRmxvYXQob3JpZylcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcHVzaEZsb2F0KG9iailcbiAgfVxuXG4gIF9wdXNoSW50TnVtIChvYmopIHtcbiAgICBpZiAob2JqIDwgMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hJbnQoLW9iaiAtIDEsIE1ULk5FR19JTlQsIG9iailcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hJbnQob2JqLCBNVC5QT1NfSU5UKVxuICAgIH1cbiAgfVxuXG4gIF9wdXNoTnVtYmVyIChvYmopIHtcbiAgICBzd2l0Y2ggKGZhbHNlKSB7XG4gICAgICBjYXNlIChvYmogPT09IG9iaik6IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hOYU4ob2JqKVxuICAgICAgY2FzZSBpc0Zpbml0ZShvYmopOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaEluZmluaXR5KG9iailcbiAgICAgIGNhc2UgKChvYmogJSAxKSAhPT0gMCk6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoSW50TnVtKG9iailcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoRmxvYXQob2JqKVxuICAgIH1cbiAgfVxuXG4gIF9wdXNoU3RyaW5nIChvYmopIHtcbiAgICBjb25zdCBsZW4gPSBCdWZmZXIuYnl0ZUxlbmd0aChvYmosICd1dGY4JylcbiAgICByZXR1cm4gdGhpcy5fcHVzaEludChsZW4sIE1ULlVURjhfU1RSSU5HKSAmJiB0aGlzLnB1c2hXcml0ZShvYmosIDUsIGxlbilcbiAgfVxuXG4gIF9wdXNoQm9vbGVhbiAob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX3B1c2hVSW50OChvYmogPyBUUlVFIDogRkFMU0UpXG4gIH1cblxuICBfcHVzaFVuZGVmaW5lZCAob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX3B1c2hVSW50OChVTkRFRklORUQpXG4gIH1cblxuICBfcHVzaEFycmF5IChnZW4sIG9iaikge1xuICAgIGNvbnN0IGxlbiA9IG9iai5sZW5ndGhcbiAgICBpZiAoIWdlbi5fcHVzaEludChsZW4sIE1ULkFSUkFZKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgIGlmICghZ2VuLnB1c2hBbnkob2JqW2pdKSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIF9wdXNoVGFnICh0YWcpIHtcbiAgICByZXR1cm4gdGhpcy5fcHVzaEludCh0YWcsIE1ULlRBRylcbiAgfVxuXG4gIF9wdXNoRGF0ZSAoZ2VuLCBvYmopIHtcbiAgICAvLyBSb3VuZCBkYXRlLCB0byBnZXQgc2Vjb25kcyBzaW5jZSAxOTcwLTAxLTAxIDAwOjAwOjAwIGFzIGRlZmluZWQgaW5cbiAgICAvLyBTZWMuIDIuNC4xIGFuZCBnZXQgYSBwb3NzaWJseSBtb3JlIGNvbXBhY3QgZW5jb2RpbmcuIE5vdGUgdGhhdCBpdCBpc1xuICAgIC8vIHN0aWxsIGFsbG93ZWQgdG8gZW5jb2RlIGZyYWN0aW9ucyBvZiBzZWNvbmRzIHdoaWNoIGNhbiBiZSBhY2hpZXZlZCBieVxuICAgIC8vIGNoYW5naW5nIG92ZXJ3cml0aW5nIHRoZSBlbmNvZGUgZnVuY3Rpb24gZm9yIERhdGUgb2JqZWN0cy5cbiAgICByZXR1cm4gZ2VuLl9wdXNoVGFnKFRBRy5EQVRFX0VQT0NIKSAmJiBnZW4ucHVzaEFueShNYXRoLnJvdW5kKG9iaiAvIDEwMDApKVxuICB9XG5cbiAgX3B1c2hCdWZmZXIgKGdlbiwgb2JqKSB7XG4gICAgcmV0dXJuIGdlbi5fcHVzaEludChvYmoubGVuZ3RoLCBNVC5CWVRFX1NUUklORykgJiYgZ2VuLnB1c2gob2JqKVxuICB9XG5cbiAgX3B1c2hOb0ZpbHRlciAoZ2VuLCBvYmopIHtcbiAgICByZXR1cm4gZ2VuLl9wdXNoQnVmZmVyKGdlbiwgb2JqLnNsaWNlKCkpXG4gIH1cblxuICBfcHVzaFJlZ2V4cCAoZ2VuLCBvYmopIHtcbiAgICByZXR1cm4gZ2VuLl9wdXNoVGFnKFRBRy5SRUdFWFApICYmIGdlbi5wdXNoQW55KG9iai5zb3VyY2UpXG4gIH1cblxuICBfcHVzaFNldCAoZ2VuLCBvYmopIHtcbiAgICBpZiAoIWdlbi5fcHVzaEludChvYmouc2l6ZSwgTVQuQVJSQVkpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgZm9yIChsZXQgeCBvZiBvYmopIHtcbiAgICAgIGlmICghZ2VuLnB1c2hBbnkoeCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBfcHVzaFVybCAoZ2VuLCBvYmopIHtcbiAgICByZXR1cm4gZ2VuLl9wdXNoVGFnKFRBRy5VUkkpICYmIGdlbi5wdXNoQW55KG9iai5mb3JtYXQoKSlcbiAgfVxuXG4gIF9wdXNoQmlnaW50IChvYmopIHtcbiAgICBsZXQgdGFnID0gVEFHLlBPU19CSUdJTlRcbiAgICBpZiAob2JqLmlzTmVnYXRpdmUoKSkge1xuICAgICAgb2JqID0gb2JqLm5lZ2F0ZWQoKS5taW51cygxKVxuICAgICAgdGFnID0gVEFHLk5FR19CSUdJTlRcbiAgICB9XG4gICAgbGV0IHN0ciA9IG9iai50b1N0cmluZygxNilcbiAgICBpZiAoc3RyLmxlbmd0aCAlIDIpIHtcbiAgICAgIHN0ciA9ICcwJyArIHN0clxuICAgIH1cbiAgICBjb25zdCBidWYgPSBCdWZmZXIuZnJvbShzdHIsICdoZXgnKVxuICAgIHJldHVybiB0aGlzLl9wdXNoVGFnKHRhZykgJiYgdGhpcy5fcHVzaEJ1ZmZlcih0aGlzLCBidWYpXG4gIH1cblxuICBfcHVzaEJpZ051bWJlciAoZ2VuLCBvYmopIHtcbiAgICBpZiAob2JqLmlzTmFOKCkpIHtcbiAgICAgIHJldHVybiBnZW4uX3B1c2hOYU4oKVxuICAgIH1cbiAgICBpZiAoIW9iai5pc0Zpbml0ZSgpKSB7XG4gICAgICByZXR1cm4gZ2VuLl9wdXNoSW5maW5pdHkob2JqLmlzTmVnYXRpdmUoKSA/IC1JbmZpbml0eSA6IEluZmluaXR5KVxuICAgIH1cbiAgICBpZiAob2JqLmlzSW50ZWdlcigpKSB7XG4gICAgICByZXR1cm4gZ2VuLl9wdXNoQmlnaW50KG9iailcbiAgICB9XG4gICAgaWYgKCEoZ2VuLl9wdXNoVGFnKFRBRy5ERUNJTUFMX0ZSQUMpICYmXG4gICAgICBnZW4uX3B1c2hJbnQoMiwgTVQuQVJSQVkpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgY29uc3QgZGVjID0gb2JqLmRlY2ltYWxQbGFjZXMoKVxuICAgIGNvbnN0IHNsaWRlID0gb2JqLm11bHRpcGxpZWRCeShuZXcgQmlnbnVtYmVyKDEwKS5wb3coZGVjKSlcbiAgICBpZiAoIWdlbi5fcHVzaEludE51bSgtZGVjKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChzbGlkZS5hYnMoKS5pc0xlc3NUaGFuKE1BWElOVF9CTikpIHtcbiAgICAgIHJldHVybiBnZW4uX3B1c2hJbnROdW0oc2xpZGUudG9OdW1iZXIoKSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGdlbi5fcHVzaEJpZ2ludChzbGlkZSlcbiAgICB9XG4gIH1cblxuICBfcHVzaE1hcCAoZ2VuLCBvYmopIHtcbiAgICBpZiAoIWdlbi5fcHVzaEludChvYmouc2l6ZSwgTVQuTUFQKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3B1c2hSYXdNYXAoXG4gICAgICBvYmouc2l6ZSxcbiAgICAgIEFycmF5LmZyb20ob2JqKVxuICAgIClcbiAgfVxuXG4gIF9wdXNoT2JqZWN0IChvYmopIHtcbiAgICBpZiAoIW9iaikge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hVSW50OChOVUxMKVxuICAgIH1cblxuICAgIHZhciBsZW4gPSB0aGlzLnNlbWFudGljVHlwZXMubGVuZ3RoXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIHRoaXMuc2VtYW50aWNUeXBlc1tpXVswXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZW1hbnRpY1R5cGVzW2ldWzFdLmNhbGwob2JqLCB0aGlzLCBvYmopXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGYgPSBvYmouZW5jb2RlQ0JPUlxuICAgIGlmICh0eXBlb2YgZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIGYuY2FsbChvYmosIHRoaXMpXG4gICAgfVxuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopXG4gICAgdmFyIGtleUxlbmd0aCA9IGtleXMubGVuZ3RoXG4gICAgaWYgKCF0aGlzLl9wdXNoSW50KGtleUxlbmd0aCwgTVQuTUFQKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3B1c2hSYXdNYXAoXG4gICAgICBrZXlMZW5ndGgsXG4gICAgICBrZXlzLm1hcCgoaykgPT4gW2ssIG9ialtrXV0pXG4gICAgKVxuICB9XG5cbiAgX3B1c2hSYXdNYXAgKGxlbiwgbWFwKSB7XG4gICAgLy8gU29ydCBrZXlzIGZvciBjYW5vbmNpYWxpemF0aW9uXG4gICAgLy8gMS4gZW5jb2RlIGtleVxuICAgIC8vIDIuIHNob3J0ZXIga2V5IGNvbWVzIGJlZm9yZSBsb25nZXIga2V5XG4gICAgLy8gMy4gc2FtZSBsZW5ndGgga2V5cyBhcmUgc29ydGVkIHdpdGggbG93ZXJcbiAgICAvLyAgICBieXRlIHZhbHVlIGJlZm9yZSBoaWdoZXJcblxuICAgIG1hcCA9IG1hcC5tYXAoZnVuY3Rpb24gKGEpIHtcbiAgICAgIGFbMF0gPSBFbmNvZGVyLmVuY29kZShhWzBdKVxuICAgICAgcmV0dXJuIGFcbiAgICB9KS5zb3J0KHV0aWxzLmtleVNvcnRlcilcblxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgIGlmICghdGhpcy5wdXNoKG1hcFtqXVswXSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5wdXNoQW55KG1hcFtqXVsxXSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGlhcyBmb3IgYC5wdXNoQW55YFxuICAgKlxuICAgKiBAcGFyYW0geyp9IG9ialxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBvbiBzdWNjZXNzXG4gICAqL1xuICB3cml0ZSAob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMucHVzaEFueShvYmopXG4gIH1cblxuICAvKipcbiAgICogUHVzaCBhbnkgc3VwcG9ydGVkIHR5cGUgb250byB0aGUgZW5jb2RlZCBzdHJlYW1cbiAgICpcbiAgICogQHBhcmFtIHthbnl9IG9ialxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBvbiBzdWNjZXNzXG4gICAqL1xuICBwdXNoQW55IChvYmopIHtcbiAgICB2YXIgdHlwID0gdG9UeXBlKG9iailcblxuICAgIHN3aXRjaCAodHlwKSB7XG4gICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaE51bWJlcihvYmopXG4gICAgICBjYXNlICdTdHJpbmcnOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaFN0cmluZyhvYmopXG4gICAgICBjYXNlICdCb29sZWFuJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hCb29sZWFuKG9iailcbiAgICAgIGNhc2UgJ09iamVjdCc6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoT2JqZWN0KG9iailcbiAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hBcnJheSh0aGlzLCBvYmopXG4gICAgICBjYXNlICdVaW50OEFycmF5JzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hCdWZmZXIodGhpcywgQnVmZmVyLmlzQnVmZmVyKG9iaikgPyBvYmogOiBCdWZmZXIuZnJvbShvYmopKVxuICAgICAgY2FzZSAnTnVsbCc6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoVUludDgoTlVMTClcbiAgICAgIGNhc2UgJ1VuZGVmaW5lZCc6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoVW5kZWZpbmVkKG9iailcbiAgICAgIGNhc2UgJ01hcCc6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoTWFwKHRoaXMsIG9iailcbiAgICAgIGNhc2UgJ1NldCc6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoU2V0KHRoaXMsIG9iailcbiAgICAgIGNhc2UgJ1VSTCc6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoVXJsKHRoaXMsIG9iailcbiAgICAgIGNhc2UgJ0JpZ051bWJlcic6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoQmlnTnVtYmVyKHRoaXMsIG9iailcbiAgICAgIGNhc2UgJ0RhdGUnOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaERhdGUodGhpcywgb2JqKVxuICAgICAgY2FzZSAnUmVnRXhwJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hSZWdleHAodGhpcywgb2JqKVxuICAgICAgY2FzZSAnU3ltYm9sJzpcbiAgICAgICAgc3dpdGNoIChvYmopIHtcbiAgICAgICAgICBjYXNlIFNZTVMuTlVMTDpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wdXNoT2JqZWN0KG51bGwpXG4gICAgICAgICAgY2FzZSBTWU1TLlVOREVGSU5FRDpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wdXNoVW5kZWZpbmVkKHZvaWQgMClcbiAgICAgICAgICAvLyBUT0RPOiBBZGQgcGx1Z2dhYmxlIHN1cHBvcnQgZm9yIG90aGVyIHN5bWJvbHNcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIHN5bWJvbDogJyArIG9iai50b1N0cmluZygpKVxuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gdHlwZTogJyArIHR5cGVvZiBvYmogKyAnLCAnICsgKG9iaiA/IG9iai50b1N0cmluZygpIDogJycpKVxuICAgIH1cbiAgfVxuXG4gIGZpbmFsaXplICgpIHtcbiAgICBpZiAodGhpcy5vZmZzZXQgPT09IDApIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMucmVzdWx0XG4gICAgdmFyIHJlc3VsdExlbmd0aCA9IHRoaXMucmVzdWx0TGVuZ3RoXG4gICAgdmFyIHJlc3VsdE1ldGhvZCA9IHRoaXMucmVzdWx0TWV0aG9kXG4gICAgdmFyIG9mZnNldCA9IHRoaXMub2Zmc2V0XG5cbiAgICAvLyBEZXRlcm1pbmUgdGhlIHNpemUgb2YgdGhlIGJ1ZmZlclxuICAgIHZhciBzaXplID0gMFxuICAgIHZhciBpID0gMFxuXG4gICAgZm9yICg7IGkgPCBvZmZzZXQ7IGkrKykge1xuICAgICAgc2l6ZSArPSByZXN1bHRMZW5ndGhbaV1cbiAgICB9XG5cbiAgICB2YXIgcmVzID0gQnVmZmVyLmFsbG9jVW5zYWZlKHNpemUpXG4gICAgdmFyIGluZGV4ID0gMFxuICAgIHZhciBsZW5ndGggPSAwXG5cbiAgICAvLyBXcml0ZSB0aGUgY29udGVudCBpbnRvIHRoZSByZXN1bHQgYnVmZmVyXG4gICAgZm9yIChpID0gMDsgaSA8IG9mZnNldDsgaSsrKSB7XG4gICAgICBsZW5ndGggPSByZXN1bHRMZW5ndGhbaV1cblxuICAgICAgc3dpdGNoIChyZXN1bHRNZXRob2RbaV0pIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgIHJlc3VsdFtpXS5jb3B5KHJlcywgaW5kZXgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHJlcy53cml0ZVVJbnQ4KHJlc3VsdFtpXSwgaW5kZXgsIHRydWUpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHJlcy53cml0ZVVJbnQxNkJFKHJlc3VsdFtpXSwgaW5kZXgsIHRydWUpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHJlcy53cml0ZVVJbnQzMkJFKHJlc3VsdFtpXSwgaW5kZXgsIHRydWUpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHJlcy53cml0ZURvdWJsZUJFKHJlc3VsdFtpXSwgaW5kZXgsIHRydWUpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIHJlcy53cml0ZShyZXN1bHRbaV0sIGluZGV4LCBsZW5ndGgsICd1dGY4JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rb3duIG1ldGhvZCcpXG4gICAgICB9XG5cbiAgICAgIGluZGV4ICs9IGxlbmd0aFxuICAgIH1cblxuICAgIHZhciB0bXAgPSByZXNcblxuICAgIHRoaXMuX3Jlc2V0KClcblxuICAgIHJldHVybiB0bXBcbiAgfVxuXG4gIF9yZXNldCAoKSB7XG4gICAgdGhpcy5yZXN1bHQgPSBbXVxuICAgIHRoaXMucmVzdWx0TWV0aG9kID0gW11cbiAgICB0aGlzLnJlc3VsdExlbmd0aCA9IFtdXG4gICAgdGhpcy5vZmZzZXQgPSAwXG4gIH1cblxuICAvKipcbiAgICogRW5jb2RlIHRoZSBnaXZlbiB2YWx1ZVxuICAgKiBAcGFyYW0geyp9IG9cbiAgICogQHJldHVybnMge0J1ZmZlcn1cbiAgICovXG4gIHN0YXRpYyBlbmNvZGUgKG8pIHtcbiAgICBjb25zdCBlbmMgPSBuZXcgRW5jb2RlcigpXG4gICAgY29uc3QgcmV0ID0gZW5jLnB1c2hBbnkobylcbiAgICBpZiAoIXJldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZW5jb2RlIGlucHV0JylcbiAgICB9XG5cbiAgICByZXR1cm4gZW5jLmZpbmFsaXplKClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVuY29kZXJcbiIsIid1c2Ugc3RyaWN0J1xuXG4vLyBleHBvcnRzLkNvbW1lbnRlZCA9IHJlcXVpcmUoJy4vY29tbWVudGVkJylcbmV4cG9ydHMuRGlhZ25vc2UgPSByZXF1aXJlKCcuL2RpYWdub3NlJylcbmV4cG9ydHMuRGVjb2RlciA9IHJlcXVpcmUoJy4vZGVjb2RlcicpXG5leHBvcnRzLkVuY29kZXIgPSByZXF1aXJlKCcuL2VuY29kZXInKVxuZXhwb3J0cy5TaW1wbGUgPSByZXF1aXJlKCcuL3NpbXBsZScpXG5leHBvcnRzLlRhZ2dlZCA9IHJlcXVpcmUoJy4vdGFnZ2VkJylcblxuLy8gZXhwb3J0cy5jb21tZW50ID0gZXhwb3J0cy5Db21tZW50ZWQuY29tbWVudFxuZXhwb3J0cy5kZWNvZGVBbGwgPSBleHBvcnRzLkRlY29kZXIuZGVjb2RlQWxsXG5leHBvcnRzLmRlY29kZUZpcnN0ID0gZXhwb3J0cy5EZWNvZGVyLmRlY29kZUZpcnN0XG5leHBvcnRzLmRpYWdub3NlID0gZXhwb3J0cy5EaWFnbm9zZS5kaWFnbm9zZVxuZXhwb3J0cy5lbmNvZGUgPSBleHBvcnRzLkVuY29kZXIuZW5jb2RlXG5leHBvcnRzLmRlY29kZSA9IGV4cG9ydHMuRGVjb2Rlci5kZWNvZGVcblxuZXhwb3J0cy5sZXZlbGRiID0ge1xuICBkZWNvZGU6IGV4cG9ydHMuRGVjb2Rlci5kZWNvZGVBbGwsXG4gIGVuY29kZTogZXhwb3J0cy5FbmNvZGVyLmVuY29kZSxcbiAgYnVmZmVyOiB0cnVlLFxuICBuYW1lOiAnY2Jvcidcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpXG5jb25zdCBNVCA9IGNvbnN0YW50cy5NVFxuY29uc3QgU0lNUExFID0gY29uc3RhbnRzLlNJTVBMRVxuY29uc3QgU1lNUyA9IGNvbnN0YW50cy5TWU1TXG5cbi8qKlxuICogQSBDQk9SIFNpbXBsZSBWYWx1ZSB0aGF0IGRvZXMgbm90IG1hcCBvbnRvIGEga25vd24gY29uc3RhbnQuXG4gKi9cbmNsYXNzIFNpbXBsZSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIFNpbXBsZS5cbiAgICpcbiAgICogQHBhcmFtIHtpbnRlZ2VyfSB2YWx1ZSAtIHRoZSBzaW1wbGUgdmFsdWUncyBpbnRlZ2VyIHZhbHVlXG4gICAqL1xuICBjb25zdHJ1Y3RvciAodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnbnVtYmVyJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFNpbXBsZSB0eXBlOiAnICsgKHR5cGVvZiB2YWx1ZSkpXG4gICAgfVxuICAgIGlmICgodmFsdWUgPCAwKSB8fCAodmFsdWUgPiAyNTUpIHx8ICgodmFsdWUgfCAwKSAhPT0gdmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3ZhbHVlIG11c3QgYmUgYSBzbWFsbCBwb3NpdGl2ZSBpbnRlZ2VyOiAnICsgdmFsdWUpXG4gICAgfVxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICB9XG5cbiAgLyoqXG4gICAqIERlYnVnIHN0cmluZyBmb3Igc2ltcGxlIHZhbHVlXG4gICAqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IHNpbXBsZSh2YWx1ZSlcbiAgICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ3NpbXBsZSgnICsgdGhpcy52YWx1ZSArICcpJ1xuICB9XG5cbiAgLyoqXG4gICAqIERlYnVnIHN0cmluZyBmb3Igc2ltcGxlIHZhbHVlXG4gICAqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IHNpbXBsZSh2YWx1ZSlcbiAgICovXG4gIGluc3BlY3QgKCkge1xuICAgIHJldHVybiAnc2ltcGxlKCcgKyB0aGlzLnZhbHVlICsgJyknXG4gIH1cblxuICAvKipcbiAgICogUHVzaCB0aGUgc2ltcGxlIHZhbHVlIG9udG8gdGhlIENCT1Igc3RyZWFtXG4gICAqXG4gICAqIEBwYXJhbSB7Y2Jvci5FbmNvZGVyfSBnZW4gVGhlIGdlbmVyYXRvciB0byBwdXNoIG9udG9cbiAgICogQHJldHVybnMge251bWJlcn1cbiAgICovXG4gIGVuY29kZUNCT1IgKGdlbikge1xuICAgIHJldHVybiBnZW4uX3B1c2hJbnQodGhpcy52YWx1ZSwgTVQuU0lNUExFX0ZMT0FUKVxuICB9XG5cbiAgLyoqXG4gICAqIElzIHRoZSBnaXZlbiBvYmplY3QgYSBTaW1wbGU/XG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBvYmogLSBvYmplY3QgdG8gdGVzdFxuICAgKiBAcmV0dXJucyB7Ym9vbH0gLSBpcyBpdCBTaW1wbGU/XG4gICAqL1xuICBzdGF0aWMgaXNTaW1wbGUgKG9iaikge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBTaW1wbGVcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNvZGUgZnJvbSB0aGUgQ0JPUiBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGludG8gYSBKYXZhU2NyaXB0IHZhbHVlLlxuICAgKiBJZiB0aGUgQ0JPUiBpdGVtIGhhcyBubyBwYXJlbnQsIHJldHVybiBhIFwic2FmZVwiIHN5bWJvbCBpbnN0ZWFkIG9mXG4gICAqIGBudWxsYCBvciBgdW5kZWZpbmVkYCwgc28gdGhhdCB0aGUgdmFsdWUgY2FuIGJlIHBhc3NlZCB0aHJvdWdoIGFcbiAgICogc3RyZWFtIGluIG9iamVjdCBtb2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gdmFsIC0gdGhlIENCT1IgYWRkaXRpb25hbCBpbmZvIHRvIGNvbnZlcnRcbiAgICogQHBhcmFtIHtib29sfSBoYXNQYXJlbnQgLSBEb2VzIHRoZSBDQk9SIGl0ZW0gaGF2ZSBhIHBhcmVudD9cbiAgICogQHJldHVybnMgeyhudWxsfHVuZGVmaW5lZHxCb29sZWFufFN5bWJvbCl9IC0gdGhlIGRlY29kZWQgdmFsdWVcbiAgICovXG4gIHN0YXRpYyBkZWNvZGUgKHZhbCwgaGFzUGFyZW50KSB7XG4gICAgaWYgKGhhc1BhcmVudCA9PSBudWxsKSB7XG4gICAgICBoYXNQYXJlbnQgPSB0cnVlXG4gICAgfVxuICAgIHN3aXRjaCAodmFsKSB7XG4gICAgICBjYXNlIFNJTVBMRS5GQUxTRTpcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICBjYXNlIFNJTVBMRS5UUlVFOlxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgY2FzZSBTSU1QTEUuTlVMTDpcbiAgICAgICAgaWYgKGhhc1BhcmVudCkge1xuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFNZTVMuTlVMTFxuICAgICAgICB9XG4gICAgICBjYXNlIFNJTVBMRS5VTkRFRklORUQ6XG4gICAgICAgIGlmIChoYXNQYXJlbnQpIHtcbiAgICAgICAgICByZXR1cm4gdm9pZCAwXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFNZTVMuVU5ERUZJTkVEXG4gICAgICAgIH1cbiAgICAgIGNhc2UgLTE6XG4gICAgICAgIGlmICghaGFzUGFyZW50KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEJSRUFLJylcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1lNUy5CUkVBS1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG5ldyBTaW1wbGUodmFsKVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXBsZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbi8qKlxuICogQSBDQk9SIHRhZ2dlZCBpdGVtLCB3aGVyZSB0aGUgdGFnIGRvZXMgbm90IGhhdmUgc2VtYW50aWNzIHNwZWNpZmllZCBhdCB0aGVcbiAqIG1vbWVudCwgb3IgdGhvc2Ugc2VtYW50aWNzIHRocmV3IGFuIGVycm9yIGR1cmluZyBwYXJzaW5nLiBUeXBpY2FsbHkgdGhpcyB3aWxsXG4gKiBiZSBhbiBleHRlbnNpb24gcG9pbnQgeW91J3JlIG5vdCB5ZXQgZXhwZWN0aW5nLlxuICovXG5jbGFzcyBUYWdnZWQge1xuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBUYWdnZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0YWcgLSB0aGUgbnVtYmVyIG9mIHRoZSB0YWdcbiAgICogQHBhcmFtIHthbnl9IHZhbHVlIC0gdGhlIHZhbHVlIGluc2lkZSB0aGUgdGFnXG4gICAqIEBwYXJhbSB7RXJyb3J9IGVyciAtIHRoZSBlcnJvciB0aGF0IHdhcyB0aHJvd24gcGFyc2luZyB0aGUgdGFnLCBvciBudWxsXG4gICAqL1xuICBjb25zdHJ1Y3RvciAodGFnLCB2YWx1ZSwgZXJyKSB7XG4gICAgdGhpcy50YWcgPSB0YWdcbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLmVyciA9IGVyclxuICAgIGlmICh0eXBlb2YgdGhpcy50YWcgIT09ICdudW1iZXInKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdGFnIHR5cGUgKCcgKyAodHlwZW9mIHRoaXMudGFnKSArICcpJylcbiAgICB9XG4gICAgaWYgKCh0aGlzLnRhZyA8IDApIHx8ICgodGhpcy50YWcgfCAwKSAhPT0gdGhpcy50YWcpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RhZyBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcjogJyArIHRoaXMudGFnKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRvIGEgU3RyaW5nXG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyBvZiB0aGUgZm9ybSAnMSgyKSdcbiAgICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gYCR7dGhpcy50YWd9KCR7SlNPTi5zdHJpbmdpZnkodGhpcy52YWx1ZSl9KWBcbiAgfVxuXG4gIC8qKlxuICAgKiBQdXNoIHRoZSBzaW1wbGUgdmFsdWUgb250byB0aGUgQ0JPUiBzdHJlYW1cbiAgICpcbiAgICogQHBhcmFtIHtjYm9yLkVuY29kZXJ9IGdlbiBUaGUgZ2VuZXJhdG9yIHRvIHB1c2ggb250b1xuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgKi9cbiAgZW5jb2RlQ0JPUiAoZ2VuKSB7XG4gICAgZ2VuLl9wdXNoVGFnKHRoaXMudGFnKVxuICAgIHJldHVybiBnZW4ucHVzaEFueSh0aGlzLnZhbHVlKVxuICB9XG5cbiAgLyoqXG4gICAqIElmIHdlIGhhdmUgYSBjb252ZXJ0ZXIgZm9yIHRoaXMgdHlwZSwgZG8gdGhlIGNvbnZlcnNpb24uICBTb21lIGNvbnZlcnRlcnNcbiAgICogYXJlIGJ1aWx0LWluLiAgQWRkaXRpb25hbCBvbmVzIGNhbiBiZSBwYXNzZWQgaW4uICBJZiB5b3Ugd2FudCB0byByZW1vdmVcbiAgICogYSBidWlsdC1pbiBjb252ZXJ0ZXIsIHBhc3MgYSBjb252ZXJ0ZXIgaW4gd2hvc2UgdmFsdWUgaXMgJ251bGwnIGluc3RlYWRcbiAgICogb2YgYSBmdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnZlcnRlcnMgLSBrZXlzIGluIHRoZSBvYmplY3QgYXJlIGEgdGFnIG51bWJlciwgdGhlIHZhbHVlXG4gICAqICAgaXMgYSBmdW5jdGlvbiB0aGF0IHRha2VzIHRoZSBkZWNvZGVkIENCT1IgYW5kIHJldHVybnMgYSBKYXZhU2NyaXB0IHZhbHVlXG4gICAqICAgb2YgdGhlIGFwcHJvcHJpYXRlIHR5cGUuICBUaHJvdyBhbiBleGNlcHRpb24gaW4gdGhlIGZ1bmN0aW9uIG9uIGVycm9ycy5cbiAgICogQHJldHVybnMge2FueX0gLSB0aGUgY29udmVydGVkIGl0ZW1cbiAgICovXG4gIGNvbnZlcnQgKGNvbnZlcnRlcnMpIHtcbiAgICB2YXIgZXIsIGZcbiAgICBmID0gY29udmVydGVycyAhPSBudWxsID8gY29udmVydGVyc1t0aGlzLnRhZ10gOiB2b2lkIDBcbiAgICBpZiAodHlwZW9mIGYgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGYgPSBUYWdnZWRbJ190YWcnICsgdGhpcy50YWddXG4gICAgICBpZiAodHlwZW9mIGYgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgIH1cbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmLmNhbGwoVGFnZ2VkLCB0aGlzLnZhbHVlKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBlciA9IGVycm9yXG4gICAgICB0aGlzLmVyciA9IGVyXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ2dlZFxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IEJpZ251bWJlciA9IHJlcXVpcmUoJ2JpZ251bWJlci5qcycpLkJpZ051bWJlclxuXG5jb25zdCBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpXG5jb25zdCBTSElGVDMyID0gY29uc3RhbnRzLlNISUZUMzJcbmNvbnN0IFNISUZUMTYgPSBjb25zdGFudHMuU0hJRlQxNlxuY29uc3QgTUFYX1NBRkVfSElHSCA9IDB4MWZmZmZmXG5cbmV4cG9ydHMucGFyc2VIYWxmID0gZnVuY3Rpb24gcGFyc2VIYWxmIChidWYpIHtcbiAgdmFyIGV4cCwgbWFudCwgc2lnblxuICBzaWduID0gYnVmWzBdICYgMHg4MCA/IC0xIDogMVxuICBleHAgPSAoYnVmWzBdICYgMHg3QykgPj4gMlxuICBtYW50ID0gKChidWZbMF0gJiAweDAzKSA8PCA4KSB8IGJ1ZlsxXVxuICBpZiAoIWV4cCkge1xuICAgIHJldHVybiBzaWduICogNS45NjA0NjQ0Nzc1MzkwNjI1ZS04ICogbWFudFxuICB9IGVsc2UgaWYgKGV4cCA9PT0gMHgxZikge1xuICAgIHJldHVybiBzaWduICogKG1hbnQgPyAwIC8gMCA6IDJlMzA4KVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBzaWduICogTWF0aC5wb3coMiwgZXhwIC0gMjUpICogKDEwMjQgKyBtYW50KVxuICB9XG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHtcbiAgICByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgfVxuXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5leHBvcnRzLmFycmF5QnVmZmVyVG9CaWdudW1iZXIgPSBmdW5jdGlvbiAoYnVmKSB7XG4gIGNvbnN0IGxlbiA9IGJ1Zi5ieXRlTGVuZ3RoXG4gIGxldCByZXMgPSAnJ1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgcmVzICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuXG4gIHJldHVybiBuZXcgQmlnbnVtYmVyKHJlcywgMTYpXG59XG5cbi8vIGNvbnZlcnQgYW4gT2JqZWN0IGludG8gYSBNYXBcbmV4cG9ydHMuYnVpbGRNYXAgPSAob2JqKSA9PiB7XG4gIGNvbnN0IHJlcyA9IG5ldyBNYXAoKVxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqKVxuICBjb25zdCBsZW5ndGggPSBrZXlzLmxlbmd0aFxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgcmVzLnNldChrZXlzW2ldLCBvYmpba2V5c1tpXV0pXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5leHBvcnRzLmJ1aWxkSW50MzIgPSAoZiwgZykgPT4ge1xuICByZXR1cm4gZiAqIFNISUZUMTYgKyBnXG59XG5cbmV4cG9ydHMuYnVpbGRJbnQ2NCA9IChmMSwgZjIsIGcxLCBnMikgPT4ge1xuICBjb25zdCBmID0gZXhwb3J0cy5idWlsZEludDMyKGYxLCBmMilcbiAgY29uc3QgZyA9IGV4cG9ydHMuYnVpbGRJbnQzMihnMSwgZzIpXG5cbiAgaWYgKGYgPiBNQVhfU0FGRV9ISUdIKSB7XG4gICAgcmV0dXJuIG5ldyBCaWdudW1iZXIoZikudGltZXMoU0hJRlQzMikucGx1cyhnKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiAoZiAqIFNISUZUMzIpICsgZ1xuICB9XG59XG5cbmV4cG9ydHMud3JpdGVIYWxmID0gZnVuY3Rpb24gd3JpdGVIYWxmIChidWYsIGhhbGYpIHtcbiAgLy8gYXNzdW1lIDAsIC0wLCBOYU4sIEluZmluaXR5LCBhbmQgLUluZmluaXR5IGhhdmUgYWxyZWFkeSBiZWVuIGNhdWdodFxuXG4gIC8vIEhBQ0s6IGV2ZXJ5b25lIHNldHRsZSBpbi4gIFRoaXMgaXNuJ3QgZ29pbmcgdG8gYmUgcHJldHR5LlxuICAvLyBUcmFuc2xhdGUgY24tY2JvcidzIEMgY29kZSAoZnJvbSBDYXJzdGVuIEJvcm1hbik6XG5cbiAgLy8gdWludDMyX3QgYmUzMjtcbiAgLy8gdWludDE2X3QgYmUxNiwgdTE2O1xuICAvLyB1bmlvbiB7XG4gIC8vICAgZmxvYXQgZjtcbiAgLy8gICB1aW50MzJfdCB1O1xuICAvLyB9IHUzMjtcbiAgLy8gdTMyLmYgPSBmbG9hdF92YWw7XG5cbiAgY29uc3QgdTMyID0gQnVmZmVyLmFsbG9jVW5zYWZlKDQpXG4gIHUzMi53cml0ZUZsb2F0QkUoaGFsZiwgMClcbiAgY29uc3QgdSA9IHUzMi5yZWFkVUludDMyQkUoMClcblxuICAvLyBpZiAoKHUzMi51ICYgMHgxRkZGKSA9PSAwKSB7IC8qIHdvcnRoIHRyeWluZyBoYWxmICovXG5cbiAgLy8gaGlsZGpqOiBJZiB0aGUgbG93ZXIgMTMgYml0cyBhcmUgMCwgd2Ugd29uJ3QgbG9zZSBhbnl0aGluZyBpbiB0aGUgY29udmVyc2lvblxuICBpZiAoKHUgJiAweDFGRkYpICE9PSAwKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyAgIGludCBzMTYgPSAodTMyLnUgPj4gMTYpICYgMHg4MDAwO1xuICAvLyAgIGludCBleHAgPSAodTMyLnUgPj4gMjMpICYgMHhmZjtcbiAgLy8gICBpbnQgbWFudCA9IHUzMi51ICYgMHg3ZmZmZmY7XG5cbiAgdmFyIHMxNiA9ICh1ID4+IDE2KSAmIDB4ODAwMCAvLyB0b3AgYml0IGlzIHNpZ25cbiAgY29uc3QgZXhwID0gKHUgPj4gMjMpICYgMHhmZiAvLyB0aGVuIDUgYml0cyBvZiBleHBvbmVudFxuICBjb25zdCBtYW50ID0gdSAmIDB4N2ZmZmZmXG5cbiAgLy8gICBpZiAoZXhwID09IDAgJiYgbWFudCA9PSAwKVxuICAvLyAgICAgOyAgICAgICAgICAgICAgLyogMC4wLCAtMC4wICovXG5cbiAgLy8gaGlsZGpqOiB6ZXJvcyBhbHJlYWR5IGhhbmRsZWQuICBBc3NlcnQgaWYgeW91IGRvbid0IGJlbGlldmUgbWUuXG5cbiAgLy8gICBlbHNlIGlmIChleHAgPj0gMTEzICYmIGV4cCA8PSAxNDIpIC8qIG5vcm1hbGl6ZWQgKi9cbiAgLy8gICAgIHMxNiArPSAoKGV4cCAtIDExMikgPDwgMTApICsgKG1hbnQgPj4gMTMpO1xuICBpZiAoKGV4cCA+PSAxMTMpICYmIChleHAgPD0gMTQyKSkge1xuICAgIHMxNiArPSAoKGV4cCAtIDExMikgPDwgMTApICsgKG1hbnQgPj4gMTMpXG5cbiAgLy8gICBlbHNlIGlmIChleHAgPj0gMTAzICYmIGV4cCA8IDExMykgeyAvKiBkZW5vcm0sIGV4cDE2ID0gMCAqL1xuICAvLyAgICAgaWYgKG1hbnQgJiAoKDEgPDwgKDEyNiAtIGV4cCkpIC0gMSkpXG4gIC8vICAgICAgIGdvdG8gZmxvYXQzMjsgICAgICAgICAvKiBsb3NzIG9mIHByZWNpc2lvbiAqL1xuICAvLyAgICAgczE2ICs9ICgobWFudCArIDB4ODAwMDAwKSA+PiAoMTI2IC0gZXhwKSk7XG4gIH0gZWxzZSBpZiAoKGV4cCA+PSAxMDMpICYmIChleHAgPCAxMTMpKSB7XG4gICAgaWYgKG1hbnQgJiAoKDEgPDwgKDEyNiAtIGV4cCkpIC0gMSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBzMTYgKz0gKChtYW50ICsgMHg4MDAwMDApID4+ICgxMjYgLSBleHApKVxuXG4gICAgLy8gICB9IGVsc2UgaWYgKGV4cCA9PSAyNTUgJiYgbWFudCA9PSAwKSB7IC8qIEluZiAqL1xuICAgIC8vICAgICBzMTYgKz0gMHg3YzAwO1xuXG4gICAgLy8gaGlsZGpqOiBJbmZpbml0eSBhbHJlYWR5IGhhbmRsZWRcblxuICAvLyAgIH0gZWxzZVxuICAvLyAgICAgZ290byBmbG9hdDMyOyAgICAgICAgICAgLyogbG9zcyBvZiByYW5nZSAqL1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gICBlbnN1cmVfd3JpdGFibGUoMyk7XG4gIC8vICAgdTE2ID0gczE2O1xuICAvLyAgIGJlMTYgPSBodG9uMTZwKChjb25zdCB1aW50OF90KikmdTE2KTtcbiAgYnVmLndyaXRlVUludDE2QkUoczE2LCAwKVxuICByZXR1cm4gdHJ1ZVxufVxuXG5leHBvcnRzLmtleVNvcnRlciA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gIHZhciBsZW5BID0gYVswXS5ieXRlTGVuZ3RoXG4gIHZhciBsZW5CID0gYlswXS5ieXRlTGVuZ3RoXG5cbiAgaWYgKGxlbkEgPiBsZW5CKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIGlmIChsZW5CID4gbGVuQSkge1xuICAgIHJldHVybiAtMVxuICB9XG5cbiAgcmV0dXJuIGFbMF0uY29tcGFyZShiWzBdKVxufVxuXG4vLyBBZGFwdGVkIGZyb20gaHR0cDovL3d3dy4yYWxpdHkuY29tLzIwMTIvMDMvc2lnbmVkemVyby5odG1sXG5leHBvcnRzLmlzTmVnYXRpdmVaZXJvID0gKHgpID0+IHtcbiAgcmV0dXJuIHggPT09IDAgJiYgKDEgLyB4IDwgMClcbn1cblxuZXhwb3J0cy5uZXh0UG93ZXJPZjIgPSAobikgPT4ge1xuICBsZXQgY291bnQgPSAwXG4gIC8vIEZpcnN0IG4gaW4gdGhlIGJlbG93IGNvbmRpdGlvbiBpcyBmb3JcbiAgLy8gdGhlIGNhc2Ugd2hlcmUgbiBpcyAwXG4gIGlmIChuICYmICEobiAmIChuIC0gMSkpKSB7XG4gICAgcmV0dXJuIG5cbiAgfVxuXG4gIHdoaWxlIChuICE9PSAwKSB7XG4gICAgbiA+Pj0gMVxuICAgIGNvdW50ICs9IDFcbiAgfVxuXG4gIHJldHVybiAxIDw8IGNvdW50XG59XG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7IF9fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfSB9XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgICApXG4gIH1cblxuICBpZiAoaXNJbnN0YW5jZSh2YWx1ZSwgQXJyYXlCdWZmZXIpIHx8XG4gICAgICAodmFsdWUgJiYgaXNJbnN0YW5jZSh2YWx1ZS5idWZmZXIsIEFycmF5QnVmZmVyKSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgKVxuICB9XG5cbiAgdmFyIHZhbHVlT2YgPSB2YWx1ZS52YWx1ZU9mICYmIHZhbHVlLnZhbHVlT2YoKVxuICBpZiAodmFsdWVPZiAhPSBudWxsICYmIHZhbHVlT2YgIT09IHZhbHVlKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHZhbHVlT2YsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIHZhciBiID0gZnJvbU9iamVjdCh2YWx1ZSlcbiAgaWYgKGIpIHJldHVybiBiXG5cbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1ByaW1pdGl2ZSAhPSBudWxsICYmXG4gICAgICB0eXBlb2YgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0oJ3N0cmluZycpLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGhcbiAgICApXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gIClcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBOb3RlOiBDaGFuZ2UgcHJvdG90eXBlICphZnRlciogQnVmZmVyLmZyb20gaXMgZGVmaW5lZCB0byB3b3JrYXJvdW5kIENocm9tZSBidWc6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzE0OFxuQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpXG4gIH0gZWxzZSBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIHNpemUgKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvYyAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxuICB9XG4gIGlmIChmaWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbmx5IHBheSBhdHRlbnRpb24gdG8gZW5jb2RpbmcgaWYgaXQncyBhIHN0cmluZy4gVGhpc1xuICAgIC8vIHByZXZlbnRzIGFjY2lkZW50YWxseSBzZW5kaW5nIGluIGEgbnVtYmVyIHRoYXQgd291bGRcbiAgICAvLyBiZSBpbnRlcnByZXR0ZWQgYXMgYSBzdGFydCBvZmZzZXQuXG4gICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZydcbiAgICAgID8gY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbCwgZW5jb2RpbmcpXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2Moc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlIChzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gYnVmLndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG5cbiAgaWYgKGFjdHVhbCAhPT0gbGVuZ3RoKSB7XG4gICAgLy8gV3JpdGluZyBhIGhleCBzdHJpbmcsIGZvciBleGFtcGxlLCB0aGF0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyB3aWxsXG4gICAgLy8gY2F1c2UgZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3QgaW52YWxpZCBjaGFyYWN0ZXIgdG8gYmUgaWdub3JlZC4gKGUuZy5cbiAgICAvLyAnYWJ4eGNkJyB3aWxsIGJlIHRyZWF0ZWQgYXMgJ2FiJylcbiAgICBidWYgPSBidWYuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlIChhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgYnVmW2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJvZmZzZXRcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcImxlbmd0aFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICB2YXIgYnVmXG4gIGlmIChieXRlT2Zmc2V0ID09PSB1bmRlZmluZWQgJiYgbGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KVxuICB9IGVsc2Uge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHNob3VsZCBiZSBhIEJ1ZmZlcicpXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVXNlIGJ1aWx0LWluIHdoZW4gYXZhaWxhYmxlLCBtaXNzaW5nIGZyb20gSUUxMVxuICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZClcbiAgfSBlbHNlIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAodmFyIGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpLFxuICAgICAgdGFyZ2V0U3RhcnRcbiAgICApXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIFVzYWdlOlxuLy8gICAgYnVmZmVyLmZpbGwobnVtYmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChidWZmZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKHN0cmluZ1ssIG9mZnNldFssIGVuZF1dWywgZW5jb2RpbmddKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICAvLyBIYW5kbGUgc3RyaW5nIGNhc2VzOlxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBzdGFydFxuICAgICAgc3RhcnQgPSAwXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gZW5kXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmNvZGluZyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgIH1cbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKVxuICAgICAgaWYgKChlbmNvZGluZyA9PT0gJ3V0ZjgnICYmIGNvZGUgPCAxMjgpIHx8XG4gICAgICAgICAgZW5jb2RpbmcgPT09ICdsYXRpbjEnKSB7XG4gICAgICAgIC8vIEZhc3QgcGF0aDogSWYgYHZhbGAgZml0cyBpbnRvIGEgc2luZ2xlIGJ5dGUsIHVzZSB0aGF0IG51bWVyaWMgdmFsdWUuXG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgdmFsdWUgXCInICsgdmFsICtcbiAgICAgICAgJ1wiIGlzIGludmFsaWQgZm9yIGFyZ3VtZW50IFwidmFsdWVcIicpXG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgdGFrZXMgZXF1YWwgc2lnbnMgYXMgZW5kIG9mIHRoZSBCYXNlNjQgZW5jb2RpbmdcbiAgc3RyID0gc3RyLnNwbGl0KCc9JylbMF1cbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0ci50cmltKCkucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG4vLyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IG9iamVjdHMgZnJvbSBvdGhlciBjb250ZXh0cyAoaS5lLiBpZnJhbWVzKSBkbyBub3QgcGFzc1xuLy8gdGhlIGBpbnN0YW5jZW9mYCBjaGVjayBidXQgdGhleSBzaG91bGQgYmUgdHJlYXRlZCBhcyBvZiB0aGF0IHR5cGUuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzSW5zdGFuY2UgKG9iaiwgdHlwZSkge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgdHlwZSB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSAhPSBudWxsICYmXG4gICAgICBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdHlwZS5uYW1lKVxufVxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICAvLyBGb3IgSUUxMSBzdXBwb3J0XG4gIHJldHVybiBvYmogIT09IG9iaiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBjcmVhdGVBYm9ydEVycm9yID0gKCkgPT4ge1xuXHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcignRGVsYXkgYWJvcnRlZCcpO1xuXHRlcnJvci5uYW1lID0gJ0Fib3J0RXJyb3InO1xuXHRyZXR1cm4gZXJyb3I7XG59O1xuXG5jb25zdCBjcmVhdGVEZWxheSA9ICh7Y2xlYXJUaW1lb3V0OiBkZWZhdWx0Q2xlYXIsIHNldFRpbWVvdXQ6IHNldCwgd2lsbFJlc29sdmV9KSA9PiAobXMsIHt2YWx1ZSwgc2lnbmFsfSA9IHt9KSA9PiB7XG5cdGlmIChzaWduYWwgJiYgc2lnbmFsLmFib3J0ZWQpIHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoY3JlYXRlQWJvcnRFcnJvcigpKTtcblx0fVxuXG5cdGxldCB0aW1lb3V0SWQ7XG5cdGxldCBzZXR0bGU7XG5cdGxldCByZWplY3RGbjtcblx0Y29uc3QgY2xlYXIgPSBkZWZhdWx0Q2xlYXIgfHwgY2xlYXJUaW1lb3V0O1xuXG5cdGNvbnN0IHNpZ25hbExpc3RlbmVyID0gKCkgPT4ge1xuXHRcdGNsZWFyKHRpbWVvdXRJZCk7XG5cdFx0cmVqZWN0Rm4oY3JlYXRlQWJvcnRFcnJvcigpKTtcblx0fTtcblxuXHRjb25zdCBjbGVhbnVwID0gKCkgPT4ge1xuXHRcdGlmIChzaWduYWwpIHtcblx0XHRcdHNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIHNpZ25hbExpc3RlbmVyKTtcblx0XHR9XG5cdH07XG5cblx0Y29uc3QgZGVsYXlQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdHNldHRsZSA9ICgpID0+IHtcblx0XHRcdGNsZWFudXAoKTtcblx0XHRcdGlmICh3aWxsUmVzb2x2ZSkge1xuXHRcdFx0XHRyZXNvbHZlKHZhbHVlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJlamVjdCh2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJlamVjdEZuID0gcmVqZWN0O1xuXHRcdHRpbWVvdXRJZCA9IChzZXQgfHwgc2V0VGltZW91dCkoc2V0dGxlLCBtcyk7XG5cdH0pO1xuXG5cdGlmIChzaWduYWwpIHtcblx0XHRzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBzaWduYWxMaXN0ZW5lciwge29uY2U6IHRydWV9KTtcblx0fVxuXG5cdGRlbGF5UHJvbWlzZS5jbGVhciA9ICgpID0+IHtcblx0XHRjbGVhcih0aW1lb3V0SWQpO1xuXHRcdHRpbWVvdXRJZCA9IG51bGw7XG5cdFx0Y2xlYW51cCgpO1xuXHRcdHNldHRsZSgpO1xuXHR9O1xuXG5cdHJldHVybiBkZWxheVByb21pc2U7XG59O1xuXG5jb25zdCBkZWxheSA9IGNyZWF0ZURlbGF5KHt3aWxsUmVzb2x2ZTogdHJ1ZX0pO1xuZGVsYXkucmVqZWN0ID0gY3JlYXRlRGVsYXkoe3dpbGxSZXNvbHZlOiBmYWxzZX0pO1xuZGVsYXkuY3JlYXRlV2l0aFRpbWVycyA9ICh7Y2xlYXJUaW1lb3V0LCBzZXRUaW1lb3V0fSkgPT4ge1xuXHRjb25zdCBkZWxheSA9IGNyZWF0ZURlbGF5KHtjbGVhclRpbWVvdXQsIHNldFRpbWVvdXQsIHdpbGxSZXNvbHZlOiB0cnVlfSk7XG5cdGRlbGF5LnJlamVjdCA9IGNyZWF0ZURlbGF5KHtjbGVhclRpbWVvdXQsIHNldFRpbWVvdXQsIHdpbGxSZXNvbHZlOiBmYWxzZX0pO1xuXHRyZXR1cm4gZGVsYXk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlbGF5O1xuLy8gVE9ETzogUmVtb3ZlIHRoaXMgZm9yIHRoZSBuZXh0IG1ham9yIHJlbGVhc2Vcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBkZWxheTtcbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gKGUgKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gKG0gKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAoKHZhbHVlICogYykgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3Qge1xuICAgIFVSTFdpdGhMZWdhY3lTdXBwb3J0LFxuICAgIGZvcm1hdCxcbiAgICBVUkxTZWFyY2hQYXJhbXMsXG4gICAgZGVmYXVsdEJhc2Vcbn0gPSByZXF1aXJlKCcuL3NyYy91cmwnKTtcbmNvbnN0IHJlbGF0aXZlID0gcmVxdWlyZSgnLi9zcmMvcmVsYXRpdmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgVVJMOiBVUkxXaXRoTGVnYWN5U3VwcG9ydCxcbiAgICBVUkxTZWFyY2hQYXJhbXMsXG4gICAgZm9ybWF0LFxuICAgIHJlbGF0aXZlLFxuICAgIGRlZmF1bHRCYXNlXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCB7IFVSTFdpdGhMZWdhY3lTdXBwb3J0LCBmb3JtYXQgfSA9IHJlcXVpcmUoJy4vdXJsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKHVybCwgbG9jYXRpb24gPSB7fSwgcHJvdG9jb2xNYXAgPSB7fSwgZGVmYXVsdFByb3RvY29sKSA9PiB7XG4gICAgbGV0IHByb3RvY29sID0gbG9jYXRpb24ucHJvdG9jb2wgP1xuICAgICAgICBsb2NhdGlvbi5wcm90b2NvbC5yZXBsYWNlKCc6JywgJycpIDpcbiAgICAgICAgJ2h0dHAnO1xuXG4gICAgLy8gQ2hlY2sgcHJvdG9jb2wgbWFwXG4gICAgcHJvdG9jb2wgPSAocHJvdG9jb2xNYXBbcHJvdG9jb2xdIHx8IGRlZmF1bHRQcm90b2NvbCB8fCBwcm90b2NvbCkgKyAnOic7XG4gICAgbGV0IHVybFBhcnNlZDtcblxuICAgIHRyeSB7XG4gICAgICAgIHVybFBhcnNlZCA9IG5ldyBVUkxXaXRoTGVnYWN5U3VwcG9ydCh1cmwpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB1cmxQYXJzZWQgPSB7fTtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlID0gT2JqZWN0LmFzc2lnbih7fSwgbG9jYXRpb24sIHtcbiAgICAgICAgcHJvdG9jb2w6IHByb3RvY29sIHx8IHVybFBhcnNlZC5wcm90b2NvbCxcbiAgICAgICAgaG9zdDogbG9jYXRpb24uaG9zdCB8fCB1cmxQYXJzZWQuaG9zdFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBVUkxXaXRoTGVnYWN5U3VwcG9ydCh1cmwsIGZvcm1hdChiYXNlKSkudG9TdHJpbmcoKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IGRlZmF1bHRCYXNlID0gc2VsZi5sb2NhdGlvbiA/XG4gICAgc2VsZi5sb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBzZWxmLmxvY2F0aW9uLmhvc3QgOlxuICAgICcnO1xuY29uc3QgVVJMID0gc2VsZi5VUkw7XG5cbmNsYXNzIFVSTFdpdGhMZWdhY3lTdXBwb3J0IHtcbiAgICBjb25zdHJ1Y3Rvcih1cmwsIGJhc2UgPSBkZWZhdWx0QmFzZSkge1xuICAgICAgICB0aGlzLnN1cGVyID0gbmV3IFVSTCh1cmwsIGJhc2UpO1xuICAgICAgICB0aGlzLnBhdGggPSB0aGlzLnBhdGhuYW1lICsgdGhpcy5zZWFyY2g7XG4gICAgICAgIHRoaXMuYXV0aCA9XG4gICAgICAgICAgICB0aGlzLnVzZXJuYW1lICYmIHRoaXMucGFzc3dvcmQgP1xuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgKyAnOicgKyB0aGlzLnBhc3N3b3JkIDpcbiAgICAgICAgICAgICAgICBudWxsO1xuXG4gICAgICAgIHRoaXMucXVlcnkgPVxuICAgICAgICAgICAgdGhpcy5zZWFyY2ggJiYgdGhpcy5zZWFyY2guc3RhcnRzV2l0aCgnPycpID9cbiAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaC5zbGljZSgxKSA6XG4gICAgICAgICAgICAgICAgbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgaGFzaCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIuaGFzaDtcbiAgICB9XG4gICAgZ2V0IGhvc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyLmhvc3Q7XG4gICAgfVxuICAgIGdldCBob3N0bmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIuaG9zdG5hbWU7XG4gICAgfVxuICAgIGdldCBocmVmKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci5ocmVmO1xuICAgIH1cbiAgICBnZXQgb3JpZ2luKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci5vcmlnaW47XG4gICAgfVxuICAgIGdldCBwYXNzd29yZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIucGFzc3dvcmQ7XG4gICAgfVxuICAgIGdldCBwYXRobmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIucGF0aG5hbWU7XG4gICAgfVxuICAgIGdldCBwb3J0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci5wb3J0O1xuICAgIH1cbiAgICBnZXQgcHJvdG9jb2woKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyLnByb3RvY29sO1xuICAgIH1cbiAgICBnZXQgc2VhcmNoKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci5zZWFyY2g7XG4gICAgfVxuICAgIGdldCBzZWFyY2hQYXJhbXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyLnNlYXJjaFBhcmFtcztcbiAgICB9XG4gICAgZ2V0IHVzZXJuYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci51c2VybmFtZTtcbiAgICB9XG5cbiAgICBzZXQgaGFzaChoYXNoKSB7XG4gICAgICAgIHRoaXMuc3VwZXIuaGFzaCA9IGhhc2g7XG4gICAgfVxuICAgIHNldCBob3N0KGhvc3QpIHtcbiAgICAgICAgdGhpcy5zdXBlci5ob3N0ID0gaG9zdDtcbiAgICB9XG4gICAgc2V0IGhvc3RuYW1lKGhvc3RuYW1lKSB7XG4gICAgICAgIHRoaXMuc3VwZXIuaG9zdG5hbWUgPSBob3N0bmFtZTtcbiAgICB9XG4gICAgc2V0IGhyZWYoaHJlZikge1xuICAgICAgICB0aGlzLnN1cGVyLmhyZWYgPSBocmVmO1xuICAgIH1cbiAgICBzZXQgb3JpZ2luKG9yaWdpbikge1xuICAgICAgICB0aGlzLnN1cGVyLm9yaWdpbiA9IG9yaWdpbjtcbiAgICB9XG4gICAgc2V0IHBhc3N3b3JkKHBhc3N3b3JkKSB7XG4gICAgICAgIHRoaXMuc3VwZXIucGFzc3dvcmQgPSBwYXNzd29yZDtcbiAgICB9XG4gICAgc2V0IHBhdGhuYW1lKHBhdGhuYW1lKSB7XG4gICAgICAgIHRoaXMuc3VwZXIucGF0aG5hbWUgPSBwYXRobmFtZTtcbiAgICB9XG4gICAgc2V0IHBvcnQocG9ydCkge1xuICAgICAgICB0aGlzLnN1cGVyLnBvcnQgPSBwb3J0O1xuICAgIH1cbiAgICBzZXQgcHJvdG9jb2wocHJvdG9jb2wpIHtcbiAgICAgICAgdGhpcy5zdXBlci5wcm90b2NvbCA9IHByb3RvY29sO1xuICAgIH1cbiAgICBzZXQgc2VhcmNoKHNlYXJjaCkge1xuICAgICAgICB0aGlzLnN1cGVyLnNlYXJjaCA9IHNlYXJjaDtcbiAgICB9XG4gICAgc2V0IHNlYXJjaFBhcmFtcyhzZWFyY2hQYXJhbXMpIHtcbiAgICAgICAgdGhpcy5zdXBlci5zZWFyY2hQYXJhbXMgPSBzZWFyY2hQYXJhbXM7XG4gICAgfVxuICAgIHNldCB1c2VybmFtZSh1c2VybmFtZSkge1xuICAgICAgICB0aGlzLnN1cGVyLnVzZXJuYW1lID0gdXNlcm5hbWU7XG4gICAgfVxuXG4gICAgY3JlYXRlT2JqZWN0VVJMKG8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIuY3JlYXRlT2JqZWN0VVJMKG8pO1xuICAgIH1cbiAgICByZXZva2VPYmplY3RVUkwobykge1xuICAgICAgICB0aGlzLnN1cGVyLnJldm9rZU9iamVjdFVSTChvKTtcbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci50b0pTT04oKTtcbiAgICB9XG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIGZvcm1hdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZvcm1hdChvYmopIHtcbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChvYmopO1xuXG4gICAgICAgIHJldHVybiB1cmwudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAoIShvYmogaW5zdGFuY2VvZiBVUkwpKSB7XG4gICAgICAgIGNvbnN0IHVzZXJQYXNzID1cbiAgICAgICAgICAgIG9iai51c2VybmFtZSAmJiBvYmoucGFzc3dvcmQgP1xuICAgICAgICAgICAgICAgIGAke29iai51c2VybmFtZX06JHtvYmoucGFzc3dvcmR9QGAgOlxuICAgICAgICAgICAgICAgICcnO1xuICAgICAgICBjb25zdCBhdXRoID0gb2JqLmF1dGggPyBvYmouYXV0aCArICdAJyA6ICcnO1xuICAgICAgICBjb25zdCBwb3J0ID0gb2JqLnBvcnQgPyAnOicgKyBvYmoucG9ydCA6ICcnO1xuICAgICAgICBjb25zdCBwcm90b2NvbCA9IG9iai5wcm90b2NvbCA/IG9iai5wcm90b2NvbCArICcvLycgOiAnJztcbiAgICAgICAgY29uc3QgaG9zdCA9IG9iai5ob3N0IHx8ICcnO1xuICAgICAgICBjb25zdCBob3N0bmFtZSA9IG9iai5ob3N0bmFtZSB8fCAnJztcbiAgICAgICAgY29uc3Qgc2VhcmNoID0gb2JqLnNlYXJjaCB8fCAob2JqLnF1ZXJ5ID8gJz8nICsgb2JqLnF1ZXJ5IDogJycpO1xuICAgICAgICBjb25zdCBoYXNoID0gb2JqLmhhc2ggfHwgJyc7XG4gICAgICAgIGNvbnN0IHBhdGhuYW1lID0gb2JqLnBhdGhuYW1lIHx8ICcnO1xuICAgICAgICBjb25zdCBwYXRoID0gb2JqLnBhdGggfHwgcGF0aG5hbWUgKyBzZWFyY2g7XG5cbiAgICAgICAgcmV0dXJuIGAke3Byb3RvY29sfSR7dXNlclBhc3MgfHwgYXV0aH0ke2hvc3QgfHxcbiAgICAgICAgICAgIGhvc3RuYW1lICsgcG9ydH0ke3BhdGh9JHtoYXNofWA7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBVUkxXaXRoTGVnYWN5U3VwcG9ydCxcbiAgICBVUkxTZWFyY2hQYXJhbXM6IHNlbGYuVVJMU2VhcmNoUGFyYW1zLFxuICAgIGRlZmF1bHRCYXNlLFxuICAgIGZvcm1hdFxufTtcbiIsImFzc2VydC5ub3RFcXVhbCA9IG5vdEVxdWFsXG5hc3NlcnQubm90T2sgPSBub3RPa1xuYXNzZXJ0LmVxdWFsID0gZXF1YWxcbmFzc2VydC5vayA9IGFzc2VydFxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2VydFxuXG5mdW5jdGlvbiBlcXVhbCAoYSwgYiwgbSkge1xuICBhc3NlcnQoYSA9PSBiLCBtKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxufVxuXG5mdW5jdGlvbiBub3RFcXVhbCAoYSwgYiwgbSkge1xuICBhc3NlcnQoYSAhPSBiLCBtKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxufVxuXG5mdW5jdGlvbiBub3RPayAodCwgbSkge1xuICBhc3NlcnQoIXQsIG0pXG59XG5cbmZ1bmN0aW9uIGFzc2VydCAodCwgbSkge1xuICBpZiAoIXQpIHRocm93IG5ldyBFcnJvcihtIHx8ICdBc3NlcnRpb25FcnJvcicpXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIHRyYWlsaW5nTmV3bGluZVJlZ2V4ID0gL1xcbltcXHNdKyQvXG52YXIgbGVhZGluZ05ld2xpbmVSZWdleCA9IC9eXFxuW1xcc10rL1xudmFyIHRyYWlsaW5nU3BhY2VSZWdleCA9IC9bXFxzXSskL1xudmFyIGxlYWRpbmdTcGFjZVJlZ2V4ID0gL15bXFxzXSsvXG52YXIgbXVsdGlTcGFjZVJlZ2V4ID0gL1tcXG5cXHNdKy9nXG5cbnZhciBURVhUX1RBR1MgPSBbXG4gICdhJywgJ2FiYnInLCAnYicsICdiZGknLCAnYmRvJywgJ2JyJywgJ2NpdGUnLCAnZGF0YScsICdkZm4nLCAnZW0nLCAnaScsXG4gICdrYmQnLCAnbWFyaycsICdxJywgJ3JwJywgJ3J0JywgJ3J0YycsICdydWJ5JywgJ3MnLCAnYW1wJywgJ3NtYWxsJywgJ3NwYW4nLFxuICAnc3Ryb25nJywgJ3N1YicsICdzdXAnLCAndGltZScsICd1JywgJ3ZhcicsICd3YnInXG5dXG5cbnZhciBWRVJCQVRJTV9UQUdTID0gW1xuICAnY29kZScsICdwcmUnLCAndGV4dGFyZWEnXG5dXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYXBwZW5kQ2hpbGQgKGVsLCBjaGlsZHMpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNoaWxkcykpIHJldHVyblxuXG4gIHZhciBub2RlTmFtZSA9IGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKClcblxuICB2YXIgaGFkVGV4dCA9IGZhbHNlXG4gIHZhciB2YWx1ZSwgbGVhZGVyXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNoaWxkcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIHZhciBub2RlID0gY2hpbGRzW2ldXG4gICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHtcbiAgICAgIGFwcGVuZENoaWxkKGVsLCBub2RlKVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG5vZGUgPT09ICdudW1iZXInIHx8XG4gICAgICB0eXBlb2Ygbm9kZSA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICB0eXBlb2Ygbm9kZSA9PT0gJ2Z1bmN0aW9uJyB8fFxuICAgICAgbm9kZSBpbnN0YW5jZW9mIERhdGUgfHxcbiAgICAgIG5vZGUgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgIG5vZGUgPSBub2RlLnRvU3RyaW5nKClcbiAgICB9XG5cbiAgICB2YXIgbGFzdENoaWxkID0gZWwuY2hpbGROb2Rlc1tlbC5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdXG5cbiAgICAvLyBJdGVyYXRlIG92ZXIgdGV4dCBub2Rlc1xuICAgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGhhZFRleHQgPSB0cnVlXG5cbiAgICAgIC8vIElmIHdlIGFscmVhZHkgaGFkIHRleHQsIGFwcGVuZCB0byB0aGUgZXhpc3RpbmcgdGV4dFxuICAgICAgaWYgKGxhc3RDaGlsZCAmJiBsYXN0Q2hpbGQubm9kZU5hbWUgPT09ICcjdGV4dCcpIHtcbiAgICAgICAgbGFzdENoaWxkLm5vZGVWYWx1ZSArPSBub2RlXG5cbiAgICAgIC8vIFdlIGRpZG4ndCBoYXZlIGEgdGV4dCBub2RlIHlldCwgY3JlYXRlIG9uZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZSA9IGVsLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobm9kZSlcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQobm9kZSlcbiAgICAgICAgbGFzdENoaWxkID0gbm9kZVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IG9mIHRoZSBjaGlsZCBub2RlcywgbWFrZSBzdXJlIHdlIGNsb3NlIGl0IG91dFxuICAgICAgLy8gcmlnaHRcbiAgICAgIGlmIChpID09PSBsZW4gLSAxKSB7XG4gICAgICAgIGhhZFRleHQgPSBmYWxzZVxuICAgICAgICAvLyBUcmltIHRoZSBjaGlsZCB0ZXh0IG5vZGVzIGlmIHRoZSBjdXJyZW50IG5vZGUgaXNuJ3QgYVxuICAgICAgICAvLyBub2RlIHdoZXJlIHdoaXRlc3BhY2UgbWF0dGVycy5cbiAgICAgICAgaWYgKFRFWFRfVEFHUy5pbmRleE9mKG5vZGVOYW1lKSA9PT0gLTEgJiZcbiAgICAgICAgICBWRVJCQVRJTV9UQUdTLmluZGV4T2Yobm9kZU5hbWUpID09PSAtMSkge1xuICAgICAgICAgIHZhbHVlID0gbGFzdENoaWxkLm5vZGVWYWx1ZVxuICAgICAgICAgICAgLnJlcGxhY2UobGVhZGluZ05ld2xpbmVSZWdleCwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSh0cmFpbGluZ1NwYWNlUmVnZXgsICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UodHJhaWxpbmdOZXdsaW5lUmVnZXgsICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UobXVsdGlTcGFjZVJlZ2V4LCAnICcpXG4gICAgICAgICAgaWYgKHZhbHVlID09PSAnJykge1xuICAgICAgICAgICAgZWwucmVtb3ZlQ2hpbGQobGFzdENoaWxkKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXN0Q2hpbGQubm9kZVZhbHVlID0gdmFsdWVcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoVkVSQkFUSU1fVEFHUy5pbmRleE9mKG5vZGVOYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgICAvLyBUaGUgdmVyeSBmaXJzdCBub2RlIGluIHRoZSBsaXN0IHNob3VsZCBub3QgaGF2ZSBsZWFkaW5nXG4gICAgICAgICAgLy8gd2hpdGVzcGFjZS4gU2libGluZyB0ZXh0IG5vZGVzIHNob3VsZCBoYXZlIHdoaXRlc3BhY2UgaWYgdGhlcmVcbiAgICAgICAgICAvLyB3YXMgYW55LlxuICAgICAgICAgIGxlYWRlciA9IGkgPT09IDAgPyAnJyA6ICcgJ1xuICAgICAgICAgIHZhbHVlID0gbGFzdENoaWxkLm5vZGVWYWx1ZVxuICAgICAgICAgICAgLnJlcGxhY2UobGVhZGluZ05ld2xpbmVSZWdleCwgbGVhZGVyKVxuICAgICAgICAgICAgLnJlcGxhY2UobGVhZGluZ1NwYWNlUmVnZXgsICcgJylcbiAgICAgICAgICAgIC5yZXBsYWNlKHRyYWlsaW5nU3BhY2VSZWdleCwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSh0cmFpbGluZ05ld2xpbmVSZWdleCwgJycpXG4gICAgICAgICAgICAucmVwbGFjZShtdWx0aVNwYWNlUmVnZXgsICcgJylcbiAgICAgICAgICBsYXN0Q2hpbGQubm9kZVZhbHVlID0gdmFsdWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgLy8gSXRlcmF0ZSBvdmVyIERPTSBub2Rlc1xuICAgIH0gZWxzZSBpZiAobm9kZSAmJiBub2RlLm5vZGVUeXBlKSB7XG4gICAgICAvLyBJZiB0aGUgbGFzdCBub2RlIHdhcyBhIHRleHQgbm9kZSwgbWFrZSBzdXJlIGl0IGlzIHByb3Blcmx5IGNsb3NlZCBvdXRcbiAgICAgIGlmIChoYWRUZXh0KSB7XG4gICAgICAgIGhhZFRleHQgPSBmYWxzZVxuXG4gICAgICAgIC8vIFRyaW0gdGhlIGNoaWxkIHRleHQgbm9kZXMgaWYgdGhlIGN1cnJlbnQgbm9kZSBpc24ndCBhXG4gICAgICAgIC8vIHRleHQgbm9kZSBvciBhIGNvZGUgbm9kZVxuICAgICAgICBpZiAoVEVYVF9UQUdTLmluZGV4T2Yobm9kZU5hbWUpID09PSAtMSAmJlxuICAgICAgICAgIFZFUkJBVElNX1RBR1MuaW5kZXhPZihub2RlTmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgdmFsdWUgPSBsYXN0Q2hpbGQubm9kZVZhbHVlXG4gICAgICAgICAgICAucmVwbGFjZShsZWFkaW5nTmV3bGluZVJlZ2V4LCAnJylcbiAgICAgICAgICAgIC5yZXBsYWNlKHRyYWlsaW5nTmV3bGluZVJlZ2V4LCAnICcpXG4gICAgICAgICAgICAucmVwbGFjZShtdWx0aVNwYWNlUmVnZXgsICcgJylcblxuICAgICAgICAgIC8vIFJlbW92ZSBlbXB0eSB0ZXh0IG5vZGVzLCBhcHBlbmQgb3RoZXJ3aXNlXG4gICAgICAgICAgaWYgKHZhbHVlID09PSAnJykge1xuICAgICAgICAgICAgZWwucmVtb3ZlQ2hpbGQobGFzdENoaWxkKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXN0Q2hpbGQubm9kZVZhbHVlID0gdmFsdWVcbiAgICAgICAgICB9XG4gICAgICAgIC8vIFRyaW0gdGhlIGNoaWxkIG5vZGVzIGJ1dCBwcmVzZXJ2ZSB0aGUgYXBwcm9wcmlhdGUgd2hpdGVzcGFjZVxuICAgICAgICB9IGVsc2UgaWYgKFZFUkJBVElNX1RBR1MuaW5kZXhPZihub2RlTmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgdmFsdWUgPSBsYXN0Q2hpbGQubm9kZVZhbHVlXG4gICAgICAgICAgICAucmVwbGFjZShsZWFkaW5nU3BhY2VSZWdleCwgJyAnKVxuICAgICAgICAgICAgLnJlcGxhY2UobGVhZGluZ05ld2xpbmVSZWdleCwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSh0cmFpbGluZ05ld2xpbmVSZWdleCwgJyAnKVxuICAgICAgICAgICAgLnJlcGxhY2UobXVsdGlTcGFjZVJlZ2V4LCAnICcpXG4gICAgICAgICAgbGFzdENoaWxkLm5vZGVWYWx1ZSA9IHZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU3RvcmUgdGhlIGxhc3Qgbm9kZW5hbWVcbiAgICAgIHZhciBfbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lXG4gICAgICBpZiAoX25vZGVOYW1lKSBub2RlTmFtZSA9IF9ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cbiAgICAgIC8vIEFwcGVuZCB0aGUgbm9kZSB0byB0aGUgRE9NXG4gICAgICBlbC5hcHBlbmRDaGlsZChub2RlKVxuICAgIH1cbiAgfVxufVxuIiwidmFyIGFzc2VydCA9IHJlcXVpcmUoJ25hbm9hc3NlcnQnKVxudmFyIG1vcnBoID0gcmVxdWlyZSgnLi9saWIvbW9ycGgnKVxuXG52YXIgVEVYVF9OT0RFID0gM1xuLy8gdmFyIERFQlVHID0gZmFsc2VcblxubW9kdWxlLmV4cG9ydHMgPSBuYW5vbW9ycGhcblxuLy8gTW9ycGggb25lIHRyZWUgaW50byBhbm90aGVyIHRyZWVcbi8vXG4vLyBubyBwYXJlbnRcbi8vICAgLT4gc2FtZTogZGlmZiBhbmQgd2FsayBjaGlsZHJlblxuLy8gICAtPiBub3Qgc2FtZTogcmVwbGFjZSBhbmQgcmV0dXJuXG4vLyBvbGQgbm9kZSBkb2Vzbid0IGV4aXN0XG4vLyAgIC0+IGluc2VydCBuZXcgbm9kZVxuLy8gbmV3IG5vZGUgZG9lc24ndCBleGlzdFxuLy8gICAtPiBkZWxldGUgb2xkIG5vZGVcbi8vIG5vZGVzIGFyZSBub3QgdGhlIHNhbWVcbi8vICAgLT4gZGlmZiBub2RlcyBhbmQgYXBwbHkgcGF0Y2ggdG8gb2xkIG5vZGVcbi8vIG5vZGVzIGFyZSB0aGUgc2FtZVxuLy8gICAtPiB3YWxrIGFsbCBjaGlsZCBub2RlcyBhbmQgYXBwZW5kIHRvIG9sZCBub2RlXG5mdW5jdGlvbiBuYW5vbW9ycGggKG9sZFRyZWUsIG5ld1RyZWUsIG9wdGlvbnMpIHtcbiAgLy8gaWYgKERFQlVHKSB7XG4gIC8vICAgY29uc29sZS5sb2coXG4gIC8vICAgJ25hbm9tb3JwaFxcbm9sZFxcbiAgJXNcXG5uZXdcXG4gICVzJyxcbiAgLy8gICBvbGRUcmVlICYmIG9sZFRyZWUub3V0ZXJIVE1MLFxuICAvLyAgIG5ld1RyZWUgJiYgbmV3VHJlZS5vdXRlckhUTUxcbiAgLy8gKVxuICAvLyB9XG4gIGFzc2VydC5lcXVhbCh0eXBlb2Ygb2xkVHJlZSwgJ29iamVjdCcsICduYW5vbW9ycGg6IG9sZFRyZWUgc2hvdWxkIGJlIGFuIG9iamVjdCcpXG4gIGFzc2VydC5lcXVhbCh0eXBlb2YgbmV3VHJlZSwgJ29iamVjdCcsICduYW5vbW9ycGg6IG5ld1RyZWUgc2hvdWxkIGJlIGFuIG9iamVjdCcpXG5cbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5jaGlsZHJlbk9ubHkpIHtcbiAgICB1cGRhdGVDaGlsZHJlbihuZXdUcmVlLCBvbGRUcmVlKVxuICAgIHJldHVybiBvbGRUcmVlXG4gIH1cblxuICBhc3NlcnQubm90RXF1YWwoXG4gICAgbmV3VHJlZS5ub2RlVHlwZSxcbiAgICAxMSxcbiAgICAnbmFub21vcnBoOiBuZXdUcmVlIHNob3VsZCBoYXZlIG9uZSByb290IG5vZGUgKHdoaWNoIGlzIG5vdCBhIERvY3VtZW50RnJhZ21lbnQpJ1xuICApXG5cbiAgcmV0dXJuIHdhbGsobmV3VHJlZSwgb2xkVHJlZSlcbn1cblxuLy8gV2FsayBhbmQgbW9ycGggYSBkb20gdHJlZVxuZnVuY3Rpb24gd2FsayAobmV3Tm9kZSwgb2xkTm9kZSkge1xuICAvLyBpZiAoREVCVUcpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcbiAgLy8gICAnd2Fsa1xcbm9sZFxcbiAgJXNcXG5uZXdcXG4gICVzJyxcbiAgLy8gICBvbGROb2RlICYmIG9sZE5vZGUub3V0ZXJIVE1MLFxuICAvLyAgIG5ld05vZGUgJiYgbmV3Tm9kZS5vdXRlckhUTUxcbiAgLy8gKVxuICAvLyB9XG4gIGlmICghb2xkTm9kZSkge1xuICAgIHJldHVybiBuZXdOb2RlXG4gIH0gZWxzZSBpZiAoIW5ld05vZGUpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9IGVsc2UgaWYgKG5ld05vZGUuaXNTYW1lTm9kZSAmJiBuZXdOb2RlLmlzU2FtZU5vZGUob2xkTm9kZSkpIHtcbiAgICByZXR1cm4gb2xkTm9kZVxuICB9IGVsc2UgaWYgKG5ld05vZGUudGFnTmFtZSAhPT0gb2xkTm9kZS50YWdOYW1lIHx8IGdldENvbXBvbmVudElkKG5ld05vZGUpICE9PSBnZXRDb21wb25lbnRJZChvbGROb2RlKSkge1xuICAgIHJldHVybiBuZXdOb2RlXG4gIH0gZWxzZSB7XG4gICAgbW9ycGgobmV3Tm9kZSwgb2xkTm9kZSlcbiAgICB1cGRhdGVDaGlsZHJlbihuZXdOb2RlLCBvbGROb2RlKVxuICAgIHJldHVybiBvbGROb2RlXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50SWQgKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUuZGF0YXNldCA/IG5vZGUuZGF0YXNldC5uYW5vbW9ycGhDb21wb25lbnRJZCA6IHVuZGVmaW5lZFxufVxuXG4vLyBVcGRhdGUgdGhlIGNoaWxkcmVuIG9mIGVsZW1lbnRzXG4vLyAob2JqLCBvYmopIC0+IG51bGxcbmZ1bmN0aW9uIHVwZGF0ZUNoaWxkcmVuIChuZXdOb2RlLCBvbGROb2RlKSB7XG4gIC8vIGlmIChERUJVRykge1xuICAvLyAgIGNvbnNvbGUubG9nKFxuICAvLyAgICd1cGRhdGVDaGlsZHJlblxcbm9sZFxcbiAgJXNcXG5uZXdcXG4gICVzJyxcbiAgLy8gICBvbGROb2RlICYmIG9sZE5vZGUub3V0ZXJIVE1MLFxuICAvLyAgIG5ld05vZGUgJiYgbmV3Tm9kZS5vdXRlckhUTUxcbiAgLy8gKVxuICAvLyB9XG4gIHZhciBvbGRDaGlsZCwgbmV3Q2hpbGQsIG1vcnBoZWQsIG9sZE1hdGNoXG5cbiAgLy8gVGhlIG9mZnNldCBpcyBvbmx5IGV2ZXIgaW5jcmVhc2VkLCBhbmQgdXNlZCBmb3IgW2kgLSBvZmZzZXRdIGluIHRoZSBsb29wXG4gIHZhciBvZmZzZXQgPSAwXG5cbiAgZm9yICh2YXIgaSA9IDA7IDsgaSsrKSB7XG4gICAgb2xkQ2hpbGQgPSBvbGROb2RlLmNoaWxkTm9kZXNbaV1cbiAgICBuZXdDaGlsZCA9IG5ld05vZGUuY2hpbGROb2Rlc1tpIC0gb2Zmc2V0XVxuICAgIC8vIGlmIChERUJVRykge1xuICAgIC8vICAgY29uc29sZS5sb2coXG4gICAgLy8gICAnPT09XFxuLSBvbGRcXG4gICVzXFxuLSBuZXdcXG4gICVzJyxcbiAgICAvLyAgIG9sZENoaWxkICYmIG9sZENoaWxkLm91dGVySFRNTCxcbiAgICAvLyAgIG5ld0NoaWxkICYmIG5ld0NoaWxkLm91dGVySFRNTFxuICAgIC8vIClcbiAgICAvLyB9XG4gICAgLy8gQm90aCBub2RlcyBhcmUgZW1wdHksIGRvIG5vdGhpbmdcbiAgICBpZiAoIW9sZENoaWxkICYmICFuZXdDaGlsZCkge1xuICAgICAgYnJlYWtcblxuICAgIC8vIFRoZXJlIGlzIG5vIG5ldyBjaGlsZCwgcmVtb3ZlIG9sZFxuICAgIH0gZWxzZSBpZiAoIW5ld0NoaWxkKSB7XG4gICAgICBvbGROb2RlLnJlbW92ZUNoaWxkKG9sZENoaWxkKVxuICAgICAgaS0tXG5cbiAgICAvLyBUaGVyZSBpcyBubyBvbGQgY2hpbGQsIGFkZCBuZXdcbiAgICB9IGVsc2UgaWYgKCFvbGRDaGlsZCkge1xuICAgICAgb2xkTm9kZS5hcHBlbmRDaGlsZChuZXdDaGlsZClcbiAgICAgIG9mZnNldCsrXG5cbiAgICAvLyBCb3RoIG5vZGVzIGFyZSB0aGUgc2FtZSwgbW9ycGhcbiAgICB9IGVsc2UgaWYgKHNhbWUobmV3Q2hpbGQsIG9sZENoaWxkKSkge1xuICAgICAgbW9ycGhlZCA9IHdhbGsobmV3Q2hpbGQsIG9sZENoaWxkKVxuICAgICAgaWYgKG1vcnBoZWQgIT09IG9sZENoaWxkKSB7XG4gICAgICAgIG9sZE5vZGUucmVwbGFjZUNoaWxkKG1vcnBoZWQsIG9sZENoaWxkKVxuICAgICAgICBvZmZzZXQrK1xuICAgICAgfVxuXG4gICAgLy8gQm90aCBub2RlcyBkbyBub3Qgc2hhcmUgYW4gSUQgb3IgYSBwbGFjZWhvbGRlciwgdHJ5IHJlb3JkZXJcbiAgICB9IGVsc2Uge1xuICAgICAgb2xkTWF0Y2ggPSBudWxsXG5cbiAgICAgIC8vIFRyeSBhbmQgZmluZCBhIHNpbWlsYXIgbm9kZSBzb21ld2hlcmUgaW4gdGhlIHRyZWVcbiAgICAgIGZvciAodmFyIGogPSBpOyBqIDwgb2xkTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChzYW1lKG9sZE5vZGUuY2hpbGROb2Rlc1tqXSwgbmV3Q2hpbGQpKSB7XG4gICAgICAgICAgb2xkTWF0Y2ggPSBvbGROb2RlLmNoaWxkTm9kZXNbal1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZXJlIHdhcyBhIG5vZGUgd2l0aCB0aGUgc2FtZSBJRCBvciBwbGFjZWhvbGRlciBpbiB0aGUgb2xkIGxpc3RcbiAgICAgIGlmIChvbGRNYXRjaCkge1xuICAgICAgICBtb3JwaGVkID0gd2FsayhuZXdDaGlsZCwgb2xkTWF0Y2gpXG4gICAgICAgIGlmIChtb3JwaGVkICE9PSBvbGRNYXRjaCkgb2Zmc2V0KytcbiAgICAgICAgb2xkTm9kZS5pbnNlcnRCZWZvcmUobW9ycGhlZCwgb2xkQ2hpbGQpXG5cbiAgICAgIC8vIEl0J3Mgc2FmZSB0byBtb3JwaCB0d28gbm9kZXMgaW4tcGxhY2UgaWYgbmVpdGhlciBoYXMgYW4gSURcbiAgICAgIH0gZWxzZSBpZiAoIW5ld0NoaWxkLmlkICYmICFvbGRDaGlsZC5pZCkge1xuICAgICAgICBtb3JwaGVkID0gd2FsayhuZXdDaGlsZCwgb2xkQ2hpbGQpXG4gICAgICAgIGlmIChtb3JwaGVkICE9PSBvbGRDaGlsZCkge1xuICAgICAgICAgIG9sZE5vZGUucmVwbGFjZUNoaWxkKG1vcnBoZWQsIG9sZENoaWxkKVxuICAgICAgICAgIG9mZnNldCsrXG4gICAgICAgIH1cblxuICAgICAgLy8gSW5zZXJ0IHRoZSBub2RlIGF0IHRoZSBpbmRleCBpZiB3ZSBjb3VsZG4ndCBtb3JwaCBvciBmaW5kIGEgbWF0Y2hpbmcgbm9kZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2xkTm9kZS5pbnNlcnRCZWZvcmUobmV3Q2hpbGQsIG9sZENoaWxkKVxuICAgICAgICBvZmZzZXQrK1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzYW1lIChhLCBiKSB7XG4gIGlmIChhLmlkKSByZXR1cm4gYS5pZCA9PT0gYi5pZFxuICBpZiAoYS5pc1NhbWVOb2RlKSByZXR1cm4gYS5pc1NhbWVOb2RlKGIpXG4gIGlmIChhLnRhZ05hbWUgIT09IGIudGFnTmFtZSkgcmV0dXJuIGZhbHNlXG4gIGlmIChhLnR5cGUgPT09IFRFWFRfTk9ERSkgcmV0dXJuIGEubm9kZVZhbHVlID09PSBiLm5vZGVWYWx1ZVxuICByZXR1cm4gZmFsc2Vcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAvLyBhdHRyaWJ1dGUgZXZlbnRzIChjYW4gYmUgc2V0IHdpdGggYXR0cmlidXRlcylcbiAgJ29uY2xpY2snLFxuICAnb25kYmxjbGljaycsXG4gICdvbm1vdXNlZG93bicsXG4gICdvbm1vdXNldXAnLFxuICAnb25tb3VzZW92ZXInLFxuICAnb25tb3VzZW1vdmUnLFxuICAnb25tb3VzZW91dCcsXG4gICdvbm1vdXNlZW50ZXInLFxuICAnb25tb3VzZWxlYXZlJyxcbiAgJ29udG91Y2hjYW5jZWwnLFxuICAnb250b3VjaGVuZCcsXG4gICdvbnRvdWNobW92ZScsXG4gICdvbnRvdWNoc3RhcnQnLFxuICAnb25kcmFnc3RhcnQnLFxuICAnb25kcmFnJyxcbiAgJ29uZHJhZ2VudGVyJyxcbiAgJ29uZHJhZ2xlYXZlJyxcbiAgJ29uZHJhZ292ZXInLFxuICAnb25kcm9wJyxcbiAgJ29uZHJhZ2VuZCcsXG4gICdvbmtleWRvd24nLFxuICAnb25rZXlwcmVzcycsXG4gICdvbmtleXVwJyxcbiAgJ29udW5sb2FkJyxcbiAgJ29uYWJvcnQnLFxuICAnb25lcnJvcicsXG4gICdvbnJlc2l6ZScsXG4gICdvbnNjcm9sbCcsXG4gICdvbnNlbGVjdCcsXG4gICdvbmNoYW5nZScsXG4gICdvbnN1Ym1pdCcsXG4gICdvbnJlc2V0JyxcbiAgJ29uZm9jdXMnLFxuICAnb25ibHVyJyxcbiAgJ29uaW5wdXQnLFxuICAvLyBvdGhlciBjb21tb24gZXZlbnRzXG4gICdvbmNvbnRleHRtZW51JyxcbiAgJ29uZm9jdXNpbicsXG4gICdvbmZvY3Vzb3V0J1xuXVxuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJylcbnZhciBldmVudHNMZW5ndGggPSBldmVudHMubGVuZ3RoXG5cbnZhciBFTEVNRU5UX05PREUgPSAxXG52YXIgVEVYVF9OT0RFID0gM1xudmFyIENPTU1FTlRfTk9ERSA9IDhcblxubW9kdWxlLmV4cG9ydHMgPSBtb3JwaFxuXG4vLyBkaWZmIGVsZW1lbnRzIGFuZCBhcHBseSB0aGUgcmVzdWx0aW5nIHBhdGNoIHRvIHRoZSBvbGQgbm9kZVxuLy8gKG9iaiwgb2JqKSAtPiBudWxsXG5mdW5jdGlvbiBtb3JwaCAobmV3Tm9kZSwgb2xkTm9kZSkge1xuICB2YXIgbm9kZVR5cGUgPSBuZXdOb2RlLm5vZGVUeXBlXG4gIHZhciBub2RlTmFtZSA9IG5ld05vZGUubm9kZU5hbWVcblxuICBpZiAobm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSkge1xuICAgIGNvcHlBdHRycyhuZXdOb2RlLCBvbGROb2RlKVxuICB9XG5cbiAgaWYgKG5vZGVUeXBlID09PSBURVhUX05PREUgfHwgbm9kZVR5cGUgPT09IENPTU1FTlRfTk9ERSkge1xuICAgIGlmIChvbGROb2RlLm5vZGVWYWx1ZSAhPT0gbmV3Tm9kZS5ub2RlVmFsdWUpIHtcbiAgICAgIG9sZE5vZGUubm9kZVZhbHVlID0gbmV3Tm9kZS5ub2RlVmFsdWVcbiAgICB9XG4gIH1cblxuICAvLyBTb21lIERPTSBub2RlcyBhcmUgd2VpcmRcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BhdHJpY2stc3RlZWxlLWlkZW0vbW9ycGhkb20vYmxvYi9tYXN0ZXIvc3JjL3NwZWNpYWxFbEhhbmRsZXJzLmpzXG4gIGlmIChub2RlTmFtZSA9PT0gJ0lOUFVUJykgdXBkYXRlSW5wdXQobmV3Tm9kZSwgb2xkTm9kZSlcbiAgZWxzZSBpZiAobm9kZU5hbWUgPT09ICdPUFRJT04nKSB1cGRhdGVPcHRpb24obmV3Tm9kZSwgb2xkTm9kZSlcbiAgZWxzZSBpZiAobm9kZU5hbWUgPT09ICdURVhUQVJFQScpIHVwZGF0ZVRleHRhcmVhKG5ld05vZGUsIG9sZE5vZGUpXG5cbiAgY29weUV2ZW50cyhuZXdOb2RlLCBvbGROb2RlKVxufVxuXG5mdW5jdGlvbiBjb3B5QXR0cnMgKG5ld05vZGUsIG9sZE5vZGUpIHtcbiAgdmFyIG9sZEF0dHJzID0gb2xkTm9kZS5hdHRyaWJ1dGVzXG4gIHZhciBuZXdBdHRycyA9IG5ld05vZGUuYXR0cmlidXRlc1xuICB2YXIgYXR0ck5hbWVzcGFjZVVSSSA9IG51bGxcbiAgdmFyIGF0dHJWYWx1ZSA9IG51bGxcbiAgdmFyIGZyb21WYWx1ZSA9IG51bGxcbiAgdmFyIGF0dHJOYW1lID0gbnVsbFxuICB2YXIgYXR0ciA9IG51bGxcblxuICBmb3IgKHZhciBpID0gbmV3QXR0cnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICBhdHRyID0gbmV3QXR0cnNbaV1cbiAgICBhdHRyTmFtZSA9IGF0dHIubmFtZVxuICAgIGF0dHJOYW1lc3BhY2VVUkkgPSBhdHRyLm5hbWVzcGFjZVVSSVxuICAgIGF0dHJWYWx1ZSA9IGF0dHIudmFsdWVcbiAgICBpZiAoYXR0ck5hbWVzcGFjZVVSSSkge1xuICAgICAgYXR0ck5hbWUgPSBhdHRyLmxvY2FsTmFtZSB8fCBhdHRyTmFtZVxuICAgICAgZnJvbVZhbHVlID0gb2xkTm9kZS5nZXRBdHRyaWJ1dGVOUyhhdHRyTmFtZXNwYWNlVVJJLCBhdHRyTmFtZSlcbiAgICAgIGlmIChmcm9tVmFsdWUgIT09IGF0dHJWYWx1ZSkge1xuICAgICAgICBvbGROb2RlLnNldEF0dHJpYnV0ZU5TKGF0dHJOYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsdWUpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghb2xkTm9kZS5oYXNBdHRyaWJ1dGUoYXR0ck5hbWUpKSB7XG4gICAgICAgIG9sZE5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBhdHRyVmFsdWUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmcm9tVmFsdWUgPSBvbGROb2RlLmdldEF0dHJpYnV0ZShhdHRyTmFtZSlcbiAgICAgICAgaWYgKGZyb21WYWx1ZSAhPT0gYXR0clZhbHVlKSB7XG4gICAgICAgICAgLy8gYXBwYXJlbnRseSB2YWx1ZXMgYXJlIGFsd2F5cyBjYXN0IHRvIHN0cmluZ3MsIGFoIHdlbGxcbiAgICAgICAgICBpZiAoYXR0clZhbHVlID09PSAnbnVsbCcgfHwgYXR0clZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgb2xkTm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9sZE5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBhdHRyVmFsdWUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIGFueSBleHRyYSBhdHRyaWJ1dGVzIGZvdW5kIG9uIHRoZSBvcmlnaW5hbCBET00gZWxlbWVudCB0aGF0XG4gIC8vIHdlcmVuJ3QgZm91bmQgb24gdGhlIHRhcmdldCBlbGVtZW50LlxuICBmb3IgKHZhciBqID0gb2xkQXR0cnMubGVuZ3RoIC0gMTsgaiA+PSAwOyAtLWopIHtcbiAgICBhdHRyID0gb2xkQXR0cnNbal1cbiAgICBpZiAoYXR0ci5zcGVjaWZpZWQgIT09IGZhbHNlKSB7XG4gICAgICBhdHRyTmFtZSA9IGF0dHIubmFtZVxuICAgICAgYXR0ck5hbWVzcGFjZVVSSSA9IGF0dHIubmFtZXNwYWNlVVJJXG5cbiAgICAgIGlmIChhdHRyTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIGF0dHJOYW1lID0gYXR0ci5sb2NhbE5hbWUgfHwgYXR0ck5hbWVcbiAgICAgICAgaWYgKCFuZXdOb2RlLmhhc0F0dHJpYnV0ZU5TKGF0dHJOYW1lc3BhY2VVUkksIGF0dHJOYW1lKSkge1xuICAgICAgICAgIG9sZE5vZGUucmVtb3ZlQXR0cmlidXRlTlMoYXR0ck5hbWVzcGFjZVVSSSwgYXR0ck5hbWUpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghbmV3Tm9kZS5oYXNBdHRyaWJ1dGVOUyhudWxsLCBhdHRyTmFtZSkpIHtcbiAgICAgICAgICBvbGROb2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjb3B5RXZlbnRzIChuZXdOb2RlLCBvbGROb2RlKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnRzTGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZXYgPSBldmVudHNbaV1cbiAgICBpZiAobmV3Tm9kZVtldl0pIHsgICAgICAgICAgIC8vIGlmIG5ldyBlbGVtZW50IGhhcyBhIHdoaXRlbGlzdGVkIGF0dHJpYnV0ZVxuICAgICAgb2xkTm9kZVtldl0gPSBuZXdOb2RlW2V2XSAgLy8gdXBkYXRlIGV4aXN0aW5nIGVsZW1lbnRcbiAgICB9IGVsc2UgaWYgKG9sZE5vZGVbZXZdKSB7ICAgIC8vIGlmIGV4aXN0aW5nIGVsZW1lbnQgaGFzIGl0IGFuZCBuZXcgb25lIGRvZXNudFxuICAgICAgb2xkTm9kZVtldl0gPSB1bmRlZmluZWQgICAgLy8gcmVtb3ZlIGl0IGZyb20gZXhpc3RpbmcgZWxlbWVudFxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVPcHRpb24gKG5ld05vZGUsIG9sZE5vZGUpIHtcbiAgdXBkYXRlQXR0cmlidXRlKG5ld05vZGUsIG9sZE5vZGUsICdzZWxlY3RlZCcpXG59XG5cbi8vIFRoZSBcInZhbHVlXCIgYXR0cmlidXRlIGlzIHNwZWNpYWwgZm9yIHRoZSA8aW5wdXQ+IGVsZW1lbnQgc2luY2UgaXQgc2V0cyB0aGVcbi8vIGluaXRpYWwgdmFsdWUuIENoYW5naW5nIHRoZSBcInZhbHVlXCIgYXR0cmlidXRlIHdpdGhvdXQgY2hhbmdpbmcgdGhlIFwidmFsdWVcIlxuLy8gcHJvcGVydHkgd2lsbCBoYXZlIG5vIGVmZmVjdCBzaW5jZSBpdCBpcyBvbmx5IHVzZWQgdG8gdGhlIHNldCB0aGUgaW5pdGlhbFxuLy8gdmFsdWUuIFNpbWlsYXIgZm9yIHRoZSBcImNoZWNrZWRcIiBhdHRyaWJ1dGUsIGFuZCBcImRpc2FibGVkXCIuXG5mdW5jdGlvbiB1cGRhdGVJbnB1dCAobmV3Tm9kZSwgb2xkTm9kZSkge1xuICB2YXIgbmV3VmFsdWUgPSBuZXdOb2RlLnZhbHVlXG4gIHZhciBvbGRWYWx1ZSA9IG9sZE5vZGUudmFsdWVcblxuICB1cGRhdGVBdHRyaWJ1dGUobmV3Tm9kZSwgb2xkTm9kZSwgJ2NoZWNrZWQnKVxuICB1cGRhdGVBdHRyaWJ1dGUobmV3Tm9kZSwgb2xkTm9kZSwgJ2Rpc2FibGVkJylcblxuICBpZiAobmV3VmFsdWUgIT09IG9sZFZhbHVlKSB7XG4gICAgb2xkTm9kZS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgbmV3VmFsdWUpXG4gICAgb2xkTm9kZS52YWx1ZSA9IG5ld1ZhbHVlXG4gIH1cblxuICBpZiAobmV3VmFsdWUgPT09ICdudWxsJykge1xuICAgIG9sZE5vZGUudmFsdWUgPSAnJ1xuICAgIG9sZE5vZGUucmVtb3ZlQXR0cmlidXRlKCd2YWx1ZScpXG4gIH1cblxuICBpZiAoIW5ld05vZGUuaGFzQXR0cmlidXRlTlMobnVsbCwgJ3ZhbHVlJykpIHtcbiAgICBvbGROb2RlLnJlbW92ZUF0dHJpYnV0ZSgndmFsdWUnKVxuICB9IGVsc2UgaWYgKG9sZE5vZGUudHlwZSA9PT0gJ3JhbmdlJykge1xuICAgIC8vIHRoaXMgaXMgc28gZWxlbWVudHMgbGlrZSBzbGlkZXIgbW92ZSB0aGVpciBVSSB0aGluZ3lcbiAgICBvbGROb2RlLnZhbHVlID0gbmV3VmFsdWVcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVUZXh0YXJlYSAobmV3Tm9kZSwgb2xkTm9kZSkge1xuICB2YXIgbmV3VmFsdWUgPSBuZXdOb2RlLnZhbHVlXG4gIGlmIChuZXdWYWx1ZSAhPT0gb2xkTm9kZS52YWx1ZSkge1xuICAgIG9sZE5vZGUudmFsdWUgPSBuZXdWYWx1ZVxuICB9XG5cbiAgaWYgKG9sZE5vZGUuZmlyc3RDaGlsZCAmJiBvbGROb2RlLmZpcnN0Q2hpbGQubm9kZVZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgIC8vIE5lZWRlZCBmb3IgSUUuIEFwcGFyZW50bHkgSUUgc2V0cyB0aGUgcGxhY2Vob2xkZXIgYXMgdGhlXG4gICAgLy8gbm9kZSB2YWx1ZSBhbmQgdmlzZSB2ZXJzYS4gVGhpcyBpZ25vcmVzIGFuIGVtcHR5IHVwZGF0ZS5cbiAgICBpZiAobmV3VmFsdWUgPT09ICcnICYmIG9sZE5vZGUuZmlyc3RDaGlsZC5ub2RlVmFsdWUgPT09IG9sZE5vZGUucGxhY2Vob2xkZXIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIG9sZE5vZGUuZmlyc3RDaGlsZC5ub2RlVmFsdWUgPSBuZXdWYWx1ZVxuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUF0dHJpYnV0ZSAobmV3Tm9kZSwgb2xkTm9kZSwgbmFtZSkge1xuICBpZiAobmV3Tm9kZVtuYW1lXSAhPT0gb2xkTm9kZVtuYW1lXSkge1xuICAgIG9sZE5vZGVbbmFtZV0gPSBuZXdOb2RlW25hbWVdXG4gICAgaWYgKG5ld05vZGVbbmFtZV0pIHtcbiAgICAgIG9sZE5vZGUuc2V0QXR0cmlidXRlKG5hbWUsICcnKVxuICAgIH0gZWxzZSB7XG4gICAgICBvbGROb2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKVxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXHJcblxyXG52YXIgZHVyYXRpb24gPSAvKC0/XFxkKlxcLj9cXGQrKD86ZVstK10/XFxkKyk/KVxccyooW2Etes68XSopL2lnXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlXHJcblxyXG4vKipcclxuICogY29udmVyc2lvbiByYXRpb3NcclxuICovXHJcblxyXG5wYXJzZS5uYW5vc2Vjb25kID1cclxucGFyc2UubnMgPSAxIC8gMWU2XHJcblxyXG5wYXJzZVsnzrxzJ10gPVxyXG5wYXJzZS5taWNyb3NlY29uZCA9IDEgLyAxZTNcclxuXHJcbnBhcnNlLm1pbGxpc2Vjb25kID1cclxucGFyc2UubXMgPSAxXHJcblxyXG5wYXJzZS5zZWNvbmQgPVxyXG5wYXJzZS5zZWMgPVxyXG5wYXJzZS5zID0gcGFyc2UubXMgKiAxMDAwXHJcblxyXG5wYXJzZS5taW51dGUgPVxyXG5wYXJzZS5taW4gPVxyXG5wYXJzZS5tID0gcGFyc2UucyAqIDYwXHJcblxyXG5wYXJzZS5ob3VyID1cclxucGFyc2UuaHIgPVxyXG5wYXJzZS5oID0gcGFyc2UubSAqIDYwXHJcblxyXG5wYXJzZS5kYXkgPVxyXG5wYXJzZS5kID0gcGFyc2UuaCAqIDI0XHJcblxyXG5wYXJzZS53ZWVrID1cclxucGFyc2Uud2sgPVxyXG5wYXJzZS53ID0gcGFyc2UuZCAqIDdcclxuXHJcbnBhcnNlLmIgPVxyXG5wYXJzZS5tb250aCA9IHBhcnNlLmQgKiAoMzY1LjI1IC8gMTIpXHJcblxyXG5wYXJzZS55ZWFyID1cclxucGFyc2UueXIgPVxyXG5wYXJzZS55ID0gcGFyc2UuZCAqIDM2NS4yNVxyXG5cclxuLyoqXHJcbiAqIGNvbnZlcnQgYHN0cmAgdG8gbXNcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gcGFyc2Uoc3RyKXtcclxuICB2YXIgcmVzdWx0ID0gMFxyXG4gIC8vIGlnbm9yZSBjb21tYXNcclxuICBzdHIgPSBzdHIucmVwbGFjZSgvKFxcZCksKFxcZCkvZywgJyQxJDInKVxyXG4gIHN0ci5yZXBsYWNlKGR1cmF0aW9uLCBmdW5jdGlvbihfLCBuLCB1bml0cyl7XHJcbiAgICB1bml0cyA9IHBhcnNlW3VuaXRzXVxyXG4gICAgICB8fCBwYXJzZVt1bml0cy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL3MkLywgJycpXVxyXG4gICAgICB8fCAxXHJcbiAgICByZXN1bHQgKz0gcGFyc2VGbG9hdChuLCAxMCkgKiB1bml0c1xyXG4gIH0pXHJcbiAgcmV0dXJuIHJlc3VsdFxyXG59XHJcbiJdfQ==
