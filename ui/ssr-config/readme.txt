modules in this folder implement a getProps function, which must return an object,
or a promise resolving to an object, containing properties to pass to the page of
the same name in ../ui

This allows server side prerendering of resources like the update feed on the homepage