var http = require('http');
var sqlite3 = require('sqlite3');
http.createServer(function (req, res)
{
    res.writeHead(200, {'Content-Type': 'text/html'});

    // Open database
    let db = new sqlite3.Database('ip.db', sqlite3.OPEN_READWRITE, (err) =>
    {
        if (err)
        {
            console.error(err.message);
        }
    });
    var ipMatch = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    var ipString = req.headers['x-forwarded-for'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
    var ip = ipString.match(ipMatch);
    var title = "<title>Momentary Now</title>";
    res.write(title);
    if (ip)
    {
        res.write(ip[0]);
    }
    res.end();

    // Close the database
    db.close((err) =>
    {
        if (err)
        {
            console.error(err.message);
        }
    });
}).listen(80);
