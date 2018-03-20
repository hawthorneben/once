var http = require('http');
var sqlite3 = require('sqlite3');
var fs = require('fs');
http.createServer(function (req, res)
{

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
    var blacklisted = false;

    if (ip)
    {
        var checkString = "SELECT count(*) as num FROM LOOKUP WHERE VALUE = $ip";
        db.serialize(() =>
        {
            db.each(checkString, { $ip: ip[0] }, function(err, row)
            {
                if (row.num > 0)
                {
                    blacklisted = true;
                }
                console.log(blacklisted);
            }, function()
            {
                if (blacklisted)
                {
                    fs.readFile("rejection.html", function(err, data) {
                        if (err)
                        {
                            res.statusCode = 500;
                            res.end(`Error getting the file: ${err}.`);
                        }
                        else
                        {
                            res.writeHead(200, {'Content-Type': 'text/html'});
                            res.end(data);
                        }
                    });
                } // if
            });
        });

        // If the IP is not already blacklisted, we'll add it to the DB
        if (!blacklisted)
        {
            var statement = "INSERT INTO LOOKUP values($ip)";

            db.serialize(() => {
                db.run(statement, { $ip: ip[0] }, function(err) {
                    if (err)
                    {
                        console.error(err);
                    }
                });
            });
        }
    }

    if (!blacklisted)
    {
        fs.readFile("index.html", function(err, data) {
            if (err)
            {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            }
            else
            {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(data);
            }
        });
    }
}).listen(80);
