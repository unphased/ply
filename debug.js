/// slu's JS debug layer. Please include prior to loading libraries that use it
/// Primarily provides functionality for live DOM manipulation style debugging
/// which was used heavily throughout development of ply.js.
/// Access features through window.DEBUG

// there are a few special DOM id's: 
// #debug_log
// #log_buffer_dump

(function() {

	var AssertException, assert; 
    
    AssertException = function (message) { this.message = message; };
    AssertException.prototype.toString = function () {
        return 'AssertException: ' + this.message;
    };

    assert = function (exp, message) {
        if (!exp) {
            throw new AssertException(message);
        }
    };

	// all vars except the variable "exposed" are private variables 
	var log_buffer = [];

	var git_context = "#% REVISION %#";


	// version string updated with git hash from scripts
        revision: git_context.slice(3,-3)


    var original_console_log = console.log;
    // echo console logs to the debug 
    var instrumented_log = function () {
        original_console_log.apply(window.console, arguments);
        if (!exposed.debug) return;
        var str = "";
        for (var i=0;i<arguments.length;++i) {
            str += escapeHtml(serialize(arguments[i])).replace(/ {2}/g,'</br>');
            str += ", ";
        }
        str = str.slice(0,-2);
        var now = Date.now();
        var html_str = '<div class="log" data-time="'+now+'">'+str+'</div>';
        log_buffer.push(html_str);
        if (!exposed.append_logs_dom) return;
        $("#debug_log").prepend(html_str); 
        // this means all logs in your application get dumped into #debug_log if 
        // you've got one
    };

    if (exposed.debug) {
        console.log = instrumented_log; // pre-empt usage of this if starting off not debug
        // if the previous line is not conditional on debug then it will be always
        // possible to "turn on debug" but with this here like this debug is never instrumented
        // when debug is initially off.

        // set up a way to show the log buffer if debug mode 
        // (note toggling the debug off will stop logs being written)
        // (and if debug is not true to begin with, no button is made)
        var show_log_buffer = false;
        $("#log_buffer_dump").before($('<button>toggle full log buffer snapshot</button>').on('click',function(){
            show_log_buffer = !show_log_buffer;
            if (show_log_buffer) {
                $("#log_buffer_dump").html(log_buffer.join(''));
            } else {
                $("#log_buffer_dump").html("");
            }
        })).on("touchenter",function(){console.log("touchenter on toggle buffer dump button");}).on('touchleave',function(){console.log("touchleave on toggle buffer dump button");});

    }

})();