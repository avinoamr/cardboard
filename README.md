cardboard
========

Minimalistic, portable, style-able forms for JSON schemas and javascript objects.

[Demo](http://htmlpreview.github.io/?https://github.com/avinoamr/cardboard/blob/master/example.html)

## Key Features
1. Stand-alone & independent from other libraries like jQuery, Angular or
Bootstrap
2. Tiny, minimalistic.
3. Styleable to fit your UI design
4. JSON schema extended with arbitrary controls and types

## Usage

```
$ bower install cardboard
```

```html
<script src="cardboard.js" />
<link href="cardboard.css" ?>
```

```js
cardboard()
    .data({ // implicit schema; inferred from the data
        hello: 'world',
        foo: 'bar'
    })
    .draw(document.body)

cardboard()
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
