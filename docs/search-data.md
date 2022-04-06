## Search Data format

sign-search is gradually moving towards decoupling spidering activity from search index building. If you're setting up a
sign-search instance in another language, it's strongly recommended you capture search data in to this format, as a simple
flat file in either YAML or JSON, and feed it to sign-search, instead of writing one of the internal spider plugins (deprecated)

A search-data spider plugin stub is provided which simply imports data provided in this format.

At the root, the file is an Object/Map/Dictionary, where keys are a unique identifier of the entry. This can be something like
an ID-Gloss, a database ID number, or any other string that you expect is unlikely to change when the underlying sign listing
maybe updated but still retains the same form.

Alternatively, an array of objects which contain an 'id' property that serves as the unique key, is also acceptable.

Values in this dictionary are Objects with at least:

 - title: string title to display in search result heading
 - words: an array of searchable words the search engine should actually key off
 - tags: an array of hashtags, without # prefix, which should be alphanumeric and may contain .\_- characters
 - body: string body text, to display under the link and hashtags list in search results. Newlines are rendered in the webapp, but it's otherwise plaintext
 - timestamp: integer unix epoch milliseconds (javascript style) when this entry was created
 - media: an array of MediaElements described below

You might also like to provide an optional 'nav' property, containing an array of `[label, url]` tuple arrays like:

```yaml
nav:
  - - Auslan Signbank
    - https://www.auslan.org.au
  - - Dictionary
    - https://www.auslan.org.au/dictionary/
  - - "#3152 Christmas1a"
    - https://www.auslan.org.au/dictionary/gloss/Christmas1a.html
```

Providing a nav property, controls the rendering of breadcrumb style links in the sign result entry

### MediaElements

MediaElement entries describe how sign-search can access a video or picture related to this entry, to insert in to the
video player carousel. These video clips should ideally be fairly short. The sign-search interface is built with an assumption
that most will be around 2-5 seconds and none will be over 5 minutes.

sign-search's Search Data plugin currently implements three convenient methods: fetch, youtube-dl, and ytdl-core

### using `fetch` mode with http/https:

```yaml
method: fetch
url: "https://example.com/video.mp4"
```

or for a local file with an absolute unix path:

```yaml
method: fetch
url: "file:///home/web/dataset/video.mp4"
```

or for a local file with a path relative to the `search-data.yaml` file, can use a partial URL relative to the search-data.yaml:

```yaml
method: fetch
url: "../videos/123.mkv"
```

It is also helpful to include other properties like lastModified or etag, otherwise sign-search will only pull the file again
when the URL changes. Videos should be cached indefinitely if the properties of the MediaElement don't change.

### using `youtube-dl` or `ytdl-core` mode:

This mode makes use of the popular python youtube-dl command line tool, which can download video from almost any video streaming
provider.

```yaml
method: "youtube-dl"
url: "https://www.youtube.com/watch?v=poQzD9jX2fk"
ext: "mp4"
```

With youtube-dl you may wish to pass in some arguments to the command line utility, add an 'args' property with an array of
arguments will do that.

ytdl-core sometimes does better for downloading youtube videos specifically. You can set that as the method to give it a go.

### Clipping

Sometimes you want to extract small sections of a longer clip, for example, videos that contain a series of signs. You can do
this by adding a `clipping` object to the MediaElement object:

```yaml
clipping: { start: 13.5, end: 15.8 }
```

The timestamps are in fractional seconds. If end is omitted, the clip will run until the natural end of the video.

sign-search is smart enough to download a video once, and encode several clips from it, if you specify the same link several
times. clipping is a special property and changing it's value does not invalidate existing cached copies of the video from
previous encodes. All other properties will invalidate cache when their value changes.

## Examples:

### a short extract of Auslan Signbank search-data:

