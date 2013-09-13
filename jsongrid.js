(function( $ ) {

    // grid constructor
    var Grid = function( el, data, options ) {
        this.el = $( el );
        $.extend( this, options );
        this.data = data;
    };

    // render the grid
    Grid.prototype.render = function() {
        this.el.html( "<table class='grid'><tbody></tbody></table>" );

        if ( this.title ) {
            this.render_item({ 
                key: this.title,
                pad: false
            });
        }

        for ( var prop in this.data ) {
            this.render_item({ 
                key: prop, 
                value: this.data[ prop ],
                nested: "object" == typeof this.data[ prop ]
            });
        }

        return this;
    };

    // shortcut to jquery element find
    Grid.prototype.$ = function() {
        return this.el.find.apply( this.el, arguments );
    };

    // render the left pad and selection box
    Grid.prototype.render_pad = function( item, to ) {
        var pad = $( "<td class='pad' />" );
        pad.html( "<input type='checkbox' />" );
        to.append( pad );
        return this;
    };

    // render the key
    Grid.prototype.render_key = function( item, to ) {
        var key = $( "<td class='key' />" );
        key.html( item.key );
        if ( item.pad === false ) {
            key.attr( "colspan", 2 );
        }
        to.append( key );
        return this;
    };

    // render the value
    Grid.prototype.render_value = function( item, to ) {
        var value = $( "<td class='value' />" );
        to.append( value );
        this.render_input( item, value );
        return this;
    };

    // render the input box
    Grid.prototype.render_input = function( item, to ) {
        if ( "undefined" == typeof item.value ) {
            return this;
        }

        var input = $( "<input type='text' tabindex='1' />" );
        input.val( item.value );
        to.append( input );
        return this;
    };

    // render nested object
    Grid.prototype.render_nested = function( item, to ) {
        var nested = $( "<td class='nested' colspan='2' />" );
        to.append( nested );
        nested.jsongrid( item.value, { title: item.key } );
        return this;
    };

    // render a flat object
    Grid.prototype.render_flat = function( item, to ) {
        return this.render_key( item, to ).render_value( item, to );
    };

    // render a specific item
    Grid.prototype.render_item = function( item ) {
        var row = $( "<tr />" );
        this.$( "> table.grid" ).append( row );

        if ( item.pad !== false ) {
            this.render_pad( item, row );
        }

        var render_fn = ( item.nested ) ? this.render_nested : this.render_flat;
        return render_fn.call( this, item, row );
    };

    // jquery plugin
    $.fn.jsongrid = function( data, options ) {
        options = $.extend( {}, $.fn.jsongrid.defaults, options || {} );
        this.each( function( i, el ) {
            var grid = new options.Grid( el, data, options );
            $( el ).data( "jsongrid", grid );
            grid.render();
        });
        return this;
    };

    // default options
    $.fn.jsongrid.defaults = {
        Grid: Grid
    };

}( jQuery ))