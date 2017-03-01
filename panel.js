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
        Panel._draw(el, this._schema, this._data)
    }

    Panel._draw = function(el, schema, data) {
        if (!schema || !schema.type) {
            schema = Panel._autoSchema(data)
        }

        if (schema.hidden) {
            return
        }

        var inputFn = Panel.inputs[schema.type] || Panel._drawString
        inputFn(el, schema, data)
    }

    Panel._drawObject = function(el, schema, data) {
        var props = schema.properties
        Object.keys(props).forEach(function (k) {
            var prop = props[k]
            var section = $(`
                <section class="panel-flex">
                    <header></header>
                </section>
            `)

            section.$$('header').innerHTML = prop.title || k
            Panel._draw(section, prop, data[k])
            el.appendChild(section)
        })
    }

    Panel._drawArray = function(el, schema, data) {
        var expand = $('<div class="panel-toggle"></div>')
        el.appendChild(expand)

        var summary = $('<div class="panel-br">' + data.length + ' items</div>')
        el.appendChild(summary)

        var sections = data.map(function (item, idx) {
            var section = $(`
                <section class="panel-flex" style="display: none">
                    <header class="panel-nest"></header>
                </section>
            `)

            section.$$('header').innerHTML = idx
            Panel._draw(section, schema.item, item)
            el.appendChild(section)
            return section
        })

        expand.addEventListener('click', function() {
            expand.classList.toggle('panel-open')
            var display = expand.classList.contains('panel-open')
                ? '' : 'none';

            sections.forEach(function (section) {
                section.style.display = display
            })
        })
    }

    Panel._drawString = function(el, schema, data) {
        var inp = $('<input type="text" class="panel-grow" />')
        inp.value = data
        el.appendChild(inp)
    }

    Panel._drawNumber = function(el, schema, data) {
        var inp = $('<input type="number" class="panel-grow" />')
        inp.value = data
        el.appendChild(inp)
    }

    Panel._drawBoolean = function(el, schema, data) {
        var inp = $('<input type="checkbox" />')
        inp.value = data
        el.appendChild(inp)
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
        'object': Panel._drawObject,
        'array': Panel._drawArray,
        'string': Panel._drawString,
        'number': Panel._drawNumber,
        'boolean': Panel._drawBoolean,
        'date-time': Panel._drawDateTime
    }

    // create DOM element from an HTML string
    function $(html, args) {
        var tmp = document.createElement('div')
        tmp.innerHTML = html
        var el = tmp.children[0]

        el.$$ = function(selector) {
            return el.querySelector(selector)
        }
        return el
    }
})(window)
