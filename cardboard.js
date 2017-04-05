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
class Cardboard extends HTMLElement {
    data(data) {
        this._data = data
        return this
    }

    schema(schema) {
        // deep-copy the schema because we're going to change it.
        this._schema = JSON.parse(JSON.stringify(schema))
        return this
    }

    render() {
        var el = this
        el.classList.add('cardboard')
        var inputs = draw(this._schema, this._data)
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

function draw(schema, data) {
    if (!schema || !schema.type) {
        schema = extend(Cardboard._autoSchema(data), schema)
    }

    if (schema.hidden) {
        return
    }

    var inputFn = Cardboard.inputs[schema.type] || Cardboard.inputs.string
    return inputFn(schema, data)
}

function drawItems(schema, data) {
    schema._nest = schema._nest || 0
    if (!schema._nest) {
        return drawItems.inner(schema, data)
    }

    var expand = $('<div class="cardboard-toggle"></div>')
    var container = $('<div class="cardboard-full"></div>')

    var items
    expand.on('click', function() {
        expand.classList.toggle('cardboard-open')
        if (!items) {
            items = drawItems.inner(schema, data)
            container.appendMany(items)
        }

        container.style.display = expand.classList.contains('cardboard-open')
            ? '' : 'none'
    })

    return [expand, container]
}

drawItems.inner = function(schema, items) {
    var nest = schema._nest
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
            header.innerHTML = schema.title || item.k
            headers.push(header)

            if (nest > 0) {
                header.classList.add('cardboard-nest')
                header.style['border-left-width'] =
                    (nest * 30) + 'px'
            }

            item.schema._nest = nest + 1
            return section.appendMany(draw(item.schema, item.v))
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

function drawObject(schema, data) {
    data = data || {}
    var props = schema.properties || {}
    var items = Object.keys(props).map(function(k) {
        return { schema: props[k], k: k, v: (data || {})[k], data: data }
    })

    return drawItems(schema, items)
}

function drawArray(schema, data) {
    data = data || []
    var items = (data || []).map(function(d, idx) {
        return { schema: schema.item || {}, k: idx, v: d, data: data }
    })

    return drawItems(schema, items)
}

function drawEnum(schema, data) {
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
    return !el || el instanceof cardboard.Cardboard
        ? el
        : Object.setPrototypeOf(el, cardboard.Cardboard.prototype)
}

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

window.cardboard = cardboard
})()
