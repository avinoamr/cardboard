(function(){
/**
 * CARDBOARD
 * Minimalistic, portable, style-able forms for JSON schemas and javascript
 * objects.
 *
 * Demo: http://htmlpreview.github.io/?https://github.com/avinoamr/cardboard/blob/master/example.html
 *
 * The MIT License (MIT)
 * Copyright (c) 2013 Roi Avinoam

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const STYLE = `
card-board {
    border-bottom: 1px solid #ddd;
    display: block;
}

card-board .cardboard-hidden {
    display: none;
}

card-board .cardboard-flex {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

card-board .cardboard-grow {
    flex-grow: 1
}

card-board .cardboard-full {
    width: 100%;
}

card-board section {
    border-top: 1px solid #ddd;
    width: 100%;
}

card-board section > header {
    text-transform: uppercase;
    font-weight: bold;
    font-size: 12px;
    color: #7f8c8d;
    padding: 12px;
}

card-board .cardboard-nest {
    box-sizing: border-box;
    border-left: 30px solid #f5f5f5;
}

card-board input {
    display: block;
    border: none;
    outline: none;
    background: none;
    font-weight: normal;
}

card-board .cardboard-toggle {
    cursor: pointer;
}

card-board .cardboard-toggle:before {
    content: '';
    position: relative;
    vertical-align: top;
    top: 0.35em;
    left: 0.15em;

    display: inline-block;
    margin-right: 1em;
    width: 0.45em;
    height: 0.45em;

    border-style: solid;
    border-width: 0.15em 0.15em 0 0;
    border-color: #7f8c8d;
    transform: rotate(45deg);
    transition: transform .3s, top .3s;
}

card-board .cardboard-toggle.cardboard-open:before {
    top: 0.15em;
    transform: rotate(135deg);
}
`
class Cardboard extends HTMLElement {
    constructor() {
        super()
        this.createdCallback() // custom-elements v1
    }

    createdCallback() {
        // element may have been upgraded when the data attribute was already
        // set, not through the setter.
        var data = this.data
        delete this.data
        this.data = data

        var schema = this.schema
        delete this.schema
        this.schema = schema
    }

    attachedCallback() { // custom-elements v0
        this.connectedCallback()
    }

    connectedCallback() {
        var s = this.parentNode.querySelector('style#cardboard-style')
        if (s) {
            return
        }

        var s = $('<style id="cardboard-style">' + STYLE + '</style>')
        this.parentNode.insertBefore(s, this)
    }

    set data(data) {
        this._data = data
        setTimeout(this.render.bind(this), 100)
    }

    get data() {
        return this._data
    }

    set schema(schema) {
        this._schema = schema
        setTimeout(this.render.bind(this), 100)
    }

    get schema() {
        return this._schema
    }

    render() {
        var el = this
        el.classList.add('cardboard')
        var inputs = draw(this._schema, this._data, {})
        el.innerHTML = ''
        $(el).appendMany(inputs)
        return el
    }

    static register(name, drawFn) {
        this.inputs[name] = drawFn
        return this
    }
}

Cardboard.inputs = {}

function draw(schema, data, options) {
    if (!schema || !schema.type) {
        schema = extend(Cardboard._autoSchema(data), schema)
    }

    if (schema.hidden) {
        return
    }

    var inputFn = Cardboard.inputs[schema.type] || Cardboard.inputs.string
    return inputFn(schema, data, options)
}

function drawItems(schema, data, options) {
    options._nest = options._nest || 0
    if (!options._nest) {
        return drawItems.inner(schema, data, options)
    }

    var expand = $('<div class="cardboard-toggle"></div>')
    var container = $('<div class="cardboard-full"></div>')

    var items
    expand.on('click', function() {
        expand.classList.toggle('cardboard-open')
        if (!items) {
            items = drawItems.inner(schema, data, options)
            container.appendMany(items)
        }

        container.style.display = expand.classList.contains('cardboard-open')
            ? '' : 'none'
    })

    return [expand, container]
}

drawItems.inner = function(schema, items, options) {
    var nest = options._nest
    var headers = []
    var sections = items
        .filter(function(item) {
            return item.k[0] !== '_' && !item.schema.hidden
        })
        .map(function (item) {
            var section = $(`
                <section class="cardboard-flex">
                    <header></header>
                </section>
            `)
            .on('input', onChange)
            .on('change', onChange)

            function onChange(ev) {
                if (ev.detail === undefined) {
                    ev.detail = ev.target.value
                }
                item.data[item.k] = ev.detail
                ev.detail = item.data
            }

            var header = section.$$('header')
            header.innerHTML = item.schema.title || item.k
            headers.push(header)

            if (nest > 0) {
                header.classList.add('cardboard-nest')
                header.style['border-left-width'] =
                    (nest * 30) + 'px'
            }

            options = { _nest: nest + 1 }
            // item.schema._nest = nest + 1
            return section.appendMany(draw(item.schema, item.v, options))
        })

    // // uniform width
    // setTimeout(function () {
    //     var max = headers.reduce(function (max, h) {
    //         return Math.max(max, h.getBoundingClientRect().width)
    //     }, 0)
    //
    //     headers.forEach(function (h) {
    //         h.style.width = max + 'px'
    //     })
    // })

    return sections
}

function drawObject(schema, data, options) {
    data = data || {}
    var props = schema.properties || {}
    var items = Object.keys(props).map(function(k) {
        return { schema: props[k], k: k, v: (data || {})[k], data: data }
    })

    return drawItems(schema, items, options)
}

function drawArray(schema, data, options) {
    data = data || []
    var items = (data || []).map(function(d, idx) {
        return { schema: schema.item || {}, k: idx, v: d, data: data }
    })

    return drawItems(schema, items, options)
}

function drawEnum(schema, data) {
    data || (data = schema.default)
    return schema.enum.reduce(function (select, item) {
        var option = $('<option>' + item + '</option>')
            .attr('selected', item == data)

        return select.appendMany(option)
    }, $('<select></select>'))
}

function drawInput(format, schema, data) {
    return schema.enum
        ? drawEnum(schema, data)
            .attr('disabled', schema.readOnly)

        : $('<input class="cardboard-grow" />')
            .attr('type', format || 'text')
            .attr('value', data || schema.default || '')
            .attr('placeholder', schema.placeholder || '')
            .attr('disabled', schema.readOnly)
}

function drawString (schema, data) {
    return drawInput(schema.format || 'text', schema, data)
}

function drawNumber (schema, data) {
    return drawInput('number', schema, data)
        .on('input', onChange)
        .on('change', onChange)

    function onChange(ev) {
        ev.detail = parseFloat(ev.target.value)
    }
}

function drawBoolean(schema, data) {
    return drawInput('checkbox', schema, data)
        .attr('checked', data)
        .on('input', onChange)
        .on('change', onChange)

    function onChange(ev) {
        ev.detail = ev.target.checked
    }
}

Cardboard._autoSchema = function(data) {
    var schema = {
        type: Array.isArray(data) ? 'array' : typeof data
    }

    if (schema.type === 'object') {
        schema.properties = {}
        Object.keys(data).forEach(function (k) {
            schema.properties[k] = Cardboard._autoSchema(data[k])
        })
    }

    return schema
}

// create DOM element from an HTML string
function $(el, args) {
    if (typeof el === 'string') {
        var tmp = document.createElement('div')
        tmp.innerHTML = el
        el = tmp.children[0]
    }

    el.$$ = function(selector) {
        return $(el.querySelector(selector))
    }
    el.attr = function(k, v) {
        !v
            ? el.removeAttribute(k)
            : el.setAttribute(k, v)
        return el
    }
    el.appendMany = function(items) {
        items || (items = [])
        items = Array.isArray(items) ? items : [items]
        items.forEach(el.appendChild.bind(el))
        return el
    }
    el.on = function() {
        el.addEventListener.apply(el, arguments)
        return el
    }
    return el
}

function extend(target, source) {
    for (var k in source) {
        if (source[k] !== undefined) {
            target[k] = source[k]
        }
    }
    return target
}

function cardboard(el) {
    if (el instanceof cardboard.Cardboard) {
        return el // idempotent
    }

    Object.setPrototypeOf(el, cardboard.Cardboard.prototype)
    el.createdCallback()
    el.connectedCallback() // harmless even when not connected - not really
    // because we inject the style-sheet to the parent node.
    return el
}

cardboard.register = Cardboard.register.bind(Cardboard)
cardboard.Cardboard = Cardboard
    .register('object', drawObject)
    .register('array', drawArray)
    .register('text', drawString)
    .register('string', drawString)
    .register('number', drawNumber)
    .register('int', drawNumber)
    .register('integer', drawNumber)
    .register('float', drawNumber)
    .register('boolean', drawBoolean)
    .register('boo', drawBoolean)
    .register(Object, drawObject)
    .register(Array, drawArray)
    .register(String, drawString)
    .register(Number, drawNumber)
    .register(Boolean, drawBoolean)

// register the element
document.addEventListener('DOMContentLoaded', function () {
    if ('customElements' in window) {
        window.customElements.define('card-board', Cardboard)
    } else if ('registerElement' in document) {
        cardboard.Cardboard = document.registerElement('card-board', Cardboard)
    } else {
        console.warn('<card-board>: custom elements aren\'t supported')
        console.warn('<card-board>: Initialize <draw-box> with cardboard(el)')
    }
})

window.cardboard = cardboard
})()
