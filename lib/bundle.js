(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/Users/phx/Sync/sign-search/lib/search-engine/engine.js":[function(require,module,exports){
const SearchLibrary=require("../search-library/library-web"),VectorLibrary=require("../vector-library/library"),SearchQuery=require("./query"),VU=require("../vector-utilities"),fsutil=require("../util");class SearchEngine{constructor(r){this.ready=!1,this.readyHandlers=[],this.config=r}async load(){try{[this.searchLibrary,this.vectorLibrary]=await Promise.all([new SearchLibrary({path:this.config.searchLibraryPath}).open(),new VectorLibrary({path:this.config.vectorLibraryPath,fs:{readFile:fsutil.fetchLikeFile},digest:fsutil.digestOnWeb}).open()])}catch(r){throw this.readyHandlers.forEach(([e,t])=>t(r)),this.readyHandlers=[],r}this.ready=!0,this.readyHandlers.forEach(([r,e])=>r(this)),this.readyHandlers=[]}awaitReady(){return this.ready?Promise.resolve(this):new Promise((r,e)=>{this.readyHandlers.push([r,e])})}async query(r){await this.awaitReady();let e=new SearchQuery(r);await e.vectorize(this.vectorLibrary);let t=e.hashtags.filter(r=>r.positive).map(r=>r.text),a=e.hashtags.filter(r=>!r.positive).map(r=>r.text);return(await this.searchLibrary.query(r=>{if(t.some(e=>!r.tags.includes(e)))return!1;if(a.some(e=>r.tags.includes(e)))return!1;return r.terms.map(r=>Math.min(...e.keywords.map(e=>{if(e.constructor==SearchQuery.WordVector){if("string"!=typeof r)return VU.distanceSquared(e.vector,r)}else if("string"==typeof r){if(e.text==r)return 0;if(e.text.toLowerCase()==r.toLowerCase())return.25}return 10}))).reduce((r,e)=>r+e,0)+r.termDiversity/500})).sort((r,e)=>r.distance-e.distance)}async getTags(){return await this.awaitReady(),this.searchLibrary.getTags()}}module.exports=SearchEngine;

},{"../search-library/library-web":"/Users/phx/Sync/sign-search/lib/search-library/library-web.js","../util":"/Users/phx/Sync/sign-search/lib/util.js","../vector-library/library":"/Users/phx/Sync/sign-search/lib/vector-library/library.js","../vector-utilities":"/Users/phx/Sync/sign-search/lib/vector-utilities.js","./query":"/Users/phx/Sync/sign-search/lib/search-engine/query.js"}],"/Users/phx/Sync/sign-search/lib/search-engine/query.js":[function(require,module,exports){
class SearchQuery{constructor(t){this.rawTokens=t.trim().split(/[\t\n,?!;:\[\]\(\){} "”“]+/).filter(t=>t.toString().trim().length>0),this.tokens=this.rawTokens.map(t=>{if(t.match(/^-#([a-zA-Z0-9._-]+)$/))return new HashtagToken(t.slice(2),!1);if(t.match(/^#([a-zA-Z0-9._-]+)$/))return new HashtagToken(t.slice(1),!0);{let r=t.trim().replace(/‘/g,"'");return(r.match(/[a-z]/)||r.length<2)&&(r=r.toLowerCase()),new KeywordToken(r)}})}async vectorize(t){return this.tokens=await Promise.all(this.tokens.map(async r=>{if(r.constructor==KeywordToken){let e=await t.lookup(r);return e?new WordVector(r,e):r}return r})),this}get keywords(){return this.tokens.filter(t=>t.constructor==KeywordToken||t.constructor==WordVector)}get hashtags(){return this.tokens.filter(t=>t.constructor==HashtagToken)}toString(){return this.tokens.join(" ")}}class HashtagToken{constructor(t,r=!0){this.text=t.toString(),this.positive=!!r}toString(){return`${this.positive?"#":"-#"}${this.text}`}}class KeywordToken{constructor(t){this.text=t.toString()}toString(){return this.text}toQuery(){return this.text}}class WordVector{constructor(t,r){this.text=t.toString(),this.vector=r}toString(){return this.text}toQuery(){return this.vector}}SearchQuery.HashtagToken=HashtagToken,SearchQuery.KeywordToken=KeywordToken,SearchQuery.WordVector=WordVector,module.exports=SearchQuery;

},{}],"/Users/phx/Sync/sign-search/lib/search-engine/view-paginator.js":[function(require,module,exports){
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
const SearchEngine=require("./search-engine/engine"),ResultView=require("./search-engine/view-result"),Paginator=require("./search-engine/view-paginator"),html={},morph=require("nanomorph"),parseDuration=require("parse-duration"),delay=require("delay"),qs=(...e)=>document.querySelector(...e),qsa=(...e)=>document.querySelectorAll(...e);class FindSignUI{constructor(e){this.config=e,this.searchEngine=new SearchEngine(e)}async load(){await this.searchEngine.load()}awaitReady(){return this.searchEngine.awaitReady()}async addHooks(){window.onhashchange=(()=>this.onHashChange(location.hash.replace(/^#/,""))),qs(this.config.searchForm).onsubmit=(e=>{let t=qs(this.config.searchInput).value;e.preventDefault(),location.href=`#${encodeURIComponent(t)}/0`}),""!=location.hash&&"#"!=location.hash&&this.onHashChange(location.hash.replace(/^#/,""))}onHashChange(e){""==e?this.renderHome(e):this.renderSearch(e)}renderHome(e){location.hash="#",qs("html > body").className="home",qs(this.config.resultsContainer).innerHTML="",qs(this.config.paginationContainer).innerHTML="",qs(this.config.searchInput).value="",qs(this.config.searchInput).focus()}async renderSearch(e){let[t,n]=e.split("/").map(e=>decodeURIComponent(e));if(0==t.trim().length)return location.href="#";if(qs(this.config.searchInput).value=t,this.searchEngine.ready?this.ariaNotice("Loading…","off").focus():this.visualNotice("Loading…"),this.results=await this.searchEngine.query(t),0==this.results.length)return this.visualNotice("No search results found.","live");qs("html > body").className="results",qs(this.config.resultsContainer).innerHTML="",qs(this.config.paginationContainer).innerHTML="",this.displayResults=this.results.slice(parseInt(n),parseInt(n)+this.config.resultsPerPage);let s=Promise.all(this.displayResults.map(async(e,t)=>{await delay(t*this.config.tileAppendDelay);let n=new ResultView({warnings:this.config.warnings,result:e,onChange:()=>morph(s,n.toHTML())}),s=n.toHTML();qs(this.config.resultsContainer).append(s),this.config.lowRankWarning&&e.distance>this.config.lowRankWarning.threshold&&n.addWarning(this.config.lowRankWarning),n.setData(await e.fetch())}));await s;let i=new Paginator({length:Math.min(this.results.length/this.config.resultsPerPage,this.config.maxPages),selected:Math.floor(parseInt(n)/this.config.resultsPerPage),getURL:e=>`#${encodeURIComponent(t)}/${e*this.config.resultsPerPage}`});morph(qs(this.config.paginationContainer),i.toHTML()),this.ariaNotice("Search results updated.","off").focus()}visualNotice(e,t="polite"){qs("html > body").className="notice",qs(this.config.paginationContainer).innerHTML="";let n=qs(this.config.resultsContainer);n.innerHTML="",n.append(function(){var e=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),t=document.createElement("div");return t.setAttribute("aria-live",arguments[0]),t.setAttribute("class","notice_box"),e(t,[arguments[1]]),t}(t,e))}ariaNotice(e,t="polite"){[...qsa("div.aria_notice")].forEach(e=>e.remove());let n=function(){var e=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),t=document.createElement("div");return t.setAttribute("tabindex","-1"),t.setAttribute("aria-live",arguments[0]),t.setAttribute("style","position: absolute; top: -1000px"),t.setAttribute("class","aria_notice"),e(t,[arguments[1]]),t}(t,e);return qs(this.config.resultsContainer).before(n),n}async renderHashtagList(e){await this.awaitReady();let t=qs(e),n=await this.searchEngine.getTags();t.innerHTML="";for(let e of Object.keys(n).sort((e,t)=>n[t]-n[e]))t.append(function(){var e=require("/Users/phx/Sync/sign-search/node_modules/nanohtml/lib/append-child.js"),t=document.createElement("li"),n=document.createElement("a");return n.setAttribute("href",arguments[0]),e(n,["#",arguments[1]]),e(t,[n," (",arguments[2],")"]),t}(`./#${encodeURIComponent(`#${e}`)}/0`,e,n[e]))}}let ui=window.ui=new FindSignUI({languageName:"Auslan",searchLibraryPath:"datasets/search-index",vectorLibraryPath:"datasets/cc-en-300-8bit",resultsPerPage:10,maxPages:8,homeButton:"#header",searchForm:"#search_form",searchInput:"#search_box",resultsContainer:"#results",paginationContainer:"#pagination",tileAppendDelay:parseDuration(getComputedStyle(document.documentElement).getPropertyValue("--fade-time-offset").trim()),warnings:{invented:{type:"invented",text:"Informal, colloqual sign. Professionals should not use."},homesign:{type:"home-sign",text:"This is listed as a Home Sign, not an established widespread part of Auslan."},"home-sign":{type:"home-sign",text:"This is listed as a Home Sign, not an established widespread part of Auslan."}}});"true"==document.body.dataset.hook&&ui.addHooks(),ui.load(),document.body.dataset.hashtagList&&ui.renderHashtagList(document.body.dataset.hashtagList);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvc2VhcmNoLWVuZ2luZS9lbmdpbmUuanMiLCJsaWIvc2VhcmNoLWVuZ2luZS9xdWVyeS5qcyIsImxpYi9zZWFyY2gtZW5naW5lL3ZpZXctcGFnaW5hdG9yLmpzIiwibGliL3NlYXJjaC1lbmdpbmUvdmlldy1yZXN1bHQuanMiLCJsaWIvc2VhcmNoLWxpYnJhcnkvZGVmaW5pdGlvbi5qcyIsImxpYi9zZWFyY2gtbGlicmFyeS9saWJyYXJ5LXdlYi5qcyIsImxpYi9zZWFyY2gtbGlicmFyeS9saWJyYXJ5LmpzIiwibGliL3NlYXJjaC1saWJyYXJ5L3Jlc3VsdC1kZWZpbml0aW9uLmpzIiwibGliL3VzZXItaW50ZXJmYWNlLmpzIiwibGliL3V0aWwuanMiLCJsaWIvdmVjdG9yLWxpYnJhcnkvbGlicmFyeS5qcyIsImxpYi92ZWN0b3ItdXRpbGl0aWVzLmpzIiwibm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iaWdudW1iZXIuanMvYmlnbnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL2JvcmMvc3JjL2NvbnN0YW50cy5qcyIsIm5vZGVfbW9kdWxlcy9ib3JjL3NyYy9kZWNvZGVyLmFzbS5qcyIsIm5vZGVfbW9kdWxlcy9ib3JjL3NyYy9kZWNvZGVyLmpzIiwibm9kZV9tb2R1bGVzL2JvcmMvc3JjL2RpYWdub3NlLmpzIiwibm9kZV9tb2R1bGVzL2JvcmMvc3JjL2VuY29kZXIuanMiLCJub2RlX21vZHVsZXMvYm9yYy9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYm9yYy9zcmMvc2ltcGxlLmpzIiwibm9kZV9tb2R1bGVzL2JvcmMvc3JjL3RhZ2dlZC5qcyIsIm5vZGVfbW9kdWxlcy9ib3JjL3NyYy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVsYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pc28tdXJsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2lzby11cmwvc3JjL3JlbGF0aXZlLmpzIiwibm9kZV9tb2R1bGVzL2lzby11cmwvc3JjL3VybC1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL25hbm9hc3NlcnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbmFub2h0bWwvbGliL2FwcGVuZC1jaGlsZC5qcyIsIm5vZGVfbW9kdWxlcy9uYW5vbW9ycGgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbmFub21vcnBoL2xpYi9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvbmFub21vcnBoL2xpYi9tb3JwaC5qcyIsIm5vZGVfbW9kdWxlcy9wYXJzZS1kdXJhdGlvbi9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLE1BQU0sY0FBZ0IsUUFBUSxpQ0FDeEIsY0FBZ0IsUUFBUSw2QkFDeEIsWUFBYyxRQUFRLFdBQ3RCLEdBQUssUUFBUSx1QkFDYixPQUFTLFFBQVEsV0FFdkIsTUFBTSxhQUlKLFlBQVksR0FDVixLQUFLLE9BQVEsRUFDYixLQUFLLGNBQWdCLEdBQ3JCLEtBQUssT0FBUyxFQUloQixhQUNFLEtBQ0csS0FBSyxjQUFlLEtBQUsscUJBQXVCLFFBQVEsSUFBSSxDQUMzRCxJQUFLLGNBQWMsQ0FBRSxLQUFNLEtBQUssT0FBTyxvQkFBc0IsT0FDN0QsSUFBSyxjQUFjLENBQ2pCLEtBQU0sS0FBSyxPQUFPLGtCQUNsQixHQUFJLENBQUUsU0FBVSxPQUFPLGVBQ3ZCLE9BQVEsT0FBTyxjQUNiLFNBRU4sTUFBTyxHQUdQLE1BRkEsS0FBSyxjQUFjLFFBQVEsRUFBRSxFQUFTLEtBQVksRUFBTyxJQUN6RCxLQUFLLGNBQWdCLEdBQ2YsRUFFUixLQUFLLE9BQVEsRUFDYixLQUFLLGNBQWMsUUFBUSxFQUFFLEVBQVMsS0FBWSxFQUFRLE9BQzFELEtBQUssY0FBZ0IsR0FJdkIsYUFDRSxPQUFJLEtBQUssTUFDQSxRQUFRLFFBQVEsTUFFaEIsSUFBSSxRQUFRLENBQUMsRUFBUyxLQUMzQixLQUFLLGNBQWMsS0FBSyxDQUFDLEVBQVMsTUFNeEMsWUFBWSxTQUNKLEtBQUssYUFHWCxJQUFJLEVBQVEsSUFBSSxZQUFZLFNBRXRCLEVBQU0sVUFBVSxLQUFLLGVBRzNCLElBQUksRUFBZSxFQUFNLFNBQVMsT0FBTyxHQUFNLEVBQUUsVUFBVSxJQUFJLEdBQUssRUFBRSxNQUNsRSxFQUFlLEVBQU0sU0FBUyxPQUFPLElBQU0sRUFBRSxVQUFVLElBQUksR0FBSyxFQUFFLE1BZ0N0RSxhQTlCb0IsS0FBSyxjQUFjLE1BQU8sSUFDNUMsR0FBSSxFQUFhLEtBQUssSUFBUSxFQUFPLEtBQUssU0FBUyxJQUFPLE9BQU8sRUFDakUsR0FBSSxFQUFhLEtBQUssR0FBTyxFQUFPLEtBQUssU0FBUyxJQUFPLE9BQU8sRUF3QmhFLE9BdEJnQixFQUFPLE1BQU0sSUFBSSxHQUN4QixLQUFLLE9BQU8sRUFBTSxTQUFTLElBQUksSUFDcEMsR0FBSSxFQUFVLGFBQWUsWUFBWSxZQUN2QyxHQUEyQixpQkFBdkIsRUFDRixPQUFPLEdBQUcsZ0JBQWdCLEVBQVUsT0FBUSxRQUc5QyxHQUEwQixpQkFBdEIsRUFBZ0MsQ0FDbEMsR0FBSSxFQUFVLE1BQVEsRUFDcEIsT0FBTyxFQUNGLEdBQUksRUFBVSxLQUFLLGVBQWlCLEVBQVcsY0FDcEQsTUFBTyxJQUliLE9BQU8sT0FLb0IsT0FBTyxDQUFDLEVBQUUsSUFBSyxFQUFJLEVBQUcsR0FFNUIsRUFBTyxjQUFnQixPQUluQyxLQUFLLENBQUMsRUFBRSxJQUFNLEVBQUUsU0FBVyxFQUFFLFVBSTlDLGdCQUVFLGFBRE0sS0FBSyxhQUNKLEtBQUssY0FBYyxXQUk5QixPQUFPLFFBQVU7OztBQ3BHakIsTUFBTSxZQUNKLFlBQVksR0FFVixLQUFLLFVBQVksRUFBVSxPQUFPLE1BQU0sOEJBQThCLE9BQU8sR0FBSyxFQUFFLFdBQVcsT0FBTyxPQUFTLEdBRy9HLEtBQUssT0FBUyxLQUFLLFVBQVUsSUFBSyxJQUNoQyxHQUFJLEVBQVMsTUFBTSx5QkFDakIsT0FBTyxJQUFJLGFBQWEsRUFBUyxNQUFNLElBQUksR0FDdEMsR0FBSSxFQUFTLE1BQU0sd0JBQ3hCLE9BQU8sSUFBSSxhQUFhLEVBQVMsTUFBTSxJQUFJLEdBQ3RDLENBRUwsSUFBSSxFQUFjLEVBQVMsT0FBTyxRQUFRLEtBQU0sS0FJaEQsT0FGSSxFQUFZLE1BQU0sVUFBWSxFQUFZLE9BQVMsS0FBRyxFQUFjLEVBQVksZUFFN0UsSUFBSSxhQUFhLE1BTTlCLGdCQUFnQixHQWFkLE9BWkEsS0FBSyxhQUFlLFFBQVEsSUFBSSxLQUFLLE9BQU8sSUFBSSxNQUFPLElBQ3JELEdBQUksRUFBTSxhQUFlLGFBQWMsQ0FDckMsSUFBSSxRQUFlLEVBQWMsT0FBTyxHQUN4QyxPQUFJLEVBQ0ssSUFBSSxXQUFXLEVBQU8sR0FFdEIsRUFHVCxPQUFPLEtBR0osS0FJVCxlQUNFLE9BQU8sS0FBSyxPQUFPLE9BQU8sR0FBVSxFQUFNLGFBQWUsY0FBZ0IsRUFBTSxhQUFlLFlBSWhHLGVBQ0UsT0FBTyxLQUFLLE9BQU8sT0FBTyxHQUFTLEVBQU0sYUFBZSxjQUkxRCxXQUNFLE9BQU8sS0FBSyxPQUFPLEtBQUssTUFLNUIsTUFBTSxhQUNKLFlBQVksRUFBTSxHQUFXLEdBQzNCLEtBQUssS0FBTyxFQUFLLFdBQ2pCLEtBQUssV0FBYSxFQUdwQixXQUFhLFNBQVcsS0FBSyxTQUFXLElBQU0sT0FBUSxLQUFLLFFBSTdELE1BQU0sYUFDSixZQUFZLEdBQ1YsS0FBSyxLQUFPLEVBQUssV0FJbkIsV0FBYSxPQUFPLEtBQUssS0FFekIsVUFBWSxPQUFPLEtBQUssTUFJMUIsTUFBTSxXQUNKLFlBQVksRUFBTSxHQUNoQixLQUFLLEtBQU8sRUFBSyxXQUNqQixLQUFLLE9BQVMsRUFJaEIsV0FBYSxPQUFPLEtBQUssS0FFekIsVUFBWSxPQUFPLEtBQUssUUFHMUIsWUFBWSxhQUFlLGFBQzNCLFlBQVksYUFBZSxhQUMzQixZQUFZLFdBQWUsV0FFM0IsT0FBTyxRQUFVOzs7QUM3RmpCLE1BQU0sS0FBTyxHQUViLE1BQU0sbUJBTUosWUFBWSxHQUNWLEtBQUssT0FBUyxFQUFPLFFBQVUsRUFDL0IsS0FBSyxTQUFXLEVBQU8sVUFBWSxFQUNuQyxLQUFLLE9BQVMsRUFBTyxRQUFNLENBQU0sWUFBYyxLQUlqRCxTQUFTLEVBQU8sR0FDZCxHQUFJLEdBQVMsRUFBRyxNQUFPLEdBQ3ZCLElBQUksRUFBUyxHQUNiLElBQUssSUFBSSxFQUFJLEVBQUcsRUFBSSxFQUFPLElBQ3pCLEVBQU8sS0FBSyxFQUFHLElBRWpCLE9BQU8sRUFHVCxTQUNFLE9BQU8scU5BQUEsc1hBU1gsT0FBTyxRQUFVOzs7QUNwQ2pCLE1BQU0sS0FBTyxHQUViLE1BQU0sa0JBSUosWUFBWSxFQUFTLElBQ25CLEtBQUssT0FBUyxFQUNkLEtBQUssT0FBTyxXQUFhLEtBQUssT0FBTyxZQUFjLEVBQ25ELEtBQUssT0FBUyxFQUFPLFFBQVUsS0FDL0IsS0FBSyxlQUFpQixHQUd4QixRQUFRLEdBQ04sS0FBSyxPQUFTLEVBQ1YsS0FBSyxPQUFPLFVBQVUsS0FBSyxPQUFPLFNBQVMsTUFHakQsWUFBVyxLQUFFLEVBQUksS0FBRSxJQUNqQixLQUFLLGVBQWUsS0FBSyxDQUFFLEtBQUEsRUFBTSxLQUFBLElBQzdCLEtBQUssT0FBTyxVQUFVLEtBQUssT0FBTyxTQUFTLE1BR2pELGNBQWMsR0FDWixLQUFLLGVBQWlCLEtBQUssZUFBZSxPQUFPLEdBQVcsRUFBUSxNQUFRLEdBQ3hFLEtBQUssT0FBTyxVQUFVLEtBQUssT0FBTyxTQUFTLE1BSWpELFNBQ0UsT0FBSSxLQUFLLFFBQVUsS0FBSyxPQUFPLFlBQ3RCLEtBQUssa0JBRUwsS0FBSyxvQkFLaEIsY0FDRSxJQUFJLEVBQVcsS0FBSyxPQUFPLFVBQVksR0FFdkMsTUFBTyxJQURPLE9BQU8sS0FBSyxHQUFVLE9BQU8sR0FBTyxLQUFLLE9BQU8sS0FBSyxTQUFTLElBQ3pELElBQUksR0FBTyxFQUFTLE9BQVcsS0FBSyxnQkFJekQsUUFBUSxHQUNOLE9BQUksS0FBSyxPQUNBLENBQUMsU0FBVSxLQUFLLE9BQU8sTUFBTyxHQUFNLEtBQUssS0FFekMsR0FJWCxnQkFFRSxJQUFJLEVBQWMsQ0FBQyxFQUFPLEtBQ3hCLEVBQU0saUJBQ04sRUFBTSxrQkFDTixLQUFLLE9BQU8sWUFBYyxFQUMxQixLQUFLLE9BQU8sU0FBUyxPQUNkLEdBSUwsRUFBYyxLQUFLLE9BQU8sV0FBYSxFQUN2QyxFQUFjLEtBQUssT0FBTyxXQUFhLEtBQUssT0FBTyxNQUFNLE9BQVMsRUFFbEUsRUFBVSxLQUFLLE9BQU8sTUFBTSxLQUFLLE9BQU8sWUFHNUMsT0FBTyxxcUNBQUEsNGFBY1Qsa0JBVUUsT0FUZ0IsaTVCQUFBLHNnQkFZbEIsb0JBQ0UsT0FBTyxzSkFBQSwrQ0FJWCxPQUFPLFFBQVU7OztBQ25HakIsTUFBTSxpQkFFSixhQUFZLE1BQUUsRUFBSyxTQUFFLEVBQVEsS0FBRSxFQUFJLEtBQUUsRUFBSSxNQUFFLEVBQUssS0FBRSxFQUFJLFNBQUUsRUFBUSxHQUFFLEdBQU8sSUFDdkUsS0FBSyxNQUFRLEdBQVMsS0FDdEIsS0FBSyxTQUFXLEdBQVksR0FDNUIsS0FBSyxLQUFPLEdBQVEsR0FDcEIsS0FBSyxLQUFPLEdBQVEsS0FDcEIsS0FBSyxNQUFRLEdBQVMsR0FDdEIsS0FBSyxLQUFPLEdBQVEsS0FDcEIsS0FBSyxTQUFXLEdBQVksS0FDNUIsS0FBSyxHQUFLLEdBQU0sS0FHbEIsVUFDRSxTQUFVLEtBQUssVUFBWSxhQUFhLEtBQUssSUFBTSxLQUFLLE1BQVEsWUFHbEUsVUFDRSxVQUFXLEtBQUssWUFBWSxTQUFTLFNBQVMsS0FBSyxPQUFTLEtBQUssU0FBUyxLQUFLLFNBR2pGLFNBQ0UsTUFBTyxDQUNMLE1BQU8sS0FBSyxNQUNaLFNBQVUsS0FBSyxTQUNmLEtBQU0sS0FBSyxLQUNYLEtBQU0sS0FBSyxLQUNYLE1BQU8sS0FBSyxNQUNaLEtBQU0sS0FBSyxLQUNYLFNBQVUsS0FBSyxTQUNmLEdBQUksS0FBSyxLQUtmLE9BQU8sUUFBVTs7O0FDckNqQixNQUFNLGNBQWdCLFFBQVEsYUFDeEIsT0FBUyxRQUFRLFdBRXZCLE1BQU0seUJBQXlCLGNBQzdCLFlBQVksR0FDVixNQUFNLENBQ0osR0FBSSxDQUFFLFNBQVUsT0FBTyxrQkFDcEIsS0FLVCxPQUFPLFFBQVU7Ozs7QUNYakIsTUFBTSx1QkFBeUIsUUFBUSx1QkFDakMsS0FBTyxRQUFRLFdBQ2YsR0FBSyxRQUFRLHVCQUNiLEtBQU8sUUFBUSxRQUdyQixNQUFNLGNBVUosWUFBWSxFQUFTLElBRW5CLEtBQUssTUFBUSxHQUViLEtBQUssU0FBVyxDQUNkLFFBQVMsRUFDVCxXQUFZLEVBQ1osV0FBWSxJQUNaLGNBQWUsRUFDZixlQUFnQixLQUFLLE1BQ3JCLFVBQVcsR0FDWCxRQUFTLEtBQUssT0FHaEIsT0FBTyxLQUFLLEtBQUssVUFBVSxJQUFLLEdBQU8sS0FBSyxTQUFTLEdBQU8sRUFBTyxJQUFRLEtBQUssU0FBUyxJQUd6RixLQUFLLFNBQVMsV0FBYSxFQUFPLGNBQWdCLElBQUksSUFBSSxHQUFLLEVBQUUsZ0JBR2pFLEtBQUssT0FBUyxPQUFPLE9BQU8sQ0FDMUIsb0JBQXFCLElBQ3BCLEdBQ0gsS0FBSyxLQUFPLEVBQU8sS0FFbkIsS0FBSyxJQUFNLEVBQU8sS0FBUSxDQUFBLEdBQVEsUUFBUSxJQUFJLElBSWhELDZCQUNRLEtBQUssS0FBSyxLQUFLLE1BR3JCLElBQUEsSUFBUyxLQUFVLEtBQUssWUFDaEIsRUFBTyxRQU1qQixhQUVFLElBQUksRUFBTyxLQUFLLGFBQWEsS0FBSyxPQUFPLEdBQUcsWUFBWSxLQUFLLG9CQUk3RCxLQUFLLFNBQVcsRUFBSyxTQUdyQixJQUFJLEVBQVUsRUFBSyxRQUFRLElBQUksSUFDN0IsR0FBcUIsaUJBQVYsRUFDVCxPQUFPLEVBQ0YsR0FBSSxPQUFPLFNBQVMsR0FBUSxDQUVqQyxPQURhLEtBQUssYUFBYSxFQUFPLEtBQUssU0FBUyxXQUFZLEtBQUssU0FBUyxZQUNoRSxJQUFJLEdBQUssRUFBSSxLQUFLLFNBQVMsa0JBSzdDLEtBQUssTUFBUSxHQUViLElBQUEsSUFBVSxFQUFZLEtBQVksRUFBSyxNQUFPLENBQzVDLElBQUksRUFBTyxFQUFXLElBQUksR0FBUyxFQUFRLElBRTNDLElBQUEsSUFBVSxFQUFhLEtBQW9CLEVBQVMsQ0FDbEQsSUFBSSxFQUFRLEVBQVksSUFBSSxHQUFTLEVBQVEsSUFFekMsRUFBZ0IsS0FBSyxPQUFPLEdBQUcsYUFBYSxFQUFNLE9BQU8sR0FBSyxNQUFNLFFBQVEsTUFDaEYsS0FBSyxNQUFNLEVBQWlCLEdBQUcsUUFBUyxJQUN0QyxLQUFLLE1BQU0sS0FBSyxJQUFJLHVCQUF1QixDQUN6QyxRQUFTLEtBQU0sZUFBQSxFQUFnQixLQUFBLEVBQU0sTUFBQSxFQUFPLGNBQUEsUUFNcEQsT0FBTyxLQU9ULG9CQUFvQixHQUNsQixJQUFJLEVBQVEsRUFBVyxRQUFVLEVBQVcsVUFBYSxFQUNyRCxFQUFRLEVBQUssU0FDYixLQUFLLE9BQU8sa0JBQ2QsRUFBUSxFQUFNLElBQUksSUFFaEIsSUFBSSxFQUFjLEVBQVEsT0FBTyxRQUFRLEtBQU0sS0FHL0MsT0FESSxFQUFZLE1BQU0sVUFBWSxFQUFZLE9BQVMsS0FBRyxFQUFjLEVBQVksZUFDN0UsS0FLWCxRQUFjLFFBQVEsSUFBSSxFQUFNLElBQUksTUFBQSxHQUFrQixLQUFLLE9BQU8scUJBQXVCLEtBQUssT0FBTyxjQUFjLE9BQU8sSUFBYSxJQUd2SSxJQUFJLEVBQVEsR0FDWixJQUFBLElBQVMsS0FBYSxFQUFLLE1BQU8sQ0FDaEMsSUFBSSxFQUFrQixLQUFLLE9BQU8sYUFBYSxPQUFPLEdBQVUsRUFBTyxRQUFRLEVBQVUsaUJBQ3JGLEVBQVcsR0FDZixJQUFBLElBQVMsS0FBVyxFQUNsQixFQUFTLEVBQVEsZUFBZSxpQkFBbUIsS0FBSyxPQUFPLFdBQVcsTUFBTSxDQUFFLE1BQU8sRUFBVyxPQUFRLElBRTFHLEVBQWdCLE9BQVMsR0FBRyxFQUFNLEtBQUssR0FJN0MsSUFBSSxFQUFTLElBQUksdUJBQXVCLE9BQU8sT0FBTyxFQUFNLENBQzFELFFBQVMsS0FBTSxNQUFBLEVBQ2YsY0FBZSxLQUFLLE9BQU8sR0FBRyxhQUFhLEVBQU0sT0FBTyxHQUFLLE1BQU0sUUFBUSxNQUMzRSxNQUFBLEVBQU8sV0FBVyxLQUlwQixLQUFLLE1BQU0sS0FBSyxHQWFsQixZQUFZLEdBQ1YsSUFBSSxRQUF1QixLQUFLLE9BQU8sR0FBRyxZQUFZLEtBQUssb0JBUTNELE9BUEksRUFBZSxZQUFjLEtBQUssU0FBUyxRQUFRLGFBRXJELEtBQUssb0RBQW9ELG1DQUFnRCxLQUFLLFNBQVMsaUJBQ2pILEtBQUssUUFJTixLQUFLLE1BQU0sSUFBSyxJQUNyQixJQUFJLEVBQWUsT0FBTyxPQUFPLEdBRWpDLE9BREEsRUFBYSxTQUFXLEVBQVMsR0FDMUIsSUFDTixPQUFPLEdBRXlCLGlCQUExQixFQUFhLFVBQ3BCLEtBQUssQ0FBQyxFQUFFLElBRVIsRUFBRSxTQUFXLEVBQUUsVUFPbkIsYUFFRSxJQUFJLEVBQVUsR0FDVixFQUFnQixHQUVoQixFQUFVLElBQ1osSUFBSSxFQUFZLEtBQUssVUFBVSxHQUMvQixHQUFJLEVBQWMsR0FBWSxPQUFPLEVBQWMsR0FHbkQsSUFBSSxFQUFjLEVBQVEsT0FFMUIsR0FBSSxNQUFNLFFBQVEsR0FBTyxDQUN2QixJQUFJLEVBQVMsS0FBSyxXQUFXLEVBQUssSUFBSSxHQUFLLEVBQUksS0FBSyxTQUFTLGVBQWdCLEtBQUssU0FBUyxXQUFZLEtBQUssU0FBUyxZQUNySCxFQUFRLEtBQUssT0FBTyxLQUFLLFNBRXpCLEVBQVEsS0FBSyxFQUFLLFlBSXBCLE9BQU8sRUFBYyxHQUFhLEdBSXBDLEdBQUksS0FBSyxPQUFPLGNBQWUsQ0FDN0IsS0FBSyxTQUFTLGNBQWdCLEVBQzlCLElBQUEsSUFBUyxLQUFjLEtBQUssTUFBTyxDQUNqQyxJQUFJLEVBQVUsRUFBVyxNQUFNLE9BQU8sR0FBbUIsaUJBQVAsR0FDbEQsR0FBSSxFQUFRLE9BQVMsRUFBRyxTQUN4QixJQUFJLEVBQWUsS0FBSyxPQUFRLEVBQVEsT0FBTyxJQUFJLEtBQUssTUFDcEQsS0FBSyxTQUFTLGNBQWdCLElBQ2hDLEtBQUssU0FBUyxjQUFnQixJQU1wQyxJQUFJLEVBQVEsR0FDWixDQUVFLEtBQUssSUFBSSxzQ0FDVCxJQUFJLEVBQVUsRUFDZCxJQUFBLElBQVMsS0FBUyxLQUFLLGNBQWMsS0FBSyxNQUFPLEtBQUssT0FBTyxxQkFBc0IsQ0FDakYsSUFBSSxFQUFhLEdBQ2pCLEVBQU0sUUFBUSxJQUVaLEVBQVcsZ0JBQWtCLENBQUMsRUFBUyxFQUFXLFFBQ2xELEVBQVcsS0FBSyxFQUFXLFVBSTNCLElBQUksRUFBVSxFQUFXLEtBQUssSUFBSSxHQUFRLE9BQU8sS0FBSyxNQUVsRCxFQUFnQixFQUFNLEdBQVcsRUFBTSxJQUFZLEdBRW5ELEVBQWEsRUFBVyxNQUFNLElBQUksR0FBUSxPQUFPLEtBQUssTUFDMUQsRUFBYyxHQUFjLElBQUssRUFBYyxJQUFlLE1BQVEsRUFBVyxtQkFJbkYsSUFBSSxFQUFjLEtBQUssT0FBTyxTQUN4QixLQUFLLE9BQU8sR0FBRyxhQUFhLEtBQUssb0JBQW9CLEtBQUssU0FBUyxpQkFDbkUsS0FBSyxPQUFPLEdBQUcsYUFBYSxLQUFLLG9CQUFvQixLQUFLLFNBQVMsV0FBVyxTQUFnQixHQUNoRyxLQUFLLE9BQU8sWUFBWSxLQUFLLE9BQU8sR0FBRyxhQUFhLEtBQUssb0JBQW9CLEtBQUssU0FBUyxXQUFXLGtCQUF5QixLQUFLLE9BQU8sS0FBSyxJQUNwSixHQUFXLEdBS2YsS0FBSyxJQUFJLGlDQUNULElBQUksRUFBYyxLQUFLLE9BQU8sQ0FDNUIsU0FBVSxLQUFLLFNBQ2YsUUFBQSxFQUNBLE1BQU8sS0FBSyxZQUFZLEVBQ3RCLEdBQU8sRUFBSSxNQUFNLE1BQU0sSUFBSSxHQUFLLFNBQVMsSUFDekMsR0FBYyxLQUFLLFlBQVksRUFDN0IsR0FBTyxFQUFJLE1BQU0sTUFBTSxJQUFJLEdBQUssU0FBUyxjQUl6QyxLQUFLLE9BQU8sR0FBRyxhQUFhLEtBQUssa0JBQW1CLEdBQ3RELEtBQUssT0FBTyxZQUFZLEtBQUssT0FBTyxHQUFHLGFBQWEsS0FBSywyQkFBNEIsS0FBSyxPQUFPLEtBQUssVUFHcEcsS0FBSyxPQUFPLEdBQUcsYUFBYSxLQUFLLG1CQUFvQixLQUFLLFNBQVMsUUFBUSxZQU1uRix1QkFFcUIsS0FBSyxPQUFPLEdBQUcsV0FBVyxLQUFLLHFCQUMzQyxRQUFRLElBQ1QsSUFBWSxLQUFLLFNBQVMsU0FBUyxLQUFLLE9BQU8sR0FBRyxVQUFVLEtBQUssb0JBQW9CLGFBR3JGLEtBQUssV0FBVyxVQU14QiwyQkFBMkIsR0FFekIsSUFBSSxFQUFVLEVBQU8sZ0JBQWdCLEdBQ2pDLFFBQW9CLEtBQUssT0FBTyxHQUFHLFlBQVksS0FBSyxvQkFBb0IsS0FBSyxTQUFTLFdBQVcsVUFFckcsT0FEZ0IsS0FBSyxPQUFPLEdBQ1gsRUFBTyxnQkFBZ0IsS0FJNUMsT0FBTyxRQUFVOzs7OztBQzdSakIsTUFBTSxpQkFBbUIsUUFBUSxnQkFDM0IsS0FBTyxRQUFRLFdBRXJCLE1BQU0sK0JBQStCLGlCQUNuQyxZQUFZLEVBQVMsSUFDbkIsTUFBTSxHQUNOLEtBQUssUUFBVSxFQUFPLFFBQ3RCLEtBQUssTUFBUSxFQUFPLE9BQVMsR0FDN0IsS0FBSyxjQUFnQixFQUFPLGVBQWlCLEVBQ3pDLEVBQU8sT0FDVCxLQUFLLE1BQVEsRUFBTyxLQUNwQixLQUFLLFlBQWMsS0FBSyxjQUFjLEVBQU8sT0FFL0MsS0FBSyxnQkFBa0IsRUFBTyxlQUM5QixLQUFLLFNBQVcsRUFBTyxZQUFhLEVBR3RDLFlBQWMsT0FBTyxLQUFLLFNBSTFCLGNBQ0UsR0FBSSxLQUFLLFNBQVUsT0FBTyxLQUUxQixJQUFJLFFBQWMsS0FBSyxRQUFRLHFCQUFxQixNQWVwRCxPQWJBLEtBQUssTUFBVyxFQUFNLE1BQ3RCLEtBQUssU0FBVyxFQUFNLFVBQ3RCLEtBQUssS0FBVyxFQUFNLEtBQ3RCLEtBQUssS0FBVyxFQUFNLEtBQ3RCLEtBQUssS0FBVyxFQUFNLEtBQ3RCLEtBQUssU0FBVyxFQUFNLFNBQ3RCLEtBQUssR0FBVyxFQUFNLElBQU0sRUFBTSxLQUVsQyxLQUFLLE1BQVcsRUFBTSxNQUFNLElBQUksR0FDOUIsT0FBTyxLQUFLLEdBQVMsSUFBSSxHQUFhLE9BQU8sT0FBTyxPQUFPLE9BQU8sS0FBSyxRQUFRLFNBQVMsVUFBVSxLQUFLLEdBQVMsRUFBTSxXQUFhLElBQWMsSUFBSyxDQUFFLE9BQVEsS0FBSyxRQUFRLFdBQVcsRUFBUSxTQUdsTSxLQUFLLFVBQVcsRUFDVCxNQUlYLE9BQU8sUUFBVTs7O0FDNUNqQixNQUFNLGFBQWUsUUFBUSwwQkFDdkIsV0FBYSxRQUFRLCtCQUNyQixVQUFZLFFBQVEsa0NBQ3BCLEtBQU8sR0FDUCxNQUFRLFFBQVEsYUFDaEIsY0FBZ0IsUUFBUSxrQkFDeEIsTUFBUSxRQUFRLFNBRWhCLEdBQUssSUFBSSxJQUFRLFNBQVMsaUJBQWlCLEdBQzNDLElBQU0sSUFBSSxJQUFRLFNBQVMsb0JBQW9CLEdBRXJELE1BQU0sV0FDSixZQUFZLEdBQ1YsS0FBSyxPQUFTLEVBQ2QsS0FBSyxhQUFlLElBQUksYUFBYSxHQUl2QyxtQkFDUSxLQUFLLGFBQWEsT0FJMUIsYUFBZSxPQUFPLEtBQUssYUFBYSxhQUV4QyxpQkFDRSxPQUFPLGFBQWUsS0FBSyxLQUFLLGFBQWEsU0FBUyxLQUFLLFFBQVEsS0FBTSxNQUV6RSxHQUFHLEtBQUssT0FBTyxZQUFZLFNBQVcsQ0FBQSxJQUNwQyxJQUFJLEVBQVksR0FBRyxLQUFLLE9BQU8sYUFBYSxNQUM1QyxFQUFNLGlCQUNOLFNBQVMsU0FBVyxtQkFBbUIsU0FHcEIsSUFBakIsU0FBUyxNQUErQixLQUFqQixTQUFTLE1BQWEsS0FBSyxhQUFhLFNBQVMsS0FBSyxRQUFRLEtBQU0sS0FHakcsYUFBYSxHQUNDLElBQVIsRUFDRixLQUFLLFdBQVcsR0FFaEIsS0FBSyxhQUFhLEdBS3RCLFdBQVcsR0FDVCxTQUFTLEtBQU8sSUFDaEIsR0FBRyxlQUFlLFVBQVksT0FDOUIsR0FBRyxLQUFLLE9BQU8sa0JBQWtCLFVBQVksR0FDN0MsR0FBRyxLQUFLLE9BQU8scUJBQXFCLFVBQVksR0FDaEQsR0FBRyxLQUFLLE9BQU8sYUFBYSxNQUFRLEdBQ3BDLEdBQUcsS0FBSyxPQUFPLGFBQWEsUUFNOUIsbUJBQW1CLEdBQ2pCLElBQUssRUFBVyxHQUFVLEVBQUssTUFBTSxLQUFLLElBQUksR0FBSyxtQkFBbUIsSUFDdEUsR0FBK0IsR0FBM0IsRUFBVSxPQUFPLE9BQWEsT0FBTyxTQUFTLEtBQU8sSUFlekQsR0FaQSxHQUFHLEtBQUssT0FBTyxhQUFhLE1BQVEsRUFFL0IsS0FBSyxhQUFhLE1BSXJCLEtBQUssV0FBVyxXQUFZLE9BQU8sUUFIbkMsS0FBSyxhQUFhLFlBT3BCLEtBQUssY0FBZ0IsS0FBSyxhQUFhLE1BQU0sR0FFbEIsR0FBdkIsS0FBSyxRQUFRLE9BQ2YsT0FBTyxLQUFLLGFBQWEsMkJBQTRCLFFBR3JELEdBQUcsZUFBZSxVQUFZLFVBRzlCLEdBQUcsS0FBSyxPQUFPLGtCQUFrQixVQUFZLEdBQzdDLEdBQUcsS0FBSyxPQUFPLHFCQUFxQixVQUFZLEdBSWxELEtBQUssZUFBaUIsS0FBSyxRQUFRLE1BQU0sU0FBUyxHQUFTLFNBQVMsR0FBVSxLQUFLLE9BQU8sZ0JBRzFGLElBQUksRUFBa0IsUUFBUSxJQUFJLEtBQUssZUFBZSxJQUFJLE1BQU8sRUFBUSxXQUVqRSxNQUFNLEVBQVEsS0FBSyxPQUFPLGlCQUdoQyxJQUFJLEVBQU8sSUFBSSxXQUFXLENBQ3hCLFNBQVUsS0FBSyxPQUFPLFNBQ3RCLE9BQVEsRUFDUixTQUFVLElBQUssTUFBTSxFQUFTLEVBQUssWUFJakMsRUFBVSxFQUFLLFNBQ25CLEdBQUcsS0FBSyxPQUFPLGtCQUFrQixPQUFPLEdBR3BDLEtBQUssT0FBTyxnQkFBa0IsRUFBTyxTQUFXLEtBQUssT0FBTyxlQUFlLFdBQzdFLEVBQUssV0FBVyxLQUFLLE9BQU8sZ0JBSTlCLEVBQUssY0FBYyxFQUFPLGtCQUl0QixFQUdOLElBQUksRUFBWSxJQUFJLFVBQVUsQ0FDNUIsT0FBUSxLQUFLLElBQUksS0FBSyxRQUFRLE9BQVMsS0FBSyxPQUFPLGVBQWdCLEtBQUssT0FBTyxVQUMvRSxTQUFVLEtBQUssTUFBTSxTQUFTLEdBQVUsS0FBSyxPQUFPLGdCQUNwRCxPQUFTLE9BQWUsbUJBQW1CLE1BQWMsRUFBVSxLQUFLLE9BQU8sbUJBSWpGLE1BQU0sR0FBRyxLQUFLLE9BQU8scUJBQXNCLEVBQVUsVUFHckQsS0FBSyxXQUFXLDBCQUEyQixPQUFPLFFBSXBELGFBQWEsRUFBTSxFQUFXLFVBQzVCLEdBQUcsZUFBZSxVQUFZLFNBQzlCLEdBQUcsS0FBSyxPQUFPLHFCQUFxQixVQUFZLEdBQ2hELElBQUksRUFBYSxHQUFHLEtBQUssT0FBTyxrQkFDaEMsRUFBVyxVQUFZLEdBQ3ZCLEVBQVcsT0FBTyw2T0FBQSxPQUlwQixXQUFXLEVBQU0sRUFBVyxVQUMxQixJQUFJLElBQUksb0JBQW9CLFFBQVEsR0FBSyxFQUFFLFVBQzNDLElBQUksRUFBUyx5VUFBQSxNQUViLE9BREEsR0FBRyxLQUFLLE9BQU8sa0JBQWtCLE9BQU8sR0FDakMsRUFHVCx3QkFBd0IsU0FDaEIsS0FBSyxhQUNYLElBQUksRUFBTyxHQUFHLEdBQ1YsUUFBYSxLQUFLLGFBQWEsVUFFbkMsRUFBSyxVQUFZLEdBRWpCLElBQUssSUFBSSxLQUFPLE9BQU8sS0FBSyxHQUFNLEtBQUssQ0FBQyxFQUFFLElBQUssRUFBSyxHQUFLLEVBQUssSUFDNUQsRUFBSyxPQUFPLG1RQUFBLGlEQUtsQixJQUFJLEdBQUssT0FBTyxHQUFLLElBQUksV0FBVyxDQUNsQyxhQUFjLFNBQ2Qsa0JBQW1CLHdCQUNuQixrQkFBbUIsMEJBQ25CLGVBQWdCLEdBQ2hCLFNBQVUsRUFDVixXQUFZLFVBQ1osV0FBWSxlQUNaLFlBQWEsY0FDYixpQkFBa0IsV0FDbEIsb0JBQXFCLGNBQ3JCLGdCQUFpQixjQUFjLGlCQUFpQixTQUFTLGlCQUFpQixpQkFBaUIsc0JBQXNCLFFBQ2pILFNBQVUsQ0FDUixTQUFZLENBQUUsS0FBTSxXQUFZLEtBQU0sMkRBQ3RDLFNBQVksQ0FBRSxLQUFNLFlBQWEsS0FBTSxnRkFDdkMsWUFBYSxDQUFFLEtBQU0sWUFBYSxLQUFNLG1GQVVWLFFBQTlCLFNBQVMsS0FBSyxRQUFRLE1BQWdCLEdBQUcsV0FFN0MsR0FBRyxPQUVDLFNBQVMsS0FBSyxRQUFRLGFBQWEsR0FBRyxrQkFBa0IsU0FBUyxLQUFLLFFBQVE7Ozs7QUMxTGxGLElBQUksS0FBTyxDQUVULFVBQVcsQ0FBQyxFQUFRLEtBSWxCLElBQUksRUFBVSxFQUFPLFNBQVMsR0FFOUIsTUFBUSxJQUFLLE9BQU8sRUFBTyxFQUFRLFFBQVUsR0FJL0MsVUFBWSxHQUdILFNBQVMsRUFBYyxHQUloQyxXQUFZLENBQUMsRUFBUSxLQU1uQixJQUFJLEVBQWlCLEVBQU8sRUFDeEIsRUFBVSxLQUFLLElBQUksR0FBUSxTQUFTLEdBRXhDLE9BQVEsRUFBUyxFQUFJLElBQUksS0FBUSxJQUFLLE9BQU8sRUFBaUIsRUFBUSxRQUFVLEdBSWxGLFdBQWEsSUFHWCxJQUFJLEVBQWEsRUFBYSxNQUFNLEVBQUcsR0FDbkMsRUFBYyxFQUFhLE1BQU0sR0FDakMsRUFBVyxTQUFTLEVBQWEsR0FDckMsTUFBcUIsS0FBZCxHQUFxQixHQUFZLEdBSTFDLFlBQWMsR0FDTCxNQUFNLEtBQUssRUFBVyxHQUFLLEtBQUssVUFBVSxFQUFHLElBQUksS0FBSyxJQUcvRCxZQUFjLEdBRUwsTUFBTSxLQUFLLEtBQUssY0FBYyxFQUFjLEdBQUksR0FBUyxLQUFLLFVBQVUsSUFJakYsa0JBQW1CLENBQUMsRUFBVyxFQUFrQixJQUN4QyxLQUFLLFlBQVksRUFBVSxNQUFNLEVBQUcsS0FBSyxLQUFLLEVBQWtCLEtBQUssTUFBTSxFQUFHLEdBSXZGLGNBQWdCLEdBQ1AsTUFBTSxLQUFLLEVBQVcsR0FBTyxtQkFBbUIsSUFBTSxLQUFLLElBR3BFLGNBQWdCLEdBRVAsSUFBSSxXQUFXLE1BQU0sS0FBSyxLQUFLLGNBQWMsRUFBYyxHQUFJLEdBQVUsU0FBUyxFQUFRLE1BSW5HLFdBQVksQ0FBQyxFQUFRLEtBQ25CLElBQ0ksRUFEUSxFQUFPLElBQUksR0FBTyxLQUFLLE1BQU0sR0FBUSxHQUFNLEVBQWUsRUFBSyxLQUMxRCxJQUFJLEdBQVEsS0FBSyxXQUFXLEVBQU0sSUFBZSxLQUFLLElBRXZFLE9BREksRUFBSyxPQUFTLEdBQUssSUFBRyxHQUFTLElBQUssT0FBTyxFQUFLLEVBQUssT0FBUyxJQUMzRCxLQUFLLFlBQVksSUFJMUIsYUFBYyxDQUFDLEVBQU8sRUFBYyxLQUNsQyxJQUFJLEVBQU8sS0FBSyxZQUFZLEdBQzVCLE9BQU8sS0FBSyxTQUFTLEVBQWEsSUFFaEMsT0FEVyxLQUFLLFdBQVcsRUFBSyxNQUFNLEVBQVEsR0FBZSxFQUFRLEdBQUssS0FDMUQsR0FBTSxFQUFlLEVBQU0sTUFRL0MsdUJBQXlCLEdBQ2hCLEtBQUssWUFBWSxFQUFTLEdBQWEsSUFBSSxXQUFXLEtBQUssY0FBYyxLQUtsRixZQUFhLENBQUMsRUFBUSxFQUFZLENBQUEsR0FBTSxHQUFHLEVBQWMsQ0FBQSxHQUFNLE1BQzdELElBQUksRUFBTSxJQUFJLElBQ2QsSUFBQSxJQUFTLEtBQWdCLEVBQ3ZCLEVBQUksSUFBSSxFQUFTLEdBQWUsRUFBVyxFQUFPLEtBRXBELE9BQU8sR0FNVCxXQUFhLElBQ04sS0FBSyxnQkFBZSxLQUFLLGNBQWdCLElBQUksWUFBWSxVQUN2RCxLQUFLLGNBQWMsT0FBTyxJQUduQyxXQUFhLElBQ04sS0FBSyxnQkFBZSxLQUFLLGNBQWdCLElBQUksWUFBWSxVQUN2RCxLQUFLLGNBQWMsT0FBTyxJQUluQyxNQUFPLENBQUMsRUFBTyxLQUNiLElBQUksRUFBUSxFQUNaLEtBQU8sRUFBUSxHQUNiLEVBQVMsRUFBTyxHQUNoQixHQUFTLEdBS2IsU0FBVSxDQUFDLEVBQU8sSUFDVCxNQUFNLEtBQUssS0FBSyxpQkFBaUIsRUFBTyxJQUlqRCxpQkFBa0IsVUFBVyxFQUFPLEdBQ2xDLElBQUksRUFBUSxFQUNaLEtBQU8sRUFBUSxTQUNQLEVBQVMsRUFBTyxHQUN0QixHQUFTLEdBTWIsTUFBTyxDQUFDLEVBQVcsRUFBVyxFQUFZLEVBQUEsSUFDakMsTUFBTSxLQUFLLEtBQUssY0FBYyxFQUFXLEVBQVcsSUFLN0QsY0FBZSxVQUFVLEVBQVcsRUFBVyxFQUFZLEVBQUEsR0FDekQsSUFBSSxFQUFRLEVBQVUsT0FBTyxZQUM3QixLQUFPLEVBQVksR0FBRyxDQUNwQixJQUFJLEVBQVEsR0FDWixLQUFPLEVBQU0sT0FBUyxHQUFXLENBQy9CLElBQUksRUFBUyxFQUFNLE9BQ25CLEdBQUksRUFBTyxLQUVULFlBREksRUFBTSxPQUFTLFNBQStCLGlCQUFkLEVBQTBCLEVBQU0sS0FBSyxJQUFNLElBRy9FLEVBQU0sS0FBSyxFQUFPLFlBR00saUJBQWQsRUFBMEIsRUFBTSxLQUFLLElBQU0sRUFDekQsR0FBYSxJQU1qQixjQUFlLE1BQUEsSUFDYixJQUFJLFFBQWEsTUFBTSxFQUFNLENBQUUsS0FBTSxnQkFDckMsSUFBSyxFQUFLLEdBQUksTUFBTSxJQUFJLDRDQUE0QyxFQUFLLDBCQUEwQixxQkFDbkcsT0FBTyxPQUFPLFdBQVcsRUFBSyxnQkFJaEMsWUFBYSxNQUFPLEVBQU0sS0FHeEIsT0FEQSxFQURjLENBQUMsS0FBTSxRQUFTLE9BQVEsVUFBVyxPQUFRLFVBQVcsT0FBUSxXQUMvRCxJQUFTLEVBQ2YsSUFBSSxpQkFBaUIsT0FBTyxPQUFPLE9BQU8sRUFBTSxNQUkzRCxNQUFNLG1CQUFxQixLQUFLLFNBQVMsSUFBUyxJQUMvQyxLQUFPLEVBQU8sU0FBUyxJQUFJLGVBQWUsT0FBTyxJQUdwRCxPQUFPLFFBQVU7Ozs7OztBQy9LakIsTUFBTSxPQUFTLFFBQVEsV0FDakIsS0FBTyxRQUFRLFFBR3JCLE1BQU0sY0FVSixZQUFZLEVBQVMsSUFDbkIsS0FBSyxPQUFTLEVBSWQsS0FBSyxTQUFXLENBQ2QsYUFBYyxLQUFLLE9BQU8sY0FBZ0IsU0FDMUMsV0FBWSxLQUFLLE9BQU8sWUFBYyxJQUN0QyxXQUFZLEtBQUssT0FBTyxZQUFjLEVBQ3RDLGVBQWdCLEtBQUssT0FBTyxnQkFBa0IsS0FBSyxNQUNuRCxXQUFZLEtBQUssT0FBTyxZQUFjLEVBQ3RDLFVBQVcsS0FBSyxPQUFPLFdBQWEsSUFLeEMsYUFFRSxPQURBLEtBQUssU0FBVyxLQUFLLFlBQVksS0FBSyxPQUFPLEdBQUcsWUFBWSxLQUFLLE9BQU8sdUJBQ2pFLEtBS1Qsa0JBQWtCLEdBQ1osS0FBSyxPQUFPLGFBQVksRUFBYSxLQUFLLE9BQU8sV0FBVyxJQUNoRSxJQUFJLFFBQWlCLEtBQUssT0FBTyxPQUFPLEtBQUssU0FBUyxhQUFjLE9BQU8sV0FBVyxJQUNsRixFQUFXLFNBQVMsT0FBTyxrQkFBa0IsRUFBVSxLQUFLLFNBQVMsWUFBYSxHQUNsRixFQUFXLFNBQVMsT0FBTyxrQkFBa0IsRUFBVSxLQUFLLFNBQVMsV0FBWSxHQUNyRixNQUFPLENBQUUsU0FBVSxFQUFZLFNBQUEsRUFBVSxRQUFBLEVBQVMsUUFBUyxLQUFLLE9BQU8sZUFBZSxLQUFZLFVBSXBHLG9CQUFvQixFQUFZLEdBRTlCLElBQU0sS0FBTSxFQUFSLFNBQW1CLFNBQW1CLEtBQUssWUFBWSxHQUd2RCxFQUFjLEtBQUssT0FBTyxFQUFZLElBQUksS0FBSyxNQUUvQyxFQUFlLEVBQVksSUFBSSxHQUFLLEVBQUksR0FFeEMsRUFBZSxPQUFPLFdBQVcsRUFBYyxLQUFLLFNBQVMsWUFFN0QsRUFBYSxPQUFPLE9BQU8sQ0FBQyxFQUFVLEVBQWEsR0FBYyxJQUFJLEdBQUssS0FBSyxPQUFPLFdBRXBGLEtBQUssT0FBTyxHQUFHLFdBQVcsU0FDMUIsS0FBSyxPQUFPLEdBQUcsV0FBVyxFQUFXLEdBSTdDLGFBQWEsR0FFWCxJQUFNLEtBQU0sRUFBUixTQUFtQixTQUFtQixLQUFLLFlBQVksR0FFdkQsRUFBWSxLQUFLLGdCQUFnQixLQUFLLE9BQU8sR0FBRyxTQUFTLElBRTdELElBQUEsSUFBVSxFQUFXLEVBQWEsS0FBaUIsT0FBTyxjQUFjLEVBQVcsR0FDakYsR0FBSSxHQUFZLEVBQVcsQ0FFekIsT0FEbUIsT0FBTyxhQUFhLEVBQWMsS0FBSyxTQUFTLFdBQVksS0FBSyxTQUFTLFlBQ3pFLElBQUksR0FBSyxFQUFJLElBTXZDLG1CQUNRLEtBQUssT0FBTyxHQUFHLGFBQWEsS0FBSyxPQUFPLHFCQUFzQixPQUFPLFdBQVcsS0FBSyxVQUFVLEtBQUssU0FBVSxLQUFNLE1BSTlILE9BQU8sUUFBVTs7Ozs7QUMvRmpCLE1BQU0sR0FBSyxDQUVULElBQUssSUFBSSxJQUFXLEVBQVEsT0FBTyxDQUFDLEVBQUUsSUFBSyxFQUFFLElBQUksQ0FBQyxFQUFLLElBQU8sRUFBTSxFQUFFLEtBR3RFLFNBQVUsQ0FBQyxFQUFNLElBQ2YsRUFBSyxJQUFLLEdBQVEsRUFBSyxJQUFJLENBQUMsRUFBRyxJQUFLLEVBQUksRUFBSSxLQUc5QyxLQUFNLElBQUksSUFBUSxHQUFHLFNBQVMsQ0FBQyxHQUFHLE9BQU8sSUFBUSxHQUFHLE1BQU0sRUFBSSxFQUFLLE9BQVEsRUFBSyxHQUFHLFNBQVMsR0FHNUYsTUFBTyxDQUFDLEVBQU8sS0FDYixJQUFJLEVBQVEsR0FDWixJQUFLLElBQUksRUFBSSxFQUFHLEVBQUksRUFBTSxJQUFLLEVBQU0sS0FBSyxHQUMxQyxPQUFPLEdBSVQsZ0JBQWlCLENBQUMsRUFBRyxLQUNuQixJQUFJLEVBQVMsRUFDYixJQUFLLElBQUksRUFBSSxFQUFHLEVBQUksRUFBRSxPQUFRLElBQUssQ0FDakMsTUFBTSxFQUFPLEVBQUUsR0FBSyxFQUFFLEdBQ3RCLEdBQVUsRUFBTyxFQUVuQixPQUFPLEdBS1QsVUFBVyxJQUFJLEtBRWIsR0FBSSxFQUFRLFFBQVUsRUFBRyxNQUFPLENBQUMsR0FFakMsSUFBSSxFQUFhLEdBQUcsUUFBUSxHQUU1QixPQUFPLEVBQVEsSUFBSSxHQUFLLEdBQUcsZ0JBQWdCLEVBQUcsTUFJNUIsaUJBQWxCLFNBQ0YsT0FBTyxRQUFVOzs7QUMxQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0MUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2ekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzdtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeGdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDanZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQSxhQUVBLElBQUkscUJBQXVCLFdBQ3ZCLG9CQUFzQixXQUN0QixtQkFBcUIsU0FDckIsa0JBQW9CLFNBQ3BCLGdCQUFrQixXQUVsQixVQUFZLENBQ2QsSUFBSyxPQUFRLElBQUssTUFBTyxNQUFPLEtBQU0sT0FBUSxPQUFRLE1BQU8sS0FBTSxJQUNuRSxNQUFPLE9BQVEsSUFBSyxLQUFNLEtBQU0sTUFBTyxPQUFRLElBQUssTUFBTyxRQUFTLE9BQ3BFLFNBQVUsTUFBTyxNQUFPLE9BQVEsSUFBSyxNQUFPLE9BRzFDLGNBQWdCLENBQ2xCLE9BQVEsTUFBTyxZQUdqQixPQUFPLFFBQVUsU0FBUyxFQUFhLEVBQUksR0FDekMsR0FBSyxNQUFNLFFBQVEsR0FPbkIsSUFMQSxJQUdJLEVBQU8sRUFIUCxFQUFXLEVBQUcsU0FBUyxjQUV2QixHQUFVLEVBR0wsRUFBSSxFQUFHLEVBQU0sRUFBTyxPQUFRLEVBQUksRUFBSyxJQUFLLENBQ2pELElBQUksRUFBTyxFQUFPLEdBQ2xCLEdBQUksTUFBTSxRQUFRLEdBQ2hCLEVBQVksRUFBSSxPQURsQixFQUtvQixpQkFBVCxHQUNPLGtCQUFULEdBQ1MsbUJBQVQsR0FDUCxhQUFnQixNQUNoQixhQUFnQixVQUNoQixFQUFPLEVBQUssWUFHZCxJQUFJLEVBQVksRUFBRyxXQUFXLEVBQUcsV0FBVyxPQUFTLEdBR3JELEdBQW9CLGlCQUFULEVBQ1QsR0FBVSxFQUdOLEdBQW9DLFVBQXZCLEVBQVUsU0FDekIsRUFBVSxXQUFhLEdBSXZCLEVBQU8sRUFBRyxjQUFjLGVBQWUsR0FDdkMsRUFBRyxZQUFZLEdBQ2YsRUFBWSxHQUtWLElBQU0sRUFBTSxJQUNkLEdBQVUsR0FHMkIsSUFBakMsVUFBVSxRQUFRLEtBQ2lCLElBQXJDLGNBQWMsUUFBUSxHQU1SLE1BTGQsRUFBUSxFQUFVLFVBQ2YsUUFBUSxvQkFBcUIsSUFDN0IsUUFBUSxtQkFBb0IsSUFDNUIsUUFBUSxxQkFBc0IsSUFDOUIsUUFBUSxnQkFBaUIsTUFFMUIsRUFBRyxZQUFZLEdBRWYsRUFBVSxVQUFZLEdBRXNCLElBQXJDLGNBQWMsUUFBUSxLQUkvQixFQUFlLElBQU4sRUFBVSxHQUFLLElBQ3hCLEVBQVEsRUFBVSxVQUNmLFFBQVEsb0JBQXFCLEdBQzdCLFFBQVEsa0JBQW1CLEtBQzNCLFFBQVEsbUJBQW9CLElBQzVCLFFBQVEscUJBQXNCLElBQzlCLFFBQVEsZ0JBQWlCLEtBQzVCLEVBQVUsVUFBWSxTQUtyQixHQUFJLEdBQVEsRUFBSyxTQUFVLENBRTVCLElBQ0YsR0FBVSxHQUkyQixJQUFqQyxVQUFVLFFBQVEsS0FDaUIsSUFBckMsY0FBYyxRQUFRLEdBT1IsTUFOZCxFQUFRLEVBQVUsVUFDZixRQUFRLG9CQUFxQixJQUM3QixRQUFRLHFCQUFzQixLQUM5QixRQUFRLGdCQUFpQixNQUkxQixFQUFHLFlBQVksR0FFZixFQUFVLFVBQVksR0FHc0IsSUFBckMsY0FBYyxRQUFRLEtBQy9CLEVBQVEsRUFBVSxVQUNmLFFBQVEsa0JBQW1CLEtBQzNCLFFBQVEsb0JBQXFCLElBQzdCLFFBQVEscUJBQXNCLEtBQzlCLFFBQVEsZ0JBQWlCLEtBQzVCLEVBQVUsVUFBWSxJQUsxQixJQUFJLEVBQVksRUFBSyxTQUNqQixJQUFXLEVBQVcsRUFBVSxlQUdwQyxFQUFHLFlBQVk7OztBQ2hJckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IFNlYXJjaExpYnJhcnkgPSByZXF1aXJlKCcuLi9zZWFyY2gtbGlicmFyeS9saWJyYXJ5LXdlYicpXG5jb25zdCBWZWN0b3JMaWJyYXJ5ID0gcmVxdWlyZSgnLi4vdmVjdG9yLWxpYnJhcnkvbGlicmFyeScpXG5jb25zdCBTZWFyY2hRdWVyeSA9IHJlcXVpcmUoJy4vcXVlcnknKVxuY29uc3QgVlUgPSByZXF1aXJlKCcuLi92ZWN0b3ItdXRpbGl0aWVzJylcbmNvbnN0IGZzdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKVxuXG5jbGFzcyBTZWFyY2hFbmdpbmUge1xuICAvLyByZXF1aXJlcyBhIGNvbmZpZyBvYmplY3QgY29udGFpbmluZzpcbiAgLy8gICBzZWFyY2hMaWJyYXJ5UGF0aDogcGF0aCB0byBzZWFyY2ggbGlicmFyeSBkaXJlY3RvcnlcbiAgLy8gICB2ZWN0b3JMaWJyYXJ5UGF0aDogcGF0aCB0byB2ZWN0b3IgbGlicmFyeSBkaXJlY3RvcnlcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgdGhpcy5yZWFkeSA9IGZhbHNlXG4gICAgdGhpcy5yZWFkeUhhbmRsZXJzID0gW11cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICB9XG5cbiAgLy8gbG9hZCB0aGUgbmVjZXNzYXJ5IGluZGV4IGRhdGEgdG8gYmUgcmVhZHkgdG8gYWNjZXB0IHF1ZXJpZXNcbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0cnkge1xuICAgICAgW3RoaXMuc2VhcmNoTGlicmFyeSwgdGhpcy52ZWN0b3JMaWJyYXJ5XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgKG5ldyBTZWFyY2hMaWJyYXJ5KHsgcGF0aDogdGhpcy5jb25maWcuc2VhcmNoTGlicmFyeVBhdGggfSkpLm9wZW4oKSxcbiAgICAgICAgKG5ldyBWZWN0b3JMaWJyYXJ5KHtcbiAgICAgICAgICBwYXRoOiB0aGlzLmNvbmZpZy52ZWN0b3JMaWJyYXJ5UGF0aCxcbiAgICAgICAgICBmczogeyByZWFkRmlsZTogZnN1dGlsLmZldGNoTGlrZUZpbGUgfSxcbiAgICAgICAgICBkaWdlc3Q6IGZzdXRpbC5kaWdlc3RPbldlYlxuICAgICAgICB9KSkub3BlbigpXG4gICAgICBdKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5yZWFkeUhhbmRsZXJzLmZvckVhY2goKFtyZXNvbHZlLCByZWplY3RdKSA9PiByZWplY3QoZXJyKSlcbiAgICAgIHRoaXMucmVhZHlIYW5kbGVycyA9IFtdXG4gICAgICB0aHJvdyBlcnJcbiAgICB9XG4gICAgdGhpcy5yZWFkeSA9IHRydWVcbiAgICB0aGlzLnJlYWR5SGFuZGxlcnMuZm9yRWFjaCgoW3Jlc29sdmUsIHJlamVjdF0pID0+IHJlc29sdmUodGhpcykpXG4gICAgdGhpcy5yZWFkeUhhbmRsZXJzID0gW11cbiAgfVxuXG4gIC8vIHJldHVybnMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIG9uY2UgdGhlIHNlYXJjaCBlbmdpbmUgaXMgZnVsbHkgbG9hZGVkIGFuZCByZWFkeSB0byBhY2NlcHQgcXVlcmllc1xuICBhd2FpdFJlYWR5KCkge1xuICAgIGlmICh0aGlzLnJlYWR5KSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMucmVhZHlIYW5kbGVycy5wdXNoKFtyZXNvbHZlLCByZWplY3RdKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvLyByZXR1cm5zIGEgbGlzdCBvZiBzZWFyY2ggcmVzdWx0IG9iamVjdHMsIHdoaWNoIGNhbiBiZSBwYXNzZWQgdG8gQGZldGNoIHRvIGFzeW5jcm9ub3VzbHkgbG9hZCBzZWFyY2ggcmVzdWx0IHByZXNlbnRhdGlvbiBpbmZvcm1hdGlvblxuICBhc3luYyBxdWVyeShxdWVyeVRleHQpIHtcbiAgICBhd2FpdCB0aGlzLmF3YWl0UmVhZHkoKVxuXG4gICAgLy8gcGFyc2UgdGhlIHF1ZXJ5IHNlYXJjaCBpbnB1dCB0ZXh0IGluIHRvIHRva2Vuc1xuICAgIGxldCBxdWVyeSA9IG5ldyBTZWFyY2hRdWVyeShxdWVyeVRleHQpXG4gICAgLy8gbG9va3VwIGV2ZXJ5IGtleXdvcmQgYW5kIHJlcGxhY2UgaXQgd2l0aCBhIHdvcmQgdmVjdG9yIGlmIHBvc3NpYmxlXG4gICAgYXdhaXQgcXVlcnkudmVjdG9yaXplKHRoaXMudmVjdG9yTGlicmFyeSlcblxuICAgIC8vIGZpbHRlciByZXN1bHRzIGZvciBoYXNodGFnIG1hdGNoaW5nXG4gICAgbGV0IHBvc2l0aXZlVGFncyA9IHF1ZXJ5Lmhhc2h0YWdzLmZpbHRlcih4ID0+ICB4LnBvc2l0aXZlKS5tYXAoeCA9PiB4LnRleHQpXG4gICAgbGV0IG5lZ2F0aXZlVGFncyA9IHF1ZXJ5Lmhhc2h0YWdzLmZpbHRlcih4ID0+ICF4LnBvc2l0aXZlKS5tYXAoeCA9PiB4LnRleHQpXG4gICAgLy8gcXVlcnkgdGhlIHNlYXJjaCBpbmRleCBmb3IgdGhlc2Uga2V5d29yZHMgKGJvdGggdmVjdG9ycyBhbmQgcGxhaW50ZXh0KVxuICAgIGxldCByZXN1bHRzID0gYXdhaXQgdGhpcy5zZWFyY2hMaWJyYXJ5LnF1ZXJ5KChyZXN1bHQpPT4ge1xuICAgICAgaWYgKHBvc2l0aXZlVGFncy5zb21lKHRhZyA9PiAhcmVzdWx0LnRhZ3MuaW5jbHVkZXModGFnKSkpIHJldHVybiBmYWxzZSAvLyBleGNsdWRlIG5vbiBtYXRjaGluZyBwb3NpdGl2ZSB0YWdzXG4gICAgICBpZiAobmVnYXRpdmVUYWdzLnNvbWUodGFnID0+IHJlc3VsdC50YWdzLmluY2x1ZGVzKHRhZykpKSByZXR1cm4gZmFsc2UgLy8gZXhjbHVkZSBpZiBhbnkgYW50aXRhZ3MgbWF0Y2hcblxuICAgICAgbGV0IGRpc3RhbmNlcyA9IHJlc3VsdC50ZXJtcy5tYXAocmVzdWx0VGVybSA9PiB7XG4gICAgICAgIHJldHVybiBNYXRoLm1pbiguLi5xdWVyeS5rZXl3b3Jkcy5tYXAocXVlcnlUZXJtID0+IHtcbiAgICAgICAgICBpZiAocXVlcnlUZXJtLmNvbnN0cnVjdG9yID09IFNlYXJjaFF1ZXJ5LldvcmRWZWN0b3IpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YocmVzdWx0VGVybSkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIHJldHVybiBWVS5kaXN0YW5jZVNxdWFyZWQocXVlcnlUZXJtLnZlY3RvciwgcmVzdWx0VGVybSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgeyAvLyBwbGFpbnRleHQga2V5d29yZCBvYmplY3RcbiAgICAgICAgICAgIGlmICh0eXBlb2YocmVzdWx0VGVybSkgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgaWYgKHF1ZXJ5VGVybS50ZXh0ID09IHJlc3VsdFRlcm0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHF1ZXJ5VGVybS50ZXh0LnRvTG93ZXJDYXNlKCkgPT0gcmVzdWx0VGVybS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDAuMjVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gMTAgLy8gYmFkL2luY29tcGF0aWJsZSBtYXRjaCBiZXR3ZWVuIHRoaXMga2V5d29yZCBwYWlyXG4gICAgICAgIH0pKVxuICAgICAgfSlcblxuICAgICAgLy8gYWRkIHRoZSBkaXN0YW5jZXMgdG9nZXRoZXIgZm9yIGVhY2ggcmVzdWx0IHRlcm1cbiAgICAgIGxldCBhZGRlZERpc3RhbmNlcyA9IGRpc3RhbmNlcy5yZWR1Y2UoKHgseSk9PiB4ICsgeSwgMClcbiAgICAgIC8vIGNhbGN1bGF0ZSBhIGZpbmFsIGRpc3RhbmNlIGJ5IGFkZGluZyB0ZXJtIGRpdmVyc2l0eSBzY29yZVxuICAgICAgcmV0dXJuIGFkZGVkRGlzdGFuY2VzICsgKHJlc3VsdC50ZXJtRGl2ZXJzaXR5IC8gNTAwKVxuICAgIH0pXG5cbiAgICAvLyBzb3J0IHJlc3VsdHMgYW5kIHJldHVybiB0aGVtXG4gICAgcmV0dXJuIHJlc3VsdHMuc29ydCgoYSxiKSA9PiBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZSlcbiAgfVxuXG4gIC8vIHJldHVybnMgYW4gb2JqZWN0LCB3aXRoIGhhc2h0YWcgdGV4dCBsYWJlbHMgYXMga2V5cywgYW5kIGludGVnZXJzIGFzIHZhbHVlcywgdGhlIGludGVnZXIgaXMgdGhlIHRvdGFsIG51bWJlciBvZiBzZWFyY2ggcmVzdWx0cyBmZWF0dXJpbmcgdGhhdCBoYXNodGFnXG4gIGFzeW5jIGdldFRhZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5hd2FpdFJlYWR5KClcbiAgICByZXR1cm4gdGhpcy5zZWFyY2hMaWJyYXJ5LmdldFRhZ3MoKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2VhcmNoRW5naW5lIiwiLy8gUGFyc2VzIHRleHQgc2VhcmNoIHN0cmluZ3MgYW5kIHJldHVybnMgc3RydWN0dXJlZCBkYXRhIGRlc2NyaWJpbmcgdGhlIHRva2VucyBpbiB0aGUgcXVlcnkgbGlrZSBoYXNodGFncyBhbmQga2V5d29yZHNcbmNsYXNzIFNlYXJjaFF1ZXJ5IHtcbiAgY29uc3RydWN0b3IocXVlcnlUZXh0KSB7XG4gICAgLy8gdG9rZW5pc2Ugc2VhcmNoIHN0cmluZyBpbiB0byBpbmRpdmlkdWFsIHBpZWNlc1xuICAgIHRoaXMucmF3VG9rZW5zID0gcXVlcnlUZXh0LnRyaW0oKS5zcGxpdCgvW1xcdFxcbiw/ITs6XFxbXFxdXFwoXFwpe30gXCLigJ3igJxdKy8pLmZpbHRlcih4ID0+IHgudG9TdHJpbmcoKS50cmltKCkubGVuZ3RoID4gMClcblxuICAgIC8vIG1hcCBlYWNoIHBpZWNlIGluIHRvIGEgdG9rZW4gb2JqZWN0XG4gICAgdGhpcy50b2tlbnMgPSB0aGlzLnJhd1Rva2Vucy5tYXAoKHJhd1Rva2VuKSA9PiB7XG4gICAgICBpZiAocmF3VG9rZW4ubWF0Y2goL14tIyhbYS16QS1aMC05Ll8tXSspJC8pKSB7XG4gICAgICAgIHJldHVybiBuZXcgSGFzaHRhZ1Rva2VuKHJhd1Rva2VuLnNsaWNlKDIpLCBmYWxzZSlcbiAgICAgIH0gZWxzZSBpZiAocmF3VG9rZW4ubWF0Y2goL14jKFthLXpBLVowLTkuXy1dKykkLykpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBIYXNodGFnVG9rZW4ocmF3VG9rZW4uc2xpY2UoMSksIHRydWUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBub3JtYWxpc2UgdW5pY29kZSBhcG9zdHJvcGhlcyBpbiB0byBhc2NpaSBhcG9zdHJvcGhlc1xuICAgICAgICBsZXQgY2xlYW5lZFRlcm0gPSByYXdUb2tlbi50cmltKCkucmVwbGFjZSgv4oCYL2csIFwiJ1wiKVxuICAgICAgICAvLyBpZiB0aGUga2V5d29yZCBjb250YWlucyBhbnkgbG93ZXIgY2FzZSBsZXR0ZXJzIChub3QgYW4gYWNyb255bSksIG9yIGlzIGEgc2luZ2xlIGxldHRlciwgbG93ZXJjYXNlIGl0XG4gICAgICAgIGlmIChjbGVhbmVkVGVybS5tYXRjaCgvW2Etel0vKSB8fCBjbGVhbmVkVGVybS5sZW5ndGggPCAyKSBjbGVhbmVkVGVybSA9IGNsZWFuZWRUZXJtLnRvTG93ZXJDYXNlKClcblxuICAgICAgICByZXR1cm4gbmV3IEtleXdvcmRUb2tlbihjbGVhbmVkVGVybSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLy8gdHJhbnNmb3JtcyBrZXl3b3JkcyBpbiB0byBXb3JkIFZlY3RvcnNcbiAgYXN5bmMgdmVjdG9yaXplKHZlY3RvckxpYnJhcnkpIHtcbiAgICB0aGlzLnRva2VucyA9IGF3YWl0IFByb21pc2UuYWxsKHRoaXMudG9rZW5zLm1hcChhc3luYyAodG9rZW4pID0+IHtcbiAgICAgIGlmICh0b2tlbi5jb25zdHJ1Y3RvciA9PSBLZXl3b3JkVG9rZW4pIHtcbiAgICAgICAgbGV0IHZlY3RvciA9IGF3YWl0IHZlY3RvckxpYnJhcnkubG9va3VwKHRva2VuKVxuICAgICAgICBpZiAodmVjdG9yKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBXb3JkVmVjdG9yKHRva2VuLCB2ZWN0b3IpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRva2VuXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0b2tlblxuICAgICAgfVxuICAgIH0pKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBnZXQgYW4gYXJyYXkgb2Yga2V5d29yZHMgaW4gdGhlIHNlYXJjaCBxdWVyeVxuICBnZXQga2V5d29yZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9rZW5zLmZpbHRlcih0b2tlbiA9PiAodG9rZW4uY29uc3RydWN0b3IgPT0gS2V5d29yZFRva2VuIHx8IHRva2VuLmNvbnN0cnVjdG9yID09IFdvcmRWZWN0b3IpKVxuICB9XG5cbiAgLy8gZ2V0IGFuIGFycmF5IG9mIGhhc2h0YWdzIGluIHRoZSBzZWFyY2ggcXVlcnlcbiAgZ2V0IGhhc2h0YWdzKCkge1xuICAgIHJldHVybiB0aGlzLnRva2Vucy5maWx0ZXIodG9rZW4gPT4gdG9rZW4uY29uc3RydWN0b3IgPT0gSGFzaHRhZ1Rva2VuKVxuICB9XG5cbiAgLy8gYnVpbGQgYW4gZXF1aXZpbGVudCBxdWVyeSB0byB3aGF0IHdhcyBvcmlnaW5hbGx5IHF1ZXJpZWQgZnJvbSB0aGUgc3RydWN0dXJlZCBkYXRhXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLnRva2Vucy5qb2luKCcgJylcbiAgfVxufVxuXG4vLyByZXByZXNlbnRzIGEgcGFyc2VkIGhhc2h0YWdcbmNsYXNzIEhhc2h0YWdUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHRleHQsIHBvc2l0aXZlID0gdHJ1ZSkge1xuICAgIHRoaXMudGV4dCA9IHRleHQudG9TdHJpbmcoKVxuICAgIHRoaXMucG9zaXRpdmUgPSAhIXBvc2l0aXZlXG4gIH1cblxuICB0b1N0cmluZygpIHsgcmV0dXJuIGAkeyB0aGlzLnBvc2l0aXZlID8gJyMnIDogJy0jJyB9JHt0aGlzLnRleHR9YH1cbn1cblxuLy8gcmVwcmVzZW50cyBhIHBsYWludGV4dCBrZXl3b3JkXG5jbGFzcyBLZXl3b3JkVG9rZW4ge1xuICBjb25zdHJ1Y3Rvcih0ZXh0KSB7XG4gICAgdGhpcy50ZXh0ID0gdGV4dC50b1N0cmluZygpXG4gIH1cblxuICAvLyBjb252ZXJ0IHRvIHRleHQgZm9yIGRpc3BsYXlcbiAgdG9TdHJpbmcoKSB7IHJldHVybiB0aGlzLnRleHQgfVxuICAvLyBjb252ZXJ0IHRvIHRoZSBmb3JtYXQgdXNlZCBieSBTZWFyY2hMaWJyYXJ5UmVhZGVyIGxvb2t1cHNcbiAgdG9RdWVyeSgpIHsgcmV0dXJuIHRoaXMudGV4dCB9XG59XG5cbi8vIHJlcHJlc2VudHMgYSB3b3JkIHZlY3RvciwgdGhlIG91dHB1dCBvZiB0aGUgU2VhcmNoUXVlcnkjdmVjdG9yaXplIG1ldGhvZFxuY2xhc3MgV29yZFZlY3RvciB7XG4gIGNvbnN0cnVjdG9yKHRleHQsIHZlY3Rvcikge1xuICAgIHRoaXMudGV4dCA9IHRleHQudG9TdHJpbmcoKVxuICAgIHRoaXMudmVjdG9yID0gdmVjdG9yXG4gIH1cblxuICAvLyBjb252ZXJ0IHRvIHRleHQgZm9yIGRpc3BsYXlcbiAgdG9TdHJpbmcoKSB7IHJldHVybiB0aGlzLnRleHQgfVxuICAvLyBjb252ZXJ0IHRvIHRoZSBmb3JtYXQgdXNlZCBieSBTZWFyY2hMaWJyYXJ5UmVhZGVyIGxvb2t1cHNcbiAgdG9RdWVyeSgpIHsgcmV0dXJuIHRoaXMudmVjdG9yIH1cbn1cblxuU2VhcmNoUXVlcnkuSGFzaHRhZ1Rva2VuID0gSGFzaHRhZ1Rva2VuXG5TZWFyY2hRdWVyeS5LZXl3b3JkVG9rZW4gPSBLZXl3b3JkVG9rZW5cblNlYXJjaFF1ZXJ5LldvcmRWZWN0b3IgICA9IFdvcmRWZWN0b3JcblxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hRdWVyeSIsIi8vIFBhZ2luYXRvciB3aWRnZXQgZ2VuZXJhdGVzIGEgbGlzdCBvZiBwYWdlIGJ1dHRvbnMgd2l0aCBvbmUgc2VsZWN0ZWRcblxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJ25hbm9odG1sJylcblxuY2xhc3MgUGFnaW5hdG9yQ29tcG9uZW50IHtcbiAgLy8gY29uc3RydWN0IGEgcGFnaW5hdG9yIHZpZXdcbiAgLy8gYWNjZXB0cyBhIGNvbmZpZyBvYmplY3Q6XG4gIC8vICAgbGVuZ3RoOiAoZGVmYXVsdCAxKSB0b3RhbCBudW1iZXIgb2YgcGFnZXMgdG8gZGlzcGxheVxuICAvLyAgIHNlbGVjdGVkOiAoZGVmYXVsdCAwKSB6ZXJvIGluZGV4ZWQgY3VycmVudGx5IHNlbGVjdGVkIHBhZ2VcbiAgLy8gICBnZXRVUkw6IChkZWZhdWx0IGA/cGFnZT0ke3BhZ2VOdW19YCkgYSBmdW5jdGlvbiwgd2hpY2ggaXMgZ2l2ZW4gYSBwYWdlIG51bWJlciwgYW5kIHJldHVybnMgYSB1cmwgdG8gdGhhdCBwYWdlXG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgIHRoaXMubGVuZ3RoID0gY29uZmlnLmxlbmd0aCB8fCAxXG4gICAgdGhpcy5zZWxlY3RlZCA9IGNvbmZpZy5zZWxlY3RlZCB8fCAwXG4gICAgdGhpcy5nZXRVUkwgPSBjb25maWcuZ2V0VVJMIHx8ICgoeCk9PiBgP3BhZ2U9JHt4fWApXG4gIH1cblxuICAvLyBzaW1wbGUgcmVpbXBsZW1lbnRhdGlvbiBvZiBSdWJ5J3MgSW50ZWdlci50aW1lcyBtZXRob2RcbiAgdGltZXNNYXAodGltZXMsIGZuKSB7XG4gICAgaWYgKHRpbWVzIDw9IDApIHJldHVybiBbXVxuICAgIGxldCByZXN1bHQgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGltZXM7IGkrKykge1xuICAgICAgcmVzdWx0LnB1c2goZm4oaSkpXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIHRvSFRNTCgpIHtcbiAgICByZXR1cm4gaHRtbGBcbiAgICA8ZGl2IGlkPVwicGFnaW5hdGlvblwiPlxuICAgICAgJHt0aGlzLnRpbWVzTWFwKHRoaXMubGVuZ3RoLCAobikgPT5cbiAgICAgICAgaHRtbGA8YSBocmVmPVwiJHt0aGlzLmdldFVSTChuKX1cIiBhcmlhLWxhYmVsPVwiUGFnZSAke24gKyAxfVwiIGFyaWEtY3VycmVudD1cIiR7dGhpcy5zZWxlY3RlZCA9PSBuID8gXCJwYWdlXCIgOiBcIlwifVwiPiR7biArIDF9PC9hPmBcbiAgICAgICl9XG4gICAgPC9kaXY+YFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnaW5hdG9yQ29tcG9uZW50IiwiY29uc3QgaHRtbCA9IHJlcXVpcmUoJ25hbm9odG1sJylcblxuY2xhc3MgU2VhcmNoUmVzdWx0UGFuZWwge1xuICAvLyBhY2NlcHRzIGEgY29uZmlnIG9iamVjdCwgd2hpY2ggaW5jbHVkZXM6XG4gIC8vIHdhcm5pbmdzOiBhbiBvYmplY3Qgd2hvc2Uga2V5cyBhcmUgaGFzaHRhZ3MsIGFuZCB2YWx1ZXMgYXJlIG9iamVjdHMgaW4gdGhlIGZvcm1hdCB7IHR5cGU6ICdjc3MgY2xhc3MgbmFtZScsIHRleHQ6ICdwbGFpbnRleHQgYWxlcnQgdG8gc2hvdyB0byB1c2VyJyB9XG4gIC8vIG9uQ2hhbmdlOiBhIGZ1bmN0aW9uIHdoaWNoIHdoZW4gZXhlY3V0ZWQgd2lsbCBjYWxsIHRvSFRNTCgpIGFuZCByZWluc2VydCB0aGUgY29tcG9uZW50IGluIHRvIHRoZSBwYWdlIHdpdGggdXBkYXRlZCBkYXRhXG4gIGNvbnN0cnVjdG9yKGNvbmZpZyA9IHt9KSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICB0aGlzLmNvbmZpZy5tZWRpYUluZGV4ID0gdGhpcy5jb25maWcubWVkaWFJbmRleCB8fCAwXG4gICAgdGhpcy5yZXN1bHQgPSBjb25maWcucmVzdWx0IHx8IG51bGxcbiAgICB0aGlzLmZvcmNlZFdhcm5pbmdzID0gW11cbiAgfVxuXG4gIHNldERhdGEocmVzdWx0RGF0YSkge1xuICAgIHRoaXMucmVzdWx0ID0gcmVzdWx0RGF0YVxuICAgIGlmICh0aGlzLmNvbmZpZy5vbkNoYW5nZSkgdGhpcy5jb25maWcub25DaGFuZ2UodGhpcylcbiAgfVxuXG4gIGFkZFdhcm5pbmcoeyB0eXBlLCB0ZXh0IH0pIHtcbiAgICB0aGlzLmZvcmNlZFdhcm5pbmdzLnB1c2goeyB0eXBlLCB0ZXh0IH0pXG4gICAgaWYgKHRoaXMuY29uZmlnLm9uQ2hhbmdlKSB0aGlzLmNvbmZpZy5vbkNoYW5nZSh0aGlzKVxuICB9XG5cbiAgcmVtb3ZlV2FybmluZyh0eXBlKSB7XG4gICAgdGhpcy5mb3JjZWRXYXJuaW5ncyA9IHRoaXMuZm9yY2VkV2FybmluZ3MuZmlsdGVyKHdhcm5pbmcgPT4gd2FybmluZy50eXBlICE9IHR5cGUpXG4gICAgaWYgKHRoaXMuY29uZmlnLm9uQ2hhbmdlKSB0aGlzLmNvbmZpZy5vbkNoYW5nZSh0aGlzKVxuICB9XG5cbiAgLy8gZ2V0IGh0bWwgKERPTSBlbGVtZW50cyBvbiBicm93c2VyLCBzdHJpbmcgb24gbm9kZWpzKSByZW5kZXJpbmcgb2YgdGhpcyBzZWFyY2ggcmVzdWx0IGNvbXBvbmVudFxuICB0b0hUTUwoKSB7XG4gICAgaWYgKHRoaXMucmVzdWx0ICYmIHRoaXMucmVzdWx0LmlzRmV0Y2hlZCgpKSB7XG4gICAgICByZXR1cm4gdGhpcy50b1BvcHVsYXRlZEhUTUwoKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy50b1BsYWNlaG9sZGVySFRNTCgpXG4gICAgfVxuICB9XG5cbiAgLy8gZ2V0IGFuIGFycmF5IG9mIHdhcm5pbmdzIHRvIGRpc3BsYXkgb24gdGhpcyBzZWFyY2ggcmVzdWx0XG4gIGdldFdhcm5pbmdzKCkge1xuICAgIGxldCB0cmlnZ2VycyA9IHRoaXMuY29uZmlnLndhcm5pbmdzIHx8IHt9XG4gICAgbGV0IG1hdGNoZXMgPSBPYmplY3Qua2V5cyh0cmlnZ2VycykuZmlsdGVyKHRhZyA9PiB0aGlzLnJlc3VsdC50YWdzLmluY2x1ZGVzKHRhZykpXG4gICAgcmV0dXJuIFsuLi5tYXRjaGVzLm1hcCh0YWcgPT4gdHJpZ2dlcnNbdGFnXSApLCAuLi50aGlzLmZvcmNlZFdhcm5pbmdzXVxuICB9XG5cbiAgLy8gZ2V0IGFuIElEIHRvIHVzZSB3aXRoIHRoaXMgZWxlbWVudFxuICB0b0lEKC4uLnBhdGgpIHtcbiAgICBpZiAodGhpcy5yZXN1bHQpIHtcbiAgICAgIHJldHVybiBbJ3Jlc3VsdCcsIHRoaXMucmVzdWx0LmlkLCAuLi5wYXRoXS5qb2luKCctJylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcnXG4gICAgfVxuICB9XG5cbiAgdG9NZWRpYVZpZXdlcigpIHtcbiAgICAvLyBvbkNsaWNrIGhhbmRsZXIgZm9yIGFycm93IGJ1dHRvbnMgb24gbWVkaWEgY2Fyb3VzZWxcbiAgICBsZXQgYWRqdXN0TWVkaWEgPSAoZXZlbnQsIGFkanVzdG1lbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICB0aGlzLmNvbmZpZy5tZWRpYUluZGV4ICs9IGFkanVzdG1lbnRcbiAgICAgIHRoaXMuY29uZmlnLm9uQ2hhbmdlKHRoaXMpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvLyBzaG91bGQgdGhlIHByZXZpb3VzL25leHQgdmlkZW8gYnV0dG9ucyBiZSB2aXNpYmxlIHRvIHRoZSB1c2VyIGFuZCB2aXNpYmxlIHRvIHNjcmVlbnJlYWRlciB1c2Vyc1xuICAgIGxldCBzaG93UHJldkJ0biA9IHRoaXMuY29uZmlnLm1lZGlhSW5kZXggPiAwXG4gICAgbGV0IHNob3dOZXh0QnRuID0gdGhpcy5jb25maWcubWVkaWFJbmRleCA8IHRoaXMucmVzdWx0Lm1lZGlhLmxlbmd0aCAtIDFcbiAgICAvLyBnZXQgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBwaWVjZSBvZiBtZWRpYeKAmXMgc291cmNlIGxpc3RcbiAgICBsZXQgc291cmNlcyA9IHRoaXMucmVzdWx0Lm1lZGlhW3RoaXMuY29uZmlnLm1lZGlhSW5kZXhdXG5cbiAgICAvLyBidWlsZCBtZWRpYSB2aWV3ZXIgRE9NXG4gICAgcmV0dXJuIGh0bWxgXG4gICAgPGRpdiBjbGFzcz1cInZpZGVvX3BsYXllclwiPlxuICAgICAgPHBpY3R1cmUgY2xhc3M9XCJ2aWRlb190aHVtYlwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIGRhdGEtbmFub21vcnBoLWNvbXBvbmVudC1pZD1cIiR7dGhpcy5yZXN1bHQuaWR9L21lZGlhLyR7dGhpcy5jb25maWcubWVkaWFJbmRleH1cIj5cbiAgICAgICAgJHtzb3VyY2VzLm1hcChzb3VyY2UgPT4gaHRtbGA8c291cmNlIHNyY3NldD1cIiR7c291cmNlLnVybH1cIiB0eXBlPVwiJHtzb3VyY2UudHlwZX1cIj5gICl9XG4gICAgICAgIDx2aWRlbyBjbGFzcz1cInZpZGVvX3RodW1iXCIgbXV0ZWQgcHJlbG9hZCBhdXRvcGxheSBsb29wIHBsYXlzaW5saW5lPlxuICAgICAgICAgICR7c291cmNlcy5tYXAoc291cmNlID0+IGh0bWxgPHNvdXJjZSBzcmM9XCIke3NvdXJjZS51cmx9XCIgdHlwZT1cIiR7c291cmNlLnR5cGV9XCI+YCApfVxuICAgICAgICA8L3ZpZGVvPlxuICAgICAgPC9waWN0dXJlPlxuICAgICAgPGJ1dHRvbiBjbGFzcz1cInByZXZfdmlkXCIgYXJpYS1sYWJlbD1cIlByZXZpb3VzIFZpZGVvXCIgb25jbGljaz0keyhlKT0+IGFkanVzdE1lZGlhKGUsIC0xKX0gc3R5bGU9XCIke3Nob3dQcmV2QnRuID8gJycgOiAnZGlzcGxheTogbm9uZSd9XCI+JHtcIjxcIn08L2J1dHRvbj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJuZXh0X3ZpZFwiIGFyaWEtbGFiZWw9XCJOZXh0IFZpZGVvXCIgb25jbGljaz0keyhlKT0+IGFkanVzdE1lZGlhKGUsICsxKX0gc3R5bGU9XCIke3Nob3dOZXh0QnRuID8gJycgOiAnZGlzcGxheTogbm9uZSd9XCI+JHtcIj5cIn08L2J1dHRvbj5cbiAgICA8L2Rpdj5gXG4gIH1cblxuICAvLyBidWlsZCBhIGZ1bGx5IHBvcHVsYXRlZCBzZWFyY2ggcmVzdWx0IGh0bWwgdGhpbmdvXG4gIHRvUG9wdWxhdGVkSFRNTCgpIHtcbiAgICBsZXQgY29tcG9uZW50ID0gaHRtbGBcbiAgICA8YSBjbGFzcz1cInJlc3VsdCAke3RoaXMuZ2V0V2FybmluZ3MoKS5tYXAoeCA9PiB4LnR5cGUpLmpvaW4oJyAnKX1cIiBocmVmPVwiJHt0aGlzLnJlc3VsdC5saW5rfVwiIHJlZmVycmVycG9saWN5PVwib3JpZ2luXCIgcmVsPVwiZXh0ZXJuYWxcIiBpZD1cIiR7dGhpcy50b0lEKCl9XCIgYXJpYS1sYWJlbGxlZGJ5PVwiJHt0aGlzLnRvSUQoJ2tleXdvcmRzJyl9XCIgcm9sZT1saW5rPlxuICAgICAgJHt0aGlzLnRvTWVkaWFWaWV3ZXIoKX1cbiAgICAgIDxoMiBjbGFzcz1cImtleXdvcmRzXCIgaWQ9XCIke3RoaXMudG9JRCgna2V5d29yZHMnKX1cIj4ke3RoaXMucmVzdWx0LnRpdGxlIHx8IHRoaXMucmVzdWx0LmtleXdvcmRzLmpvaW4oJywgJyl9PC9oMj5cbiAgICAgIDxjaXRlIGNsYXNzPVwibGlua1wiPiR7dGhpcy5yZXN1bHQubGlua308L2NpdGU+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFnc1wiPiR7dGhpcy5yZXN1bHQudGFncy5tYXAoeCA9PiBgIyR7eH1gKS5qb2luKCcgJyl9PC9kaXY+XG4gICAgICAke3RoaXMuZ2V0V2FybmluZ3MoKS5tYXAod2FybmluZyA9PiBodG1sYDxkaXYgY2xhc3M9XCJhbGVydCAke3dhcm5pbmcudHlwZX1cIj4ke3dhcm5pbmcudGV4dH08L2Rpdj5gKX1cbiAgICAgIDxkaXYgY2xhc3M9XCJtaW5pX2RlZlwiPiR7dGhpcy5yZXN1bHQuYm9keX08L2Rpdj5cbiAgICA8L2E+YFxuICAgIHJldHVybiBjb21wb25lbnRcbiAgfVxuXG4gIHRvUGxhY2Vob2xkZXJIVE1MKCkge1xuICAgIHJldHVybiBodG1sYDxhIGNsYXNzPVwicmVzdWx0IHBsYWNlaG9sZGVyICR7dGhpcy5nZXRXYXJuaW5ncygpLm1hcCh4ID0+IHgudHlwZSkuam9pbignICcpfVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvYT5gXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hSZXN1bHRQYW5lbCIsIi8vIFRoaXMgY2xhc3MgcmVwcmVzZW50cyBhbiBlbnRyeSBpbiB0aGUgc2VhcmNoIGluZGV4XG4vLyBpdCBwcm92aWRlcyBhY2Nlc3MgdG8gZXZlcnl0aGluZyB0aGUgc2VhcmNoIGluZGV4IGVuY29kZXMsIGFuZCBjYW4gbG9hZCBpbiB0aGUgc2VhcmNoIGRlZmluaXRpb24gZGF0YVxuXG5jbGFzcyBTZWFyY2hEZWZpbml0aW9uIHtcbiAgLy8gYWNjZXB0cyBhIGZldGNoIGZ1bmN0aW9uLCBhIHRhZyBsaXN0LCBhbmQgYSB3b3JkIGxpc3RcbiAgY29uc3RydWN0b3IoeyB0aXRsZSwga2V5d29yZHMsIHRhZ3MsIGxpbmssIG1lZGlhLCBib2R5LCBwcm92aWRlciwgaWQgfSA9IHt9KSB7XG4gICAgdGhpcy50aXRsZSA9IHRpdGxlIHx8IG51bGxcbiAgICB0aGlzLmtleXdvcmRzID0ga2V5d29yZHMgfHwgW11cbiAgICB0aGlzLnRhZ3MgPSB0YWdzIHx8IFtdXG4gICAgdGhpcy5saW5rID0gbGluayB8fCBudWxsXG4gICAgdGhpcy5tZWRpYSA9IG1lZGlhIHx8IFtdXG4gICAgdGhpcy5ib2R5ID0gYm9keSB8fCBudWxsXG4gICAgdGhpcy5wcm92aWRlciA9IHByb3ZpZGVyIHx8IG51bGxcbiAgICB0aGlzLmlkID0gaWQgfHwgbnVsbFxuICB9XG5cbiAgZ2V0IHVyaSgpIHtcbiAgICByZXR1cm4gYCR7dGhpcy5wcm92aWRlciB8fCAndW5rbm93bid9OiR7dGhpcy5pZCB8fCB0aGlzLmxpbmsgfHwgJ3Vua25vd24nfWBcbiAgfVxuXG4gIGluc3BlY3QoKSB7XG4gICAgcmV0dXJuIGA8JHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IFske3VyaX1dOiAke3RoaXMudGl0bGUgfHwgdGhpcy5rZXl3b3Jkcy5qb2luKCcsICcpfT5gXG4gIH1cblxuICB0b0pTT04oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiB0aGlzLnRpdGxlLFxuICAgICAga2V5d29yZHM6IHRoaXMua2V5d29yZHMsXG4gICAgICB0YWdzOiB0aGlzLnRhZ3MsXG4gICAgICBsaW5rOiB0aGlzLmxpbmssXG4gICAgICBtZWRpYTogdGhpcy5tZWRpYSxcbiAgICAgIGJvZHk6IHRoaXMuYm9keSxcbiAgICAgIHByb3ZpZGVyOiB0aGlzLnByb3ZpZGVyLFxuICAgICAgaWQ6IHRoaXMuaWRcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hEZWZpbml0aW9uIiwiLy8gU2VhcmNoTGlicmFyeSBzZXR1cCBieSBkZWZhdWx0IHdpdGggV2ViIEFQSSdzIGhvb2tlZCB1cCBmb3IgcmVhZCBvbmx5IHNlYXJjaCBsaWJyYXJ5IGFjY2Vzc1xuY29uc3QgU2VhcmNoTGlicmFyeSA9IHJlcXVpcmUoJy4vbGlicmFyeScpXG5jb25zdCBmc3V0aWwgPSByZXF1aXJlKCcuLi91dGlsJylcblxuY2xhc3MgU2VhcmNoTGlicmFyeVdlYiBleHRlbmRzIFNlYXJjaExpYnJhcnkge1xuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICBzdXBlcih7XG4gICAgICBmczogeyByZWFkRmlsZTogZnN1dGlsLmZldGNoTGlrZUZpbGUgfSxcbiAgICAgIC4uLmNvbmZpZ1xuICAgIH0pXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hMaWJyYXJ5V2ViIiwiLy8gU2VhcmNoIEluZGV4IHY0IGZvcm1hdFxuLy8gaW1wbGVtZW50cyBib3RoIHJlYWQgYW5kIHdyaXRlIGZ1bmN0aW9uYWxpdHlcbmNvbnN0IFNlYXJjaFJlc3VsdERlZmluaXRpb24gPSByZXF1aXJlKCcuL3Jlc3VsdC1kZWZpbml0aW9uJylcbmNvbnN0IFV0aWwgPSByZXF1aXJlKCcuLi91dGlsJylcbmNvbnN0IFZVID0gcmVxdWlyZSgnLi4vdmVjdG9yLXV0aWxpdGllcycpXG5jb25zdCBjYm9yID0gcmVxdWlyZSgnYm9yYycpXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKVxuXG5jbGFzcyBTZWFyY2hMaWJyYXJ5IHtcbiAgLy8gQnVpbGQgYSBTZWFyY2hMaWJyYXJ5IGludGVyZmFjZVxuICAvLyBjb25maWcgb2JqZWN0IHNob3VsZCBhdCBsZWFzdCBjb250YWluOlxuICAvLyAgIGZzOiBhbiBvYmplY3QsIHdoaWNoIGlzIGEgcHJvbWlzaWZpZWQgdmVyc2lvbiBvZiBub2RlJ3MgZnMgKGUuZy4gZnMtZXh0cmEgcGFja2FnZSksIG9yIGF0IGxlYXN0IGEgcmVhZEZpbGUgZnVuY3Rpb24gZm9yIGNsaWVudCBzaWRlIHdlYiB1c2VcbiAgLy8gICBwYXRoOiBwYXRoIHRvIHRoZSBmb2xkZXIgaW4gd2hpY2ggdGhlIHNlYXJjaCBsaWJyYXJ5IHdpbGwgYmUgcmVhZCBvciBidWlsdFxuICAvLyBpZiB5b3UgYXJlIHVzaW5nIHdvcmQgdmVjdG9yIHNlYXJjaGluZyAoeW91IHNob3VsZCEhKSB5b3Ugd2lsbCBhbHNvIG5lZWRcbiAgLy8gICB2ZWN0b3JMaWJyYXJ5OiBhbiBvcGVuIGluc3RhbmNlIG9mIC4uL3ZlY3Rvci1saWJyYXJ5L3JlYWRlci5qcywgYmFja2VkIGJ5IGEgc3VpdGFibGUgd29yZCB2ZWN0b3IgZGF0YXNldCAodGhpcyBjYW4gYmUgZ2VuZXJhdGVkIGZyb20gZmFzdHRleHQgdXNpbmcgdXRpbGl0aWVzIGluIC90b29scylcbiAgLy8gZm9yIHNlcnZlciBzaWRlIGluZGV4IGJ1aWxkaW5nLCB5b3UnbGwgYWxzbyBuZWVkIHRvIHByb3ZpZGU6XG4gIC8vICAgbWVkaWFDYWNoZTogYW4gb2JqZWN0IHdoaWNoIHJlc3BvbmRzIHRvIHRoZSBpbnRlcmZhY2Ugb2YgLi9tZWRpYS1jYWNoZS5qcywgd2hpY2ggY2FuIHRyYW5zY29kZSwgY2FjaGUsIGFuZCBnaXZlIG91dCByZWxhdGl2ZSBwYXRocyB0byBlbmNvZGVkIHZpZGVvIGZpbGVzXG4gIC8vICAgbWVkaWFGb3JtYXRzOiBhbiBhcnJheSwgY29udGFpbmluZyBpbml0aWFsaXplZCBtZWRpYSBlbmNvZGVycywgaW1wbGVtZW50aW5nIHRoZSBpbnRlcmZhY2UgZm91bmQgaW4gbWVkaWEtZm9ybWF0LWhhbmRicmFrZS5qc1xuICBjb25zdHJ1Y3Rvcihjb25maWcgPSB7fSkge1xuICAgIC8vIHNlYXJjaCBpbmRleCBkYXRhLCBjb250YWlucyBhIGxpc3Qgb2YgZGVmaW5pdGlvbnNcbiAgICB0aGlzLmluZGV4ID0gW11cbiAgICAvLyBkZWZhdWx0IHNldHRpbmdzIC0gdGhpcyBkYXRhIGlzIHdyaXR0ZW4gaW4gdG8gdGhlIHNlYXJjaCBpbmRleCBhbmQgY29udHJvbHMgcGFyc2luZ1xuICAgIHRoaXMuc2V0dGluZ3MgPSB7XG4gICAgICB2ZXJzaW9uOiA0LFxuICAgICAgdmVjdG9yQml0czogOCxcbiAgICAgIHZlY3RvclNpemU6IDMwMCxcbiAgICAgIHZlY3RvclNjYWxpbmc6IDAsIC8vIHRoaXMgaXMgYXV0b21hdGljYWxseSBjYWxjdWxhdGVkIGluIHRoZSBzYXZlKCkgc3RlcFxuICAgICAgYnVpbGRUaW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICBtZWRpYVNldHM6IFtdLFxuICAgICAgYnVpbGRJRDogRGF0ZS5ub3coKSxcbiAgICB9XG4gICAgLy8gb3ZlcnJpZGUgZGVmYXVsdHMgd2l0aCBhbnkgY29uZmlndWVkIG9wdGlvbnMgd2l0aCBtYXRjaGluZyBrZXlzXG4gICAgT2JqZWN0LmtleXModGhpcy5zZXR0aW5ncykubWFwKCBrZXkgPT4gdGhpcy5zZXR0aW5nc1trZXldID0gY29uZmlnW2tleV0gfHwgdGhpcy5zZXR0aW5nc1trZXldIClcblxuICAgIC8vIHNldHVwIG1lZGlhU2V0cyBkYXRhXG4gICAgdGhpcy5zZXR0aW5ncy5tZWRpYVNldHMgPSAoY29uZmlnLm1lZGlhRm9ybWF0cyB8fCBbXSkubWFwKHggPT4geC5nZXRNZWRpYUluZm8oKSlcblxuICAgIC8vIGNvbmZpZyBvYmplY3Qgc3RvcmVzIGFueSBleHRyYSBzdHVmZiB0b29cbiAgICB0aGlzLmNvbmZpZyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgZGVmaW5pdGlvbnNQZXJTaGFyZDogNTAsIC8vIGRlZmF1bHRcbiAgICB9LCBjb25maWcpXG4gICAgdGhpcy5wYXRoID0gY29uZmlnLnBhdGhcbiAgICBhc3NlcnQodGhpcy5wYXRoLCBcInBhdGggb3B0aW9uIGlzIG5vdCBvcHRpb25hbFwiKSAvLyB2ZXJpZnkgYSBwYXRoIHdhcyBzdXBwbGllZFxuICAgIHRoaXMubG9nID0gY29uZmlnLmxvZyB8fCAodGV4dCA9PiBjb25zb2xlLmxvZyh0ZXh0KSlcbiAgfVxuXG4gIC8vIG9wZW4gYSBzZWFyY2ggaW5kZXgsIGxvYWRpbmcgYWxsIHNlYXJjaCByZXN1bHRzIGluIHRvIG1lbW9yeS4gVGhleSBjYW4gdGhlbiBiZSBtb2RpZmllZCBhbmQgQHNhdmUocGF0aCkgY2FuIGJlIHVzZWQgdG8gd3JpdGUgb3V0IHRoZSBtb2RpZmllZCB2ZXJzaW9uXG4gIGFzeW5jIGxvYWRFdmVyeXRoaW5nKCkge1xuICAgIGF3YWl0IHRoaXMub3Blbih0aGlzLnBhdGgpXG5cbiAgICAvLyBwcmVmZXRjaCBhbGwgdGhlIGRlZmluaXRpb25zIHRvb1xuICAgIGZvciAobGV0IHJlc3VsdCBvZiB0aGlzLmluZGV4KSB7XG4gICAgICBhd2FpdCByZXN1bHQuZmV0Y2goKVxuICAgIH1cbiAgfVxuXG4gIFxuICAvLyBvcGVuIGEgc2VhcmNoIGluZGV4IGF0IGEgY2VydGFpbiBwYXRoLCB0aGlzIHNob3VsZCBiZSB0aGUgcGF0aCB0byB0aGUgcm9vdCBkaXJlY3RvcnksIHdpdGhvdXQgYSB0cmFpbGluZyBzbGFzaFxuICBhc3luYyBvcGVuKCkge1xuICAgIC8vIGRlY29kZSB0aGUgc2VhcmNoIGluZGV4IGRhdGEgdXNpbmcgY2JvclxuICAgIGxldCBkYXRhID0gY2Jvci5kZWNvZGUoYXdhaXQgdGhpcy5jb25maWcuZnMucmVhZEZpbGUoYCR7dGhpcy5wYXRofS9pbmRleC5jYm9yYCkpXG5cbiAgICAvLyBjb3B5IGluIHRoZSBzZXR0aW5ncyBvYmplY3RcbiAgICBhc3NlcnQuZXF1YWwoZGF0YS5zZXR0aW5ncy52ZXJzaW9uLCA0KVxuICAgIHRoaXMuc2V0dGluZ3MgPSBkYXRhLnNldHRpbmdzXG5cbiAgICAvLyBpbXBvcnQgdGhlIHN5bWJvbHMsIGNvbnZlcnRpbmcgYnVmZmVycyBpbiB0byB2ZWN0b3JzXG4gICAgbGV0IHN5bWJvbHMgPSBkYXRhLnN5bWJvbHMubWFwKHZhbHVlID0+IHtcbiAgICAgIGlmICh0eXBlb2YodmFsdWUpID09ICdzdHJpbmcnKSB7IC8vIHN0cmluZ3MgYXJlIGp1c3QgaW1wb3J0ZWQgZGlyZWN0bHlcbiAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICB9IGVsc2UgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWx1ZSkpIHsgLy8gZGVjb2RlIGEgdmVjdG9yXG4gICAgICAgIGxldCBmbG9hdHMgPSBVdGlsLnVucGFja0Zsb2F0cyh2YWx1ZSwgdGhpcy5zZXR0aW5ncy52ZWN0b3JCaXRzLCB0aGlzLnNldHRpbmdzLnZlY3RvclNpemUpXG4gICAgICAgIHJldHVybiBmbG9hdHMubWFwKGYgPT4gZiAqIHRoaXMuc2V0dGluZ3MudmVjdG9yU2NhbGluZylcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gZGVjb2RlIHRoZSBzZWFyY2ggaW5kZXggc3RydWN0dXJlXG4gICAgdGhpcy5pbmRleCA9IFtdXG4gICAgLy8gdGhlIHJvb3QgaXMgYSBtYXAgd2l0aCBhcnJheXMgb2YgdGFnIHN5bWJvbHMgYXMga2V5cyBhbmQgYXJyYXlzIG9mIGVudHJpZXMgYXMgdmFsdWVzXG4gICAgZm9yIChsZXQgW3RhZ1N5bWJvbHMsIGVudHJpZXNdIG9mIGRhdGEuaW5kZXgpIHtcbiAgICAgIGxldCB0YWdzID0gdGFnU3ltYm9scy5tYXAoaW5kZXggPT4gc3ltYm9sc1tpbmRleF0pXG4gICAgICAvLyBmb3IgZWFjaCBlbnRyeSBpbiB0aGUgdGFnIGxpc3QsIHdlIGdldCBhIG51bWJlciBvZiBkZWZpbml0aW9ucyBhc3NvY2lhdGVkIHdpdGggYSB0ZXJtIGxpc3RcbiAgICAgIGZvciAobGV0IFt0ZXJtU3ltYm9scywgZGVmaW5pdGlvblBhdGhzXSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGxldCB0ZXJtcyA9IHRlcm1TeW1ib2xzLm1hcChpbmRleCA9PiBzeW1ib2xzW2luZGV4XSlcbiAgICAgICAgLy8gY3JlYXRlIHNlYXJjaCByZXN1bHQgZW50cmllcyBpbiB0aGUgaW5kZXggZm9yIGV2ZXJ5IGRlZmluaXRpb24gYmVoaW5kIHRoaXMgY29tYmluYXRpb24gb2YgdGFncyBhbmQgdGVybXNcbiAgICAgICAgbGV0IHRlcm1EaXZlcnNpdHkgPSBNYXRoLm1heCguLi5WVS5kaXZlcnNpdHkoLi4udGVybXMuZmlsdGVyKHggPT4gQXJyYXkuaXNBcnJheSh4KSkpKVxuICAgICAgICBVdGlsLmNodW5rKGRlZmluaXRpb25QYXRocywgMikuZm9yRWFjaCgoZGVmaW5pdGlvblBhdGgpID0+IHtcbiAgICAgICAgICB0aGlzLmluZGV4LnB1c2gobmV3IFNlYXJjaFJlc3VsdERlZmluaXRpb24oe1xuICAgICAgICAgICAgbGlicmFyeTogdGhpcywgZGVmaW5pdGlvblBhdGgsIHRhZ3MsIHRlcm1zLCB0ZXJtRGl2ZXJzaXR5XG4gICAgICAgICAgfSkpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cblxuICAvLyBhY2NlcHRzIGEgU2VhcmNoRGVmaW5pdGlvbiBpbnN0YW5jZSAoc2VlIC4vZGVmaW5pdGlvbi5qcylcbiAgLy8gYXBwZW5kcyB0aGUgc2VhcmNoIGRlZmluaXRpb24gdG8gdGhlIHNlYXJjaCBpbmRleFxuICBhc3luYyBhZGREZWZpbml0aW9uKGRlZmluaXRpb24pIHtcbiAgICBsZXQgZGF0YSA9IChkZWZpbml0aW9uLnRvSlNPTiAmJiBkZWZpbml0aW9uLnRvSlNPTigpKSB8fCBkZWZpbml0aW9uXG4gICAgbGV0IHRlcm1zID0gZGF0YS5rZXl3b3Jkc1xuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhbnVwS2V5d29yZHMpIHtcbiAgICAgIHRlcm1zID0gdGVybXMubWFwKGtleXdvcmQgPT4ge1xuICAgICAgICAvLyBjbGVhbiB1cCBrZXl3b3JkcyBhIGJpdFxuICAgICAgICBsZXQgY2xlYW5lZFdvcmQgPSBrZXl3b3JkLnRyaW0oKS5yZXBsYWNlKC/igJgvZywgXCInXCIpXG4gICAgICAgIC8vIGlmIGl0J3Mgbm90IGFsbCBjYXBzIGxpa2UgYW4gYWNyb255bSwgbG93ZXJjYXNlIGl0XG4gICAgICAgIGlmIChjbGVhbmVkV29yZC5tYXRjaCgvW2Etel0vKSB8fCBjbGVhbmVkV29yZC5sZW5ndGggPCAyKSBjbGVhbmVkV29yZCA9IGNsZWFuZWRXb3JkLnRvTG93ZXJDYXNlKClcbiAgICAgICAgcmV0dXJuIGNsZWFuZWRXb3JkXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIHRyYW5zbGF0ZSBrZXl3b3JkcyBpbiB0byB2ZWN0b3JzIHdoZXJlIHBvc3NpYmxlXG4gICAgdGVybXMgPSBhd2FpdCBQcm9taXNlLmFsbCh0ZXJtcy5tYXAoYXN5bmMga2V5d29yZCA9PiAodGhpcy5jb25maWcudmVjdG9yTGlicmFyeSAmJiBhd2FpdCB0aGlzLmNvbmZpZy52ZWN0b3JMaWJyYXJ5Lmxvb2t1cChrZXl3b3JkKSkgfHwga2V5d29yZCkpXG4gICAgXG4gICAgLy8gZW5jb2RlIGFuZCBjYWNoZSBhbnkgdW5jYWNoZWQgbWVkaWFcbiAgICBsZXQgbWVkaWEgPSBbXVxuICAgIGZvciAobGV0IG1lZGlhSXRlbSBvZiBkYXRhLm1lZGlhKSB7XG4gICAgICBsZXQgY2FwYWJsZUVuY29kZXJzID0gdGhpcy5jb25maWcubWVkaWFGb3JtYXRzLmZpbHRlcihmb3JtYXQgPT4gZm9ybWF0LmFjY2VwdHMobWVkaWFJdGVtLmdldEV4dGVuc2lvbigpKSlcbiAgICAgIGxldCB2ZXJzaW9ucyA9IHt9XG4gICAgICBmb3IgKGxldCBlbmNvZGVyIG9mIGNhcGFibGVFbmNvZGVycykge1xuICAgICAgICB2ZXJzaW9uc1tlbmNvZGVyLmdldE1lZGlhSW5mbygpLmV4dGVuc2lvbl0gPSBhd2FpdCB0aGlzLmNvbmZpZy5tZWRpYUNhY2hlLmNhY2hlKHsgbWVkaWE6IG1lZGlhSXRlbSwgZm9ybWF0OiBlbmNvZGVyIH0pXG4gICAgICB9XG4gICAgICBpZiAoY2FwYWJsZUVuY29kZXJzLmxlbmd0aCA+IDApIG1lZGlhLnB1c2godmVyc2lvbnMpXG4gICAgfVxuXG4gICAgLy8gYnVpbGQgdGhlIHNlYXJjaCBkZWZpbml0aW9uIG9iamVjdFxuICAgIGxldCByZXN1bHQgPSBuZXcgU2VhcmNoUmVzdWx0RGVmaW5pdGlvbihPYmplY3QuYXNzaWduKGRhdGEsIHtcbiAgICAgIGxpYnJhcnk6IHRoaXMsIHRlcm1zLFxuICAgICAgdGVybURpdmVyc2l0eTogTWF0aC5tYXgoLi4uVlUuZGl2ZXJzaXR5KC4uLnRlcm1zLmZpbHRlcih4ID0+IEFycmF5LmlzQXJyYXkoeCkpKSksXG4gICAgICBtZWRpYSwgcHJlbG9hZGVkOiB0cnVlLFxuICAgIH0pKVxuXG4gICAgLy8gYWRkIHRoZSBzZWFyY2ggcmVzdWx0IGRlZmluaXRpb24gdG8gb3VyIGluZGV4XG4gICAgdGhpcy5pbmRleC5wdXNoKHJlc3VsdClcbiAgfVxuXG5cblxuICAvLyBxdWVyeSB0aGUgc2VhcmNoIGluZGV4XG4gIC8vIGZpbHRlckZuIHdpbGwgYmUgY2FsbGVkIGZvciBldmVyeSBzZWFyY2ggcmVzdWx0IGluIHRoZSBpbmRleCwgYW5kIHNob3VsZCByZXR1cm4gYSBudW1iZXIsIG9yIGZhbHNlXG4gIC8vIHdoZW4gZmlsdGVyRm4ocmVzdWx0KSByZXR1cm5zIGZhbHNlLCB0aGUgc2VhcmNoIHJlc3VsdCB3b250IGJlIGluY2x1ZGVkIGluIHRoZSBvdXRwdXRcbiAgLy8gd2hlbiBmaWx0ZXJGbihyZXN1bHQpIHJldHVybnMgYSBudW1iZXIsIGl0IHdpbGwgYmUgdHJlYXRlZCBhcyBhIHJhbmssIGFuZCB0aGUgcmVzdWx0cyB3aWxsIGJlIHNvcnRlZCBhY2NvcmRpbmcgdG8gdGhpcyByYW5rLCB3aXRoXG4gIC8vIGxvd2VyIG51bWJlcnMgYXQgdGhlIHRvcCBvZiB0aGUgbGlzdFxuICAvLyBOb3RlOiBxdWVyeSBjaGVja3MgaWYgdGhlIGluZGV4IGhhcyBiZWVuIG1vZGlmaWVkLCBieSBzdGF0aW5nIHRoZSBpbmRleCBmaWxlLCBhbmQgd2lsbCByZWxvYWQgdGhlIGluZGV4IGlmIHRoZSBkYXRhc2V0IGhhcyBiZWVuXG4gIC8vIHVwZGF0ZWQsIHNvIGl0IHdpbGwgb2Z0ZW4gcmV0dXJuIHF1aWNrbHksIGJ1dCBtYXkgcmV0dXJuIHNsb3dseSBpZiB0aGUgaW5kZXggbmVlZHMgdG8gYmUgcmVsb2FkZWQuXG4gIC8vIFlvdXIgVUkgc2hvdWxkIGRpc3BsYXkgYSBub3RpY2UgdG8gdGhlIHVzZXIgaWYgcXVlcnkgaXMgdGFraW5nIG1vcmUgdGhhbiBhIG1vbWVudCB0byByZXNvbHZlLCBpbmRpY2F0aW5nIHJlc3VsdHMgYXJlIGxvYWRpbmcuXG4gIGFzeW5jIHF1ZXJ5KGZpbHRlckZuKSB7XG4gICAgbGV0IGN1cnJlbnRCdWlsZElEID0gYXdhaXQgdGhpcy5jb25maWcuZnMucmVhZEZpbGUoYCR7dGhpcy5wYXRofS9idWlsZElELnR4dGApXG4gICAgaWYgKGN1cnJlbnRCdWlsZElELnRvU3RyaW5nKCkgIT0gdGhpcy5zZXR0aW5ncy5idWlsZElELnRvU3RyaW5nKCkpIHtcbiAgICAgIC8vIHdlIG5lZWQgdG8gcmVsb2FkXG4gICAgICB0aGlzLmxvZyhgUmVsb2FkaW5nIGRhdGFzZXQgYmVjYXVzZSBkYXRhc2V0IGJ1aWxkSUQgaXMgJHtjdXJyZW50QnVpbGRJRH0gYnV0IGxvY2FsbHkgbG9hZGVkIGRhdGFzZXQgaXMgJHt0aGlzLnNldHRpbmdzLmJ1aWxkSUR9YClcbiAgICAgIGF3YWl0IHRoaXMubG9hZCgpXG4gICAgfVxuXG4gICAgLy8gY2FsbCBmaWx0ZXJGbiBvbiBhIHJlZmVyZW5jZSBjb3B5IG9mIHRoZSBzZWFyY2ggcmVzdWx0cywgc3RvcmluZyByYW5rIHRvIC5kaXN0YW5jZSBwcm9wZXJ0eVxuICAgIHJldHVybiB0aGlzLmluZGV4Lm1hcCgocmVzdWx0KSA9PiB7XG4gICAgICBsZXQgcmFua2VkUmVzdWx0ID0gT2JqZWN0LmNyZWF0ZShyZXN1bHQpXG4gICAgICByYW5rZWRSZXN1bHQuZGlzdGFuY2UgPSBmaWx0ZXJGbihyZXN1bHQpXG4gICAgICByZXR1cm4gcmFua2VkUmVzdWx0XG4gICAgfSkuZmlsdGVyKHJhbmtlZFJlc3VsdCA9PlxuICAgICAgLy8gZmlsdGVyIG91dCBhbnkgcmVzdWx0cyB0aGF0IGRpZG4ndCByZXR1cm4gYSBOdW1iZXJcbiAgICAgIHR5cGVvZihyYW5rZWRSZXN1bHQuZGlzdGFuY2UpID09ICdudW1iZXInXG4gICAgKS5zb3J0KChhLGIpPT5cbiAgICAgIC8vIHNvcnQgcmVzdWx0cyBiYXNlZCBvbiBkaXN0YW5jZSByYW5raW5nXG4gICAgICBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZVxuICAgIClcbiAgfVxuXG5cblxuICAvLyB3cml0ZSBldmVyeXRoaW5nIG91dCB0byB0aGUgZmlsZXN5c3RlbVxuICBhc3luYyBzYXZlKCkge1xuICAgIC8vIFN5bWJvbCB0YWJsZSBidWlsZGVyOlxuICAgIGxldCBzeW1ib2xzID0gW11cbiAgICBsZXQgc3ltYm9sc0xvb2t1cCA9IHt9XG4gICAgLy8gc3ltYm9sIGdldHRlcjogYWNjZXB0cyBhIHN0cmluZywgb3IgYXJyYXkgb2YgdGhpcy5zZXR0aW5ncy52ZWN0b3JTaXplIGZsb2F0cywgYW5kIHJldHVybnMgYW4gaW50ZWdlciBpbmRleFxuICAgIGxldCBzeW1ib2wgPSAoZGF0YSk9PiB7XG4gICAgICBsZXQgbG9va3VwS2V5ID0gSlNPTi5zdHJpbmdpZnkoZGF0YSlcbiAgICAgIGlmIChzeW1ib2xzTG9va3VwW2xvb2t1cEtleV0pIHJldHVybiBzeW1ib2xzTG9va3VwW2xvb2t1cEtleV1cblxuICAgICAgLy8gYWRkIHRoaXMgc3ltYm9sIHRvIHRoZSBzeW1ib2wgdGFibGVcbiAgICAgIGxldCBzeW1ib2xJbmRleCA9IHN5bWJvbHMubGVuZ3RoXG4gICAgICAvLyBzY2FsZSB2ZWN0b3JzIGRvd25cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgIGxldCBmbG9hdHMgPSBVdGlsLnBhY2tGbG9hdHMoZGF0YS5tYXAoeCA9PiB4IC8gdGhpcy5zZXR0aW5ncy52ZWN0b3JTY2FsaW5nKSwgdGhpcy5zZXR0aW5ncy52ZWN0b3JCaXRzLCB0aGlzLnNldHRpbmdzLnZlY3RvclNpemUpXG4gICAgICAgIHN5bWJvbHMucHVzaChCdWZmZXIuZnJvbShmbG9hdHMpKVxuICAgICAgfSBlbHNlIHsgLy8gc3RyaW5ncyBqdXN0IGdvIGluIGFzIHJlZ3VsYXIgc3RyaW5nc1xuICAgICAgICBzeW1ib2xzLnB1c2goZGF0YS50b1N0cmluZygpKVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyByZXR1cm4gdGhlIGluZGV4IG51bWJlciBvZiB0aGUgc3ltYm9sLCBhbmQgY2FjaGUgdGhpcyBhbnN3ZXIgZm9yIGxhdGVyXG4gICAgICByZXR1cm4gc3ltYm9sc0xvb2t1cFtsb29rdXBLZXldID0gc3ltYm9sSW5kZXhcbiAgICB9XG5cbiAgICAvLyBmaWd1cmUgb3V0IG91ciBpZGVhbCBzY2FsaW5nIGZhY3RvciBpZiB3ZSdyZSBidWlsZGluZyB3aXRoIHZlY3RvcnNcbiAgICBpZiAodGhpcy5jb25maWcudmVjdG9yTGlicmFyeSkge1xuICAgICAgdGhpcy5zZXR0aW5ncy52ZWN0b3JTY2FsaW5nID0gMFxuICAgICAgZm9yIChsZXQgZGVmaW5pdGlvbiBvZiB0aGlzLmluZGV4KSB7XG4gICAgICAgIGxldCB2ZWN0b3JzID0gZGVmaW5pdGlvbi50ZXJtcy5maWx0ZXIoeCA9PiB0eXBlb2YoeCkgIT09ICdzdHJpbmcnKVxuICAgICAgICBpZiAodmVjdG9ycy5sZW5ndGggPCAxKSBjb250aW51ZVxuICAgICAgICBsZXQgbG9jYWxTY2FsaW5nID0gTWF0aC5tYXgoLi4uKHZlY3RvcnMuZmxhdCgpLm1hcChNYXRoLmFicykpKVxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy52ZWN0b3JTY2FsaW5nIDwgbG9jYWxTY2FsaW5nKSB7XG4gICAgICAgICAgdGhpcy5zZXR0aW5ncy52ZWN0b3JTY2FsaW5nID0gbG9jYWxTY2FsaW5nXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBnZW5lcmF0aW5nIHNoYXJkcyBkYXRhLCBzY29wZWQgdG8gYSBibG9jayB0byBtYW5hZ2UgbWVtb3J5IGJldHRlclxuICAgIGxldCBpbmRleCA9IHt9IC8vIG9iamVjdCBrZXllZCBieSB0YWcgbGlzdHMgaW4gdGhlIGZvcm0gXCJzeW1ib2xcXG5zeW1ib2xcXG5zeW1ib2xcIiB3aGVyZSBzeW1ib2xzIGFyZSBzb3J0ZWQgbnVtYmVycyBmcm9tIHN5bWJvbCgpXG4gICAge1xuICAgICAgLy8gZ2VuZXJhdGUgc2hhcmRzXG4gICAgICB0aGlzLmxvZyhgV3JpdGluZyBjb250ZW50IG91dCB0byBzaGFyZCBmaWxlc2ApXG4gICAgICBsZXQgc2hhcmRJRCA9IDBcbiAgICAgIGZvciAobGV0IGJhdGNoIG9mIFV0aWwuY2h1bmtJdGVyYWJsZSh0aGlzLmluZGV4LCB0aGlzLmNvbmZpZy5kZWZpbml0aW9uc1BlclNoYXJkKSkge1xuICAgICAgICBsZXQgc2hhcmRBcnJheSA9IFtdXG4gICAgICAgIGJhdGNoLmZvckVhY2goZGVmaW5pdGlvbiA9PiB7XG4gICAgICAgICAgLy8gZmV0Y2ggZXhpc3RpbmcgZGVmaW5pdGlvbiBhcnJheSBvciBjcmVhdGUgYSBuZXcgb25lXG4gICAgICAgICAgZGVmaW5pdGlvbi5fZGVmaW5pdGlvblBhdGggPSBbc2hhcmRJRCwgc2hhcmRBcnJheS5sZW5ndGhdXG4gICAgICAgICAgc2hhcmRBcnJheS5wdXNoKGRlZmluaXRpb24udG9KU09OKCkpXG4gIFxuICAgICAgICAgIC8vIGFkZCB0byBpbmRleCBkYXRhIHN0cnVjdHVyZVxuICAgICAgICAgIC8vIGJ1aWxkIHRhZyBsaXN0XG4gICAgICAgICAgbGV0IHRhZ0xpc3QgPSBkZWZpbml0aW9uLnRhZ3MubWFwKHN5bWJvbCkuc29ydCgpLmpvaW4oJ1xcbicpXG4gICAgICAgICAgLy8gZmluZCBvciBjcmVhdGUgdGFnIGdyb3VwXG4gICAgICAgICAgbGV0IGluZGV4VGFnR3JvdXAgPSBpbmRleFt0YWdMaXN0XSA9IGluZGV4W3RhZ0xpc3RdIHx8IHt9XG4gICAgICAgICAgLy8gZmluZCBvciBjcmVhdGUgZGVmaW5pdGlvbiBpbmZvICYgaW5jcmVtZW50IG51bWJlciBvZiBkZWZpbml0aW9uc1xuICAgICAgICAgIGxldCBzeW1ib2xMaXN0ID0gZGVmaW5pdGlvbi50ZXJtcy5tYXAoc3ltYm9sKS5zb3J0KCkuam9pbignXFxuJylcbiAgICAgICAgICBpbmRleFRhZ0dyb3VwW3N5bWJvbExpc3RdID0gWy4uLihpbmRleFRhZ0dyb3VwW3N5bWJvbExpc3RdIHx8IFtdKSwgLi4uZGVmaW5pdGlvbi5fZGVmaW5pdGlvblBhdGhdXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gY29udmVydCBkZWZpbml0aW9ucyB0byBjYm9yXG4gICAgICAgIGxldCBzaGFyZEJ1ZmZlciA9IGNib3IuZW5jb2RlKHNoYXJkQXJyYXkpXG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmZzLmVuc3VyZURpcihgJHt0aGlzLnBhdGh9L2RlZmluaXRpb25zLyR7dGhpcy5zZXR0aW5ncy5idWlsZElEfWApXG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmZzLndyaXRlRmlsZShgJHt0aGlzLnBhdGh9L2RlZmluaXRpb25zLyR7dGhpcy5zZXR0aW5ncy5idWlsZElEfS8ke3NoYXJkSUR9LmNib3JgLCBzaGFyZEJ1ZmZlcilcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmd6aXApIGF3YWl0IHRoaXMuY29uZmlnLmZzLndyaXRlRmlsZShgJHt0aGlzLnBhdGh9L2RlZmluaXRpb25zLyR7dGhpcy5zZXR0aW5ncy5idWlsZElEfS8ke3NoYXJkSUR9LmNib3IuZ3pgLCBhd2FpdCB0aGlzLmNvbmZpZy5nemlwKHNoYXJkQnVmZmVyKSlcbiAgICAgICAgc2hhcmRJRCArPSAxXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gd3JpdGUgb3V0IHRoZSBpbmRleCBmaWxlXG4gICAgdGhpcy5sb2coYEVuY29kaW5nIGFuZCB3cml0aW5nIGluZGV4Li4uYClcbiAgICBsZXQgaW5kZXhCdWZmZXIgPSBjYm9yLmVuY29kZSh7XG4gICAgICBzZXR0aW5nczogdGhpcy5zZXR0aW5ncyxcbiAgICAgIHN5bWJvbHMsIFxuICAgICAgaW5kZXg6IFV0aWwub2JqZWN0VG9NYXAoaW5kZXgsXG4gICAgICAgIGtleSA9PiBrZXkuc3BsaXQoJ1xcbicpLm1hcCh4ID0+IHBhcnNlSW50KHgpKSxcbiAgICAgICAgdGVybU9iamVjdCA9PiBVdGlsLm9iamVjdFRvTWFwKHRlcm1PYmplY3QsXG4gICAgICAgICAga2V5ID0+IGtleS5zcGxpdCgnXFxuJykubWFwKHggPT4gcGFyc2VJbnQoeCkpXG4gICAgICAgIClcbiAgICAgICksXG4gICAgfSlcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5mcy53cml0ZUZpbGUoYCR7dGhpcy5wYXRofS9pbmRleC5jYm9yYCwgaW5kZXhCdWZmZXIpXG4gICAgaWYgKHRoaXMuY29uZmlnLmd6aXApIGF3YWl0IHRoaXMuY29uZmlnLmZzLndyaXRlRmlsZShgJHt0aGlzLnBhdGh9L2luZGV4LmNib3IuZ3pgLCBhd2FpdCB0aGlzLmNvbmZpZy5nemlwKGluZGV4QnVmZmVyKSlcblxuICAgIC8vIGdlbmVyYXRlIHRoZSBidWlsZElEIGZpbGUsIHNvIGNsaWVudCBzaWRlIGFwcHMgY2FuIGVhc2lseSBjaGVjayBpZiB0aGUgaW5kZXggdGhleSBoYXZlIGxvYWRlZCBpcyB1cCB0byBkYXRlXG4gICAgYXdhaXQgdGhpcy5jb25maWcuZnMud3JpdGVGaWxlKGAke3RoaXMucGF0aH0vYnVpbGRJRC50eHRgLCB0aGlzLnNldHRpbmdzLmJ1aWxkSUQudG9TdHJpbmcoKSlcbiAgfVxuXG5cblxuICAvLyBnYXJiYWdlIGNvbGxlY3Rpb24gb2Ygb2xkIHVubmVlZGVkIGZpbGVzXG4gIGFzeW5jIGNsZWFudXAoKSB7XG4gICAgLy8gY2xlYW4gdXAgb2xkIGRlZmluaXRpb25zIHRoYXQgYXJlIG5vdyBvYnNvbGV0ZVxuICAgIGxldCBidWlsZHMgPSBhd2FpdCB0aGlzLmNvbmZpZy5mcy5yZWFkZGlyKGAke3RoaXMucGF0aH0vZGVmaW5pdGlvbnNgKVxuICAgIGJ1aWxkcy5mb3JFYWNoKGJ1aWxkSUQgPT4ge1xuICAgICAgaWYgKGJ1aWxkSUQgIT09IHRoaXMuc2V0dGluZ3MuYnVpbGRJRCkgdGhpcy5jb25maWcuZnMucmVtb3ZlKGAke3RoaXMucGF0aH0vZGVmaW5pdGlvbnMvJHtidWlsZElEfWApXG4gICAgfSlcbiAgICAvLyBjbGVhbiB1cCBvbGQgbWVkaWEgaW4gdGhlIGNhY2hlIHRoYXQgaXMgbm8gbG9uZ2VyIHJlZmVyZW5jZWRcbiAgICBhd2FpdCB0aGlzLm1lZGlhQ2FjaGUuY2xlYW51cCgpXG4gIH1cblxuXG4gIC8vLy8vIEludGVybmFsIC8vLy8vL1xuICAvLyBmZXRjaGVzIGEgc2hhcmQgZmlsZSwgYW5kIGxvYWRzIGl0IGluIHRvIGFsbCBTZWFyY2hSZXN1bHREZWZpbml0aW9uIG9iamVjdHMgd2hpY2ggaXQgaGFzIGRhdGEgZm9yXG4gIGFzeW5jIF9mZXRjaERlZmluaXRpb25EYXRhKHJlc3VsdCkge1xuICAgIC8vIGNhbGN1bGF0ZSB1cmwsIGxvYWQgc2hhcmQgZmlsZSwgZGVjb2RlIGl0XG4gICAgbGV0IHNoYXJkSUQgPSByZXN1bHQuX2RlZmluaXRpb25QYXRoWzBdXG4gICAgbGV0IHNoYXJkQnVmZmVyID0gYXdhaXQgdGhpcy5jb25maWcuZnMucmVhZEZpbGUoYCR7dGhpcy5wYXRofS9kZWZpbml0aW9ucy8ke3RoaXMuc2V0dGluZ3MuYnVpbGRJRH0vJHtzaGFyZElEfS5jYm9yYClcbiAgICBsZXQgc2hhcmREYXRhID0gY2Jvci5kZWNvZGUoc2hhcmRCdWZmZXIpXG4gICAgcmV0dXJuIHNoYXJkRGF0YVtyZXN1bHQuX2RlZmluaXRpb25QYXRoWzFdXVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2VhcmNoTGlicmFyeSIsIi8vIFJlcHJlc2VudHMgYSBzZWFyY2ggcmVzdWx0LCBhcyByZXR1cm5lZCBieSBTZWFyY2hMaWJyYXJ5UmVhZGVyXG5jb25zdCBTZWFyY2hEZWZpbml0aW9uID0gcmVxdWlyZSgnLi9kZWZpbml0aW9uJylcbmNvbnN0IFV0aWwgPSByZXF1aXJlKCcuLi91dGlsJylcblxuY2xhc3MgU2VhcmNoUmVzdWx0RGVmaW5pdGlvbiBleHRlbmRzIFNlYXJjaERlZmluaXRpb24ge1xuICBjb25zdHJ1Y3Rvcih2YWx1ZXMgPSB7fSkge1xuICAgIHN1cGVyKHZhbHVlcylcbiAgICB0aGlzLmxpYnJhcnkgPSB2YWx1ZXMubGlicmFyeVxuICAgIHRoaXMudGVybXMgPSB2YWx1ZXMudGVybXMgfHwgW11cbiAgICB0aGlzLnRlcm1EaXZlcnNpdHkgPSB2YWx1ZXMudGVybURpdmVyc2l0eSB8fCAwXG4gICAgaWYgKHZhbHVlcy5oYXNoKSB7XG4gICAgICB0aGlzLl9oYXNoID0gdmFsdWVzLmhhc2hcbiAgICAgIHRoaXMuX2hhc2hTdHJpbmcgPSBVdGlsLmJ5dGVzVG9CYXNlMTYodmFsdWVzLmhhc2gpXG4gICAgfVxuICAgIHRoaXMuX2RlZmluaXRpb25QYXRoID0gdmFsdWVzLmRlZmluaXRpb25QYXRoXG4gICAgdGhpcy5fZmV0Y2hlZCA9IHZhbHVlcy5wcmVsb2FkZWQgfHwgZmFsc2VcbiAgfVxuXG4gIGlzRmV0Y2hlZCgpIHsgcmV0dXJuIHRoaXMuX2ZldGNoZWQgfVxuXG4gIC8vIGZldGNoZXMgc2VhcmNoIHJlc3VsdCBkYXRhLCBpZiBpdCdzIG5vdCBhbHJlYWR5IHBvcHVsYXRlZFxuICAvLyByZXR1cm5zIGEgcHJvbWlzZSByZXNvbHZpbmcgd2hlbiBpdCBsb2FkZWRcbiAgYXN5bmMgZmV0Y2goKSB7XG4gICAgaWYgKHRoaXMuX2ZldGNoZWQpIHJldHVybiB0aGlzXG4gICAgLy8gZmV0Y2ggdGhlIGRhdGEsIGFuZCBzdG9yZSBpdCB0byB0aGUgb3JpZ2luYWwgU2VhcmNoUmVzdWx0RGVmaW5pdGlvbiBpbiB0aGUgcHJvdG90eXBlXG4gICAgbGV0IGNodW5rID0gYXdhaXQgdGhpcy5saWJyYXJ5Ll9mZXRjaERlZmluaXRpb25EYXRhKHRoaXMpXG5cbiAgICB0aGlzLnRpdGxlICAgID0gY2h1bmsudGl0bGVcbiAgICB0aGlzLmtleXdvcmRzID0gY2h1bmsua2V5d29yZHNzXG4gICAgdGhpcy50YWdzICAgICA9IGNodW5rLnRhZ3NcbiAgICB0aGlzLmxpbmsgICAgID0gY2h1bmsubGlua1xuICAgIHRoaXMuYm9keSAgICAgPSBjaHVuay5ib2R5XG4gICAgdGhpcy5wcm92aWRlciA9IGNodW5rLnByb3ZpZGVyXG4gICAgdGhpcy5pZCAgICAgICA9IGNodW5rLmlkIHx8IGNodW5rLmxpbmtcbiAgICAvLyBhdWdtZW50IG1lZGlhIHdpdGggcmljaCBvYmplY3QgaW5oZXJ0aW5nIG90aGVyIGluZm8gZnJvbSB0aGUgc2VhcmNoIGxpYnJhcnkncyBtZWRpYVNldHMgc2V0dGluZywgYW5kIGJ1aWxkaW5nIHRoZSBmdWxsIHZpZGVvIHBhdGggYXMgYSB1cmxcbiAgICB0aGlzLm1lZGlhICAgID0gY2h1bmsubWVkaWEubWFwKGZvcm1hdHMgPT4gXG4gICAgICBPYmplY3Qua2V5cyhmb3JtYXRzKS5tYXAoZXh0ZW5zaW9uID0+IE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZSh0aGlzLmxpYnJhcnkuc2V0dGluZ3MubWVkaWFTZXRzLmZpbmQobWVkaWEgPT4gbWVkaWEuZXh0ZW5zaW9uID09IGV4dGVuc2lvbikgfHwge30pLCB7IHVybDogYCR7dGhpcy5saWJyYXJ5LmJhc2VVUkx9LyR7Zm9ybWF0c1tleHRlbnNpb25dfWAgfSkgKVxuICAgIClcblxuICAgIHRoaXMuX2ZldGNoZWQgPSB0cnVlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaFJlc3VsdERlZmluaXRpb24iLCJjb25zdCBTZWFyY2hFbmdpbmUgPSByZXF1aXJlKCcuL3NlYXJjaC1lbmdpbmUvZW5naW5lJylcbmNvbnN0IFJlc3VsdFZpZXcgPSByZXF1aXJlKCcuL3NlYXJjaC1lbmdpbmUvdmlldy1yZXN1bHQnKVxuY29uc3QgUGFnaW5hdG9yID0gcmVxdWlyZSgnLi9zZWFyY2gtZW5naW5lL3ZpZXctcGFnaW5hdG9yJylcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCduYW5vaHRtbCcpXG5jb25zdCBtb3JwaCA9IHJlcXVpcmUoJ25hbm9tb3JwaCcpXG5jb25zdCBwYXJzZUR1cmF0aW9uID0gcmVxdWlyZSgncGFyc2UtZHVyYXRpb24nKVxuY29uc3QgZGVsYXkgPSByZXF1aXJlKCdkZWxheScpXG5cbmNvbnN0IHFzID0gKC4uLmFyZ3MpPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvciguLi5hcmdzKVxuY29uc3QgcXNhID0gKC4uLmFyZ3MpPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCguLi5hcmdzKVxuXG5jbGFzcyBGaW5kU2lnblVJIHtcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICB0aGlzLnNlYXJjaEVuZ2luZSA9IG5ldyBTZWFyY2hFbmdpbmUoY29uZmlnKVxuICB9XG5cbiAgLy8gbG9hZCBkYXRhc2V0c1xuICBhc3luYyBsb2FkKCkge1xuICAgIGF3YWl0IHRoaXMuc2VhcmNoRW5naW5lLmxvYWQoKVxuICB9XG5cbiAgLy8gcmV0dXJucyBhIHByb21pc2UsIHdoaWNoIHJlc29sdmVzIHdoZW4gZGF0YSBpcyBsb2FkZWQgYW5kIHNlYXJjaCBlbmdpbmUgaXMgaW50ZXJhY3RpdmVcbiAgYXdhaXRSZWFkeSgpIHsgcmV0dXJuIHRoaXMuc2VhcmNoRW5naW5lLmF3YWl0UmVhZHkoKSB9XG5cbiAgYXN5bmMgYWRkSG9va3MoKSB7XG4gICAgd2luZG93Lm9uaGFzaGNoYW5nZSA9ICgpPT4gdGhpcy5vbkhhc2hDaGFuZ2UobG9jYXRpb24uaGFzaC5yZXBsYWNlKC9eIy8sICcnKSlcblxuICAgIHFzKHRoaXMuY29uZmlnLnNlYXJjaEZvcm0pLm9uc3VibWl0ID0gZXZlbnQgPT4ge1xuICAgICAgbGV0IHF1ZXJ5VGV4dCA9IHFzKHRoaXMuY29uZmlnLnNlYXJjaElucHV0KS52YWx1ZVxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgbG9jYXRpb24uaHJlZiA9IGAjJHtlbmNvZGVVUklDb21wb25lbnQocXVlcnlUZXh0KX0vMGBcbiAgICB9XG5cbiAgICBpZiAobG9jYXRpb24uaGFzaCAhPSAnJyAmJiBsb2NhdGlvbi5oYXNoICE9ICcjJykgdGhpcy5vbkhhc2hDaGFuZ2UobG9jYXRpb24uaGFzaC5yZXBsYWNlKC9eIy8sICcnKSlcbiAgfVxuXG4gIG9uSGFzaENoYW5nZShoYXNoKSB7XG4gICAgaWYgKGhhc2ggPT0gJycpIHtcbiAgICAgIHRoaXMucmVuZGVySG9tZShoYXNoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlclNlYXJjaChoYXNoKVxuICAgIH1cbiAgfVxuXG4gIC8vIHJlbmRlciBob21lcGFnZVxuICByZW5kZXJIb21lKGhhc2gpIHtcbiAgICBsb2NhdGlvbi5oYXNoID0gXCIjXCJcbiAgICBxcygnaHRtbCA+IGJvZHknKS5jbGFzc05hbWUgPSAnaG9tZSdcbiAgICBxcyh0aGlzLmNvbmZpZy5yZXN1bHRzQ29udGFpbmVyKS5pbm5lckhUTUwgPSAnJ1xuICAgIHFzKHRoaXMuY29uZmlnLnBhZ2luYXRpb25Db250YWluZXIpLmlubmVySFRNTCA9ICcnXG4gICAgcXModGhpcy5jb25maWcuc2VhcmNoSW5wdXQpLnZhbHVlID0gJydcbiAgICBxcyh0aGlzLmNvbmZpZy5zZWFyY2hJbnB1dCkuZm9jdXMoKVxuICAgIC8vIHdlbGNvbWUgc2NyZWVucmVhZGVyIHVzZXJzXG4gICAgLy90aGlzLmFyaWFOb3RpY2UoXCJXZWxjb21lIHRvIEZpbmQgU2lnbi4gRW50ZXIgYSBzZWFyY2ggcXVlcnlcIiwgJ3BvbGl0ZScpXG4gIH1cblxuICAvLyByZW5kZXIgc2VhcmNoIHJlc3VsdHMgcGFnZVxuICBhc3luYyByZW5kZXJTZWFyY2goaGFzaCkge1xuICAgIGxldCBbcXVlcnlUZXh0LCBvZmZzZXRdID0gaGFzaC5zcGxpdCgnLycpLm1hcCh4ID0+IGRlY29kZVVSSUNvbXBvbmVudCh4KSlcbiAgICBpZiAocXVlcnlUZXh0LnRyaW0oKS5sZW5ndGggPT0gMCkgcmV0dXJuIGxvY2F0aW9uLmhyZWYgPSBcIiNcIlxuXG4gICAgLy8gZW5zdXJlIHNlYXJjaCBib3ggaXMgY29ycmVjdGx5IGZpbGxlZFxuICAgIHFzKHRoaXMuY29uZmlnLnNlYXJjaElucHV0KS52YWx1ZSA9IHF1ZXJ5VGV4dFxuXG4gICAgaWYgKCF0aGlzLnNlYXJjaEVuZ2luZS5yZWFkeSkge1xuICAgICAgdGhpcy52aXN1YWxOb3RpY2UoXCJMb2FkaW5n4oCmXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG1vdmUgc2NyZWVucmVhZGVyIGF0dGVudGlvbiB0byBqdXN0IGFib3ZlIHRoZSByZXN1bHRzIGxpc3QsIGFsc28gc2Nyb2xsIHVwXG4gICAgICB0aGlzLmFyaWFOb3RpY2UoXCJMb2FkaW5n4oCmXCIsIFwib2ZmXCIpLmZvY3VzKClcbiAgICB9XG4gICAgXG4gICAgLy8gcXVlcnkgdGhlIHNlYXJjaCBlbmdpbmUuLi5cbiAgICB0aGlzLnJlc3VsdHMgPSBhd2FpdCB0aGlzLnNlYXJjaEVuZ2luZS5xdWVyeShxdWVyeVRleHQpXG5cbiAgICBpZiAodGhpcy5yZXN1bHRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy52aXN1YWxOb3RpY2UoXCJObyBzZWFyY2ggcmVzdWx0cyBmb3VuZC5cIiwgJ2xpdmUnKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyB1cGRhdGUgY3NzIHRvIHBhZ2UgbW9kZVxuICAgICAgcXMoJ2h0bWwgPiBib2R5JykuY2xhc3NOYW1lID0gJ3Jlc3VsdHMnXG5cbiAgICAgIC8vIGNsZWFyIHRoZSB2aWV3c1xuICAgICAgcXModGhpcy5jb25maWcucmVzdWx0c0NvbnRhaW5lcikuaW5uZXJIVE1MID0gJydcbiAgICAgIHFzKHRoaXMuY29uZmlnLnBhZ2luYXRpb25Db250YWluZXIpLmlubmVySFRNTCA9ICcnXG4gICAgfVxuXG4gICAgLy8gc2xpY2Ugb3V0IHRoZSBncm91cCB0byBkaXNwbGF5XG4gICAgdGhpcy5kaXNwbGF5UmVzdWx0cyA9IHRoaXMucmVzdWx0cy5zbGljZShwYXJzZUludChvZmZzZXQpLCBwYXJzZUludChvZmZzZXQpICsgdGhpcy5jb25maWcucmVzdWx0c1BlclBhZ2UpXG5cbiAgICAvLyBhZGQgYWxsIHRoZSBzZWFyY2ggcmVzdWx0IHRpbGVzIHRvIHRoZSByZXN1bHRzIDxkaXY+XG4gICAgbGV0IGZpbmlzaGVkTG9hZGluZyA9IFByb21pc2UuYWxsKHRoaXMuZGlzcGxheVJlc3VsdHMubWFwKGFzeW5jIChyZXN1bHQsIGluZGV4KSA9PiB7XG4gICAgICAvLyBpbXBsZW1lbnQgdGhlIHNsb3cgdGlsZSBpbiBlZmZlY3RcbiAgICAgIGF3YWl0IGRlbGF5KGluZGV4ICogdGhpcy5jb25maWcudGlsZUFwcGVuZERlbGF5KVxuXG4gICAgICAvLyBjcmVhdGUgYSByZXN1bHQgdmlld1xuICAgICAgbGV0IHZpZXcgPSBuZXcgUmVzdWx0Vmlldyh7XG4gICAgICAgIHdhcm5pbmdzOiB0aGlzLmNvbmZpZy53YXJuaW5ncyxcbiAgICAgICAgcmVzdWx0OiByZXN1bHQsXG4gICAgICAgIG9uQ2hhbmdlOiAoKT0+IG1vcnBoKGVsZW1lbnQsIHZpZXcudG9IVE1MKCkpXG4gICAgICB9KVxuXG4gICAgICAvLyBhZGQgdGhlIHJlc3VsdCBwbGFjZWhvbGRlciB0byB0aGUgc2VhcmNoIHJlc3VsdHMgPGRpdj5cbiAgICAgIGxldCBlbGVtZW50ID0gdmlldy50b0hUTUwoKVxuICAgICAgcXModGhpcy5jb25maWcucmVzdWx0c0NvbnRhaW5lcikuYXBwZW5kKGVsZW1lbnQpXG5cbiAgICAgIC8vIGlmIHRoZSByZXN1bHQgaXMgbG93IHJhbmssIGFkZCBhIGxvdyByYW5rIHdhcm5pbmdcbiAgICAgIGlmICh0aGlzLmNvbmZpZy5sb3dSYW5rV2FybmluZyAmJiByZXN1bHQuZGlzdGFuY2UgPiB0aGlzLmNvbmZpZy5sb3dSYW5rV2FybmluZy50aHJlc2hvbGQpIHtcbiAgICAgICAgdmlldy5hZGRXYXJuaW5nKHRoaXMuY29uZmlnLmxvd1JhbmtXYXJuaW5nKVxuICAgICAgfVxuXG4gICAgICAvLyB3YWl0IGZvciBzZWFyY2ggcmVzdWx0cyBkYXRhIHRvIGxvYWQgaW4gYW5kIHVwZGF0ZSB0aGUgc2VhcmNoIHJlc3VsdCB2aWV3XG4gICAgICB2aWV3LnNldERhdGEoYXdhaXQgcmVzdWx0LmZldGNoKCkpXG4gICAgfSkpXG5cbiAgICAvLyB3YWl0IGZvciBhbGwgdGhlIHNlYXJjaCByZXN1bHRzIHRvIGZpbmlzaCBsb2FkaW5nIGluXG4gICAgYXdhaXQgZmluaXNoZWRMb2FkaW5nXG5cbiAgICAvLyBhZGQgYSBwYWdpbmF0b3JcbiAgICBsZXQgcGFnaW5hdG9yID0gbmV3IFBhZ2luYXRvcih7XG4gICAgICBsZW5ndGg6IE1hdGgubWluKHRoaXMucmVzdWx0cy5sZW5ndGggLyB0aGlzLmNvbmZpZy5yZXN1bHRzUGVyUGFnZSwgdGhpcy5jb25maWcubWF4UGFnZXMpLFxuICAgICAgc2VsZWN0ZWQ6IE1hdGguZmxvb3IocGFyc2VJbnQob2Zmc2V0KSAvIHRoaXMuY29uZmlnLnJlc3VsdHNQZXJQYWdlKSxcbiAgICAgIGdldFVSTDogKHBhZ2VOdW0pPT4gYCMke2VuY29kZVVSSUNvbXBvbmVudChxdWVyeVRleHQpfS8ke3BhZ2VOdW0gKiB0aGlzLmNvbmZpZy5yZXN1bHRzUGVyUGFnZX1gXG4gICAgfSlcblxuICAgIC8vIHVwZGF0ZSB0aGUgcGFnaW5hdGlvbiB3aWRnZXRcbiAgICBtb3JwaChxcyh0aGlzLmNvbmZpZy5wYWdpbmF0aW9uQ29udGFpbmVyKSwgcGFnaW5hdG9yLnRvSFRNTCgpKVxuXG4gICAgLy8gbW92ZSBzY3JlZW5yZWFkZXIgYXR0ZW50aW9uIHRvIGp1c3QgYWJvdmUgdGhlIHJlc3VsdHMgbGlzdCwgYW5kIGFubm91bmNlIHRoZXkncmUgcmVhZHlcbiAgICB0aGlzLmFyaWFOb3RpY2UoXCJTZWFyY2ggcmVzdWx0cyB1cGRhdGVkLlwiLCBcIm9mZlwiKS5mb2N1cygpXG4gIH1cblxuICAvLyByZXBsYWNlcyB0aGUgY29udGVudCBvZiB0aGUgcGFnZSB3aXRoIGEgbm90aWNlLCB3aGljaCBpcyBhbHNvIHJlYWQgYnkgYXJpYVxuICB2aXN1YWxOb3RpY2UodGV4dCwgYXJpYUxpdmUgPSAncG9saXRlJykge1xuICAgIHFzKCdodG1sID4gYm9keScpLmNsYXNzTmFtZSA9ICdub3RpY2UnXG4gICAgcXModGhpcy5jb25maWcucGFnaW5hdGlvbkNvbnRhaW5lcikuaW5uZXJIVE1MID0gJydcbiAgICBsZXQgcmVzdWx0c0JveCA9IHFzKHRoaXMuY29uZmlnLnJlc3VsdHNDb250YWluZXIpXG4gICAgcmVzdWx0c0JveC5pbm5lckhUTUwgPSAnJ1xuICAgIHJlc3VsdHNCb3guYXBwZW5kKGh0bWxgPGRpdiBjbGFzcz1cIm5vdGljZV9ib3hcIiBhcmlhLWxpdmU9XCIke2FyaWFMaXZlfVwiPiR7dGV4dH08L2Rpdj5gKVxuICB9XG5cbiAgLy8gY3JlYXRlcyBhbiBpbnZpc2libGUgYXJpYSBub3RpY2Ugd2hpY2ggc2VsZiBkZXN0cnVjdHMgd2hlbiBpdCBibHVyc1xuICBhcmlhTm90aWNlKHRleHQsIGFyaWFMaXZlID0gJ3BvbGl0ZScpIHtcbiAgICBbLi4ucXNhKCdkaXYuYXJpYV9ub3RpY2UnKV0uZm9yRWFjaCh4ID0+IHgucmVtb3ZlKCkpXG4gICAgbGV0IG5vdGljZSA9IGh0bWxgPGRpdiBjbGFzcz1cImFyaWFfbm90aWNlXCIgdGFiaW5kZXg9XCItMVwiIGFyaWEtbGl2ZT1cIiR7YXJpYUxpdmV9XCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogLTEwMDBweFwiPiR7dGV4dH08L2Rpdj5gXG4gICAgcXModGhpcy5jb25maWcucmVzdWx0c0NvbnRhaW5lcikuYmVmb3JlKG5vdGljZSlcbiAgICByZXR1cm4gbm90aWNlXG4gIH1cblxuICBhc3luYyByZW5kZXJIYXNodGFnTGlzdChzZWxlY3Rvcikge1xuICAgIGF3YWl0IHRoaXMuYXdhaXRSZWFkeSgpXG4gICAgbGV0IGxpc3QgPSBxcyhzZWxlY3RvcilcbiAgICBsZXQgdGFncyA9IGF3YWl0IHRoaXMuc2VhcmNoRW5naW5lLmdldFRhZ3MoKVxuICAgIC8vIGVtcHR5IHRoZSBsaXN0XG4gICAgbGlzdC5pbm5lckhUTUwgPSAnJ1xuICAgIC8vIGFkZCBsaXN0IGl0ZW1zIHdpdGggbGlua3MgdG8gZXhhbXBsZSB0YWcgc2VhcmNoZXNcbiAgICBmb3IgKGxldCB0YWcgb2YgT2JqZWN0LmtleXModGFncykuc29ydCgoYSxiKT0+IHRhZ3NbYl0gLSB0YWdzW2FdKSkge1xuICAgICAgbGlzdC5hcHBlbmQoaHRtbGA8bGk+PGEgaHJlZj1cIiR7YC4vIyR7ZW5jb2RlVVJJQ29tcG9uZW50KGAjJHt0YWd9YCl9LzBgfVwiPiMke3RhZ308L2E+ICgke3RhZ3NbdGFnXX0pPC9saT5gKVxuICAgIH1cbiAgfVxufVxuXG5sZXQgdWkgPSB3aW5kb3cudWkgPSBuZXcgRmluZFNpZ25VSSh7XG4gIGxhbmd1YWdlTmFtZTogXCJBdXNsYW5cIixcbiAgc2VhcmNoTGlicmFyeVBhdGg6IFwiZGF0YXNldHMvc2VhcmNoLWluZGV4XCIsXG4gIHZlY3RvckxpYnJhcnlQYXRoOiBcImRhdGFzZXRzL2NjLWVuLTMwMC04Yml0XCIsXG4gIHJlc3VsdHNQZXJQYWdlOiAxMCxcbiAgbWF4UGFnZXM6IDgsXG4gIGhvbWVCdXR0b246ICcjaGVhZGVyJyxcbiAgc2VhcmNoRm9ybTogJyNzZWFyY2hfZm9ybScsXG4gIHNlYXJjaElucHV0OiAnI3NlYXJjaF9ib3gnLFxuICByZXN1bHRzQ29udGFpbmVyOiAnI3Jlc3VsdHMnLFxuICBwYWdpbmF0aW9uQ29udGFpbmVyOiAnI3BhZ2luYXRpb24nLFxuICB0aWxlQXBwZW5kRGVsYXk6IHBhcnNlRHVyYXRpb24oZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLmdldFByb3BlcnR5VmFsdWUoJy0tZmFkZS10aW1lLW9mZnNldCcpLnRyaW0oKSksXG4gIHdhcm5pbmdzOiB7XG4gICAgXCJpbnZlbnRlZFwiOiB7IHR5cGU6ICdpbnZlbnRlZCcsIHRleHQ6IFwiSW5mb3JtYWwsIGNvbGxvcXVhbCBzaWduLiBQcm9mZXNzaW9uYWxzIHNob3VsZCBub3QgdXNlLlwiIH0sXG4gICAgXCJob21lc2lnblwiOiB7IHR5cGU6ICdob21lLXNpZ24nLCB0ZXh0OiBcIlRoaXMgaXMgbGlzdGVkIGFzIGEgSG9tZSBTaWduLCBub3QgYW4gZXN0YWJsaXNoZWQgd2lkZXNwcmVhZCBwYXJ0IG9mIEF1c2xhbi5cIiB9LFxuICAgIFwiaG9tZS1zaWduXCI6IHsgdHlwZTogJ2hvbWUtc2lnbicsIHRleHQ6IFwiVGhpcyBpcyBsaXN0ZWQgYXMgYSBIb21lIFNpZ24sIG5vdCBhbiBlc3RhYmxpc2hlZCB3aWRlc3ByZWFkIHBhcnQgb2YgQXVzbGFuLlwiIH1cbiAgfSxcbiAgLy8gbG93UmFua1dhcm5pbmc6IHtcbiAgLy8gICB0aHJlc2hvbGQ6IDEuMCxcbiAgLy8gICB0eXBlOiAnbG93LXJhbmsnLFxuICAvLyAgIHRleHQ6IFwiVGhpcyBzZWFyY2ggcmVzdWx0IGlzIHZlcnkgbG93IHJhbmsgZm9yIHRoaXMgc2VhcmNoIHF1ZXJ5LlwiXG4gIC8vIH1cbn0pXG5cbi8vIGlmIHRoaXMgaXMgdGhlIHNlYXJjaCBlbmdpbmUgaW50ZXJmYWNlLCBob29rIGFsbCB0aGF0IHN0dWZmIHVwXG5pZiAoZG9jdW1lbnQuYm9keS5kYXRhc2V0Lmhvb2sgPT0gJ3RydWUnKSB1aS5hZGRIb29rcygpXG4vLyByZWdhcmRsZXNzLCBsb2FkIG91ciBkYXRhc2V0cywgd2UgbWlnaHQgYmUgb24gdGhlIGFib3V0IHBhZ2VcbnVpLmxvYWQoKVxuLy8gaWYgYSBoYXNodGFnIGxpc3QgaXMgcmVxdWVzdGVkLCBkaXNwbGF5IGl0XG5pZiAoZG9jdW1lbnQuYm9keS5kYXRhc2V0Lmhhc2h0YWdMaXN0KSB1aS5yZW5kZXJIYXNodGFnTGlzdChkb2N1bWVudC5ib2R5LmRhdGFzZXQuaGFzaHRhZ0xpc3QpIiwiLy8gZ2VuZXJhbCB1dGlsaXRpZXMgbGlicmFyeSBvZiB1c2VmdWwgZnVuY3Rpb25zIHRoYXQgZ2V0IHJldXNlZCBhIGxvdFxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0JylcblxuXG5sZXQgVXRpbCA9IHtcbiAgLy8gZW5jb2RlIGEgKHBvc2l0aXZlIG9yIDApIGludGVnZXIgdG8gYSBiaW5hcnkgc3RyaW5nXG4gIGludFRvQml0czogKG51bWJlciwgc2l6ZSkgPT4ge1xuICAgIGFzc2VydCghTnVtYmVyLmlzTmFOKG51bWJlciksIGBOdW1iZXIgaXMgTmFOISBDYW5ub3QgZW5jb2RlIHRvIGludGApXG4gICAgYXNzZXJ0KG51bWJlciA9PSBNYXRoLnJvdW5kKG51bWJlciksIGBOdW1iZXIgbXVzdCBiZSBhIHdob2xlIG51bWJlcmApXG4gICAgYXNzZXJ0KG51bWJlciA+PSAwLCBgTnVtYmVyIGlzIG5lZ2F0aXZlISBDYW5ub3QgZW5jb2RlIHRvIGludGApXG4gICAgbGV0IGVuY29kZWQgPSBudW1iZXIudG9TdHJpbmcoMilcbiAgICBhc3NlcnQoZW5jb2RlZC5sZW5ndGggPD0gc2l6ZSwgYElucHV0IG51bWJlciAke251bWJlcn0gdG9vIGxhcmdlIHRvIGZpdCBpbiAke3NpemV9IGRpZ2l0cyB3aXRoIGJpbmFyeSBlbmNvZGluZ2ApXG4gICAgcmV0dXJuICgnMCcpLnJlcGVhdChzaXplIC0gZW5jb2RlZC5sZW5ndGgpICsgZW5jb2RlZFxuICB9LFxuXG4gIC8vIGRlY29kZSBhIGJpbmFyeSBzdHJpbmcgaW4gdG8gYSBwb3NpdGl2ZSBvciAwIGludGVnZXJcbiAgYml0c1RvSW50OiAoYmluYXJ5U3RyaW5nKSA9PiB7XG4gICAgYXNzZXJ0KGJpbmFyeVN0cmluZy5tYXRjaCgvXlswMV0rJC8pLCAnU3RyaW5nIGNvbnRhaW5zIGNoYXJhY3RlcnMgdGhhdCBhcmUgbm90IGJpbmFyeScpXG4gICAgYXNzZXJ0KGJpbmFyeVN0cmluZy5sZW5ndGggPD0gNTMsIGBTdHJpbmcgaXMgdG9vIGxvbmcgdG8gcGFyc2UgaW4gdG8gYSBzaW5nbGUgaW50IHJlbGlhYmx5YClcbiAgICByZXR1cm4gcGFyc2VJbnQoYmluYXJ5U3RyaW5nLCAyKVxuICB9LFxuXG4gIC8vIGVuY29kZSBhIHNpZ25lZCBpbnQgdG8gYSBzZXQgbnVtYmVyIG9mIGJpdHMgdXNpbmcgMidzIGNvbXBsaW1lbnQgZW5jb2RpbmdcbiAgc2ludFRvQml0czogKG51bWJlciwgc2l6ZSkgPT4ge1xuICAgIGFzc2VydChzaXplID49IDIsIGBTaXplIGNhbm5vdCBiZSB1bmRlciAyYClcbiAgICBhc3NlcnQoIU51bWJlci5pc05hTihudW1iZXIpLCBgTnVtYmVyIGlzIE5hTiEgQ2Fubm90IGVuY29kZSB0byBzaWduZWQgaW50YClcbiAgICBhc3NlcnQobnVtYmVyID09IE1hdGgucm91bmQobnVtYmVyKSwgYE51bWJlciBtdXN0IGJlIGEgd2hvbGUgbnVtYmVyYClcbiAgICBhc3NlcnQobnVtYmVyIDwgMiAqKiAoc2l6ZSAtIDEpLCBgTnVtYmVyIGlzIHRvbyBzbWFsbCB0byBmaXQgaW4gdGhlIHNwZWNpZmllZCBzaXplYClcbiAgICBhc3NlcnQobnVtYmVyID4gMCAtICgyICoqIChzaXplIC0gMSkpLCBgTnVtYmVyIGlzIHRvbyBsYXJnZSB0byBmaXQgaW4gdGhlIHNwZWNpZmllZCBzaXplYClcbiAgICBsZXQgdHJ1ZU51bWJlclNpemUgPSBzaXplIC0gMVxuICAgIGxldCBlbmNvZGVkID0gTWF0aC5hYnMobnVtYmVyKS50b1N0cmluZygyKVxuICAgIGFzc2VydChlbmNvZGVkLmxlbmd0aCA8PSB0cnVlTnVtYmVyU2l6ZSlcbiAgICByZXR1cm4gKG51bWJlciA8IDAgPyAnMSc6JzAnKSArICgnMCcpLnJlcGVhdCh0cnVlTnVtYmVyU2l6ZSAtIGVuY29kZWQubGVuZ3RoKSArIGVuY29kZWRcbiAgfSxcblxuICAvLyBkZWNvZGUgYmluYXJ5IHN0cmluZyBpbiB0byBhIHNpZ25lZCBpbnRlZ2VyXG4gIGJpdHNUb1NpbnQ6IChiaW5hcnlTdHJpbmcpID0+IHtcbiAgICBhc3NlcnQoYmluYXJ5U3RyaW5nLm1hdGNoKC9eWzAxXSskLyksICdTdHJpbmcgY29udGFpbnMgY2hhcmFjdGVycyB0aGF0IGFyZSBub3QgYmluYXJ5JylcbiAgICBhc3NlcnQoYmluYXJ5U3RyaW5nLmxlbmd0aCA8PSA1MywgYFN0cmluZyBpcyB0b28gbG9uZyB0byBwYXJzZSBpbiB0byBhIHNpbmdsZSBzaWduZWQgaW50IHJlbGlhYmx5YClcbiAgICBsZXQgY29tcGxpbWVudCA9IGJpbmFyeVN0cmluZy5zbGljZSgwLCAxKVxuICAgIGxldCBudW1lcmljQml0cyA9IGJpbmFyeVN0cmluZy5zbGljZSgxKVxuICAgIGxldCBhYnNvbHV0ZSA9IHBhcnNlSW50KG51bWVyaWNCaXRzLCAyKVxuICAgIHJldHVybiBjb21wbGltZW50ID09ICcwJyA/ICthYnNvbHV0ZSA6IC1hYnNvbHV0ZVxuICB9LFxuXG4gIC8vIGVuY29kZSBhIGJ5dGUgYXJyYXkgdG8gYSBiaW5hcnkgc3RyaW5nXG4gIGJ5dGVzVG9CaXRzOiAoYnl0ZUFycmF5KSA9PiB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oYnl0ZUFycmF5LCB4ID0+IFV0aWwuaW50VG9CaXRzKHgsIDgpKS5qb2luKCcnKVxuICB9LFxuXG4gIGJpdHNUb0J5dGVzOiAoYmluYXJ5U3RyaW5nKSA9PiB7XG4gICAgYXNzZXJ0KGJpbmFyeVN0cmluZy5sZW5ndGggJSA4ID09IDAsIFwiQmluYXJ5IHN0cmluZyBpbnB1dCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgOCBjaGFyYWN0ZXJzXCIpXG4gICAgcmV0dXJuIEFycmF5LmZyb20oVXRpbC5jaHVua0l0ZXJhYmxlKGJpbmFyeVN0cmluZywgOCksIGNodW5rID0+IFV0aWwuYml0c1RvSW50KGNodW5rKSlcbiAgfSxcblxuICAvLyBsaWtlIGJ5dGVzVG9CaXRzLCBidXQgb25seSByZXR1cm5zIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIHByZWZpeCBiaXRzXG4gIGJ5dGVzVG9QcmVmaXhCaXRzOiAoYnl0ZUFycmF5LCBwcmVmaXhCaXRMZW5ndGggPSAwKSA9PiB7XG4gICAgcmV0dXJuIFV0aWwuYnl0ZXNUb0JpdHMoYnl0ZUFycmF5LnNsaWNlKDAsIE1hdGguY2VpbChwcmVmaXhCaXRMZW5ndGggLyA4KSkpLnNsaWNlKDAsIHByZWZpeEJpdExlbmd0aClcbiAgfSxcblxuICAvLyBjb252ZXJ0IGEgYnl0ZSBhcnJheSBpbiB0byBhIGxvd2VyY2FzZSBiYXNlMTYgcmVwcmVzZW50YXRpb25cbiAgYnl0ZXNUb0Jhc2UxNjogKGJ5dGVBcnJheSkgPT4ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGJ5dGVBcnJheSwgbnVtID0+IGJ5dGVzVG9CYXNlMTZUYWJsZVtudW1dKS5qb2luKCcnKVxuICB9LFxuXG4gIGJhc2UxNlRvQnl0ZXM6IChiYXNlMTZTdHJpbmcpID0+IHtcbiAgICBhc3NlcnQoYmFzZTE2U3RyaW5nLmxlbmd0aCAlIDIgPT0gMCwgXCJCYXNlIDE2IFN0cmluZyBpbnB1dCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMiBjaGFyYWN0ZXJzXCIpXG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KEFycmF5LmZyb20oVXRpbC5jaHVua0l0ZXJhYmxlKGJhc2UxNlN0cmluZywgMiksIG5pYmJsZSA9PiBwYXJzZUludChuaWJibGUsIDE2KSkpXG4gIH0sXG5cbiAgLy8gcGFjayBhIHNldCBvZiBmbG9hdHMgaW4gdGhlIC0xLjAgdG8gKzEuMCByYW5nZSBpbiB0byBpbnRzIHdpdGggYXJiaXRyYXJ5IHByZWNpc2lvblxuICBwYWNrRmxvYXRzOiAoZmxvYXRzLCBiaXRQcmVjaXNpb24pID0+IHtcbiAgICBsZXQgc2ludHMgPSBmbG9hdHMubWFwKG51bSA9PiBNYXRoLnJvdW5kKG51bSAqICgoMiAqKiAoYml0UHJlY2lzaW9uIC0gMSkgLSAxKSkpKVxuICAgIGxldCBiaXRzID0gc2ludHMubWFwKHNpbnQgPT4gVXRpbC5zaW50VG9CaXRzKHNpbnQsIGJpdFByZWNpc2lvbikpLmpvaW4oJycpXG4gICAgaWYgKGJpdHMubGVuZ3RoICUgOCAhPSAwKSBiaXRzICs9ICgnMCcpLnJlcGVhdCg4IC0gKGJpdHMubGVuZ3RoICUgOCkpXG4gICAgcmV0dXJuIFV0aWwuYml0c1RvQnl0ZXMoYml0cylcbiAgfSxcblxuICAvLyB1bnBhY2sgYSBzZXJpZXMgb2YgYXJiaXRyYXJ5IHByZWNpc2lvbiBmbG9hdHMgKHRydWx5IGZpeGVkIHBvaW50IG51bWJlcnMpIGZyb20gYSBzZXQgb2YgYnl0ZXMgKGkuZS4gd29yZCB2ZWN0b3JzKVxuICB1bnBhY2tGbG9hdHM6IChieXRlcywgYml0UHJlY2lzaW9uLCB0b3RhbEZsb2F0cykgPT4ge1xuICAgIGxldCBiaXRzID0gVXRpbC5ieXRlc1RvQml0cyhieXRlcylcbiAgICByZXR1cm4gVXRpbC50aW1lc01hcCh0b3RhbEZsb2F0cywgaW5kZXggPT4ge1xuICAgICAgbGV0IHNpbnQgPSBVdGlsLmJpdHNUb1NpbnQoYml0cy5zbGljZShpbmRleCAqIGJpdFByZWNpc2lvbiwgKGluZGV4ICsgMSkgKiBiaXRQcmVjaXNpb24pKVxuICAgICAgcmV0dXJuIHNpbnQgLyAoKDIgKiogKGJpdFByZWNpc2lvbiAtIDEpKSAtIDEpXG4gICAgfSlcbiAgfSxcblxuICAvLyBPYmplY3QgY29udmVyc2lvbiBzdHVmZlxuXG4gIC8vIGFjY2VwdHMgYW4gb2JqZWN0IHdpdGggYmFzZTE2IGtleXMgYW5kIGFueSB2YWx1ZXNcbiAgLy8gcmV0dXJucyBhIE1hcCB3aXRoIFVpbnQ4QXJyYXkga2V5cyBhbmQgdmFsdWVzIGNvcGllZCBpblxuICBiYXNlMTZPYmplY3RUb1VpbnQ4TWFwOiAob2JqZWN0KSA9PiB7XG4gICAgcmV0dXJuIFV0aWwub2JqZWN0VG9NYXAob2JqZWN0LCAoa2V5U3RyaW5nKT0+IG5ldyBVaW50OEFycmF5KFV0aWwuYmFzZTE2VG9CeXRlcyhrZXlTdHJpbmcpKSlcbiAgfSxcblxuICAvLyBhY2NlcHRzIGFuIG9iamVjdCBhcyBpbnB1dCwgYW5kIHVzZXMgYW4gb3B0aW9uYWwga2V5TWFwIGZ1bmN0aW9uIHRvIHRyYW5zZm9ybSB0aGUga2V5cyBpbiB0b1xuICAvLyBhbnkgb3RoZXIgZm9ybWF0LCB0aGVuIGJ1aWxkcyBhIG1hcCB1c2luZyB0aGF0IGZvcm1hdCBhbmQgcmV0dXJucyBpdFxuICBvYmplY3RUb01hcDogKG9iamVjdCwga2V5TWFwRm4gPSAoeCkgPT4geCwgdmFsdWVNYXBGbiA9ICh4KSA9PiB4KSA9PiB7XG4gICAgbGV0IG1hcCA9IG5ldyBNYXAoKVxuICAgIGZvciAobGV0IHByb3BlcnR5TmFtZSBpbiBvYmplY3QpIHtcbiAgICAgIG1hcC5zZXQoa2V5TWFwRm4ocHJvcGVydHlOYW1lKSwgdmFsdWVNYXBGbihvYmplY3RbcHJvcGVydHlOYW1lXSkpXG4gICAgfVxuICAgIHJldHVybiBtYXBcbiAgfSxcblxuXG4gIC8vIGVuY29kZS9kZWNvZGUgYSBidWZmZXIgKGxpa2UgdGhhdCByZXR1cm5lZCBieSBmZXRjaCkgaW4gdG8gYSByZWd1bGFyIHN0cmluZ1xuICAvLyByZXR1cm5zIGEgcHJvbWlzZVxuICBlbmNvZGVVVEY4OiAoc3RyaW5nKSA9PiB7XG4gICAgaWYgKCF0aGlzLl91dGY4X2VuY29kZXIpIHRoaXMuX3V0ZjhfZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigndXRmLTgnKVxuICAgIHJldHVybiB0aGlzLl91dGY4X2VuY29kZXIuZW5jb2RlKHN0cmluZylcbiAgfSxcblxuICBkZWNvZGVVVEY4OiAoYnVmZmVyKSA9PiB7XG4gICAgaWYgKCF0aGlzLl91dGY4X2RlY29kZXIpIHRoaXMuX3V0ZjhfZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigndXRmLTgnKVxuICAgIHJldHVybiB0aGlzLl91dGY4X2RlY29kZXIuZGVjb2RlKGJ1ZmZlcilcbiAgfSxcblxuICAvLyBleGVjdXRlIGEgY2FsbGJhY2sgeCBtYW55IHRpbWVzXG4gIHRpbWVzOiAodGltZXMsIGNhbGxiYWNrKSA9PiB7XG4gICAgbGV0IGluZGV4ID0gMFxuICAgIHdoaWxlIChpbmRleCA8IHRpbWVzKSB7XG4gICAgICBjYWxsYmFjayhpbmRleCwgdGltZXMpXG4gICAgICBpbmRleCArPSAxXG4gICAgfVxuICB9LFxuXG4gIC8vIGEgc2V0IG51bWJlciBvZiB0aW1lcywgYSBjYWxsYmFjayBpcyBjYWxsZWQgd2l0aCAoaW5kZXgsIHRpbWVzKSwgcmV0dXJuaW5nIGEgcmVndWxhciBBcnJheSBvZiB0aGUgcmV0dXJuIHZhbHVlc1xuICB0aW1lc01hcDogKHRpbWVzLCBjYWxsYmFjaykgPT4ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKFV0aWwudGltZXNNYXBJdGVyYWJsZSh0aW1lcywgY2FsbGJhY2spKVxuICB9LFxuXG4gIC8vIHJldHVybnMgYW4gaXRlcmFibGUgd2hpY2ggY2FsbHMgYSBjYWxsYmFjayB3aXRoIChpbmRleCwgdGltZXMpIGB0aW1lc2AgbWFueSB0aW1lcywgcmV0dXJuaW5nIHRoZSByZXN1bHRzIG9mIHRoZSBjYWxsYmFja1xuICB0aW1lc01hcEl0ZXJhYmxlOiBmdW5jdGlvbiAqKHRpbWVzLCBjYWxsYmFjaykge1xuICAgIGxldCBpbmRleCA9IDBcbiAgICB3aGlsZSAoaW5kZXggPCB0aW1lcykge1xuICAgICAgeWllbGQgY2FsbGJhY2soaW5kZXgsIHRpbWVzKVxuICAgICAgaW5kZXggKz0gMVxuICAgIH1cbiAgfSxcblxuICAvLyBnaXZlbiBhIHNsaWNlYWJsZSBvYmplY3QgbGlrZSBhbiBBcnJheSwgQnVmZmVyLCBvciBTdHJpbmcsIHJldHVybnMgYW4gYXJyYXkgb2Ygc2xpY2VzLCBjaHVua1NpemUgbGFyZ2UsIHVwIHRvIG1heENodW5rcyBvciB0aGUgd2hvbGUgdGhpbmdcbiAgLy8gdGhlIGxhc3QgY2h1bmsgbWF5IG5vdCBiZSBmdWxsIHNpemVcbiAgY2h1bms6IChzbGljZWFibGUsIGNodW5rU2l6ZSwgbWF4Q2h1bmtzID0gSW5maW5pdHkpID0+IHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShVdGlsLmNodW5rSXRlcmFibGUoc2xpY2VhYmxlLCBjaHVua1NpemUsIG1heENodW5rcykpXG4gIH0sXG5cbiAgLy8gaXRlcmFibGUgdmVyc2lvbiwgdGFrZXMgYW4gaXRlcmFibGUgYXMgaW5wdXQsIGFuZCBwcm92aWRlcyBhbiBpdGVyYWJsZSBhcyBvdXRwdXQgd2l0aCBlbnRyaWVzIGdyb3VwZWQgaW4gdG8gYXJyYXlzXG4gIC8vIHN0cmluZ3MgYXMgaW5wdXRzIGFyZSBhIHNwZWNpYWwgY2FzZTogeW91IGdldCBzdHJpbmdzIGFzIG91dHB1dCAoY29uY2F0aW5hdGluZyB0aGUgY2hhcmFjdGVycyB0b2dldGhlcilcbiAgY2h1bmtJdGVyYWJsZTogZnVuY3Rpb24qKHNsaWNlYWJsZSwgY2h1bmtTaXplLCBtYXhDaHVua3MgPSBJbmZpbml0eSkge1xuICAgIGxldCBpbnB1dCA9IHNsaWNlYWJsZVtTeW1ib2wuaXRlcmF0b3JdKClcbiAgICB3aGlsZSAobWF4Q2h1bmtzID4gMCkge1xuICAgICAgbGV0IGNodW5rID0gW11cbiAgICAgIHdoaWxlIChjaHVuay5sZW5ndGggPCBjaHVua1NpemUpIHtcbiAgICAgICAgbGV0IG91dHB1dCA9IGlucHV0Lm5leHQoKVxuICAgICAgICBpZiAob3V0cHV0LmRvbmUpIHtcbiAgICAgICAgICBpZiAoY2h1bmsubGVuZ3RoID4gMCkgeWllbGQgKHR5cGVvZihzbGljZWFibGUpID09ICdzdHJpbmcnKSA/IGNodW5rLmpvaW4oJycpIDogY2h1bmtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjaHVuay5wdXNoKG91dHB1dC52YWx1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgeWllbGQgKHR5cGVvZihzbGljZWFibGUpID09ICdzdHJpbmcnKSA/IGNodW5rLmpvaW4oJycpIDogY2h1bmtcbiAgICAgIG1heENodW5rcyAtPSAxXG4gICAgfVxuICB9LFxuXG5cbiAgLy8gc29tZSBjb21tb24gYnJvd3NlciB0aGluZ2llc1xuICBmZXRjaExpa2VGaWxlOiBhc3luYyAocGF0aCkgPT4ge1xuICAgIGxldCBkYXRhID0gYXdhaXQgZmV0Y2gocGF0aCwgeyBtb2RlOiAnc2FtZS1vcmlnaW4nIH0pXG4gICAgaWYgKCFkYXRhLm9rKSB0aHJvdyBuZXcgRXJyb3IoYFNlcnZlciByZXNwb25kZWQgd2l0aCBlcnJvciBjb2RlISBcIiR7ZGF0YS5zdGF0dXN9XCIgd2hpbGUgbG9hZGluZyBcIiR7cGF0aH1cIiBTZWFyY2ggTGlicmFyeWApXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGF3YWl0IGRhdGEuYXJyYXlCdWZmZXIoKSlcbiAgfSxcblxuICAvLyBzaW1wbGlmaWVkIGRpZ2VzdHMgb2Ygc2hvcnQgYnVmZmVyc1xuICBkaWdlc3RPbldlYjogYXN5bmMgKGFsZ28sIGRhdGEpID0+IHtcbiAgICBjb25zdCBhbGdvcyA9IHtzaGExOiBcIlNIQS0xXCIsIHNoYTI1NjogXCJTSEEtMjU2XCIsIHNoYTM4NDogXCJTSEEtMzg0XCIsIHNoYTUxMjogXCJTSEEtNTEyXCJ9XG4gICAgYWxnbyA9IGFsZ29zW2FsZ29dIHx8IGFsZ29cbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoYWxnbywgZGF0YSkpXG4gIH0sXG59XG5cbmNvbnN0IGJ5dGVzVG9CYXNlMTZUYWJsZSA9IFV0aWwudGltZXNNYXAoMiAqKiA4LCAobnVtYmVyKT0+XG4gICgnMDAnICsgbnVtYmVyLnRvU3RyaW5nKDE2KS50b0xvd2VyQ2FzZSgpKS5zbGljZSgtMilcbilcblxubW9kdWxlLmV4cG9ydHMgPSBVdGlsIiwiLy8gVmVjdG9yIExpYnJhcnkgdmVyc2lvbiAzXG4vLyB0aGlzIHZlcnNpb24gd29ya3MgZWZmZWN0aXZlbHkgdGhlIHNhbWUgd2F5IGFzIHZlcnNpb24gMiwgYnV0IHN0b3JlcyBzaGFyZHMgYXMgY2JvciBzdHJlYW1zXG4vLyBhbmQgdW5pZmllcyBidWlsZGluZyBhbmQgcmVhZGluZyBpbiB0byBvbmUgY2xhc3MsIGFuZCBhZGQncyBhdXRvbWF0aWMgdmVjdG9yIHNjYWxpbmdcblxuLy8gY29uZmlnIGlzIHN0b3JlZCBhcyByZWd1bGFyIGpzb24gZm9yIGh1bWFuIHJlYWRhYmlsaXR5LCBhbmQgY29udGFpbnMgdGhlIHNldHRpbmdzIG9iamVjdFxuXG4vLyBzaGFyZCBmaWxlcyBjb250YWluIGEgc3RyZWFtIG9mIGNib3IgZW50cmllcywgZWFjaCBncm91cCBvZiBmb3VyIGVudHJpZXMgcmVwcmVzZW50aW5nIGEgcGFpclxuLy8gdGhlIG9yZGVyIG9mIHRoZXNlIGNvbXBvbmVudHMgYXJlOlxuLy8gICAxOiA8c3RyaW5nPiB0ZXh0IHdvcmRcbi8vICAgMjogPGZsb2F0PiBzY2FsaW5nIHZhbHVlXG4vLyAgIDM6IDxVaW50OEFycmF5PiB2ZWN0b3JEYXRhXG5cbmNvbnN0IGZzdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKVxuY29uc3QgY2JvciA9IHJlcXVpcmUoJ2JvcmMnKVxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0JylcblxuY2xhc3MgVmVjdG9yTGlicmFyeSB7XG4gIC8vIEluaXRpYWxpc2UgYSBWZWN0b3IgTGlicmFyeSByZWFkZXIvd3JpdGVyXG4gIC8vIFJlcXVpcmVkIGZvciByZWFkIG9ubHkgdXNlOlxuICAvLyAgIGZzOiB7IHJlYWRGaWxlKHBhdGgpIH0gLy8gcmVhZEZpbGUgbXVzdCByZXR1cm4gYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdpdGggYSBVaW50OEFycmF5XG4gIC8vICAgZGlnZXN0KGFsZ28sIGJ1ZmZlcikgLy8gYWNjZXB0cyBhbiBhbGdvcml0aG0gbGlrZSBzaGEyNTYsIGFuZCBhIFVpbnQ4QXJyYXkgb2YgZGF0YSB0byBkaWdlc3QsIHJldHVybnMgYSBwcm9taXNlIHJlc29sdmluZyB3aXRoIGEgVWludDhBcnJheSBoYXNoXG4gIC8vICAgcGF0aDogPHN0cmluZz4gLy8gYSBzdHJpbmcgcGF0aCB0byB0aGUgdmVjdG9yIGxpYnJhcnkgb24gdGhlIGZpbGVzeXN0ZW1cbiAgLy8gUmVxdWlyZWQgZm9yIHdyaXRpbmc6XG4gIC8vICAgZnM6IHJlZmVyZW5jZSB0byByZXF1aXJlKCdmcy1leHRyYScpIG9yIGEgc2ltaWxhciBwcm9taXNpZmllZCBmcyBpbXBsZW1lbnRhdGlvblxuICAvLyBPcHRpb25hbDpcbiAgLy8gICB0ZXh0RmlsdGVyOiBhIGZ1bmN0aW9uIHdoaWNoIHRyYW5zZm9ybXMgd29yZCBzdHJpbmdzIHRvIGEgY29uc2lzdGVudCBmb3JtYXQgKGkuZS4gbG93ZXJjYXNlKVxuICBjb25zdHJ1Y3Rvcihjb25maWcgPSB7fSkge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnXG4gICAgYXNzZXJ0KHRoaXMuY29uZmlnLmZzLCBgXCJmc1wiIGlzIGEgcmVxdWlyZWQgY29uZmlndXJhYmxlIG9wdGlvbmApXG4gICAgYXNzZXJ0KHRoaXMuY29uZmlnLnBhdGgsIGBcInBhdGhcIiBpcyBhIHJlcXVpcmVkIGNvbmZpZ3VyYWJsZSBvcHRpb25gKVxuICAgIGFzc2VydCh0aGlzLmNvbmZpZy5kaWdlc3QsIGBcImRpZ2VzdFwiIGlzIGEgcmVxdWlyZWQgY29uZmlndXJhYmxlIG9wdGlvbmApXG4gICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgIGhhc2hGdW5jdGlvbjogdGhpcy5jb25maWcuaGFzaEZ1bmN0aW9uIHx8ICdzaGEyNTYnLFxuICAgICAgdmVjdG9yU2l6ZTogdGhpcy5jb25maWcudmVjdG9yU2l6ZSB8fCAzMDAsXG4gICAgICB2ZWN0b3JCaXRzOiB0aGlzLmNvbmZpZy52ZWN0b3JCaXRzIHx8IDgsXG4gICAgICBidWlsZFRpbWVzdGFtcDogdGhpcy5jb25maWcuYnVpbGRUaW1lc3RhbXAgfHwgRGF0ZS5ub3coKSxcbiAgICAgIHByZWZpeEJpdHM6IHRoaXMuY29uZmlnLnByZWZpeEJpdHMgfHwgNyxcbiAgICAgIHNoYXJkQml0czogdGhpcy5jb25maWcuc2hhcmRCaXRzIHx8IDEzLFxuICAgIH1cbiAgfVxuXG4gIC8vIGxvYWQgdGhlIHNldHRpbmdzIGZyb20gYW4gZXhpc3RpbmcgYnVpbGRcbiAgYXN5bmMgb3BlbigpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gSlNPTi5wYXJzZShhd2FpdCB0aGlzLmNvbmZpZy5mcy5yZWFkRmlsZShgJHt0aGlzLmNvbmZpZy5wYXRofS9zZXR0aW5ncy5qc29uYCkpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIHRha2VzIGEgd29yZCBzdHJpbmcgYXMgaW5wdXQsIGFuZCBjYWxjdWxhdGVzIHdoaWNoIHNoYXJkIGl0IHNob3VsZCBnbyBpblxuICAvLyBpbiByZWFkaW5nIG1vZGUsIG1ha2Ugc3VyZSB0byBvcGVuKCkgdGhlIGxpYnJhcnkgZmlyc3QgLSBzZXR0aW5ncy5qc29uIGRhdGEgaXMgaW1wb3J0YW50IVxuICBhc3luYyBnZXRXb3JkSW5mbyhzdHJpbmdXb3JkKSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnRleHRGaWx0ZXIpIHN0cmluZ1dvcmQgPSB0aGlzLmNvbmZpZy50ZXh0RmlsdGVyKHN0cmluZ1dvcmQpXG4gICAgbGV0IHdvcmRIYXNoID0gYXdhaXQgdGhpcy5jb25maWcuZGlnZXN0KHRoaXMuc2V0dGluZ3MuaGFzaEZ1bmN0aW9uLCBmc3V0aWwuZW5jb2RlVVRGOChzdHJpbmdXb3JkKSlcbiAgICBsZXQgcHJlZml4SUQgPSBwYXJzZUludChmc3V0aWwuYnl0ZXNUb1ByZWZpeEJpdHMod29yZEhhc2gsIHRoaXMuc2V0dGluZ3MucHJlZml4Qml0cyksIDIpXG4gICAgbGV0IHNoYXJkSUQgID0gcGFyc2VJbnQoZnN1dGlsLmJ5dGVzVG9QcmVmaXhCaXRzKHdvcmRIYXNoLCB0aGlzLnNldHRpbmdzLnNoYXJkQml0cyksIDIpXG4gICAgcmV0dXJuIHsgZmlsdGVyZWQ6IHN0cmluZ1dvcmQsIHByZWZpeElELCBzaGFyZElELCBwYXRoOiBgJHt0aGlzLmNvbmZpZy5wYXRofS9zaGFyZHMvJHtwcmVmaXhJRH0vJHtzaGFyZElEfS5jYm9yYCB9XG4gIH1cblxuICAvLyBhZGQgYSBkZWZpbml0aW9uIHRvIHRoZSBWZWN0b3IgTGlicmFyeVxuICBhc3luYyBhZGREZWZpbml0aW9uKHN0cmluZ1dvcmQsIHZlY3RvckFycmF5KSB7XG4gICAgLy8gZ3JhYiBpbmZvIGFib3V0IHRoaXMgd29yZCBhbmQgd2hpY2ggc2hhcmQgaXQgc2hvdWxkIGxpdmUgaW5cbiAgICBsZXQgeyBwYXRoOiBzaGFyZFBhdGgsIGZpbHRlcmVkIH0gPSBhd2FpdCB0aGlzLmdldFdvcmRJbmZvKHN0cmluZ1dvcmQpXG4gICAgXG4gICAgLy8gZmlndXJlIG91dCB3aGF0IHRoZSBsYXJnZXN0IG51bWJlciBpbiB0aGUgdmVjdG9yIGlzIHRvIHVzZSBhcyBhIHNjYWxpbmcgdmFsdWVcbiAgICBsZXQgdmVjdG9yU2NhbGUgPSBNYXRoLm1heCguLi52ZWN0b3JBcnJheS5tYXAoTWF0aC5hYnMpKVxuICAgIC8vIHNjYWxlIHRoZSBkaWdpdHMgYWNjb3JkaW5nbHlcbiAgICBsZXQgc2NhbGVkVmVjdG9yID0gdmVjdG9yQXJyYXkubWFwKHggPT4geCAvIHZlY3RvclNjYWxlKVxuICAgIC8vIHBhY2sgdGhlIG51bWJlcnMgaW4gdG8gYSBidWZmZXIgb2YgaW50ZWdlcnNcbiAgICBsZXQgcGFja2VkVmVjdG9yID0gZnN1dGlsLnBhY2tGbG9hdHMoc2NhbGVkVmVjdG9yLCB0aGlzLnNldHRpbmdzLnZlY3RvckJpdHMpXG4gICAgLy8gY2JvciBlbmNvZGUgZWFjaCBwaWVjZSBhbmQgYXBwZW5kIHRoZW1cbiAgICBsZXQgYXBwZW5kRGF0YSA9IEJ1ZmZlci5jb25jYXQoW2ZpbHRlcmVkLCB2ZWN0b3JTY2FsZSwgcGFja2VkVmVjdG9yXS5tYXAoeCA9PiBjYm9yLmVuY29kZSh4KSkpXG4gICAgLy8gd3JpdGUgb3V0IHRoZSBuZXcgZGVmaW5pdGlvbiBkYXRhIHRvIHRoZSBjb3JyZWN0IHNoYXJkXG4gICAgYXdhaXQgdGhpcy5jb25maWcuZnMuZW5zdXJlRmlsZShzaGFyZFBhdGgpXG4gICAgYXdhaXQgdGhpcy5jb25maWcuZnMuYXBwZW5kRmlsZShzaGFyZFBhdGgsIGFwcGVuZERhdGEpXG4gIH1cblxuICAvLyBsb29rdXAgYSB3b3JkIGluIHRoZSB2ZWN0b3IgbGlicmFyeVxuICBhc3luYyBsb29rdXAoc3RyaW5nV29yZCkge1xuICAgIC8vIGdyYWIgaW5mbyBhYm91dCB0aGlzIHdvcmRcbiAgICBsZXQgeyBwYXRoOiBzaGFyZFBhdGgsIGZpbHRlcmVkIH0gPSBhd2FpdCB0aGlzLmdldFdvcmRJbmZvKHN0cmluZ1dvcmQpXG4gICAgLy8gbG9hZCBzaGFyZCBkYXRhXG4gICAgbGV0IHNoYXJkRGF0YSA9IGNib3IuZGVjb2RlQWxsKGF3YWl0IHRoaXMuY29uZmlnLmZzLnJlYWRGaWxlKHNoYXJkUGF0aCkpXG4gICAgLy8gaXRlcmF0ZSB0aHJvdWdoIGVudHJpZXMgaW4gdGhpcyBzaGFyZCB1bnRpbCB3ZSBmaW5kIGEgbWF0Y2hcbiAgICBmb3IgKGxldCBbY2h1bmtXb3JkLCB2ZWN0b3JTY2FsZSwgcGFja2VkVmVjdG9yXSBvZiBmc3V0aWwuY2h1bmtJdGVyYWJsZShzaGFyZERhdGEsIDMpKSB7XG4gICAgICBpZiAoZmlsdGVyZWQgPT0gY2h1bmtXb3JkKSB7XG4gICAgICAgIGxldCBzY2FsZWRWZWN0b3IgPSBmc3V0aWwudW5wYWNrRmxvYXRzKHBhY2tlZFZlY3RvciwgdGhpcy5zZXR0aW5ncy52ZWN0b3JCaXRzLCB0aGlzLnNldHRpbmdzLnZlY3RvclNpemUpXG4gICAgICAgIHJldHVybiBzY2FsZWRWZWN0b3IubWFwKHggPT4geCAqIHZlY3RvclNjYWxlKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIGZpbmlzaCB3cml0aW5nIHRvIGEgdmVjdG9yIGxpYnJhcnlcbiAgYXN5bmMgc2F2ZSgpIHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5mcy53cml0ZUZpbGUoYCR7dGhpcy5jb25maWcucGF0aH0vc2V0dGluZ3MuanNvbmAsIGZzdXRpbC5lbmNvZGVVVEY4KEpTT04uc3RyaW5naWZ5KHRoaXMuc2V0dGluZ3MsIG51bGwsIDIpKSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvckxpYnJhcnkiLCIvLyBUaGlzIGlzIGEgc2ltcGxlIG9iamVjdCBmdWxsIG9mIHVzZWZ1bCB2ZWN0b3IgbWFuaXB1bGF0aW9uIGZ1bmN0aW9uc1xuY29uc3QgVlUgPSB7XG4gIC8vIGFkZCBhIGJ1bmNoIG9mIHZlY3RvcnMgdG9nZXRoZXJcbiAgYWRkOiAoLi4udmVjdG9ycyk9PiB2ZWN0b3JzLnJlZHVjZSgoYSxiKT0+IGEubWFwKChudW0sIGlkeCk9PiBudW0gKyBiW2lkeF0pKSxcblxuICAvLyBtdWx0aXBseSBhIGxpc3Qgb2YgdmVjdG9ycyB0b2dldGhlclxuICBtdWx0aXBseTogKGxpc3QsIG11bCk9PlxuICAgIGxpc3QubWFwKChsZWZ0KT0+IGxlZnQubWFwKChuLCBpKT0+IG4gKiBtdWxbaV0pKSxcblxuICAvLyBtZWFuIGF2ZXJhZ2UgdGhlIHZlY3RvcnMgdG9nZXRoZXJcbiAgbWVhbjogKC4uLmxpc3QpPT4gVlUubXVsdGlwbHkoW1ZVLmFkZCguLi5saXN0KV0sIFZVLmJ1aWxkKDEgLyBsaXN0Lmxlbmd0aCwgbGlzdFswXS5sZW5ndGgpKVswXSxcblxuICAvLyBidWlsZCBhIG5ldyB2ZWN0b3IsIGNvbnRhaW5pbmcgdmFsdWUgZm9yIGV2ZXJ5IGVudHJ5LCB3aXRoIHNpemUgbWFueSBkaW1lbnNpb25zXG4gIGJ1aWxkOiAodmFsdWUsIHNpemUpPT4ge1xuICAgIGxldCBmaW5hbCA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIGZpbmFsLnB1c2godmFsdWUpXG4gICAgcmV0dXJuIGZpbmFsXG4gIH0sXG5cbiAgLy8gY2FsY3VsYXRlIHNxdWFyZWQgRXVjbGlkZWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlY3RvcnMsIGFkYXB0ZWQgZnJvbSBob3cgdGVuc29yZmxvdy1qcyBkb2VzIGl0XG4gIGRpc3RhbmNlU3F1YXJlZDogKGEsIGIpPT4ge1xuICAgIGxldCByZXN1bHQgPSAwXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkaWZmID0gYVtpXSAtIGJbaV1cbiAgICAgIHJlc3VsdCArPSBkaWZmICogZGlmZlxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgLy8gY2FsY3VsYXRlIGhvdyBkaWZmZXJlbnQgdGhlIG1lYW5pbmcgb2YgdGhlIHdvcmRzIGluIHRoZSBsaXN0IGlzIGZyb20gdGhlIGF2ZXJhZ2Ugb2YgYWxsIG9mIHRoZW1cbiAgLy8gcmV0dXJucyBhbiBhcnJheSBvZiBkaXN0YW5jZXMgZnJvbSB0aGUgbWVhblxuICBkaXZlcnNpdHk6ICguLi52ZWN0b3JzKT0+IHtcbiAgICAvLyBza2lwIGlmIHRoZXJlIGFyZSAwIG9yIDEgdmVjdG9yc1xuICAgIGlmICh2ZWN0b3JzLmxlbmd0aCA8PSAxKSByZXR1cm4gWzBdXG4gICAgLy8gZmlyc3QgYXZlcmFnZSBhbGwgdGhlIHZlY3RvcnMgdG9nZXRoZXJcbiAgICBsZXQgbWVhblZlY3RvciA9IFZVLm1lYW4oLi4udmVjdG9ycylcbiAgICAvLyBjYWxjdWxhdGUgaG93IGZhciBmcm9tIHRoZSBjZW50ZXIgcG9pbnQgZWFjaCB2ZWN0b3IgaXNcbiAgICByZXR1cm4gdmVjdG9ycy5tYXAodiA9PiBWVS5kaXN0YW5jZVNxdWFyZWQodiwgbWVhblZlY3RvcikpXG4gIH0sXG59XG5cbmlmICh0eXBlb2YobW9kdWxlKSA9PSAnb2JqZWN0JylcbiAgbW9kdWxlLmV4cG9ydHMgPSBWVSIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxudmFyIGNvZGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgcmV2TG9va3VwW2NvZGUuY2hhckNvZGVBdChpKV0gPSBpXG59XG5cbi8vIFN1cHBvcnQgZGVjb2RpbmcgVVJMLXNhZmUgYmFzZTY0IHN0cmluZ3MsIGFzIE5vZGUuanMgZG9lcy5cbi8vIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0I1VSTF9hcHBsaWNhdGlvbnNcbnJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxucmV2TG9va3VwWydfJy5jaGFyQ29kZUF0KDApXSA9IDYzXG5cbmZ1bmN0aW9uIGdldExlbnMgKGI2NCkge1xuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXG4gIGlmIChsZW4gJSA0ID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG4gIH1cblxuICAvLyBUcmltIG9mZiBleHRyYSBieXRlcyBhZnRlciBwbGFjZWhvbGRlciBieXRlcyBhcmUgZm91bmRcbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYmVhdGdhbW1pdC9iYXNlNjQtanMvaXNzdWVzLzQyXG4gIHZhciB2YWxpZExlbiA9IGI2NC5pbmRleE9mKCc9JylcbiAgaWYgKHZhbGlkTGVuID09PSAtMSkgdmFsaWRMZW4gPSBsZW5cblxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gdmFsaWRMZW4gPT09IGxlblxuICAgID8gMFxuICAgIDogNCAtICh2YWxpZExlbiAlIDQpXG5cbiAgcmV0dXJuIFt2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuXVxufVxuXG4vLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKGI2NCkge1xuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiBfYnl0ZUxlbmd0aCAoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSB7XG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiB0b0J5dGVBcnJheSAoYjY0KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuXG4gIHZhciBhcnIgPSBuZXcgQXJyKF9ieXRlTGVuZ3RoKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikpXG5cbiAgdmFyIGN1ckJ5dGUgPSAwXG5cbiAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICB2YXIgbGVuID0gcGxhY2VIb2xkZXJzTGVuID4gMFxuICAgID8gdmFsaWRMZW4gLSA0XG4gICAgOiB2YWxpZExlblxuXG4gIHZhciBpXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxOCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfFxuICAgICAgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAzKV1cbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gMTYpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDIpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAxKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDEwKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID1cbiAgICAgICgodWludDhbaV0gPDwgMTYpICYgMHhGRjAwMDApICtcbiAgICAgICgodWludDhbaSArIDFdIDw8IDgpICYgMHhGRjAwKSArXG4gICAgICAodWludDhbaSArIDJdICYgMHhGRilcbiAgICBvdXRwdXQucHVzaCh0cmlwbGV0VG9CYXNlNjQodG1wKSlcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGZyb21CeXRlQXJyYXkgKHVpbnQ4KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbiA9IHVpbnQ4Lmxlbmd0aFxuICB2YXIgZXh0cmFCeXRlcyA9IGxlbiAlIDMgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayhcbiAgICAgIHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aClcbiAgICApKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXSArXG4gICAgICAnPT0nXG4gICAgKVxuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDEwXSArXG4gICAgICBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl0gK1xuICAgICAgJz0nXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCI7KGZ1bmN0aW9uIChnbG9iYWxPYmplY3QpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4vKlxyXG4gKiAgICAgIGJpZ251bWJlci5qcyB2OS4wLjBcclxuICogICAgICBBIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgYXJiaXRyYXJ5LXByZWNpc2lvbiBhcml0aG1ldGljLlxyXG4gKiAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWtlTWNsL2JpZ251bWJlci5qc1xyXG4gKiAgICAgIENvcHlyaWdodCAoYykgMjAxOSBNaWNoYWVsIE1jbGF1Z2hsaW4gPE04Y2g4OGxAZ21haWwuY29tPlxyXG4gKiAgICAgIE1JVCBMaWNlbnNlZC5cclxuICpcclxuICogICAgICBCaWdOdW1iZXIucHJvdG90eXBlIG1ldGhvZHMgICAgIHwgIEJpZ051bWJlciBtZXRob2RzXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgYWJzb2x1dGVWYWx1ZSAgICAgICAgICAgIGFicyAgICB8ICBjbG9uZVxyXG4gKiAgICAgIGNvbXBhcmVkVG8gICAgICAgICAgICAgICAgICAgICAgfCAgY29uZmlnICAgICAgICAgICAgICAgc2V0XHJcbiAqICAgICAgZGVjaW1hbFBsYWNlcyAgICAgICAgICAgIGRwICAgICB8ICAgICAgREVDSU1BTF9QTEFDRVNcclxuICogICAgICBkaXZpZGVkQnkgICAgICAgICAgICAgICAgZGl2ICAgIHwgICAgICBST1VORElOR19NT0RFXHJcbiAqICAgICAgZGl2aWRlZFRvSW50ZWdlckJ5ICAgICAgIGlkaXYgICB8ICAgICAgRVhQT05FTlRJQUxfQVRcclxuICogICAgICBleHBvbmVudGlhdGVkQnkgICAgICAgICAgcG93ICAgIHwgICAgICBSQU5HRVxyXG4gKiAgICAgIGludGVnZXJWYWx1ZSAgICAgICAgICAgICAgICAgICAgfCAgICAgIENSWVBUT1xyXG4gKiAgICAgIGlzRXF1YWxUbyAgICAgICAgICAgICAgICBlcSAgICAgfCAgICAgIE1PRFVMT19NT0RFXHJcbiAqICAgICAgaXNGaW5pdGUgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgUE9XX1BSRUNJU0lPTlxyXG4gKiAgICAgIGlzR3JlYXRlclRoYW4gICAgICAgICAgICBndCAgICAgfCAgICAgIEZPUk1BVFxyXG4gKiAgICAgIGlzR3JlYXRlclRoYW5PckVxdWFsVG8gICBndGUgICAgfCAgICAgIEFMUEhBQkVUXHJcbiAqICAgICAgaXNJbnRlZ2VyICAgICAgICAgICAgICAgICAgICAgICB8ICBpc0JpZ051bWJlclxyXG4gKiAgICAgIGlzTGVzc1RoYW4gICAgICAgICAgICAgICBsdCAgICAgfCAgbWF4aW11bSAgICAgICAgICAgICAgbWF4XHJcbiAqICAgICAgaXNMZXNzVGhhbk9yRXF1YWxUbyAgICAgIGx0ZSAgICB8ICBtaW5pbXVtICAgICAgICAgICAgICBtaW5cclxuICogICAgICBpc05hTiAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgIHJhbmRvbVxyXG4gKiAgICAgIGlzTmVnYXRpdmUgICAgICAgICAgICAgICAgICAgICAgfCAgc3VtXHJcbiAqICAgICAgaXNQb3NpdGl2ZSAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgaXNaZXJvICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgbWludXMgICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgbW9kdWxvICAgICAgICAgICAgICAgICAgIG1vZCAgICB8XHJcbiAqICAgICAgbXVsdGlwbGllZEJ5ICAgICAgICAgICAgIHRpbWVzICB8XHJcbiAqICAgICAgbmVnYXRlZCAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgcGx1cyAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgcHJlY2lzaW9uICAgICAgICAgICAgICAgIHNkICAgICB8XHJcbiAqICAgICAgc2hpZnRlZEJ5ICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgc3F1YXJlUm9vdCAgICAgICAgICAgICAgIHNxcnQgICB8XHJcbiAqICAgICAgdG9FeHBvbmVudGlhbCAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9GaXhlZCAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9Gb3JtYXQgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9GcmFjdGlvbiAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9KU09OICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9OdW1iZXIgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9QcmVjaXNpb24gICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9TdHJpbmcgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdmFsdWVPZiAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqXHJcbiAqL1xyXG5cclxuXHJcbiAgdmFyIEJpZ051bWJlcixcclxuICAgIGlzTnVtZXJpYyA9IC9eLT8oPzpcXGQrKD86XFwuXFxkKik/fFxcLlxcZCspKD86ZVsrLV0/XFxkKyk/JC9pLFxyXG4gICAgbWF0aGNlaWwgPSBNYXRoLmNlaWwsXHJcbiAgICBtYXRoZmxvb3IgPSBNYXRoLmZsb29yLFxyXG5cclxuICAgIGJpZ251bWJlckVycm9yID0gJ1tCaWdOdW1iZXIgRXJyb3JdICcsXHJcbiAgICB0b29NYW55RGlnaXRzID0gYmlnbnVtYmVyRXJyb3IgKyAnTnVtYmVyIHByaW1pdGl2ZSBoYXMgbW9yZSB0aGFuIDE1IHNpZ25pZmljYW50IGRpZ2l0czogJyxcclxuXHJcbiAgICBCQVNFID0gMWUxNCxcclxuICAgIExPR19CQVNFID0gMTQsXHJcbiAgICBNQVhfU0FGRV9JTlRFR0VSID0gMHgxZmZmZmZmZmZmZmZmZiwgICAgICAgICAvLyAyXjUzIC0gMVxyXG4gICAgLy8gTUFYX0lOVDMyID0gMHg3ZmZmZmZmZiwgICAgICAgICAgICAgICAgICAgLy8gMl4zMSAtIDFcclxuICAgIFBPV1NfVEVOID0gWzEsIDEwLCAxMDAsIDFlMywgMWU0LCAxZTUsIDFlNiwgMWU3LCAxZTgsIDFlOSwgMWUxMCwgMWUxMSwgMWUxMiwgMWUxM10sXHJcbiAgICBTUVJUX0JBU0UgPSAxZTcsXHJcblxyXG4gICAgLy8gRURJVEFCTEVcclxuICAgIC8vIFRoZSBsaW1pdCBvbiB0aGUgdmFsdWUgb2YgREVDSU1BTF9QTEFDRVMsIFRPX0VYUF9ORUcsIFRPX0VYUF9QT1MsIE1JTl9FWFAsIE1BWF9FWFAsIGFuZFxyXG4gICAgLy8gdGhlIGFyZ3VtZW50cyB0byB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkLCB0b0Zvcm1hdCwgYW5kIHRvUHJlY2lzaW9uLlxyXG4gICAgTUFYID0gMUU5OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhfSU5UMzJcclxuXHJcblxyXG4gIC8qXHJcbiAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBCaWdOdW1iZXIgY29uc3RydWN0b3IuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY2xvbmUoY29uZmlnT2JqZWN0KSB7XHJcbiAgICB2YXIgZGl2LCBjb252ZXJ0QmFzZSwgcGFyc2VOdW1lcmljLFxyXG4gICAgICBQID0gQmlnTnVtYmVyLnByb3RvdHlwZSA9IHsgY29uc3RydWN0b3I6IEJpZ051bWJlciwgdG9TdHJpbmc6IG51bGwsIHZhbHVlT2Y6IG51bGwgfSxcclxuICAgICAgT05FID0gbmV3IEJpZ051bWJlcigxKSxcclxuXHJcblxyXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEVESVRBQkxFIENPTkZJRyBERUZBVUxUUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cclxuICAgICAgLy8gVGhlIGRlZmF1bHQgdmFsdWVzIGJlbG93IG11c3QgYmUgaW50ZWdlcnMgd2l0aGluIHRoZSBpbmNsdXNpdmUgcmFuZ2VzIHN0YXRlZC5cclxuICAgICAgLy8gVGhlIHZhbHVlcyBjYW4gYWxzbyBiZSBjaGFuZ2VkIGF0IHJ1bi10aW1lIHVzaW5nIEJpZ051bWJlci5zZXQuXHJcblxyXG4gICAgICAvLyBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgZm9yIG9wZXJhdGlvbnMgaW52b2x2aW5nIGRpdmlzaW9uLlxyXG4gICAgICBERUNJTUFMX1BMQUNFUyA9IDIwLCAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAvLyBUaGUgcm91bmRpbmcgbW9kZSB1c2VkIHdoZW4gcm91bmRpbmcgdG8gdGhlIGFib3ZlIGRlY2ltYWwgcGxhY2VzLCBhbmQgd2hlbiB1c2luZ1xyXG4gICAgICAvLyB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkLCB0b0Zvcm1hdCBhbmQgdG9QcmVjaXNpb24sIGFuZCByb3VuZCAoZGVmYXVsdCB2YWx1ZSkuXHJcbiAgICAgIC8vIFVQICAgICAgICAgMCBBd2F5IGZyb20gemVyby5cclxuICAgICAgLy8gRE9XTiAgICAgICAxIFRvd2FyZHMgemVyby5cclxuICAgICAgLy8gQ0VJTCAgICAgICAyIFRvd2FyZHMgK0luZmluaXR5LlxyXG4gICAgICAvLyBGTE9PUiAgICAgIDMgVG93YXJkcyAtSW5maW5pdHkuXHJcbiAgICAgIC8vIEhBTEZfVVAgICAgNCBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdXAuXHJcbiAgICAgIC8vIEhBTEZfRE9XTiAgNSBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgZG93bi5cclxuICAgICAgLy8gSEFMRl9FVkVOICA2IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0b3dhcmRzIGV2ZW4gbmVpZ2hib3VyLlxyXG4gICAgICAvLyBIQUxGX0NFSUwgIDcgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgK0luZmluaXR5LlxyXG4gICAgICAvLyBIQUxGX0ZMT09SIDggVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgLUluZmluaXR5LlxyXG4gICAgICBST1VORElOR19NT0RFID0gNCwgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gOFxyXG5cclxuICAgICAgLy8gRVhQT05FTlRJQUxfQVQgOiBbVE9fRVhQX05FRyAsIFRPX0VYUF9QT1NdXHJcblxyXG4gICAgICAvLyBUaGUgZXhwb25lbnQgdmFsdWUgYXQgYW5kIGJlbmVhdGggd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgLy8gTnVtYmVyIHR5cGU6IC03XHJcbiAgICAgIFRPX0VYUF9ORUcgPSAtNywgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byAtTUFYXHJcblxyXG4gICAgICAvLyBUaGUgZXhwb25lbnQgdmFsdWUgYXQgYW5kIGFib3ZlIHdoaWNoIHRvU3RyaW5nIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgIC8vIE51bWJlciB0eXBlOiAyMVxyXG4gICAgICBUT19FWFBfUE9TID0gMjEsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAvLyBSQU5HRSA6IFtNSU5fRVhQLCBNQVhfRVhQXVxyXG5cclxuICAgICAgLy8gVGhlIG1pbmltdW0gZXhwb25lbnQgdmFsdWUsIGJlbmVhdGggd2hpY2ggdW5kZXJmbG93IHRvIHplcm8gb2NjdXJzLlxyXG4gICAgICAvLyBOdW1iZXIgdHlwZTogLTMyNCAgKDVlLTMyNClcclxuICAgICAgTUlOX0VYUCA9IC0xZTcsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAtMSB0byAtTUFYXHJcblxyXG4gICAgICAvLyBUaGUgbWF4aW11bSBleHBvbmVudCB2YWx1ZSwgYWJvdmUgd2hpY2ggb3ZlcmZsb3cgdG8gSW5maW5pdHkgb2NjdXJzLlxyXG4gICAgICAvLyBOdW1iZXIgdHlwZTogIDMwOCAgKDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4KVxyXG4gICAgICAvLyBGb3IgTUFYX0VYUCA+IDFlNywgZS5nLiBuZXcgQmlnTnVtYmVyKCcxZTEwMDAwMDAwMCcpLnBsdXMoMSkgbWF5IGJlIHNsb3cuXHJcbiAgICAgIE1BWF9FWFAgPSAxZTcsICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMSB0byBNQVhcclxuXHJcbiAgICAgIC8vIFdoZXRoZXIgdG8gdXNlIGNyeXB0b2dyYXBoaWNhbGx5LXNlY3VyZSByYW5kb20gbnVtYmVyIGdlbmVyYXRpb24sIGlmIGF2YWlsYWJsZS5cclxuICAgICAgQ1JZUFRPID0gZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0cnVlIG9yIGZhbHNlXHJcblxyXG4gICAgICAvLyBUaGUgbW9kdWxvIG1vZGUgdXNlZCB3aGVuIGNhbGN1bGF0aW5nIHRoZSBtb2R1bHVzOiBhIG1vZCBuLlxyXG4gICAgICAvLyBUaGUgcXVvdGllbnQgKHEgPSBhIC8gbikgaXMgY2FsY3VsYXRlZCBhY2NvcmRpbmcgdG8gdGhlIGNvcnJlc3BvbmRpbmcgcm91bmRpbmcgbW9kZS5cclxuICAgICAgLy8gVGhlIHJlbWFpbmRlciAocikgaXMgY2FsY3VsYXRlZCBhczogciA9IGEgLSBuICogcS5cclxuICAgICAgLy9cclxuICAgICAgLy8gVVAgICAgICAgIDAgVGhlIHJlbWFpbmRlciBpcyBwb3NpdGl2ZSBpZiB0aGUgZGl2aWRlbmQgaXMgbmVnYXRpdmUsIGVsc2UgaXMgbmVnYXRpdmUuXHJcbiAgICAgIC8vIERPV04gICAgICAxIFRoZSByZW1haW5kZXIgaGFzIHRoZSBzYW1lIHNpZ24gYXMgdGhlIGRpdmlkZW5kLlxyXG4gICAgICAvLyAgICAgICAgICAgICBUaGlzIG1vZHVsbyBtb2RlIGlzIGNvbW1vbmx5IGtub3duIGFzICd0cnVuY2F0ZWQgZGl2aXNpb24nIGFuZCBpc1xyXG4gICAgICAvLyAgICAgICAgICAgICBlcXVpdmFsZW50IHRvIChhICUgbikgaW4gSmF2YVNjcmlwdC5cclxuICAgICAgLy8gRkxPT1IgICAgIDMgVGhlIHJlbWFpbmRlciBoYXMgdGhlIHNhbWUgc2lnbiBhcyB0aGUgZGl2aXNvciAoUHl0aG9uICUpLlxyXG4gICAgICAvLyBIQUxGX0VWRU4gNiBUaGlzIG1vZHVsbyBtb2RlIGltcGxlbWVudHMgdGhlIElFRUUgNzU0IHJlbWFpbmRlciBmdW5jdGlvbi5cclxuICAgICAgLy8gRVVDTElEICAgIDkgRXVjbGlkaWFuIGRpdmlzaW9uLiBxID0gc2lnbihuKSAqIGZsb29yKGEgLyBhYnMobikpLlxyXG4gICAgICAvLyAgICAgICAgICAgICBUaGUgcmVtYWluZGVyIGlzIGFsd2F5cyBwb3NpdGl2ZS5cclxuICAgICAgLy9cclxuICAgICAgLy8gVGhlIHRydW5jYXRlZCBkaXZpc2lvbiwgZmxvb3JlZCBkaXZpc2lvbiwgRXVjbGlkaWFuIGRpdmlzaW9uIGFuZCBJRUVFIDc1NCByZW1haW5kZXJcclxuICAgICAgLy8gbW9kZXMgYXJlIGNvbW1vbmx5IHVzZWQgZm9yIHRoZSBtb2R1bHVzIG9wZXJhdGlvbi5cclxuICAgICAgLy8gQWx0aG91Z2ggdGhlIG90aGVyIHJvdW5kaW5nIG1vZGVzIGNhbiBhbHNvIGJlIHVzZWQsIHRoZXkgbWF5IG5vdCBnaXZlIHVzZWZ1bCByZXN1bHRzLlxyXG4gICAgICBNT0RVTE9fTU9ERSA9IDEsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gOVxyXG5cclxuICAgICAgLy8gVGhlIG1heGltdW0gbnVtYmVyIG9mIHNpZ25pZmljYW50IGRpZ2l0cyBvZiB0aGUgcmVzdWx0IG9mIHRoZSBleHBvbmVudGlhdGVkQnkgb3BlcmF0aW9uLlxyXG4gICAgICAvLyBJZiBQT1dfUFJFQ0lTSU9OIGlzIDAsIHRoZXJlIHdpbGwgYmUgdW5saW1pdGVkIHNpZ25pZmljYW50IGRpZ2l0cy5cclxuICAgICAgUE9XX1BSRUNJU0lPTiA9IDAsICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWFxyXG5cclxuICAgICAgLy8gVGhlIGZvcm1hdCBzcGVjaWZpY2F0aW9uIHVzZWQgYnkgdGhlIEJpZ051bWJlci5wcm90b3R5cGUudG9Gb3JtYXQgbWV0aG9kLlxyXG4gICAgICBGT1JNQVQgPSB7XHJcbiAgICAgICAgcHJlZml4OiAnJyxcclxuICAgICAgICBncm91cFNpemU6IDMsXHJcbiAgICAgICAgc2Vjb25kYXJ5R3JvdXBTaXplOiAwLFxyXG4gICAgICAgIGdyb3VwU2VwYXJhdG9yOiAnLCcsXHJcbiAgICAgICAgZGVjaW1hbFNlcGFyYXRvcjogJy4nLFxyXG4gICAgICAgIGZyYWN0aW9uR3JvdXBTaXplOiAwLFxyXG4gICAgICAgIGZyYWN0aW9uR3JvdXBTZXBhcmF0b3I6ICdcXHhBMCcsICAgICAgLy8gbm9uLWJyZWFraW5nIHNwYWNlXHJcbiAgICAgICAgc3VmZml4OiAnJ1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gVGhlIGFscGhhYmV0IHVzZWQgZm9yIGJhc2UgY29udmVyc2lvbi4gSXQgbXVzdCBiZSBhdCBsZWFzdCAyIGNoYXJhY3RlcnMgbG9uZywgd2l0aCBubyAnKycsXHJcbiAgICAgIC8vICctJywgJy4nLCB3aGl0ZXNwYWNlLCBvciByZXBlYXRlZCBjaGFyYWN0ZXIuXHJcbiAgICAgIC8vICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWiRfJ1xyXG4gICAgICBBTFBIQUJFVCA9ICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonO1xyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbiAgICAvLyBDT05TVFJVQ1RPUlxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIEJpZ051bWJlciBjb25zdHJ1Y3RvciBhbmQgZXhwb3J0ZWQgZnVuY3Rpb24uXHJcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIG5ldyBpbnN0YW5jZSBvZiBhIEJpZ051bWJlciBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogdiB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgICAqIFtiXSB7bnVtYmVyfSBUaGUgYmFzZSBvZiB2LiBJbnRlZ2VyLCAyIHRvIEFMUEhBQkVULmxlbmd0aCBpbmNsdXNpdmUuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIEJpZ051bWJlcih2LCBiKSB7XHJcbiAgICAgIHZhciBhbHBoYWJldCwgYywgY2FzZUNoYW5nZWQsIGUsIGksIGlzTnVtLCBsZW4sIHN0cixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIC8vIEVuYWJsZSBjb25zdHJ1Y3RvciBjYWxsIHdpdGhvdXQgYG5ld2AuXHJcbiAgICAgIGlmICghKHggaW5zdGFuY2VvZiBCaWdOdW1iZXIpKSByZXR1cm4gbmV3IEJpZ051bWJlcih2LCBiKTtcclxuXHJcbiAgICAgIGlmIChiID09IG51bGwpIHtcclxuXHJcbiAgICAgICAgaWYgKHYgJiYgdi5faXNCaWdOdW1iZXIgPT09IHRydWUpIHtcclxuICAgICAgICAgIHgucyA9IHYucztcclxuXHJcbiAgICAgICAgICBpZiAoIXYuYyB8fCB2LmUgPiBNQVhfRVhQKSB7XHJcbiAgICAgICAgICAgIHguYyA9IHguZSA9IG51bGw7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHYuZSA8IE1JTl9FWFApIHtcclxuICAgICAgICAgICAgeC5jID0gW3guZSA9IDBdO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgeC5lID0gdi5lO1xyXG4gICAgICAgICAgICB4LmMgPSB2LmMuc2xpY2UoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoKGlzTnVtID0gdHlwZW9mIHYgPT0gJ251bWJlcicpICYmIHYgKiAwID09IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBVc2UgYDEgLyBuYCB0byBoYW5kbGUgbWludXMgemVybyBhbHNvLlxyXG4gICAgICAgICAgeC5zID0gMSAvIHYgPCAwID8gKHYgPSAtdiwgLTEpIDogMTtcclxuXHJcbiAgICAgICAgICAvLyBGYXN0IHBhdGggZm9yIGludGVnZXJzLCB3aGVyZSBuIDwgMjE0NzQ4MzY0OCAoMioqMzEpLlxyXG4gICAgICAgICAgaWYgKHYgPT09IH5+dikge1xyXG4gICAgICAgICAgICBmb3IgKGUgPSAwLCBpID0gdjsgaSA+PSAxMDsgaSAvPSAxMCwgZSsrKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChlID4gTUFYX0VYUCkge1xyXG4gICAgICAgICAgICAgIHguYyA9IHguZSA9IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgeC5lID0gZTtcclxuICAgICAgICAgICAgICB4LmMgPSBbdl07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBzdHIgPSBTdHJpbmcodik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBpZiAoIWlzTnVtZXJpYy50ZXN0KHN0ciA9IFN0cmluZyh2KSkpIHJldHVybiBwYXJzZU51bWVyaWMoeCwgc3RyLCBpc051bSk7XHJcblxyXG4gICAgICAgICAgeC5zID0gc3RyLmNoYXJDb2RlQXQoMCkgPT0gNDUgPyAoc3RyID0gc3RyLnNsaWNlKDEpLCAtMSkgOiAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGVjaW1hbCBwb2ludD9cclxuICAgICAgICBpZiAoKGUgPSBzdHIuaW5kZXhPZignLicpKSA+IC0xKSBzdHIgPSBzdHIucmVwbGFjZSgnLicsICcnKTtcclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnRpYWwgZm9ybT9cclxuICAgICAgICBpZiAoKGkgPSBzdHIuc2VhcmNoKC9lL2kpKSA+IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBEZXRlcm1pbmUgZXhwb25lbnQuXHJcbiAgICAgICAgICBpZiAoZSA8IDApIGUgPSBpO1xyXG4gICAgICAgICAgZSArPSArc3RyLnNsaWNlKGkgKyAxKTtcclxuICAgICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgaSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlIDwgMCkge1xyXG5cclxuICAgICAgICAgIC8vIEludGVnZXIuXHJcbiAgICAgICAgICBlID0gc3RyLmxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQmFzZSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7Yn0nXHJcbiAgICAgICAgaW50Q2hlY2soYiwgMiwgQUxQSEFCRVQubGVuZ3RoLCAnQmFzZScpO1xyXG5cclxuICAgICAgICAvLyBBbGxvdyBleHBvbmVudGlhbCBub3RhdGlvbiB0byBiZSB1c2VkIHdpdGggYmFzZSAxMCBhcmd1bWVudCwgd2hpbGVcclxuICAgICAgICAvLyBhbHNvIHJvdW5kaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFzIHdpdGggb3RoZXIgYmFzZXMuXHJcbiAgICAgICAgaWYgKGIgPT0gMTApIHtcclxuICAgICAgICAgIHggPSBuZXcgQmlnTnVtYmVyKHYpO1xyXG4gICAgICAgICAgcmV0dXJuIHJvdW5kKHgsIERFQ0lNQUxfUExBQ0VTICsgeC5lICsgMSwgUk9VTkRJTkdfTU9ERSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdHIgPSBTdHJpbmcodik7XHJcblxyXG4gICAgICAgIGlmIChpc051bSA9IHR5cGVvZiB2ID09ICdudW1iZXInKSB7XHJcblxyXG4gICAgICAgICAgLy8gQXZvaWQgcG90ZW50aWFsIGludGVycHJldGF0aW9uIG9mIEluZmluaXR5IGFuZCBOYU4gYXMgYmFzZSA0NCsgdmFsdWVzLlxyXG4gICAgICAgICAgaWYgKHYgKiAwICE9IDApIHJldHVybiBwYXJzZU51bWVyaWMoeCwgc3RyLCBpc051bSwgYik7XHJcblxyXG4gICAgICAgICAgeC5zID0gMSAvIHYgPCAwID8gKHN0ciA9IHN0ci5zbGljZSgxKSwgLTEpIDogMTtcclxuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gTnVtYmVyIHByaW1pdGl2ZSBoYXMgbW9yZSB0aGFuIDE1IHNpZ25pZmljYW50IGRpZ2l0czoge259J1xyXG4gICAgICAgICAgaWYgKEJpZ051bWJlci5ERUJVRyAmJiBzdHIucmVwbGFjZSgvXjBcXC4wKnxcXC4vLCAnJykubGVuZ3RoID4gMTUpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgICh0b29NYW55RGlnaXRzICsgdik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHgucyA9IHN0ci5jaGFyQ29kZUF0KDApID09PSA0NSA/IChzdHIgPSBzdHIuc2xpY2UoMSksIC0xKSA6IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhbHBoYWJldCA9IEFMUEhBQkVULnNsaWNlKDAsIGIpO1xyXG4gICAgICAgIGUgPSBpID0gMDtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgdGhhdCBzdHIgaXMgYSB2YWxpZCBiYXNlIGIgbnVtYmVyLlxyXG4gICAgICAgIC8vIERvbid0IHVzZSBSZWdFeHAsIHNvIGFscGhhYmV0IGNhbiBjb250YWluIHNwZWNpYWwgY2hhcmFjdGVycy5cclxuICAgICAgICBmb3IgKGxlbiA9IHN0ci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgaWYgKGFscGhhYmV0LmluZGV4T2YoYyA9IHN0ci5jaGFyQXQoaSkpIDwgMCkge1xyXG4gICAgICAgICAgICBpZiAoYyA9PSAnLicpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgJy4nIGlzIG5vdCB0aGUgZmlyc3QgY2hhcmFjdGVyIGFuZCBpdCBoYXMgbm90IGJlIGZvdW5kIGJlZm9yZS5cclxuICAgICAgICAgICAgICBpZiAoaSA+IGUpIHtcclxuICAgICAgICAgICAgICAgIGUgPSBsZW47XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWNhc2VDaGFuZ2VkKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEFsbG93IGUuZy4gaGV4YWRlY2ltYWwgJ0ZGJyBhcyB3ZWxsIGFzICdmZicuXHJcbiAgICAgICAgICAgICAgaWYgKHN0ciA9PSBzdHIudG9VcHBlckNhc2UoKSAmJiAoc3RyID0gc3RyLnRvTG93ZXJDYXNlKCkpIHx8XHJcbiAgICAgICAgICAgICAgICAgIHN0ciA9PSBzdHIudG9Mb3dlckNhc2UoKSAmJiAoc3RyID0gc3RyLnRvVXBwZXJDYXNlKCkpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlQ2hhbmdlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpID0gLTE7XHJcbiAgICAgICAgICAgICAgICBlID0gMDtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlTnVtZXJpYyh4LCBTdHJpbmcodiksIGlzTnVtLCBiKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFByZXZlbnQgbGF0ZXIgY2hlY2sgZm9yIGxlbmd0aCBvbiBjb252ZXJ0ZWQgbnVtYmVyLlxyXG4gICAgICAgIGlzTnVtID0gZmFsc2U7XHJcbiAgICAgICAgc3RyID0gY29udmVydEJhc2Uoc3RyLCBiLCAxMCwgeC5zKTtcclxuXHJcbiAgICAgICAgLy8gRGVjaW1hbCBwb2ludD9cclxuICAgICAgICBpZiAoKGUgPSBzdHIuaW5kZXhPZignLicpKSA+IC0xKSBzdHIgPSBzdHIucmVwbGFjZSgnLicsICcnKTtcclxuICAgICAgICBlbHNlIGUgPSBzdHIubGVuZ3RoO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmUgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgZm9yIChpID0gMDsgc3RyLmNoYXJDb2RlQXQoaSkgPT09IDQ4OyBpKyspO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKGxlbiA9IHN0ci5sZW5ndGg7IHN0ci5jaGFyQ29kZUF0KC0tbGVuKSA9PT0gNDg7KTtcclxuXHJcbiAgICAgIGlmIChzdHIgPSBzdHIuc2xpY2UoaSwgKytsZW4pKSB7XHJcbiAgICAgICAgbGVuIC09IGk7XHJcblxyXG4gICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOdW1iZXIgcHJpbWl0aXZlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzOiB7bn0nXHJcbiAgICAgICAgaWYgKGlzTnVtICYmIEJpZ051bWJlci5ERUJVRyAmJlxyXG4gICAgICAgICAgbGVuID4gMTUgJiYgKHYgPiBNQVhfU0FGRV9JTlRFR0VSIHx8IHYgIT09IG1hdGhmbG9vcih2KSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgICh0b29NYW55RGlnaXRzICsgKHgucyAqIHYpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICAvLyBPdmVyZmxvdz9cclxuICAgICAgICBpZiAoKGUgPSBlIC0gaSAtIDEpID4gTUFYX0VYUCkge1xyXG5cclxuICAgICAgICAgIC8vIEluZmluaXR5LlxyXG4gICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gVW5kZXJmbG93P1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZSA8IE1JTl9FWFApIHtcclxuXHJcbiAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgeC5jID0gW3guZSA9IDBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4LmUgPSBlO1xyXG4gICAgICAgICAgeC5jID0gW107XHJcblxyXG4gICAgICAgICAgLy8gVHJhbnNmb3JtIGJhc2VcclxuXHJcbiAgICAgICAgICAvLyBlIGlzIHRoZSBiYXNlIDEwIGV4cG9uZW50LlxyXG4gICAgICAgICAgLy8gaSBpcyB3aGVyZSB0byBzbGljZSBzdHIgdG8gZ2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBjb2VmZmljaWVudCBhcnJheS5cclxuICAgICAgICAgIGkgPSAoZSArIDEpICUgTE9HX0JBU0U7XHJcbiAgICAgICAgICBpZiAoZSA8IDApIGkgKz0gTE9HX0JBU0U7ICAvLyBpIDwgMVxyXG5cclxuICAgICAgICAgIGlmIChpIDwgbGVuKSB7XHJcbiAgICAgICAgICAgIGlmIChpKSB4LmMucHVzaCgrc3RyLnNsaWNlKDAsIGkpKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGVuIC09IExPR19CQVNFOyBpIDwgbGVuOykge1xyXG4gICAgICAgICAgICAgIHguYy5wdXNoKCtzdHIuc2xpY2UoaSwgaSArPSBMT0dfQkFTRSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpID0gTE9HX0JBU0UgLSAoc3RyID0gc3RyLnNsaWNlKGkpKS5sZW5ndGg7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpIC09IGxlbjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBmb3IgKDsgaS0tOyBzdHIgKz0gJzAnKTtcclxuICAgICAgICAgIHguYy5wdXNoKCtzdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gWmVyby5cclxuICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gQ09OU1RSVUNUT1IgUFJPUEVSVElFU1xyXG5cclxuXHJcbiAgICBCaWdOdW1iZXIuY2xvbmUgPSBjbG9uZTtcclxuXHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfVVAgPSAwO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0RPV04gPSAxO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0NFSUwgPSAyO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0ZMT09SID0gMztcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX1VQID0gNDtcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX0RPV04gPSA1O1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRVZFTiA9IDY7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9DRUlMID0gNztcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX0ZMT09SID0gODtcclxuICAgIEJpZ051bWJlci5FVUNMSUQgPSA5O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogQ29uZmlndXJlIGluZnJlcXVlbnRseS1jaGFuZ2luZyBsaWJyYXJ5LXdpZGUgc2V0dGluZ3MuXHJcbiAgICAgKlxyXG4gICAgICogQWNjZXB0IGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgb3B0aW9uYWwgcHJvcGVydGllcyAoaWYgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaXNcclxuICAgICAqIGEgbnVtYmVyLCBpdCBtdXN0IGJlIGFuIGludGVnZXIgd2l0aGluIHRoZSBpbmNsdXNpdmUgcmFuZ2Ugc3RhdGVkKTpcclxuICAgICAqXHJcbiAgICAgKiAgIERFQ0lNQUxfUExBQ0VTICAge251bWJlcn0gICAgICAgICAgIDAgdG8gTUFYXHJcbiAgICAgKiAgIFJPVU5ESU5HX01PREUgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gOFxyXG4gICAgICogICBFWFBPTkVOVElBTF9BVCAgIHtudW1iZXJ8bnVtYmVyW119ICAtTUFYIHRvIE1BWCAgb3IgIFstTUFYIHRvIDAsIDAgdG8gTUFYXVxyXG4gICAgICogICBSQU5HRSAgICAgICAgICAgIHtudW1iZXJ8bnVtYmVyW119ICAtTUFYIHRvIE1BWCAobm90IHplcm8pICBvciAgWy1NQVggdG8gLTEsIDEgdG8gTUFYXVxyXG4gICAgICogICBDUllQVE8gICAgICAgICAgIHtib29sZWFufSAgICAgICAgICB0cnVlIG9yIGZhbHNlXHJcbiAgICAgKiAgIE1PRFVMT19NT0RFICAgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gOVxyXG4gICAgICogICBQT1dfUFJFQ0lTSU9OICAgICAgIHtudW1iZXJ9ICAgICAgICAgICAwIHRvIE1BWFxyXG4gICAgICogICBBTFBIQUJFVCAgICAgICAgIHtzdHJpbmd9ICAgICAgICAgICBBIHN0cmluZyBvZiB0d28gb3IgbW9yZSB1bmlxdWUgY2hhcmFjdGVycyB3aGljaCBkb2VzXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdCBjb250YWluICcuJy5cclxuICAgICAqICAgRk9STUFUICAgICAgICAgICB7b2JqZWN0fSAgICAgICAgICAgQW4gb2JqZWN0IHdpdGggc29tZSBvZiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XHJcbiAgICAgKiAgICAgcHJlZml4ICAgICAgICAgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICogICAgIGdyb3VwU2l6ZSAgICAgICAgICAgICAge251bWJlcn1cclxuICAgICAqICAgICBzZWNvbmRhcnlHcm91cFNpemUgICAgIHtudW1iZXJ9XHJcbiAgICAgKiAgICAgZ3JvdXBTZXBhcmF0b3IgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICogICAgIGRlY2ltYWxTZXBhcmF0b3IgICAgICAge3N0cmluZ31cclxuICAgICAqICAgICBmcmFjdGlvbkdyb3VwU2l6ZSAgICAgIHtudW1iZXJ9XHJcbiAgICAgKiAgICAgZnJhY3Rpb25Hcm91cFNlcGFyYXRvciB7c3RyaW5nfVxyXG4gICAgICogICAgIHN1ZmZpeCAgICAgICAgICAgICAgICAge3N0cmluZ31cclxuICAgICAqXHJcbiAgICAgKiAoVGhlIHZhbHVlcyBhc3NpZ25lZCB0byB0aGUgYWJvdmUgRk9STUFUIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3QgY2hlY2tlZCBmb3IgdmFsaWRpdHkuKVxyXG4gICAgICpcclxuICAgICAqIEUuZy5cclxuICAgICAqIEJpZ051bWJlci5jb25maWcoeyBERUNJTUFMX1BMQUNFUyA6IDIwLCBST1VORElOR19NT0RFIDogNCB9KVxyXG4gICAgICpcclxuICAgICAqIElnbm9yZSBwcm9wZXJ0aWVzL3BhcmFtZXRlcnMgc2V0IHRvIG51bGwgb3IgdW5kZWZpbmVkLCBleGNlcHQgZm9yIEFMUEhBQkVULlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBjdXJyZW50IHZhbHVlcy5cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLmNvbmZpZyA9IEJpZ051bWJlci5zZXQgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgIHZhciBwLCB2O1xyXG5cclxuICAgICAgaWYgKG9iaiAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09ICdvYmplY3QnKSB7XHJcblxyXG4gICAgICAgICAgLy8gREVDSU1BTF9QTEFDRVMge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIERFQ0lNQUxfUExBQ0VTIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdERUNJTUFMX1BMQUNFUycpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgIERFQ0lNQUxfUExBQ0VTID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBST1VORElOR19NT0RFIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gUk9VTkRJTkdfTU9ERSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnUk9VTkRJTkdfTU9ERScpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIDgsIHApO1xyXG4gICAgICAgICAgICBST1VORElOR19NT0RFID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBFWFBPTkVOVElBTF9BVCB7bnVtYmVyfG51bWJlcltdfVxyXG4gICAgICAgICAgLy8gSW50ZWdlciwgLU1BWCB0byBNQVggaW5jbHVzaXZlIG9yXHJcbiAgICAgICAgICAvLyBbaW50ZWdlciAtTUFYIHRvIDAgaW5jbHVzaXZlLCAwIHRvIE1BWCBpbmNsdXNpdmVdLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIEVYUE9ORU5USUFMX0FUIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdFWFBPTkVOVElBTF9BVCcpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGlmICh2ICYmIHYucG9wKSB7XHJcbiAgICAgICAgICAgICAgaW50Q2hlY2sodlswXSwgLU1BWCwgMCwgcCk7XHJcbiAgICAgICAgICAgICAgaW50Q2hlY2sodlsxXSwgMCwgTUFYLCBwKTtcclxuICAgICAgICAgICAgICBUT19FWFBfTkVHID0gdlswXTtcclxuICAgICAgICAgICAgICBUT19FWFBfUE9TID0gdlsxXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2LCAtTUFYLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIFRPX0VYUF9ORUcgPSAtKFRPX0VYUF9QT1MgPSB2IDwgMCA/IC12IDogdik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSQU5HRSB7bnVtYmVyfG51bWJlcltdfSBOb24temVybyBpbnRlZ2VyLCAtTUFYIHRvIE1BWCBpbmNsdXNpdmUgb3JcclxuICAgICAgICAgIC8vIFtpbnRlZ2VyIC1NQVggdG8gLTEgaW5jbHVzaXZlLCBpbnRlZ2VyIDEgdG8gTUFYIGluY2x1c2l2ZV0uXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gUkFOR0Uge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfGNhbm5vdCBiZSB6ZXJvfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ1JBTkdFJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaWYgKHYgJiYgdi5wb3ApIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzBdLCAtTUFYLCAtMSwgcCk7XHJcbiAgICAgICAgICAgICAgaW50Q2hlY2sodlsxXSwgMSwgTUFYLCBwKTtcclxuICAgICAgICAgICAgICBNSU5fRVhQID0gdlswXTtcclxuICAgICAgICAgICAgICBNQVhfRVhQID0gdlsxXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2LCAtTUFYLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIGlmICh2KSB7XHJcbiAgICAgICAgICAgICAgICBNSU5fRVhQID0gLShNQVhfRVhQID0gdiA8IDAgPyAtdiA6IHYpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArIHAgKyAnIGNhbm5vdCBiZSB6ZXJvOiAnICsgdik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ1JZUFRPIHtib29sZWFufSB0cnVlIG9yIGZhbHNlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIENSWVBUTyBub3QgdHJ1ZSBvciBmYWxzZToge3Z9J1xyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIGNyeXB0byB1bmF2YWlsYWJsZSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdDUllQVE8nKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpZiAodiA9PT0gISF2KSB7XHJcbiAgICAgICAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY3J5cHRvICE9ICd1bmRlZmluZWQnICYmIGNyeXB0byAmJlxyXG4gICAgICAgICAgICAgICAgIChjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzIHx8IGNyeXB0by5yYW5kb21CeXRlcykpIHtcclxuICAgICAgICAgICAgICAgICAgQ1JZUFRPID0gdjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIENSWVBUTyA9ICF2O1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ2NyeXB0byB1bmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBDUllQVE8gPSB2O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyBwICsgJyBub3QgdHJ1ZSBvciBmYWxzZTogJyArIHYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gTU9EVUxPX01PREUge251bWJlcn0gSW50ZWdlciwgMCB0byA5IGluY2x1c2l2ZS5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBNT0RVTE9fTU9ERSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnTU9EVUxPX01PREUnKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpbnRDaGVjayh2LCAwLCA5LCBwKTtcclxuICAgICAgICAgICAgTU9EVUxPX01PREUgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFBPV19QUkVDSVNJT04ge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIFBPV19QUkVDSVNJT04ge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ1BPV19QUkVDSVNJT04nKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpbnRDaGVjayh2LCAwLCBNQVgsIHApO1xyXG4gICAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBGT1JNQVQge29iamVjdH1cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBGT1JNQVQgbm90IGFuIG9iamVjdDoge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0ZPUk1BVCcpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgRk9STUFUID0gdjtcclxuICAgICAgICAgICAgZWxzZSB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgcCArICcgbm90IGFuIG9iamVjdDogJyArIHYpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEFMUEhBQkVUIHtzdHJpbmd9XHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQUxQSEFCRVQgaW52YWxpZDoge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0FMUEhBQkVUJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuXHJcbiAgICAgICAgICAgIC8vIERpc2FsbG93IGlmIG9ubHkgb25lIGNoYXJhY3RlcixcclxuICAgICAgICAgICAgLy8gb3IgaWYgaXQgY29udGFpbnMgJysnLCAnLScsICcuJywgd2hpdGVzcGFjZSwgb3IgYSByZXBlYXRlZCBjaGFyYWN0ZXIuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdiA9PSAnc3RyaW5nJyAmJiAhL14uJHxbKy0uXFxzXXwoLikuKlxcMS8udGVzdCh2KSkge1xyXG4gICAgICAgICAgICAgIEFMUEhBQkVUID0gdjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyBwICsgJyBpbnZhbGlkOiAnICsgdik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gT2JqZWN0IGV4cGVjdGVkOiB7dn0nXHJcbiAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdPYmplY3QgZXhwZWN0ZWQ6ICcgKyBvYmopO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBERUNJTUFMX1BMQUNFUzogREVDSU1BTF9QTEFDRVMsXHJcbiAgICAgICAgUk9VTkRJTkdfTU9ERTogUk9VTkRJTkdfTU9ERSxcclxuICAgICAgICBFWFBPTkVOVElBTF9BVDogW1RPX0VYUF9ORUcsIFRPX0VYUF9QT1NdLFxyXG4gICAgICAgIFJBTkdFOiBbTUlOX0VYUCwgTUFYX0VYUF0sXHJcbiAgICAgICAgQ1JZUFRPOiBDUllQVE8sXHJcbiAgICAgICAgTU9EVUxPX01PREU6IE1PRFVMT19NT0RFLFxyXG4gICAgICAgIFBPV19QUkVDSVNJT046IFBPV19QUkVDSVNJT04sXHJcbiAgICAgICAgRk9STUFUOiBGT1JNQVQsXHJcbiAgICAgICAgQUxQSEFCRVQ6IEFMUEhBQkVUXHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdiBpcyBhIEJpZ051bWJlciBpbnN0YW5jZSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqXHJcbiAgICAgKiBJZiBCaWdOdW1iZXIuREVCVUcgaXMgdHJ1ZSwgdGhyb3cgaWYgYSBCaWdOdW1iZXIgaW5zdGFuY2UgaXMgbm90IHdlbGwtZm9ybWVkLlxyXG4gICAgICpcclxuICAgICAqIHYge2FueX1cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gSW52YWxpZCBCaWdOdW1iZXI6IHt2fSdcclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLmlzQmlnTnVtYmVyID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgaWYgKCF2IHx8IHYuX2lzQmlnTnVtYmVyICE9PSB0cnVlKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgIGlmICghQmlnTnVtYmVyLkRFQlVHKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgIHZhciBpLCBuLFxyXG4gICAgICAgIGMgPSB2LmMsXHJcbiAgICAgICAgZSA9IHYuZSxcclxuICAgICAgICBzID0gdi5zO1xyXG5cclxuICAgICAgb3V0OiBpZiAoe30udG9TdHJpbmcuY2FsbChjKSA9PSAnW29iamVjdCBBcnJheV0nKSB7XHJcblxyXG4gICAgICAgIGlmICgocyA9PT0gMSB8fCBzID09PSAtMSkgJiYgZSA+PSAtTUFYICYmIGUgPD0gTUFYICYmIGUgPT09IG1hdGhmbG9vcihlKSkge1xyXG5cclxuICAgICAgICAgIC8vIElmIHRoZSBmaXJzdCBlbGVtZW50IGlzIHplcm8sIHRoZSBCaWdOdW1iZXIgdmFsdWUgbXVzdCBiZSB6ZXJvLlxyXG4gICAgICAgICAgaWYgKGNbMF0gPT09IDApIHtcclxuICAgICAgICAgICAgaWYgKGUgPT09IDAgJiYgYy5sZW5ndGggPT09IDEpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICBicmVhayBvdXQ7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIG51bWJlciBvZiBkaWdpdHMgdGhhdCBjWzBdIHNob3VsZCBoYXZlLCBiYXNlZCBvbiB0aGUgZXhwb25lbnQuXHJcbiAgICAgICAgICBpID0gKGUgKyAxKSAlIExPR19CQVNFO1xyXG4gICAgICAgICAgaWYgKGkgPCAxKSBpICs9IExPR19CQVNFO1xyXG5cclxuICAgICAgICAgIC8vIENhbGN1bGF0ZSBudW1iZXIgb2YgZGlnaXRzIG9mIGNbMF0uXHJcbiAgICAgICAgICAvL2lmIChNYXRoLmNlaWwoTWF0aC5sb2coY1swXSArIDEpIC8gTWF0aC5MTjEwKSA9PSBpKSB7XHJcbiAgICAgICAgICBpZiAoU3RyaW5nKGNbMF0pLmxlbmd0aCA9PSBpKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgIG4gPSBjW2ldO1xyXG4gICAgICAgICAgICAgIGlmIChuIDwgMCB8fCBuID49IEJBU0UgfHwgbiAhPT0gbWF0aGZsb29yKG4pKSBicmVhayBvdXQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIExhc3QgZWxlbWVudCBjYW5ub3QgYmUgemVybywgdW5sZXNzIGl0IGlzIHRoZSBvbmx5IGVsZW1lbnQuXHJcbiAgICAgICAgICAgIGlmIChuICE9PSAwKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAvLyBJbmZpbml0eS9OYU5cclxuICAgICAgfSBlbHNlIGlmIChjID09PSBudWxsICYmIGUgPT09IG51bGwgJiYgKHMgPT09IG51bGwgfHwgcyA9PT0gMSB8fCBzID09PSAtMSkpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnSW52YWxpZCBCaWdOdW1iZXI6ICcgKyB2KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBtYXhpbXVtIG9mIHRoZSBhcmd1bWVudHMuXHJcbiAgICAgKlxyXG4gICAgICogYXJndW1lbnRzIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn1cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLm1heGltdW0gPSBCaWdOdW1iZXIubWF4ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gbWF4T3JNaW4oYXJndW1lbnRzLCBQLmx0KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBtaW5pbXVtIG9mIHRoZSBhcmd1bWVudHMuXHJcbiAgICAgKlxyXG4gICAgICogYXJndW1lbnRzIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn1cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLm1pbmltdW0gPSBCaWdOdW1iZXIubWluID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gbWF4T3JNaW4oYXJndW1lbnRzLCBQLmd0KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdpdGggYSByYW5kb20gdmFsdWUgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIDAgYW5kIGxlc3MgdGhhbiAxLFxyXG4gICAgICogYW5kIHdpdGggZHAsIG9yIERFQ0lNQUxfUExBQ0VTIGlmIGRwIGlzIG9taXR0ZWQsIGRlY2ltYWwgcGxhY2VzIChvciBsZXNzIGlmIHRyYWlsaW5nXHJcbiAgICAgKiB6ZXJvcyBhcmUgcHJvZHVjZWQpLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfSdcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBjcnlwdG8gdW5hdmFpbGFibGUnXHJcbiAgICAgKi9cclxuICAgIEJpZ051bWJlci5yYW5kb20gPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgcG93Ml81MyA9IDB4MjAwMDAwMDAwMDAwMDA7XHJcblxyXG4gICAgICAvLyBSZXR1cm4gYSA1MyBiaXQgaW50ZWdlciBuLCB3aGVyZSAwIDw9IG4gPCA5MDA3MTk5MjU0NzQwOTkyLlxyXG4gICAgICAvLyBDaGVjayBpZiBNYXRoLnJhbmRvbSgpIHByb2R1Y2VzIG1vcmUgdGhhbiAzMiBiaXRzIG9mIHJhbmRvbW5lc3MuXHJcbiAgICAgIC8vIElmIGl0IGRvZXMsIGFzc3VtZSBhdCBsZWFzdCA1MyBiaXRzIGFyZSBwcm9kdWNlZCwgb3RoZXJ3aXNlIGFzc3VtZSBhdCBsZWFzdCAzMCBiaXRzLlxyXG4gICAgICAvLyAweDQwMDAwMDAwIGlzIDJeMzAsIDB4ODAwMDAwIGlzIDJeMjMsIDB4MWZmZmZmIGlzIDJeMjEgLSAxLlxyXG4gICAgICB2YXIgcmFuZG9tNTNiaXRJbnQgPSAoTWF0aC5yYW5kb20oKSAqIHBvdzJfNTMpICYgMHgxZmZmZmZcclxuICAgICAgID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gbWF0aGZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3cyXzUzKTsgfVxyXG4gICAgICAgOiBmdW5jdGlvbiAoKSB7IHJldHVybiAoKE1hdGgucmFuZG9tKCkgKiAweDQwMDAwMDAwIHwgMCkgKiAweDgwMDAwMCkgK1xyXG4gICAgICAgICAoTWF0aC5yYW5kb20oKSAqIDB4ODAwMDAwIHwgMCk7IH07XHJcblxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGRwKSB7XHJcbiAgICAgICAgdmFyIGEsIGIsIGUsIGssIHYsXHJcbiAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgIGMgPSBbXSxcclxuICAgICAgICAgIHJhbmQgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcblxyXG4gICAgICAgIGlmIChkcCA9PSBudWxsKSBkcCA9IERFQ0lNQUxfUExBQ0VTO1xyXG4gICAgICAgIGVsc2UgaW50Q2hlY2soZHAsIDAsIE1BWCk7XHJcblxyXG4gICAgICAgIGsgPSBtYXRoY2VpbChkcCAvIExPR19CQVNFKTtcclxuXHJcbiAgICAgICAgaWYgKENSWVBUTykge1xyXG5cclxuICAgICAgICAgIC8vIEJyb3dzZXJzIHN1cHBvcnRpbmcgY3J5cHRvLmdldFJhbmRvbVZhbHVlcy5cclxuICAgICAgICAgIGlmIChjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XHJcblxyXG4gICAgICAgICAgICBhID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDMyQXJyYXkoayAqPSAyKSk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGs7KSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIDUzIGJpdHM6XHJcbiAgICAgICAgICAgICAgLy8gKChNYXRoLnBvdygyLCAzMikgLSAxKSAqIE1hdGgucG93KDIsIDIxKSkudG9TdHJpbmcoMilcclxuICAgICAgICAgICAgICAvLyAxMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTEwMDAwMCAwMDAwMDAwMCAwMDAwMDAwMFxyXG4gICAgICAgICAgICAgIC8vICgoTWF0aC5wb3coMiwgMzIpIC0gMSkgPj4+IDExKS50b1N0cmluZygyKVxyXG4gICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDExMTExIDExMTExMTExIDExMTExMTExXHJcbiAgICAgICAgICAgICAgLy8gMHgyMDAwMCBpcyAyXjIxLlxyXG4gICAgICAgICAgICAgIHYgPSBhW2ldICogMHgyMDAwMCArIChhW2kgKyAxXSA+Pj4gMTEpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBSZWplY3Rpb24gc2FtcGxpbmc6XHJcbiAgICAgICAgICAgICAgLy8gMCA8PSB2IDwgOTAwNzE5OTI1NDc0MDk5MlxyXG4gICAgICAgICAgICAgIC8vIFByb2JhYmlsaXR5IHRoYXQgdiA+PSA5ZTE1LCBpc1xyXG4gICAgICAgICAgICAgIC8vIDcxOTkyNTQ3NDA5OTIgLyA5MDA3MTk5MjU0NzQwOTkyIH49IDAuMDAwOCwgaS5lLiAxIGluIDEyNTFcclxuICAgICAgICAgICAgICBpZiAodiA+PSA5ZTE1KSB7XHJcbiAgICAgICAgICAgICAgICBiID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDMyQXJyYXkoMikpO1xyXG4gICAgICAgICAgICAgICAgYVtpXSA9IGJbMF07XHJcbiAgICAgICAgICAgICAgICBhW2kgKyAxXSA9IGJbMV07XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAwIDw9IHYgPD0gODk5OTk5OTk5OTk5OTk5OVxyXG4gICAgICAgICAgICAgICAgLy8gMCA8PSAodiAlIDFlMTQpIDw9IDk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICBjLnB1c2godiAlIDFlMTQpO1xyXG4gICAgICAgICAgICAgICAgaSArPSAyO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpID0gayAvIDI7XHJcblxyXG4gICAgICAgICAgLy8gTm9kZS5qcyBzdXBwb3J0aW5nIGNyeXB0by5yYW5kb21CeXRlcy5cclxuICAgICAgICAgIH0gZWxzZSBpZiAoY3J5cHRvLnJhbmRvbUJ5dGVzKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBidWZmZXJcclxuICAgICAgICAgICAgYSA9IGNyeXB0by5yYW5kb21CeXRlcyhrICo9IDcpO1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IGkgPCBrOykge1xyXG5cclxuICAgICAgICAgICAgICAvLyAweDEwMDAwMDAwMDAwMDAgaXMgMl40OCwgMHgxMDAwMDAwMDAwMCBpcyAyXjQwXHJcbiAgICAgICAgICAgICAgLy8gMHgxMDAwMDAwMDAgaXMgMl4zMiwgMHgxMDAwMDAwIGlzIDJeMjRcclxuICAgICAgICAgICAgICAvLyAxMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMVxyXG4gICAgICAgICAgICAgIC8vIDAgPD0gdiA8IDkwMDcxOTkyNTQ3NDA5OTJcclxuICAgICAgICAgICAgICB2ID0gKChhW2ldICYgMzEpICogMHgxMDAwMDAwMDAwMDAwKSArIChhW2kgKyAxXSAqIDB4MTAwMDAwMDAwMDApICtcclxuICAgICAgICAgICAgICAgICAoYVtpICsgMl0gKiAweDEwMDAwMDAwMCkgKyAoYVtpICsgM10gKiAweDEwMDAwMDApICtcclxuICAgICAgICAgICAgICAgICAoYVtpICsgNF0gPDwgMTYpICsgKGFbaSArIDVdIDw8IDgpICsgYVtpICsgNl07XHJcblxyXG4gICAgICAgICAgICAgIGlmICh2ID49IDllMTUpIHtcclxuICAgICAgICAgICAgICAgIGNyeXB0by5yYW5kb21CeXRlcyg3KS5jb3B5KGEsIGkpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gMCA8PSAodiAlIDFlMTQpIDw9IDk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICBjLnB1c2godiAlIDFlMTQpO1xyXG4gICAgICAgICAgICAgICAgaSArPSA3O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpID0gayAvIDc7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBDUllQVE8gPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdjcnlwdG8gdW5hdmFpbGFibGUnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFVzZSBNYXRoLnJhbmRvbS5cclxuICAgICAgICBpZiAoIUNSWVBUTykge1xyXG5cclxuICAgICAgICAgIGZvciAoOyBpIDwgazspIHtcclxuICAgICAgICAgICAgdiA9IHJhbmRvbTUzYml0SW50KCk7XHJcbiAgICAgICAgICAgIGlmICh2IDwgOWUxNSkgY1tpKytdID0gdiAlIDFlMTQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBrID0gY1stLWldO1xyXG4gICAgICAgIGRwICU9IExPR19CQVNFO1xyXG5cclxuICAgICAgICAvLyBDb252ZXJ0IHRyYWlsaW5nIGRpZ2l0cyB0byB6ZXJvcyBhY2NvcmRpbmcgdG8gZHAuXHJcbiAgICAgICAgaWYgKGsgJiYgZHApIHtcclxuICAgICAgICAgIHYgPSBQT1dTX1RFTltMT0dfQkFTRSAtIGRwXTtcclxuICAgICAgICAgIGNbaV0gPSBtYXRoZmxvb3IoayAvIHYpICogdjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyBlbGVtZW50cyB3aGljaCBhcmUgemVyby5cclxuICAgICAgICBmb3IgKDsgY1tpXSA9PT0gMDsgYy5wb3AoKSwgaS0tKTtcclxuXHJcbiAgICAgICAgLy8gWmVybz9cclxuICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgIGMgPSBbZSA9IDBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgZWxlbWVudHMgd2hpY2ggYXJlIHplcm8gYW5kIGFkanVzdCBleHBvbmVudCBhY2NvcmRpbmdseS5cclxuICAgICAgICAgIGZvciAoZSA9IC0xIDsgY1swXSA9PT0gMDsgYy5zcGxpY2UoMCwgMSksIGUgLT0gTE9HX0JBU0UpO1xyXG5cclxuICAgICAgICAgIC8vIENvdW50IHRoZSBkaWdpdHMgb2YgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYyB0byBkZXRlcm1pbmUgbGVhZGluZyB6ZXJvcywgYW5kLi4uXHJcbiAgICAgICAgICBmb3IgKGkgPSAxLCB2ID0gY1swXTsgdiA+PSAxMDsgdiAvPSAxMCwgaSsrKTtcclxuXHJcbiAgICAgICAgICAvLyBhZGp1c3QgdGhlIGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgICAgICAgaWYgKGkgPCBMT0dfQkFTRSkgZSAtPSBMT0dfQkFTRSAtIGk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByYW5kLmUgPSBlO1xyXG4gICAgICAgIHJhbmQuYyA9IGM7XHJcbiAgICAgICAgcmV0dXJuIHJhbmQ7XHJcbiAgICAgIH07XHJcbiAgICB9KSgpO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBzdW0gb2YgdGhlIGFyZ3VtZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBhcmd1bWVudHMge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIuc3VtID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgaSA9IDEsXHJcbiAgICAgICAgYXJncyA9IGFyZ3VtZW50cyxcclxuICAgICAgICBzdW0gPSBuZXcgQmlnTnVtYmVyKGFyZ3NbMF0pO1xyXG4gICAgICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOykgc3VtID0gc3VtLnBsdXMoYXJnc1tpKytdKTtcclxuICAgICAgcmV0dXJuIHN1bTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vIFBSSVZBVEUgRlVOQ1RJT05TXHJcblxyXG5cclxuICAgIC8vIENhbGxlZCBieSBCaWdOdW1iZXIgYW5kIEJpZ051bWJlci5wcm90b3R5cGUudG9TdHJpbmcuXHJcbiAgICBjb252ZXJ0QmFzZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBkZWNpbWFsID0gJzAxMjM0NTY3ODknO1xyXG5cclxuICAgICAgLypcclxuICAgICAgICogQ29udmVydCBzdHJpbmcgb2YgYmFzZUluIHRvIGFuIGFycmF5IG9mIG51bWJlcnMgb2YgYmFzZU91dC5cclxuICAgICAgICogRWcuIHRvQmFzZU91dCgnMjU1JywgMTAsIDE2KSByZXR1cm5zIFsxNSwgMTVdLlxyXG4gICAgICAgKiBFZy4gdG9CYXNlT3V0KCdmZicsIDE2LCAxMCkgcmV0dXJucyBbMiwgNSwgNV0uXHJcbiAgICAgICAqL1xyXG4gICAgICBmdW5jdGlvbiB0b0Jhc2VPdXQoc3RyLCBiYXNlSW4sIGJhc2VPdXQsIGFscGhhYmV0KSB7XHJcbiAgICAgICAgdmFyIGosXHJcbiAgICAgICAgICBhcnIgPSBbMF0sXHJcbiAgICAgICAgICBhcnJMLFxyXG4gICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgICBmb3IgKDsgaSA8IGxlbjspIHtcclxuICAgICAgICAgIGZvciAoYXJyTCA9IGFyci5sZW5ndGg7IGFyckwtLTsgYXJyW2FyckxdICo9IGJhc2VJbik7XHJcblxyXG4gICAgICAgICAgYXJyWzBdICs9IGFscGhhYmV0LmluZGV4T2Yoc3RyLmNoYXJBdChpKyspKTtcclxuXHJcbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgYXJyLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJyW2pdID4gYmFzZU91dCAtIDEpIHtcclxuICAgICAgICAgICAgICBpZiAoYXJyW2ogKyAxXSA9PSBudWxsKSBhcnJbaiArIDFdID0gMDtcclxuICAgICAgICAgICAgICBhcnJbaiArIDFdICs9IGFycltqXSAvIGJhc2VPdXQgfCAwO1xyXG4gICAgICAgICAgICAgIGFycltqXSAlPSBiYXNlT3V0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyLnJldmVyc2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ29udmVydCBhIG51bWVyaWMgc3RyaW5nIG9mIGJhc2VJbiB0byBhIG51bWVyaWMgc3RyaW5nIG9mIGJhc2VPdXQuXHJcbiAgICAgIC8vIElmIHRoZSBjYWxsZXIgaXMgdG9TdHJpbmcsIHdlIGFyZSBjb252ZXJ0aW5nIGZyb20gYmFzZSAxMCB0byBiYXNlT3V0LlxyXG4gICAgICAvLyBJZiB0aGUgY2FsbGVyIGlzIEJpZ051bWJlciwgd2UgYXJlIGNvbnZlcnRpbmcgZnJvbSBiYXNlSW4gdG8gYmFzZSAxMC5cclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHIsIGJhc2VJbiwgYmFzZU91dCwgc2lnbiwgY2FsbGVySXNUb1N0cmluZykge1xyXG4gICAgICAgIHZhciBhbHBoYWJldCwgZCwgZSwgaywgciwgeCwgeGMsIHksXHJcbiAgICAgICAgICBpID0gc3RyLmluZGV4T2YoJy4nKSxcclxuICAgICAgICAgIGRwID0gREVDSU1BTF9QTEFDRVMsXHJcbiAgICAgICAgICBybSA9IFJPVU5ESU5HX01PREU7XHJcblxyXG4gICAgICAgIC8vIE5vbi1pbnRlZ2VyLlxyXG4gICAgICAgIGlmIChpID49IDApIHtcclxuICAgICAgICAgIGsgPSBQT1dfUFJFQ0lTSU9OO1xyXG5cclxuICAgICAgICAgIC8vIFVubGltaXRlZCBwcmVjaXNpb24uXHJcbiAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gMDtcclxuICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKCcuJywgJycpO1xyXG4gICAgICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoYmFzZUluKTtcclxuICAgICAgICAgIHggPSB5LnBvdyhzdHIubGVuZ3RoIC0gaSk7XHJcbiAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gaztcclxuXHJcbiAgICAgICAgICAvLyBDb252ZXJ0IHN0ciBhcyBpZiBhbiBpbnRlZ2VyLCB0aGVuIHJlc3RvcmUgdGhlIGZyYWN0aW9uIHBhcnQgYnkgZGl2aWRpbmcgdGhlXHJcbiAgICAgICAgICAvLyByZXN1bHQgYnkgaXRzIGJhc2UgcmFpc2VkIHRvIGEgcG93ZXIuXHJcblxyXG4gICAgICAgICAgeS5jID0gdG9CYXNlT3V0KHRvRml4ZWRQb2ludChjb2VmZlRvU3RyaW5nKHguYyksIHguZSwgJzAnKSxcclxuICAgICAgICAgICAxMCwgYmFzZU91dCwgZGVjaW1hbCk7XHJcbiAgICAgICAgICB5LmUgPSB5LmMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ29udmVydCB0aGUgbnVtYmVyIGFzIGludGVnZXIuXHJcblxyXG4gICAgICAgIHhjID0gdG9CYXNlT3V0KHN0ciwgYmFzZUluLCBiYXNlT3V0LCBjYWxsZXJJc1RvU3RyaW5nXHJcbiAgICAgICAgID8gKGFscGhhYmV0ID0gQUxQSEFCRVQsIGRlY2ltYWwpXHJcbiAgICAgICAgIDogKGFscGhhYmV0ID0gZGVjaW1hbCwgQUxQSEFCRVQpKTtcclxuXHJcbiAgICAgICAgLy8geGMgbm93IHJlcHJlc2VudHMgc3RyIGFzIGFuIGludGVnZXIgYW5kIGNvbnZlcnRlZCB0byBiYXNlT3V0LiBlIGlzIHRoZSBleHBvbmVudC5cclxuICAgICAgICBlID0gayA9IHhjLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoOyB4Y1stLWtdID09IDA7IHhjLnBvcCgpKTtcclxuXHJcbiAgICAgICAgLy8gWmVybz9cclxuICAgICAgICBpZiAoIXhjWzBdKSByZXR1cm4gYWxwaGFiZXQuY2hhckF0KDApO1xyXG5cclxuICAgICAgICAvLyBEb2VzIHN0ciByZXByZXNlbnQgYW4gaW50ZWdlcj8gSWYgc28sIG5vIG5lZWQgZm9yIHRoZSBkaXZpc2lvbi5cclxuICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgIC0tZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeC5jID0geGM7XHJcbiAgICAgICAgICB4LmUgPSBlO1xyXG5cclxuICAgICAgICAgIC8vIFRoZSBzaWduIGlzIG5lZWRlZCBmb3IgY29ycmVjdCByb3VuZGluZy5cclxuICAgICAgICAgIHgucyA9IHNpZ247XHJcbiAgICAgICAgICB4ID0gZGl2KHgsIHksIGRwLCBybSwgYmFzZU91dCk7XHJcbiAgICAgICAgICB4YyA9IHguYztcclxuICAgICAgICAgIHIgPSB4LnI7XHJcbiAgICAgICAgICBlID0geC5lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8geGMgbm93IHJlcHJlc2VudHMgc3RyIGNvbnZlcnRlZCB0byBiYXNlT3V0LlxyXG5cclxuICAgICAgICAvLyBUSGUgaW5kZXggb2YgdGhlIHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICAgIGQgPSBlICsgZHAgKyAxO1xyXG5cclxuICAgICAgICAvLyBUaGUgcm91bmRpbmcgZGlnaXQ6IHRoZSBkaWdpdCB0byB0aGUgcmlnaHQgb2YgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgaSA9IHhjW2RdO1xyXG5cclxuICAgICAgICAvLyBMb29rIGF0IHRoZSByb3VuZGluZyBkaWdpdHMgYW5kIG1vZGUgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdG8gcm91bmQgdXAuXHJcblxyXG4gICAgICAgIGsgPSBiYXNlT3V0IC8gMjtcclxuICAgICAgICByID0gciB8fCBkIDwgMCB8fCB4Y1tkICsgMV0gIT0gbnVsbDtcclxuXHJcbiAgICAgICAgciA9IHJtIDwgNCA/IChpICE9IG51bGwgfHwgcikgJiYgKHJtID09IDAgfHwgcm0gPT0gKHgucyA8IDAgPyAzIDogMikpXHJcbiAgICAgICAgICAgICAgOiBpID4gayB8fCBpID09IGsgJiYocm0gPT0gNCB8fCByIHx8IHJtID09IDYgJiYgeGNbZCAtIDFdICYgMSB8fFxyXG4gICAgICAgICAgICAgICBybSA9PSAoeC5zIDwgMCA/IDggOiA3KSk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBpbmRleCBvZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgbm90IGdyZWF0ZXIgdGhhbiB6ZXJvLCBvciB4YyByZXByZXNlbnRzXHJcbiAgICAgICAgLy8gemVybywgdGhlbiB0aGUgcmVzdWx0IG9mIHRoZSBiYXNlIGNvbnZlcnNpb24gaXMgemVybyBvciwgaWYgcm91bmRpbmcgdXAsIGEgdmFsdWVcclxuICAgICAgICAvLyBzdWNoIGFzIDAuMDAwMDEuXHJcbiAgICAgICAgaWYgKGQgPCAxIHx8ICF4Y1swXSkge1xyXG5cclxuICAgICAgICAgIC8vIDFeLWRwIG9yIDBcclxuICAgICAgICAgIHN0ciA9IHIgPyB0b0ZpeGVkUG9pbnQoYWxwaGFiZXQuY2hhckF0KDEpLCAtZHAsIGFscGhhYmV0LmNoYXJBdCgwKSkgOiBhbHBoYWJldC5jaGFyQXQoMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyBUcnVuY2F0ZSB4YyB0byB0aGUgcmVxdWlyZWQgbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAgeGMubGVuZ3RoID0gZDtcclxuXHJcbiAgICAgICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgICAgIGlmIChyKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBSb3VuZGluZyB1cCBtYXkgbWVhbiB0aGUgcHJldmlvdXMgZGlnaXQgaGFzIHRvIGJlIHJvdW5kZWQgdXAgYW5kIHNvIG9uLlxyXG4gICAgICAgICAgICBmb3IgKC0tYmFzZU91dDsgKyt4Y1stLWRdID4gYmFzZU91dDspIHtcclxuICAgICAgICAgICAgICB4Y1tkXSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgIGlmICghZCkge1xyXG4gICAgICAgICAgICAgICAgKytlO1xyXG4gICAgICAgICAgICAgICAgeGMgPSBbMV0uY29uY2F0KHhjKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICBmb3IgKGsgPSB4Yy5sZW5ndGg7ICF4Y1stLWtdOyk7XHJcblxyXG4gICAgICAgICAgLy8gRS5nLiBbNCwgMTEsIDE1XSBiZWNvbWVzIDRiZi5cclxuICAgICAgICAgIGZvciAoaSA9IDAsIHN0ciA9ICcnOyBpIDw9IGs7IHN0ciArPSBhbHBoYWJldC5jaGFyQXQoeGNbaSsrXSkpO1xyXG5cclxuICAgICAgICAgIC8vIEFkZCBsZWFkaW5nIHplcm9zLCBkZWNpbWFsIHBvaW50IGFuZCB0cmFpbGluZyB6ZXJvcyBhcyByZXF1aXJlZC5cclxuICAgICAgICAgIHN0ciA9IHRvRml4ZWRQb2ludChzdHIsIGUsIGFscGhhYmV0LmNoYXJBdCgwKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUaGUgY2FsbGVyIHdpbGwgYWRkIHRoZSBzaWduLlxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgIH07XHJcbiAgICB9KSgpO1xyXG5cclxuXHJcbiAgICAvLyBQZXJmb3JtIGRpdmlzaW9uIGluIHRoZSBzcGVjaWZpZWQgYmFzZS4gQ2FsbGVkIGJ5IGRpdiBhbmQgY29udmVydEJhc2UuXHJcbiAgICBkaXYgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgLy8gQXNzdW1lIG5vbi16ZXJvIHggYW5kIGsuXHJcbiAgICAgIGZ1bmN0aW9uIG11bHRpcGx5KHgsIGssIGJhc2UpIHtcclxuICAgICAgICB2YXIgbSwgdGVtcCwgeGxvLCB4aGksXHJcbiAgICAgICAgICBjYXJyeSA9IDAsXHJcbiAgICAgICAgICBpID0geC5sZW5ndGgsXHJcbiAgICAgICAgICBrbG8gPSBrICUgU1FSVF9CQVNFLFxyXG4gICAgICAgICAga2hpID0gayAvIFNRUlRfQkFTRSB8IDA7XHJcblxyXG4gICAgICAgIGZvciAoeCA9IHguc2xpY2UoKTsgaS0tOykge1xyXG4gICAgICAgICAgeGxvID0geFtpXSAlIFNRUlRfQkFTRTtcclxuICAgICAgICAgIHhoaSA9IHhbaV0gLyBTUVJUX0JBU0UgfCAwO1xyXG4gICAgICAgICAgbSA9IGtoaSAqIHhsbyArIHhoaSAqIGtsbztcclxuICAgICAgICAgIHRlbXAgPSBrbG8gKiB4bG8gKyAoKG0gJSBTUVJUX0JBU0UpICogU1FSVF9CQVNFKSArIGNhcnJ5O1xyXG4gICAgICAgICAgY2FycnkgPSAodGVtcCAvIGJhc2UgfCAwKSArIChtIC8gU1FSVF9CQVNFIHwgMCkgKyBraGkgKiB4aGk7XHJcbiAgICAgICAgICB4W2ldID0gdGVtcCAlIGJhc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2FycnkpIHggPSBbY2FycnldLmNvbmNhdCh4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGNvbXBhcmUoYSwgYiwgYUwsIGJMKSB7XHJcbiAgICAgICAgdmFyIGksIGNtcDtcclxuXHJcbiAgICAgICAgaWYgKGFMICE9IGJMKSB7XHJcbiAgICAgICAgICBjbXAgPSBhTCA+IGJMID8gMSA6IC0xO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgZm9yIChpID0gY21wID0gMDsgaSA8IGFMOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhW2ldICE9IGJbaV0pIHtcclxuICAgICAgICAgICAgICBjbXAgPSBhW2ldID4gYltpXSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNtcDtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gc3VidHJhY3QoYSwgYiwgYUwsIGJhc2UpIHtcclxuICAgICAgICB2YXIgaSA9IDA7XHJcblxyXG4gICAgICAgIC8vIFN1YnRyYWN0IGIgZnJvbSBhLlxyXG4gICAgICAgIGZvciAoOyBhTC0tOykge1xyXG4gICAgICAgICAgYVthTF0gLT0gaTtcclxuICAgICAgICAgIGkgPSBhW2FMXSA8IGJbYUxdID8gMSA6IDA7XHJcbiAgICAgICAgICBhW2FMXSA9IGkgKiBiYXNlICsgYVthTF0gLSBiW2FMXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoOyAhYVswXSAmJiBhLmxlbmd0aCA+IDE7IGEuc3BsaWNlKDAsIDEpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8geDogZGl2aWRlbmQsIHk6IGRpdmlzb3IuXHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoeCwgeSwgZHAsIHJtLCBiYXNlKSB7XHJcbiAgICAgICAgdmFyIGNtcCwgZSwgaSwgbW9yZSwgbiwgcHJvZCwgcHJvZEwsIHEsIHFjLCByZW0sIHJlbUwsIHJlbTAsIHhpLCB4TCwgeWMwLFxyXG4gICAgICAgICAgeUwsIHl6LFxyXG4gICAgICAgICAgcyA9IHgucyA9PSB5LnMgPyAxIDogLTEsXHJcbiAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgIHljID0geS5jO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgTmFOLCBJbmZpbml0eSBvciAwP1xyXG4gICAgICAgIGlmICgheGMgfHwgIXhjWzBdIHx8ICF5YyB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcihcclxuXHJcbiAgICAgICAgICAgLy8gUmV0dXJuIE5hTiBpZiBlaXRoZXIgTmFOLCBvciBib3RoIEluZmluaXR5IG9yIDAuXHJcbiAgICAgICAgICAgIXgucyB8fCAheS5zIHx8ICh4YyA/IHljICYmIHhjWzBdID09IHljWzBdIDogIXljKSA/IE5hTiA6XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gwrEwIGlmIHggaXMgwrEwIG9yIHkgaXMgwrFJbmZpbml0eSwgb3IgcmV0dXJuIMKxSW5maW5pdHkgYXMgeSBpcyDCsTAuXHJcbiAgICAgICAgICAgIHhjICYmIHhjWzBdID09IDAgfHwgIXljID8gcyAqIDAgOiBzIC8gMFxyXG4gICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcSA9IG5ldyBCaWdOdW1iZXIocyk7XHJcbiAgICAgICAgcWMgPSBxLmMgPSBbXTtcclxuICAgICAgICBlID0geC5lIC0geS5lO1xyXG4gICAgICAgIHMgPSBkcCArIGUgKyAxO1xyXG5cclxuICAgICAgICBpZiAoIWJhc2UpIHtcclxuICAgICAgICAgIGJhc2UgPSBCQVNFO1xyXG4gICAgICAgICAgZSA9IGJpdEZsb29yKHguZSAvIExPR19CQVNFKSAtIGJpdEZsb29yKHkuZSAvIExPR19CQVNFKTtcclxuICAgICAgICAgIHMgPSBzIC8gTE9HX0JBU0UgfCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVzdWx0IGV4cG9uZW50IG1heSBiZSBvbmUgbGVzcyB0aGVuIHRoZSBjdXJyZW50IHZhbHVlIG9mIGUuXHJcbiAgICAgICAgLy8gVGhlIGNvZWZmaWNpZW50cyBvZiB0aGUgQmlnTnVtYmVycyBmcm9tIGNvbnZlcnRCYXNlIG1heSBoYXZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoaSA9IDA7IHljW2ldID09ICh4Y1tpXSB8fCAwKTsgaSsrKTtcclxuXHJcbiAgICAgICAgaWYgKHljW2ldID4gKHhjW2ldIHx8IDApKSBlLS07XHJcblxyXG4gICAgICAgIGlmIChzIDwgMCkge1xyXG4gICAgICAgICAgcWMucHVzaCgxKTtcclxuICAgICAgICAgIG1vcmUgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4TCA9IHhjLmxlbmd0aDtcclxuICAgICAgICAgIHlMID0geWMubGVuZ3RoO1xyXG4gICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgICBzICs9IDI7XHJcblxyXG4gICAgICAgICAgLy8gTm9ybWFsaXNlIHhjIGFuZCB5YyBzbyBoaWdoZXN0IG9yZGVyIGRpZ2l0IG9mIHljIGlzID49IGJhc2UgLyAyLlxyXG5cclxuICAgICAgICAgIG4gPSBtYXRoZmxvb3IoYmFzZSAvICh5Y1swXSArIDEpKTtcclxuXHJcbiAgICAgICAgICAvLyBOb3QgbmVjZXNzYXJ5LCBidXQgdG8gaGFuZGxlIG9kZCBiYXNlcyB3aGVyZSB5Y1swXSA9PSAoYmFzZSAvIDIpIC0gMS5cclxuICAgICAgICAgIC8vIGlmIChuID4gMSB8fCBuKysgPT0gMSAmJiB5Y1swXSA8IGJhc2UgLyAyKSB7XHJcbiAgICAgICAgICBpZiAobiA+IDEpIHtcclxuICAgICAgICAgICAgeWMgPSBtdWx0aXBseSh5YywgbiwgYmFzZSk7XHJcbiAgICAgICAgICAgIHhjID0gbXVsdGlwbHkoeGMsIG4sIGJhc2UpO1xyXG4gICAgICAgICAgICB5TCA9IHljLmxlbmd0aDtcclxuICAgICAgICAgICAgeEwgPSB4Yy5sZW5ndGg7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgeGkgPSB5TDtcclxuICAgICAgICAgIHJlbSA9IHhjLnNsaWNlKDAsIHlMKTtcclxuICAgICAgICAgIHJlbUwgPSByZW0ubGVuZ3RoO1xyXG5cclxuICAgICAgICAgIC8vIEFkZCB6ZXJvcyB0byBtYWtlIHJlbWFpbmRlciBhcyBsb25nIGFzIGRpdmlzb3IuXHJcbiAgICAgICAgICBmb3IgKDsgcmVtTCA8IHlMOyByZW1bcmVtTCsrXSA9IDApO1xyXG4gICAgICAgICAgeXogPSB5Yy5zbGljZSgpO1xyXG4gICAgICAgICAgeXogPSBbMF0uY29uY2F0KHl6KTtcclxuICAgICAgICAgIHljMCA9IHljWzBdO1xyXG4gICAgICAgICAgaWYgKHljWzFdID49IGJhc2UgLyAyKSB5YzArKztcclxuICAgICAgICAgIC8vIE5vdCBuZWNlc3NhcnksIGJ1dCB0byBwcmV2ZW50IHRyaWFsIGRpZ2l0IG4gPiBiYXNlLCB3aGVuIHVzaW5nIGJhc2UgMy5cclxuICAgICAgICAgIC8vIGVsc2UgaWYgKGJhc2UgPT0gMyAmJiB5YzAgPT0gMSkgeWMwID0gMSArIDFlLTE1O1xyXG5cclxuICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgbiA9IDA7XHJcblxyXG4gICAgICAgICAgICAvLyBDb21wYXJlIGRpdmlzb3IgYW5kIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgY21wID0gY29tcGFyZSh5YywgcmVtLCB5TCwgcmVtTCk7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBkaXZpc29yIDwgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICBpZiAoY21wIDwgMCkge1xyXG5cclxuICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdHJpYWwgZGlnaXQsIG4uXHJcblxyXG4gICAgICAgICAgICAgIHJlbTAgPSByZW1bMF07XHJcbiAgICAgICAgICAgICAgaWYgKHlMICE9IHJlbUwpIHJlbTAgPSByZW0wICogYmFzZSArIChyZW1bMV0gfHwgMCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIG4gaXMgaG93IG1hbnkgdGltZXMgdGhlIGRpdmlzb3IgZ29lcyBpbnRvIHRoZSBjdXJyZW50IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICBuID0gbWF0aGZsb29yKHJlbTAgLyB5YzApO1xyXG5cclxuICAgICAgICAgICAgICAvLyAgQWxnb3JpdGhtOlxyXG4gICAgICAgICAgICAgIC8vICBwcm9kdWN0ID0gZGl2aXNvciBtdWx0aXBsaWVkIGJ5IHRyaWFsIGRpZ2l0IChuKS5cclxuICAgICAgICAgICAgICAvLyAgQ29tcGFyZSBwcm9kdWN0IGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgLy8gIElmIHByb2R1Y3QgaXMgZ3JlYXRlciB0aGFuIHJlbWFpbmRlcjpcclxuICAgICAgICAgICAgICAvLyAgICBTdWJ0cmFjdCBkaXZpc29yIGZyb20gcHJvZHVjdCwgZGVjcmVtZW50IHRyaWFsIGRpZ2l0LlxyXG4gICAgICAgICAgICAgIC8vICBTdWJ0cmFjdCBwcm9kdWN0IGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIC8vICBJZiBwcm9kdWN0IHdhcyBsZXNzIHRoYW4gcmVtYWluZGVyIGF0IHRoZSBsYXN0IGNvbXBhcmU6XHJcbiAgICAgICAgICAgICAgLy8gICAgQ29tcGFyZSBuZXcgcmVtYWluZGVyIGFuZCBkaXZpc29yLlxyXG4gICAgICAgICAgICAgIC8vICAgIElmIHJlbWFpbmRlciBpcyBncmVhdGVyIHRoYW4gZGl2aXNvcjpcclxuICAgICAgICAgICAgICAvLyAgICAgIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIsIGluY3JlbWVudCB0cmlhbCBkaWdpdC5cclxuXHJcbiAgICAgICAgICAgICAgaWYgKG4gPiAxKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbiBtYXkgYmUgPiBiYXNlIG9ubHkgd2hlbiBiYXNlIGlzIDMuXHJcbiAgICAgICAgICAgICAgICBpZiAobiA+PSBiYXNlKSBuID0gYmFzZSAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcHJvZHVjdCA9IGRpdmlzb3IgKiB0cmlhbCBkaWdpdC5cclxuICAgICAgICAgICAgICAgIHByb2QgPSBtdWx0aXBseSh5YywgbiwgYmFzZSk7XHJcbiAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBwcm9kdWN0IGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBwcm9kdWN0ID4gcmVtYWluZGVyIHRoZW4gdHJpYWwgZGlnaXQgbiB0b28gaGlnaC5cclxuICAgICAgICAgICAgICAgIC8vIG4gaXMgMSB0b28gaGlnaCBhYm91dCA1JSBvZiB0aGUgdGltZSwgYW5kIGlzIG5vdCBrbm93biB0byBoYXZlXHJcbiAgICAgICAgICAgICAgICAvLyBldmVyIGJlZW4gbW9yZSB0aGFuIDEgdG9vIGhpZ2guXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoY29tcGFyZShwcm9kLCByZW0sIHByb2RMLCByZW1MKSA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIG4tLTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSBwcm9kdWN0LlxyXG4gICAgICAgICAgICAgICAgICBzdWJ0cmFjdChwcm9kLCB5TCA8IHByb2RMID8geXogOiB5YywgcHJvZEwsIGJhc2UpO1xyXG4gICAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICBjbXAgPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbiBpcyAwIG9yIDEsIGNtcCBpcyAtMS5cclxuICAgICAgICAgICAgICAgIC8vIElmIG4gaXMgMCwgdGhlcmUgaXMgbm8gbmVlZCB0byBjb21wYXJlIHljIGFuZCByZW0gYWdhaW4gYmVsb3csXHJcbiAgICAgICAgICAgICAgICAvLyBzbyBjaGFuZ2UgY21wIHRvIDEgdG8gYXZvaWQgaXQuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBuIGlzIDEsIGxlYXZlIGNtcCBhcyAtMSwgc28geWMgYW5kIHJlbSBhcmUgY29tcGFyZWQgYWdhaW4uXHJcbiAgICAgICAgICAgICAgICBpZiAobiA9PSAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBkaXZpc29yIDwgcmVtYWluZGVyLCBzbyBuIG11c3QgYmUgYXQgbGVhc3QgMS5cclxuICAgICAgICAgICAgICAgICAgY21wID0gbiA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcHJvZHVjdCA9IGRpdmlzb3JcclxuICAgICAgICAgICAgICAgIHByb2QgPSB5Yy5zbGljZSgpO1xyXG4gICAgICAgICAgICAgICAgcHJvZEwgPSBwcm9kLmxlbmd0aDtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChwcm9kTCA8IHJlbUwpIHByb2QgPSBbMF0uY29uY2F0KHByb2QpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBTdWJ0cmFjdCBwcm9kdWN0IGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIHN1YnRyYWN0KHJlbSwgcHJvZCwgcmVtTCwgYmFzZSk7XHJcbiAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAvLyBJZiBwcm9kdWN0IHdhcyA8IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICBpZiAoY21wID09IC0xKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBkaXZpc29yIGFuZCBuZXcgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgLy8gSWYgZGl2aXNvciA8IG5ldyByZW1haW5kZXIsIHN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAvLyBUcmlhbCBkaWdpdCBuIHRvbyBsb3cuXHJcbiAgICAgICAgICAgICAgICAvLyBuIGlzIDEgdG9vIGxvdyBhYm91dCA1JSBvZiB0aGUgdGltZSwgYW5kIHZlcnkgcmFyZWx5IDIgdG9vIGxvdy5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKHljLCByZW0sIHlMLCByZW1MKSA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgbisrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gU3VidHJhY3QgZGl2aXNvciBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgc3VidHJhY3QocmVtLCB5TCA8IHJlbUwgPyB5eiA6IHljLCByZW1MLCBiYXNlKTtcclxuICAgICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNtcCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIG4rKztcclxuICAgICAgICAgICAgICByZW0gPSBbMF07XHJcbiAgICAgICAgICAgIH0gLy8gZWxzZSBjbXAgPT09IDEgYW5kIG4gd2lsbCBiZSAwXHJcblxyXG4gICAgICAgICAgICAvLyBBZGQgdGhlIG5leHQgZGlnaXQsIG4sIHRvIHRoZSByZXN1bHQgYXJyYXkuXHJcbiAgICAgICAgICAgIHFjW2krK10gPSBuO1xyXG5cclxuICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgIGlmIChyZW1bMF0pIHtcclxuICAgICAgICAgICAgICByZW1bcmVtTCsrXSA9IHhjW3hpXSB8fCAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJlbSA9IFt4Y1t4aV1dO1xyXG4gICAgICAgICAgICAgIHJlbUwgPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IHdoaWxlICgoeGkrKyA8IHhMIHx8IHJlbVswXSAhPSBudWxsKSAmJiBzLS0pO1xyXG5cclxuICAgICAgICAgIG1vcmUgPSByZW1bMF0gIT0gbnVsbDtcclxuXHJcbiAgICAgICAgICAvLyBMZWFkaW5nIHplcm8/XHJcbiAgICAgICAgICBpZiAoIXFjWzBdKSBxYy5zcGxpY2UoMCwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYmFzZSA9PSBCQVNFKSB7XHJcblxyXG4gICAgICAgICAgLy8gVG8gY2FsY3VsYXRlIHEuZSwgZmlyc3QgZ2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHFjWzBdLlxyXG4gICAgICAgICAgZm9yIChpID0gMSwgcyA9IHFjWzBdOyBzID49IDEwOyBzIC89IDEwLCBpKyspO1xyXG5cclxuICAgICAgICAgIHJvdW5kKHEsIGRwICsgKHEuZSA9IGkgKyBlICogTE9HX0JBU0UgLSAxKSArIDEsIHJtLCBtb3JlKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsbGVyIGlzIGNvbnZlcnRCYXNlLlxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBxLmUgPSBlO1xyXG4gICAgICAgICAgcS5yID0gK21vcmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcTtcclxuICAgICAgfTtcclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIgbiBpbiBmaXhlZC1wb2ludCBvciBleHBvbmVudGlhbFxyXG4gICAgICogbm90YXRpb24gcm91bmRlZCB0byB0aGUgc3BlY2lmaWVkIGRlY2ltYWwgcGxhY2VzIG9yIHNpZ25pZmljYW50IGRpZ2l0cy5cclxuICAgICAqXHJcbiAgICAgKiBuOiBhIEJpZ051bWJlci5cclxuICAgICAqIGk6IHRoZSBpbmRleCBvZiB0aGUgbGFzdCBkaWdpdCByZXF1aXJlZCAoaS5lLiB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cCkuXHJcbiAgICAgKiBybTogdGhlIHJvdW5kaW5nIG1vZGUuXHJcbiAgICAgKiBpZDogMSAodG9FeHBvbmVudGlhbCkgb3IgMiAodG9QcmVjaXNpb24pLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBmb3JtYXQobiwgaSwgcm0sIGlkKSB7XHJcbiAgICAgIHZhciBjMCwgZSwgbmUsIGxlbiwgc3RyO1xyXG5cclxuICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcblxyXG4gICAgICBpZiAoIW4uYykgcmV0dXJuIG4udG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIGMwID0gbi5jWzBdO1xyXG4gICAgICBuZSA9IG4uZTtcclxuXHJcbiAgICAgIGlmIChpID09IG51bGwpIHtcclxuICAgICAgICBzdHIgPSBjb2VmZlRvU3RyaW5nKG4uYyk7XHJcbiAgICAgICAgc3RyID0gaWQgPT0gMSB8fCBpZCA9PSAyICYmIChuZSA8PSBUT19FWFBfTkVHIHx8IG5lID49IFRPX0VYUF9QT1MpXHJcbiAgICAgICAgID8gdG9FeHBvbmVudGlhbChzdHIsIG5lKVxyXG4gICAgICAgICA6IHRvRml4ZWRQb2ludChzdHIsIG5lLCAnMCcpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG4gPSByb3VuZChuZXcgQmlnTnVtYmVyKG4pLCBpLCBybSk7XHJcblxyXG4gICAgICAgIC8vIG4uZSBtYXkgaGF2ZSBjaGFuZ2VkIGlmIHRoZSB2YWx1ZSB3YXMgcm91bmRlZCB1cC5cclxuICAgICAgICBlID0gbi5lO1xyXG5cclxuICAgICAgICBzdHIgPSBjb2VmZlRvU3RyaW5nKG4uYyk7XHJcbiAgICAgICAgbGVuID0gc3RyLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gdG9QcmVjaXNpb24gcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbiBpZiB0aGUgbnVtYmVyIG9mIHNpZ25pZmljYW50IGRpZ2l0c1xyXG4gICAgICAgIC8vIHNwZWNpZmllZCBpcyBsZXNzIHRoYW4gdGhlIG51bWJlciBvZiBkaWdpdHMgbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlclxyXG4gICAgICAgIC8vIHBhcnQgb2YgdGhlIHZhbHVlIGluIGZpeGVkLXBvaW50IG5vdGF0aW9uLlxyXG5cclxuICAgICAgICAvLyBFeHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICBpZiAoaWQgPT0gMSB8fCBpZCA9PSAyICYmIChpIDw9IGUgfHwgZSA8PSBUT19FWFBfTkVHKSkge1xyXG5cclxuICAgICAgICAgIC8vIEFwcGVuZCB6ZXJvcz9cclxuICAgICAgICAgIGZvciAoOyBsZW4gPCBpOyBzdHIgKz0gJzAnLCBsZW4rKyk7XHJcbiAgICAgICAgICBzdHIgPSB0b0V4cG9uZW50aWFsKHN0ciwgZSk7XHJcblxyXG4gICAgICAgIC8vIEZpeGVkLXBvaW50IG5vdGF0aW9uLlxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpIC09IG5lO1xyXG4gICAgICAgICAgc3RyID0gdG9GaXhlZFBvaW50KHN0ciwgZSwgJzAnKTtcclxuXHJcbiAgICAgICAgICAvLyBBcHBlbmQgemVyb3M/XHJcbiAgICAgICAgICBpZiAoZSArIDEgPiBsZW4pIHtcclxuICAgICAgICAgICAgaWYgKC0taSA+IDApIGZvciAoc3RyICs9ICcuJzsgaS0tOyBzdHIgKz0gJzAnKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGkgKz0gZSAtIGxlbjtcclxuICAgICAgICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgaWYgKGUgKyAxID09IGxlbikgc3RyICs9ICcuJztcclxuICAgICAgICAgICAgICBmb3IgKDsgaS0tOyBzdHIgKz0gJzAnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG4ucyA8IDAgJiYgYzAgPyAnLScgKyBzdHIgOiBzdHI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIEhhbmRsZSBCaWdOdW1iZXIubWF4IGFuZCBCaWdOdW1iZXIubWluLlxyXG4gICAgZnVuY3Rpb24gbWF4T3JNaW4oYXJncywgbWV0aG9kKSB7XHJcbiAgICAgIHZhciBuLFxyXG4gICAgICAgIGkgPSAxLFxyXG4gICAgICAgIG0gPSBuZXcgQmlnTnVtYmVyKGFyZ3NbMF0pO1xyXG5cclxuICAgICAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgbiA9IG5ldyBCaWdOdW1iZXIoYXJnc1tpXSk7XHJcblxyXG4gICAgICAgIC8vIElmIGFueSBudW1iZXIgaXMgTmFOLCByZXR1cm4gTmFOLlxyXG4gICAgICAgIGlmICghbi5zKSB7XHJcbiAgICAgICAgICBtID0gbjtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobWV0aG9kLmNhbGwobSwgbikpIHtcclxuICAgICAgICAgIG0gPSBuO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG07XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBTdHJpcCB0cmFpbGluZyB6ZXJvcywgY2FsY3VsYXRlIGJhc2UgMTAgZXhwb25lbnQgYW5kIGNoZWNrIGFnYWluc3QgTUlOX0VYUCBhbmQgTUFYX0VYUC5cclxuICAgICAqIENhbGxlZCBieSBtaW51cywgcGx1cyBhbmQgdGltZXMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG5vcm1hbGlzZShuLCBjLCBlKSB7XHJcbiAgICAgIHZhciBpID0gMSxcclxuICAgICAgICBqID0gYy5sZW5ndGg7XHJcblxyXG4gICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKDsgIWNbLS1qXTsgYy5wb3AoKSk7XHJcblxyXG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIGJhc2UgMTAgZXhwb25lbnQuIEZpcnN0IGdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBjWzBdLlxyXG4gICAgICBmb3IgKGogPSBjWzBdOyBqID49IDEwOyBqIC89IDEwLCBpKyspO1xyXG5cclxuICAgICAgLy8gT3ZlcmZsb3c/XHJcbiAgICAgIGlmICgoZSA9IGkgKyBlICogTE9HX0JBU0UgLSAxKSA+IE1BWF9FWFApIHtcclxuXHJcbiAgICAgICAgLy8gSW5maW5pdHkuXHJcbiAgICAgICAgbi5jID0gbi5lID0gbnVsbDtcclxuXHJcbiAgICAgIC8vIFVuZGVyZmxvdz9cclxuICAgICAgfSBlbHNlIGlmIChlIDwgTUlOX0VYUCkge1xyXG5cclxuICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgIG4uYyA9IFtuLmUgPSAwXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBuLmUgPSBlO1xyXG4gICAgICAgIG4uYyA9IGM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBuO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBIYW5kbGUgdmFsdWVzIHRoYXQgZmFpbCB0aGUgdmFsaWRpdHkgdGVzdCBpbiBCaWdOdW1iZXIuXHJcbiAgICBwYXJzZU51bWVyaWMgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgYmFzZVByZWZpeCA9IC9eKC0/KTAoW3hib10pKD89XFx3W1xcdy5dKiQpL2ksXHJcbiAgICAgICAgZG90QWZ0ZXIgPSAvXihbXi5dKylcXC4kLyxcclxuICAgICAgICBkb3RCZWZvcmUgPSAvXlxcLihbXi5dKykkLyxcclxuICAgICAgICBpc0luZmluaXR5T3JOYU4gPSAvXi0/KEluZmluaXR5fE5hTikkLyxcclxuICAgICAgICB3aGl0ZXNwYWNlT3JQbHVzID0gL15cXHMqXFwrKD89W1xcdy5dKXxeXFxzK3xcXHMrJC9nO1xyXG5cclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICh4LCBzdHIsIGlzTnVtLCBiKSB7XHJcbiAgICAgICAgdmFyIGJhc2UsXHJcbiAgICAgICAgICBzID0gaXNOdW0gPyBzdHIgOiBzdHIucmVwbGFjZSh3aGl0ZXNwYWNlT3JQbHVzLCAnJyk7XHJcblxyXG4gICAgICAgIC8vIE5vIGV4Y2VwdGlvbiBvbiDCsUluZmluaXR5IG9yIE5hTi5cclxuICAgICAgICBpZiAoaXNJbmZpbml0eU9yTmFOLnRlc3QocykpIHtcclxuICAgICAgICAgIHgucyA9IGlzTmFOKHMpID8gbnVsbCA6IHMgPCAwID8gLTEgOiAxO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIWlzTnVtKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBiYXNlUHJlZml4ID0gL14oLT8pMChbeGJvXSkoPz1cXHdbXFx3Ll0qJCkvaVxyXG4gICAgICAgICAgICBzID0gcy5yZXBsYWNlKGJhc2VQcmVmaXgsIGZ1bmN0aW9uIChtLCBwMSwgcDIpIHtcclxuICAgICAgICAgICAgICBiYXNlID0gKHAyID0gcDIudG9Mb3dlckNhc2UoKSkgPT0gJ3gnID8gMTYgOiBwMiA9PSAnYicgPyAyIDogODtcclxuICAgICAgICAgICAgICByZXR1cm4gIWIgfHwgYiA9PSBiYXNlID8gcDEgOiBtO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChiKSB7XHJcbiAgICAgICAgICAgICAgYmFzZSA9IGI7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEUuZy4gJzEuJyB0byAnMScsICcuMScgdG8gJzAuMSdcclxuICAgICAgICAgICAgICBzID0gcy5yZXBsYWNlKGRvdEFmdGVyLCAnJDEnKS5yZXBsYWNlKGRvdEJlZm9yZSwgJzAuJDEnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHN0ciAhPSBzKSByZXR1cm4gbmV3IEJpZ051bWJlcihzLCBiYXNlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gTm90IGEgbnVtYmVyOiB7bn0nXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gTm90IGEgYmFzZSB7Yn0gbnVtYmVyOiB7bn0nXHJcbiAgICAgICAgICBpZiAoQmlnTnVtYmVyLkRFQlVHKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ05vdCBhJyArIChiID8gJyBiYXNlICcgKyBiIDogJycpICsgJyBudW1iZXI6ICcgKyBzdHIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIE5hTlxyXG4gICAgICAgICAgeC5zID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHguYyA9IHguZSA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSb3VuZCB4IHRvIHNkIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLiBDaGVjayBmb3Igb3Zlci91bmRlci1mbG93LlxyXG4gICAgICogSWYgciBpcyB0cnV0aHksIGl0IGlzIGtub3duIHRoYXQgdGhlcmUgYXJlIG1vcmUgZGlnaXRzIGFmdGVyIHRoZSByb3VuZGluZyBkaWdpdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcm91bmQoeCwgc2QsIHJtLCByKSB7XHJcbiAgICAgIHZhciBkLCBpLCBqLCBrLCBuLCBuaSwgcmQsXHJcbiAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgcG93czEwID0gUE9XU19URU47XHJcblxyXG4gICAgICAvLyBpZiB4IGlzIG5vdCBJbmZpbml0eSBvciBOYU4uLi5cclxuICAgICAgaWYgKHhjKSB7XHJcblxyXG4gICAgICAgIC8vIHJkIGlzIHRoZSByb3VuZGluZyBkaWdpdCwgaS5lLiB0aGUgZGlnaXQgYWZ0ZXIgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgLy8gbiBpcyBhIGJhc2UgMWUxNCBudW1iZXIsIHRoZSB2YWx1ZSBvZiB0aGUgZWxlbWVudCBvZiBhcnJheSB4LmMgY29udGFpbmluZyByZC5cclxuICAgICAgICAvLyBuaSBpcyB0aGUgaW5kZXggb2YgbiB3aXRoaW4geC5jLlxyXG4gICAgICAgIC8vIGQgaXMgdGhlIG51bWJlciBvZiBkaWdpdHMgb2Ygbi5cclxuICAgICAgICAvLyBpIGlzIHRoZSBpbmRleCBvZiByZCB3aXRoaW4gbiBpbmNsdWRpbmcgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgICAvLyBqIGlzIHRoZSBhY3R1YWwgaW5kZXggb2YgcmQgd2l0aGluIG4gKGlmIDwgMCwgcmQgaXMgYSBsZWFkaW5nIHplcm8pLlxyXG4gICAgICAgIG91dDoge1xyXG5cclxuICAgICAgICAgIC8vIEdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudCBvZiB4Yy5cclxuICAgICAgICAgIGZvciAoZCA9IDEsIGsgPSB4Y1swXTsgayA+PSAxMDsgayAvPSAxMCwgZCsrKTtcclxuICAgICAgICAgIGkgPSBzZCAtIGQ7XHJcblxyXG4gICAgICAgICAgLy8gSWYgdGhlIHJvdW5kaW5nIGRpZ2l0IGlzIGluIHRoZSBmaXJzdCBlbGVtZW50IG9mIHhjLi4uXHJcbiAgICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgICAgaSArPSBMT0dfQkFTRTtcclxuICAgICAgICAgICAgaiA9IHNkO1xyXG4gICAgICAgICAgICBuID0geGNbbmkgPSAwXTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgcm91bmRpbmcgZGlnaXQgYXQgaW5kZXggaiBvZiBuLlxyXG4gICAgICAgICAgICByZCA9IG4gLyBwb3dzMTBbZCAtIGogLSAxXSAlIDEwIHwgMDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5pID0gbWF0aGNlaWwoKGkgKyAxKSAvIExPR19CQVNFKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChuaSA+PSB4Yy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBOZWVkZWQgYnkgc3FydC5cclxuICAgICAgICAgICAgICAgIGZvciAoOyB4Yy5sZW5ndGggPD0gbmk7IHhjLnB1c2goMCkpO1xyXG4gICAgICAgICAgICAgICAgbiA9IHJkID0gMDtcclxuICAgICAgICAgICAgICAgIGQgPSAxO1xyXG4gICAgICAgICAgICAgICAgaSAlPSBMT0dfQkFTRTtcclxuICAgICAgICAgICAgICAgIGogPSBpIC0gTE9HX0JBU0UgKyAxO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBicmVhayBvdXQ7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIG4gPSBrID0geGNbbmldO1xyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIG51bWJlciBvZiBkaWdpdHMgb2Ygbi5cclxuICAgICAgICAgICAgICBmb3IgKGQgPSAxOyBrID49IDEwOyBrIC89IDEwLCBkKyspO1xyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIGluZGV4IG9mIHJkIHdpdGhpbiBuLlxyXG4gICAgICAgICAgICAgIGkgJT0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEdldCB0aGUgaW5kZXggb2YgcmQgd2l0aGluIG4sIGFkanVzdGVkIGZvciBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgICAgICAgIC8vIFRoZSBudW1iZXIgb2YgbGVhZGluZyB6ZXJvcyBvZiBuIGlzIGdpdmVuIGJ5IExPR19CQVNFIC0gZC5cclxuICAgICAgICAgICAgICBqID0gaSAtIExPR19CQVNFICsgZDtcclxuXHJcbiAgICAgICAgICAgICAgLy8gR2V0IHRoZSByb3VuZGluZyBkaWdpdCBhdCBpbmRleCBqIG9mIG4uXHJcbiAgICAgICAgICAgICAgcmQgPSBqIDwgMCA/IDAgOiBuIC8gcG93czEwW2QgLSBqIC0gMV0gJSAxMCB8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByID0gciB8fCBzZCA8IDAgfHxcclxuXHJcbiAgICAgICAgICAvLyBBcmUgdGhlcmUgYW55IG5vbi16ZXJvIGRpZ2l0cyBhZnRlciB0aGUgcm91bmRpbmcgZGlnaXQ/XHJcbiAgICAgICAgICAvLyBUaGUgZXhwcmVzc2lvbiAgbiAlIHBvd3MxMFtkIC0gaiAtIDFdICByZXR1cm5zIGFsbCBkaWdpdHMgb2YgbiB0byB0aGUgcmlnaHRcclxuICAgICAgICAgIC8vIG9mIHRoZSBkaWdpdCBhdCBqLCBlLmcuIGlmIG4gaXMgOTA4NzE0IGFuZCBqIGlzIDIsIHRoZSBleHByZXNzaW9uIGdpdmVzIDcxNC5cclxuICAgICAgICAgICB4Y1tuaSArIDFdICE9IG51bGwgfHwgKGogPCAwID8gbiA6IG4gJSBwb3dzMTBbZCAtIGogLSAxXSk7XHJcblxyXG4gICAgICAgICAgciA9IHJtIDwgNFxyXG4gICAgICAgICAgID8gKHJkIHx8IHIpICYmIChybSA9PSAwIHx8IHJtID09ICh4LnMgPCAwID8gMyA6IDIpKVxyXG4gICAgICAgICAgIDogcmQgPiA1IHx8IHJkID09IDUgJiYgKHJtID09IDQgfHwgciB8fCBybSA9PSA2ICYmXHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBkaWdpdCB0byB0aGUgbGVmdCBvZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgb2RkLlxyXG4gICAgICAgICAgICAoKGkgPiAwID8gaiA+IDAgPyBuIC8gcG93czEwW2QgLSBqXSA6IDAgOiB4Y1tuaSAtIDFdKSAlIDEwKSAmIDEgfHxcclxuICAgICAgICAgICAgIHJtID09ICh4LnMgPCAwID8gOCA6IDcpKTtcclxuXHJcbiAgICAgICAgICBpZiAoc2QgPCAxIHx8ICF4Y1swXSkge1xyXG4gICAgICAgICAgICB4Yy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQ29udmVydCBzZCB0byBkZWNpbWFsIHBsYWNlcy5cclxuICAgICAgICAgICAgICBzZCAtPSB4LmUgKyAxO1xyXG5cclxuICAgICAgICAgICAgICAvLyAxLCAwLjEsIDAuMDEsIDAuMDAxLCAwLjAwMDEgZXRjLlxyXG4gICAgICAgICAgICAgIHhjWzBdID0gcG93czEwWyhMT0dfQkFTRSAtIHNkICUgTE9HX0JBU0UpICUgTE9HX0JBU0VdO1xyXG4gICAgICAgICAgICAgIHguZSA9IC1zZCB8fCAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgICAgIHhjWzBdID0geC5lID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIGV4Y2VzcyBkaWdpdHMuXHJcbiAgICAgICAgICBpZiAoaSA9PSAwKSB7XHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IG5pO1xyXG4gICAgICAgICAgICBrID0gMTtcclxuICAgICAgICAgICAgbmktLTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IG5pICsgMTtcclxuICAgICAgICAgICAgayA9IHBvd3MxMFtMT0dfQkFTRSAtIGldO1xyXG5cclxuICAgICAgICAgICAgLy8gRS5nLiA1NjcwMCBiZWNvbWVzIDU2MDAwIGlmIDcgaXMgdGhlIHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICAgICAgICAvLyBqID4gMCBtZWFucyBpID4gbnVtYmVyIG9mIGxlYWRpbmcgemVyb3Mgb2Ygbi5cclxuICAgICAgICAgICAgeGNbbmldID0gaiA+IDAgPyBtYXRoZmxvb3IobiAvIHBvd3MxMFtkIC0gal0gJSBwb3dzMTBbal0pICogayA6IDA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUm91bmQgdXA/XHJcbiAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IDspIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgdGhlIGRpZ2l0IHRvIGJlIHJvdW5kZWQgdXAgaXMgaW4gdGhlIGZpcnN0IGVsZW1lbnQgb2YgeGMuLi5cclxuICAgICAgICAgICAgICBpZiAobmkgPT0gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGkgd2lsbCBiZSB0aGUgbGVuZ3RoIG9mIHhjWzBdIGJlZm9yZSBrIGlzIGFkZGVkLlxyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMSwgaiA9IHhjWzBdOyBqID49IDEwOyBqIC89IDEwLCBpKyspO1xyXG4gICAgICAgICAgICAgICAgaiA9IHhjWzBdICs9IGs7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAxOyBqID49IDEwOyBqIC89IDEwLCBrKyspO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGlmIGkgIT0gayB0aGUgbGVuZ3RoIGhhcyBpbmNyZWFzZWQuXHJcbiAgICAgICAgICAgICAgICBpZiAoaSAhPSBrKSB7XHJcbiAgICAgICAgICAgICAgICAgIHguZSsrO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoeGNbMF0gPT0gQkFTRSkgeGNbMF0gPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB4Y1tuaV0gKz0gaztcclxuICAgICAgICAgICAgICAgIGlmICh4Y1tuaV0gIT0gQkFTRSkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB4Y1tuaS0tXSA9IDA7XHJcbiAgICAgICAgICAgICAgICBrID0gMTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICBmb3IgKGkgPSB4Yy5sZW5ndGg7IHhjWy0taV0gPT09IDA7IHhjLnBvcCgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE92ZXJmbG93PyBJbmZpbml0eS5cclxuICAgICAgICBpZiAoeC5lID4gTUFYX0VYUCkge1xyXG4gICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gVW5kZXJmbG93PyBaZXJvLlxyXG4gICAgICAgIH0gZWxzZSBpZiAoeC5lIDwgTUlOX0VYUCkge1xyXG4gICAgICAgICAgeC5jID0gW3guZSA9IDBdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHg7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHZhbHVlT2Yobikge1xyXG4gICAgICB2YXIgc3RyLFxyXG4gICAgICAgIGUgPSBuLmU7XHJcblxyXG4gICAgICBpZiAoZSA9PT0gbnVsbCkgcmV0dXJuIG4udG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcobi5jKTtcclxuXHJcbiAgICAgIHN0ciA9IGUgPD0gVE9fRVhQX05FRyB8fCBlID49IFRPX0VYUF9QT1NcclxuICAgICAgICA/IHRvRXhwb25lbnRpYWwoc3RyLCBlKVxyXG4gICAgICAgIDogdG9GaXhlZFBvaW50KHN0ciwgZSwgJzAnKTtcclxuXHJcbiAgICAgIHJldHVybiBuLnMgPCAwID8gJy0nICsgc3RyIDogc3RyO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBQUk9UT1RZUEUvSU5TVEFOQ0UgTUVUSE9EU1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgYWJzb2x1dGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIuXHJcbiAgICAgKi9cclxuICAgIFAuYWJzb2x1dGVWYWx1ZSA9IFAuYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgeCA9IG5ldyBCaWdOdW1iZXIodGhpcyk7XHJcbiAgICAgIGlmICh4LnMgPCAwKSB4LnMgPSAxO1xyXG4gICAgICByZXR1cm4geDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm5cclxuICAgICAqICAgMSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgKiAgIC0xIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqICAgMCBpZiB0aGV5IGhhdmUgdGhlIHNhbWUgdmFsdWUsXHJcbiAgICAgKiAgIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIGVpdGhlciBpcyBOYU4uXHJcbiAgICAgKi9cclxuICAgIFAuY29tcGFyZWRUbyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIElmIGRwIGlzIHVuZGVmaW5lZCBvciBudWxsIG9yIHRydWUgb3IgZmFsc2UsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIG9mIHRoZVxyXG4gICAgICogdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIMKxSW5maW5pdHkgb3IgTmFOLlxyXG4gICAgICpcclxuICAgICAqIE90aGVyd2lzZSwgaWYgZHAgaXMgYSBudW1iZXIsIHJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXNcclxuICAgICAqIEJpZ051bWJlciByb3VuZGVkIHRvIGEgbWF4aW11bSBvZiBkcCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvclxyXG4gICAgICogUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXM6IGludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC5kZWNpbWFsUGxhY2VzID0gUC5kcCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICAgICAgdmFyIGMsIG4sIHYsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICBpZiAoZHAgIT0gbnVsbCkge1xyXG4gICAgICAgIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG4gICAgICAgIGlmIChybSA9PSBudWxsKSBybSA9IFJPVU5ESU5HX01PREU7XHJcbiAgICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcblxyXG4gICAgICAgIHJldHVybiByb3VuZChuZXcgQmlnTnVtYmVyKHgpLCBkcCArIHguZSArIDEsIHJtKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCEoYyA9IHguYykpIHJldHVybiBudWxsO1xyXG4gICAgICBuID0gKCh2ID0gYy5sZW5ndGggLSAxKSAtIGJpdEZsb29yKHRoaXMuZSAvIExPR19CQVNFKSkgKiBMT0dfQkFTRTtcclxuXHJcbiAgICAgIC8vIFN1YnRyYWN0IHRoZSBudW1iZXIgb2YgdHJhaWxpbmcgemVyb3Mgb2YgdGhlIGxhc3QgbnVtYmVyLlxyXG4gICAgICBpZiAodiA9IGNbdl0pIGZvciAoOyB2ICUgMTAgPT0gMDsgdiAvPSAxMCwgbi0tKTtcclxuICAgICAgaWYgKG4gPCAwKSBuID0gMDtcclxuXHJcbiAgICAgIHJldHVybiBuO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBuIC8gMCA9IElcclxuICAgICAqICBuIC8gTiA9IE5cclxuICAgICAqICBuIC8gSSA9IDBcclxuICAgICAqICAwIC8gbiA9IDBcclxuICAgICAqICAwIC8gMCA9IE5cclxuICAgICAqICAwIC8gTiA9IE5cclxuICAgICAqICAwIC8gSSA9IDBcclxuICAgICAqICBOIC8gbiA9IE5cclxuICAgICAqICBOIC8gMCA9IE5cclxuICAgICAqICBOIC8gTiA9IE5cclxuICAgICAqICBOIC8gSSA9IE5cclxuICAgICAqICBJIC8gbiA9IElcclxuICAgICAqICBJIC8gMCA9IElcclxuICAgICAqICBJIC8gTiA9IE5cclxuICAgICAqICBJIC8gSSA9IE5cclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBkaXZpZGVkIGJ5IHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLCByb3VuZGVkIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqL1xyXG4gICAgUC5kaXZpZGVkQnkgPSBQLmRpdiA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBkaXYodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSwgREVDSU1BTF9QTEFDRVMsIFJPVU5ESU5HX01PREUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIGludGVnZXIgcGFydCBvZiBkaXZpZGluZyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICogQmlnTnVtYmVyIGJ5IHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgKi9cclxuICAgIFAuZGl2aWRlZFRvSW50ZWdlckJ5ID0gUC5pZGl2ID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGRpdih0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpLCAwLCAxKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGV4cG9uZW50aWF0ZWQgYnkgbi5cclxuICAgICAqXHJcbiAgICAgKiBJZiBtIGlzIHByZXNlbnQsIHJldHVybiB0aGUgcmVzdWx0IG1vZHVsbyBtLlxyXG4gICAgICogSWYgbiBpcyBuZWdhdGl2ZSByb3VuZCBhY2NvcmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYW5kIFJPVU5ESU5HX01PREUuXHJcbiAgICAgKiBJZiBQT1dfUFJFQ0lTSU9OIGlzIG5vbi16ZXJvIGFuZCBtIGlzIG5vdCBwcmVzZW50LCByb3VuZCB0byBQT1dfUFJFQ0lTSU9OIHVzaW5nIFJPVU5ESU5HX01PREUuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIG1vZHVsYXIgcG93ZXIgb3BlcmF0aW9uIHdvcmtzIGVmZmljaWVudGx5IHdoZW4geCwgbiwgYW5kIG0gYXJlIGludGVnZXJzLCBvdGhlcndpc2UgaXRcclxuICAgICAqIGlzIGVxdWl2YWxlbnQgdG8gY2FsY3VsYXRpbmcgeC5leHBvbmVudGlhdGVkQnkobikubW9kdWxvKG0pIHdpdGggYSBQT1dfUFJFQ0lTSU9OIG9mIDAuXHJcbiAgICAgKlxyXG4gICAgICogbiB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IFRoZSBleHBvbmVudC4gQW4gaW50ZWdlci5cclxuICAgICAqIFttXSB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IFRoZSBtb2R1bHVzLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBFeHBvbmVudCBub3QgYW4gaW50ZWdlcjoge259J1xyXG4gICAgICovXHJcbiAgICBQLmV4cG9uZW50aWF0ZWRCeSA9IFAucG93ID0gZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgdmFyIGhhbGYsIGlzTW9kRXhwLCBpLCBrLCBtb3JlLCBuSXNCaWcsIG5Jc05lZywgbklzT2RkLCB5LFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgbiA9IG5ldyBCaWdOdW1iZXIobik7XHJcblxyXG4gICAgICAvLyBBbGxvdyBOYU4gYW5kIMKxSW5maW5pdHksIGJ1dCBub3Qgb3RoZXIgbm9uLWludGVnZXJzLlxyXG4gICAgICBpZiAobi5jICYmICFuLmlzSW50ZWdlcigpKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdFeHBvbmVudCBub3QgYW4gaW50ZWdlcjogJyArIHZhbHVlT2YobikpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobSAhPSBudWxsKSBtID0gbmV3IEJpZ051bWJlcihtKTtcclxuXHJcbiAgICAgIC8vIEV4cG9uZW50IG9mIE1BWF9TQUZFX0lOVEVHRVIgaXMgMTUuXHJcbiAgICAgIG5Jc0JpZyA9IG4uZSA+IDE0O1xyXG5cclxuICAgICAgLy8gSWYgeCBpcyBOYU4sIMKxSW5maW5pdHksIMKxMCBvciDCsTEsIG9yIG4gaXMgwrFJbmZpbml0eSwgTmFOIG9yIMKxMC5cclxuICAgICAgaWYgKCF4LmMgfHwgIXguY1swXSB8fCB4LmNbMF0gPT0gMSAmJiAheC5lICYmIHguYy5sZW5ndGggPT0gMSB8fCAhbi5jIHx8ICFuLmNbMF0pIHtcclxuXHJcbiAgICAgICAgLy8gVGhlIHNpZ24gb2YgdGhlIHJlc3VsdCBvZiBwb3cgd2hlbiB4IGlzIG5lZ2F0aXZlIGRlcGVuZHMgb24gdGhlIGV2ZW5uZXNzIG9mIG4uXHJcbiAgICAgICAgLy8gSWYgK24gb3ZlcmZsb3dzIHRvIMKxSW5maW5pdHksIHRoZSBldmVubmVzcyBvZiBuIHdvdWxkIGJlIG5vdCBiZSBrbm93bi5cclxuICAgICAgICB5ID0gbmV3IEJpZ051bWJlcihNYXRoLnBvdygrdmFsdWVPZih4KSwgbklzQmlnID8gMiAtIGlzT2RkKG4pIDogK3ZhbHVlT2YobikpKTtcclxuICAgICAgICByZXR1cm4gbSA/IHkubW9kKG0pIDogeTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbklzTmVnID0gbi5zIDwgMDtcclxuXHJcbiAgICAgIGlmIChtKSB7XHJcblxyXG4gICAgICAgIC8vIHggJSBtIHJldHVybnMgTmFOIGlmIGFicyhtKSBpcyB6ZXJvLCBvciBtIGlzIE5hTi5cclxuICAgICAgICBpZiAobS5jID8gIW0uY1swXSA6ICFtLnMpIHJldHVybiBuZXcgQmlnTnVtYmVyKE5hTik7XHJcblxyXG4gICAgICAgIGlzTW9kRXhwID0gIW5Jc05lZyAmJiB4LmlzSW50ZWdlcigpICYmIG0uaXNJbnRlZ2VyKCk7XHJcblxyXG4gICAgICAgIGlmIChpc01vZEV4cCkgeCA9IHgubW9kKG0pO1xyXG5cclxuICAgICAgLy8gT3ZlcmZsb3cgdG8gwrFJbmZpbml0eTogPj0yKioxZTEwIG9yID49MS4wMDAwMDI0KioxZTE1LlxyXG4gICAgICAvLyBVbmRlcmZsb3cgdG8gwrEwOiA8PTAuNzkqKjFlMTAgb3IgPD0wLjk5OTk5NzUqKjFlMTUuXHJcbiAgICAgIH0gZWxzZSBpZiAobi5lID4gOSAmJiAoeC5lID4gMCB8fCB4LmUgPCAtMSB8fCAoeC5lID09IDBcclxuICAgICAgICAvLyBbMSwgMjQwMDAwMDAwXVxyXG4gICAgICAgID8geC5jWzBdID4gMSB8fCBuSXNCaWcgJiYgeC5jWzFdID49IDI0ZTdcclxuICAgICAgICAvLyBbODAwMDAwMDAwMDAwMDBdICBbOTk5OTk3NTAwMDAwMDBdXHJcbiAgICAgICAgOiB4LmNbMF0gPCA4ZTEzIHx8IG5Jc0JpZyAmJiB4LmNbMF0gPD0gOTk5OTk3NWU3KSkpIHtcclxuXHJcbiAgICAgICAgLy8gSWYgeCBpcyBuZWdhdGl2ZSBhbmQgbiBpcyBvZGQsIGsgPSAtMCwgZWxzZSBrID0gMC5cclxuICAgICAgICBrID0geC5zIDwgMCAmJiBpc09kZChuKSA/IC0wIDogMDtcclxuXHJcbiAgICAgICAgLy8gSWYgeCA+PSAxLCBrID0gwrFJbmZpbml0eS5cclxuICAgICAgICBpZiAoeC5lID4gLTEpIGsgPSAxIC8gaztcclxuXHJcbiAgICAgICAgLy8gSWYgbiBpcyBuZWdhdGl2ZSByZXR1cm4gwrEwLCBlbHNlIHJldHVybiDCsUluZmluaXR5LlxyXG4gICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKG5Jc05lZyA/IDEgLyBrIDogayk7XHJcblxyXG4gICAgICB9IGVsc2UgaWYgKFBPV19QUkVDSVNJT04pIHtcclxuXHJcbiAgICAgICAgLy8gVHJ1bmNhdGluZyBlYWNoIGNvZWZmaWNpZW50IGFycmF5IHRvIGEgbGVuZ3RoIG9mIGsgYWZ0ZXIgZWFjaCBtdWx0aXBsaWNhdGlvblxyXG4gICAgICAgIC8vIGVxdWF0ZXMgdG8gdHJ1bmNhdGluZyBzaWduaWZpY2FudCBkaWdpdHMgdG8gUE9XX1BSRUNJU0lPTiArIFsyOCwgNDFdLFxyXG4gICAgICAgIC8vIGkuZS4gdGhlcmUgd2lsbCBiZSBhIG1pbmltdW0gb2YgMjggZ3VhcmQgZGlnaXRzIHJldGFpbmVkLlxyXG4gICAgICAgIGsgPSBtYXRoY2VpbChQT1dfUFJFQ0lTSU9OIC8gTE9HX0JBU0UgKyAyKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG5Jc0JpZykge1xyXG4gICAgICAgIGhhbGYgPSBuZXcgQmlnTnVtYmVyKDAuNSk7XHJcbiAgICAgICAgaWYgKG5Jc05lZykgbi5zID0gMTtcclxuICAgICAgICBuSXNPZGQgPSBpc09kZChuKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpID0gTWF0aC5hYnMoK3ZhbHVlT2YobikpO1xyXG4gICAgICAgIG5Jc09kZCA9IGkgJSAyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcihPTkUpO1xyXG5cclxuICAgICAgLy8gUGVyZm9ybXMgNTQgbG9vcCBpdGVyYXRpb25zIGZvciBuIG9mIDkwMDcxOTkyNTQ3NDA5OTEuXHJcbiAgICAgIGZvciAoOyA7KSB7XHJcblxyXG4gICAgICAgIGlmIChuSXNPZGQpIHtcclxuICAgICAgICAgIHkgPSB5LnRpbWVzKHgpO1xyXG4gICAgICAgICAgaWYgKCF5LmMpIGJyZWFrO1xyXG5cclxuICAgICAgICAgIGlmIChrKSB7XHJcbiAgICAgICAgICAgIGlmICh5LmMubGVuZ3RoID4gaykgeS5jLmxlbmd0aCA9IGs7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGlzTW9kRXhwKSB7XHJcbiAgICAgICAgICAgIHkgPSB5Lm1vZChtKTsgICAgLy95ID0geS5taW51cyhkaXYoeSwgbSwgMCwgTU9EVUxPX01PREUpLnRpbWVzKG0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpKSB7XHJcbiAgICAgICAgICBpID0gbWF0aGZsb29yKGkgLyAyKTtcclxuICAgICAgICAgIGlmIChpID09PSAwKSBicmVhaztcclxuICAgICAgICAgIG5Jc09kZCA9IGkgJSAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBuID0gbi50aW1lcyhoYWxmKTtcclxuICAgICAgICAgIHJvdW5kKG4sIG4uZSArIDEsIDEpO1xyXG5cclxuICAgICAgICAgIGlmIChuLmUgPiAxNCkge1xyXG4gICAgICAgICAgICBuSXNPZGQgPSBpc09kZChuKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGkgPSArdmFsdWVPZihuKTtcclxuICAgICAgICAgICAgaWYgKGkgPT09IDApIGJyZWFrO1xyXG4gICAgICAgICAgICBuSXNPZGQgPSBpICUgMjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHggPSB4LnRpbWVzKHgpO1xyXG5cclxuICAgICAgICBpZiAoaykge1xyXG4gICAgICAgICAgaWYgKHguYyAmJiB4LmMubGVuZ3RoID4gaykgeC5jLmxlbmd0aCA9IGs7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpc01vZEV4cCkge1xyXG4gICAgICAgICAgeCA9IHgubW9kKG0pOyAgICAvL3ggPSB4Lm1pbnVzKGRpdih4LCBtLCAwLCBNT0RVTE9fTU9ERSkudGltZXMobSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGlzTW9kRXhwKSByZXR1cm4geTtcclxuICAgICAgaWYgKG5Jc05lZykgeSA9IE9ORS5kaXYoeSk7XHJcblxyXG4gICAgICByZXR1cm4gbSA/IHkubW9kKG0pIDogayA/IHJvdW5kKHksIFBPV19QUkVDSVNJT04sIFJPVU5ESU5HX01PREUsIG1vcmUpIDogeTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciByb3VuZGVkIHRvIGFuIGludGVnZXJcclxuICAgICAqIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIFJPVU5ESU5HX01PREUgaWYgcm0gaXMgb21pdHRlZC5cclxuICAgICAqXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtybX0nXHJcbiAgICAgKi9cclxuICAgIFAuaW50ZWdlclZhbHVlID0gZnVuY3Rpb24gKHJtKSB7XHJcbiAgICAgIHZhciBuID0gbmV3IEJpZ051bWJlcih0aGlzKTtcclxuICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcbiAgICAgIHJldHVybiByb3VuZChuLCBuLmUgKyAxLCBybSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgKiBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzRXF1YWxUbyA9IFAuZXEgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gY29tcGFyZSh0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpKSA9PT0gMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgYSBmaW5pdGUgbnVtYmVyLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzRmluaXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gISF0aGlzLmM7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGdyZWF0ZXIgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc0dyZWF0ZXJUaGFuID0gUC5ndCA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpID4gMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzR3JlYXRlclRoYW5PckVxdWFsVG8gPSBQLmd0ZSA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiAoYiA9IGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSkpID09PSAxIHx8IGIgPT09IDA7XHJcblxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBhbiBpbnRlZ2VyLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzSW50ZWdlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICEhdGhpcy5jICYmIGJpdEZsb29yKHRoaXMuZSAvIExPR19CQVNFKSA+IHRoaXMuYy5sZW5ndGggLSAyO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNMZXNzVGhhbiA9IFAubHQgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gY29tcGFyZSh0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpKSA8IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgdmFsdWUgb2ZcclxuICAgICAqIEJpZ051bWJlcih5LCBiKSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc0xlc3NUaGFuT3JFcXVhbFRvID0gUC5sdGUgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gKGIgPSBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpKSA9PT0gLTEgfHwgYiA9PT0gMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgTmFOLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzTmFOID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gIXRoaXMucztcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgbmVnYXRpdmUsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNOZWdhdGl2ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucyA8IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIHBvc2l0aXZlLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzUG9zaXRpdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnMgPiAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyAwIG9yIC0wLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzWmVybyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICEhdGhpcy5jICYmIHRoaXMuY1swXSA9PSAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBuIC0gMCA9IG5cclxuICAgICAqICBuIC0gTiA9IE5cclxuICAgICAqICBuIC0gSSA9IC1JXHJcbiAgICAgKiAgMCAtIG4gPSAtblxyXG4gICAgICogIDAgLSAwID0gMFxyXG4gICAgICogIDAgLSBOID0gTlxyXG4gICAgICogIDAgLSBJID0gLUlcclxuICAgICAqICBOIC0gbiA9IE5cclxuICAgICAqICBOIC0gMCA9IE5cclxuICAgICAqICBOIC0gTiA9IE5cclxuICAgICAqICBOIC0gSSA9IE5cclxuICAgICAqICBJIC0gbiA9IElcclxuICAgICAqICBJIC0gMCA9IElcclxuICAgICAqICBJIC0gTiA9IE5cclxuICAgICAqICBJIC0gSSA9IE5cclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBtaW51cyB0aGUgdmFsdWUgb2ZcclxuICAgICAqIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAqL1xyXG4gICAgUC5taW51cyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciBpLCBqLCB0LCB4TFR5LFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIGEgPSB4LnM7XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcih5LCBiKTtcclxuICAgICAgYiA9IHkucztcclxuXHJcbiAgICAgIC8vIEVpdGhlciBOYU4/XHJcbiAgICAgIGlmICghYSB8fCAhYikgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgICAgaWYgKGEgIT0gYikge1xyXG4gICAgICAgIHkucyA9IC1iO1xyXG4gICAgICAgIHJldHVybiB4LnBsdXMoeSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciB4ZSA9IHguZSAvIExPR19CQVNFLFxyXG4gICAgICAgIHllID0geS5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICBpZiAoIXhlIHx8ICF5ZSkge1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgSW5maW5pdHk/XHJcbiAgICAgICAgaWYgKCF4YyB8fCAheWMpIHJldHVybiB4YyA/ICh5LnMgPSAtYiwgeSkgOiBuZXcgQmlnTnVtYmVyKHljID8geCA6IE5hTik7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSB7XHJcblxyXG4gICAgICAgICAgLy8gUmV0dXJuIHkgaWYgeSBpcyBub24temVybywgeCBpZiB4IGlzIG5vbi16ZXJvLCBvciB6ZXJvIGlmIGJvdGggYXJlIHplcm8uXHJcbiAgICAgICAgICByZXR1cm4geWNbMF0gPyAoeS5zID0gLWIsIHkpIDogbmV3IEJpZ051bWJlcih4Y1swXSA/IHggOlxyXG5cclxuICAgICAgICAgICAvLyBJRUVFIDc1NCAoMjAwOCkgNi4zOiBuIC0gbiA9IC0wIHdoZW4gcm91bmRpbmcgdG8gLUluZmluaXR5XHJcbiAgICAgICAgICAgUk9VTkRJTkdfTU9ERSA9PSAzID8gLTAgOiAwKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHhlID0gYml0Rmxvb3IoeGUpO1xyXG4gICAgICB5ZSA9IGJpdEZsb29yKHllKTtcclxuICAgICAgeGMgPSB4Yy5zbGljZSgpO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGlzIHRoZSBiaWdnZXIgbnVtYmVyLlxyXG4gICAgICBpZiAoYSA9IHhlIC0geWUpIHtcclxuXHJcbiAgICAgICAgaWYgKHhMVHkgPSBhIDwgMCkge1xyXG4gICAgICAgICAgYSA9IC1hO1xyXG4gICAgICAgICAgdCA9IHhjO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdC5yZXZlcnNlKCk7XHJcblxyXG4gICAgICAgIC8vIFByZXBlbmQgemVyb3MgdG8gZXF1YWxpc2UgZXhwb25lbnRzLlxyXG4gICAgICAgIGZvciAoYiA9IGE7IGItLTsgdC5wdXNoKDApKTtcclxuICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnRzIGVxdWFsLiBDaGVjayBkaWdpdCBieSBkaWdpdC5cclxuICAgICAgICBqID0gKHhMVHkgPSAoYSA9IHhjLmxlbmd0aCkgPCAoYiA9IHljLmxlbmd0aCkpID8gYSA6IGI7XHJcblxyXG4gICAgICAgIGZvciAoYSA9IGIgPSAwOyBiIDwgajsgYisrKSB7XHJcblxyXG4gICAgICAgICAgaWYgKHhjW2JdICE9IHljW2JdKSB7XHJcbiAgICAgICAgICAgIHhMVHkgPSB4Y1tiXSA8IHljW2JdO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHggPCB5PyBQb2ludCB4YyB0byB0aGUgYXJyYXkgb2YgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgIGlmICh4TFR5KSB0ID0geGMsIHhjID0geWMsIHljID0gdCwgeS5zID0gLXkucztcclxuXHJcbiAgICAgIGIgPSAoaiA9IHljLmxlbmd0aCkgLSAoaSA9IHhjLmxlbmd0aCk7XHJcblxyXG4gICAgICAvLyBBcHBlbmQgemVyb3MgdG8geGMgaWYgc2hvcnRlci5cclxuICAgICAgLy8gTm8gbmVlZCB0byBhZGQgemVyb3MgdG8geWMgaWYgc2hvcnRlciBhcyBzdWJ0cmFjdCBvbmx5IG5lZWRzIHRvIHN0YXJ0IGF0IHljLmxlbmd0aC5cclxuICAgICAgaWYgKGIgPiAwKSBmb3IgKDsgYi0tOyB4Y1tpKytdID0gMCk7XHJcbiAgICAgIGIgPSBCQVNFIC0gMTtcclxuXHJcbiAgICAgIC8vIFN1YnRyYWN0IHljIGZyb20geGMuXHJcbiAgICAgIGZvciAoOyBqID4gYTspIHtcclxuXHJcbiAgICAgICAgaWYgKHhjWy0tal0gPCB5Y1tqXSkge1xyXG4gICAgICAgICAgZm9yIChpID0gajsgaSAmJiAheGNbLS1pXTsgeGNbaV0gPSBiKTtcclxuICAgICAgICAgIC0teGNbaV07XHJcbiAgICAgICAgICB4Y1tqXSArPSBCQVNFO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeGNbal0gLT0geWNbal07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zIGFuZCBhZGp1c3QgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgIGZvciAoOyB4Y1swXSA9PSAwOyB4Yy5zcGxpY2UoMCwgMSksIC0teWUpO1xyXG5cclxuICAgICAgLy8gWmVybz9cclxuICAgICAgaWYgKCF4Y1swXSkge1xyXG5cclxuICAgICAgICAvLyBGb2xsb3dpbmcgSUVFRSA3NTQgKDIwMDgpIDYuMyxcclxuICAgICAgICAvLyBuIC0gbiA9ICswICBidXQgIG4gLSBuID0gLTAgIHdoZW4gcm91bmRpbmcgdG93YXJkcyAtSW5maW5pdHkuXHJcbiAgICAgICAgeS5zID0gUk9VTkRJTkdfTU9ERSA9PSAzID8gLTEgOiAxO1xyXG4gICAgICAgIHkuYyA9IFt5LmUgPSAwXTtcclxuICAgICAgICByZXR1cm4geTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgSW5maW5pdHkgYXMgK3ggLSAreSAhPSBJbmZpbml0eSAmJiAteCAtIC15ICE9IEluZmluaXR5XHJcbiAgICAgIC8vIGZvciBmaW5pdGUgeCBhbmQgeS5cclxuICAgICAgcmV0dXJuIG5vcm1hbGlzZSh5LCB4YywgeWUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICAgbiAlIDAgPSAgTlxyXG4gICAgICogICBuICUgTiA9ICBOXHJcbiAgICAgKiAgIG4gJSBJID0gIG5cclxuICAgICAqICAgMCAlIG4gPSAgMFxyXG4gICAgICogIC0wICUgbiA9IC0wXHJcbiAgICAgKiAgIDAgJSAwID0gIE5cclxuICAgICAqICAgMCAlIE4gPSAgTlxyXG4gICAgICogICAwICUgSSA9ICAwXHJcbiAgICAgKiAgIE4gJSBuID0gIE5cclxuICAgICAqICAgTiAlIDAgPSAgTlxyXG4gICAgICogICBOICUgTiA9ICBOXHJcbiAgICAgKiAgIE4gJSBJID0gIE5cclxuICAgICAqICAgSSAlIG4gPSAgTlxyXG4gICAgICogICBJICUgMCA9ICBOXHJcbiAgICAgKiAgIEkgJSBOID0gIE5cclxuICAgICAqICAgSSAlIEkgPSAgTlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG1vZHVsbyB0aGUgdmFsdWUgb2ZcclxuICAgICAqIEJpZ051bWJlcih5LCBiKS4gVGhlIHJlc3VsdCBkZXBlbmRzIG9uIHRoZSB2YWx1ZSBvZiBNT0RVTE9fTU9ERS5cclxuICAgICAqL1xyXG4gICAgUC5tb2R1bG8gPSBQLm1vZCA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciBxLCBzLFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoeSwgYik7XHJcblxyXG4gICAgICAvLyBSZXR1cm4gTmFOIGlmIHggaXMgSW5maW5pdHkgb3IgTmFOLCBvciB5IGlzIE5hTiBvciB6ZXJvLlxyXG4gICAgICBpZiAoIXguYyB8fCAheS5zIHx8IHkuYyAmJiAheS5jWzBdKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgIC8vIFJldHVybiB4IGlmIHkgaXMgSW5maW5pdHkgb3IgeCBpcyB6ZXJvLlxyXG4gICAgICB9IGVsc2UgaWYgKCF5LmMgfHwgeC5jICYmICF4LmNbMF0pIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcih4KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKE1PRFVMT19NT0RFID09IDkpIHtcclxuXHJcbiAgICAgICAgLy8gRXVjbGlkaWFuIGRpdmlzaW9uOiBxID0gc2lnbih5KSAqIGZsb29yKHggLyBhYnMoeSkpXHJcbiAgICAgICAgLy8gciA9IHggLSBxeSAgICB3aGVyZSAgMCA8PSByIDwgYWJzKHkpXHJcbiAgICAgICAgcyA9IHkucztcclxuICAgICAgICB5LnMgPSAxO1xyXG4gICAgICAgIHEgPSBkaXYoeCwgeSwgMCwgMyk7XHJcbiAgICAgICAgeS5zID0gcztcclxuICAgICAgICBxLnMgKj0gcztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBxID0gZGl2KHgsIHksIDAsIE1PRFVMT19NT0RFKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgeSA9IHgubWludXMocS50aW1lcyh5KSk7XHJcblxyXG4gICAgICAvLyBUbyBtYXRjaCBKYXZhU2NyaXB0ICUsIGVuc3VyZSBzaWduIG9mIHplcm8gaXMgc2lnbiBvZiBkaXZpZGVuZC5cclxuICAgICAgaWYgKCF5LmNbMF0gJiYgTU9EVUxPX01PREUgPT0gMSkgeS5zID0geC5zO1xyXG5cclxuICAgICAgcmV0dXJuIHk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gKiAwID0gMFxyXG4gICAgICogIG4gKiBOID0gTlxyXG4gICAgICogIG4gKiBJID0gSVxyXG4gICAgICogIDAgKiBuID0gMFxyXG4gICAgICogIDAgKiAwID0gMFxyXG4gICAgICogIDAgKiBOID0gTlxyXG4gICAgICogIDAgKiBJID0gTlxyXG4gICAgICogIE4gKiBuID0gTlxyXG4gICAgICogIE4gKiAwID0gTlxyXG4gICAgICogIE4gKiBOID0gTlxyXG4gICAgICogIE4gKiBJID0gTlxyXG4gICAgICogIEkgKiBuID0gSVxyXG4gICAgICogIEkgKiAwID0gTlxyXG4gICAgICogIEkgKiBOID0gTlxyXG4gICAgICogIEkgKiBJID0gSVxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG11bHRpcGxpZWQgYnkgdGhlIHZhbHVlXHJcbiAgICAgKiBvZiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgKi9cclxuICAgIFAubXVsdGlwbGllZEJ5ID0gUC50aW1lcyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciBjLCBlLCBpLCBqLCBrLCBtLCB4Y0wsIHhsbywgeGhpLCB5Y0wsIHlsbywgeWhpLCB6YyxcclxuICAgICAgICBiYXNlLCBzcXJ0QmFzZSxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICB5YyA9ICh5ID0gbmV3IEJpZ051bWJlcih5LCBiKSkuYztcclxuXHJcbiAgICAgIC8vIEVpdGhlciBOYU4sIMKxSW5maW5pdHkgb3IgwrEwP1xyXG4gICAgICBpZiAoIXhjIHx8ICF5YyB8fCAheGNbMF0gfHwgIXljWzBdKSB7XHJcblxyXG4gICAgICAgIC8vIFJldHVybiBOYU4gaWYgZWl0aGVyIGlzIE5hTiwgb3Igb25lIGlzIDAgYW5kIHRoZSBvdGhlciBpcyBJbmZpbml0eS5cclxuICAgICAgICBpZiAoIXgucyB8fCAheS5zIHx8IHhjICYmICF4Y1swXSAmJiAheWMgfHwgeWMgJiYgIXljWzBdICYmICF4Yykge1xyXG4gICAgICAgICAgeS5jID0geS5lID0geS5zID0gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeS5zICo9IHgucztcclxuXHJcbiAgICAgICAgICAvLyBSZXR1cm4gwrFJbmZpbml0eSBpZiBlaXRoZXIgaXMgwrFJbmZpbml0eS5cclxuICAgICAgICAgIGlmICgheGMgfHwgIXljKSB7XHJcbiAgICAgICAgICAgIHkuYyA9IHkuZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgLy8gUmV0dXJuIMKxMCBpZiBlaXRoZXIgaXMgwrEwLlxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgeS5jID0gWzBdO1xyXG4gICAgICAgICAgICB5LmUgPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGUgPSBiaXRGbG9vcih4LmUgLyBMT0dfQkFTRSkgKyBiaXRGbG9vcih5LmUgLyBMT0dfQkFTRSk7XHJcbiAgICAgIHkucyAqPSB4LnM7XHJcbiAgICAgIHhjTCA9IHhjLmxlbmd0aDtcclxuICAgICAgeWNMID0geWMubGVuZ3RoO1xyXG5cclxuICAgICAgLy8gRW5zdXJlIHhjIHBvaW50cyB0byBsb25nZXIgYXJyYXkgYW5kIHhjTCB0byBpdHMgbGVuZ3RoLlxyXG4gICAgICBpZiAoeGNMIDwgeWNMKSB6YyA9IHhjLCB4YyA9IHljLCB5YyA9IHpjLCBpID0geGNMLCB4Y0wgPSB5Y0wsIHljTCA9IGk7XHJcblxyXG4gICAgICAvLyBJbml0aWFsaXNlIHRoZSByZXN1bHQgYXJyYXkgd2l0aCB6ZXJvcy5cclxuICAgICAgZm9yIChpID0geGNMICsgeWNMLCB6YyA9IFtdOyBpLS07IHpjLnB1c2goMCkpO1xyXG5cclxuICAgICAgYmFzZSA9IEJBU0U7XHJcbiAgICAgIHNxcnRCYXNlID0gU1FSVF9CQVNFO1xyXG5cclxuICAgICAgZm9yIChpID0geWNMOyAtLWkgPj0gMDspIHtcclxuICAgICAgICBjID0gMDtcclxuICAgICAgICB5bG8gPSB5Y1tpXSAlIHNxcnRCYXNlO1xyXG4gICAgICAgIHloaSA9IHljW2ldIC8gc3FydEJhc2UgfCAwO1xyXG5cclxuICAgICAgICBmb3IgKGsgPSB4Y0wsIGogPSBpICsgazsgaiA+IGk7KSB7XHJcbiAgICAgICAgICB4bG8gPSB4Y1stLWtdICUgc3FydEJhc2U7XHJcbiAgICAgICAgICB4aGkgPSB4Y1trXSAvIHNxcnRCYXNlIHwgMDtcclxuICAgICAgICAgIG0gPSB5aGkgKiB4bG8gKyB4aGkgKiB5bG87XHJcbiAgICAgICAgICB4bG8gPSB5bG8gKiB4bG8gKyAoKG0gJSBzcXJ0QmFzZSkgKiBzcXJ0QmFzZSkgKyB6Y1tqXSArIGM7XHJcbiAgICAgICAgICBjID0gKHhsbyAvIGJhc2UgfCAwKSArIChtIC8gc3FydEJhc2UgfCAwKSArIHloaSAqIHhoaTtcclxuICAgICAgICAgIHpjW2otLV0gPSB4bG8gJSBiYXNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgemNbal0gPSBjO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoYykge1xyXG4gICAgICAgICsrZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB6Yy5zcGxpY2UoMCwgMSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBub3JtYWxpc2UoeSwgemMsIGUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG5lZ2F0ZWQsXHJcbiAgICAgKiBpLmUuIG11bHRpcGxpZWQgYnkgLTEuXHJcbiAgICAgKi9cclxuICAgIFAubmVnYXRlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHggPSBuZXcgQmlnTnVtYmVyKHRoaXMpO1xyXG4gICAgICB4LnMgPSAteC5zIHx8IG51bGw7XHJcbiAgICAgIHJldHVybiB4O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBuICsgMCA9IG5cclxuICAgICAqICBuICsgTiA9IE5cclxuICAgICAqICBuICsgSSA9IElcclxuICAgICAqICAwICsgbiA9IG5cclxuICAgICAqICAwICsgMCA9IDBcclxuICAgICAqICAwICsgTiA9IE5cclxuICAgICAqICAwICsgSSA9IElcclxuICAgICAqICBOICsgbiA9IE5cclxuICAgICAqICBOICsgMCA9IE5cclxuICAgICAqICBOICsgTiA9IE5cclxuICAgICAqICBOICsgSSA9IE5cclxuICAgICAqICBJICsgbiA9IElcclxuICAgICAqICBJICsgMCA9IElcclxuICAgICAqICBJICsgTiA9IE5cclxuICAgICAqICBJICsgSSA9IElcclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBwbHVzIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICovXHJcbiAgICBQLnBsdXMgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICB2YXIgdCxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICBhID0geC5zO1xyXG5cclxuICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoeSwgYik7XHJcbiAgICAgIGIgPSB5LnM7XHJcblxyXG4gICAgICAvLyBFaXRoZXIgTmFOP1xyXG4gICAgICBpZiAoIWEgfHwgIWIpIHJldHVybiBuZXcgQmlnTnVtYmVyKE5hTik7XHJcblxyXG4gICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICBpZiAoYSAhPSBiKSB7XHJcbiAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgcmV0dXJuIHgubWludXMoeSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciB4ZSA9IHguZSAvIExPR19CQVNFLFxyXG4gICAgICAgIHllID0geS5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICBpZiAoIXhlIHx8ICF5ZSkge1xyXG5cclxuICAgICAgICAvLyBSZXR1cm4gwrFJbmZpbml0eSBpZiBlaXRoZXIgwrFJbmZpbml0eS5cclxuICAgICAgICBpZiAoIXhjIHx8ICF5YykgcmV0dXJuIG5ldyBCaWdOdW1iZXIoYSAvIDApO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICAvLyBSZXR1cm4geSBpZiB5IGlzIG5vbi16ZXJvLCB4IGlmIHggaXMgbm9uLXplcm8sIG9yIHplcm8gaWYgYm90aCBhcmUgemVyby5cclxuICAgICAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkgcmV0dXJuIHljWzBdID8geSA6IG5ldyBCaWdOdW1iZXIoeGNbMF0gPyB4IDogYSAqIDApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB4ZSA9IGJpdEZsb29yKHhlKTtcclxuICAgICAgeWUgPSBiaXRGbG9vcih5ZSk7XHJcbiAgICAgIHhjID0geGMuc2xpY2UoKTtcclxuXHJcbiAgICAgIC8vIFByZXBlbmQgemVyb3MgdG8gZXF1YWxpc2UgZXhwb25lbnRzLiBGYXN0ZXIgdG8gdXNlIHJldmVyc2UgdGhlbiBkbyB1bnNoaWZ0cy5cclxuICAgICAgaWYgKGEgPSB4ZSAtIHllKSB7XHJcbiAgICAgICAgaWYgKGEgPiAwKSB7XHJcbiAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICBmb3IgKDsgYS0tOyB0LnB1c2goMCkpO1xyXG4gICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhID0geGMubGVuZ3RoO1xyXG4gICAgICBiID0geWMubGVuZ3RoO1xyXG5cclxuICAgICAgLy8gUG9pbnQgeGMgdG8gdGhlIGxvbmdlciBhcnJheSwgYW5kIGIgdG8gdGhlIHNob3J0ZXIgbGVuZ3RoLlxyXG4gICAgICBpZiAoYSAtIGIgPCAwKSB0ID0geWMsIHljID0geGMsIHhjID0gdCwgYiA9IGE7XHJcblxyXG4gICAgICAvLyBPbmx5IHN0YXJ0IGFkZGluZyBhdCB5Yy5sZW5ndGggLSAxIGFzIHRoZSBmdXJ0aGVyIGRpZ2l0cyBvZiB4YyBjYW4gYmUgaWdub3JlZC5cclxuICAgICAgZm9yIChhID0gMDsgYjspIHtcclxuICAgICAgICBhID0gKHhjWy0tYl0gPSB4Y1tiXSArIHljW2JdICsgYSkgLyBCQVNFIHwgMDtcclxuICAgICAgICB4Y1tiXSA9IEJBU0UgPT09IHhjW2JdID8gMCA6IHhjW2JdICUgQkFTRTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGEpIHtcclxuICAgICAgICB4YyA9IFthXS5jb25jYXQoeGMpO1xyXG4gICAgICAgICsreWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE5vIG5lZWQgdG8gY2hlY2sgZm9yIHplcm8sIGFzICt4ICsgK3kgIT0gMCAmJiAteCArIC15ICE9IDBcclxuICAgICAgLy8geWUgPSBNQVhfRVhQICsgMSBwb3NzaWJsZVxyXG4gICAgICByZXR1cm4gbm9ybWFsaXNlKHksIHhjLCB5ZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogSWYgc2QgaXMgdW5kZWZpbmVkIG9yIG51bGwgb3IgdHJ1ZSBvciBmYWxzZSwgcmV0dXJuIHRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzIG9mXHJcbiAgICAgKiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIMKxSW5maW5pdHkgb3IgTmFOLlxyXG4gICAgICogSWYgc2QgaXMgdHJ1ZSBpbmNsdWRlIGludGVnZXItcGFydCB0cmFpbGluZyB6ZXJvcyBpbiB0aGUgY291bnQuXHJcbiAgICAgKlxyXG4gICAgICogT3RoZXJ3aXNlLCBpZiBzZCBpcyBhIG51bWJlciwgcmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICogQmlnTnVtYmVyIHJvdW5kZWQgdG8gYSBtYXhpbXVtIG9mIHNkIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvclxyXG4gICAgICogUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICpcclxuICAgICAqIHNkIHtudW1iZXJ8Ym9vbGVhbn0gbnVtYmVyOiBzaWduaWZpY2FudCBkaWdpdHM6IGludGVnZXIsIDEgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgYm9vbGVhbjogd2hldGhlciB0byBjb3VudCBpbnRlZ2VyLXBhcnQgdHJhaWxpbmcgemVyb3M6IHRydWUgb3IgZmFsc2UuXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtzZHxybX0nXHJcbiAgICAgKi9cclxuICAgIFAucHJlY2lzaW9uID0gUC5zZCA9IGZ1bmN0aW9uIChzZCwgcm0pIHtcclxuICAgICAgdmFyIGMsIG4sIHYsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICBpZiAoc2QgIT0gbnVsbCAmJiBzZCAhPT0gISFzZCkge1xyXG4gICAgICAgIGludENoZWNrKHNkLCAxLCBNQVgpO1xyXG4gICAgICAgIGlmIChybSA9PSBudWxsKSBybSA9IFJPVU5ESU5HX01PREU7XHJcbiAgICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcblxyXG4gICAgICAgIHJldHVybiByb3VuZChuZXcgQmlnTnVtYmVyKHgpLCBzZCwgcm0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIShjID0geC5jKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgIHYgPSBjLmxlbmd0aCAtIDE7XHJcbiAgICAgIG4gPSB2ICogTE9HX0JBU0UgKyAxO1xyXG5cclxuICAgICAgaWYgKHYgPSBjW3ZdKSB7XHJcblxyXG4gICAgICAgIC8vIFN1YnRyYWN0IHRoZSBudW1iZXIgb2YgdHJhaWxpbmcgemVyb3Mgb2YgdGhlIGxhc3QgZWxlbWVudC5cclxuICAgICAgICBmb3IgKDsgdiAlIDEwID09IDA7IHYgLz0gMTAsIG4tLSk7XHJcblxyXG4gICAgICAgIC8vIEFkZCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudC5cclxuICAgICAgICBmb3IgKHYgPSBjWzBdOyB2ID49IDEwOyB2IC89IDEwLCBuKyspO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoc2QgJiYgeC5lICsgMSA+IG4pIG4gPSB4LmUgKyAxO1xyXG5cclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgc2hpZnRlZCBieSBrIHBsYWNlc1xyXG4gICAgICogKHBvd2VycyBvZiAxMCkuIFNoaWZ0IHRvIHRoZSByaWdodCBpZiBuID4gMCwgYW5kIHRvIHRoZSBsZWZ0IGlmIG4gPCAwLlxyXG4gICAgICpcclxuICAgICAqIGsge251bWJlcn0gSW50ZWdlciwgLU1BWF9TQUZFX0lOVEVHRVIgdG8gTUFYX1NBRkVfSU5URUdFUiBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtrfSdcclxuICAgICAqL1xyXG4gICAgUC5zaGlmdGVkQnkgPSBmdW5jdGlvbiAoaykge1xyXG4gICAgICBpbnRDaGVjayhrLCAtTUFYX1NBRkVfSU5URUdFUiwgTUFYX1NBRkVfSU5URUdFUik7XHJcbiAgICAgIHJldHVybiB0aGlzLnRpbWVzKCcxZScgKyBrKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiAgc3FydCgtbikgPSAgTlxyXG4gICAgICogIHNxcnQoTikgPSAgTlxyXG4gICAgICogIHNxcnQoLUkpID0gIE5cclxuICAgICAqICBzcXJ0KEkpID0gIElcclxuICAgICAqICBzcXJ0KDApID0gIDBcclxuICAgICAqICBzcXJ0KC0wKSA9IC0wXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgc3F1YXJlIHJvb3Qgb2YgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyLFxyXG4gICAgICogcm91bmRlZCBhY2NvcmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYW5kIFJPVU5ESU5HX01PREUuXHJcbiAgICAgKi9cclxuICAgIFAuc3F1YXJlUm9vdCA9IFAuc3FydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIG0sIG4sIHIsIHJlcCwgdCxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICBjID0geC5jLFxyXG4gICAgICAgIHMgPSB4LnMsXHJcbiAgICAgICAgZSA9IHguZSxcclxuICAgICAgICBkcCA9IERFQ0lNQUxfUExBQ0VTICsgNCxcclxuICAgICAgICBoYWxmID0gbmV3IEJpZ051bWJlcignMC41Jyk7XHJcblxyXG4gICAgICAvLyBOZWdhdGl2ZS9OYU4vSW5maW5pdHkvemVybz9cclxuICAgICAgaWYgKHMgIT09IDEgfHwgIWMgfHwgIWNbMF0pIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcighcyB8fCBzIDwgMCAmJiAoIWMgfHwgY1swXSkgPyBOYU4gOiBjID8geCA6IDEgLyAwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSW5pdGlhbCBlc3RpbWF0ZS5cclxuICAgICAgcyA9IE1hdGguc3FydCgrdmFsdWVPZih4KSk7XHJcblxyXG4gICAgICAvLyBNYXRoLnNxcnQgdW5kZXJmbG93L292ZXJmbG93P1xyXG4gICAgICAvLyBQYXNzIHggdG8gTWF0aC5zcXJ0IGFzIGludGVnZXIsIHRoZW4gYWRqdXN0IHRoZSBleHBvbmVudCBvZiB0aGUgcmVzdWx0LlxyXG4gICAgICBpZiAocyA9PSAwIHx8IHMgPT0gMSAvIDApIHtcclxuICAgICAgICBuID0gY29lZmZUb1N0cmluZyhjKTtcclxuICAgICAgICBpZiAoKG4ubGVuZ3RoICsgZSkgJSAyID09IDApIG4gKz0gJzAnO1xyXG4gICAgICAgIHMgPSBNYXRoLnNxcnQoK24pO1xyXG4gICAgICAgIGUgPSBiaXRGbG9vcigoZSArIDEpIC8gMikgLSAoZSA8IDAgfHwgZSAlIDIpO1xyXG5cclxuICAgICAgICBpZiAocyA9PSAxIC8gMCkge1xyXG4gICAgICAgICAgbiA9ICcxZScgKyBlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBuID0gcy50b0V4cG9uZW50aWFsKCk7XHJcbiAgICAgICAgICBuID0gbi5zbGljZSgwLCBuLmluZGV4T2YoJ2UnKSArIDEpICsgZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHIgPSBuZXcgQmlnTnVtYmVyKG4pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHIgPSBuZXcgQmlnTnVtYmVyKHMgKyAnJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENoZWNrIGZvciB6ZXJvLlxyXG4gICAgICAvLyByIGNvdWxkIGJlIHplcm8gaWYgTUlOX0VYUCBpcyBjaGFuZ2VkIGFmdGVyIHRoZSB0aGlzIHZhbHVlIHdhcyBjcmVhdGVkLlxyXG4gICAgICAvLyBUaGlzIHdvdWxkIGNhdXNlIGEgZGl2aXNpb24gYnkgemVybyAoeC90KSBhbmQgaGVuY2UgSW5maW5pdHkgYmVsb3csIHdoaWNoIHdvdWxkIGNhdXNlXHJcbiAgICAgIC8vIGNvZWZmVG9TdHJpbmcgdG8gdGhyb3cuXHJcbiAgICAgIGlmIChyLmNbMF0pIHtcclxuICAgICAgICBlID0gci5lO1xyXG4gICAgICAgIHMgPSBlICsgZHA7XHJcbiAgICAgICAgaWYgKHMgPCAzKSBzID0gMDtcclxuXHJcbiAgICAgICAgLy8gTmV3dG9uLVJhcGhzb24gaXRlcmF0aW9uLlxyXG4gICAgICAgIGZvciAoOyA7KSB7XHJcbiAgICAgICAgICB0ID0gcjtcclxuICAgICAgICAgIHIgPSBoYWxmLnRpbWVzKHQucGx1cyhkaXYoeCwgdCwgZHAsIDEpKSk7XHJcblxyXG4gICAgICAgICAgaWYgKGNvZWZmVG9TdHJpbmcodC5jKS5zbGljZSgwLCBzKSA9PT0gKG4gPSBjb2VmZlRvU3RyaW5nKHIuYykpLnNsaWNlKDAsIHMpKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgZXhwb25lbnQgb2YgciBtYXkgaGVyZSBiZSBvbmUgbGVzcyB0aGFuIHRoZSBmaW5hbCByZXN1bHQgZXhwb25lbnQsXHJcbiAgICAgICAgICAgIC8vIGUuZyAwLjAwMDk5OTkgKGUtNCkgLS0+IDAuMDAxIChlLTMpLCBzbyBhZGp1c3QgcyBzbyB0aGUgcm91bmRpbmcgZGlnaXRzXHJcbiAgICAgICAgICAgIC8vIGFyZSBpbmRleGVkIGNvcnJlY3RseS5cclxuICAgICAgICAgICAgaWYgKHIuZSA8IGUpIC0tcztcclxuICAgICAgICAgICAgbiA9IG4uc2xpY2UocyAtIDMsIHMgKyAxKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSA0dGggcm91bmRpbmcgZGlnaXQgbWF5IGJlIGluIGVycm9yIGJ5IC0xIHNvIGlmIHRoZSA0IHJvdW5kaW5nIGRpZ2l0c1xyXG4gICAgICAgICAgICAvLyBhcmUgOTk5OSBvciA0OTk5IChpLmUuIGFwcHJvYWNoaW5nIGEgcm91bmRpbmcgYm91bmRhcnkpIGNvbnRpbnVlIHRoZVxyXG4gICAgICAgICAgICAvLyBpdGVyYXRpb24uXHJcbiAgICAgICAgICAgIGlmIChuID09ICc5OTk5JyB8fCAhcmVwICYmIG4gPT0gJzQ5OTknKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIE9uIHRoZSBmaXJzdCBpdGVyYXRpb24gb25seSwgY2hlY2sgdG8gc2VlIGlmIHJvdW5kaW5nIHVwIGdpdmVzIHRoZVxyXG4gICAgICAgICAgICAgIC8vIGV4YWN0IHJlc3VsdCBhcyB0aGUgbmluZXMgbWF5IGluZmluaXRlbHkgcmVwZWF0LlxyXG4gICAgICAgICAgICAgIGlmICghcmVwKSB7XHJcbiAgICAgICAgICAgICAgICByb3VuZCh0LCB0LmUgKyBERUNJTUFMX1BMQUNFUyArIDIsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0LnRpbWVzKHQpLmVxKHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHIgPSB0O1xyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGRwICs9IDQ7XHJcbiAgICAgICAgICAgICAgcyArPSA0O1xyXG4gICAgICAgICAgICAgIHJlcCA9IDE7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIElmIHJvdW5kaW5nIGRpZ2l0cyBhcmUgbnVsbCwgMHswLDR9IG9yIDUwezAsM30sIGNoZWNrIGZvciBleGFjdFxyXG4gICAgICAgICAgICAgIC8vIHJlc3VsdC4gSWYgbm90LCB0aGVuIHRoZXJlIGFyZSBmdXJ0aGVyIGRpZ2l0cyBhbmQgbSB3aWxsIGJlIHRydXRoeS5cclxuICAgICAgICAgICAgICBpZiAoIStuIHx8ICErbi5zbGljZSgxKSAmJiBuLmNoYXJBdCgwKSA9PSAnNScpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUcnVuY2F0ZSB0byB0aGUgZmlyc3Qgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgICAgICAgICByb3VuZChyLCByLmUgKyBERUNJTUFMX1BMQUNFUyArIDIsIDEpO1xyXG4gICAgICAgICAgICAgICAgbSA9ICFyLnRpbWVzKHIpLmVxKHgpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByb3VuZChyLCByLmUgKyBERUNJTUFMX1BMQUNFUyArIDEsIFJPVU5ESU5HX01PREUsIG0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGV4cG9uZW50aWFsIG5vdGF0aW9uIGFuZFxyXG4gICAgICogcm91bmRlZCB1c2luZyBST1VORElOR19NT0RFIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC50b0V4cG9uZW50aWFsID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgICBpZiAoZHAgIT0gbnVsbCkge1xyXG4gICAgICAgIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG4gICAgICAgIGRwKys7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZvcm1hdCh0aGlzLCBkcCwgcm0sIDEpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGZpeGVkLXBvaW50IG5vdGF0aW9uIHJvdW5kaW5nXHJcbiAgICAgKiB0byBkcCBmaXhlZCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvciBST1VORElOR19NT0RFIGlmIHJtIGlzIG9taXR0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogTm90ZTogYXMgd2l0aCBKYXZhU2NyaXB0J3MgbnVtYmVyIHR5cGUsICgtMCkudG9GaXhlZCgwKSBpcyAnMCcsXHJcbiAgICAgKiBidXQgZS5nLiAoLTAuMDAwMDEpLnRvRml4ZWQoMCkgaXMgJy0wJy5cclxuICAgICAqXHJcbiAgICAgKiBbZHBdIHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzLiBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtkcHxybX0nXHJcbiAgICAgKi9cclxuICAgIFAudG9GaXhlZCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICAgICAgaWYgKGRwICE9IG51bGwpIHtcclxuICAgICAgICBpbnRDaGVjayhkcCwgMCwgTUFYKTtcclxuICAgICAgICBkcCA9IGRwICsgdGhpcy5lICsgMTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIGRwLCBybSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24gcm91bmRlZFxyXG4gICAgICogdXNpbmcgcm0gb3IgUk9VTkRJTkdfTU9ERSB0byBkcCBkZWNpbWFsIHBsYWNlcywgYW5kIGZvcm1hdHRlZCBhY2NvcmRpbmcgdG8gdGhlIHByb3BlcnRpZXNcclxuICAgICAqIG9mIHRoZSBmb3JtYXQgb3IgRk9STUFUIG9iamVjdCAoc2VlIEJpZ051bWJlci5zZXQpLlxyXG4gICAgICpcclxuICAgICAqIFRoZSBmb3JtYXR0aW5nIG9iamVjdCBtYXkgY29udGFpbiBzb21lIG9yIGFsbCBvZiB0aGUgcHJvcGVydGllcyBzaG93biBiZWxvdy5cclxuICAgICAqXHJcbiAgICAgKiBGT1JNQVQgPSB7XHJcbiAgICAgKiAgIHByZWZpeDogJycsXHJcbiAgICAgKiAgIGdyb3VwU2l6ZTogMyxcclxuICAgICAqICAgc2Vjb25kYXJ5R3JvdXBTaXplOiAwLFxyXG4gICAgICogICBncm91cFNlcGFyYXRvcjogJywnLFxyXG4gICAgICogICBkZWNpbWFsU2VwYXJhdG9yOiAnLicsXHJcbiAgICAgKiAgIGZyYWN0aW9uR3JvdXBTaXplOiAwLFxyXG4gICAgICogICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yOiAnXFx4QTAnLCAgICAgIC8vIG5vbi1icmVha2luZyBzcGFjZVxyXG4gICAgICogICBzdWZmaXg6ICcnXHJcbiAgICAgKiB9O1xyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqIFtmb3JtYXRdIHtvYmplY3R9IEZvcm1hdHRpbmcgb3B0aW9ucy4gU2VlIEZPUk1BVCBwYmplY3QgYWJvdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtkcHxybX0nXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQgbm90IGFuIG9iamVjdDoge2Zvcm1hdH0nXHJcbiAgICAgKi9cclxuICAgIFAudG9Gb3JtYXQgPSBmdW5jdGlvbiAoZHAsIHJtLCBmb3JtYXQpIHtcclxuICAgICAgdmFyIHN0cixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChmb3JtYXQgPT0gbnVsbCkge1xyXG4gICAgICAgIGlmIChkcCAhPSBudWxsICYmIHJtICYmIHR5cGVvZiBybSA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgZm9ybWF0ID0gcm07XHJcbiAgICAgICAgICBybSA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkcCAmJiB0eXBlb2YgZHAgPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgIGZvcm1hdCA9IGRwO1xyXG4gICAgICAgICAgZHAgPSBybSA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGZvcm1hdCA9IEZPUk1BVDtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGZvcm1hdCAhPSAnb2JqZWN0Jykge1xyXG4gICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnQXJndW1lbnQgbm90IGFuIG9iamVjdDogJyArIGZvcm1hdCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHN0ciA9IHgudG9GaXhlZChkcCwgcm0pO1xyXG5cclxuICAgICAgaWYgKHguYykge1xyXG4gICAgICAgIHZhciBpLFxyXG4gICAgICAgICAgYXJyID0gc3RyLnNwbGl0KCcuJyksXHJcbiAgICAgICAgICBnMSA9ICtmb3JtYXQuZ3JvdXBTaXplLFxyXG4gICAgICAgICAgZzIgPSArZm9ybWF0LnNlY29uZGFyeUdyb3VwU2l6ZSxcclxuICAgICAgICAgIGdyb3VwU2VwYXJhdG9yID0gZm9ybWF0Lmdyb3VwU2VwYXJhdG9yIHx8ICcnLFxyXG4gICAgICAgICAgaW50UGFydCA9IGFyclswXSxcclxuICAgICAgICAgIGZyYWN0aW9uUGFydCA9IGFyclsxXSxcclxuICAgICAgICAgIGlzTmVnID0geC5zIDwgMCxcclxuICAgICAgICAgIGludERpZ2l0cyA9IGlzTmVnID8gaW50UGFydC5zbGljZSgxKSA6IGludFBhcnQsXHJcbiAgICAgICAgICBsZW4gPSBpbnREaWdpdHMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoZzIpIGkgPSBnMSwgZzEgPSBnMiwgZzIgPSBpLCBsZW4gLT0gaTtcclxuXHJcbiAgICAgICAgaWYgKGcxID4gMCAmJiBsZW4gPiAwKSB7XHJcbiAgICAgICAgICBpID0gbGVuICUgZzEgfHwgZzE7XHJcbiAgICAgICAgICBpbnRQYXJ0ID0gaW50RGlnaXRzLnN1YnN0cigwLCBpKTtcclxuICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpICs9IGcxKSBpbnRQYXJ0ICs9IGdyb3VwU2VwYXJhdG9yICsgaW50RGlnaXRzLnN1YnN0cihpLCBnMSk7XHJcbiAgICAgICAgICBpZiAoZzIgPiAwKSBpbnRQYXJ0ICs9IGdyb3VwU2VwYXJhdG9yICsgaW50RGlnaXRzLnNsaWNlKGkpO1xyXG4gICAgICAgICAgaWYgKGlzTmVnKSBpbnRQYXJ0ID0gJy0nICsgaW50UGFydDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0ciA9IGZyYWN0aW9uUGFydFxyXG4gICAgICAgICA/IGludFBhcnQgKyAoZm9ybWF0LmRlY2ltYWxTZXBhcmF0b3IgfHwgJycpICsgKChnMiA9ICtmb3JtYXQuZnJhY3Rpb25Hcm91cFNpemUpXHJcbiAgICAgICAgICA/IGZyYWN0aW9uUGFydC5yZXBsYWNlKG5ldyBSZWdFeHAoJ1xcXFxkeycgKyBnMiArICd9XFxcXEInLCAnZycpLFxyXG4gICAgICAgICAgICckJicgKyAoZm9ybWF0LmZyYWN0aW9uR3JvdXBTZXBhcmF0b3IgfHwgJycpKVxyXG4gICAgICAgICAgOiBmcmFjdGlvblBhcnQpXHJcbiAgICAgICAgIDogaW50UGFydDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChmb3JtYXQucHJlZml4IHx8ICcnKSArIHN0ciArIChmb3JtYXQuc3VmZml4IHx8ICcnKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYW4gYXJyYXkgb2YgdHdvIEJpZ051bWJlcnMgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBhcyBhIHNpbXBsZVxyXG4gICAgICogZnJhY3Rpb24gd2l0aCBhbiBpbnRlZ2VyIG51bWVyYXRvciBhbmQgYW4gaW50ZWdlciBkZW5vbWluYXRvci5cclxuICAgICAqIFRoZSBkZW5vbWluYXRvciB3aWxsIGJlIGEgcG9zaXRpdmUgbm9uLXplcm8gdmFsdWUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSBzcGVjaWZpZWRcclxuICAgICAqIG1heGltdW0gZGVub21pbmF0b3IuIElmIGEgbWF4aW11bSBkZW5vbWluYXRvciBpcyBub3Qgc3BlY2lmaWVkLCB0aGUgZGVub21pbmF0b3Igd2lsbCBiZVxyXG4gICAgICogdGhlIGxvd2VzdCB2YWx1ZSBuZWNlc3NhcnkgdG8gcmVwcmVzZW50IHRoZSBudW1iZXIgZXhhY3RseS5cclxuICAgICAqXHJcbiAgICAgKiBbbWRdIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gSW50ZWdlciA+PSAxLCBvciBJbmZpbml0eS4gVGhlIG1heGltdW0gZGVub21pbmF0b3IuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9IDoge21kfSdcclxuICAgICAqL1xyXG4gICAgUC50b0ZyYWN0aW9uID0gZnVuY3Rpb24gKG1kKSB7XHJcbiAgICAgIHZhciBkLCBkMCwgZDEsIGQyLCBlLCBleHAsIG4sIG4wLCBuMSwgcSwgciwgcyxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICB4YyA9IHguYztcclxuXHJcbiAgICAgIGlmIChtZCAhPSBudWxsKSB7XHJcbiAgICAgICAgbiA9IG5ldyBCaWdOdW1iZXIobWQpO1xyXG5cclxuICAgICAgICAvLyBUaHJvdyBpZiBtZCBpcyBsZXNzIHRoYW4gb25lIG9yIGlzIG5vdCBhbiBpbnRlZ2VyLCB1bmxlc3MgaXQgaXMgSW5maW5pdHkuXHJcbiAgICAgICAgaWYgKCFuLmlzSW50ZWdlcigpICYmIChuLmMgfHwgbi5zICE9PSAxKSB8fCBuLmx0KE9ORSkpIHtcclxuICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdBcmd1bWVudCAnICtcclxuICAgICAgICAgICAgICAobi5pc0ludGVnZXIoKSA/ICdvdXQgb2YgcmFuZ2U6ICcgOiAnbm90IGFuIGludGVnZXI6ICcpICsgdmFsdWVPZihuKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXhjKSByZXR1cm4gbmV3IEJpZ051bWJlcih4KTtcclxuXHJcbiAgICAgIGQgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcbiAgICAgIG4xID0gZDAgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcbiAgICAgIGQxID0gbjAgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcbiAgICAgIHMgPSBjb2VmZlRvU3RyaW5nKHhjKTtcclxuXHJcbiAgICAgIC8vIERldGVybWluZSBpbml0aWFsIGRlbm9taW5hdG9yLlxyXG4gICAgICAvLyBkIGlzIGEgcG93ZXIgb2YgMTAgYW5kIHRoZSBtaW5pbXVtIG1heCBkZW5vbWluYXRvciB0aGF0IHNwZWNpZmllcyB0aGUgdmFsdWUgZXhhY3RseS5cclxuICAgICAgZSA9IGQuZSA9IHMubGVuZ3RoIC0geC5lIC0gMTtcclxuICAgICAgZC5jWzBdID0gUE9XU19URU5bKGV4cCA9IGUgJSBMT0dfQkFTRSkgPCAwID8gTE9HX0JBU0UgKyBleHAgOiBleHBdO1xyXG4gICAgICBtZCA9ICFtZCB8fCBuLmNvbXBhcmVkVG8oZCkgPiAwID8gKGUgPiAwID8gZCA6IG4xKSA6IG47XHJcblxyXG4gICAgICBleHAgPSBNQVhfRVhQO1xyXG4gICAgICBNQVhfRVhQID0gMSAvIDA7XHJcbiAgICAgIG4gPSBuZXcgQmlnTnVtYmVyKHMpO1xyXG5cclxuICAgICAgLy8gbjAgPSBkMSA9IDBcclxuICAgICAgbjAuY1swXSA9IDA7XHJcblxyXG4gICAgICBmb3IgKDsgOykgIHtcclxuICAgICAgICBxID0gZGl2KG4sIGQsIDAsIDEpO1xyXG4gICAgICAgIGQyID0gZDAucGx1cyhxLnRpbWVzKGQxKSk7XHJcbiAgICAgICAgaWYgKGQyLmNvbXBhcmVkVG8obWQpID09IDEpIGJyZWFrO1xyXG4gICAgICAgIGQwID0gZDE7XHJcbiAgICAgICAgZDEgPSBkMjtcclxuICAgICAgICBuMSA9IG4wLnBsdXMocS50aW1lcyhkMiA9IG4xKSk7XHJcbiAgICAgICAgbjAgPSBkMjtcclxuICAgICAgICBkID0gbi5taW51cyhxLnRpbWVzKGQyID0gZCkpO1xyXG4gICAgICAgIG4gPSBkMjtcclxuICAgICAgfVxyXG5cclxuICAgICAgZDIgPSBkaXYobWQubWludXMoZDApLCBkMSwgMCwgMSk7XHJcbiAgICAgIG4wID0gbjAucGx1cyhkMi50aW1lcyhuMSkpO1xyXG4gICAgICBkMCA9IGQwLnBsdXMoZDIudGltZXMoZDEpKTtcclxuICAgICAgbjAucyA9IG4xLnMgPSB4LnM7XHJcbiAgICAgIGUgPSBlICogMjtcclxuXHJcbiAgICAgIC8vIERldGVybWluZSB3aGljaCBmcmFjdGlvbiBpcyBjbG9zZXIgdG8geCwgbjAvZDAgb3IgbjEvZDFcclxuICAgICAgciA9IGRpdihuMSwgZDEsIGUsIFJPVU5ESU5HX01PREUpLm1pbnVzKHgpLmFicygpLmNvbXBhcmVkVG8oXHJcbiAgICAgICAgICBkaXYobjAsIGQwLCBlLCBST1VORElOR19NT0RFKS5taW51cyh4KS5hYnMoKSkgPCAxID8gW24xLCBkMV0gOiBbbjAsIGQwXTtcclxuXHJcbiAgICAgIE1BWF9FWFAgPSBleHA7XHJcblxyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGNvbnZlcnRlZCB0byBhIG51bWJlciBwcmltaXRpdmUuXHJcbiAgICAgKi9cclxuICAgIFAudG9OdW1iZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiArdmFsdWVPZih0aGlzKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciByb3VuZGVkIHRvIHNkIHNpZ25pZmljYW50IGRpZ2l0c1xyXG4gICAgICogdXNpbmcgcm91bmRpbmcgbW9kZSBybSBvciBST1VORElOR19NT0RFLiBJZiBzZCBpcyBsZXNzIHRoYW4gdGhlIG51bWJlciBvZiBkaWdpdHNcclxuICAgICAqIG5lY2Vzc2FyeSB0byByZXByZXNlbnQgdGhlIGludGVnZXIgcGFydCBvZiB0aGUgdmFsdWUgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24sIHRoZW4gdXNlXHJcbiAgICAgKiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBbc2RdIHtudW1iZXJ9IFNpZ25pZmljYW50IGRpZ2l0cy4gSW50ZWdlciwgMSB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7c2R8cm19J1xyXG4gICAgICovXHJcbiAgICBQLnRvUHJlY2lzaW9uID0gZnVuY3Rpb24gKHNkLCBybSkge1xyXG4gICAgICBpZiAoc2QgIT0gbnVsbCkgaW50Q2hlY2soc2QsIDEsIE1BWCk7XHJcbiAgICAgIHJldHVybiBmb3JtYXQodGhpcywgc2QsIHJtLCAyKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpbiBiYXNlIGIsIG9yIGJhc2UgMTAgaWYgYiBpc1xyXG4gICAgICogb21pdHRlZC4gSWYgYSBiYXNlIGlzIHNwZWNpZmllZCwgaW5jbHVkaW5nIGJhc2UgMTAsIHJvdW5kIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmRcclxuICAgICAqIFJPVU5ESU5HX01PREUuIElmIGEgYmFzZSBpcyBub3Qgc3BlY2lmaWVkLCBhbmQgdGhpcyBCaWdOdW1iZXIgaGFzIGEgcG9zaXRpdmUgZXhwb25lbnRcclxuICAgICAqIHRoYXQgaXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFRPX0VYUF9QT1MsIG9yIGEgbmVnYXRpdmUgZXhwb25lbnQgZXF1YWwgdG8gb3IgbGVzcyB0aGFuXHJcbiAgICAgKiBUT19FWFBfTkVHLCByZXR1cm4gZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgKlxyXG4gICAgICogW2JdIHtudW1iZXJ9IEludGVnZXIsIDIgdG8gQUxQSEFCRVQubGVuZ3RoIGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQmFzZSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7Yn0nXHJcbiAgICAgKi9cclxuICAgIFAudG9TdHJpbmcgPSBmdW5jdGlvbiAoYikge1xyXG4gICAgICB2YXIgc3RyLFxyXG4gICAgICAgIG4gPSB0aGlzLFxyXG4gICAgICAgIHMgPSBuLnMsXHJcbiAgICAgICAgZSA9IG4uZTtcclxuXHJcbiAgICAgIC8vIEluZmluaXR5IG9yIE5hTj9cclxuICAgICAgaWYgKGUgPT09IG51bGwpIHtcclxuICAgICAgICBpZiAocykge1xyXG4gICAgICAgICAgc3RyID0gJ0luZmluaXR5JztcclxuICAgICAgICAgIGlmIChzIDwgMCkgc3RyID0gJy0nICsgc3RyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzdHIgPSAnTmFOJztcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKGIgPT0gbnVsbCkge1xyXG4gICAgICAgICAgc3RyID0gZSA8PSBUT19FWFBfTkVHIHx8IGUgPj0gVE9fRVhQX1BPU1xyXG4gICAgICAgICAgID8gdG9FeHBvbmVudGlhbChjb2VmZlRvU3RyaW5nKG4uYyksIGUpXHJcbiAgICAgICAgICAgOiB0b0ZpeGVkUG9pbnQoY29lZmZUb1N0cmluZyhuLmMpLCBlLCAnMCcpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoYiA9PT0gMTApIHtcclxuICAgICAgICAgIG4gPSByb3VuZChuZXcgQmlnTnVtYmVyKG4pLCBERUNJTUFMX1BMQUNFUyArIGUgKyAxLCBST1VORElOR19NT0RFKTtcclxuICAgICAgICAgIHN0ciA9IHRvRml4ZWRQb2ludChjb2VmZlRvU3RyaW5nKG4uYyksIG4uZSwgJzAnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaW50Q2hlY2soYiwgMiwgQUxQSEFCRVQubGVuZ3RoLCAnQmFzZScpO1xyXG4gICAgICAgICAgc3RyID0gY29udmVydEJhc2UodG9GaXhlZFBvaW50KGNvZWZmVG9TdHJpbmcobi5jKSwgZSwgJzAnKSwgMTAsIGIsIHMsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHMgPCAwICYmIG4uY1swXSkgc3RyID0gJy0nICsgc3RyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gc3RyO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhcyB0b1N0cmluZywgYnV0IGRvIG5vdCBhY2NlcHQgYSBiYXNlIGFyZ3VtZW50LCBhbmQgaW5jbHVkZSB0aGUgbWludXMgc2lnbiBmb3JcclxuICAgICAqIG5lZ2F0aXZlIHplcm8uXHJcbiAgICAgKi9cclxuICAgIFAudmFsdWVPZiA9IFAudG9KU09OID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gdmFsdWVPZih0aGlzKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIFAuX2lzQmlnTnVtYmVyID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoY29uZmlnT2JqZWN0ICE9IG51bGwpIEJpZ051bWJlci5zZXQoY29uZmlnT2JqZWN0KTtcclxuXHJcbiAgICByZXR1cm4gQmlnTnVtYmVyO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIFBSSVZBVEUgSEVMUEVSIEZVTkNUSU9OU1xyXG5cclxuICAvLyBUaGVzZSBmdW5jdGlvbnMgZG9uJ3QgbmVlZCBhY2Nlc3MgdG8gdmFyaWFibGVzLFxyXG4gIC8vIGUuZy4gREVDSU1BTF9QTEFDRVMsIGluIHRoZSBzY29wZSBvZiB0aGUgYGNsb25lYCBmdW5jdGlvbiBhYm92ZS5cclxuXHJcblxyXG4gIGZ1bmN0aW9uIGJpdEZsb29yKG4pIHtcclxuICAgIHZhciBpID0gbiB8IDA7XHJcbiAgICByZXR1cm4gbiA+IDAgfHwgbiA9PT0gaSA/IGkgOiBpIC0gMTtcclxuICB9XHJcblxyXG5cclxuICAvLyBSZXR1cm4gYSBjb2VmZmljaWVudCBhcnJheSBhcyBhIHN0cmluZyBvZiBiYXNlIDEwIGRpZ2l0cy5cclxuICBmdW5jdGlvbiBjb2VmZlRvU3RyaW5nKGEpIHtcclxuICAgIHZhciBzLCB6LFxyXG4gICAgICBpID0gMSxcclxuICAgICAgaiA9IGEubGVuZ3RoLFxyXG4gICAgICByID0gYVswXSArICcnO1xyXG5cclxuICAgIGZvciAoOyBpIDwgajspIHtcclxuICAgICAgcyA9IGFbaSsrXSArICcnO1xyXG4gICAgICB6ID0gTE9HX0JBU0UgLSBzLmxlbmd0aDtcclxuICAgICAgZm9yICg7IHotLTsgcyA9ICcwJyArIHMpO1xyXG4gICAgICByICs9IHM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgZm9yIChqID0gci5sZW5ndGg7IHIuY2hhckNvZGVBdCgtLWopID09PSA0ODspO1xyXG5cclxuICAgIHJldHVybiByLnNsaWNlKDAsIGogKyAxIHx8IDEpO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIENvbXBhcmUgdGhlIHZhbHVlIG9mIEJpZ051bWJlcnMgeCBhbmQgeS5cclxuICBmdW5jdGlvbiBjb21wYXJlKHgsIHkpIHtcclxuICAgIHZhciBhLCBiLFxyXG4gICAgICB4YyA9IHguYyxcclxuICAgICAgeWMgPSB5LmMsXHJcbiAgICAgIGkgPSB4LnMsXHJcbiAgICAgIGogPSB5LnMsXHJcbiAgICAgIGsgPSB4LmUsXHJcbiAgICAgIGwgPSB5LmU7XHJcblxyXG4gICAgLy8gRWl0aGVyIE5hTj9cclxuICAgIGlmICghaSB8fCAhaikgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgYSA9IHhjICYmICF4Y1swXTtcclxuICAgIGIgPSB5YyAmJiAheWNbMF07XHJcblxyXG4gICAgLy8gRWl0aGVyIHplcm8/XHJcbiAgICBpZiAoYSB8fCBiKSByZXR1cm4gYSA/IGIgPyAwIDogLWogOiBpO1xyXG5cclxuICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgIGlmIChpICE9IGopIHJldHVybiBpO1xyXG5cclxuICAgIGEgPSBpIDwgMDtcclxuICAgIGIgPSBrID09IGw7XHJcblxyXG4gICAgLy8gRWl0aGVyIEluZmluaXR5P1xyXG4gICAgaWYgKCF4YyB8fCAheWMpIHJldHVybiBiID8gMCA6ICF4YyBeIGEgPyAxIDogLTE7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBleHBvbmVudHMuXHJcbiAgICBpZiAoIWIpIHJldHVybiBrID4gbCBeIGEgPyAxIDogLTE7XHJcblxyXG4gICAgaiA9IChrID0geGMubGVuZ3RoKSA8IChsID0geWMubGVuZ3RoKSA/IGsgOiBsO1xyXG5cclxuICAgIC8vIENvbXBhcmUgZGlnaXQgYnkgZGlnaXQuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgajsgaSsrKSBpZiAoeGNbaV0gIT0geWNbaV0pIHJldHVybiB4Y1tpXSA+IHljW2ldIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICAvLyBDb21wYXJlIGxlbmd0aHMuXHJcbiAgICByZXR1cm4gayA9PSBsID8gMCA6IGsgPiBsIF4gYSA/IDEgOiAtMTtcclxuICB9XHJcblxyXG5cclxuICAvKlxyXG4gICAqIENoZWNrIHRoYXQgbiBpcyBhIHByaW1pdGl2ZSBudW1iZXIsIGFuIGludGVnZXIsIGFuZCBpbiByYW5nZSwgb3RoZXJ3aXNlIHRocm93LlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGludENoZWNrKG4sIG1pbiwgbWF4LCBuYW1lKSB7XHJcbiAgICBpZiAobiA8IG1pbiB8fCBuID4gbWF4IHx8IG4gIT09IG1hdGhmbG9vcihuKSkge1xyXG4gICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgKGJpZ251bWJlckVycm9yICsgKG5hbWUgfHwgJ0FyZ3VtZW50JykgKyAodHlwZW9mIG4gPT0gJ251bWJlcidcclxuICAgICAgICAgPyBuIDwgbWluIHx8IG4gPiBtYXggPyAnIG91dCBvZiByYW5nZTogJyA6ICcgbm90IGFuIGludGVnZXI6ICdcclxuICAgICAgICAgOiAnIG5vdCBhIHByaW1pdGl2ZSBudW1iZXI6ICcpICsgU3RyaW5nKG4pKTtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICAvLyBBc3N1bWVzIGZpbml0ZSBuLlxyXG4gIGZ1bmN0aW9uIGlzT2RkKG4pIHtcclxuICAgIHZhciBrID0gbi5jLmxlbmd0aCAtIDE7XHJcbiAgICByZXR1cm4gYml0Rmxvb3Iobi5lIC8gTE9HX0JBU0UpID09IGsgJiYgbi5jW2tdICUgMiAhPSAwO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIHRvRXhwb25lbnRpYWwoc3RyLCBlKSB7XHJcbiAgICByZXR1cm4gKHN0ci5sZW5ndGggPiAxID8gc3RyLmNoYXJBdCgwKSArICcuJyArIHN0ci5zbGljZSgxKSA6IHN0cikgK1xyXG4gICAgIChlIDwgMCA/ICdlJyA6ICdlKycpICsgZTtcclxuICB9XHJcblxyXG5cclxuICBmdW5jdGlvbiB0b0ZpeGVkUG9pbnQoc3RyLCBlLCB6KSB7XHJcbiAgICB2YXIgbGVuLCB6cztcclxuXHJcbiAgICAvLyBOZWdhdGl2ZSBleHBvbmVudD9cclxuICAgIGlmIChlIDwgMCkge1xyXG5cclxuICAgICAgLy8gUHJlcGVuZCB6ZXJvcy5cclxuICAgICAgZm9yICh6cyA9IHogKyAnLic7ICsrZTsgenMgKz0geik7XHJcbiAgICAgIHN0ciA9IHpzICsgc3RyO1xyXG5cclxuICAgIC8vIFBvc2l0aXZlIGV4cG9uZW50XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgLy8gQXBwZW5kIHplcm9zLlxyXG4gICAgICBpZiAoKytlID4gbGVuKSB7XHJcbiAgICAgICAgZm9yICh6cyA9IHosIGUgLT0gbGVuOyAtLWU7IHpzICs9IHopO1xyXG4gICAgICAgIHN0ciArPSB6cztcclxuICAgICAgfSBlbHNlIGlmIChlIDwgbGVuKSB7XHJcbiAgICAgICAgc3RyID0gc3RyLnNsaWNlKDAsIGUpICsgJy4nICsgc3RyLnNsaWNlKGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN0cjtcclxuICB9XHJcblxyXG5cclxuICAvLyBFWFBPUlRcclxuXHJcblxyXG4gIEJpZ051bWJlciA9IGNsb25lKCk7XHJcbiAgQmlnTnVtYmVyWydkZWZhdWx0J10gPSBCaWdOdW1iZXIuQmlnTnVtYmVyID0gQmlnTnVtYmVyO1xyXG5cclxuICAvLyBBTUQuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICBkZWZpbmUoZnVuY3Rpb24gKCkgeyByZXR1cm4gQmlnTnVtYmVyOyB9KTtcclxuXHJcbiAgLy8gTm9kZS5qcyBhbmQgb3RoZXIgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cy5cclxuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gQmlnTnVtYmVyO1xyXG5cclxuICAvLyBCcm93c2VyLlxyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAoIWdsb2JhbE9iamVjdCkge1xyXG4gICAgICBnbG9iYWxPYmplY3QgPSB0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJyAmJiBzZWxmID8gc2VsZiA6IHdpbmRvdztcclxuICAgIH1cclxuXHJcbiAgICBnbG9iYWxPYmplY3QuQmlnTnVtYmVyID0gQmlnTnVtYmVyO1xyXG4gIH1cclxufSkodGhpcyk7XHJcbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBCaWdudW1iZXIgPSByZXF1aXJlKCdiaWdudW1iZXIuanMnKS5CaWdOdW1iZXJcblxuZXhwb3J0cy5NVCA9IHtcbiAgUE9TX0lOVDogMCxcbiAgTkVHX0lOVDogMSxcbiAgQllURV9TVFJJTkc6IDIsXG4gIFVURjhfU1RSSU5HOiAzLFxuICBBUlJBWTogNCxcbiAgTUFQOiA1LFxuICBUQUc6IDYsXG4gIFNJTVBMRV9GTE9BVDogN1xufVxuXG5leHBvcnRzLlRBRyA9IHtcbiAgREFURV9TVFJJTkc6IDAsXG4gIERBVEVfRVBPQ0g6IDEsXG4gIFBPU19CSUdJTlQ6IDIsXG4gIE5FR19CSUdJTlQ6IDMsXG4gIERFQ0lNQUxfRlJBQzogNCxcbiAgQklHRkxPQVQ6IDUsXG4gIEJBU0U2NFVSTF9FWFBFQ1RFRDogMjEsXG4gIEJBU0U2NF9FWFBFQ1RFRDogMjIsXG4gIEJBU0UxNl9FWFBFQ1RFRDogMjMsXG4gIENCT1I6IDI0LFxuICBVUkk6IDMyLFxuICBCQVNFNjRVUkw6IDMzLFxuICBCQVNFNjQ6IDM0LFxuICBSRUdFWFA6IDM1LFxuICBNSU1FOiAzNlxufVxuXG5leHBvcnRzLk5VTUJZVEVTID0ge1xuICBaRVJPOiAwLFxuICBPTkU6IDI0LFxuICBUV086IDI1LFxuICBGT1VSOiAyNixcbiAgRUlHSFQ6IDI3LFxuICBJTkRFRklOSVRFOiAzMVxufVxuXG5leHBvcnRzLlNJTVBMRSA9IHtcbiAgRkFMU0U6IDIwLFxuICBUUlVFOiAyMSxcbiAgTlVMTDogMjIsXG4gIFVOREVGSU5FRDogMjNcbn1cblxuZXhwb3J0cy5TWU1TID0ge1xuICBOVUxMOiBTeW1ib2woJ251bGwnKSxcbiAgVU5ERUZJTkVEOiBTeW1ib2woJ3VuZGVmJyksXG4gIFBBUkVOVDogU3ltYm9sKCdwYXJlbnQnKSxcbiAgQlJFQUs6IFN5bWJvbCgnYnJlYWsnKSxcbiAgU1RSRUFNOiBTeW1ib2woJ3N0cmVhbScpXG59XG5cbmV4cG9ydHMuU0hJRlQzMiA9IE1hdGgucG93KDIsIDMyKVxuZXhwb3J0cy5TSElGVDE2ID0gTWF0aC5wb3coMiwgMTYpXG5cbmV4cG9ydHMuTUFYX1NBRkVfSElHSCA9IDB4MWZmZmZmXG5leHBvcnRzLk5FR19PTkUgPSBuZXcgQmlnbnVtYmVyKC0xKVxuZXhwb3J0cy5URU4gPSBuZXcgQmlnbnVtYmVyKDEwKVxuZXhwb3J0cy5UV08gPSBuZXcgQmlnbnVtYmVyKDIpXG5cbmV4cG9ydHMuUEFSRU5UID0ge1xuICBBUlJBWTogMCxcbiAgT0JKRUNUOiAxLFxuICBNQVA6IDIsXG4gIFRBRzogMyxcbiAgQllURV9TVFJJTkc6IDQsXG4gIFVURjhfU1RSSU5HOiA1XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlY29kZUFzbSAoc3RkbGliLCBmb3JlaWduLCBidWZmZXIpIHtcbiAgJ3VzZSBhc20nXG5cbiAgLy8gLS0gSW1wb3J0c1xuXG4gIHZhciBoZWFwID0gbmV3IHN0ZGxpYi5VaW50OEFycmF5KGJ1ZmZlcilcbiAgLy8gdmFyIGxvZyA9IGZvcmVpZ24ubG9nXG4gIHZhciBwdXNoSW50ID0gZm9yZWlnbi5wdXNoSW50XG4gIHZhciBwdXNoSW50MzIgPSBmb3JlaWduLnB1c2hJbnQzMlxuICB2YXIgcHVzaEludDMyTmVnID0gZm9yZWlnbi5wdXNoSW50MzJOZWdcbiAgdmFyIHB1c2hJbnQ2NCA9IGZvcmVpZ24ucHVzaEludDY0XG4gIHZhciBwdXNoSW50NjROZWcgPSBmb3JlaWduLnB1c2hJbnQ2NE5lZ1xuICB2YXIgcHVzaEZsb2F0ID0gZm9yZWlnbi5wdXNoRmxvYXRcbiAgdmFyIHB1c2hGbG9hdFNpbmdsZSA9IGZvcmVpZ24ucHVzaEZsb2F0U2luZ2xlXG4gIHZhciBwdXNoRmxvYXREb3VibGUgPSBmb3JlaWduLnB1c2hGbG9hdERvdWJsZVxuICB2YXIgcHVzaFRydWUgPSBmb3JlaWduLnB1c2hUcnVlXG4gIHZhciBwdXNoRmFsc2UgPSBmb3JlaWduLnB1c2hGYWxzZVxuICB2YXIgcHVzaFVuZGVmaW5lZCA9IGZvcmVpZ24ucHVzaFVuZGVmaW5lZFxuICB2YXIgcHVzaE51bGwgPSBmb3JlaWduLnB1c2hOdWxsXG4gIHZhciBwdXNoSW5maW5pdHkgPSBmb3JlaWduLnB1c2hJbmZpbml0eVxuICB2YXIgcHVzaEluZmluaXR5TmVnID0gZm9yZWlnbi5wdXNoSW5maW5pdHlOZWdcbiAgdmFyIHB1c2hOYU4gPSBmb3JlaWduLnB1c2hOYU5cbiAgdmFyIHB1c2hOYU5OZWcgPSBmb3JlaWduLnB1c2hOYU5OZWdcblxuICB2YXIgcHVzaEFycmF5U3RhcnQgPSBmb3JlaWduLnB1c2hBcnJheVN0YXJ0XG4gIHZhciBwdXNoQXJyYXlTdGFydEZpeGVkID0gZm9yZWlnbi5wdXNoQXJyYXlTdGFydEZpeGVkXG4gIHZhciBwdXNoQXJyYXlTdGFydEZpeGVkMzIgPSBmb3JlaWduLnB1c2hBcnJheVN0YXJ0Rml4ZWQzMlxuICB2YXIgcHVzaEFycmF5U3RhcnRGaXhlZDY0ID0gZm9yZWlnbi5wdXNoQXJyYXlTdGFydEZpeGVkNjRcbiAgdmFyIHB1c2hPYmplY3RTdGFydCA9IGZvcmVpZ24ucHVzaE9iamVjdFN0YXJ0XG4gIHZhciBwdXNoT2JqZWN0U3RhcnRGaXhlZCA9IGZvcmVpZ24ucHVzaE9iamVjdFN0YXJ0Rml4ZWRcbiAgdmFyIHB1c2hPYmplY3RTdGFydEZpeGVkMzIgPSBmb3JlaWduLnB1c2hPYmplY3RTdGFydEZpeGVkMzJcbiAgdmFyIHB1c2hPYmplY3RTdGFydEZpeGVkNjQgPSBmb3JlaWduLnB1c2hPYmplY3RTdGFydEZpeGVkNjRcblxuICB2YXIgcHVzaEJ5dGVTdHJpbmcgPSBmb3JlaWduLnB1c2hCeXRlU3RyaW5nXG4gIHZhciBwdXNoQnl0ZVN0cmluZ1N0YXJ0ID0gZm9yZWlnbi5wdXNoQnl0ZVN0cmluZ1N0YXJ0XG4gIHZhciBwdXNoVXRmOFN0cmluZyA9IGZvcmVpZ24ucHVzaFV0ZjhTdHJpbmdcbiAgdmFyIHB1c2hVdGY4U3RyaW5nU3RhcnQgPSBmb3JlaWduLnB1c2hVdGY4U3RyaW5nU3RhcnRcblxuICB2YXIgcHVzaFNpbXBsZVVuYXNzaWduZWQgPSBmb3JlaWduLnB1c2hTaW1wbGVVbmFzc2lnbmVkXG5cbiAgdmFyIHB1c2hUYWdTdGFydCA9IGZvcmVpZ24ucHVzaFRhZ1N0YXJ0XG4gIHZhciBwdXNoVGFnU3RhcnQ0ID0gZm9yZWlnbi5wdXNoVGFnU3RhcnQ0XG4gIHZhciBwdXNoVGFnU3RhcnQ4ID0gZm9yZWlnbi5wdXNoVGFnU3RhcnQ4XG4gIHZhciBwdXNoVGFnVW5hc3NpZ25lZCA9IGZvcmVpZ24ucHVzaFRhZ1VuYXNzaWduZWRcblxuICB2YXIgcHVzaEJyZWFrID0gZm9yZWlnbi5wdXNoQnJlYWtcblxuICB2YXIgcG93ID0gc3RkbGliLk1hdGgucG93XG5cbiAgLy8gLS0gQ29uc3RhbnRzXG5cblxuICAvLyAtLSBNdXRhYmxlIFZhcmlhYmxlc1xuXG4gIHZhciBvZmZzZXQgPSAwXG4gIHZhciBpbnB1dExlbmd0aCA9IDBcbiAgdmFyIGNvZGUgPSAwXG5cbiAgLy8gRGVjb2RlIGEgY2JvciBzdHJpbmcgcmVwcmVzZW50ZWQgYXMgVWludDhBcnJheVxuICAvLyB3aGljaCBpcyBhbGxvY2F0ZWQgb24gdGhlIGhlYXAgZnJvbSAwIHRvIGlucHV0TGVuZ3RoXG4gIC8vXG4gIC8vIGlucHV0IC0gSW50XG4gIC8vXG4gIC8vIFJldHVybnMgQ29kZSAtIEludCxcbiAgLy8gU3VjY2VzcyA9IDBcbiAgLy8gRXJyb3IgPiAwXG4gIGZ1bmN0aW9uIHBhcnNlIChpbnB1dCkge1xuICAgIGlucHV0ID0gaW5wdXQgfCAwXG5cbiAgICBvZmZzZXQgPSAwXG4gICAgaW5wdXRMZW5ndGggPSBpbnB1dFxuXG4gICAgd2hpbGUgKChvZmZzZXQgfCAwKSA8IChpbnB1dExlbmd0aCB8IDApKSB7XG4gICAgICBjb2RlID0ganVtcFRhYmxlW2hlYXBbb2Zmc2V0XSAmIDI1NV0oaGVhcFtvZmZzZXRdIHwgMCkgfCAwXG5cbiAgICAgIGlmICgoY29kZSB8IDApID4gMCkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb2RlIHwgMFxuICB9XG5cbiAgLy8gLS0gSGVscGVyIEZ1bmN0aW9uXG5cbiAgZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG4pIHtcbiAgICBuID0gbiB8IDBcblxuICAgIGlmICgoKChvZmZzZXQgfCAwKSArIChuIHwgMCkpIHwgMCkgPCAoaW5wdXRMZW5ndGggfCAwKSkge1xuICAgICAgcmV0dXJuIDBcbiAgICB9XG5cbiAgICByZXR1cm4gMVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFVJbnQxNiAobikge1xuICAgIG4gPSBuIHwgMFxuXG4gICAgcmV0dXJuIChcbiAgICAgIChoZWFwW24gfCAwXSA8PCA4KSB8IGhlYXBbKG4gKyAxKSB8IDBdXG4gICAgKSB8IDBcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRVSW50MzIgKG4pIHtcbiAgICBuID0gbiB8IDBcblxuICAgIHJldHVybiAoXG4gICAgICAoaGVhcFtuIHwgMF0gPDwgMjQpIHwgKGhlYXBbKG4gKyAxKSB8IDBdIDw8IDE2KSB8IChoZWFwWyhuICsgMikgfCAwXSA8PCA4KSB8IGhlYXBbKG4gKyAzKSB8IDBdXG4gICAgKSB8IDBcbiAgfVxuXG4gIC8vIC0tIEluaXRpYWwgQnl0ZSBIYW5kbGVyc1xuXG4gIGZ1bmN0aW9uIElOVF9QIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoSW50KG9jdGV0IHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBVSU5UX1BfOCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDEpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoSW50KGhlYXBbKG9mZnNldCArIDEpIHwgMF0gfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDIpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFVJTlRfUF8xNiAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDIpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoSW50KFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMykgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVUlOVF9QXzMyIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoNCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hJbnQzMihcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMykgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgNSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVUlOVF9QXzY0IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoOCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hJbnQ2NChcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMykgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyA1KSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDcpIHwgMCkgfCAwXG4gICAgKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDkpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIElOVF9OIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoSW50KCgtMSAtICgob2N0ZXQgLSAzMikgfCAwKSkgfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFVJTlRfTl84IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMSkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hJbnQoXG4gICAgICAoLTEgLSAoaGVhcFsob2Zmc2V0ICsgMSkgfCAwXSB8IDApKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMikgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVUlOVF9OXzE2IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICB2YXIgdmFsID0gMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDIpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICB2YWwgPSByZWFkVUludDE2KChvZmZzZXQgKyAxKSB8IDApIHwgMFxuICAgIHB1c2hJbnQoKC0xIC0gKHZhbCB8IDApKSB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMykgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVUlOVF9OXzMyIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoNCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hJbnQzMk5lZyhcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMykgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgNSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVUlOVF9OXzY0IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoOCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hJbnQ2NE5lZyhcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMykgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyA1KSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDcpIHwgMCkgfCAwXG4gICAgKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDkpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIEJZVEVfU1RSSU5HIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICB2YXIgc3RhcnQgPSAwXG4gICAgdmFyIGVuZCA9IDBcbiAgICB2YXIgc3RlcCA9IDBcblxuICAgIHN0ZXAgPSAob2N0ZXQgLSA2NCkgfCAwXG4gICAgaWYgKGNoZWNrT2Zmc2V0KHN0ZXAgfCAwKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgc3RhcnQgPSAob2Zmc2V0ICsgMSkgfCAwXG4gICAgZW5kID0gKCgob2Zmc2V0ICsgMSkgfCAwKSArIChzdGVwIHwgMCkpIHwgMFxuXG4gICAgcHVzaEJ5dGVTdHJpbmcoc3RhcnQgfCAwLCBlbmQgfCAwKVxuXG4gICAgb2Zmc2V0ID0gZW5kIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIEJZVEVfU1RSSU5HXzggKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHZhciBzdGFydCA9IDBcbiAgICB2YXIgZW5kID0gMFxuICAgIHZhciBsZW5ndGggPSAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMSkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIGxlbmd0aCA9IGhlYXBbKG9mZnNldCArIDEpIHwgMF0gfCAwXG4gICAgc3RhcnQgPSAob2Zmc2V0ICsgMikgfCAwXG4gICAgZW5kID0gKCgob2Zmc2V0ICsgMikgfCAwKSArIChsZW5ndGggfCAwKSkgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoKGxlbmd0aCArIDEpIHwgMCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hCeXRlU3RyaW5nKHN0YXJ0IHwgMCwgZW5kIHwgMClcblxuICAgIG9mZnNldCA9IGVuZCB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBCWVRFX1NUUklOR18xNiAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgdmFyIHN0YXJ0ID0gMFxuICAgIHZhciBlbmQgPSAwXG4gICAgdmFyIGxlbmd0aCA9IDBcblxuICAgIGlmIChjaGVja09mZnNldCgyKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgbGVuZ3RoID0gcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDBcbiAgICBzdGFydCA9IChvZmZzZXQgKyAzKSB8IDBcbiAgICBlbmQgPSAoKChvZmZzZXQgKyAzKSB8IDApICsgKGxlbmd0aCB8IDApKSB8IDBcblxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KChsZW5ndGggKyAyKSB8IDApIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoQnl0ZVN0cmluZyhzdGFydCB8IDAsIGVuZCB8IDApXG5cbiAgICBvZmZzZXQgPSBlbmQgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gQllURV9TVFJJTkdfMzIgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHZhciBzdGFydCA9IDBcbiAgICB2YXIgZW5kID0gMFxuICAgIHZhciBsZW5ndGggPSAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoNCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIGxlbmd0aCA9IHJlYWRVSW50MzIoKG9mZnNldCArIDEpIHwgMCkgfCAwXG4gICAgc3RhcnQgPSAob2Zmc2V0ICsgNSkgfCAwXG4gICAgZW5kID0gKCgob2Zmc2V0ICsgNSkgfCAwKSArIChsZW5ndGggfCAwKSkgfCAwXG5cblxuICAgIGlmIChjaGVja09mZnNldCgobGVuZ3RoICsgNCkgfCAwKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEJ5dGVTdHJpbmcoc3RhcnQgfCAwLCBlbmQgfCAwKVxuXG4gICAgb2Zmc2V0ID0gZW5kIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIEJZVEVfU1RSSU5HXzY0IChvY3RldCkge1xuICAgIC8vIE5PVCBJTVBMRU1FTlRFRFxuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICByZXR1cm4gMVxuICB9XG5cbiAgZnVuY3Rpb24gQllURV9TVFJJTkdfQlJFQUsgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hCeXRlU3RyaW5nU3RhcnQoKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFVURjhfU1RSSU5HIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICB2YXIgc3RhcnQgPSAwXG4gICAgdmFyIGVuZCA9IDBcbiAgICB2YXIgc3RlcCA9IDBcblxuICAgIHN0ZXAgPSAob2N0ZXQgLSA5NikgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoc3RlcCB8IDApIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBzdGFydCA9IChvZmZzZXQgKyAxKSB8IDBcbiAgICBlbmQgPSAoKChvZmZzZXQgKyAxKSB8IDApICsgKHN0ZXAgfCAwKSkgfCAwXG5cbiAgICBwdXNoVXRmOFN0cmluZyhzdGFydCB8IDAsIGVuZCB8IDApXG5cbiAgICBvZmZzZXQgPSBlbmQgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVVRGOF9TVFJJTkdfOCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgdmFyIHN0YXJ0ID0gMFxuICAgIHZhciBlbmQgPSAwXG4gICAgdmFyIGxlbmd0aCA9IDBcblxuICAgIGlmIChjaGVja09mZnNldCgxKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgbGVuZ3RoID0gaGVhcFsob2Zmc2V0ICsgMSkgfCAwXSB8IDBcbiAgICBzdGFydCA9IChvZmZzZXQgKyAyKSB8IDBcbiAgICBlbmQgPSAoKChvZmZzZXQgKyAyKSB8IDApICsgKGxlbmd0aCB8IDApKSB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgobGVuZ3RoICsgMSkgfCAwKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaFV0ZjhTdHJpbmcoc3RhcnQgfCAwLCBlbmQgfCAwKVxuXG4gICAgb2Zmc2V0ID0gZW5kIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFVURjhfU1RSSU5HXzE2IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICB2YXIgc3RhcnQgPSAwXG4gICAgdmFyIGVuZCA9IDBcbiAgICB2YXIgbGVuZ3RoID0gMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDIpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBsZW5ndGggPSByZWFkVUludDE2KChvZmZzZXQgKyAxKSB8IDApIHwgMFxuICAgIHN0YXJ0ID0gKG9mZnNldCArIDMpIHwgMFxuICAgIGVuZCA9ICgoKG9mZnNldCArIDMpIHwgMCkgKyAobGVuZ3RoIHwgMCkpIHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KChsZW5ndGggKyAyKSB8IDApIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoVXRmOFN0cmluZyhzdGFydCB8IDAsIGVuZCB8IDApXG5cbiAgICBvZmZzZXQgPSBlbmQgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVVRGOF9TVFJJTkdfMzIgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHZhciBzdGFydCA9IDBcbiAgICB2YXIgZW5kID0gMFxuICAgIHZhciBsZW5ndGggPSAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoNCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIGxlbmd0aCA9IHJlYWRVSW50MzIoKG9mZnNldCArIDEpIHwgMCkgfCAwXG4gICAgc3RhcnQgPSAob2Zmc2V0ICsgNSkgfCAwXG4gICAgZW5kID0gKCgob2Zmc2V0ICsgNSkgfCAwKSArIChsZW5ndGggfCAwKSkgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoKGxlbmd0aCArIDQpIHwgMCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hVdGY4U3RyaW5nKHN0YXJ0IHwgMCwgZW5kIHwgMClcblxuICAgIG9mZnNldCA9IGVuZCB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBVVEY4X1NUUklOR182NCAob2N0ZXQpIHtcbiAgICAvLyBOT1QgSU1QTEVNRU5URURcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIGZ1bmN0aW9uIFVURjhfU1RSSU5HX0JSRUFLIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoVXRmOFN0cmluZ1N0YXJ0KClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBBUlJBWSAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaEFycmF5U3RhcnRGaXhlZCgob2N0ZXQgLSAxMjgpIHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBBUlJBWV84IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMSkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hBcnJheVN0YXJ0Rml4ZWQoaGVhcFsob2Zmc2V0ICsgMSkgfCAwXSB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMikgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gQVJSQVlfMTYgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgyKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEFycmF5U3RhcnRGaXhlZChcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwXG4gICAgKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDMpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIEFSUkFZXzMyIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoNCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hBcnJheVN0YXJ0Rml4ZWQzMihcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMykgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgNSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gQVJSQVlfNjQgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg4KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEFycmF5U3RhcnRGaXhlZDY0KFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAzKSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDUpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgNykgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgOSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gQVJSQVlfQlJFQUsgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hBcnJheVN0YXJ0KClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBNQVAgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHZhciBzdGVwID0gMFxuXG4gICAgc3RlcCA9IChvY3RldCAtIDE2MCkgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoc3RlcCB8IDApIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoT2JqZWN0U3RhcnRGaXhlZChzdGVwIHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBNQVBfOCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDEpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoT2JqZWN0U3RhcnRGaXhlZChoZWFwWyhvZmZzZXQgKyAxKSB8IDBdIHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAyKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBNQVBfMTYgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgyKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaE9iamVjdFN0YXJ0Rml4ZWQoXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAxKSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAzKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBNQVBfMzIgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg0KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaE9iamVjdFN0YXJ0Rml4ZWQzMihcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMykgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgNSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gTUFQXzY0IChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoOCkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hPYmplY3RTdGFydEZpeGVkNjQoXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAxKSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDMpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgNSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyA3KSB8IDApIHwgMFxuICAgIClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyA5KSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBNQVBfQlJFQUsgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hPYmplY3RTdGFydCgpXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX0tOT1dOIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoVGFnU3RhcnQoKG9jdGV0IC0gMTkyfCAwKSB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX0JJR05VTV9QT1MgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hUYWdTdGFydChvY3RldCB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX0JJR05VTV9ORUcgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hUYWdTdGFydChvY3RldCB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX0ZSQUMgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hUYWdTdGFydChvY3RldCB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX0JJR05VTV9GTE9BVCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFRhZ1N0YXJ0KG9jdGV0IHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxIHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfVU5BU1NJR05FRCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFRhZ1N0YXJ0KChvY3RldCAtIDE5MnwgMCkgfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEgfCAwKVxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFRBR19CQVNFNjRfVVJMIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoVGFnU3RhcnQob2N0ZXQgfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEgfCAwKVxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFRBR19CQVNFNjQgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hUYWdTdGFydChvY3RldCB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX0JBU0UxNiAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFRhZ1N0YXJ0KG9jdGV0IHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxIHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfTU9SRV8xIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMSkgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hUYWdTdGFydChoZWFwWyhvZmZzZXQgKyAxKSB8IDBdIHwgMClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAyIHwgMClcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBUQUdfTU9SRV8yIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBpZiAoY2hlY2tPZmZzZXQoMikgfCAwKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIHB1c2hUYWdTdGFydChcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwXG4gICAgKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDMgfCAwKVxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFRBR19NT1JFXzQgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg0KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaFRhZ1N0YXJ0NChcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDEpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMykgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgNSB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gVEFHX01PUkVfOCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDgpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoVGFnU3RhcnQ4KFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgMSkgfCAwKSB8IDAsXG4gICAgICByZWFkVUludDE2KChvZmZzZXQgKyAzKSB8IDApIHwgMCxcbiAgICAgIHJlYWRVSW50MTYoKG9mZnNldCArIDUpIHwgMCkgfCAwLFxuICAgICAgcmVhZFVJbnQxNigob2Zmc2V0ICsgNykgfCAwKSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgOSB8IDApXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gU0lNUExFX1VOQVNTSUdORUQgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hTaW1wbGVVbmFzc2lnbmVkKCgob2N0ZXQgfCAwKSAtIDIyNCkgfCAwKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFNJTVBMRV9GQUxTRSAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaEZhbHNlKClcblxuICAgIG9mZnNldCA9IChvZmZzZXQgKyAxKSB8IDBcblxuICAgIHJldHVybiAwXG4gIH1cblxuICBmdW5jdGlvbiBTSU1QTEVfVFJVRSAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFRydWUoKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDEpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFNJTVBMRV9OVUxMIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICBwdXNoTnVsbCgpXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gU0lNUExFX1VOREVGSU5FRCAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgcHVzaFVuZGVmaW5lZCgpXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gU0lNUExFX0JZVEUgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCgxKSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaFNpbXBsZVVuYXNzaWduZWQoaGVhcFsob2Zmc2V0ICsgMSkgfCAwXSB8IDApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMikgIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFNJTVBMRV9GTE9BVF9IQUxGIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICB2YXIgZiA9IDBcbiAgICB2YXIgZyA9IDBcbiAgICB2YXIgc2lnbiA9IDEuMFxuICAgIHZhciBleHAgPSAwLjBcbiAgICB2YXIgbWFudCA9IDAuMFxuICAgIHZhciByID0gMC4wXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDIpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBmID0gaGVhcFsob2Zmc2V0ICsgMSkgfCAwXSB8IDBcbiAgICBnID0gaGVhcFsob2Zmc2V0ICsgMikgfCAwXSB8IDBcblxuICAgIGlmICgoZiB8IDApICYgMHg4MCkge1xuICAgICAgc2lnbiA9IC0xLjBcbiAgICB9XG5cbiAgICBleHAgPSArKCgoZiB8IDApICYgMHg3QykgPj4gMilcbiAgICBtYW50ID0gKygoKChmIHwgMCkgJiAweDAzKSA8PCA4KSB8IGcpXG5cbiAgICBpZiAoK2V4cCA9PSAwLjApIHtcbiAgICAgIHB1c2hGbG9hdCgrKFxuICAgICAgICAoK3NpZ24pICogKzUuOTYwNDY0NDc3NTM5MDYyNWUtOCAqICgrbWFudClcbiAgICAgICkpXG4gICAgfSBlbHNlIGlmICgrZXhwID09IDMxLjApIHtcbiAgICAgIGlmICgrc2lnbiA9PSAxLjApIHtcbiAgICAgICAgaWYgKCttYW50ID4gMC4wKSB7XG4gICAgICAgICAgcHVzaE5hTigpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHVzaEluZmluaXR5KClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCttYW50ID4gMC4wKSB7XG4gICAgICAgICAgcHVzaE5hTk5lZygpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHVzaEluZmluaXR5TmVnKClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwdXNoRmxvYXQoKyhcbiAgICAgICAgK3NpZ24gKiBwb3coKzIsICsoK2V4cCAtIDI1LjApKSAqICsoMTAyNC4wICsgbWFudClcbiAgICAgICkpXG4gICAgfVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDMpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIFNJTVBMRV9GTE9BVF9TSU5HTEUgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIGlmIChjaGVja09mZnNldCg0KSB8IDApIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuXG4gICAgcHVzaEZsb2F0U2luZ2xlKFxuICAgICAgaGVhcFsob2Zmc2V0ICsgMSkgfCAwXSB8IDAsXG4gICAgICBoZWFwWyhvZmZzZXQgKyAyKSB8IDBdIHwgMCxcbiAgICAgIGhlYXBbKG9mZnNldCArIDMpIHwgMF0gfCAwLFxuICAgICAgaGVhcFsob2Zmc2V0ICsgNCkgfCAwXSB8IDBcbiAgICApXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgNSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgZnVuY3Rpb24gU0lNUExFX0ZMT0FUX0RPVUJMRSAob2N0ZXQpIHtcbiAgICBvY3RldCA9IG9jdGV0IHwgMFxuXG4gICAgaWYgKGNoZWNrT2Zmc2V0KDgpIHwgMCkge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBwdXNoRmxvYXREb3VibGUoXG4gICAgICBoZWFwWyhvZmZzZXQgKyAxKSB8IDBdIHwgMCxcbiAgICAgIGhlYXBbKG9mZnNldCArIDIpIHwgMF0gfCAwLFxuICAgICAgaGVhcFsob2Zmc2V0ICsgMykgfCAwXSB8IDAsXG4gICAgICBoZWFwWyhvZmZzZXQgKyA0KSB8IDBdIHwgMCxcbiAgICAgIGhlYXBbKG9mZnNldCArIDUpIHwgMF0gfCAwLFxuICAgICAgaGVhcFsob2Zmc2V0ICsgNikgfCAwXSB8IDAsXG4gICAgICBoZWFwWyhvZmZzZXQgKyA3KSB8IDBdIHwgMCxcbiAgICAgIGhlYXBbKG9mZnNldCArIDgpIHwgMF0gfCAwXG4gICAgKVxuXG4gICAgb2Zmc2V0ID0gKG9mZnNldCArIDkpIHwgMFxuXG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIGZ1bmN0aW9uIEVSUk9SIChvY3RldCkge1xuICAgIG9jdGV0ID0gb2N0ZXQgfCAwXG5cbiAgICByZXR1cm4gMVxuICB9XG5cbiAgZnVuY3Rpb24gQlJFQUsgKG9jdGV0KSB7XG4gICAgb2N0ZXQgPSBvY3RldCB8IDBcblxuICAgIHB1c2hCcmVhaygpXG5cbiAgICBvZmZzZXQgPSAob2Zmc2V0ICsgMSkgfCAwXG5cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgLy8gLS0gSnVtcCBUYWJsZVxuXG4gIHZhciBqdW1wVGFibGUgPSBbXG4gICAgLy8gSW50ZWdlciAweDAwLi4weDE3ICgwLi4yMylcbiAgICBJTlRfUCwgLy8gMHgwMFxuICAgIElOVF9QLCAvLyAweDAxXG4gICAgSU5UX1AsIC8vIDB4MDJcbiAgICBJTlRfUCwgLy8gMHgwM1xuICAgIElOVF9QLCAvLyAweDA0XG4gICAgSU5UX1AsIC8vIDB4MDVcbiAgICBJTlRfUCwgLy8gMHgwNlxuICAgIElOVF9QLCAvLyAweDA3XG4gICAgSU5UX1AsIC8vIDB4MDhcbiAgICBJTlRfUCwgLy8gMHgwOVxuICAgIElOVF9QLCAvLyAweDBBXG4gICAgSU5UX1AsIC8vIDB4MEJcbiAgICBJTlRfUCwgLy8gMHgwQ1xuICAgIElOVF9QLCAvLyAweDBEXG4gICAgSU5UX1AsIC8vIDB4MEVcbiAgICBJTlRfUCwgLy8gMHgwRlxuICAgIElOVF9QLCAvLyAweDEwXG4gICAgSU5UX1AsIC8vIDB4MTFcbiAgICBJTlRfUCwgLy8gMHgxMlxuICAgIElOVF9QLCAvLyAweDEzXG4gICAgSU5UX1AsIC8vIDB4MTRcbiAgICBJTlRfUCwgLy8gMHgxNVxuICAgIElOVF9QLCAvLyAweDE2XG4gICAgSU5UX1AsIC8vIDB4MTdcbiAgICAvLyBVbnNpZ25lZCBpbnRlZ2VyIChvbmUtYnl0ZSB1aW50OF90IGZvbGxvd3MpXG4gICAgVUlOVF9QXzgsIC8vIDB4MThcbiAgICAvLyBVbnNpZ25lZCBpbnRlZ2VyICh0d28tYnl0ZSB1aW50MTZfdCBmb2xsb3dzKVxuICAgIFVJTlRfUF8xNiwgLy8gMHgxOVxuICAgIC8vIFVuc2lnbmVkIGludGVnZXIgKGZvdXItYnl0ZSB1aW50MzJfdCBmb2xsb3dzKVxuICAgIFVJTlRfUF8zMiwgLy8gMHgxYVxuICAgIC8vIFVuc2lnbmVkIGludGVnZXIgKGVpZ2h0LWJ5dGUgdWludDY0X3QgZm9sbG93cylcbiAgICBVSU5UX1BfNjQsIC8vIDB4MWJcbiAgICBFUlJPUiwgLy8gMHgxY1xuICAgIEVSUk9SLCAvLyAweDFkXG4gICAgRVJST1IsIC8vIDB4MWVcbiAgICBFUlJPUiwgLy8gMHgxZlxuICAgIC8vIE5lZ2F0aXZlIGludGVnZXIgLTEtMHgwMC4uLTEtMHgxNyAoLTEuLi0yNClcbiAgICBJTlRfTiwgLy8gMHgyMFxuICAgIElOVF9OLCAvLyAweDIxXG4gICAgSU5UX04sIC8vIDB4MjJcbiAgICBJTlRfTiwgLy8gMHgyM1xuICAgIElOVF9OLCAvLyAweDI0XG4gICAgSU5UX04sIC8vIDB4MjVcbiAgICBJTlRfTiwgLy8gMHgyNlxuICAgIElOVF9OLCAvLyAweDI3XG4gICAgSU5UX04sIC8vIDB4MjhcbiAgICBJTlRfTiwgLy8gMHgyOVxuICAgIElOVF9OLCAvLyAweDJBXG4gICAgSU5UX04sIC8vIDB4MkJcbiAgICBJTlRfTiwgLy8gMHgyQ1xuICAgIElOVF9OLCAvLyAweDJEXG4gICAgSU5UX04sIC8vIDB4MkVcbiAgICBJTlRfTiwgLy8gMHgyRlxuICAgIElOVF9OLCAvLyAweDMwXG4gICAgSU5UX04sIC8vIDB4MzFcbiAgICBJTlRfTiwgLy8gMHgzMlxuICAgIElOVF9OLCAvLyAweDMzXG4gICAgSU5UX04sIC8vIDB4MzRcbiAgICBJTlRfTiwgLy8gMHgzNVxuICAgIElOVF9OLCAvLyAweDM2XG4gICAgSU5UX04sIC8vIDB4MzdcbiAgICAvLyBOZWdhdGl2ZSBpbnRlZ2VyIC0xLW4gKG9uZS1ieXRlIHVpbnQ4X3QgZm9yIG4gZm9sbG93cylcbiAgICBVSU5UX05fOCwgLy8gMHgzOFxuICAgIC8vIE5lZ2F0aXZlIGludGVnZXIgLTEtbiAodHdvLWJ5dGUgdWludDE2X3QgZm9yIG4gZm9sbG93cylcbiAgICBVSU5UX05fMTYsIC8vIDB4MzlcbiAgICAvLyBOZWdhdGl2ZSBpbnRlZ2VyIC0xLW4gKGZvdXItYnl0ZSB1aW50MzJfdCBmb3IgbmZvbGxvd3MpXG4gICAgVUlOVF9OXzMyLCAvLyAweDNhXG4gICAgLy8gTmVnYXRpdmUgaW50ZWdlciAtMS1uIChlaWdodC1ieXRlIHVpbnQ2NF90IGZvciBuIGZvbGxvd3MpXG4gICAgVUlOVF9OXzY0LCAvLyAweDNiXG4gICAgRVJST1IsIC8vIDB4M2NcbiAgICBFUlJPUiwgLy8gMHgzZFxuICAgIEVSUk9SLCAvLyAweDNlXG4gICAgRVJST1IsIC8vIDB4M2ZcbiAgICAvLyBieXRlIHN0cmluZyAoMHgwMC4uMHgxNyBieXRlcyBmb2xsb3cpXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NDBcbiAgICBCWVRFX1NUUklORywgLy8gMHg0MVxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDQyXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NDNcbiAgICBCWVRFX1NUUklORywgLy8gMHg0NFxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDQ1XG4gICAgQllURV9TVFJJTkcsIC8vIDB4NDZcbiAgICBCWVRFX1NUUklORywgLy8gMHg0N1xuICAgIEJZVEVfU1RSSU5HLCAvLyAweDQ4XG4gICAgQllURV9TVFJJTkcsIC8vIDB4NDlcbiAgICBCWVRFX1NUUklORywgLy8gMHg0QVxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDRCXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NENcbiAgICBCWVRFX1NUUklORywgLy8gMHg0RFxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDRFXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NEZcbiAgICBCWVRFX1NUUklORywgLy8gMHg1MFxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDUxXG4gICAgQllURV9TVFJJTkcsIC8vIDB4NTJcbiAgICBCWVRFX1NUUklORywgLy8gMHg1M1xuICAgIEJZVEVfU1RSSU5HLCAvLyAweDU0XG4gICAgQllURV9TVFJJTkcsIC8vIDB4NTVcbiAgICBCWVRFX1NUUklORywgLy8gMHg1NlxuICAgIEJZVEVfU1RSSU5HLCAvLyAweDU3XG4gICAgLy8gYnl0ZSBzdHJpbmcgKG9uZS1ieXRlIHVpbnQ4X3QgZm9yIG4sIGFuZCB0aGVuIG4gYnl0ZXMgZm9sbG93KVxuICAgIEJZVEVfU1RSSU5HXzgsIC8vIDB4NThcbiAgICAvLyBieXRlIHN0cmluZyAodHdvLWJ5dGUgdWludDE2X3QgZm9yIG4sIGFuZCB0aGVuIG4gYnl0ZXMgZm9sbG93KVxuICAgIEJZVEVfU1RSSU5HXzE2LCAvLyAweDU5XG4gICAgLy8gYnl0ZSBzdHJpbmcgKGZvdXItYnl0ZSB1aW50MzJfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3cpXG4gICAgQllURV9TVFJJTkdfMzIsIC8vIDB4NWFcbiAgICAvLyBieXRlIHN0cmluZyAoZWlnaHQtYnl0ZSB1aW50NjRfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3cpXG4gICAgQllURV9TVFJJTkdfNjQsIC8vIDB4NWJcbiAgICBFUlJPUiwgLy8gMHg1Y1xuICAgIEVSUk9SLCAvLyAweDVkXG4gICAgRVJST1IsIC8vIDB4NWVcbiAgICAvLyBieXRlIHN0cmluZywgYnl0ZSBzdHJpbmdzIGZvbGxvdywgdGVybWluYXRlZCBieSBcImJyZWFrXCJcbiAgICBCWVRFX1NUUklOR19CUkVBSywgLy8gMHg1ZlxuICAgIC8vIFVURi04IHN0cmluZyAoMHgwMC4uMHgxNyBieXRlcyBmb2xsb3cpXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NjBcbiAgICBVVEY4X1NUUklORywgLy8gMHg2MVxuICAgIFVURjhfU1RSSU5HLCAvLyAweDYyXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NjNcbiAgICBVVEY4X1NUUklORywgLy8gMHg2NFxuICAgIFVURjhfU1RSSU5HLCAvLyAweDY1XG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NjZcbiAgICBVVEY4X1NUUklORywgLy8gMHg2N1xuICAgIFVURjhfU1RSSU5HLCAvLyAweDY4XG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NjlcbiAgICBVVEY4X1NUUklORywgLy8gMHg2QVxuICAgIFVURjhfU1RSSU5HLCAvLyAweDZCXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NkNcbiAgICBVVEY4X1NUUklORywgLy8gMHg2RFxuICAgIFVURjhfU1RSSU5HLCAvLyAweDZFXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NkZcbiAgICBVVEY4X1NUUklORywgLy8gMHg3MFxuICAgIFVURjhfU1RSSU5HLCAvLyAweDcxXG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NzJcbiAgICBVVEY4X1NUUklORywgLy8gMHg3M1xuICAgIFVURjhfU1RSSU5HLCAvLyAweDc0XG4gICAgVVRGOF9TVFJJTkcsIC8vIDB4NzVcbiAgICBVVEY4X1NUUklORywgLy8gMHg3NlxuICAgIFVURjhfU1RSSU5HLCAvLyAweDc3XG4gICAgLy8gVVRGLTggc3RyaW5nIChvbmUtYnl0ZSB1aW50OF90IGZvciBuLCBhbmQgdGhlbiBuIGJ5dGVzIGZvbGxvdylcbiAgICBVVEY4X1NUUklOR184LCAvLyAweDc4XG4gICAgLy8gVVRGLTggc3RyaW5nICh0d28tYnl0ZSB1aW50MTZfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3cpXG4gICAgVVRGOF9TVFJJTkdfMTYsIC8vIDB4NzlcbiAgICAvLyBVVEYtOCBzdHJpbmcgKGZvdXItYnl0ZSB1aW50MzJfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3cpXG4gICAgVVRGOF9TVFJJTkdfMzIsIC8vIDB4N2FcbiAgICAvLyBVVEYtOCBzdHJpbmcgKGVpZ2h0LWJ5dGUgdWludDY0X3QgZm9yIG4sIGFuZCB0aGVuIG4gYnl0ZXMgZm9sbG93KVxuICAgIFVURjhfU1RSSU5HXzY0LCAvLyAweDdiXG4gICAgLy8gVVRGLTggc3RyaW5nLCBVVEYtOCBzdHJpbmdzIGZvbGxvdywgdGVybWluYXRlZCBieSBcImJyZWFrXCJcbiAgICBFUlJPUiwgLy8gMHg3Y1xuICAgIEVSUk9SLCAvLyAweDdkXG4gICAgRVJST1IsIC8vIDB4N2VcbiAgICBVVEY4X1NUUklOR19CUkVBSywgLy8gMHg3ZlxuICAgIC8vIGFycmF5ICgweDAwLi4weDE3IGRhdGEgaXRlbXMgZm9sbG93KVxuICAgIEFSUkFZLCAvLyAweDgwXG4gICAgQVJSQVksIC8vIDB4ODFcbiAgICBBUlJBWSwgLy8gMHg4MlxuICAgIEFSUkFZLCAvLyAweDgzXG4gICAgQVJSQVksIC8vIDB4ODRcbiAgICBBUlJBWSwgLy8gMHg4NVxuICAgIEFSUkFZLCAvLyAweDg2XG4gICAgQVJSQVksIC8vIDB4ODdcbiAgICBBUlJBWSwgLy8gMHg4OFxuICAgIEFSUkFZLCAvLyAweDg5XG4gICAgQVJSQVksIC8vIDB4OEFcbiAgICBBUlJBWSwgLy8gMHg4QlxuICAgIEFSUkFZLCAvLyAweDhDXG4gICAgQVJSQVksIC8vIDB4OERcbiAgICBBUlJBWSwgLy8gMHg4RVxuICAgIEFSUkFZLCAvLyAweDhGXG4gICAgQVJSQVksIC8vIDB4OTBcbiAgICBBUlJBWSwgLy8gMHg5MVxuICAgIEFSUkFZLCAvLyAweDkyXG4gICAgQVJSQVksIC8vIDB4OTNcbiAgICBBUlJBWSwgLy8gMHg5NFxuICAgIEFSUkFZLCAvLyAweDk1XG4gICAgQVJSQVksIC8vIDB4OTZcbiAgICBBUlJBWSwgLy8gMHg5N1xuICAgIC8vIGFycmF5IChvbmUtYnl0ZSB1aW50OF90IGZvLCBhbmQgdGhlbiBuIGRhdGEgaXRlbXMgZm9sbG93KVxuICAgIEFSUkFZXzgsIC8vIDB4OThcbiAgICAvLyBhcnJheSAodHdvLWJ5dGUgdWludDE2X3QgZm9yIG4sIGFuZCB0aGVuIG4gZGF0YSBpdGVtcyBmb2xsb3cpXG4gICAgQVJSQVlfMTYsIC8vIDB4OTlcbiAgICAvLyBhcnJheSAoZm91ci1ieXRlIHVpbnQzMl90IGZvciBuLCBhbmQgdGhlbiBuIGRhdGEgaXRlbXMgZm9sbG93KVxuICAgIEFSUkFZXzMyLCAvLyAweDlhXG4gICAgLy8gYXJyYXkgKGVpZ2h0LWJ5dGUgdWludDY0X3QgZm9yIG4sIGFuZCB0aGVuIG4gZGF0YSBpdGVtcyBmb2xsb3cpXG4gICAgQVJSQVlfNjQsIC8vIDB4OWJcbiAgICAvLyBhcnJheSwgZGF0YSBpdGVtcyBmb2xsb3csIHRlcm1pbmF0ZWQgYnkgXCJicmVha1wiXG4gICAgRVJST1IsIC8vIDB4OWNcbiAgICBFUlJPUiwgLy8gMHg5ZFxuICAgIEVSUk9SLCAvLyAweDllXG4gICAgQVJSQVlfQlJFQUssIC8vIDB4OWZcbiAgICAvLyBtYXAgKDB4MDAuLjB4MTcgcGFpcnMgb2YgZGF0YSBpdGVtcyBmb2xsb3cpXG4gICAgTUFQLCAvLyAweGEwXG4gICAgTUFQLCAvLyAweGExXG4gICAgTUFQLCAvLyAweGEyXG4gICAgTUFQLCAvLyAweGEzXG4gICAgTUFQLCAvLyAweGE0XG4gICAgTUFQLCAvLyAweGE1XG4gICAgTUFQLCAvLyAweGE2XG4gICAgTUFQLCAvLyAweGE3XG4gICAgTUFQLCAvLyAweGE4XG4gICAgTUFQLCAvLyAweGE5XG4gICAgTUFQLCAvLyAweGFBXG4gICAgTUFQLCAvLyAweGFCXG4gICAgTUFQLCAvLyAweGFDXG4gICAgTUFQLCAvLyAweGFEXG4gICAgTUFQLCAvLyAweGFFXG4gICAgTUFQLCAvLyAweGFGXG4gICAgTUFQLCAvLyAweGIwXG4gICAgTUFQLCAvLyAweGIxXG4gICAgTUFQLCAvLyAweGIyXG4gICAgTUFQLCAvLyAweGIzXG4gICAgTUFQLCAvLyAweGI0XG4gICAgTUFQLCAvLyAweGI1XG4gICAgTUFQLCAvLyAweGI2XG4gICAgTUFQLCAvLyAweGI3XG4gICAgLy8gbWFwIChvbmUtYnl0ZSB1aW50OF90IGZvciBuLCBhbmQgdGhlbiBuIHBhaXJzIG9mIGRhdGEgaXRlbXMgZm9sbG93KVxuICAgIE1BUF84LCAvLyAweGI4XG4gICAgLy8gbWFwICh0d28tYnl0ZSB1aW50MTZfdCBmb3IgbiwgYW5kIHRoZW4gbiBwYWlycyBvZiBkYXRhIGl0ZW1zIGZvbGxvdylcbiAgICBNQVBfMTYsIC8vIDB4YjlcbiAgICAvLyBtYXAgKGZvdXItYnl0ZSB1aW50MzJfdCBmb3IgbiwgYW5kIHRoZW4gbiBwYWlycyBvZiBkYXRhIGl0ZW1zIGZvbGxvdylcbiAgICBNQVBfMzIsIC8vIDB4YmFcbiAgICAvLyBtYXAgKGVpZ2h0LWJ5dGUgdWludDY0X3QgZm9yIG4sIGFuZCB0aGVuIG4gcGFpcnMgb2YgZGF0YSBpdGVtcyBmb2xsb3cpXG4gICAgTUFQXzY0LCAvLyAweGJiXG4gICAgRVJST1IsIC8vIDB4YmNcbiAgICBFUlJPUiwgLy8gMHhiZFxuICAgIEVSUk9SLCAvLyAweGJlXG4gICAgLy8gbWFwLCBwYWlycyBvZiBkYXRhIGl0ZW1zIGZvbGxvdywgdGVybWluYXRlZCBieSBcImJyZWFrXCJcbiAgICBNQVBfQlJFQUssIC8vIDB4YmZcbiAgICAvLyBUZXh0LWJhc2VkIGRhdGUvdGltZSAoZGF0YSBpdGVtIGZvbGxvd3M7IHNlZSBTZWN0aW9uIDIuNC4xKVxuICAgIFRBR19LTk9XTiwgLy8gMHhjMFxuICAgIC8vIEVwb2NoLWJhc2VkIGRhdGUvdGltZSAoZGF0YSBpdGVtIGZvbGxvd3M7IHNlZSBTZWN0aW9uIDIuNC4xKVxuICAgIFRBR19LTk9XTiwgLy8gMHhjMVxuICAgIC8vIFBvc2l0aXZlIGJpZ251bSAoZGF0YSBpdGVtIFwiYnl0ZSBzdHJpbmdcIiBmb2xsb3dzKVxuICAgIFRBR19LTk9XTiwgLy8gMHhjMlxuICAgIC8vIE5lZ2F0aXZlIGJpZ251bSAoZGF0YSBpdGVtIFwiYnl0ZSBzdHJpbmdcIiBmb2xsb3dzKVxuICAgIFRBR19LTk9XTiwgLy8gMHhjM1xuICAgIC8vIERlY2ltYWwgRnJhY3Rpb24gKGRhdGEgaXRlbSBcImFycmF5XCIgZm9sbG93czsgc2VlIFNlY3Rpb24gMi40LjMpXG4gICAgVEFHX0tOT1dOLCAvLyAweGM0XG4gICAgLy8gQmlnZmxvYXQgKGRhdGEgaXRlbSBcImFycmF5XCIgZm9sbG93czsgc2VlIFNlY3Rpb24gMi40LjMpXG4gICAgVEFHX0tOT1dOLCAvLyAweGM1XG4gICAgLy8gKHRhZ2dlZCBpdGVtKVxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGM2XG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4YzdcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhjOFxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGM5XG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4Y2FcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhjYlxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGNjXG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4Y2RcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhjZVxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGNmXG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4ZDBcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhkMVxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGQyXG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4ZDNcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhkNFxuICAgIC8vIEV4cGVjdGVkIENvbnZlcnNpb24gKGRhdGEgaXRlbSBmb2xsb3dzOyBzZWUgU2VjdGlvbiAyLjQuNC4yKVxuICAgIFRBR19VTkFTU0lHTkVELCAvLyAweGQ1XG4gICAgVEFHX1VOQVNTSUdORUQsIC8vIDB4ZDZcbiAgICBUQUdfVU5BU1NJR05FRCwgLy8gMHhkN1xuICAgIC8vIChtb3JlIHRhZ2dlZCBpdGVtcywgMS8yLzQvOCBieXRlcyBhbmQgdGhlbiBhIGRhdGEgaXRlbSBmb2xsb3cpXG4gICAgVEFHX01PUkVfMSwgLy8gMHhkOFxuICAgIFRBR19NT1JFXzIsIC8vIDB4ZDlcbiAgICBUQUdfTU9SRV80LCAvLyAweGRhXG4gICAgVEFHX01PUkVfOCwgLy8gMHhkYlxuICAgIEVSUk9SLCAvLyAweGRjXG4gICAgRVJST1IsIC8vIDB4ZGRcbiAgICBFUlJPUiwgLy8gMHhkZVxuICAgIEVSUk9SLCAvLyAweGRmXG4gICAgLy8gKHNpbXBsZSB2YWx1ZSlcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlMFxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGUxXG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZTJcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlM1xuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGU0XG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZTVcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlNlxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGU3XG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZThcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlOVxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGVhXG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZWJcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlY1xuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGVkXG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZWVcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhlZlxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGYwXG4gICAgU0lNUExFX1VOQVNTSUdORUQsIC8vIDB4ZjFcbiAgICBTSU1QTEVfVU5BU1NJR05FRCwgLy8gMHhmMlxuICAgIFNJTVBMRV9VTkFTU0lHTkVELCAvLyAweGYzXG4gICAgLy8gRmFsc2VcbiAgICBTSU1QTEVfRkFMU0UsIC8vIDB4ZjRcbiAgICAvLyBUcnVlXG4gICAgU0lNUExFX1RSVUUsIC8vIDB4ZjVcbiAgICAvLyBOdWxsXG4gICAgU0lNUExFX05VTEwsIC8vIDB4ZjZcbiAgICAvLyBVbmRlZmluZWRcbiAgICBTSU1QTEVfVU5ERUZJTkVELCAvLyAweGY3XG4gICAgLy8gKHNpbXBsZSB2YWx1ZSwgb25lIGJ5dGUgZm9sbG93cylcbiAgICBTSU1QTEVfQllURSwgLy8gMHhmOFxuICAgIC8vIEhhbGYtUHJlY2lzaW9uIEZsb2F0ICh0d28tYnl0ZSBJRUVFIDc1NClcbiAgICBTSU1QTEVfRkxPQVRfSEFMRiwgLy8gMHhmOVxuICAgIC8vIFNpbmdsZS1QcmVjaXNpb24gRmxvYXQgKGZvdXItYnl0ZSBJRUVFIDc1NClcbiAgICBTSU1QTEVfRkxPQVRfU0lOR0xFLCAvLyAweGZhXG4gICAgLy8gRG91YmxlLVByZWNpc2lvbiBGbG9hdCAoZWlnaHQtYnl0ZSBJRUVFIDc1NClcbiAgICBTSU1QTEVfRkxPQVRfRE9VQkxFLCAvLyAweGZiXG4gICAgRVJST1IsIC8vIDB4ZmNcbiAgICBFUlJPUiwgLy8gMHhmZFxuICAgIEVSUk9SLCAvLyAweGZlXG4gICAgLy8gXCJicmVha1wiIHN0b3AgY29kZVxuICAgIEJSRUFLIC8vIDB4ZmZcbiAgXVxuXG4gIC8vIC0tXG5cbiAgcmV0dXJuIHtcbiAgICBwYXJzZTogcGFyc2VcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcbmNvbnN0IEJpZ251bWJlciA9IHJlcXVpcmUoJ2JpZ251bWJlci5qcycpLkJpZ051bWJlclxuXG5jb25zdCBwYXJzZXIgPSByZXF1aXJlKCcuL2RlY29kZXIuYXNtJylcbmNvbnN0IHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpXG5jb25zdCBjID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKVxuY29uc3QgU2ltcGxlID0gcmVxdWlyZSgnLi9zaW1wbGUnKVxuY29uc3QgVGFnZ2VkID0gcmVxdWlyZSgnLi90YWdnZWQnKVxuY29uc3QgeyBVUkwgfSA9IHJlcXVpcmUoJ2lzby11cmwnKVxuXG4vKipcbiAqIFRyYW5zZm9ybSBiaW5hcnkgY2JvciBkYXRhIGludG8gSmF2YVNjcmlwdCBvYmplY3RzLlxuICovXG5jbGFzcyBEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0cz17fV1cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRzLnNpemU9NjU1MzZdIC0gU2l6ZSBvZiB0aGUgYWxsb2NhdGVkIGhlYXAuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAob3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9XG5cbiAgICBpZiAoIW9wdHMuc2l6ZSB8fCBvcHRzLnNpemUgPCAweDEwMDAwKSB7XG4gICAgICBvcHRzLnNpemUgPSAweDEwMDAwXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEVuc3VyZSB0aGUgc2l6ZSBpcyBhIHBvd2VyIG9mIDJcbiAgICAgIG9wdHMuc2l6ZSA9IHV0aWxzLm5leHRQb3dlck9mMihvcHRzLnNpemUpXG4gICAgfVxuXG4gICAgLy8gSGVhcCB1c2UgdG8gc2hhcmUgdGhlIGlucHV0IHdpdGggdGhlIHBhcnNlclxuICAgIHRoaXMuX2hlYXAgPSBuZXcgQXJyYXlCdWZmZXIob3B0cy5zaXplKVxuICAgIHRoaXMuX2hlYXA4ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5faGVhcClcbiAgICB0aGlzLl9idWZmZXIgPSBCdWZmZXIuZnJvbSh0aGlzLl9oZWFwKVxuXG4gICAgdGhpcy5fcmVzZXQoKVxuXG4gICAgLy8gS25vd24gdGFnc1xuICAgIHRoaXMuX2tub3duVGFncyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgMDogKHZhbCkgPT4gbmV3IERhdGUodmFsKSxcbiAgICAgIDE6ICh2YWwpID0+IG5ldyBEYXRlKHZhbCAqIDEwMDApLFxuICAgICAgMjogKHZhbCkgPT4gdXRpbHMuYXJyYXlCdWZmZXJUb0JpZ251bWJlcih2YWwpLFxuICAgICAgMzogKHZhbCkgPT4gYy5ORUdfT05FLm1pbnVzKHV0aWxzLmFycmF5QnVmZmVyVG9CaWdudW1iZXIodmFsKSksXG4gICAgICA0OiAodikgPT4ge1xuICAgICAgICAvLyBjb25zdCB2ID0gbmV3IFVpbnQ4QXJyYXkodmFsKVxuICAgICAgICByZXR1cm4gYy5URU4ucG93KHZbMF0pLnRpbWVzKHZbMV0pXG4gICAgICB9LFxuICAgICAgNTogKHYpID0+IHtcbiAgICAgICAgLy8gY29uc3QgdiA9IG5ldyBVaW50OEFycmF5KHZhbClcbiAgICAgICAgcmV0dXJuIGMuVFdPLnBvdyh2WzBdKS50aW1lcyh2WzFdKVxuICAgICAgfSxcbiAgICAgIDMyOiAodmFsKSA9PiBuZXcgVVJMKHZhbCksXG4gICAgICAzNTogKHZhbCkgPT4gbmV3IFJlZ0V4cCh2YWwpXG4gICAgfSwgb3B0cy50YWdzKVxuXG4gICAgLy8gSW5pdGlhbGl6ZSBhc20gYmFzZWQgcGFyc2VyXG4gICAgdGhpcy5wYXJzZXIgPSBwYXJzZXIoZ2xvYmFsLCB7XG4gICAgICBsb2c6IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSksXG4gICAgICBwdXNoSW50OiB0aGlzLnB1c2hJbnQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hJbnQzMjogdGhpcy5wdXNoSW50MzIuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hJbnQzMk5lZzogdGhpcy5wdXNoSW50MzJOZWcuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hJbnQ2NDogdGhpcy5wdXNoSW50NjQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hJbnQ2NE5lZzogdGhpcy5wdXNoSW50NjROZWcuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hGbG9hdDogdGhpcy5wdXNoRmxvYXQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hGbG9hdFNpbmdsZTogdGhpcy5wdXNoRmxvYXRTaW5nbGUuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hGbG9hdERvdWJsZTogdGhpcy5wdXNoRmxvYXREb3VibGUuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hUcnVlOiB0aGlzLnB1c2hUcnVlLmJpbmQodGhpcyksXG4gICAgICBwdXNoRmFsc2U6IHRoaXMucHVzaEZhbHNlLmJpbmQodGhpcyksXG4gICAgICBwdXNoVW5kZWZpbmVkOiB0aGlzLnB1c2hVbmRlZmluZWQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hOdWxsOiB0aGlzLnB1c2hOdWxsLmJpbmQodGhpcyksXG4gICAgICBwdXNoSW5maW5pdHk6IHRoaXMucHVzaEluZmluaXR5LmJpbmQodGhpcyksXG4gICAgICBwdXNoSW5maW5pdHlOZWc6IHRoaXMucHVzaEluZmluaXR5TmVnLmJpbmQodGhpcyksXG4gICAgICBwdXNoTmFOOiB0aGlzLnB1c2hOYU4uYmluZCh0aGlzKSxcbiAgICAgIHB1c2hOYU5OZWc6IHRoaXMucHVzaE5hTk5lZy5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEFycmF5U3RhcnQ6IHRoaXMucHVzaEFycmF5U3RhcnQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hBcnJheVN0YXJ0Rml4ZWQ6IHRoaXMucHVzaEFycmF5U3RhcnRGaXhlZC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEFycmF5U3RhcnRGaXhlZDMyOiB0aGlzLnB1c2hBcnJheVN0YXJ0Rml4ZWQzMi5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEFycmF5U3RhcnRGaXhlZDY0OiB0aGlzLnB1c2hBcnJheVN0YXJ0Rml4ZWQ2NC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaE9iamVjdFN0YXJ0OiB0aGlzLnB1c2hPYmplY3RTdGFydC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaE9iamVjdFN0YXJ0Rml4ZWQ6IHRoaXMucHVzaE9iamVjdFN0YXJ0Rml4ZWQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hPYmplY3RTdGFydEZpeGVkMzI6IHRoaXMucHVzaE9iamVjdFN0YXJ0Rml4ZWQzMi5iaW5kKHRoaXMpLFxuICAgICAgcHVzaE9iamVjdFN0YXJ0Rml4ZWQ2NDogdGhpcy5wdXNoT2JqZWN0U3RhcnRGaXhlZDY0LmJpbmQodGhpcyksXG4gICAgICBwdXNoQnl0ZVN0cmluZzogdGhpcy5wdXNoQnl0ZVN0cmluZy5iaW5kKHRoaXMpLFxuICAgICAgcHVzaEJ5dGVTdHJpbmdTdGFydDogdGhpcy5wdXNoQnl0ZVN0cmluZ1N0YXJ0LmJpbmQodGhpcyksXG4gICAgICBwdXNoVXRmOFN0cmluZzogdGhpcy5wdXNoVXRmOFN0cmluZy5iaW5kKHRoaXMpLFxuICAgICAgcHVzaFV0ZjhTdHJpbmdTdGFydDogdGhpcy5wdXNoVXRmOFN0cmluZ1N0YXJ0LmJpbmQodGhpcyksXG4gICAgICBwdXNoU2ltcGxlVW5hc3NpZ25lZDogdGhpcy5wdXNoU2ltcGxlVW5hc3NpZ25lZC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaFRhZ1VuYXNzaWduZWQ6IHRoaXMucHVzaFRhZ1VuYXNzaWduZWQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hUYWdTdGFydDogdGhpcy5wdXNoVGFnU3RhcnQuYmluZCh0aGlzKSxcbiAgICAgIHB1c2hUYWdTdGFydDQ6IHRoaXMucHVzaFRhZ1N0YXJ0NC5iaW5kKHRoaXMpLFxuICAgICAgcHVzaFRhZ1N0YXJ0ODogdGhpcy5wdXNoVGFnU3RhcnQ4LmJpbmQodGhpcyksXG4gICAgICBwdXNoQnJlYWs6IHRoaXMucHVzaEJyZWFrLmJpbmQodGhpcylcbiAgICB9LCB0aGlzLl9oZWFwKVxuICB9XG5cbiAgZ2V0IF9kZXB0aCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudHMubGVuZ3RoXG4gIH1cblxuICBnZXQgX2N1cnJlbnRQYXJlbnQgKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnRzW3RoaXMuX2RlcHRoIC0gMV1cbiAgfVxuXG4gIGdldCBfcmVmICgpIHtcbiAgICByZXR1cm4gdGhpcy5fY3VycmVudFBhcmVudC5yZWZcbiAgfVxuXG4gIC8vIEZpbmlzaCB0aGUgY3VycmVudCBwYXJlbnRcbiAgX2Nsb3NlUGFyZW50ICgpIHtcbiAgICB2YXIgcCA9IHRoaXMuX3BhcmVudHMucG9wKClcblxuICAgIGlmIChwLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyAke3AubGVuZ3RofSBlbGVtZW50c2ApXG4gICAgfVxuXG4gICAgc3dpdGNoIChwLnR5cGUpIHtcbiAgICAgIGNhc2UgYy5QQVJFTlQuVEFHOlxuICAgICAgICB0aGlzLl9wdXNoKFxuICAgICAgICAgIHRoaXMuY3JlYXRlVGFnKHAucmVmWzBdLCBwLnJlZlsxXSlcbiAgICAgICAgKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBjLlBBUkVOVC5CWVRFX1NUUklORzpcbiAgICAgICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZUJ5dGVTdHJpbmcocC5yZWYsIHAubGVuZ3RoKSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgYy5QQVJFTlQuVVRGOF9TVFJJTkc6XG4gICAgICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVVdGY4U3RyaW5nKHAucmVmLCBwLmxlbmd0aCkpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIGMuUEFSRU5ULk1BUDpcbiAgICAgICAgaWYgKHAudmFsdWVzICUgMiA+IDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09kZCBudW1iZXIgb2YgZWxlbWVudHMgaW4gdGhlIG1hcCcpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZU1hcChwLnJlZiwgcC5sZW5ndGgpKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBjLlBBUkVOVC5PQkpFQ1Q6XG4gICAgICAgIGlmIChwLnZhbHVlcyAlIDIgPiAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPZGQgbnVtYmVyIG9mIGVsZW1lbnRzIGluIHRoZSBtYXAnKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVPYmplY3QocC5yZWYsIHAubGVuZ3RoKSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgYy5QQVJFTlQuQVJSQVk6XG4gICAgICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVBcnJheShwLnJlZiwgcC5sZW5ndGgpKVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY3VycmVudFBhcmVudCAmJiB0aGlzLl9jdXJyZW50UGFyZW50LnR5cGUgPT09IGMuUEFSRU5ULlRBRykge1xuICAgICAgdGhpcy5fZGVjKClcbiAgICB9XG4gIH1cblxuICAvLyBSZWR1Y2UgdGhlIGV4cGVjdGVkIGxlbmd0aCBvZiB0aGUgY3VycmVudCBwYXJlbnQgYnkgb25lXG4gIF9kZWMgKCkge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9jdXJyZW50UGFyZW50XG4gICAgLy8gVGhlIGN1cnJlbnQgcGFyZW50IGRvZXMgbm90IGtub3cgdGhlIGVweGVjdGVkIGNoaWxkIGxlbmd0aFxuXG4gICAgaWYgKHAubGVuZ3RoIDwgMCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgcC5sZW5ndGgtLVxuXG4gICAgLy8gQWxsIGNoaWxkcmVuIHdlcmUgc2Vlbiwgd2UgY2FuIGNsb3NlIHRoZSBjdXJyZW50IHBhcmVudFxuICAgIGlmIChwLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5fY2xvc2VQYXJlbnQoKVxuICAgIH1cbiAgfVxuXG4gIC8vIFB1c2ggYW55IHZhbHVlIHRvIHRoZSBjdXJyZW50IHBhcmVudFxuICBfcHVzaCAodmFsLCBoYXNDaGlsZHJlbikge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9jdXJyZW50UGFyZW50XG4gICAgcC52YWx1ZXMrK1xuXG4gICAgc3dpdGNoIChwLnR5cGUpIHtcbiAgICAgIGNhc2UgYy5QQVJFTlQuQVJSQVk6XG4gICAgICBjYXNlIGMuUEFSRU5ULkJZVEVfU1RSSU5HOlxuICAgICAgY2FzZSBjLlBBUkVOVC5VVEY4X1NUUklORzpcbiAgICAgICAgaWYgKHAubGVuZ3RoID4gLTEpIHtcbiAgICAgICAgICB0aGlzLl9yZWZbdGhpcy5fcmVmLmxlbmd0aCAtIHAubGVuZ3RoXSA9IHZhbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3JlZi5wdXNoKHZhbClcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kZWMoKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBjLlBBUkVOVC5PQkpFQ1Q6XG4gICAgICAgIGlmIChwLnRtcEtleSAhPSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5fcmVmW3AudG1wS2V5XSA9IHZhbFxuICAgICAgICAgIHAudG1wS2V5ID0gbnVsbFxuICAgICAgICAgIHRoaXMuX2RlYygpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcC50bXBLZXkgPSB2YWxcblxuICAgICAgICAgIGlmICh0eXBlb2YgcC50bXBLZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyB0b28gYmFkLCBjb252ZXJ0IHRvIGEgTWFwXG4gICAgICAgICAgICBwLnR5cGUgPSBjLlBBUkVOVC5NQVBcbiAgICAgICAgICAgIHAucmVmID0gdXRpbHMuYnVpbGRNYXAocC5yZWYpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIGMuUEFSRU5ULk1BUDpcbiAgICAgICAgaWYgKHAudG1wS2V5ICE9IG51bGwpIHtcbiAgICAgICAgICB0aGlzLl9yZWYuc2V0KHAudG1wS2V5LCB2YWwpXG4gICAgICAgICAgcC50bXBLZXkgPSBudWxsXG4gICAgICAgICAgdGhpcy5fZGVjKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwLnRtcEtleSA9IHZhbFxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIGMuUEFSRU5ULlRBRzpcbiAgICAgICAgdGhpcy5fcmVmLnB1c2godmFsKVxuICAgICAgICBpZiAoIWhhc0NoaWxkcmVuKSB7XG4gICAgICAgICAgdGhpcy5fZGVjKClcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIHBhcmVudCB0eXBlJylcbiAgICB9XG4gIH1cblxuICAvLyBDcmVhdGUgYSBuZXcgcGFyZW50IGluIHRoZSBwYXJlbnRzIGxpc3RcbiAgX2NyZWF0ZVBhcmVudCAob2JqLCB0eXBlLCBsZW4pIHtcbiAgICB0aGlzLl9wYXJlbnRzW3RoaXMuX2RlcHRoXSA9IHtcbiAgICAgIHR5cGU6IHR5cGUsXG4gICAgICBsZW5ndGg6IGxlbixcbiAgICAgIHJlZjogb2JqLFxuICAgICAgdmFsdWVzOiAwLFxuICAgICAgdG1wS2V5OiBudWxsXG4gICAgfVxuICB9XG5cbiAgLy8gUmVzZXQgYWxsIHN0YXRlIGJhY2sgdG8gdGhlIGJlZ2lubmluZywgYWxzbyB1c2VkIGZvciBpbml0aWF0bGl6YXRpb25cbiAgX3Jlc2V0ICgpIHtcbiAgICB0aGlzLl9yZXMgPSBbXVxuICAgIHRoaXMuX3BhcmVudHMgPSBbe1xuICAgICAgdHlwZTogYy5QQVJFTlQuQVJSQVksXG4gICAgICBsZW5ndGg6IC0xLFxuICAgICAgcmVmOiB0aGlzLl9yZXMsXG4gICAgICB2YWx1ZXM6IDAsXG4gICAgICB0bXBLZXk6IG51bGxcbiAgICB9XVxuICB9XG5cbiAgLy8gLS0gSW50ZXJmYWNlIHRvIGN1c3RvbWl6ZSBkZW9kaW5nIGJlaGF2aW91clxuICBjcmVhdGVUYWcgKHRhZ051bWJlciwgdmFsdWUpIHtcbiAgICBjb25zdCB0eXAgPSB0aGlzLl9rbm93blRhZ3NbdGFnTnVtYmVyXVxuXG4gICAgaWYgKCF0eXApIHtcbiAgICAgIHJldHVybiBuZXcgVGFnZ2VkKHRhZ051bWJlciwgdmFsdWUpXG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cCh2YWx1ZSlcbiAgfVxuXG4gIGNyZWF0ZU1hcCAob2JqLCBsZW4pIHtcbiAgICByZXR1cm4gb2JqXG4gIH1cblxuICBjcmVhdGVPYmplY3QgKG9iaiwgbGVuKSB7XG4gICAgcmV0dXJuIG9ialxuICB9XG5cbiAgY3JlYXRlQXJyYXkgKGFyciwgbGVuKSB7XG4gICAgcmV0dXJuIGFyclxuICB9XG5cbiAgY3JlYXRlQnl0ZVN0cmluZyAocmF3LCBsZW4pIHtcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChyYXcpXG4gIH1cblxuICBjcmVhdGVCeXRlU3RyaW5nRnJvbUhlYXAgKHN0YXJ0LCBlbmQpIHtcbiAgICBpZiAoc3RhcnQgPT09IGVuZCkge1xuICAgICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICAgIH1cblxuICAgIHJldHVybiBCdWZmZXIuZnJvbSh0aGlzLl9oZWFwLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG5cbiAgY3JlYXRlSW50ICh2YWwpIHtcbiAgICByZXR1cm4gdmFsXG4gIH1cblxuICBjcmVhdGVJbnQzMiAoZiwgZykge1xuICAgIHJldHVybiB1dGlscy5idWlsZEludDMyKGYsIGcpXG4gIH1cblxuICBjcmVhdGVJbnQ2NCAoZjEsIGYyLCBnMSwgZzIpIHtcbiAgICByZXR1cm4gdXRpbHMuYnVpbGRJbnQ2NChmMSwgZjIsIGcxLCBnMilcbiAgfVxuXG4gIGNyZWF0ZUZsb2F0ICh2YWwpIHtcbiAgICByZXR1cm4gdmFsXG4gIH1cblxuICBjcmVhdGVGbG9hdFNpbmdsZSAoYSwgYiwgYywgZCkge1xuICAgIHJldHVybiBpZWVlNzU0LnJlYWQoW2EsIGIsIGMsIGRdLCAwLCBmYWxzZSwgMjMsIDQpXG4gIH1cblxuICBjcmVhdGVGbG9hdERvdWJsZSAoYSwgYiwgYywgZCwgZSwgZiwgZywgaCkge1xuICAgIHJldHVybiBpZWVlNzU0LnJlYWQoW2EsIGIsIGMsIGQsIGUsIGYsIGcsIGhdLCAwLCBmYWxzZSwgNTIsIDgpXG4gIH1cblxuICBjcmVhdGVJbnQzMk5lZyAoZiwgZykge1xuICAgIHJldHVybiAtMSAtIHV0aWxzLmJ1aWxkSW50MzIoZiwgZylcbiAgfVxuXG4gIGNyZWF0ZUludDY0TmVnIChmMSwgZjIsIGcxLCBnMikge1xuICAgIGNvbnN0IGYgPSB1dGlscy5idWlsZEludDMyKGYxLCBmMilcbiAgICBjb25zdCBnID0gdXRpbHMuYnVpbGRJbnQzMihnMSwgZzIpXG5cbiAgICBpZiAoZiA+IGMuTUFYX1NBRkVfSElHSCkge1xuICAgICAgcmV0dXJuIGMuTkVHX09ORS5taW51cyhuZXcgQmlnbnVtYmVyKGYpLnRpbWVzKGMuU0hJRlQzMikucGx1cyhnKSlcbiAgICB9XG5cbiAgICByZXR1cm4gLTEgLSAoKGYgKiBjLlNISUZUMzIpICsgZylcbiAgfVxuXG4gIGNyZWF0ZVRydWUgKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBjcmVhdGVGYWxzZSAoKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBjcmVhdGVOdWxsICgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY3JlYXRlVW5kZWZpbmVkICgpIHtcbiAgICByZXR1cm4gdm9pZCAwXG4gIH1cblxuICBjcmVhdGVJbmZpbml0eSAoKSB7XG4gICAgcmV0dXJuIEluZmluaXR5XG4gIH1cblxuICBjcmVhdGVJbmZpbml0eU5lZyAoKSB7XG4gICAgcmV0dXJuIC1JbmZpbml0eVxuICB9XG5cbiAgY3JlYXRlTmFOICgpIHtcbiAgICByZXR1cm4gTmFOXG4gIH1cblxuICBjcmVhdGVOYU5OZWcgKCkge1xuICAgIHJldHVybiAtTmFOXG4gIH1cblxuICBjcmVhdGVVdGY4U3RyaW5nIChyYXcsIGxlbikge1xuICAgIHJldHVybiByYXcuam9pbignJylcbiAgfVxuXG4gIGNyZWF0ZVV0ZjhTdHJpbmdGcm9tSGVhcCAoc3RhcnQsIGVuZCkge1xuICAgIGlmIChzdGFydCA9PT0gZW5kKSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fYnVmZmVyLnRvU3RyaW5nKCd1dGY4Jywgc3RhcnQsIGVuZClcbiAgfVxuXG4gIGNyZWF0ZVNpbXBsZVVuYXNzaWduZWQgKHZhbCkge1xuICAgIHJldHVybiBuZXcgU2ltcGxlKHZhbClcbiAgfVxuXG4gIC8vIC0tIEludGVyZmFjZSBmb3IgZGVjb2Rlci5hc20uanNcblxuICBwdXNoSW50ICh2YWwpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlSW50KHZhbCkpXG4gIH1cblxuICBwdXNoSW50MzIgKGYsIGcpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlSW50MzIoZiwgZykpXG4gIH1cblxuICBwdXNoSW50NjQgKGYxLCBmMiwgZzEsIGcyKSB7XG4gICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZUludDY0KGYxLCBmMiwgZzEsIGcyKSlcbiAgfVxuXG4gIHB1c2hGbG9hdCAodmFsKSB7XG4gICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZUZsb2F0KHZhbCkpXG4gIH1cblxuICBwdXNoRmxvYXRTaW5nbGUgKGEsIGIsIGMsIGQpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlRmxvYXRTaW5nbGUoYSwgYiwgYywgZCkpXG4gIH1cblxuICBwdXNoRmxvYXREb3VibGUgKGEsIGIsIGMsIGQsIGUsIGYsIGcsIGgpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlRmxvYXREb3VibGUoYSwgYiwgYywgZCwgZSwgZiwgZywgaCkpXG4gIH1cblxuICBwdXNoSW50MzJOZWcgKGYsIGcpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlSW50MzJOZWcoZiwgZykpXG4gIH1cblxuICBwdXNoSW50NjROZWcgKGYxLCBmMiwgZzEsIGcyKSB7XG4gICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZUludDY0TmVnKGYxLCBmMiwgZzEsIGcyKSlcbiAgfVxuXG4gIHB1c2hUcnVlICgpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlVHJ1ZSgpKVxuICB9XG5cbiAgcHVzaEZhbHNlICgpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlRmFsc2UoKSlcbiAgfVxuXG4gIHB1c2hOdWxsICgpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlTnVsbCgpKVxuICB9XG5cbiAgcHVzaFVuZGVmaW5lZCAoKSB7XG4gICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZVVuZGVmaW5lZCgpKVxuICB9XG5cbiAgcHVzaEluZmluaXR5ICgpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlSW5maW5pdHkoKSlcbiAgfVxuXG4gIHB1c2hJbmZpbml0eU5lZyAoKSB7XG4gICAgdGhpcy5fcHVzaCh0aGlzLmNyZWF0ZUluZmluaXR5TmVnKCkpXG4gIH1cblxuICBwdXNoTmFOICgpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlTmFOKCkpXG4gIH1cblxuICBwdXNoTmFOTmVnICgpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlTmFOTmVnKCkpXG4gIH1cblxuICBwdXNoQXJyYXlTdGFydCAoKSB7XG4gICAgdGhpcy5fY3JlYXRlUGFyZW50KFtdLCBjLlBBUkVOVC5BUlJBWSwgLTEpXG4gIH1cblxuICBwdXNoQXJyYXlTdGFydEZpeGVkIChsZW4pIHtcbiAgICB0aGlzLl9jcmVhdGVBcnJheVN0YXJ0Rml4ZWQobGVuKVxuICB9XG5cbiAgcHVzaEFycmF5U3RhcnRGaXhlZDMyIChsZW4xLCBsZW4yKSB7XG4gICAgY29uc3QgbGVuID0gdXRpbHMuYnVpbGRJbnQzMihsZW4xLCBsZW4yKVxuICAgIHRoaXMuX2NyZWF0ZUFycmF5U3RhcnRGaXhlZChsZW4pXG4gIH1cblxuICBwdXNoQXJyYXlTdGFydEZpeGVkNjQgKGxlbjEsIGxlbjIsIGxlbjMsIGxlbjQpIHtcbiAgICBjb25zdCBsZW4gPSB1dGlscy5idWlsZEludDY0KGxlbjEsIGxlbjIsIGxlbjMsIGxlbjQpXG4gICAgdGhpcy5fY3JlYXRlQXJyYXlTdGFydEZpeGVkKGxlbilcbiAgfVxuXG4gIHB1c2hPYmplY3RTdGFydCAoKSB7XG4gICAgdGhpcy5fY3JlYXRlT2JqZWN0U3RhcnRGaXhlZCgtMSlcbiAgfVxuXG4gIHB1c2hPYmplY3RTdGFydEZpeGVkIChsZW4pIHtcbiAgICB0aGlzLl9jcmVhdGVPYmplY3RTdGFydEZpeGVkKGxlbilcbiAgfVxuXG4gIHB1c2hPYmplY3RTdGFydEZpeGVkMzIgKGxlbjEsIGxlbjIpIHtcbiAgICBjb25zdCBsZW4gPSB1dGlscy5idWlsZEludDMyKGxlbjEsIGxlbjIpXG4gICAgdGhpcy5fY3JlYXRlT2JqZWN0U3RhcnRGaXhlZChsZW4pXG4gIH1cblxuICBwdXNoT2JqZWN0U3RhcnRGaXhlZDY0IChsZW4xLCBsZW4yLCBsZW4zLCBsZW40KSB7XG4gICAgY29uc3QgbGVuID0gdXRpbHMuYnVpbGRJbnQ2NChsZW4xLCBsZW4yLCBsZW4zLCBsZW40KVxuICAgIHRoaXMuX2NyZWF0ZU9iamVjdFN0YXJ0Rml4ZWQobGVuKVxuICB9XG5cbiAgcHVzaEJ5dGVTdHJpbmdTdGFydCAoKSB7XG4gICAgdGhpcy5fcGFyZW50c1t0aGlzLl9kZXB0aF0gPSB7XG4gICAgICB0eXBlOiBjLlBBUkVOVC5CWVRFX1NUUklORyxcbiAgICAgIGxlbmd0aDogLTEsXG4gICAgICByZWY6IFtdLFxuICAgICAgdmFsdWVzOiAwLFxuICAgICAgdG1wS2V5OiBudWxsXG4gICAgfVxuICB9XG5cbiAgcHVzaEJ5dGVTdHJpbmcgKHN0YXJ0LCBlbmQpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlQnl0ZVN0cmluZ0Zyb21IZWFwKHN0YXJ0LCBlbmQpKVxuICB9XG5cbiAgcHVzaFV0ZjhTdHJpbmdTdGFydCAoKSB7XG4gICAgdGhpcy5fcGFyZW50c1t0aGlzLl9kZXB0aF0gPSB7XG4gICAgICB0eXBlOiBjLlBBUkVOVC5VVEY4X1NUUklORyxcbiAgICAgIGxlbmd0aDogLTEsXG4gICAgICByZWY6IFtdLFxuICAgICAgdmFsdWVzOiAwLFxuICAgICAgdG1wS2V5OiBudWxsXG4gICAgfVxuICB9XG5cbiAgcHVzaFV0ZjhTdHJpbmcgKHN0YXJ0LCBlbmQpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlVXRmOFN0cmluZ0Zyb21IZWFwKHN0YXJ0LCBlbmQpKVxuICB9XG5cbiAgcHVzaFNpbXBsZVVuYXNzaWduZWQgKHZhbCkge1xuICAgIHRoaXMuX3B1c2godGhpcy5jcmVhdGVTaW1wbGVVbmFzc2lnbmVkKHZhbCkpXG4gIH1cblxuICBwdXNoVGFnU3RhcnQgKHRhZykge1xuICAgIHRoaXMuX3BhcmVudHNbdGhpcy5fZGVwdGhdID0ge1xuICAgICAgdHlwZTogYy5QQVJFTlQuVEFHLFxuICAgICAgbGVuZ3RoOiAxLFxuICAgICAgcmVmOiBbdGFnXVxuICAgIH1cbiAgfVxuXG4gIHB1c2hUYWdTdGFydDQgKGYsIGcpIHtcbiAgICB0aGlzLnB1c2hUYWdTdGFydCh1dGlscy5idWlsZEludDMyKGYsIGcpKVxuICB9XG5cbiAgcHVzaFRhZ1N0YXJ0OCAoZjEsIGYyLCBnMSwgZzIpIHtcbiAgICB0aGlzLnB1c2hUYWdTdGFydCh1dGlscy5idWlsZEludDY0KGYxLCBmMiwgZzEsIGcyKSlcbiAgfVxuXG4gIHB1c2hUYWdVbmFzc2lnbmVkICh0YWdOdW1iZXIpIHtcbiAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlVGFnKHRhZ051bWJlcikpXG4gIH1cblxuICBwdXNoQnJlYWsgKCkge1xuICAgIGlmICh0aGlzLl9jdXJyZW50UGFyZW50Lmxlbmd0aCA+IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgYnJlYWsnKVxuICAgIH1cblxuICAgIHRoaXMuX2Nsb3NlUGFyZW50KClcbiAgfVxuXG4gIF9jcmVhdGVPYmplY3RTdGFydEZpeGVkIChsZW4pIHtcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlT2JqZWN0KHt9KSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMuX2NyZWF0ZVBhcmVudCh7fSwgYy5QQVJFTlQuT0JKRUNULCBsZW4pXG4gIH1cblxuICBfY3JlYXRlQXJyYXlTdGFydEZpeGVkIChsZW4pIHtcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aGlzLl9wdXNoKHRoaXMuY3JlYXRlQXJyYXkoW10pKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5fY3JlYXRlUGFyZW50KG5ldyBBcnJheShsZW4pLCBjLlBBUkVOVC5BUlJBWSwgbGVuKVxuICB9XG5cbiAgX2RlY29kZSAoaW5wdXQpIHtcbiAgICBpZiAoaW5wdXQuYnl0ZUxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnB1dCB0b28gc2hvcnQnKVxuICAgIH1cblxuICAgIHRoaXMuX3Jlc2V0KClcbiAgICB0aGlzLl9oZWFwOC5zZXQoaW5wdXQpXG4gICAgY29uc3QgY29kZSA9IHRoaXMucGFyc2VyLnBhcnNlKGlucHV0LmJ5dGVMZW5ndGgpXG5cbiAgICBpZiAodGhpcy5fZGVwdGggPiAxKSB7XG4gICAgICB3aGlsZSAodGhpcy5fY3VycmVudFBhcmVudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy5fY2xvc2VQYXJlbnQoKVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2RlcHRoID4gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZGV0ZXJtaW5hdGVkIG5lc3RpbmcnKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gcGFyc2UnKVxuICAgIH1cblxuICAgIGlmICh0aGlzLl9yZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHZhbGlkIHJlc3VsdCcpXG4gICAgfVxuICB9XG5cbiAgLy8gLS0gUHVibGljIEludGVyZmFjZVxuXG4gIGRlY29kZUZpcnN0IChpbnB1dCkge1xuICAgIHRoaXMuX2RlY29kZShpbnB1dClcblxuICAgIHJldHVybiB0aGlzLl9yZXNbMF1cbiAgfVxuXG4gIGRlY29kZUFsbCAoaW5wdXQpIHtcbiAgICB0aGlzLl9kZWNvZGUoaW5wdXQpXG5cbiAgICByZXR1cm4gdGhpcy5fcmVzXG4gIH1cblxuICAvKipcbiAgICogRGVjb2RlIHRoZSBmaXJzdCBjYm9yIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtCdWZmZXJ8c3RyaW5nfSBpbnB1dFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2VuYz0naGV4J10gLSBFbmNvZGluZyB1c2VkIGlmIGEgc3RyaW5nIGlzIHBhc3NlZC5cbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBzdGF0aWMgZGVjb2RlIChpbnB1dCwgZW5jKSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlucHV0ID0gQnVmZmVyLmZyb20oaW5wdXQsIGVuYyB8fCAnaGV4JylcbiAgICB9XG5cbiAgICBjb25zdCBkZWMgPSBuZXcgRGVjb2Rlcih7IHNpemU6IGlucHV0Lmxlbmd0aCB9KVxuICAgIHJldHVybiBkZWMuZGVjb2RlRmlyc3QoaW5wdXQpXG4gIH1cblxuICAvKipcbiAgICogRGVjb2RlIGFsbCBjYm9yIG9iamVjdHMuXG4gICAqXG4gICAqIEBwYXJhbSB7QnVmZmVyfHN0cmluZ30gaW5wdXRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtlbmM9J2hleCddIC0gRW5jb2RpbmcgdXNlZCBpZiBhIHN0cmluZyBpcyBwYXNzZWQuXG4gICAqIEByZXR1cm5zIHtBcnJheTwqPn1cbiAgICovXG4gIHN0YXRpYyBkZWNvZGVBbGwgKGlucHV0LCBlbmMpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgaW5wdXQgPSBCdWZmZXIuZnJvbShpbnB1dCwgZW5jIHx8ICdoZXgnKVxuICAgIH1cblxuICAgIGNvbnN0IGRlYyA9IG5ldyBEZWNvZGVyKHsgc2l6ZTogaW5wdXQubGVuZ3RoIH0pXG4gICAgcmV0dXJuIGRlYy5kZWNvZGVBbGwoaW5wdXQpXG4gIH1cbn1cblxuRGVjb2Rlci5kZWNvZGVGaXJzdCA9IERlY29kZXIuZGVjb2RlXG5cbm1vZHVsZS5leHBvcnRzID0gRGVjb2RlclxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IERlY29kZXIgPSByZXF1aXJlKCcuL2RlY29kZXInKVxuY29uc3QgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJylcblxuLyoqXG4gKiBPdXRwdXQgdGhlIGRpYWdub3N0aWMgZm9ybWF0IGZyb20gYSBzdHJlYW0gb2YgQ0JPUiBieXRlcy5cbiAqXG4gKi9cbmNsYXNzIERpYWdub3NlIGV4dGVuZHMgRGVjb2RlciB7XG4gIGNyZWF0ZVRhZyAodGFnTnVtYmVyLCB2YWx1ZSkge1xuICAgIHJldHVybiBgJHt0YWdOdW1iZXJ9KCR7dmFsdWV9KWBcbiAgfVxuXG4gIGNyZWF0ZUludCAodmFsKSB7XG4gICAgcmV0dXJuIHN1cGVyLmNyZWF0ZUludCh2YWwpLnRvU3RyaW5nKClcbiAgfVxuXG4gIGNyZWF0ZUludDMyIChmLCBnKSB7XG4gICAgcmV0dXJuIHN1cGVyLmNyZWF0ZUludDMyKGYsIGcpLnRvU3RyaW5nKClcbiAgfVxuXG4gIGNyZWF0ZUludDY0IChmMSwgZjIsIGcxLCBnMikge1xuICAgIHJldHVybiBzdXBlci5jcmVhdGVJbnQ2NChmMSwgZjIsIGcxLCBnMikudG9TdHJpbmcoKVxuICB9XG5cbiAgY3JlYXRlSW50MzJOZWcgKGYsIGcpIHtcbiAgICByZXR1cm4gc3VwZXIuY3JlYXRlSW50MzJOZWcoZiwgZykudG9TdHJpbmcoKVxuICB9XG5cbiAgY3JlYXRlSW50NjROZWcgKGYxLCBmMiwgZzEsIGcyKSB7XG4gICAgcmV0dXJuIHN1cGVyLmNyZWF0ZUludDY0TmVnKGYxLCBmMiwgZzEsIGcyKS50b1N0cmluZygpXG4gIH1cblxuICBjcmVhdGVUcnVlICgpIHtcbiAgICByZXR1cm4gJ3RydWUnXG4gIH1cblxuICBjcmVhdGVGYWxzZSAoKSB7XG4gICAgcmV0dXJuICdmYWxzZSdcbiAgfVxuXG4gIGNyZWF0ZUZsb2F0ICh2YWwpIHtcbiAgICBjb25zdCBmbCA9IHN1cGVyLmNyZWF0ZUZsb2F0KHZhbClcbiAgICBpZiAodXRpbHMuaXNOZWdhdGl2ZVplcm8odmFsKSkge1xuICAgICAgcmV0dXJuICctMF8xJ1xuICAgIH1cblxuICAgIHJldHVybiBgJHtmbH1fMWBcbiAgfVxuXG4gIGNyZWF0ZUZsb2F0U2luZ2xlIChhLCBiLCBjLCBkKSB7XG4gICAgY29uc3QgZmwgPSBzdXBlci5jcmVhdGVGbG9hdFNpbmdsZShhLCBiLCBjLCBkKVxuICAgIHJldHVybiBgJHtmbH1fMmBcbiAgfVxuXG4gIGNyZWF0ZUZsb2F0RG91YmxlIChhLCBiLCBjLCBkLCBlLCBmLCBnLCBoKSB7XG4gICAgY29uc3QgZmwgPSBzdXBlci5jcmVhdGVGbG9hdERvdWJsZShhLCBiLCBjLCBkLCBlLCBmLCBnLCBoKVxuICAgIHJldHVybiBgJHtmbH1fM2BcbiAgfVxuXG4gIGNyZWF0ZUJ5dGVTdHJpbmcgKHJhdywgbGVuKSB7XG4gICAgY29uc3QgdmFsID0gcmF3LmpvaW4oJywgJylcblxuICAgIGlmIChsZW4gPT09IC0xKSB7XG4gICAgICByZXR1cm4gYChfICR7dmFsfSlgXG4gICAgfVxuICAgIHJldHVybiBgaCcke3ZhbH1gXG4gIH1cblxuICBjcmVhdGVCeXRlU3RyaW5nRnJvbUhlYXAgKHN0YXJ0LCBlbmQpIHtcbiAgICBjb25zdCB2YWwgPSAoQnVmZmVyLmZyb20oXG4gICAgICBzdXBlci5jcmVhdGVCeXRlU3RyaW5nRnJvbUhlYXAoc3RhcnQsIGVuZClcbiAgICApKS50b1N0cmluZygnaGV4JylcblxuICAgIHJldHVybiBgaCcke3ZhbH0nYFxuICB9XG5cbiAgY3JlYXRlSW5maW5pdHkgKCkge1xuICAgIHJldHVybiAnSW5maW5pdHlfMSdcbiAgfVxuXG4gIGNyZWF0ZUluZmluaXR5TmVnICgpIHtcbiAgICByZXR1cm4gJy1JbmZpbml0eV8xJ1xuICB9XG5cbiAgY3JlYXRlTmFOICgpIHtcbiAgICByZXR1cm4gJ05hTl8xJ1xuICB9XG5cbiAgY3JlYXRlTmFOTmVnICgpIHtcbiAgICByZXR1cm4gJy1OYU5fMSdcbiAgfVxuXG4gIGNyZWF0ZU51bGwgKCkge1xuICAgIHJldHVybiAnbnVsbCdcbiAgfVxuXG4gIGNyZWF0ZVVuZGVmaW5lZCAoKSB7XG4gICAgcmV0dXJuICd1bmRlZmluZWQnXG4gIH1cblxuICBjcmVhdGVTaW1wbGVVbmFzc2lnbmVkICh2YWwpIHtcbiAgICByZXR1cm4gYHNpbXBsZSgke3ZhbH0pYFxuICB9XG5cbiAgY3JlYXRlQXJyYXkgKGFyciwgbGVuKSB7XG4gICAgY29uc3QgdmFsID0gc3VwZXIuY3JlYXRlQXJyYXkoYXJyLCBsZW4pXG5cbiAgICBpZiAobGVuID09PSAtMSkge1xuICAgICAgLy8gaW5kZWZpbml0ZVxuICAgICAgcmV0dXJuIGBbXyAke3ZhbC5qb2luKCcsICcpfV1gXG4gICAgfVxuXG4gICAgcmV0dXJuIGBbJHt2YWwuam9pbignLCAnKX1dYFxuICB9XG5cbiAgY3JlYXRlTWFwIChtYXAsIGxlbikge1xuICAgIGNvbnN0IHZhbCA9IHN1cGVyLmNyZWF0ZU1hcChtYXApXG4gICAgY29uc3QgbGlzdCA9IEFycmF5LmZyb20odmFsLmtleXMoKSlcbiAgICAgIC5yZWR1Y2UoY29sbGVjdE9iamVjdCh2YWwpLCAnJylcblxuICAgIGlmIChsZW4gPT09IC0xKSB7XG4gICAgICByZXR1cm4gYHtfICR7bGlzdH19YFxuICAgIH1cblxuICAgIHJldHVybiBgeyR7bGlzdH19YFxuICB9XG5cbiAgY3JlYXRlT2JqZWN0IChvYmosIGxlbikge1xuICAgIGNvbnN0IHZhbCA9IHN1cGVyLmNyZWF0ZU9iamVjdChvYmopXG4gICAgY29uc3QgbWFwID0gT2JqZWN0LmtleXModmFsKVxuICAgICAgLnJlZHVjZShjb2xsZWN0T2JqZWN0KHZhbCksICcnKVxuXG4gICAgaWYgKGxlbiA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBge18gJHttYXB9fWBcbiAgICB9XG5cbiAgICByZXR1cm4gYHske21hcH19YFxuICB9XG5cbiAgY3JlYXRlVXRmOFN0cmluZyAocmF3LCBsZW4pIHtcbiAgICBjb25zdCB2YWwgPSByYXcuam9pbignLCAnKVxuXG4gICAgaWYgKGxlbiA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBgKF8gJHt2YWx9KWBcbiAgICB9XG5cbiAgICByZXR1cm4gYFwiJHt2YWx9XCJgXG4gIH1cblxuICBjcmVhdGVVdGY4U3RyaW5nRnJvbUhlYXAgKHN0YXJ0LCBlbmQpIHtcbiAgICBjb25zdCB2YWwgPSAoQnVmZmVyLmZyb20oXG4gICAgICBzdXBlci5jcmVhdGVVdGY4U3RyaW5nRnJvbUhlYXAoc3RhcnQsIGVuZClcbiAgICApKS50b1N0cmluZygndXRmOCcpXG5cbiAgICByZXR1cm4gYFwiJHt2YWx9XCJgXG4gIH1cblxuICBzdGF0aWMgZGlhZ25vc2UgKGlucHV0LCBlbmMpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgaW5wdXQgPSBCdWZmZXIuZnJvbShpbnB1dCwgZW5jIHx8ICdoZXgnKVxuICAgIH1cblxuICAgIGNvbnN0IGRlYyA9IG5ldyBEaWFnbm9zZSgpXG4gICAgcmV0dXJuIGRlYy5kZWNvZGVGaXJzdChpbnB1dClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERpYWdub3NlXG5cbmZ1bmN0aW9uIGNvbGxlY3RPYmplY3QgKHZhbCkge1xuICByZXR1cm4gKGFjYywga2V5KSA9PiB7XG4gICAgaWYgKGFjYykge1xuICAgICAgcmV0dXJuIGAke2FjY30sICR7a2V5fTogJHt2YWxba2V5XX1gXG4gICAgfVxuICAgIHJldHVybiBgJHtrZXl9OiAke3ZhbFtrZXldfWBcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHsgVVJMIH0gPSByZXF1aXJlKCdpc28tdXJsJylcbmNvbnN0IEJpZ251bWJlciA9IHJlcXVpcmUoJ2JpZ251bWJlci5qcycpLkJpZ051bWJlclxuXG5jb25zdCB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKVxuY29uc3QgY29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKVxuY29uc3QgTVQgPSBjb25zdGFudHMuTVRcbmNvbnN0IE5VTUJZVEVTID0gY29uc3RhbnRzLk5VTUJZVEVTXG5jb25zdCBTSElGVDMyID0gY29uc3RhbnRzLlNISUZUMzJcbmNvbnN0IFNZTVMgPSBjb25zdGFudHMuU1lNU1xuY29uc3QgVEFHID0gY29uc3RhbnRzLlRBR1xuY29uc3QgSEFMRiA9IChjb25zdGFudHMuTVQuU0lNUExFX0ZMT0FUIDw8IDUpIHwgY29uc3RhbnRzLk5VTUJZVEVTLlRXT1xuY29uc3QgRkxPQVQgPSAoY29uc3RhbnRzLk1ULlNJTVBMRV9GTE9BVCA8PCA1KSB8IGNvbnN0YW50cy5OVU1CWVRFUy5GT1VSXG5jb25zdCBET1VCTEUgPSAoY29uc3RhbnRzLk1ULlNJTVBMRV9GTE9BVCA8PCA1KSB8IGNvbnN0YW50cy5OVU1CWVRFUy5FSUdIVFxuY29uc3QgVFJVRSA9IChjb25zdGFudHMuTVQuU0lNUExFX0ZMT0FUIDw8IDUpIHwgY29uc3RhbnRzLlNJTVBMRS5UUlVFXG5jb25zdCBGQUxTRSA9IChjb25zdGFudHMuTVQuU0lNUExFX0ZMT0FUIDw8IDUpIHwgY29uc3RhbnRzLlNJTVBMRS5GQUxTRVxuY29uc3QgVU5ERUZJTkVEID0gKGNvbnN0YW50cy5NVC5TSU1QTEVfRkxPQVQgPDwgNSkgfCBjb25zdGFudHMuU0lNUExFLlVOREVGSU5FRFxuY29uc3QgTlVMTCA9IChjb25zdGFudHMuTVQuU0lNUExFX0ZMT0FUIDw8IDUpIHwgY29uc3RhbnRzLlNJTVBMRS5OVUxMXG5cbmNvbnN0IE1BWElOVF9CTiA9IG5ldyBCaWdudW1iZXIoJzB4MjAwMDAwMDAwMDAwMDAnKVxuY29uc3QgQlVGX05BTiA9IEJ1ZmZlci5mcm9tKCdmOTdlMDAnLCAnaGV4JylcbmNvbnN0IEJVRl9JTkZfTkVHID0gQnVmZmVyLmZyb20oJ2Y5ZmMwMCcsICdoZXgnKVxuY29uc3QgQlVGX0lORl9QT1MgPSBCdWZmZXIuZnJvbSgnZjk3YzAwJywgJ2hleCcpXG5cbmZ1bmN0aW9uIHRvVHlwZSAob2JqKSB7XG4gIC8vIFtvYmplY3QgVHlwZV1cbiAgLy8gLS0tLS0tLS04LS0tMVxuICByZXR1cm4gKHt9KS50b1N0cmluZy5jYWxsKG9iaikuc2xpY2UoOCwgLTEpXG59XG5cbi8qKlxuICogVHJhbnNmb3JtIEphdmFTY3JpcHQgdmFsdWVzIGludG8gQ0JPUiBieXRlc1xuICpcbiAqL1xuY2xhc3MgRW5jb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oQnVmZmVyKX0gb3B0aW9ucy5zdHJlYW1cbiAgICovXG4gIGNvbnN0cnVjdG9yIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblxuICAgIHRoaXMuc3RyZWFtaW5nID0gdHlwZW9mIG9wdGlvbnMuc3RyZWFtID09PSAnZnVuY3Rpb24nXG4gICAgdGhpcy5vbkRhdGEgPSBvcHRpb25zLnN0cmVhbVxuXG4gICAgdGhpcy5zZW1hbnRpY1R5cGVzID0gW1xuICAgICAgW1VSTCwgdGhpcy5fcHVzaFVybF0sXG4gICAgICBbQmlnbnVtYmVyLCB0aGlzLl9wdXNoQmlnTnVtYmVyXVxuICAgIF1cblxuICAgIGNvbnN0IGFkZFR5cGVzID0gb3B0aW9ucy5nZW5UeXBlcyB8fCBbXVxuICAgIGNvbnN0IGxlbiA9IGFkZFR5cGVzLmxlbmd0aFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRoaXMuYWRkU2VtYW50aWNUeXBlKFxuICAgICAgICBhZGRUeXBlc1tpXVswXSxcbiAgICAgICAgYWRkVHlwZXNbaV1bMV1cbiAgICAgIClcbiAgICB9XG5cbiAgICB0aGlzLl9yZXNldCgpXG4gIH1cblxuICBhZGRTZW1hbnRpY1R5cGUgKHR5cGUsIGZ1bikge1xuICAgIGNvbnN0IGxlbiA9IHRoaXMuc2VtYW50aWNUeXBlcy5sZW5ndGhcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCB0eXAgPSB0aGlzLnNlbWFudGljVHlwZXNbaV1bMF1cbiAgICAgIGlmICh0eXAgPT09IHR5cGUpIHtcbiAgICAgICAgY29uc3Qgb2xkID0gdGhpcy5zZW1hbnRpY1R5cGVzW2ldWzFdXG4gICAgICAgIHRoaXMuc2VtYW50aWNUeXBlc1tpXVsxXSA9IGZ1blxuICAgICAgICByZXR1cm4gb2xkXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2VtYW50aWNUeXBlcy5wdXNoKFt0eXBlLCBmdW5dKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBwdXNoICh2YWwpIHtcbiAgICBpZiAoIXZhbCkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICB0aGlzLnJlc3VsdFt0aGlzLm9mZnNldF0gPSB2YWxcbiAgICB0aGlzLnJlc3VsdE1ldGhvZFt0aGlzLm9mZnNldF0gPSAwXG4gICAgdGhpcy5yZXN1bHRMZW5ndGhbdGhpcy5vZmZzZXRdID0gdmFsLmxlbmd0aFxuICAgIHRoaXMub2Zmc2V0KytcblxuICAgIGlmICh0aGlzLnN0cmVhbWluZykge1xuICAgICAgdGhpcy5vbkRhdGEodGhpcy5maW5hbGl6ZSgpKVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBwdXNoV3JpdGUgKHZhbCwgbWV0aG9kLCBsZW4pIHtcbiAgICB0aGlzLnJlc3VsdFt0aGlzLm9mZnNldF0gPSB2YWxcbiAgICB0aGlzLnJlc3VsdE1ldGhvZFt0aGlzLm9mZnNldF0gPSBtZXRob2RcbiAgICB0aGlzLnJlc3VsdExlbmd0aFt0aGlzLm9mZnNldF0gPSBsZW5cbiAgICB0aGlzLm9mZnNldCsrXG5cbiAgICBpZiAodGhpcy5zdHJlYW1pbmcpIHtcbiAgICAgIHRoaXMub25EYXRhKHRoaXMuZmluYWxpemUoKSlcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgX3B1c2hVSW50OCAodmFsKSB7XG4gICAgcmV0dXJuIHRoaXMucHVzaFdyaXRlKHZhbCwgMSwgMSlcbiAgfVxuXG4gIF9wdXNoVUludDE2QkUgKHZhbCkge1xuICAgIHJldHVybiB0aGlzLnB1c2hXcml0ZSh2YWwsIDIsIDIpXG4gIH1cblxuICBfcHVzaFVJbnQzMkJFICh2YWwpIHtcbiAgICByZXR1cm4gdGhpcy5wdXNoV3JpdGUodmFsLCAzLCA0KVxuICB9XG5cbiAgX3B1c2hEb3VibGVCRSAodmFsKSB7XG4gICAgcmV0dXJuIHRoaXMucHVzaFdyaXRlKHZhbCwgNCwgOClcbiAgfVxuXG4gIF9wdXNoTmFOICgpIHtcbiAgICByZXR1cm4gdGhpcy5wdXNoKEJVRl9OQU4pXG4gIH1cblxuICBfcHVzaEluZmluaXR5IChvYmopIHtcbiAgICBjb25zdCBoYWxmID0gKG9iaiA8IDApID8gQlVGX0lORl9ORUcgOiBCVUZfSU5GX1BPU1xuICAgIHJldHVybiB0aGlzLnB1c2goaGFsZilcbiAgfVxuXG4gIF9wdXNoRmxvYXQgKG9iaikge1xuICAgIGNvbnN0IGIyID0gQnVmZmVyLmFsbG9jVW5zYWZlKDIpXG5cbiAgICBpZiAodXRpbHMud3JpdGVIYWxmKGIyLCBvYmopKSB7XG4gICAgICBpZiAodXRpbHMucGFyc2VIYWxmKGIyKSA9PT0gb2JqKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoVUludDgoSEFMRikgJiYgdGhpcy5wdXNoKGIyKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGI0ID0gQnVmZmVyLmFsbG9jVW5zYWZlKDQpXG4gICAgYjQud3JpdGVGbG9hdEJFKG9iaiwgMClcbiAgICBpZiAoYjQucmVhZEZsb2F0QkUoMCkgPT09IG9iaikge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hVSW50OChGTE9BVCkgJiYgdGhpcy5wdXNoKGI0KVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9wdXNoVUludDgoRE9VQkxFKSAmJiB0aGlzLl9wdXNoRG91YmxlQkUob2JqKVxuICB9XG5cbiAgX3B1c2hJbnQgKG9iaiwgbXQsIG9yaWcpIHtcbiAgICBjb25zdCBtID0gbXQgPDwgNVxuICAgIGlmIChvYmogPCAyNCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hVSW50OChtIHwgb2JqKVxuICAgIH1cblxuICAgIGlmIChvYmogPD0gMHhmZikge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hVSW50OChtIHwgTlVNQllURVMuT05FKSAmJiB0aGlzLl9wdXNoVUludDgob2JqKVxuICAgIH1cblxuICAgIGlmIChvYmogPD0gMHhmZmZmKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaFVJbnQ4KG0gfCBOVU1CWVRFUy5UV08pICYmIHRoaXMuX3B1c2hVSW50MTZCRShvYmopXG4gICAgfVxuXG4gICAgaWYgKG9iaiA8PSAweGZmZmZmZmZmKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaFVJbnQ4KG0gfCBOVU1CWVRFUy5GT1VSKSAmJiB0aGlzLl9wdXNoVUludDMyQkUob2JqKVxuICAgIH1cblxuICAgIGlmIChvYmogPD0gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoVUludDgobSB8IE5VTUJZVEVTLkVJR0hUKSAmJlxuICAgICAgICB0aGlzLl9wdXNoVUludDMyQkUoTWF0aC5mbG9vcihvYmogLyBTSElGVDMyKSkgJiZcbiAgICAgICAgdGhpcy5fcHVzaFVJbnQzMkJFKG9iaiAlIFNISUZUMzIpXG4gICAgfVxuXG4gICAgaWYgKG10ID09PSBNVC5ORUdfSU5UKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaEZsb2F0KG9yaWcpXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3B1c2hGbG9hdChvYmopXG4gIH1cblxuICBfcHVzaEludE51bSAob2JqKSB7XG4gICAgaWYgKG9iaiA8IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoSW50KC1vYmogLSAxLCBNVC5ORUdfSU5ULCBvYmopXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoSW50KG9iaiwgTVQuUE9TX0lOVClcbiAgICB9XG4gIH1cblxuICBfcHVzaE51bWJlciAob2JqKSB7XG4gICAgc3dpdGNoIChmYWxzZSkge1xuICAgICAgY2FzZSAob2JqID09PSBvYmopOiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoTmFOKG9iailcbiAgICAgIGNhc2UgaXNGaW5pdGUob2JqKTpcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hJbmZpbml0eShvYmopXG4gICAgICBjYXNlICgob2JqICUgMSkgIT09IDApOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaEludE51bShvYmopXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaEZsb2F0KG9iailcbiAgICB9XG4gIH1cblxuICBfcHVzaFN0cmluZyAob2JqKSB7XG4gICAgY29uc3QgbGVuID0gQnVmZmVyLmJ5dGVMZW5ndGgob2JqLCAndXRmOCcpXG4gICAgcmV0dXJuIHRoaXMuX3B1c2hJbnQobGVuLCBNVC5VVEY4X1NUUklORykgJiYgdGhpcy5wdXNoV3JpdGUob2JqLCA1LCBsZW4pXG4gIH1cblxuICBfcHVzaEJvb2xlYW4gKG9iaikge1xuICAgIHJldHVybiB0aGlzLl9wdXNoVUludDgob2JqID8gVFJVRSA6IEZBTFNFKVxuICB9XG5cbiAgX3B1c2hVbmRlZmluZWQgKG9iaikge1xuICAgIHJldHVybiB0aGlzLl9wdXNoVUludDgoVU5ERUZJTkVEKVxuICB9XG5cbiAgX3B1c2hBcnJheSAoZ2VuLCBvYmopIHtcbiAgICBjb25zdCBsZW4gPSBvYmoubGVuZ3RoXG4gICAgaWYgKCFnZW4uX3B1c2hJbnQobGVuLCBNVC5BUlJBWSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICBpZiAoIWdlbi5wdXNoQW55KG9ialtqXSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBfcHVzaFRhZyAodGFnKSB7XG4gICAgcmV0dXJuIHRoaXMuX3B1c2hJbnQodGFnLCBNVC5UQUcpXG4gIH1cblxuICBfcHVzaERhdGUgKGdlbiwgb2JqKSB7XG4gICAgLy8gUm91bmQgZGF0ZSwgdG8gZ2V0IHNlY29uZHMgc2luY2UgMTk3MC0wMS0wMSAwMDowMDowMCBhcyBkZWZpbmVkIGluXG4gICAgLy8gU2VjLiAyLjQuMSBhbmQgZ2V0IGEgcG9zc2libHkgbW9yZSBjb21wYWN0IGVuY29kaW5nLiBOb3RlIHRoYXQgaXQgaXNcbiAgICAvLyBzdGlsbCBhbGxvd2VkIHRvIGVuY29kZSBmcmFjdGlvbnMgb2Ygc2Vjb25kcyB3aGljaCBjYW4gYmUgYWNoaWV2ZWQgYnlcbiAgICAvLyBjaGFuZ2luZyBvdmVyd3JpdGluZyB0aGUgZW5jb2RlIGZ1bmN0aW9uIGZvciBEYXRlIG9iamVjdHMuXG4gICAgcmV0dXJuIGdlbi5fcHVzaFRhZyhUQUcuREFURV9FUE9DSCkgJiYgZ2VuLnB1c2hBbnkoTWF0aC5yb3VuZChvYmogLyAxMDAwKSlcbiAgfVxuXG4gIF9wdXNoQnVmZmVyIChnZW4sIG9iaikge1xuICAgIHJldHVybiBnZW4uX3B1c2hJbnQob2JqLmxlbmd0aCwgTVQuQllURV9TVFJJTkcpICYmIGdlbi5wdXNoKG9iailcbiAgfVxuXG4gIF9wdXNoTm9GaWx0ZXIgKGdlbiwgb2JqKSB7XG4gICAgcmV0dXJuIGdlbi5fcHVzaEJ1ZmZlcihnZW4sIG9iai5zbGljZSgpKVxuICB9XG5cbiAgX3B1c2hSZWdleHAgKGdlbiwgb2JqKSB7XG4gICAgcmV0dXJuIGdlbi5fcHVzaFRhZyhUQUcuUkVHRVhQKSAmJiBnZW4ucHVzaEFueShvYmouc291cmNlKVxuICB9XG5cbiAgX3B1c2hTZXQgKGdlbiwgb2JqKSB7XG4gICAgaWYgKCFnZW4uX3B1c2hJbnQob2JqLnNpemUsIE1ULkFSUkFZKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGZvciAobGV0IHggb2Ygb2JqKSB7XG4gICAgICBpZiAoIWdlbi5wdXNoQW55KHgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgX3B1c2hVcmwgKGdlbiwgb2JqKSB7XG4gICAgcmV0dXJuIGdlbi5fcHVzaFRhZyhUQUcuVVJJKSAmJiBnZW4ucHVzaEFueShvYmouZm9ybWF0KCkpXG4gIH1cblxuICBfcHVzaEJpZ2ludCAob2JqKSB7XG4gICAgbGV0IHRhZyA9IFRBRy5QT1NfQklHSU5UXG4gICAgaWYgKG9iai5pc05lZ2F0aXZlKCkpIHtcbiAgICAgIG9iaiA9IG9iai5uZWdhdGVkKCkubWludXMoMSlcbiAgICAgIHRhZyA9IFRBRy5ORUdfQklHSU5UXG4gICAgfVxuICAgIGxldCBzdHIgPSBvYmoudG9TdHJpbmcoMTYpXG4gICAgaWYgKHN0ci5sZW5ndGggJSAyKSB7XG4gICAgICBzdHIgPSAnMCcgKyBzdHJcbiAgICB9XG4gICAgY29uc3QgYnVmID0gQnVmZmVyLmZyb20oc3RyLCAnaGV4JylcbiAgICByZXR1cm4gdGhpcy5fcHVzaFRhZyh0YWcpICYmIHRoaXMuX3B1c2hCdWZmZXIodGhpcywgYnVmKVxuICB9XG5cbiAgX3B1c2hCaWdOdW1iZXIgKGdlbiwgb2JqKSB7XG4gICAgaWYgKG9iai5pc05hTigpKSB7XG4gICAgICByZXR1cm4gZ2VuLl9wdXNoTmFOKClcbiAgICB9XG4gICAgaWYgKCFvYmouaXNGaW5pdGUoKSkge1xuICAgICAgcmV0dXJuIGdlbi5fcHVzaEluZmluaXR5KG9iai5pc05lZ2F0aXZlKCkgPyAtSW5maW5pdHkgOiBJbmZpbml0eSlcbiAgICB9XG4gICAgaWYgKG9iai5pc0ludGVnZXIoKSkge1xuICAgICAgcmV0dXJuIGdlbi5fcHVzaEJpZ2ludChvYmopXG4gICAgfVxuICAgIGlmICghKGdlbi5fcHVzaFRhZyhUQUcuREVDSU1BTF9GUkFDKSAmJlxuICAgICAgZ2VuLl9wdXNoSW50KDIsIE1ULkFSUkFZKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGNvbnN0IGRlYyA9IG9iai5kZWNpbWFsUGxhY2VzKClcbiAgICBjb25zdCBzbGlkZSA9IG9iai5tdWx0aXBsaWVkQnkobmV3IEJpZ251bWJlcigxMCkucG93KGRlYykpXG4gICAgaWYgKCFnZW4uX3B1c2hJbnROdW0oLWRlYykpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAoc2xpZGUuYWJzKCkuaXNMZXNzVGhhbihNQVhJTlRfQk4pKSB7XG4gICAgICByZXR1cm4gZ2VuLl9wdXNoSW50TnVtKHNsaWRlLnRvTnVtYmVyKCkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBnZW4uX3B1c2hCaWdpbnQoc2xpZGUpXG4gICAgfVxuICB9XG5cbiAgX3B1c2hNYXAgKGdlbiwgb2JqKSB7XG4gICAgaWYgKCFnZW4uX3B1c2hJbnQob2JqLnNpemUsIE1ULk1BUCkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9wdXNoUmF3TWFwKFxuICAgICAgb2JqLnNpemUsXG4gICAgICBBcnJheS5mcm9tKG9iailcbiAgICApXG4gIH1cblxuICBfcHVzaE9iamVjdCAob2JqKSB7XG4gICAgaWYgKCFvYmopIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoVUludDgoTlVMTClcbiAgICB9XG5cbiAgICB2YXIgbGVuID0gdGhpcy5zZW1hbnRpY1R5cGVzLmxlbmd0aFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmIChvYmogaW5zdGFuY2VvZiB0aGlzLnNlbWFudGljVHlwZXNbaV1bMF0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VtYW50aWNUeXBlc1tpXVsxXS5jYWxsKG9iaiwgdGhpcywgb2JqKVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBmID0gb2JqLmVuY29kZUNCT1JcbiAgICBpZiAodHlwZW9mIGYgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBmLmNhbGwob2JqLCB0aGlzKVxuICAgIH1cblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKVxuICAgIHZhciBrZXlMZW5ndGggPSBrZXlzLmxlbmd0aFxuICAgIGlmICghdGhpcy5fcHVzaEludChrZXlMZW5ndGgsIE1ULk1BUCkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9wdXNoUmF3TWFwKFxuICAgICAga2V5TGVuZ3RoLFxuICAgICAga2V5cy5tYXAoKGspID0+IFtrLCBvYmpba11dKVxuICAgIClcbiAgfVxuXG4gIF9wdXNoUmF3TWFwIChsZW4sIG1hcCkge1xuICAgIC8vIFNvcnQga2V5cyBmb3IgY2Fub25jaWFsaXphdGlvblxuICAgIC8vIDEuIGVuY29kZSBrZXlcbiAgICAvLyAyLiBzaG9ydGVyIGtleSBjb21lcyBiZWZvcmUgbG9uZ2VyIGtleVxuICAgIC8vIDMuIHNhbWUgbGVuZ3RoIGtleXMgYXJlIHNvcnRlZCB3aXRoIGxvd2VyXG4gICAgLy8gICAgYnl0ZSB2YWx1ZSBiZWZvcmUgaGlnaGVyXG5cbiAgICBtYXAgPSBtYXAubWFwKGZ1bmN0aW9uIChhKSB7XG4gICAgICBhWzBdID0gRW5jb2Rlci5lbmNvZGUoYVswXSlcbiAgICAgIHJldHVybiBhXG4gICAgfSkuc29ydCh1dGlscy5rZXlTb3J0ZXIpXG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICBpZiAoIXRoaXMucHVzaChtYXBbal1bMF0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMucHVzaEFueShtYXBbal1bMV0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKipcbiAgICogQWxpYXMgZm9yIGAucHVzaEFueWBcbiAgICpcbiAgICogQHBhcmFtIHsqfSBvYmpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgb24gc3VjY2Vzc1xuICAgKi9cbiAgd3JpdGUgKG9iaikge1xuICAgIHJldHVybiB0aGlzLnB1c2hBbnkob2JqKVxuICB9XG5cbiAgLyoqXG4gICAqIFB1c2ggYW55IHN1cHBvcnRlZCB0eXBlIG9udG8gdGhlIGVuY29kZWQgc3RyZWFtXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBvYmpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgb24gc3VjY2Vzc1xuICAgKi9cbiAgcHVzaEFueSAob2JqKSB7XG4gICAgdmFyIHR5cCA9IHRvVHlwZShvYmopXG5cbiAgICBzd2l0Y2ggKHR5cCkge1xuICAgICAgY2FzZSAnTnVtYmVyJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hOdW1iZXIob2JqKVxuICAgICAgY2FzZSAnU3RyaW5nJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hTdHJpbmcob2JqKVxuICAgICAgY2FzZSAnQm9vbGVhbic6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoQm9vbGVhbihvYmopXG4gICAgICBjYXNlICdPYmplY3QnOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaE9iamVjdChvYmopXG4gICAgICBjYXNlICdBcnJheSc6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoQXJyYXkodGhpcywgb2JqKVxuICAgICAgY2FzZSAnVWludDhBcnJheSc6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoQnVmZmVyKHRoaXMsIEJ1ZmZlci5pc0J1ZmZlcihvYmopID8gb2JqIDogQnVmZmVyLmZyb20ob2JqKSlcbiAgICAgIGNhc2UgJ051bGwnOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaFVJbnQ4KE5VTEwpXG4gICAgICBjYXNlICdVbmRlZmluZWQnOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaFVuZGVmaW5lZChvYmopXG4gICAgICBjYXNlICdNYXAnOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaE1hcCh0aGlzLCBvYmopXG4gICAgICBjYXNlICdTZXQnOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaFNldCh0aGlzLCBvYmopXG4gICAgICBjYXNlICdVUkwnOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaFVybCh0aGlzLCBvYmopXG4gICAgICBjYXNlICdCaWdOdW1iZXInOlxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaEJpZ051bWJlcih0aGlzLCBvYmopXG4gICAgICBjYXNlICdEYXRlJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2hEYXRlKHRoaXMsIG9iailcbiAgICAgIGNhc2UgJ1JlZ0V4cCc6XG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoUmVnZXhwKHRoaXMsIG9iailcbiAgICAgIGNhc2UgJ1N5bWJvbCc6XG4gICAgICAgIHN3aXRjaCAob2JqKSB7XG4gICAgICAgICAgY2FzZSBTWU1TLk5VTEw6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHVzaE9iamVjdChudWxsKVxuICAgICAgICAgIGNhc2UgU1lNUy5VTkRFRklORUQ6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHVzaFVuZGVmaW5lZCh2b2lkIDApXG4gICAgICAgICAgLy8gVE9ETzogQWRkIHBsdWdnYWJsZSBzdXBwb3J0IGZvciBvdGhlciBzeW1ib2xzXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBzeW1ib2w6ICcgKyBvYmoudG9TdHJpbmcoKSlcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIHR5cGU6ICcgKyB0eXBlb2Ygb2JqICsgJywgJyArIChvYmogPyBvYmoudG9TdHJpbmcoKSA6ICcnKSlcbiAgICB9XG4gIH1cblxuICBmaW5hbGl6ZSAoKSB7XG4gICAgaWYgKHRoaXMub2Zmc2V0ID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSB0aGlzLnJlc3VsdFxuICAgIHZhciByZXN1bHRMZW5ndGggPSB0aGlzLnJlc3VsdExlbmd0aFxuICAgIHZhciByZXN1bHRNZXRob2QgPSB0aGlzLnJlc3VsdE1ldGhvZFxuICAgIHZhciBvZmZzZXQgPSB0aGlzLm9mZnNldFxuXG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBzaXplIG9mIHRoZSBidWZmZXJcbiAgICB2YXIgc2l6ZSA9IDBcbiAgICB2YXIgaSA9IDBcblxuICAgIGZvciAoOyBpIDwgb2Zmc2V0OyBpKyspIHtcbiAgICAgIHNpemUgKz0gcmVzdWx0TGVuZ3RoW2ldXG4gICAgfVxuXG4gICAgdmFyIHJlcyA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShzaXplKVxuICAgIHZhciBpbmRleCA9IDBcbiAgICB2YXIgbGVuZ3RoID0gMFxuXG4gICAgLy8gV3JpdGUgdGhlIGNvbnRlbnQgaW50byB0aGUgcmVzdWx0IGJ1ZmZlclxuICAgIGZvciAoaSA9IDA7IGkgPCBvZmZzZXQ7IGkrKykge1xuICAgICAgbGVuZ3RoID0gcmVzdWx0TGVuZ3RoW2ldXG5cbiAgICAgIHN3aXRjaCAocmVzdWx0TWV0aG9kW2ldKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICByZXN1bHRbaV0uY29weShyZXMsIGluZGV4KVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICByZXMud3JpdGVVSW50OChyZXN1bHRbaV0sIGluZGV4LCB0cnVlKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICByZXMud3JpdGVVSW50MTZCRShyZXN1bHRbaV0sIGluZGV4LCB0cnVlKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICByZXMud3JpdGVVSW50MzJCRShyZXN1bHRbaV0sIGluZGV4LCB0cnVlKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICByZXMud3JpdGVEb3VibGVCRShyZXN1bHRbaV0sIGluZGV4LCB0cnVlKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICByZXMud3JpdGUocmVzdWx0W2ldLCBpbmRleCwgbGVuZ3RoLCAndXRmOCcpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua293biBtZXRob2QnKVxuICAgICAgfVxuXG4gICAgICBpbmRleCArPSBsZW5ndGhcbiAgICB9XG5cbiAgICB2YXIgdG1wID0gcmVzXG5cbiAgICB0aGlzLl9yZXNldCgpXG5cbiAgICByZXR1cm4gdG1wXG4gIH1cblxuICBfcmVzZXQgKCkge1xuICAgIHRoaXMucmVzdWx0ID0gW11cbiAgICB0aGlzLnJlc3VsdE1ldGhvZCA9IFtdXG4gICAgdGhpcy5yZXN1bHRMZW5ndGggPSBbXVxuICAgIHRoaXMub2Zmc2V0ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEVuY29kZSB0aGUgZ2l2ZW4gdmFsdWVcbiAgICogQHBhcmFtIHsqfSBvXG4gICAqIEByZXR1cm5zIHtCdWZmZXJ9XG4gICAqL1xuICBzdGF0aWMgZW5jb2RlIChvKSB7XG4gICAgY29uc3QgZW5jID0gbmV3IEVuY29kZXIoKVxuICAgIGNvbnN0IHJldCA9IGVuYy5wdXNoQW55KG8pXG4gICAgaWYgKCFyZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGVuY29kZSBpbnB1dCcpXG4gICAgfVxuXG4gICAgcmV0dXJuIGVuYy5maW5hbGl6ZSgpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFbmNvZGVyXG4iLCIndXNlIHN0cmljdCdcblxuLy8gZXhwb3J0cy5Db21tZW50ZWQgPSByZXF1aXJlKCcuL2NvbW1lbnRlZCcpXG5leHBvcnRzLkRpYWdub3NlID0gcmVxdWlyZSgnLi9kaWFnbm9zZScpXG5leHBvcnRzLkRlY29kZXIgPSByZXF1aXJlKCcuL2RlY29kZXInKVxuZXhwb3J0cy5FbmNvZGVyID0gcmVxdWlyZSgnLi9lbmNvZGVyJylcbmV4cG9ydHMuU2ltcGxlID0gcmVxdWlyZSgnLi9zaW1wbGUnKVxuZXhwb3J0cy5UYWdnZWQgPSByZXF1aXJlKCcuL3RhZ2dlZCcpXG5cbi8vIGV4cG9ydHMuY29tbWVudCA9IGV4cG9ydHMuQ29tbWVudGVkLmNvbW1lbnRcbmV4cG9ydHMuZGVjb2RlQWxsID0gZXhwb3J0cy5EZWNvZGVyLmRlY29kZUFsbFxuZXhwb3J0cy5kZWNvZGVGaXJzdCA9IGV4cG9ydHMuRGVjb2Rlci5kZWNvZGVGaXJzdFxuZXhwb3J0cy5kaWFnbm9zZSA9IGV4cG9ydHMuRGlhZ25vc2UuZGlhZ25vc2VcbmV4cG9ydHMuZW5jb2RlID0gZXhwb3J0cy5FbmNvZGVyLmVuY29kZVxuZXhwb3J0cy5kZWNvZGUgPSBleHBvcnRzLkRlY29kZXIuZGVjb2RlXG5cbmV4cG9ydHMubGV2ZWxkYiA9IHtcbiAgZGVjb2RlOiBleHBvcnRzLkRlY29kZXIuZGVjb2RlQWxsLFxuICBlbmNvZGU6IGV4cG9ydHMuRW5jb2Rlci5lbmNvZGUsXG4gIGJ1ZmZlcjogdHJ1ZSxcbiAgbmFtZTogJ2Nib3InXG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgY29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKVxuY29uc3QgTVQgPSBjb25zdGFudHMuTVRcbmNvbnN0IFNJTVBMRSA9IGNvbnN0YW50cy5TSU1QTEVcbmNvbnN0IFNZTVMgPSBjb25zdGFudHMuU1lNU1xuXG4vKipcbiAqIEEgQ0JPUiBTaW1wbGUgVmFsdWUgdGhhdCBkb2VzIG5vdCBtYXAgb250byBhIGtub3duIGNvbnN0YW50LlxuICovXG5jbGFzcyBTaW1wbGUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBTaW1wbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7aW50ZWdlcn0gdmFsdWUgLSB0aGUgc2ltcGxlIHZhbHVlJ3MgaW50ZWdlciB2YWx1ZVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTaW1wbGUgdHlwZTogJyArICh0eXBlb2YgdmFsdWUpKVxuICAgIH1cbiAgICBpZiAoKHZhbHVlIDwgMCkgfHwgKHZhbHVlID4gMjU1KSB8fCAoKHZhbHVlIHwgMCkgIT09IHZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd2YWx1ZSBtdXN0IGJlIGEgc21hbGwgcG9zaXRpdmUgaW50ZWdlcjogJyArIHZhbHVlKVxuICAgIH1cbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWJ1ZyBzdHJpbmcgZm9yIHNpbXBsZSB2YWx1ZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzaW1wbGUodmFsdWUpXG4gICAqL1xuICB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdzaW1wbGUoJyArIHRoaXMudmFsdWUgKyAnKSdcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWJ1ZyBzdHJpbmcgZm9yIHNpbXBsZSB2YWx1ZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzaW1wbGUodmFsdWUpXG4gICAqL1xuICBpbnNwZWN0ICgpIHtcbiAgICByZXR1cm4gJ3NpbXBsZSgnICsgdGhpcy52YWx1ZSArICcpJ1xuICB9XG5cbiAgLyoqXG4gICAqIFB1c2ggdGhlIHNpbXBsZSB2YWx1ZSBvbnRvIHRoZSBDQk9SIHN0cmVhbVxuICAgKlxuICAgKiBAcGFyYW0ge2Nib3IuRW5jb2Rlcn0gZ2VuIFRoZSBnZW5lcmF0b3IgdG8gcHVzaCBvbnRvXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAqL1xuICBlbmNvZGVDQk9SIChnZW4pIHtcbiAgICByZXR1cm4gZ2VuLl9wdXNoSW50KHRoaXMudmFsdWUsIE1ULlNJTVBMRV9GTE9BVClcbiAgfVxuXG4gIC8qKlxuICAgKiBJcyB0aGUgZ2l2ZW4gb2JqZWN0IGEgU2ltcGxlP1xuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gb2JqIC0gb2JqZWN0IHRvIHRlc3RcbiAgICogQHJldHVybnMge2Jvb2x9IC0gaXMgaXQgU2ltcGxlP1xuICAgKi9cbiAgc3RhdGljIGlzU2ltcGxlIChvYmopIHtcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgU2ltcGxlXG4gIH1cblxuICAvKipcbiAgICogRGVjb2RlIGZyb20gdGhlIENCT1IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbnRvIGEgSmF2YVNjcmlwdCB2YWx1ZS5cbiAgICogSWYgdGhlIENCT1IgaXRlbSBoYXMgbm8gcGFyZW50LCByZXR1cm4gYSBcInNhZmVcIiBzeW1ib2wgaW5zdGVhZCBvZlxuICAgKiBgbnVsbGAgb3IgYHVuZGVmaW5lZGAsIHNvIHRoYXQgdGhlIHZhbHVlIGNhbiBiZSBwYXNzZWQgdGhyb3VnaCBhXG4gICAqIHN0cmVhbSBpbiBvYmplY3QgbW9kZS5cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbCAtIHRoZSBDQk9SIGFkZGl0aW9uYWwgaW5mbyB0byBjb252ZXJ0XG4gICAqIEBwYXJhbSB7Ym9vbH0gaGFzUGFyZW50IC0gRG9lcyB0aGUgQ0JPUiBpdGVtIGhhdmUgYSBwYXJlbnQ/XG4gICAqIEByZXR1cm5zIHsobnVsbHx1bmRlZmluZWR8Qm9vbGVhbnxTeW1ib2wpfSAtIHRoZSBkZWNvZGVkIHZhbHVlXG4gICAqL1xuICBzdGF0aWMgZGVjb2RlICh2YWwsIGhhc1BhcmVudCkge1xuICAgIGlmIChoYXNQYXJlbnQgPT0gbnVsbCkge1xuICAgICAgaGFzUGFyZW50ID0gdHJ1ZVxuICAgIH1cbiAgICBzd2l0Y2ggKHZhbCkge1xuICAgICAgY2FzZSBTSU1QTEUuRkFMU0U6XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgY2FzZSBTSU1QTEUuVFJVRTpcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIGNhc2UgU0lNUExFLk5VTEw6XG4gICAgICAgIGlmIChoYXNQYXJlbnQpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBTWU1TLk5VTExcbiAgICAgICAgfVxuICAgICAgY2FzZSBTSU1QTEUuVU5ERUZJTkVEOlxuICAgICAgICBpZiAoaGFzUGFyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHZvaWQgMFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBTWU1TLlVOREVGSU5FRFxuICAgICAgICB9XG4gICAgICBjYXNlIC0xOlxuICAgICAgICBpZiAoIWhhc1BhcmVudCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBCUkVBSycpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNZTVMuQlJFQUtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBuZXcgU2ltcGxlKHZhbClcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGVcbiIsIid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIEEgQ0JPUiB0YWdnZWQgaXRlbSwgd2hlcmUgdGhlIHRhZyBkb2VzIG5vdCBoYXZlIHNlbWFudGljcyBzcGVjaWZpZWQgYXQgdGhlXG4gKiBtb21lbnQsIG9yIHRob3NlIHNlbWFudGljcyB0aHJldyBhbiBlcnJvciBkdXJpbmcgcGFyc2luZy4gVHlwaWNhbGx5IHRoaXMgd2lsbFxuICogYmUgYW4gZXh0ZW5zaW9uIHBvaW50IHlvdSdyZSBub3QgeWV0IGV4cGVjdGluZy5cbiAqL1xuY2xhc3MgVGFnZ2VkIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgVGFnZ2VkLlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gdGFnIC0gdGhlIG51bWJlciBvZiB0aGUgdGFnXG4gICAqIEBwYXJhbSB7YW55fSB2YWx1ZSAtIHRoZSB2YWx1ZSBpbnNpZGUgdGhlIHRhZ1xuICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIgLSB0aGUgZXJyb3IgdGhhdCB3YXMgdGhyb3duIHBhcnNpbmcgdGhlIHRhZywgb3IgbnVsbFxuICAgKi9cbiAgY29uc3RydWN0b3IgKHRhZywgdmFsdWUsIGVycikge1xuICAgIHRoaXMudGFnID0gdGFnXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5lcnIgPSBlcnJcbiAgICBpZiAodHlwZW9mIHRoaXMudGFnICE9PSAnbnVtYmVyJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRhZyB0eXBlICgnICsgKHR5cGVvZiB0aGlzLnRhZykgKyAnKScpXG4gICAgfVxuICAgIGlmICgodGhpcy50YWcgPCAwKSB8fCAoKHRoaXMudGFnIHwgMCkgIT09IHRoaXMudGFnKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUYWcgbXVzdCBiZSBhIHBvc2l0aXZlIGludGVnZXI6ICcgKyB0aGlzLnRhZylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCB0byBhIFN0cmluZ1xuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgb2YgdGhlIGZvcm0gJzEoMiknXG4gICAqL1xuICB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuIGAke3RoaXMudGFnfSgke0pTT04uc3RyaW5naWZ5KHRoaXMudmFsdWUpfSlgXG4gIH1cblxuICAvKipcbiAgICogUHVzaCB0aGUgc2ltcGxlIHZhbHVlIG9udG8gdGhlIENCT1Igc3RyZWFtXG4gICAqXG4gICAqIEBwYXJhbSB7Y2Jvci5FbmNvZGVyfSBnZW4gVGhlIGdlbmVyYXRvciB0byBwdXNoIG9udG9cbiAgICogQHJldHVybnMge251bWJlcn1cbiAgICovXG4gIGVuY29kZUNCT1IgKGdlbikge1xuICAgIGdlbi5fcHVzaFRhZyh0aGlzLnRhZylcbiAgICByZXR1cm4gZ2VuLnB1c2hBbnkodGhpcy52YWx1ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB3ZSBoYXZlIGEgY29udmVydGVyIGZvciB0aGlzIHR5cGUsIGRvIHRoZSBjb252ZXJzaW9uLiAgU29tZSBjb252ZXJ0ZXJzXG4gICAqIGFyZSBidWlsdC1pbi4gIEFkZGl0aW9uYWwgb25lcyBjYW4gYmUgcGFzc2VkIGluLiAgSWYgeW91IHdhbnQgdG8gcmVtb3ZlXG4gICAqIGEgYnVpbHQtaW4gY29udmVydGVyLCBwYXNzIGEgY29udmVydGVyIGluIHdob3NlIHZhbHVlIGlzICdudWxsJyBpbnN0ZWFkXG4gICAqIG9mIGEgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb252ZXJ0ZXJzIC0ga2V5cyBpbiB0aGUgb2JqZWN0IGFyZSBhIHRhZyBudW1iZXIsIHRoZSB2YWx1ZVxuICAgKiAgIGlzIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0aGUgZGVjb2RlZCBDQk9SIGFuZCByZXR1cm5zIGEgSmF2YVNjcmlwdCB2YWx1ZVxuICAgKiAgIG9mIHRoZSBhcHByb3ByaWF0ZSB0eXBlLiAgVGhyb3cgYW4gZXhjZXB0aW9uIGluIHRoZSBmdW5jdGlvbiBvbiBlcnJvcnMuXG4gICAqIEByZXR1cm5zIHthbnl9IC0gdGhlIGNvbnZlcnRlZCBpdGVtXG4gICAqL1xuICBjb252ZXJ0IChjb252ZXJ0ZXJzKSB7XG4gICAgdmFyIGVyLCBmXG4gICAgZiA9IGNvbnZlcnRlcnMgIT0gbnVsbCA/IGNvbnZlcnRlcnNbdGhpcy50YWddIDogdm9pZCAwXG4gICAgaWYgKHR5cGVvZiBmICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmID0gVGFnZ2VkWydfdGFnJyArIHRoaXMudGFnXVxuICAgICAgaWYgKHR5cGVvZiBmICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICB9XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZi5jYWxsKFRhZ2dlZCwgdGhpcy52YWx1ZSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgZXIgPSBlcnJvclxuICAgICAgdGhpcy5lcnIgPSBlclxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUYWdnZWRcbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBCaWdudW1iZXIgPSByZXF1aXJlKCdiaWdudW1iZXIuanMnKS5CaWdOdW1iZXJcblxuY29uc3QgY29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKVxuY29uc3QgU0hJRlQzMiA9IGNvbnN0YW50cy5TSElGVDMyXG5jb25zdCBTSElGVDE2ID0gY29uc3RhbnRzLlNISUZUMTZcbmNvbnN0IE1BWF9TQUZFX0hJR0ggPSAweDFmZmZmZlxuXG5leHBvcnRzLnBhcnNlSGFsZiA9IGZ1bmN0aW9uIHBhcnNlSGFsZiAoYnVmKSB7XG4gIHZhciBleHAsIG1hbnQsIHNpZ25cbiAgc2lnbiA9IGJ1ZlswXSAmIDB4ODAgPyAtMSA6IDFcbiAgZXhwID0gKGJ1ZlswXSAmIDB4N0MpID4+IDJcbiAgbWFudCA9ICgoYnVmWzBdICYgMHgwMykgPDwgOCkgfCBidWZbMV1cbiAgaWYgKCFleHApIHtcbiAgICByZXR1cm4gc2lnbiAqIDUuOTYwNDY0NDc3NTM5MDYyNWUtOCAqIG1hbnRcbiAgfSBlbHNlIGlmIChleHAgPT09IDB4MWYpIHtcbiAgICByZXR1cm4gc2lnbiAqIChtYW50ID8gMCAvIDAgOiAyZTMwOClcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc2lnbiAqIE1hdGgucG93KDIsIGV4cCAtIDI1KSAqICgxMDI0ICsgbWFudClcbiAgfVxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSB7XG4gICAgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIH1cblxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZXhwb3J0cy5hcnJheUJ1ZmZlclRvQmlnbnVtYmVyID0gZnVuY3Rpb24gKGJ1Zikge1xuICBjb25zdCBsZW4gPSBidWYuYnl0ZUxlbmd0aFxuICBsZXQgcmVzID0gJydcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIHJlcyArPSB0b0hleChidWZbaV0pXG4gIH1cblxuICByZXR1cm4gbmV3IEJpZ251bWJlcihyZXMsIDE2KVxufVxuXG4vLyBjb252ZXJ0IGFuIE9iamVjdCBpbnRvIGEgTWFwXG5leHBvcnRzLmJ1aWxkTWFwID0gKG9iaikgPT4ge1xuICBjb25zdCByZXMgPSBuZXcgTWFwKClcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG9iailcbiAgY29uc3QgbGVuZ3RoID0ga2V5cy5sZW5ndGhcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHJlcy5zZXQoa2V5c1tpXSwgb2JqW2tleXNbaV1dKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZXhwb3J0cy5idWlsZEludDMyID0gKGYsIGcpID0+IHtcbiAgcmV0dXJuIGYgKiBTSElGVDE2ICsgZ1xufVxuXG5leHBvcnRzLmJ1aWxkSW50NjQgPSAoZjEsIGYyLCBnMSwgZzIpID0+IHtcbiAgY29uc3QgZiA9IGV4cG9ydHMuYnVpbGRJbnQzMihmMSwgZjIpXG4gIGNvbnN0IGcgPSBleHBvcnRzLmJ1aWxkSW50MzIoZzEsIGcyKVxuXG4gIGlmIChmID4gTUFYX1NBRkVfSElHSCkge1xuICAgIHJldHVybiBuZXcgQmlnbnVtYmVyKGYpLnRpbWVzKFNISUZUMzIpLnBsdXMoZylcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKGYgKiBTSElGVDMyKSArIGdcbiAgfVxufVxuXG5leHBvcnRzLndyaXRlSGFsZiA9IGZ1bmN0aW9uIHdyaXRlSGFsZiAoYnVmLCBoYWxmKSB7XG4gIC8vIGFzc3VtZSAwLCAtMCwgTmFOLCBJbmZpbml0eSwgYW5kIC1JbmZpbml0eSBoYXZlIGFscmVhZHkgYmVlbiBjYXVnaHRcblxuICAvLyBIQUNLOiBldmVyeW9uZSBzZXR0bGUgaW4uICBUaGlzIGlzbid0IGdvaW5nIHRvIGJlIHByZXR0eS5cbiAgLy8gVHJhbnNsYXRlIGNuLWNib3IncyBDIGNvZGUgKGZyb20gQ2Fyc3RlbiBCb3JtYW4pOlxuXG4gIC8vIHVpbnQzMl90IGJlMzI7XG4gIC8vIHVpbnQxNl90IGJlMTYsIHUxNjtcbiAgLy8gdW5pb24ge1xuICAvLyAgIGZsb2F0IGY7XG4gIC8vICAgdWludDMyX3QgdTtcbiAgLy8gfSB1MzI7XG4gIC8vIHUzMi5mID0gZmxvYXRfdmFsO1xuXG4gIGNvbnN0IHUzMiA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSg0KVxuICB1MzIud3JpdGVGbG9hdEJFKGhhbGYsIDApXG4gIGNvbnN0IHUgPSB1MzIucmVhZFVJbnQzMkJFKDApXG5cbiAgLy8gaWYgKCh1MzIudSAmIDB4MUZGRikgPT0gMCkgeyAvKiB3b3J0aCB0cnlpbmcgaGFsZiAqL1xuXG4gIC8vIGhpbGRqajogSWYgdGhlIGxvd2VyIDEzIGJpdHMgYXJlIDAsIHdlIHdvbid0IGxvc2UgYW55dGhpbmcgaW4gdGhlIGNvbnZlcnNpb25cbiAgaWYgKCh1ICYgMHgxRkZGKSAhPT0gMCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gICBpbnQgczE2ID0gKHUzMi51ID4+IDE2KSAmIDB4ODAwMDtcbiAgLy8gICBpbnQgZXhwID0gKHUzMi51ID4+IDIzKSAmIDB4ZmY7XG4gIC8vICAgaW50IG1hbnQgPSB1MzIudSAmIDB4N2ZmZmZmO1xuXG4gIHZhciBzMTYgPSAodSA+PiAxNikgJiAweDgwMDAgLy8gdG9wIGJpdCBpcyBzaWduXG4gIGNvbnN0IGV4cCA9ICh1ID4+IDIzKSAmIDB4ZmYgLy8gdGhlbiA1IGJpdHMgb2YgZXhwb25lbnRcbiAgY29uc3QgbWFudCA9IHUgJiAweDdmZmZmZlxuXG4gIC8vICAgaWYgKGV4cCA9PSAwICYmIG1hbnQgPT0gMClcbiAgLy8gICAgIDsgICAgICAgICAgICAgIC8qIDAuMCwgLTAuMCAqL1xuXG4gIC8vIGhpbGRqajogemVyb3MgYWxyZWFkeSBoYW5kbGVkLiAgQXNzZXJ0IGlmIHlvdSBkb24ndCBiZWxpZXZlIG1lLlxuXG4gIC8vICAgZWxzZSBpZiAoZXhwID49IDExMyAmJiBleHAgPD0gMTQyKSAvKiBub3JtYWxpemVkICovXG4gIC8vICAgICBzMTYgKz0gKChleHAgLSAxMTIpIDw8IDEwKSArIChtYW50ID4+IDEzKTtcbiAgaWYgKChleHAgPj0gMTEzKSAmJiAoZXhwIDw9IDE0MikpIHtcbiAgICBzMTYgKz0gKChleHAgLSAxMTIpIDw8IDEwKSArIChtYW50ID4+IDEzKVxuXG4gIC8vICAgZWxzZSBpZiAoZXhwID49IDEwMyAmJiBleHAgPCAxMTMpIHsgLyogZGVub3JtLCBleHAxNiA9IDAgKi9cbiAgLy8gICAgIGlmIChtYW50ICYgKCgxIDw8ICgxMjYgLSBleHApKSAtIDEpKVxuICAvLyAgICAgICBnb3RvIGZsb2F0MzI7ICAgICAgICAgLyogbG9zcyBvZiBwcmVjaXNpb24gKi9cbiAgLy8gICAgIHMxNiArPSAoKG1hbnQgKyAweDgwMDAwMCkgPj4gKDEyNiAtIGV4cCkpO1xuICB9IGVsc2UgaWYgKChleHAgPj0gMTAzKSAmJiAoZXhwIDwgMTEzKSkge1xuICAgIGlmIChtYW50ICYgKCgxIDw8ICgxMjYgLSBleHApKSAtIDEpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgczE2ICs9ICgobWFudCArIDB4ODAwMDAwKSA+PiAoMTI2IC0gZXhwKSlcblxuICAgIC8vICAgfSBlbHNlIGlmIChleHAgPT0gMjU1ICYmIG1hbnQgPT0gMCkgeyAvKiBJbmYgKi9cbiAgICAvLyAgICAgczE2ICs9IDB4N2MwMDtcblxuICAgIC8vIGhpbGRqajogSW5maW5pdHkgYWxyZWFkeSBoYW5kbGVkXG5cbiAgLy8gICB9IGVsc2VcbiAgLy8gICAgIGdvdG8gZmxvYXQzMjsgICAgICAgICAgIC8qIGxvc3Mgb2YgcmFuZ2UgKi9cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vICAgZW5zdXJlX3dyaXRhYmxlKDMpO1xuICAvLyAgIHUxNiA9IHMxNjtcbiAgLy8gICBiZTE2ID0gaHRvbjE2cCgoY29uc3QgdWludDhfdCopJnUxNik7XG4gIGJ1Zi53cml0ZVVJbnQxNkJFKHMxNiwgMClcbiAgcmV0dXJuIHRydWVcbn1cblxuZXhwb3J0cy5rZXlTb3J0ZXIgPSBmdW5jdGlvbiAoYSwgYikge1xuICB2YXIgbGVuQSA9IGFbMF0uYnl0ZUxlbmd0aFxuICB2YXIgbGVuQiA9IGJbMF0uYnl0ZUxlbmd0aFxuXG4gIGlmIChsZW5BID4gbGVuQikge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBpZiAobGVuQiA+IGxlbkEpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIHJldHVybiBhWzBdLmNvbXBhcmUoYlswXSlcbn1cblxuLy8gQWRhcHRlZCBmcm9tIGh0dHA6Ly93d3cuMmFsaXR5LmNvbS8yMDEyLzAzL3NpZ25lZHplcm8uaHRtbFxuZXhwb3J0cy5pc05lZ2F0aXZlWmVybyA9ICh4KSA9PiB7XG4gIHJldHVybiB4ID09PSAwICYmICgxIC8geCA8IDApXG59XG5cbmV4cG9ydHMubmV4dFBvd2VyT2YyID0gKG4pID0+IHtcbiAgbGV0IGNvdW50ID0gMFxuICAvLyBGaXJzdCBuIGluIHRoZSBiZWxvdyBjb25kaXRpb24gaXMgZm9yXG4gIC8vIHRoZSBjYXNlIHdoZXJlIG4gaXMgMFxuICBpZiAobiAmJiAhKG4gJiAobiAtIDEpKSkge1xuICAgIHJldHVybiBuXG4gIH1cblxuICB3aGlsZSAobiAhPT0gMCkge1xuICAgIG4gPj49IDFcbiAgICBjb3VudCArPSAxXG4gIH1cblxuICByZXR1cm4gMSA8PCBjb3VudFxufVxuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gU2xvd0J1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5cbnZhciBLX01BWF9MRU5HVEggPSAweDdmZmZmZmZmXG5leHBvcnRzLmtNYXhMZW5ndGggPSBLX01BWF9MRU5HVEhcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgUHJpbnQgd2FybmluZyBhbmQgcmVjb21tZW5kIHVzaW5nIGBidWZmZXJgIHY0Lnggd2hpY2ggaGFzIGFuIE9iamVjdFxuICogICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogV2UgcmVwb3J0IHRoYXQgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0eXBlZCBhcnJheXMgaWYgdGhlIGFyZSBub3Qgc3ViY2xhc3NhYmxlXG4gKiB1c2luZyBfX3Byb3RvX18uIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgXG4gKiAoU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzgpLiBJRSAxMCBsYWNrcyBzdXBwb3J0XG4gKiBmb3IgX19wcm90b19fIGFuZCBoYXMgYSBidWdneSB0eXBlZCBhcnJheSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbmlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgY29uc29sZS5lcnJvcihcbiAgICAnVGhpcyBicm93c2VyIGxhY2tzIHR5cGVkIGFycmF5IChVaW50OEFycmF5KSBzdXBwb3J0IHdoaWNoIGlzIHJlcXVpcmVkIGJ5ICcgK1xuICAgICdgYnVmZmVyYCB2NS54LiBVc2UgYGJ1ZmZlcmAgdjQueCBpZiB5b3UgcmVxdWlyZSBvbGQgYnJvd3NlciBzdXBwb3J0LidcbiAgKVxufVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIC8vIENhbiB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZD9cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuX19wcm90b19fID0geyBfX3Byb3RvX186IFVpbnQ4QXJyYXkucHJvdG90eXBlLCBmb286IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH0gfVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ3BhcmVudCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5idWZmZXJcbiAgfVxufSlcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdvZmZzZXQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnl0ZU9mZnNldFxuICB9XG59KVxuXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAobGVuZ3RoID4gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBsZW5ndGggKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbi8qKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBoYXZlIHRoZWlyXG4gKiBwcm90b3R5cGUgY2hhbmdlZCB0byBgQnVmZmVyLnByb3RvdHlwZWAuIEZ1cnRoZXJtb3JlLCBgQnVmZmVyYCBpcyBhIHN1YmNsYXNzIG9mXG4gKiBgVWludDhBcnJheWAsIHNvIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgd2lsbCBoYXZlIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBtZXRob2RzXG4gKiBhbmQgdGhlIGBVaW50OEFycmF5YCBtZXRob2RzLiBTcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdFxuICogcmV0dXJucyBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBUaGUgYFVpbnQ4QXJyYXlgIHByb3RvdHlwZSByZW1haW5zIHVubW9kaWZpZWQuXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZ09yT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYWxsb2NVbnNhZmUoYXJnKVxuICB9XG4gIHJldHVybiBmcm9tKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBGaXggc3ViYXJyYXkoKSBpbiBFUzIwMTYuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC85N1xuaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC5zcGVjaWVzICE9IG51bGwgJiZcbiAgICBCdWZmZXJbU3ltYm9sLnNwZWNpZXNdID09PSBCdWZmZXIpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlciwgU3ltYm9sLnNwZWNpZXMsIHtcbiAgICB2YWx1ZTogbnVsbCxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pXG59XG5cbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG5mdW5jdGlvbiBmcm9tICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpXG4gIH1cblxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHZhbHVlKVxuICB9XG5cbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gICAgKVxuICB9XG5cbiAgaWYgKGlzSW5zdGFuY2UodmFsdWUsIEFycmF5QnVmZmVyKSB8fFxuICAgICAgKHZhbHVlICYmIGlzSW5zdGFuY2UodmFsdWUuYnVmZmVyLCBBcnJheUJ1ZmZlcikpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgb2YgdHlwZSBudW1iZXIuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgIClcbiAgfVxuXG4gIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZiAmJiB2YWx1ZS52YWx1ZU9mKClcbiAgaWYgKHZhbHVlT2YgIT0gbnVsbCAmJiB2YWx1ZU9mICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbSh2YWx1ZU9mLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICB2YXIgYiA9IGZyb21PYmplY3QodmFsdWUpXG4gIGlmIChiKSByZXR1cm4gYlxuXG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9QcmltaXRpdmUgIT0gbnVsbCAmJlxuICAgICAgdHlwZW9mIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oXG4gICAgICB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdKCdzdHJpbmcnKSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoXG4gICAgKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICApXG59XG5cbi8qKlxuICogRnVuY3Rpb25hbGx5IGVxdWl2YWxlbnQgdG8gQnVmZmVyKGFyZywgZW5jb2RpbmcpIGJ1dCB0aHJvd3MgYSBUeXBlRXJyb3JcbiAqIGlmIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQnVmZmVyLmZyb20oc3RyWywgZW5jb2RpbmddKVxuICogQnVmZmVyLmZyb20oYXJyYXkpXG4gKiBCdWZmZXIuZnJvbShidWZmZXIpXG4gKiBCdWZmZXIuZnJvbShhcnJheUJ1ZmZlclssIGJ5dGVPZmZzZXRbLCBsZW5ndGhdXSlcbiAqKi9cbkJ1ZmZlci5mcm9tID0gZnVuY3Rpb24gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZyb20odmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gTm90ZTogQ2hhbmdlIHByb3RvdHlwZSAqYWZ0ZXIqIEJ1ZmZlci5mcm9tIGlzIGRlZmluZWQgdG8gd29ya2Fyb3VuZCBDaHJvbWUgYnVnOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC8xNDhcbkJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbkJ1ZmZlci5fX3Byb3RvX18gPSBVaW50OEFycmF5XG5cbmZ1bmN0aW9uIGFzc2VydFNpemUgKHNpemUpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBudW1iZXInKVxuICB9IGVsc2UgaWYgKHNpemUgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBzaXplICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG5cbiAgdmFyIGFjdHVhbCA9IGJ1Zi53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbClcbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZltpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wib2Zmc2V0XCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmIChhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCArIChsZW5ndGggfHwgMCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJsZW5ndGhcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgdmFyIGJ1ZlxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0IChvYmopIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmopKSB7XG4gICAgdmFyIGxlbiA9IGNoZWNrZWQob2JqLmxlbmd0aCkgfCAwXG4gICAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW4pXG5cbiAgICBpZiAoYnVmLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJ1ZlxuICAgIH1cblxuICAgIG9iai5jb3B5KGJ1ZiwgMCwgMCwgbGVuKVxuICAgIHJldHVybiBidWZcbiAgfVxuXG4gIGlmIChvYmoubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIG9iai5sZW5ndGggIT09ICdudW1iZXInIHx8IG51bWJlcklzTmFOKG9iai5sZW5ndGgpKSB7XG4gICAgICByZXR1cm4gY3JlYXRlQnVmZmVyKDApXG4gICAgfVxuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iailcbiAgfVxuXG4gIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgQXJyYXkuaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmouZGF0YSlcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwgS19NQVhfTEVOR1RIYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBLX01BWF9MRU5HVEgudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAobGVuZ3RoKSB7XG4gIGlmICgrbGVuZ3RoICE9IGxlbmd0aCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIGxlbmd0aCA9IDBcbiAgfVxuICByZXR1cm4gQnVmZmVyLmFsbG9jKCtsZW5ndGgpXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiBiICE9IG51bGwgJiYgYi5faXNCdWZmZXIgPT09IHRydWUgJiZcbiAgICBiICE9PSBCdWZmZXIucHJvdG90eXBlIC8vIHNvIEJ1ZmZlci5pc0J1ZmZlcihCdWZmZXIucHJvdG90eXBlKSB3aWxsIGJlIGZhbHNlXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoaXNJbnN0YW5jZShhLCBVaW50OEFycmF5KSkgYSA9IEJ1ZmZlci5mcm9tKGEsIGEub2Zmc2V0LCBhLmJ5dGVMZW5ndGgpXG4gIGlmIChpc0luc3RhbmNlKGIsIFVpbnQ4QXJyYXkpKSBiID0gQnVmZmVyLmZyb20oYiwgYi5vZmZzZXQsIGIuYnl0ZUxlbmd0aClcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwiYnVmMVwiLCBcImJ1ZjJcIiBhcmd1bWVudHMgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheSdcbiAgICApXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXVxuICAgICAgeSA9IGJbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJ1ZiA9IGxpc3RbaV1cbiAgICBpZiAoaXNJbnN0YW5jZShidWYsIFVpbnQ4QXJyYXkpKSB7XG4gICAgICBidWYgPSBCdWZmZXIuZnJvbShidWYpXG4gICAgfVxuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gICAgfVxuICAgIGJ1Zi5jb3B5KGJ1ZmZlciwgcG9zKVxuICAgIHBvcyArPSBidWYubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmcubGVuZ3RoXG4gIH1cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhzdHJpbmcpIHx8IGlzSW5zdGFuY2Uoc3RyaW5nLCBBcnJheUJ1ZmZlcikpIHtcbiAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIG9yIEFycmF5QnVmZmVyLiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2Ygc3RyaW5nXG4gICAgKVxuICB9XG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIG11c3RNYXRjaCA9IChhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gPT09IHRydWUpXG4gIGlmICghbXVzdE1hdGNoICYmIGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkge1xuICAgICAgICAgIHJldHVybiBtdXN0TWF0Y2ggPyAtMSA6IHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIH1cbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGlzIHByb3BlcnR5IGlzIHVzZWQgYnkgYEJ1ZmZlci5pc0J1ZmZlcmAgKGFuZCB0aGUgYGlzLWJ1ZmZlcmAgbnBtIHBhY2thZ2UpXG4vLyB0byBkZXRlY3QgYSBCdWZmZXIgaW5zdGFuY2UuIEl0J3Mgbm90IHBvc3NpYmxlIHRvIHVzZSBgaW5zdGFuY2VvZiBCdWZmZXJgXG4vLyByZWxpYWJseSBpbiBhIGJyb3dzZXJpZnkgY29udGV4dCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGRpZmZlcmVudFxuLy8gY29waWVzIG9mIHRoZSAnYnVmZmVyJyBwYWNrYWdlIGluIHVzZS4gVGhpcyBtZXRob2Qgd29ya3MgZXZlbiBmb3IgQnVmZmVyXG4vLyBpbnN0YW5jZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZnJvbSBhbm90aGVyIGNvcHkgb2YgdGhlIGBidWZmZXJgIHBhY2thZ2UuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNTRcbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDY0ID0gZnVuY3Rpb24gc3dhcDY0ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA4KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgNylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNilcbiAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSlcbiAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNClcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9Mb2NhbGVTdHJpbmcgPSBCdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nXG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkucmVwbGFjZSgvKC57Mn0pL2csICckMSAnKS50cmltKClcbiAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoaXNJbnN0YW5jZSh0YXJnZXQsIFVpbnQ4QXJyYXkpKSB7XG4gICAgdGFyZ2V0ID0gQnVmZmVyLmZyb20odGFyZ2V0LCB0YXJnZXQub2Zmc2V0LCB0YXJnZXQuYnl0ZUxlbmd0aClcbiAgfVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ0YXJnZXRcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5LiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHRhcmdldClcbiAgICApXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuLy8gRmluZHMgZWl0aGVyIHRoZSBmaXJzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPj0gYGJ5dGVPZmZzZXRgLFxuLy8gT1IgdGhlIGxhc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0IDw9IGBieXRlT2Zmc2V0YC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAtIGJ1ZmZlciAtIGEgQnVmZmVyIHRvIHNlYXJjaFxuLy8gLSB2YWwgLSBhIHN0cmluZywgQnVmZmVyLCBvciBudW1iZXJcbi8vIC0gYnl0ZU9mZnNldCAtIGFuIGluZGV4IGludG8gYGJ1ZmZlcmA7IHdpbGwgYmUgY2xhbXBlZCB0byBhbiBpbnQzMlxuLy8gLSBlbmNvZGluZyAtIGFuIG9wdGlvbmFsIGVuY29kaW5nLCByZWxldmFudCBpcyB2YWwgaXMgYSBzdHJpbmdcbi8vIC0gZGlyIC0gdHJ1ZSBmb3IgaW5kZXhPZiwgZmFsc2UgZm9yIGxhc3RJbmRleE9mXG5mdW5jdGlvbiBiaWRpcmVjdGlvbmFsSW5kZXhPZiAoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgLy8gRW1wdHkgYnVmZmVyIG1lYW5zIG5vIG1hdGNoXG4gIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldFxuICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBieXRlT2Zmc2V0XG4gICAgYnl0ZU9mZnNldCA9IDBcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikge1xuICAgIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSB7XG4gICAgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIH1cbiAgYnl0ZU9mZnNldCA9ICtieXRlT2Zmc2V0IC8vIENvZXJjZSB0byBOdW1iZXIuXG4gIGlmIChudW1iZXJJc05hTihieXRlT2Zmc2V0KSkge1xuICAgIC8vIGJ5dGVPZmZzZXQ6IGl0IGl0J3MgdW5kZWZpbmVkLCBudWxsLCBOYU4sIFwiZm9vXCIsIGV0Yywgc2VhcmNoIHdob2xlIGJ1ZmZlclxuICAgIGJ5dGVPZmZzZXQgPSBkaXIgPyAwIDogKGJ1ZmZlci5sZW5ndGggLSAxKVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXQ6IG5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCArIGJ5dGVPZmZzZXRcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gYnVmZmVyLmxlbmd0aCkge1xuICAgIGlmIChkaXIpIHJldHVybiAtMVxuICAgIGVsc2UgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggLSAxXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IDApIHtcbiAgICBpZiAoZGlyKSBieXRlT2Zmc2V0ID0gMFxuICAgIGVsc2UgcmV0dXJuIC0xXG4gIH1cblxuICAvLyBOb3JtYWxpemUgdmFsXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIHZhbCA9IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gIH1cblxuICAvLyBGaW5hbGx5LCBzZWFyY2ggZWl0aGVyIGluZGV4T2YgKGlmIGRpciBpcyB0cnVlKSBvciBsYXN0SW5kZXhPZlxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICAvLyBTcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZy9idWZmZXIgYWx3YXlzIGZhaWxzXG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMHhGRiAvLyBTZWFyY2ggZm9yIGEgYnl0ZSB2YWx1ZSBbMC0yNTVdXG4gICAgaWYgKHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBpZiAoZGlyKSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIFsgdmFsIF0sIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG5mdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIHZhciBpbmRleFNpemUgPSAxXG4gIHZhciBhcnJMZW5ndGggPSBhcnIubGVuZ3RoXG4gIHZhciB2YWxMZW5ndGggPSB2YWwubGVuZ3RoXG5cbiAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgIGlmIChlbmNvZGluZyA9PT0gJ3VjczInIHx8IGVuY29kaW5nID09PSAndWNzLTInIHx8XG4gICAgICAgIGVuY29kaW5nID09PSAndXRmMTZsZScgfHwgZW5jb2RpbmcgPT09ICd1dGYtMTZsZScpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoIDwgMiB8fCB2YWwubGVuZ3RoIDwgMikge1xuICAgICAgICByZXR1cm4gLTFcbiAgICAgIH1cbiAgICAgIGluZGV4U2l6ZSA9IDJcbiAgICAgIGFyckxlbmd0aCAvPSAyXG4gICAgICB2YWxMZW5ndGggLz0gMlxuICAgICAgYnl0ZU9mZnNldCAvPSAyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoYnVmLCBpKSB7XG4gICAgaWYgKGluZGV4U2l6ZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIGJ1ZltpXVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYnVmLnJlYWRVSW50MTZCRShpICogaW5kZXhTaXplKVxuICAgIH1cbiAgfVxuXG4gIHZhciBpXG4gIGlmIChkaXIpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA8IGFyckxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocmVhZChhcnIsIGkpID09PSByZWFkKHZhbCwgZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXgpKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsTGVuZ3RoKSByZXR1cm4gZm91bmRJbmRleCAqIGluZGV4U2l6ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggIT09IC0xKSBpIC09IGkgLSBmb3VuZEluZGV4XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoYnl0ZU9mZnNldCArIHZhbExlbmd0aCA+IGFyckxlbmd0aCkgYnl0ZU9mZnNldCA9IGFyckxlbmd0aCAtIHZhbExlbmd0aFxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgZm91bmQgPSB0cnVlXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbExlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChyZWFkKGFyciwgaSArIGopICE9PSByZWFkKHZhbCwgaikpIHtcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGZvdW5kKSByZXR1cm4gaVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIHRoaXMuaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSAhPT0gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgdHJ1ZSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIGxhc3RJbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChudW1iZXJJc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gbGF0aW4xV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCA+Pj4gMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ0J1ZmZlci53cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXRbLCBsZW5ndGhdKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkJ1xuICAgIClcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gbGF0aW4xU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIChieXRlc1tpICsgMV0gKiAyNTYpKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIG5ld0J1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJidWZmZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgLSAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpICsgMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzaG91bGQgYmUgYSBCdWZmZXInKVxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiB0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFVzZSBidWlsdC1pbiB3aGVuIGF2YWlsYWJsZSwgbWlzc2luZyBmcm9tIElFMTFcbiAgICB0aGlzLmNvcHlXaXRoaW4odGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpXG4gIH0gZWxzZSBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKHZhciBpID0gbGVuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKFxuICAgICAgdGFyZ2V0LFxuICAgICAgdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmICgoZW5jb2RpbmcgPT09ICd1dGY4JyAmJiBjb2RlIDwgMTI4KSB8fFxuICAgICAgICAgIGVuY29kaW5nID09PSAnbGF0aW4xJykge1xuICAgICAgICAvLyBGYXN0IHBhdGg6IElmIGB2YWxgIGZpdHMgaW50byBhIHNpbmdsZSBieXRlLCB1c2UgdGhhdCBudW1lcmljIHZhbHVlLlxuICAgICAgICB2YWwgPSBjb2RlXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMjU1XG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIHZhbHVlIFwiJyArIHZhbCArXG4gICAgICAgICdcIiBpcyBpbnZhbGlkIGZvciBhcmd1bWVudCBcInZhbHVlXCInKVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXisvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHRha2VzIGVxdWFsIHNpZ25zIGFzIGVuZCBvZiB0aGUgQmFzZTY0IGVuY29kaW5nXG4gIHN0ciA9IHN0ci5zcGxpdCgnPScpWzBdXG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSAobGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCkgKyAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuLy8gQXJyYXlCdWZmZXIgb3IgVWludDhBcnJheSBvYmplY3RzIGZyb20gb3RoZXIgY29udGV4dHMgKGkuZS4gaWZyYW1lcykgZG8gbm90IHBhc3Ncbi8vIHRoZSBgaW5zdGFuY2VvZmAgY2hlY2sgYnV0IHRoZXkgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgb2YgdGhhdCB0eXBlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTY2XG5mdW5jdGlvbiBpc0luc3RhbmNlIChvYmosIHR5cGUpIHtcbiAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIHR5cGUgfHxcbiAgICAob2JqICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgIT0gbnVsbCAmJlxuICAgICAgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09IHR5cGUubmFtZSlcbn1cbmZ1bmN0aW9uIG51bWJlcklzTmFOIChvYmopIHtcbiAgLy8gRm9yIElFMTEgc3VwcG9ydFxuICByZXR1cm4gb2JqICE9PSBvYmogLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgY3JlYXRlQWJvcnRFcnJvciA9ICgpID0+IHtcblx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ0RlbGF5IGFib3J0ZWQnKTtcblx0ZXJyb3IubmFtZSA9ICdBYm9ydEVycm9yJztcblx0cmV0dXJuIGVycm9yO1xufTtcblxuY29uc3QgY3JlYXRlRGVsYXkgPSAoe2NsZWFyVGltZW91dDogZGVmYXVsdENsZWFyLCBzZXRUaW1lb3V0OiBzZXQsIHdpbGxSZXNvbHZlfSkgPT4gKG1zLCB7dmFsdWUsIHNpZ25hbH0gPSB7fSkgPT4ge1xuXHRpZiAoc2lnbmFsICYmIHNpZ25hbC5hYm9ydGVkKSB7XG5cdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KGNyZWF0ZUFib3J0RXJyb3IoKSk7XG5cdH1cblxuXHRsZXQgdGltZW91dElkO1xuXHRsZXQgc2V0dGxlO1xuXHRsZXQgcmVqZWN0Rm47XG5cdGNvbnN0IGNsZWFyID0gZGVmYXVsdENsZWFyIHx8IGNsZWFyVGltZW91dDtcblxuXHRjb25zdCBzaWduYWxMaXN0ZW5lciA9ICgpID0+IHtcblx0XHRjbGVhcih0aW1lb3V0SWQpO1xuXHRcdHJlamVjdEZuKGNyZWF0ZUFib3J0RXJyb3IoKSk7XG5cdH07XG5cblx0Y29uc3QgY2xlYW51cCA9ICgpID0+IHtcblx0XHRpZiAoc2lnbmFsKSB7XG5cdFx0XHRzaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBzaWduYWxMaXN0ZW5lcik7XG5cdFx0fVxuXHR9O1xuXG5cdGNvbnN0IGRlbGF5UHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRzZXR0bGUgPSAoKSA9PiB7XG5cdFx0XHRjbGVhbnVwKCk7XG5cdFx0XHRpZiAod2lsbFJlc29sdmUpIHtcblx0XHRcdFx0cmVzb2x2ZSh2YWx1ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZWplY3QodmFsdWUpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRyZWplY3RGbiA9IHJlamVjdDtcblx0XHR0aW1lb3V0SWQgPSAoc2V0IHx8IHNldFRpbWVvdXQpKHNldHRsZSwgbXMpO1xuXHR9KTtcblxuXHRpZiAoc2lnbmFsKSB7XG5cdFx0c2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgc2lnbmFsTGlzdGVuZXIsIHtvbmNlOiB0cnVlfSk7XG5cdH1cblxuXHRkZWxheVByb21pc2UuY2xlYXIgPSAoKSA9PiB7XG5cdFx0Y2xlYXIodGltZW91dElkKTtcblx0XHR0aW1lb3V0SWQgPSBudWxsO1xuXHRcdGNsZWFudXAoKTtcblx0XHRzZXR0bGUoKTtcblx0fTtcblxuXHRyZXR1cm4gZGVsYXlQcm9taXNlO1xufTtcblxuY29uc3QgZGVsYXkgPSBjcmVhdGVEZWxheSh7d2lsbFJlc29sdmU6IHRydWV9KTtcbmRlbGF5LnJlamVjdCA9IGNyZWF0ZURlbGF5KHt3aWxsUmVzb2x2ZTogZmFsc2V9KTtcbmRlbGF5LmNyZWF0ZVdpdGhUaW1lcnMgPSAoe2NsZWFyVGltZW91dCwgc2V0VGltZW91dH0pID0+IHtcblx0Y29uc3QgZGVsYXkgPSBjcmVhdGVEZWxheSh7Y2xlYXJUaW1lb3V0LCBzZXRUaW1lb3V0LCB3aWxsUmVzb2x2ZTogdHJ1ZX0pO1xuXHRkZWxheS5yZWplY3QgPSBjcmVhdGVEZWxheSh7Y2xlYXJUaW1lb3V0LCBzZXRUaW1lb3V0LCB3aWxsUmVzb2x2ZTogZmFsc2V9KTtcblx0cmV0dXJuIGRlbGF5O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZWxheTtcbi8vIFRPRE86IFJlbW92ZSB0aGlzIGZvciB0aGUgbmV4dCBtYWpvciByZWxlYXNlXG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gZGVsYXk7XG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IChlICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IChtICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKCh2YWx1ZSAqIGMpIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHtcbiAgICBVUkxXaXRoTGVnYWN5U3VwcG9ydCxcbiAgICBmb3JtYXQsXG4gICAgVVJMU2VhcmNoUGFyYW1zLFxuICAgIGRlZmF1bHRCYXNlXG59ID0gcmVxdWlyZSgnLi9zcmMvdXJsJyk7XG5jb25zdCByZWxhdGl2ZSA9IHJlcXVpcmUoJy4vc3JjL3JlbGF0aXZlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFVSTDogVVJMV2l0aExlZ2FjeVN1cHBvcnQsXG4gICAgVVJMU2VhcmNoUGFyYW1zLFxuICAgIGZvcm1hdCxcbiAgICByZWxhdGl2ZSxcbiAgICBkZWZhdWx0QmFzZVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgeyBVUkxXaXRoTGVnYWN5U3VwcG9ydCwgZm9ybWF0IH0gPSByZXF1aXJlKCcuL3VybCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9ICh1cmwsIGxvY2F0aW9uID0ge30sIHByb3RvY29sTWFwID0ge30sIGRlZmF1bHRQcm90b2NvbCkgPT4ge1xuICAgIGxldCBwcm90b2NvbCA9IGxvY2F0aW9uLnByb3RvY29sID9cbiAgICAgICAgbG9jYXRpb24ucHJvdG9jb2wucmVwbGFjZSgnOicsICcnKSA6XG4gICAgICAgICdodHRwJztcblxuICAgIC8vIENoZWNrIHByb3RvY29sIG1hcFxuICAgIHByb3RvY29sID0gKHByb3RvY29sTWFwW3Byb3RvY29sXSB8fCBkZWZhdWx0UHJvdG9jb2wgfHwgcHJvdG9jb2wpICsgJzonO1xuICAgIGxldCB1cmxQYXJzZWQ7XG5cbiAgICB0cnkge1xuICAgICAgICB1cmxQYXJzZWQgPSBuZXcgVVJMV2l0aExlZ2FjeVN1cHBvcnQodXJsKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdXJsUGFyc2VkID0ge307XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZSA9IE9iamVjdC5hc3NpZ24oe30sIGxvY2F0aW9uLCB7XG4gICAgICAgIHByb3RvY29sOiBwcm90b2NvbCB8fCB1cmxQYXJzZWQucHJvdG9jb2wsXG4gICAgICAgIGhvc3Q6IGxvY2F0aW9uLmhvc3QgfHwgdXJsUGFyc2VkLmhvc3RcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgVVJMV2l0aExlZ2FjeVN1cHBvcnQodXJsLCBmb3JtYXQoYmFzZSkpLnRvU3RyaW5nKCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBkZWZhdWx0QmFzZSA9IHNlbGYubG9jYXRpb24gP1xuICAgIHNlbGYubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgc2VsZi5sb2NhdGlvbi5ob3N0IDpcbiAgICAnJztcbmNvbnN0IFVSTCA9IHNlbGYuVVJMO1xuXG5jbGFzcyBVUkxXaXRoTGVnYWN5U3VwcG9ydCB7XG4gICAgY29uc3RydWN0b3IodXJsLCBiYXNlID0gZGVmYXVsdEJhc2UpIHtcbiAgICAgICAgdGhpcy5zdXBlciA9IG5ldyBVUkwodXJsLCBiYXNlKTtcbiAgICAgICAgdGhpcy5wYXRoID0gdGhpcy5wYXRobmFtZSArIHRoaXMuc2VhcmNoO1xuICAgICAgICB0aGlzLmF1dGggPVxuICAgICAgICAgICAgdGhpcy51c2VybmFtZSAmJiB0aGlzLnBhc3N3b3JkID9cbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lICsgJzonICsgdGhpcy5wYXNzd29yZCA6XG4gICAgICAgICAgICAgICAgbnVsbDtcblxuICAgICAgICB0aGlzLnF1ZXJ5ID1cbiAgICAgICAgICAgIHRoaXMuc2VhcmNoICYmIHRoaXMuc2VhcmNoLnN0YXJ0c1dpdGgoJz8nKSA/XG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2guc2xpY2UoMSkgOlxuICAgICAgICAgICAgICAgIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IGhhc2goKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyLmhhc2g7XG4gICAgfVxuICAgIGdldCBob3N0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci5ob3N0O1xuICAgIH1cbiAgICBnZXQgaG9zdG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyLmhvc3RuYW1lO1xuICAgIH1cbiAgICBnZXQgaHJlZigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIuaHJlZjtcbiAgICB9XG4gICAgZ2V0IG9yaWdpbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIub3JpZ2luO1xuICAgIH1cbiAgICBnZXQgcGFzc3dvcmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyLnBhc3N3b3JkO1xuICAgIH1cbiAgICBnZXQgcGF0aG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyLnBhdGhuYW1lO1xuICAgIH1cbiAgICBnZXQgcG9ydCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIucG9ydDtcbiAgICB9XG4gICAgZ2V0IHByb3RvY29sKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci5wcm90b2NvbDtcbiAgICB9XG4gICAgZ2V0IHNlYXJjaCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIuc2VhcmNoO1xuICAgIH1cbiAgICBnZXQgc2VhcmNoUGFyYW1zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci5zZWFyY2hQYXJhbXM7XG4gICAgfVxuICAgIGdldCB1c2VybmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIudXNlcm5hbWU7XG4gICAgfVxuXG4gICAgc2V0IGhhc2goaGFzaCkge1xuICAgICAgICB0aGlzLnN1cGVyLmhhc2ggPSBoYXNoO1xuICAgIH1cbiAgICBzZXQgaG9zdChob3N0KSB7XG4gICAgICAgIHRoaXMuc3VwZXIuaG9zdCA9IGhvc3Q7XG4gICAgfVxuICAgIHNldCBob3N0bmFtZShob3N0bmFtZSkge1xuICAgICAgICB0aGlzLnN1cGVyLmhvc3RuYW1lID0gaG9zdG5hbWU7XG4gICAgfVxuICAgIHNldCBocmVmKGhyZWYpIHtcbiAgICAgICAgdGhpcy5zdXBlci5ocmVmID0gaHJlZjtcbiAgICB9XG4gICAgc2V0IG9yaWdpbihvcmlnaW4pIHtcbiAgICAgICAgdGhpcy5zdXBlci5vcmlnaW4gPSBvcmlnaW47XG4gICAgfVxuICAgIHNldCBwYXNzd29yZChwYXNzd29yZCkge1xuICAgICAgICB0aGlzLnN1cGVyLnBhc3N3b3JkID0gcGFzc3dvcmQ7XG4gICAgfVxuICAgIHNldCBwYXRobmFtZShwYXRobmFtZSkge1xuICAgICAgICB0aGlzLnN1cGVyLnBhdGhuYW1lID0gcGF0aG5hbWU7XG4gICAgfVxuICAgIHNldCBwb3J0KHBvcnQpIHtcbiAgICAgICAgdGhpcy5zdXBlci5wb3J0ID0gcG9ydDtcbiAgICB9XG4gICAgc2V0IHByb3RvY29sKHByb3RvY29sKSB7XG4gICAgICAgIHRoaXMuc3VwZXIucHJvdG9jb2wgPSBwcm90b2NvbDtcbiAgICB9XG4gICAgc2V0IHNlYXJjaChzZWFyY2gpIHtcbiAgICAgICAgdGhpcy5zdXBlci5zZWFyY2ggPSBzZWFyY2g7XG4gICAgfVxuICAgIHNldCBzZWFyY2hQYXJhbXMoc2VhcmNoUGFyYW1zKSB7XG4gICAgICAgIHRoaXMuc3VwZXIuc2VhcmNoUGFyYW1zID0gc2VhcmNoUGFyYW1zO1xuICAgIH1cbiAgICBzZXQgdXNlcm5hbWUodXNlcm5hbWUpIHtcbiAgICAgICAgdGhpcy5zdXBlci51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIH1cblxuICAgIGNyZWF0ZU9iamVjdFVSTChvKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyLmNyZWF0ZU9iamVjdFVSTChvKTtcbiAgICB9XG4gICAgcmV2b2tlT2JqZWN0VVJMKG8pIHtcbiAgICAgICAgdGhpcy5zdXBlci5yZXZva2VPYmplY3RVUkwobyk7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXIudG9KU09OKCk7XG4gICAgfVxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlci50b1N0cmluZygpO1xuICAgIH1cbiAgICBmb3JtYXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmb3JtYXQob2JqKSB7XG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwob2JqKTtcblxuICAgICAgICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgaWYgKCEob2JqIGluc3RhbmNlb2YgVVJMKSkge1xuICAgICAgICBjb25zdCB1c2VyUGFzcyA9XG4gICAgICAgICAgICBvYmoudXNlcm5hbWUgJiYgb2JqLnBhc3N3b3JkID9cbiAgICAgICAgICAgICAgICBgJHtvYmoudXNlcm5hbWV9OiR7b2JqLnBhc3N3b3JkfUBgIDpcbiAgICAgICAgICAgICAgICAnJztcbiAgICAgICAgY29uc3QgYXV0aCA9IG9iai5hdXRoID8gb2JqLmF1dGggKyAnQCcgOiAnJztcbiAgICAgICAgY29uc3QgcG9ydCA9IG9iai5wb3J0ID8gJzonICsgb2JqLnBvcnQgOiAnJztcbiAgICAgICAgY29uc3QgcHJvdG9jb2wgPSBvYmoucHJvdG9jb2wgPyBvYmoucHJvdG9jb2wgKyAnLy8nIDogJyc7XG4gICAgICAgIGNvbnN0IGhvc3QgPSBvYmouaG9zdCB8fCAnJztcbiAgICAgICAgY29uc3QgaG9zdG5hbWUgPSBvYmouaG9zdG5hbWUgfHwgJyc7XG4gICAgICAgIGNvbnN0IHNlYXJjaCA9IG9iai5zZWFyY2ggfHwgKG9iai5xdWVyeSA/ICc/JyArIG9iai5xdWVyeSA6ICcnKTtcbiAgICAgICAgY29uc3QgaGFzaCA9IG9iai5oYXNoIHx8ICcnO1xuICAgICAgICBjb25zdCBwYXRobmFtZSA9IG9iai5wYXRobmFtZSB8fCAnJztcbiAgICAgICAgY29uc3QgcGF0aCA9IG9iai5wYXRoIHx8IHBhdGhuYW1lICsgc2VhcmNoO1xuXG4gICAgICAgIHJldHVybiBgJHtwcm90b2NvbH0ke3VzZXJQYXNzIHx8IGF1dGh9JHtob3N0IHx8XG4gICAgICAgICAgICBob3N0bmFtZSArIHBvcnR9JHtwYXRofSR7aGFzaH1gO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgVVJMV2l0aExlZ2FjeVN1cHBvcnQsXG4gICAgVVJMU2VhcmNoUGFyYW1zOiBzZWxmLlVSTFNlYXJjaFBhcmFtcyxcbiAgICBkZWZhdWx0QmFzZSxcbiAgICBmb3JtYXRcbn07XG4iLCJhc3NlcnQubm90RXF1YWwgPSBub3RFcXVhbFxuYXNzZXJ0Lm5vdE9rID0gbm90T2tcbmFzc2VydC5lcXVhbCA9IGVxdWFsXG5hc3NlcnQub2sgPSBhc3NlcnRcblxubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnRcblxuZnVuY3Rpb24gZXF1YWwgKGEsIGIsIG0pIHtcbiAgYXNzZXJ0KGEgPT0gYiwgbSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbn1cblxuZnVuY3Rpb24gbm90RXF1YWwgKGEsIGIsIG0pIHtcbiAgYXNzZXJ0KGEgIT0gYiwgbSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbn1cblxuZnVuY3Rpb24gbm90T2sgKHQsIG0pIHtcbiAgYXNzZXJ0KCF0LCBtKVxufVxuXG5mdW5jdGlvbiBhc3NlcnQgKHQsIG0pIHtcbiAgaWYgKCF0KSB0aHJvdyBuZXcgRXJyb3IobSB8fCAnQXNzZXJ0aW9uRXJyb3InKVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciB0cmFpbGluZ05ld2xpbmVSZWdleCA9IC9cXG5bXFxzXSskL1xudmFyIGxlYWRpbmdOZXdsaW5lUmVnZXggPSAvXlxcbltcXHNdKy9cbnZhciB0cmFpbGluZ1NwYWNlUmVnZXggPSAvW1xcc10rJC9cbnZhciBsZWFkaW5nU3BhY2VSZWdleCA9IC9eW1xcc10rL1xudmFyIG11bHRpU3BhY2VSZWdleCA9IC9bXFxuXFxzXSsvZ1xuXG52YXIgVEVYVF9UQUdTID0gW1xuICAnYScsICdhYmJyJywgJ2InLCAnYmRpJywgJ2JkbycsICdicicsICdjaXRlJywgJ2RhdGEnLCAnZGZuJywgJ2VtJywgJ2knLFxuICAna2JkJywgJ21hcmsnLCAncScsICdycCcsICdydCcsICdydGMnLCAncnVieScsICdzJywgJ2FtcCcsICdzbWFsbCcsICdzcGFuJyxcbiAgJ3N0cm9uZycsICdzdWInLCAnc3VwJywgJ3RpbWUnLCAndScsICd2YXInLCAnd2JyJ1xuXVxuXG52YXIgVkVSQkFUSU1fVEFHUyA9IFtcbiAgJ2NvZGUnLCAncHJlJywgJ3RleHRhcmVhJ1xuXVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGFwcGVuZENoaWxkIChlbCwgY2hpbGRzKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShjaGlsZHMpKSByZXR1cm5cblxuICB2YXIgbm9kZU5hbWUgPSBlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIGhhZFRleHQgPSBmYWxzZVxuICB2YXIgdmFsdWUsIGxlYWRlclxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjaGlsZHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICB2YXIgbm9kZSA9IGNoaWxkc1tpXVxuICAgIGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSB7XG4gICAgICBhcHBlbmRDaGlsZChlbCwgbm9kZSlcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBub2RlID09PSAnbnVtYmVyJyB8fFxuICAgICAgdHlwZW9mIG5vZGUgPT09ICdib29sZWFuJyB8fFxuICAgICAgdHlwZW9mIG5vZGUgPT09ICdmdW5jdGlvbicgfHxcbiAgICAgIG5vZGUgaW5zdGFuY2VvZiBEYXRlIHx8XG4gICAgICBub2RlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICBub2RlID0gbm9kZS50b1N0cmluZygpXG4gICAgfVxuXG4gICAgdmFyIGxhc3RDaGlsZCA9IGVsLmNoaWxkTm9kZXNbZWwuY2hpbGROb2Rlcy5sZW5ndGggLSAxXVxuXG4gICAgLy8gSXRlcmF0ZSBvdmVyIHRleHQgbm9kZXNcbiAgICBpZiAodHlwZW9mIG5vZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBoYWRUZXh0ID0gdHJ1ZVxuXG4gICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhZCB0ZXh0LCBhcHBlbmQgdG8gdGhlIGV4aXN0aW5nIHRleHRcbiAgICAgIGlmIChsYXN0Q2hpbGQgJiYgbGFzdENoaWxkLm5vZGVOYW1lID09PSAnI3RleHQnKSB7XG4gICAgICAgIGxhc3RDaGlsZC5ub2RlVmFsdWUgKz0gbm9kZVxuXG4gICAgICAvLyBXZSBkaWRuJ3QgaGF2ZSBhIHRleHQgbm9kZSB5ZXQsIGNyZWF0ZSBvbmVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUgPSBlbC5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5vZGUpXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKG5vZGUpXG4gICAgICAgIGxhc3RDaGlsZCA9IG5vZGVcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCBvZiB0aGUgY2hpbGQgbm9kZXMsIG1ha2Ugc3VyZSB3ZSBjbG9zZSBpdCBvdXRcbiAgICAgIC8vIHJpZ2h0XG4gICAgICBpZiAoaSA9PT0gbGVuIC0gMSkge1xuICAgICAgICBoYWRUZXh0ID0gZmFsc2VcbiAgICAgICAgLy8gVHJpbSB0aGUgY2hpbGQgdGV4dCBub2RlcyBpZiB0aGUgY3VycmVudCBub2RlIGlzbid0IGFcbiAgICAgICAgLy8gbm9kZSB3aGVyZSB3aGl0ZXNwYWNlIG1hdHRlcnMuXG4gICAgICAgIGlmIChURVhUX1RBR1MuaW5kZXhPZihub2RlTmFtZSkgPT09IC0xICYmXG4gICAgICAgICAgVkVSQkFUSU1fVEFHUy5pbmRleE9mKG5vZGVOYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgICB2YWx1ZSA9IGxhc3RDaGlsZC5ub2RlVmFsdWVcbiAgICAgICAgICAgIC5yZXBsYWNlKGxlYWRpbmdOZXdsaW5lUmVnZXgsICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UodHJhaWxpbmdTcGFjZVJlZ2V4LCAnJylcbiAgICAgICAgICAgIC5yZXBsYWNlKHRyYWlsaW5nTmV3bGluZVJlZ2V4LCAnJylcbiAgICAgICAgICAgIC5yZXBsYWNlKG11bHRpU3BhY2VSZWdleCwgJyAnKVxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJycpIHtcbiAgICAgICAgICAgIGVsLnJlbW92ZUNoaWxkKGxhc3RDaGlsZClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGFzdENoaWxkLm5vZGVWYWx1ZSA9IHZhbHVlXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFZFUkJBVElNX1RBR1MuaW5kZXhPZihub2RlTmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgLy8gVGhlIHZlcnkgZmlyc3Qgbm9kZSBpbiB0aGUgbGlzdCBzaG91bGQgbm90IGhhdmUgbGVhZGluZ1xuICAgICAgICAgIC8vIHdoaXRlc3BhY2UuIFNpYmxpbmcgdGV4dCBub2RlcyBzaG91bGQgaGF2ZSB3aGl0ZXNwYWNlIGlmIHRoZXJlXG4gICAgICAgICAgLy8gd2FzIGFueS5cbiAgICAgICAgICBsZWFkZXIgPSBpID09PSAwID8gJycgOiAnICdcbiAgICAgICAgICB2YWx1ZSA9IGxhc3RDaGlsZC5ub2RlVmFsdWVcbiAgICAgICAgICAgIC5yZXBsYWNlKGxlYWRpbmdOZXdsaW5lUmVnZXgsIGxlYWRlcilcbiAgICAgICAgICAgIC5yZXBsYWNlKGxlYWRpbmdTcGFjZVJlZ2V4LCAnICcpXG4gICAgICAgICAgICAucmVwbGFjZSh0cmFpbGluZ1NwYWNlUmVnZXgsICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UodHJhaWxpbmdOZXdsaW5lUmVnZXgsICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UobXVsdGlTcGFjZVJlZ2V4LCAnICcpXG4gICAgICAgICAgbGFzdENoaWxkLm5vZGVWYWx1ZSA9IHZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIC8vIEl0ZXJhdGUgb3ZlciBET00gbm9kZXNcbiAgICB9IGVsc2UgaWYgKG5vZGUgJiYgbm9kZS5ub2RlVHlwZSkge1xuICAgICAgLy8gSWYgdGhlIGxhc3Qgbm9kZSB3YXMgYSB0ZXh0IG5vZGUsIG1ha2Ugc3VyZSBpdCBpcyBwcm9wZXJseSBjbG9zZWQgb3V0XG4gICAgICBpZiAoaGFkVGV4dCkge1xuICAgICAgICBoYWRUZXh0ID0gZmFsc2VcblxuICAgICAgICAvLyBUcmltIHRoZSBjaGlsZCB0ZXh0IG5vZGVzIGlmIHRoZSBjdXJyZW50IG5vZGUgaXNuJ3QgYVxuICAgICAgICAvLyB0ZXh0IG5vZGUgb3IgYSBjb2RlIG5vZGVcbiAgICAgICAgaWYgKFRFWFRfVEFHUy5pbmRleE9mKG5vZGVOYW1lKSA9PT0gLTEgJiZcbiAgICAgICAgICBWRVJCQVRJTV9UQUdTLmluZGV4T2Yobm9kZU5hbWUpID09PSAtMSkge1xuICAgICAgICAgIHZhbHVlID0gbGFzdENoaWxkLm5vZGVWYWx1ZVxuICAgICAgICAgICAgLnJlcGxhY2UobGVhZGluZ05ld2xpbmVSZWdleCwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSh0cmFpbGluZ05ld2xpbmVSZWdleCwgJyAnKVxuICAgICAgICAgICAgLnJlcGxhY2UobXVsdGlTcGFjZVJlZ2V4LCAnICcpXG5cbiAgICAgICAgICAvLyBSZW1vdmUgZW1wdHkgdGV4dCBub2RlcywgYXBwZW5kIG90aGVyd2lzZVxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJycpIHtcbiAgICAgICAgICAgIGVsLnJlbW92ZUNoaWxkKGxhc3RDaGlsZClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGFzdENoaWxkLm5vZGVWYWx1ZSA9IHZhbHVlXG4gICAgICAgICAgfVxuICAgICAgICAvLyBUcmltIHRoZSBjaGlsZCBub2RlcyBidXQgcHJlc2VydmUgdGhlIGFwcHJvcHJpYXRlIHdoaXRlc3BhY2VcbiAgICAgICAgfSBlbHNlIGlmIChWRVJCQVRJTV9UQUdTLmluZGV4T2Yobm9kZU5hbWUpID09PSAtMSkge1xuICAgICAgICAgIHZhbHVlID0gbGFzdENoaWxkLm5vZGVWYWx1ZVxuICAgICAgICAgICAgLnJlcGxhY2UobGVhZGluZ1NwYWNlUmVnZXgsICcgJylcbiAgICAgICAgICAgIC5yZXBsYWNlKGxlYWRpbmdOZXdsaW5lUmVnZXgsICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UodHJhaWxpbmdOZXdsaW5lUmVnZXgsICcgJylcbiAgICAgICAgICAgIC5yZXBsYWNlKG11bHRpU3BhY2VSZWdleCwgJyAnKVxuICAgICAgICAgIGxhc3RDaGlsZC5ub2RlVmFsdWUgPSB2YWx1ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFN0b3JlIHRoZSBsYXN0IG5vZGVuYW1lXG4gICAgICB2YXIgX25vZGVOYW1lID0gbm9kZS5ub2RlTmFtZVxuICAgICAgaWYgKF9ub2RlTmFtZSkgbm9kZU5hbWUgPSBfbm9kZU5hbWUudG9Mb3dlckNhc2UoKVxuXG4gICAgICAvLyBBcHBlbmQgdGhlIG5vZGUgdG8gdGhlIERPTVxuICAgICAgZWwuYXBwZW5kQ2hpbGQobm9kZSlcbiAgICB9XG4gIH1cbn1cbiIsInZhciBhc3NlcnQgPSByZXF1aXJlKCduYW5vYXNzZXJ0JylcbnZhciBtb3JwaCA9IHJlcXVpcmUoJy4vbGliL21vcnBoJylcblxudmFyIFRFWFRfTk9ERSA9IDNcbi8vIHZhciBERUJVRyA9IGZhbHNlXG5cbm1vZHVsZS5leHBvcnRzID0gbmFub21vcnBoXG5cbi8vIE1vcnBoIG9uZSB0cmVlIGludG8gYW5vdGhlciB0cmVlXG4vL1xuLy8gbm8gcGFyZW50XG4vLyAgIC0+IHNhbWU6IGRpZmYgYW5kIHdhbGsgY2hpbGRyZW5cbi8vICAgLT4gbm90IHNhbWU6IHJlcGxhY2UgYW5kIHJldHVyblxuLy8gb2xkIG5vZGUgZG9lc24ndCBleGlzdFxuLy8gICAtPiBpbnNlcnQgbmV3IG5vZGVcbi8vIG5ldyBub2RlIGRvZXNuJ3QgZXhpc3Rcbi8vICAgLT4gZGVsZXRlIG9sZCBub2RlXG4vLyBub2RlcyBhcmUgbm90IHRoZSBzYW1lXG4vLyAgIC0+IGRpZmYgbm9kZXMgYW5kIGFwcGx5IHBhdGNoIHRvIG9sZCBub2RlXG4vLyBub2RlcyBhcmUgdGhlIHNhbWVcbi8vICAgLT4gd2FsayBhbGwgY2hpbGQgbm9kZXMgYW5kIGFwcGVuZCB0byBvbGQgbm9kZVxuZnVuY3Rpb24gbmFub21vcnBoIChvbGRUcmVlLCBuZXdUcmVlLCBvcHRpb25zKSB7XG4gIC8vIGlmIChERUJVRykge1xuICAvLyAgIGNvbnNvbGUubG9nKFxuICAvLyAgICduYW5vbW9ycGhcXG5vbGRcXG4gICVzXFxubmV3XFxuICAlcycsXG4gIC8vICAgb2xkVHJlZSAmJiBvbGRUcmVlLm91dGVySFRNTCxcbiAgLy8gICBuZXdUcmVlICYmIG5ld1RyZWUub3V0ZXJIVE1MXG4gIC8vIClcbiAgLy8gfVxuICBhc3NlcnQuZXF1YWwodHlwZW9mIG9sZFRyZWUsICdvYmplY3QnLCAnbmFub21vcnBoOiBvbGRUcmVlIHNob3VsZCBiZSBhbiBvYmplY3QnKVxuICBhc3NlcnQuZXF1YWwodHlwZW9mIG5ld1RyZWUsICdvYmplY3QnLCAnbmFub21vcnBoOiBuZXdUcmVlIHNob3VsZCBiZSBhbiBvYmplY3QnKVxuXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuY2hpbGRyZW5Pbmx5KSB7XG4gICAgdXBkYXRlQ2hpbGRyZW4obmV3VHJlZSwgb2xkVHJlZSlcbiAgICByZXR1cm4gb2xkVHJlZVxuICB9XG5cbiAgYXNzZXJ0Lm5vdEVxdWFsKFxuICAgIG5ld1RyZWUubm9kZVR5cGUsXG4gICAgMTEsXG4gICAgJ25hbm9tb3JwaDogbmV3VHJlZSBzaG91bGQgaGF2ZSBvbmUgcm9vdCBub2RlICh3aGljaCBpcyBub3QgYSBEb2N1bWVudEZyYWdtZW50KSdcbiAgKVxuXG4gIHJldHVybiB3YWxrKG5ld1RyZWUsIG9sZFRyZWUpXG59XG5cbi8vIFdhbGsgYW5kIG1vcnBoIGEgZG9tIHRyZWVcbmZ1bmN0aW9uIHdhbGsgKG5ld05vZGUsIG9sZE5vZGUpIHtcbiAgLy8gaWYgKERFQlVHKSB7XG4gIC8vICAgY29uc29sZS5sb2coXG4gIC8vICAgJ3dhbGtcXG5vbGRcXG4gICVzXFxubmV3XFxuICAlcycsXG4gIC8vICAgb2xkTm9kZSAmJiBvbGROb2RlLm91dGVySFRNTCxcbiAgLy8gICBuZXdOb2RlICYmIG5ld05vZGUub3V0ZXJIVE1MXG4gIC8vIClcbiAgLy8gfVxuICBpZiAoIW9sZE5vZGUpIHtcbiAgICByZXR1cm4gbmV3Tm9kZVxuICB9IGVsc2UgaWYgKCFuZXdOb2RlKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfSBlbHNlIGlmIChuZXdOb2RlLmlzU2FtZU5vZGUgJiYgbmV3Tm9kZS5pc1NhbWVOb2RlKG9sZE5vZGUpKSB7XG4gICAgcmV0dXJuIG9sZE5vZGVcbiAgfSBlbHNlIGlmIChuZXdOb2RlLnRhZ05hbWUgIT09IG9sZE5vZGUudGFnTmFtZSB8fCBnZXRDb21wb25lbnRJZChuZXdOb2RlKSAhPT0gZ2V0Q29tcG9uZW50SWQob2xkTm9kZSkpIHtcbiAgICByZXR1cm4gbmV3Tm9kZVxuICB9IGVsc2Uge1xuICAgIG1vcnBoKG5ld05vZGUsIG9sZE5vZGUpXG4gICAgdXBkYXRlQ2hpbGRyZW4obmV3Tm9kZSwgb2xkTm9kZSlcbiAgICByZXR1cm4gb2xkTm9kZVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldENvbXBvbmVudElkIChub2RlKSB7XG4gIHJldHVybiBub2RlLmRhdGFzZXQgPyBub2RlLmRhdGFzZXQubmFub21vcnBoQ29tcG9uZW50SWQgOiB1bmRlZmluZWRcbn1cblxuLy8gVXBkYXRlIHRoZSBjaGlsZHJlbiBvZiBlbGVtZW50c1xuLy8gKG9iaiwgb2JqKSAtPiBudWxsXG5mdW5jdGlvbiB1cGRhdGVDaGlsZHJlbiAobmV3Tm9kZSwgb2xkTm9kZSkge1xuICAvLyBpZiAoREVCVUcpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcbiAgLy8gICAndXBkYXRlQ2hpbGRyZW5cXG5vbGRcXG4gICVzXFxubmV3XFxuICAlcycsXG4gIC8vICAgb2xkTm9kZSAmJiBvbGROb2RlLm91dGVySFRNTCxcbiAgLy8gICBuZXdOb2RlICYmIG5ld05vZGUub3V0ZXJIVE1MXG4gIC8vIClcbiAgLy8gfVxuICB2YXIgb2xkQ2hpbGQsIG5ld0NoaWxkLCBtb3JwaGVkLCBvbGRNYXRjaFxuXG4gIC8vIFRoZSBvZmZzZXQgaXMgb25seSBldmVyIGluY3JlYXNlZCwgYW5kIHVzZWQgZm9yIFtpIC0gb2Zmc2V0XSBpbiB0aGUgbG9vcFxuICB2YXIgb2Zmc2V0ID0gMFxuXG4gIGZvciAodmFyIGkgPSAwOyA7IGkrKykge1xuICAgIG9sZENoaWxkID0gb2xkTm9kZS5jaGlsZE5vZGVzW2ldXG4gICAgbmV3Q2hpbGQgPSBuZXdOb2RlLmNoaWxkTm9kZXNbaSAtIG9mZnNldF1cbiAgICAvLyBpZiAoREVCVUcpIHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKFxuICAgIC8vICAgJz09PVxcbi0gb2xkXFxuICAlc1xcbi0gbmV3XFxuICAlcycsXG4gICAgLy8gICBvbGRDaGlsZCAmJiBvbGRDaGlsZC5vdXRlckhUTUwsXG4gICAgLy8gICBuZXdDaGlsZCAmJiBuZXdDaGlsZC5vdXRlckhUTUxcbiAgICAvLyApXG4gICAgLy8gfVxuICAgIC8vIEJvdGggbm9kZXMgYXJlIGVtcHR5LCBkbyBub3RoaW5nXG4gICAgaWYgKCFvbGRDaGlsZCAmJiAhbmV3Q2hpbGQpIHtcbiAgICAgIGJyZWFrXG5cbiAgICAvLyBUaGVyZSBpcyBubyBuZXcgY2hpbGQsIHJlbW92ZSBvbGRcbiAgICB9IGVsc2UgaWYgKCFuZXdDaGlsZCkge1xuICAgICAgb2xkTm9kZS5yZW1vdmVDaGlsZChvbGRDaGlsZClcbiAgICAgIGktLVxuXG4gICAgLy8gVGhlcmUgaXMgbm8gb2xkIGNoaWxkLCBhZGQgbmV3XG4gICAgfSBlbHNlIGlmICghb2xkQ2hpbGQpIHtcbiAgICAgIG9sZE5vZGUuYXBwZW5kQ2hpbGQobmV3Q2hpbGQpXG4gICAgICBvZmZzZXQrK1xuXG4gICAgLy8gQm90aCBub2RlcyBhcmUgdGhlIHNhbWUsIG1vcnBoXG4gICAgfSBlbHNlIGlmIChzYW1lKG5ld0NoaWxkLCBvbGRDaGlsZCkpIHtcbiAgICAgIG1vcnBoZWQgPSB3YWxrKG5ld0NoaWxkLCBvbGRDaGlsZClcbiAgICAgIGlmIChtb3JwaGVkICE9PSBvbGRDaGlsZCkge1xuICAgICAgICBvbGROb2RlLnJlcGxhY2VDaGlsZChtb3JwaGVkLCBvbGRDaGlsZClcbiAgICAgICAgb2Zmc2V0KytcbiAgICAgIH1cblxuICAgIC8vIEJvdGggbm9kZXMgZG8gbm90IHNoYXJlIGFuIElEIG9yIGEgcGxhY2Vob2xkZXIsIHRyeSByZW9yZGVyXG4gICAgfSBlbHNlIHtcbiAgICAgIG9sZE1hdGNoID0gbnVsbFxuXG4gICAgICAvLyBUcnkgYW5kIGZpbmQgYSBzaW1pbGFyIG5vZGUgc29tZXdoZXJlIGluIHRoZSB0cmVlXG4gICAgICBmb3IgKHZhciBqID0gaTsgaiA8IG9sZE5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoc2FtZShvbGROb2RlLmNoaWxkTm9kZXNbal0sIG5ld0NoaWxkKSkge1xuICAgICAgICAgIG9sZE1hdGNoID0gb2xkTm9kZS5jaGlsZE5vZGVzW2pdXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGVyZSB3YXMgYSBub2RlIHdpdGggdGhlIHNhbWUgSUQgb3IgcGxhY2Vob2xkZXIgaW4gdGhlIG9sZCBsaXN0XG4gICAgICBpZiAob2xkTWF0Y2gpIHtcbiAgICAgICAgbW9ycGhlZCA9IHdhbGsobmV3Q2hpbGQsIG9sZE1hdGNoKVxuICAgICAgICBpZiAobW9ycGhlZCAhPT0gb2xkTWF0Y2gpIG9mZnNldCsrXG4gICAgICAgIG9sZE5vZGUuaW5zZXJ0QmVmb3JlKG1vcnBoZWQsIG9sZENoaWxkKVxuXG4gICAgICAvLyBJdCdzIHNhZmUgdG8gbW9ycGggdHdvIG5vZGVzIGluLXBsYWNlIGlmIG5laXRoZXIgaGFzIGFuIElEXG4gICAgICB9IGVsc2UgaWYgKCFuZXdDaGlsZC5pZCAmJiAhb2xkQ2hpbGQuaWQpIHtcbiAgICAgICAgbW9ycGhlZCA9IHdhbGsobmV3Q2hpbGQsIG9sZENoaWxkKVxuICAgICAgICBpZiAobW9ycGhlZCAhPT0gb2xkQ2hpbGQpIHtcbiAgICAgICAgICBvbGROb2RlLnJlcGxhY2VDaGlsZChtb3JwaGVkLCBvbGRDaGlsZClcbiAgICAgICAgICBvZmZzZXQrK1xuICAgICAgICB9XG5cbiAgICAgIC8vIEluc2VydCB0aGUgbm9kZSBhdCB0aGUgaW5kZXggaWYgd2UgY291bGRuJ3QgbW9ycGggb3IgZmluZCBhIG1hdGNoaW5nIG5vZGVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9sZE5vZGUuaW5zZXJ0QmVmb3JlKG5ld0NoaWxkLCBvbGRDaGlsZClcbiAgICAgICAgb2Zmc2V0KytcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2FtZSAoYSwgYikge1xuICBpZiAoYS5pZCkgcmV0dXJuIGEuaWQgPT09IGIuaWRcbiAgaWYgKGEuaXNTYW1lTm9kZSkgcmV0dXJuIGEuaXNTYW1lTm9kZShiKVxuICBpZiAoYS50YWdOYW1lICE9PSBiLnRhZ05hbWUpIHJldHVybiBmYWxzZVxuICBpZiAoYS50eXBlID09PSBURVhUX05PREUpIHJldHVybiBhLm5vZGVWYWx1ZSA9PT0gYi5ub2RlVmFsdWVcbiAgcmV0dXJuIGZhbHNlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgLy8gYXR0cmlidXRlIGV2ZW50cyAoY2FuIGJlIHNldCB3aXRoIGF0dHJpYnV0ZXMpXG4gICdvbmNsaWNrJyxcbiAgJ29uZGJsY2xpY2snLFxuICAnb25tb3VzZWRvd24nLFxuICAnb25tb3VzZXVwJyxcbiAgJ29ubW91c2VvdmVyJyxcbiAgJ29ubW91c2Vtb3ZlJyxcbiAgJ29ubW91c2VvdXQnLFxuICAnb25tb3VzZWVudGVyJyxcbiAgJ29ubW91c2VsZWF2ZScsXG4gICdvbnRvdWNoY2FuY2VsJyxcbiAgJ29udG91Y2hlbmQnLFxuICAnb250b3VjaG1vdmUnLFxuICAnb250b3VjaHN0YXJ0JyxcbiAgJ29uZHJhZ3N0YXJ0JyxcbiAgJ29uZHJhZycsXG4gICdvbmRyYWdlbnRlcicsXG4gICdvbmRyYWdsZWF2ZScsXG4gICdvbmRyYWdvdmVyJyxcbiAgJ29uZHJvcCcsXG4gICdvbmRyYWdlbmQnLFxuICAnb25rZXlkb3duJyxcbiAgJ29ua2V5cHJlc3MnLFxuICAnb25rZXl1cCcsXG4gICdvbnVubG9hZCcsXG4gICdvbmFib3J0JyxcbiAgJ29uZXJyb3InLFxuICAnb25yZXNpemUnLFxuICAnb25zY3JvbGwnLFxuICAnb25zZWxlY3QnLFxuICAnb25jaGFuZ2UnLFxuICAnb25zdWJtaXQnLFxuICAnb25yZXNldCcsXG4gICdvbmZvY3VzJyxcbiAgJ29uYmx1cicsXG4gICdvbmlucHV0JyxcbiAgLy8gb3RoZXIgY29tbW9uIGV2ZW50c1xuICAnb25jb250ZXh0bWVudScsXG4gICdvbmZvY3VzaW4nLFxuICAnb25mb2N1c291dCdcbl1cbiIsInZhciBldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpXG52YXIgZXZlbnRzTGVuZ3RoID0gZXZlbnRzLmxlbmd0aFxuXG52YXIgRUxFTUVOVF9OT0RFID0gMVxudmFyIFRFWFRfTk9ERSA9IDNcbnZhciBDT01NRU5UX05PREUgPSA4XG5cbm1vZHVsZS5leHBvcnRzID0gbW9ycGhcblxuLy8gZGlmZiBlbGVtZW50cyBhbmQgYXBwbHkgdGhlIHJlc3VsdGluZyBwYXRjaCB0byB0aGUgb2xkIG5vZGVcbi8vIChvYmosIG9iaikgLT4gbnVsbFxuZnVuY3Rpb24gbW9ycGggKG5ld05vZGUsIG9sZE5vZGUpIHtcbiAgdmFyIG5vZGVUeXBlID0gbmV3Tm9kZS5ub2RlVHlwZVxuICB2YXIgbm9kZU5hbWUgPSBuZXdOb2RlLm5vZGVOYW1lXG5cbiAgaWYgKG5vZGVUeXBlID09PSBFTEVNRU5UX05PREUpIHtcbiAgICBjb3B5QXR0cnMobmV3Tm9kZSwgb2xkTm9kZSlcbiAgfVxuXG4gIGlmIChub2RlVHlwZSA9PT0gVEVYVF9OT0RFIHx8IG5vZGVUeXBlID09PSBDT01NRU5UX05PREUpIHtcbiAgICBpZiAob2xkTm9kZS5ub2RlVmFsdWUgIT09IG5ld05vZGUubm9kZVZhbHVlKSB7XG4gICAgICBvbGROb2RlLm5vZGVWYWx1ZSA9IG5ld05vZGUubm9kZVZhbHVlXG4gICAgfVxuICB9XG5cbiAgLy8gU29tZSBET00gbm9kZXMgYXJlIHdlaXJkXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wYXRyaWNrLXN0ZWVsZS1pZGVtL21vcnBoZG9tL2Jsb2IvbWFzdGVyL3NyYy9zcGVjaWFsRWxIYW5kbGVycy5qc1xuICBpZiAobm9kZU5hbWUgPT09ICdJTlBVVCcpIHVwZGF0ZUlucHV0KG5ld05vZGUsIG9sZE5vZGUpXG4gIGVsc2UgaWYgKG5vZGVOYW1lID09PSAnT1BUSU9OJykgdXBkYXRlT3B0aW9uKG5ld05vZGUsIG9sZE5vZGUpXG4gIGVsc2UgaWYgKG5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSB1cGRhdGVUZXh0YXJlYShuZXdOb2RlLCBvbGROb2RlKVxuXG4gIGNvcHlFdmVudHMobmV3Tm9kZSwgb2xkTm9kZSlcbn1cblxuZnVuY3Rpb24gY29weUF0dHJzIChuZXdOb2RlLCBvbGROb2RlKSB7XG4gIHZhciBvbGRBdHRycyA9IG9sZE5vZGUuYXR0cmlidXRlc1xuICB2YXIgbmV3QXR0cnMgPSBuZXdOb2RlLmF0dHJpYnV0ZXNcbiAgdmFyIGF0dHJOYW1lc3BhY2VVUkkgPSBudWxsXG4gIHZhciBhdHRyVmFsdWUgPSBudWxsXG4gIHZhciBmcm9tVmFsdWUgPSBudWxsXG4gIHZhciBhdHRyTmFtZSA9IG51bGxcbiAgdmFyIGF0dHIgPSBudWxsXG5cbiAgZm9yICh2YXIgaSA9IG5ld0F0dHJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgYXR0ciA9IG5ld0F0dHJzW2ldXG4gICAgYXR0ck5hbWUgPSBhdHRyLm5hbWVcbiAgICBhdHRyTmFtZXNwYWNlVVJJID0gYXR0ci5uYW1lc3BhY2VVUklcbiAgICBhdHRyVmFsdWUgPSBhdHRyLnZhbHVlXG4gICAgaWYgKGF0dHJOYW1lc3BhY2VVUkkpIHtcbiAgICAgIGF0dHJOYW1lID0gYXR0ci5sb2NhbE5hbWUgfHwgYXR0ck5hbWVcbiAgICAgIGZyb21WYWx1ZSA9IG9sZE5vZGUuZ2V0QXR0cmlidXRlTlMoYXR0ck5hbWVzcGFjZVVSSSwgYXR0ck5hbWUpXG4gICAgICBpZiAoZnJvbVZhbHVlICE9PSBhdHRyVmFsdWUpIHtcbiAgICAgICAgb2xkTm9kZS5zZXRBdHRyaWJ1dGVOUyhhdHRyTmFtZXNwYWNlVVJJLCBhdHRyTmFtZSwgYXR0clZhbHVlKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIW9sZE5vZGUuaGFzQXR0cmlidXRlKGF0dHJOYW1lKSkge1xuICAgICAgICBvbGROb2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0clZhbHVlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnJvbVZhbHVlID0gb2xkTm9kZS5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUpXG4gICAgICAgIGlmIChmcm9tVmFsdWUgIT09IGF0dHJWYWx1ZSkge1xuICAgICAgICAgIC8vIGFwcGFyZW50bHkgdmFsdWVzIGFyZSBhbHdheXMgY2FzdCB0byBzdHJpbmdzLCBhaCB3ZWxsXG4gICAgICAgICAgaWYgKGF0dHJWYWx1ZSA9PT0gJ251bGwnIHx8IGF0dHJWYWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG9sZE5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvbGROb2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0clZhbHVlKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFJlbW92ZSBhbnkgZXh0cmEgYXR0cmlidXRlcyBmb3VuZCBvbiB0aGUgb3JpZ2luYWwgRE9NIGVsZW1lbnQgdGhhdFxuICAvLyB3ZXJlbid0IGZvdW5kIG9uIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgZm9yICh2YXIgaiA9IG9sZEF0dHJzLmxlbmd0aCAtIDE7IGogPj0gMDsgLS1qKSB7XG4gICAgYXR0ciA9IG9sZEF0dHJzW2pdXG4gICAgaWYgKGF0dHIuc3BlY2lmaWVkICE9PSBmYWxzZSkge1xuICAgICAgYXR0ck5hbWUgPSBhdHRyLm5hbWVcbiAgICAgIGF0dHJOYW1lc3BhY2VVUkkgPSBhdHRyLm5hbWVzcGFjZVVSSVxuXG4gICAgICBpZiAoYXR0ck5hbWVzcGFjZVVSSSkge1xuICAgICAgICBhdHRyTmFtZSA9IGF0dHIubG9jYWxOYW1lIHx8IGF0dHJOYW1lXG4gICAgICAgIGlmICghbmV3Tm9kZS5oYXNBdHRyaWJ1dGVOUyhhdHRyTmFtZXNwYWNlVVJJLCBhdHRyTmFtZSkpIHtcbiAgICAgICAgICBvbGROb2RlLnJlbW92ZUF0dHJpYnV0ZU5TKGF0dHJOYW1lc3BhY2VVUkksIGF0dHJOYW1lKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIW5ld05vZGUuaGFzQXR0cmlidXRlTlMobnVsbCwgYXR0ck5hbWUpKSB7XG4gICAgICAgICAgb2xkTm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY29weUV2ZW50cyAobmV3Tm9kZSwgb2xkTm9kZSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50c0xlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGV2ID0gZXZlbnRzW2ldXG4gICAgaWYgKG5ld05vZGVbZXZdKSB7ICAgICAgICAgICAvLyBpZiBuZXcgZWxlbWVudCBoYXMgYSB3aGl0ZWxpc3RlZCBhdHRyaWJ1dGVcbiAgICAgIG9sZE5vZGVbZXZdID0gbmV3Tm9kZVtldl0gIC8vIHVwZGF0ZSBleGlzdGluZyBlbGVtZW50XG4gICAgfSBlbHNlIGlmIChvbGROb2RlW2V2XSkgeyAgICAvLyBpZiBleGlzdGluZyBlbGVtZW50IGhhcyBpdCBhbmQgbmV3IG9uZSBkb2VzbnRcbiAgICAgIG9sZE5vZGVbZXZdID0gdW5kZWZpbmVkICAgIC8vIHJlbW92ZSBpdCBmcm9tIGV4aXN0aW5nIGVsZW1lbnRcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlT3B0aW9uIChuZXdOb2RlLCBvbGROb2RlKSB7XG4gIHVwZGF0ZUF0dHJpYnV0ZShuZXdOb2RlLCBvbGROb2RlLCAnc2VsZWN0ZWQnKVxufVxuXG4vLyBUaGUgXCJ2YWx1ZVwiIGF0dHJpYnV0ZSBpcyBzcGVjaWFsIGZvciB0aGUgPGlucHV0PiBlbGVtZW50IHNpbmNlIGl0IHNldHMgdGhlXG4vLyBpbml0aWFsIHZhbHVlLiBDaGFuZ2luZyB0aGUgXCJ2YWx1ZVwiIGF0dHJpYnV0ZSB3aXRob3V0IGNoYW5naW5nIHRoZSBcInZhbHVlXCJcbi8vIHByb3BlcnR5IHdpbGwgaGF2ZSBubyBlZmZlY3Qgc2luY2UgaXQgaXMgb25seSB1c2VkIHRvIHRoZSBzZXQgdGhlIGluaXRpYWxcbi8vIHZhbHVlLiBTaW1pbGFyIGZvciB0aGUgXCJjaGVja2VkXCIgYXR0cmlidXRlLCBhbmQgXCJkaXNhYmxlZFwiLlxuZnVuY3Rpb24gdXBkYXRlSW5wdXQgKG5ld05vZGUsIG9sZE5vZGUpIHtcbiAgdmFyIG5ld1ZhbHVlID0gbmV3Tm9kZS52YWx1ZVxuICB2YXIgb2xkVmFsdWUgPSBvbGROb2RlLnZhbHVlXG5cbiAgdXBkYXRlQXR0cmlidXRlKG5ld05vZGUsIG9sZE5vZGUsICdjaGVja2VkJylcbiAgdXBkYXRlQXR0cmlidXRlKG5ld05vZGUsIG9sZE5vZGUsICdkaXNhYmxlZCcpXG5cbiAgaWYgKG5ld1ZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgIG9sZE5vZGUuc2V0QXR0cmlidXRlKCd2YWx1ZScsIG5ld1ZhbHVlKVxuICAgIG9sZE5vZGUudmFsdWUgPSBuZXdWYWx1ZVxuICB9XG5cbiAgaWYgKG5ld1ZhbHVlID09PSAnbnVsbCcpIHtcbiAgICBvbGROb2RlLnZhbHVlID0gJydcbiAgICBvbGROb2RlLnJlbW92ZUF0dHJpYnV0ZSgndmFsdWUnKVxuICB9XG5cbiAgaWYgKCFuZXdOb2RlLmhhc0F0dHJpYnV0ZU5TKG51bGwsICd2YWx1ZScpKSB7XG4gICAgb2xkTm9kZS5yZW1vdmVBdHRyaWJ1dGUoJ3ZhbHVlJylcbiAgfSBlbHNlIGlmIChvbGROb2RlLnR5cGUgPT09ICdyYW5nZScpIHtcbiAgICAvLyB0aGlzIGlzIHNvIGVsZW1lbnRzIGxpa2Ugc2xpZGVyIG1vdmUgdGhlaXIgVUkgdGhpbmd5XG4gICAgb2xkTm9kZS52YWx1ZSA9IG5ld1ZhbHVlXG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlVGV4dGFyZWEgKG5ld05vZGUsIG9sZE5vZGUpIHtcbiAgdmFyIG5ld1ZhbHVlID0gbmV3Tm9kZS52YWx1ZVxuICBpZiAobmV3VmFsdWUgIT09IG9sZE5vZGUudmFsdWUpIHtcbiAgICBvbGROb2RlLnZhbHVlID0gbmV3VmFsdWVcbiAgfVxuXG4gIGlmIChvbGROb2RlLmZpcnN0Q2hpbGQgJiYgb2xkTm9kZS5maXJzdENoaWxkLm5vZGVWYWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICAvLyBOZWVkZWQgZm9yIElFLiBBcHBhcmVudGx5IElFIHNldHMgdGhlIHBsYWNlaG9sZGVyIGFzIHRoZVxuICAgIC8vIG5vZGUgdmFsdWUgYW5kIHZpc2UgdmVyc2EuIFRoaXMgaWdub3JlcyBhbiBlbXB0eSB1cGRhdGUuXG4gICAgaWYgKG5ld1ZhbHVlID09PSAnJyAmJiBvbGROb2RlLmZpcnN0Q2hpbGQubm9kZVZhbHVlID09PSBvbGROb2RlLnBsYWNlaG9sZGVyKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBvbGROb2RlLmZpcnN0Q2hpbGQubm9kZVZhbHVlID0gbmV3VmFsdWVcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVBdHRyaWJ1dGUgKG5ld05vZGUsIG9sZE5vZGUsIG5hbWUpIHtcbiAgaWYgKG5ld05vZGVbbmFtZV0gIT09IG9sZE5vZGVbbmFtZV0pIHtcbiAgICBvbGROb2RlW25hbWVdID0gbmV3Tm9kZVtuYW1lXVxuICAgIGlmIChuZXdOb2RlW25hbWVdKSB7XG4gICAgICBvbGROb2RlLnNldEF0dHJpYnV0ZShuYW1lLCAnJylcbiAgICB9IGVsc2Uge1xuICAgICAgb2xkTm9kZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSlcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xyXG5cclxudmFyIGR1cmF0aW9uID0gLygtP1xcZCpcXC4/XFxkKyg/OmVbLStdP1xcZCspPylcXHMqKFthLXrOvF0qKS9pZ1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZVxyXG5cclxuLyoqXHJcbiAqIGNvbnZlcnNpb24gcmF0aW9zXHJcbiAqL1xyXG5cclxucGFyc2UubmFub3NlY29uZCA9XHJcbnBhcnNlLm5zID0gMSAvIDFlNlxyXG5cclxucGFyc2VbJ868cyddID1cclxucGFyc2UubWljcm9zZWNvbmQgPSAxIC8gMWUzXHJcblxyXG5wYXJzZS5taWxsaXNlY29uZCA9XHJcbnBhcnNlLm1zID0gMVxyXG5cclxucGFyc2Uuc2Vjb25kID1cclxucGFyc2Uuc2VjID1cclxucGFyc2UucyA9IHBhcnNlLm1zICogMTAwMFxyXG5cclxucGFyc2UubWludXRlID1cclxucGFyc2UubWluID1cclxucGFyc2UubSA9IHBhcnNlLnMgKiA2MFxyXG5cclxucGFyc2UuaG91ciA9XHJcbnBhcnNlLmhyID1cclxucGFyc2UuaCA9IHBhcnNlLm0gKiA2MFxyXG5cclxucGFyc2UuZGF5ID1cclxucGFyc2UuZCA9IHBhcnNlLmggKiAyNFxyXG5cclxucGFyc2Uud2VlayA9XHJcbnBhcnNlLndrID1cclxucGFyc2UudyA9IHBhcnNlLmQgKiA3XHJcblxyXG5wYXJzZS5iID1cclxucGFyc2UubW9udGggPSBwYXJzZS5kICogKDM2NS4yNSAvIDEyKVxyXG5cclxucGFyc2UueWVhciA9XHJcbnBhcnNlLnlyID1cclxucGFyc2UueSA9IHBhcnNlLmQgKiAzNjUuMjVcclxuXHJcbi8qKlxyXG4gKiBjb252ZXJ0IGBzdHJgIHRvIG1zXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIHBhcnNlKHN0cil7XHJcbiAgdmFyIHJlc3VsdCA9IDBcclxuICAvLyBpZ25vcmUgY29tbWFzXHJcbiAgc3RyID0gc3RyLnJlcGxhY2UoLyhcXGQpLChcXGQpL2csICckMSQyJylcclxuICBzdHIucmVwbGFjZShkdXJhdGlvbiwgZnVuY3Rpb24oXywgbiwgdW5pdHMpe1xyXG4gICAgdW5pdHMgPSBwYXJzZVt1bml0c11cclxuICAgICAgfHwgcGFyc2VbdW5pdHMudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9zJC8sICcnKV1cclxuICAgICAgfHwgMVxyXG4gICAgcmVzdWx0ICs9IHBhcnNlRmxvYXQobiwgMTApICogdW5pdHNcclxuICB9KVxyXG4gIHJldHVybiByZXN1bHRcclxufVxyXG4iXX0=
