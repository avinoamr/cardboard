(function( $ ) {

    var depth = function ( obj ) {
        var seen = []; // prevent circular lookups
        function dfs( obj ) {
            var d = 0;
            for ( var p in obj ) {
                var v = obj[ p ];
                if ( typeof v == "object" && seen.indexOf( v ) == -1 ) {
                    seen.push( v );
                    d = Math.max( d, dfs( obj[ p ] ) + 1 );
                }
            }
            return d;
        }
        return 1 + dfs( obj );
    }

    var toggle = function ( ev ) {
        var target = $( ev.currentTarget );
        var span = +target.attr( "colspan" );
        var next = target
            .parents( "tr" )
            .nextUntil( function () {
                return span <= +$( this ).find( "> td.key" ).attr( "colspan" )
            });

        next.fadeToggle();
    }

    // grid constructor
    var Grid = function( el, data, options ) {
        $.extend( this, options );
        this.el = $( el );
        this.el.on( "click", ".key", toggle );
        this.data = data;
    };

    // shortcut to jquery element find
    Grid.prototype.$ = function() {
        return this.el.find.apply( this.el, arguments );
    };

    // render the grid
    Grid.prototype.render = function() {
        var self = this;
        this.depth = 1 + depth( this.data );
        this.table = $( "<table class='grid'></table>" ).appendTo( this.el );
        this.render_object( this.data, { key: this.title } );
        return this;
    };

    Grid.prototype.render_object = function ( obj, options ) {
        var pad = options.pad || 0;
        this.render_row({
            key: options.key,
            pad: pad,
            strong: true,
        });

        pad += 1;
        for ( var prop in obj ) {
            var v = obj[ prop ];
            if ( typeof v == "object" ) {
                this.render_object( v, { pad: pad, key: prop } );
            } else {
                this.render_row({
                    key: prop,
                    value: obj[ prop ],
                    pad: pad,
                })
            }
        }
    }

    Grid.prototype.render_row = function( options ) {
        var row = $( "<tr>" )
            .appendTo( this.table );

        var pad = options.pad || 0;
        for ( var i = 0 ; i < pad ; i += 1 ) {
            $( "<td class='pad'>" ).appendTo( row );
        }
        
        var k = $( "<td class='key'>" )
            .attr( "colspan", this.depth - pad )
            .text( options.key )
            .appendTo( row );

        if ( options.strong ) {
            k.css( "font-weight", "bold" );
        }

        var v = $( "<td class='value'>" )
            .appendTo( row );

        if ( typeof options.value != "undefined" ) {
            $( "<input type='text' />" )
                .val( options.value )
                .appendTo( v );
        }

        return row;
    }



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