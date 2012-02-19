# javascript logtailer

Ludicrously simple remote unix 'tail' like log viewer.

This uses an ajax request, and the HTTP Range: header to request only the last
~30KB of a log file. It then polls for data appended to that file, and only
ever retrieves new data (no refreshing the whole file, or even the last 30KB).
Handles file truncation too.

No server side code is required - it's all just static
files - and all modern web servers support Range (tested lighttpd, cherokee,
apache). Tested (briefly) in IE, FF, Chrome.

Usage: symlink the log to /log, or alter the url in logtail.js. Other settings
available in logtail.js including poll frequency. Then browse to index.html

License is GNU GPL 3; see http://www.gnu.org/licenses/

jQuery is included in this repository (jquery.min.js);
see http://jquery.org/license
