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
        draw(el, this._schema, this._data)
    }

    function draw(el, schema, data) {
        if (!schema || !schema.type) {
            schema = Panel._autoSchema(data)
        }

        if (schema.hidden) {
            return
        }

        var inputFn = Panel.inputs[schema.type] || Panel.inputs.string
        var inputs = inputFn(el, schema, data)
        if (!inputs) {
            return
        }

        inputs = Array.isArray(inputs) ? inputs : [ inputs ]
        $(el).appendMany(inputs)
    }

    function drawObject(el, schema, data) {
        schema._nest = schema._nest || 0
        if (!schema._nest) {
            return drawObject.items(el, schema, data)
        }

        var expand = $('<div class="panel-toggle"></div>')
        var summary = $('<div>' + Object.keys(data).length + ' items</div>')
        var container = $('<div class="panel-full"></div>')

        var items
        expand.addEventListener('click', function() {
            expand.classList.toggle('panel-open')
            if (!items) {
                items = drawObject.items(container, schema, data)
                container.appendMany(items)
            }

            container.style.display = expand.classList.contains('panel-open')
                ? '' : 'none'
        })

        return [expand, summary, container]
    }

    drawObject.items = function(el, schema, data) {
        var nest = schema._nest
        var props = schema.properties
        return Object.keys(props).map(function (k) {
            var prop = props[k]
            var section = $(`
                <section class="panel-flex">
                    <header></header>
                </section>
            `)

            var header = section.$$('header')
            header.innerHTML = prop.title || k

            if (nest > 0) {
                header.classList.add('panel-nest')
                header.style['border-left-width'] =
                    (nest * 30) + 'px'
            }

            prop._nest = nest + 1
            draw(section, prop, data[k])
            return section
        })
    }

    function drawArray(el, schema, data) {
        schema._nest = schema._nest || 0
        if (!schema._nest) {
            return drawArray.items(el, schema, data)
        }

        var expand = $('<div class="panel-toggle"></div>')
        var summary = $('<div>' + data.length + ' items</div>')
        var container = $('<div class="panel-full"></div>')

        var items
        expand.addEventListener('click', function() {
            expand.classList.toggle('panel-open')
            if (!items) {
                items = drawArray.items(container, schema, data)
                container.appendMany(items)
            }

            container.style.display = expand.classList.contains('panel-open')
                ? '' : 'none'
        })

        return [expand, summary, container]
    }

    drawArray.items = function (el, schema, data) {
        var nest = schema._nest
        return data.map(function (item, idx) {
            var section = $(`
                <section class="panel-flex">
                    <header></header>
                </section>
            `)

            var header = section.$$('header')
            header.innerHTML = idx

            if (nest > 0) {
                header.classList.add('panel-nest')
                header.style['border-left-width'] = (nest * 30) + 'px'
            }

            schema.item = schema.item || {}
            schema.item._nest = nest + 1
            draw(section, schema.item, item)
            return section
        })
    }

    function drawString (el, schema, data) {
        return $('<input type="text" class="panel-grow" />').setValue(data)
    }

    function drawNumber (el, schema, data) {
        return $('<input type="number" class="panel-grow" />').setValue(data)
    }

    function drawBoolean(el, schema, data) {
        return $('<input type="checkbox" />').setValue(data)
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
            return el.querySelector(selector)
        }
        el.setValue = function(v) {
            el.value = v
            return el
        }
        el.appendMany = function(items) {
            items || (items = [])
            items = Array.isArray(items) ? items : [items]
            items.forEach(el.appendChild.bind(el))
        }
        return el
    }
})(window)
