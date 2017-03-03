(function(exports){
    exports.panel = panel
    panel.Panel = Panel

    function panel() {
        return new Panel()
    }

    function Panel() {
        this._data = {}
    }

    Panel.prototype.data = function(data) {
        this._data = data
        return this
    }

    Panel.prototype.schema = function(schema) {
        this._schema = schema
        return this
    }

    Panel.prototype.draw = function(el) {
        el.classList.add('panel')
        var inputs = draw(this._schema, this._data)
        el.innerHTML = ''
        $(el).appendMany(inputs)
    }

    function draw(schema, data) {
        if (!schema || !schema.type) {
            var nest = (schema || {})._nest || 0
            schema = Panel._autoSchema(data)
            schema._nest = nest
        }

        if (schema.hidden) {
            return
        }

        var inputFn = Panel.inputs[schema.type] || Panel.inputs.string
        return inputFn(schema, data)
    }

    function drawItems(schema, data) {
        schema._nest = schema._nest || 0
        if (!schema._nest) {
            return drawItems.inner(schema, data)
        }

        var expand = $('<div class="panel-toggle">' + data.length + ' items</div>')
        var container = $('<div class="panel-full"></div>')

        var items
        expand.on('click', function() {
            expand.classList.toggle('panel-open')
            if (!items) {
                items = drawItems.inner(schema, data)
                container.appendMany(items)
            }

            container.style.display = expand.classList.contains('panel-open')
                ? '' : 'none'
        })

        return [expand, container]
    }

    drawItems.inner = function(schema, items) {
        var nest = schema._nest
        var headers = []
        var sections = items.map(function (item) {
            var section = $(`
                <section class="panel-flex">
                    <header></header>
                </section>
            `)

            var header = section.$$('header')
            header.innerHTML = schema.title || item.k
            headers.push(header)

            if (nest > 0) {
                header.classList.add('panel-nest')
                header.style['border-left-width'] =
                    (nest * 30) + 'px'
            }

            item.schema._nest = nest + 1
            return section.appendMany(draw(item.schema, item.v))
        })

        // uniform width
        setTimeout(function () {
            var max = headers.reduce(function (max, h) {
                return Math.max(max, h.getBoundingClientRect().width)
            }, 0)

            headers.forEach(function (h) {
                h.style.width = max + 'px'
            })
        })

        return sections
    }

    function drawObject(schema, data) {
        var props = schema.properties
        var items = Object.keys(props).map(function(k) {
            return { schema: props[k], k: k, v: data[k] }
        })

        return drawItems(schema, items)
    }

    function drawArray(schema, data) {
        var items = data.map(function(d, idx) {
            return { schema: schema.item || {}, k: idx, v: d }
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

    function drawString (schema, data) {
        return schema.enum
            ? drawEnum(schema, data)
            : $('<input type="text" class="panel-grow" />')
                .attr('value', data || schema.default || '')
                .attr('placeholder', schema.placeholder || '')
    }

    function drawNumber (schema, data) {
        return schema.enum
            ? drawEnum(schema, data)
            : $('<input type="number" class="panel-grow" />')
                .attr('value', data || schema.default || 0)
                .attr('placeholder', schema.placeholder || '')
    }

    function drawBoolean(schema, data) {
        return $('<input type="checkbox" />')
            .attr('checked', data)
    }

    Panel._autoSchema = function(data) {
        var schema = {
            type: Array.isArray(data) ? 'array' : typeof data
        }

        if (schema.type === 'object') {
            schema.properties = {}
            Object.keys(data).forEach(function (k) {
                schema.properties[k] = Panel._autoSchema(data[k])
            })
        }

        return schema
    }

    Panel.inputs = {
        'object': drawObject,
        'array': drawArray,
        'string': drawString,
        'number': drawNumber,
        'boolean': drawBoolean,
        // 'date-time': drawDateTime
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
            v === false
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
        el.on = el.addEventListener
        return el
    }
})(window)
