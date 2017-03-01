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
        var row = target.parent( "tr" ).first();
        var next = row.nextUntil( function () {
            return span <= +$( this ).find( "> td.key" ).attr( "colspan" )
        }).remove();

        var data = row.data( "jsongrid" );
        if ( !next.length && data && typeof data.obj[ data.key ] == "object" ) {
            this.render_object( data.obj[ data.key ], {
                after: row,
                pad: data.pad + 1
            });
        }
    }

    var change = function ( ev ) {
        var target = $( ev.currentTarget );
        var data = target.parents('tr').data( "jsongrid" );
        data.obj[ data.key ] = target.val();
    }

    // grid constructor
    var Grid = function( el, data, options ) {
        $.extend( this, options );
        this.el = $( el );
        this.el.on( "click", ".key", $.proxy( toggle, this ) );
        this.el.on( "change", "input", $.proxy( change, this ) );
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


        if ( this.title ) { this.render_header() }
        this.render_object( this.data, {} );
        return this;
    };

    Grid.prototype.render_header = function () {
        var head = $( "<thead>" )
            .appendTo( this.table );

        var row = $( "<tr>" )
            .appendTo( head );

        var header = $( "<th>" )
            .text( this.title )
            .attr( "colspan", 1 + this.depth )
            .appendTo( row );
    }

    Grid.prototype.render_object = function ( obj, options ) {
        var pad = options.pad || ( options.pad = 0 );
        var row = options.after;
        var that = this;
        Object.keys( obj ).forEach( function ( key ) {
            row = that.render_row({
                key: key,
                obj: obj,
                pad: pad,
                after: row
            });
        });
    }

    Grid.prototype.render_row = function( options ) {
        // console.log( options.after )
        var pad = options.pad;
        var row = $( "<tr>" )
            .data( "jsongrid", { obj: options.obj, key: options.key, pad: pad } );

        ( options.after )
            ? row.insertAfter( options.after )
            : row.appendTo( this.table );

        for ( var i = 0 ; i < pad ; i += 1 ) {
            $( "<td class='pad'>" ).appendTo( row );
        }

        var td = $( "<td class='key'>" )
            .attr( "colspan", this.depth - pad )
            .appendTo( row );

        var value = options.obj ? options.obj[ options.key ] : undefined;
        $( typeof value == "object" ? "<strong>" : "<span>" )
            .text( options.key )
            .appendTo( td );

        var v = $( "<td class='value'>" )
            .appendTo( row );

        if ( typeof value != "undefined" && typeof value != "object" ) {
            $( "<input type='text' />" )
                .val( value )
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
    $.fn.jsongrid.defaults = { Grid: Grid };

}( jQuery ))