```yaml
Switzerland1a:
  id: Switzerland1a
  title: Switzerland, Swiss
  words:
    - Switzerland
    - Swiss
  link: https://www.auslan.org.au/dictionary/gloss/Switzerland1a.html
  nav:
    - - Auslan Signbank
      - https://www.auslan.org.au
    - - Dictionary
      - https://www.auslan.org.au/dictionary/
    - - "#3662 Switzerland1a"
      - https://www.auslan.org.au/dictionary/gloss/Switzerland1a.html
  tags:
    - auslan-signbank
    - b92.directional
    - lexis.proper-name
    - phonology.onehand
    - semantic.city
  body: >-
    As a Noun:
     1. A country in central Western Europe, located in the Alps. English = Switzerland.
    As a Verb or Adjective:
     1. A person, product or service which relates to or comes from Switzerland. English = (be) Swiss.
  media:
    - method: fetch
      url: https://media.auslan.org.au/mp4video/53/53260_1.mp4
      available: true
      lastModified: Tue, 08 Dec 2020 07:12:21 GMT
      etag: '"5fcf2755-9e3fe"'
      contentType: video/mp4
      contentLength: 648190
  timestamp: 1607411541000
UFO:
  id: UFO
  title: UFO
  words:
    - UFO
  link: https://www.auslan.org.au/dictionary/gloss/UFO.html
  nav:
    - - Auslan Signbank
      - https://www.auslan.org.au
    - - Dictionary
      - https://www.auslan.org.au/dictionary/
    - - "#191 UFO"
      - https://www.auslan.org.au/dictionary/gloss/UFO.html
  tags:
    - auslan-signbank
    - everywhere
    - wa
    - nt
    - sa
    - qld
    - nsw
    - act
    - vic
    - tas
    - b92.directional
    - phonology.onehand
    - semantic.travel
  body: >-
    As a Noun:
     1. An object seen in the sky or landing on earth which cannot be identified and which some people believe to be a spaceship from another planet. English = UFO, unidentified flying object.
    As a Verb or Adjective:
     1. Of a UFO, to move in the sky.
     2. Of a flying object, to look like a UFO.
  media:
    - method: fetch
      url: https://media.auslan.org.au/mp4video/26/2670_1.mp4
      available: true
      lastModified: Tue, 08 Dec 2020 06:21:10 GMT
      etag: '"5fcf1b56-eb5f9"'
      contentType: video/mp4
      contentLength: 964089
  timestamp: 1607408470000
Waratah:
  id: Waratah
  title: Waratah
  words:
    - Waratah
  link: https://www.auslan.org.au/dictionary/gloss/Waratah.html
  nav:
    - - Auslan Signbank
      - https://www.auslan.org.au
    - - Dictionary
      - https://www.auslan.org.au/dictionary/
    - - "#1513 Waratah"
      - https://www.auslan.org.au/dictionary/gloss/Waratah.html
  tags:
    - auslan-signbank
    - everywhere
    - wa
    - nt
    - sa
    - qld
    - nsw
    - act
    - vic
    - tas
    - b92.directional
    - lexis.proper-name
    - phonology.onehand
    - semantic.education
  body: >-
    As a Noun:
     1. A Roman Catholic school for the deaf at Waratah in the Australian state of New South Wales, called the Rosary Convent School.
     2. A town near Newcastle, in New South Wales, called Waratah.
  media:
    - method: fetch
      url: https://media.auslan.org.au/mp4video/22/22370.mp4
      available: true
      lastModified: Tue, 08 Dec 2020 06:13:07 GMT
      etag: '"5fcf1973-e336d"'
      contentType: video/mp4
      contentLength: 930669
  timestamp: 1607407987000
```

### a short extract of Auslan Anywhere search-data:

```json
[
  {
    "id": "38",
    "title": "Can you drive a car?",
    "link": "https://www.auslananywhere.com.au/feed/38",
    "nav": [
      [
        "Auslan Anywhere",
        "https://www.auslananywhere.com.au/"
      ],
      [
        "Jason Alford",
        "https://www.auslananywhere.com.au/creators/alfordjason"
      ],
      [
        "Can you drive a car?",
        "https://www.auslananywhere.com.au/feed/38"
      ]
    ],
    "author": {
      "name": "Jason Alford",
      "link": "https://www.auslananywhere.com.au/creators/alfordjason"
    },
    "tags": [
      "auslan-anywhere",
      "wa",
      "alfordjason"
    ],
    "body": "Gloss: Car you drive can?\n",
    "media": [
      {
        "method": "youtube-dl",
        "url": "https://vimeo.com/452970845"
      }
    ],
    "timestamp": 1598767094000
  },
  {
    "id": "39",
    "title": "you are funny",
    "link": "https://www.auslananywhere.com.au/feed/39",
    "nav": [
      [
        "Auslan Anywhere",
        "https://www.auslananywhere.com.au/"
      ],
      [
        "Jason Alford",
        "https://www.auslananywhere.com.au/creators/alfordjason"
      ],
      [
        "you are funny",
        "https://www.auslananywhere.com.au/feed/39"
      ]
    ],
    "author": {
      "name": "Jason Alford",
      "link": "https://www.auslananywhere.com.au/creators/alfordjason"
    },
    "tags": [
      "auslan-anywhere",
      "wa",
      "alfordjason"
    ],
    "body": "Gloss: You funny\n",
    "media": [
      {
        "method": "youtube-dl",
        "url": "https://vimeo.com/452971133"
      }
    ],
    "timestamp": 1598767257000
  },
  {
    "id": "40",
    "title": "Anna is as tall as Irene",
    "link": "https://www.auslananywhere.com.au/feed/40",
    "nav": [
      [
        "Auslan Anywhere",
        "https://www.auslananywhere.com.au/"
      ],
      [
        "Jason Alford",
        "https://www.auslananywhere.com.au/creators/alfordjason"
      ],
      [
        "Anna is as tall as Irene",
        "https://www.auslananywhere.com.au/feed/40"
      ]
    ],
    "author": {
      "name": "Jason Alford",
      "link": "https://www.auslananywhere.com.au/creators/alfordjason"
    },
    "tags": [
      "auslan-anywhere",
      "wa",
      "alfordjason"
    ],
    "body": "Gloss: Anna tall same Irene (two hands)tall\n",
    "media": [
      {
        "method": "youtube-dl",
        "url": "https://vimeo.com/452971486"
      }
    ],
    "timestamp": 1598767436000
  },
  ...
]
```
