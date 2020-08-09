# platformer-assets

Contains all the game assets for a 2D online platformer, and
the Node CLI script for converting them.

The aseprite-json format is not really friendly
for easy loading into games, nor is it
compact (because it contains a lot of information 
that isn't really necessary for 99% of purposes), 
and for each spritesheet .json file, you
also have to load the corresponding .png file
it's also not possible to load them at the same time
because the .png and .json may have different names

Thus this spaghetti was born to pre-process raw aseprite .json
and .png files into a slightly more sensible format. It is not
an example of a great node CLI application (Args are parsed using
a switch statement, it's not very modular, etc...), but it works,
and it'll only be used by a few people (read: only me), and for
a single very specific purpose.

It takes each frame of each animation (tag) of each layer
in list of frames, and transforms it into a nested object.
It also inlines the associated .png spritesheet file as a
base64 encoded image.

An example:

A frame in the aseprite .json file may look like this:
```js
{
    "someLayer someAnimation 0": {
        "frame": { /* ... */ },
        "duration": 100
        /* ... */
        // some more properties
    }
} 
```
We don't care about most of the properties, 
only the UVs (in this case under the `frame` property)
and the frame delay (`duration`).

So we take what we need, and it's transformed into this:
```js
sprites: {
    someLayer: {
        // frameN is a number, so instead of using a map
        // with numeric keys, we're using an array
        someAnimation: [
            {
                "uv": { /* ... */ },
                "delay": 100
            }
        ]
    }
}
```

Which, in my case, is compact, and easy to load.
