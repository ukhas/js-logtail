(function () {

var dataelem = "#data";
var scrollelem = "body";

var url = "log";
var load = 30024; /* 30KB */
var poll = 1000; /* 1s */

var kill = false;
var loading = false;
var log_data = "";
var log_size = 0;

function get_log() {
    if (kill | loading) return;
    loading = true;

    var range;
    if (log_size === 0)
        /* Get the last 'load' bytes */
        range = "-" + load.toString();
    else
        /* Get the (log_size - 1)th byte, onwards. */
        range = (log_size - 1).toString() + "-";

    /* The "log_size - 1" deliberately reloads the last byte, which we already
     * have. This is to prevent a 416 "Range unsatisfiable" error: a response
     * of length 1 tells us that the file hasn't changed yet. A 416 shows that
     * the file has been trucnated */

    $.ajax(url, {
        cache: false,
        headers: {Range: "bytes=" + range},
        success: function (data, s, xhr) {
            loading = false;

            var size;

            if (xhr.status === 206) {
                if (data.length > load)
                    throw "Expected 206 Partial Content";

                var c_r = xhr.getResponseHeader("Content-Range");
                if (!c_r)
                    throw "Server did not respond with a Content-Range";

                size = parseInt(c_r.split("/")[1]);
                if (isNaN(size))
                    throw "Invalid Content-Range size";
            } else if (xhr.status === 200) {
                if (log_size > 1)
                    throw "Expected 206 Partial Content";

                size = data.length;
            }

            var added = false;

            if (log_size === 0) {
                /* Clip leading part-line if not the whole file */
                if (data.length < log_size) {
                    var start = data.indexOf("\n");
                    log_data = data.substring(start + 1);
                } else {
                    log_data = data;
                }

                added = true;
            } else {
                /* Drop the first byte (see above) */
                log_data += data.substring(1);

                if (log_data.length > load) {
                    var start = log_data.indexOf("\n", log_data.length - load);
                    log_data = log_data.substring(start + 1);
                }

                if (data.length > 1)
                    added = true;
            }

            log_size = size;
            show_log(added);
            setTimeout(get_log, poll);
        },
        error: function (xhr, s, t) {
            loading = false;

            if (xhr.status === 416 || xhr.status == 404) {
                /* 416: Requested range not satisfiable: log was truncated. */
                /* 404: Retry soon, I guess */

                log_size = 0;
                log_data = "";
                show_log(true);

                setTimeout(get_log, poll);
            } else {
                if (s == "error")
                    error(xhr.statusText);
                else
                    error("AJAX Error: " + s);
            }
        }
    });
}

function show_log(scroll) {
    var d = $(dataelem);
    var s = $(scrollelem);

    d.text(log_data);

    if (scroll)
        s.scrollTop(s.height());
}

function error(what) {
    kill = true;

    $(dataelem).text("An error occured :-(.\n" +
                     "Reloading may help; no promises.\n" + 
                     what);
    $(scrollelem).scrollTop(0);
}

$(document).ready(function () {
    $(window).error(error);
    get_log();
});

})();
