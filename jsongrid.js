(function( $ ) {

    // grid constructor
    var Grid = function( el, data, options ) {
        this.el = $( el );
        $.extend( this, options );
        this.data = data;
    };

    // render the grid
    Grid.prototype.render = function() {
        this.el.html( this.template );

        for ( var prop in this.data ) {
            this.render_item({ 
                key: prop, 
                value: this.data[ prop ]
            });
        }

        return this;
    };

    // shortcut to jquery element find
    Grid.prototype.$ = function() {
        return this.el.find.apply( this.el, arguments );
    };


    // render a specific item
    Grid.prototype.render_item = function( item ) {
        var row = $( this.template_item );
        this.$( "table.jsongrid" ).append( row );

        // pad
        var pad = row.find( "> .pad" );
        pad.width( 30 );
        pad.css( "background", "#f5f5f5" );
        if ( this.selectable ) {
            pad.html( "<input type='checkbox' />" );
        }

        // nested object
        if ( "object" == typeof item.value ) {
            row.find( "> .value" ).remove();
            row.find( "> .key" )
                .attr( "colspan", 2 )
                .css( "padding", 0 )
                .css( "border", "none" )
                .jsongrid( item.value );
            return this;
        }

        // value
        var itemvalue = item.value, nested = false;
        if ( "object" == typeof itemvalue ) {
            itemvalue = JSON.stringify( itemvalue );
            nested = true;
        }
        var value = row.find( "> .value" );
        value.width( 720 );
        value.html( itemvalue );

        // key
        var key = row.find( "> .key" );
        var itemkey = $( "<span />" ).html( item.key );
        if ( nested ) {
            var carret = $( "<a href='#' class='glyphicon glyphicon-chevron-right'></a>" );
            carret.css( "padding-right", 10 );
            key.append( carret )
        }
        key.append( itemkey );

        
        


        
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
        template: "<table class='jsongrid'></table>",
        template_item: "<tr><td class='pad'></td><td class='key'></td><td class='value'></td></tr>",
        Grid: Grid,
        selectable: true
    };

}( jQuery ))