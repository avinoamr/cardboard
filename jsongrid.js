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

        if ( next.first().is( ":visible" ) ) {
            next.addClass( "hide" );
        } else {
            // only fade in the direct children of this row
            next.filter( function () {
                return span - 1 == +$( this ).find( "> td.key" ).attr( "colspan" )
            }).removeClass( "hide" );
        }
    }

    var change = function ( ev ) {
        var target = $( ev.currentTarget );
        var data = target.data( "jsongrid" );
        data.obj[ data.key ] = target.val();
    }

    // grid constructor
    var Grid = function( el, data, options ) {
        $.extend( this, options );
        this.el = $( el );
        this.el.on( "click", ".key", toggle );
        this.el.on( "change", "input", change );
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
        this.table = $( "<table class='grid'></table>" )
            .appendTo( this.el.empty() );
        this.render_object( this.data, { key: this.title } );
        return this;
    };

    Grid.prototype.render_object = function ( obj, options ) {
        var pad = options.pad || ( options.pad == 0 );
        if ( options.key !== false ) {
            this.render_row({
                key: options.key,
                pad: pad,
                strong: true,
                hidden: pad > 1
            });
            pad += 1;
        }
        
        for ( var prop in obj ) {
            var v = obj[ prop ];
            if ( typeof v == "object" ) {
                this.render_object( v, { 
                    pad: pad, 
                    key: prop 
                });
            } else {
                this.render_row({
                    key: prop,
                    obj: obj,
                    pad: pad,
                    hidden: pad > 1
                });
            }
        }
    }

    Grid.prototype.render_row = function( options ) {
        var pad = options.pad;
        var row = $( "<tr>" )
            .toggleClass( "hide", options.hidden == true )
            .appendTo( this.table );

        for ( var i = 0 ; i < pad ; i += 1 ) {
            $( "<td class='pad'>" ).appendTo( row );
        }
        
        var td = $( "<td class='key'>" )
            .attr( "colspan", this.depth - pad )
            .appendTo( row );

        $( options.strong ? "<strong>" : "<span>" )
            .text( options.key )
            .appendTo( td );

        var v = $( "<td class='value'>" )
            .appendTo( row );

        var value = options.obj ? options.obj[ options.key ] : undefined;
        if ( typeof value != "undefined" ) {
            $( "<input type='text' />" )
                .val( value )
                .data( "jsongrid", { obj: options.obj, key: options.key } )
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