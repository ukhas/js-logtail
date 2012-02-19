(function () {

var dataelem = "#data";
var scrollelem = "body";

var url = "log";
var load = 30024; /* 30KB */
var poll = 1000; /* 1s */

var kill = false;
var loading = false;
var log_data = null;
var log_size = null;

function get_log() {
    if (kill | loading) return;
    loading = true;

    var range;
    if (log_size === null)
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

            var c_r = xhr.getResponseHeader("Content-Range");
            if (c_r === null)
                throw "Server did not respond with a Content-Range";

            log_size = parseInt(c_r.split("/")[1]);
            if (isNaN(log_size))
                throw "Invalid Content-Range size";

            var added = false;

            if (log_data === null) {
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

                if (data.length > 1)
                    added = true;
            }

            if (log_data.length > load) {
                var start = log_data.indexOf("\n", log_data.length - load);
                log_data = log_data.substring(start + 1);
            }

            show_log(added);
            setTimeout(get_log, poll);
        },
        error: function (xhr, s, t) {
            loading = false;

            if (xhr.status === 416 || xhr.status == 404) {
                /* 416: Requested range not satisfiable: log was truncated. */
                /* 404: Retry soon, I guess */

                log_size = null;
                log_data = null;
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

    if (log_data !== null)
        d.text(log_data);
    else
        d.text("");

    if (scroll)
        s.scrollTop(s.height());
}

function error(what) {
    kill = true;
    /* TODO: error msg */
}

$(document).ready(function () {
    $(window).error(error);
    get_log();
});

})();
