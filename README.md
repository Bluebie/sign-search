## Sign Search ##

Sign Search is a little static website builder, written in NodeJS, which produces an efficient client side search engine that indexes Australian Sign Language resources. Because searches run client side, they are largely anonymous. The specific search terms entered are never sent to a server, though the rough topic searched for can be inferred by which resources are loaded.

One issue with learning a sign language, is they tend to have fewer signs than the written and spoken languages used in the same area. Because of this, it can be difficult for beginners to learn how to express themselves using a sign language, because a more traditional type of search engine will often not return any results, for many words queried.

Using word embedding, in this case, facebook's fasttext english database, we can index the english definitions of Auslan signs, and locate the sign in the english vector space, effectively mapping the Auslan corpus in a 300-dimension semantically meaningful space, where similar concepts exist in similar locations. Then, when users search for a word, their browser can load a tiny portion of the fasttext database, find the vector for their search term, and look through the Auslan signs finding nearby answers. Often, this can return results which are useful in figuring out how to express an idea, even when a specific sign for that exact idea may not be recorded, or might not even exist yet.

Another goal of the project is decentralisation, low operating cost, and easy scalability. Because the website is a static resource, rebuilt occasionally via a cron job, it's easy to mirror out via syncthing or another folder syncing tool, and have local redundant copies where needed if internet access is poor. It also decentralises in the sense that signs from many different locations can be included. Professionally produced resources like auslan.org.au are scraped and included, but youtube playlists are also included, so the Deaf and Auslan using community can record and include demonstrations of signs the professionally produced resources might miss. Auslan is a language that grows and changes quicker than most spoken languages, and it's evolution is done socially, through the negotiation of people choosing and accepting and reusing signs. It is, in a way, purely memetic, with no central authority on what is right and wrong. In that spirit, the resources we use to understand the language should also be decentralised, and allow many different groups to document and contribute their own local variations and new and emerging signs.

### Using this with a different language or search material ###

It should be easy to adapt the underlying technology. If your source material is documented in English, it's just a matter of using `/lib/search-library/writer.js` to build some new search indexes, and customizing the user interface to best present whatever data you're indexing. Check out the examples in `/tools/scrapers` to see how search indexs are built.

If you just need to grab the english vector library used on the live site, you can use Dat or Beaker browser to grab a copy of the deployed live site using Dat address <a href="dat://find.auslan.fyi/">dat://find.auslan.fyi/</a> - this also includes the live search indexes, which might be useful for research or building games like flash cards. Just be aware none of the search index has clear license terms, so be aware of potential copyright issues.

If you need to support a non-english language, you can use the `tools/build-indexed-vector-library.js` script to convert a text format vector database from https://fasttext.cc/ to the compressed sharded format used here. Then you should be able to build search libraries and adapt the interface to a new written language without much trouble.

### Mirroring the website ###

I haven't established any mirroring yet, but I am using syncthing to backup the website to my own local computers. If you're interested in mirroring sign-search, send me a message, and I can probably link you in to the syncthing folder. All you'll need to get it working is a web server that supports HTTP range requests, pointed at the folder.

### Where did you hard code "trump" to return "russian"? ###

I didn't. fasttext read web users talking about all sorts of topics, via the Common Crawl dataset, and at least for now, Russia is the most related Auslan sign to the english word "trump" in the dataset. It's entirely organic.

### Copyright ###

As of 2019, the main code of the project is released as Unlicense, meaning, you can pretty well do whatever you want with it. The favicon is from an emoji pack and isn't included in that license, and the web design and name belong to me (Phoenix Fox). Content that the search engine indexes from other websites obviously belongs to those source websites, and is not included in this repository and is not part of the Unlicense. Search Engines do not generally have appropriate legal licenses to reproduce the content they index, and that's true here too, in general. Be careful, be a good citizen, and support the projects you pull data from, so nobody ever wants to do you harm. That's how Google does it!

The word embedding provided by fasttext is derived from Common Crawl and Wikipedia. It has yet to be clearly determined how or if copyright applies to machine learning weights and derived outputs, where those networks were trained on presumably copyrighted online data. For now, it seems like we don't need to worry about it, but it something to keep an eye on.

Made with love,
by Phoenix Fox