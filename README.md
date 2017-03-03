jsongrid
========

Minimalistic, portable, style-able forms for JSON schemas and javascript objects.

[Demo](http://htmlpreview.github.io/?https://github.com/avinoamr/jsongrid/blob/master/examples/index.html)

## Key Features
1. Completely independent of other libraries - Angular, Bootstrap, jQuery, etc.
not required. (Free)
2. Tiny, minimalistic. (??)
3. Styleable to fit your UI design
4. JSON schema extended with arbitrary controls and types

## Usage

```
$ bower install jsongrid
```

```html
<script src="jsongrid.js" />
<link href="jsongrid.css" ?>
```

```js
jsongrid()
    .data({ // implicit schema; inferred from the data
        hello: 'world',
        foo: 'bar'
    })
    .draw(document.body)

jsongrid()
    .data({})
    .schema({ // explicit JSON-schema
        type: 'object',
        properties: {
            email: {
                type: 'string',
                format: 'email'
            },
        }
    })
```
