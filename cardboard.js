(function(exports){
    var conflict = exports.cardboard

    exports.cardboard = cardboard
    cardboard.Cardboard = Cardboard

    function cardboard() {
        return new Cardboard()
    }

    function Cardboard() {
        this._data = {}
    }

    Cardboard.prototype.data = function(data) {
        this._data = data
        return this
    }

    Cardboard.prototype.schema = function(schema) {
        // deep-copy the schema because we're going to change it.
        this._schema = JSON.parse(JSON.stringify(schema))
        return this
    }

    Cardboard.prototype.draw = function(el) {
        el.classList.add('cardboard')
        var inputs = draw(this._schema, this._data)
        el.innerHTML = ''
        $(el).appendMany(inputs)
        return el
    }

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

    Cardboard.inputs = {
        'object': drawObject,
        'array': drawArray,
        'string': drawString,
        'number': drawNumber,
        'boolean': drawBoolean,
        'items': drawItems,
        // 'date-time': drawDateTime
    }

    // aliases for native javascript objects
    Cardboard.inputs[Array] = Cardboard.inputs['array']
    Cardboard.inputs[Object] = Cardboard.inputs['object']
    Cardboard.inputs[String] = Cardboard.inputs['string']
    Cardboard.inputs[Number] = Cardboard.inputs['number']

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
})(window)
