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
    var favicon = "<link rel=\"icon\"
        type=\"image/jpg\"
        href=\"icon.jpg\">"
    res.write(title);
    res.write(favicon);
    if (ip)
    {
        var statement = "INSERT INTO LOOKUP values($ip)";

        console.log(statement);
        db.serialize(() => {
            db.run(statement, { $ip: ip[0] }, function(err) {
                if (err)
                {
                    console.error(err);
                }
            });
        });
    }

    db.serialize(() => {
        db.each(`SELECT VALUE as ip FROM LOOKUP`, function(err, row)
        {
            if (err)
            {
                console.error(err.message);
            }
            res.write(row.ip + " ");
        }, function() {
            db.close();
            res.end();
        });
    });
}).listen(80);

function buildString(db)
{
    let ipAddresses = new Array();


    console.log(ipAddresses);
    //return ipAddresses;
}

function StringBuilder() {
    this._array = [];
    this._index = 0;
}

StringBuilder.prototype.append = function (str) {
    this._array[this._index] = str;
    this._index++;
}

StringBuilder.prototype.toString = function () {
    return this._array.join('');
}
