(function( $ ) {

    // grid constructor
    var Grid = function( el, data, options ) {
        $.extend( this, options );
        this.el = $( el );
        this.data = data;
    };

    // shortcut to jquery element find
    Grid.prototype.$ = function() {
        return this.el.find.apply( this.el, arguments );
    };

    // render the grid
    Grid.prototype.render = function() {
        var self = this;
        this.el.html( "<table class='grid'><tbody></tbody></table>" );

        this.render_item({ 
            key: this.title,
            pad: false,
            class_: "headline"
        });

        for ( var prop in this.data ) {
            this.render_item({ 
                key: prop, 
                value: this.data[ prop ],
                nested: "object" == typeof this.data[ prop ]
            });
        }

        // apply the headline event
        var headline = this.$( "> table.grid > tbody > tr.headline > td.key" );
        this.$( headline ).click( function() {
            self.toggle();
            return false;
        });

        if ( this.collapsed ) {
            headline.css( "font-weight", "bold" );
            this.collapse();
        }

        return this;
    };

    // render a specific item
    Grid.prototype.render_item = function( item ) {
        var row = $( "<tr />" );
        this.$( "> table.grid" ).append( row );
        row.addClass( item.class_ || "" );

        if ( item.pad !== false ) {
            this.render_pad( item, row );
        }

        var render_fn = ( item.nested ) ? this.render_nested : this.render_flat;
        return render_fn.call( this, item, row );
    };

    // render the left pad and selection box
    Grid.prototype.render_pad = function( item, to ) {
        var pad = $( "<td class='pad' />" );
        if ( this.checkbox !== false ) {
            pad.html( "<input type='checkbox' />" );
        }
        to.append( pad );
        return this;
    };

    // render the key
    Grid.prototype.render_key = function( item, to ) {
        var key = $( "<td class='key' />" );
        key.html( item.key || "&nbsp;" );
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
        nested.css( "border-top", "none" );
        to.append( nested );

        var options = $.extend( {}, this, {
            title: item.key,
            collapsed: true 
        });

        nested.jsongrid( item.value, options );
        return this;
    };

    // render a flat object
    Grid.prototype.render_flat = function( item, to ) {
        return this.render_key( item, to ).render_value( item, to );
    };

    // collapse the grid
    Grid.prototype.collapse = function() {
        //this.$( "> table.grid > tbody > tr:not(.headline)" ).hide();
        this.$( "> table.grid" ).addClass( "collapsed" );
        return this;
    };

    // expand the grid
    Grid.prototype.expand = function() {
        this.$( "> table.grid" ).removeClass( "collapsed" );
        return this;
    };

    // toggle the nested collapsible visibility
    Grid.prototype.toggle = function() {
        this.$( "> table.grid" ).toggleClass( "collapsed" );
        return this;
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