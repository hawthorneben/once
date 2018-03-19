var http = require('http');
const sqlite3 = require('sqlite3').verbose();
http.createServer(function (req, res)
{
    res.writeHead(200, {'Content-Type': 'text/html'});
    let db = new sqlite3.Database('ip.db', sqlite3.OPEN_READWRITE, (err) =>
    {
        if (err)
        {
            console.error(err.message);
        }
        console.log('Connected to the IP database.');
    });
    var ip = req.headers['x-forwarded-for'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
    var title = "<title>Momentary Now</title>";
    res.write(title);
    res.write(ip);
    res.end();
}).listen(80);
