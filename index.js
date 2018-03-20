var http = require('http');
var sqlite3 = require('sqlite3');
var fs = require('fs');

// Create a server for each request
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

    // Regex pattern will extract ip address from a string
    var ipMatch = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

    // Various methods to obtain IP nearly guarantees that one will succeed
    var ipString = req.headers['x-forwarded-for'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Extract IP address from the string containing it
    var ip = ipString.match(ipMatch);

    // Our blacklisted flag is initially false
    var blacklisted = false;

    // ensure that we obtained an IP address before proceeding
    if (ip)
    {
        // SQL statement to check if client's ip is already in the database
        var checkString = "SELECT count(*) as num FROM LOOKUP WHERE VALUE = $ip";

        // Serialize database to ensure synchronization
        db.serialize(() =>
        {
            // Check if the count is greater than zero, if so the client is
            // already blacklisted
            db.each(checkString, { $ip: ip[0] }, function(err, row)
            {
                if (row.num > 0)
                {
                    blacklisted = true;
                } // if
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
                            // Write the rejection page to the response
                            res.writeHead(200, {'Content-Type': 'text/html'});
                            res.end(data);
                        }
                    });
                } // if
                else // user is not blacklisted yet
                {
                    // SQL statement ot insert ip addres into database
                    var statement = "INSERT INTO LOOKUP values($ip)";

                    // Run the statement with the client's ip address
                    db.run(statement, { $ip : ip[0] }, function(err)
                    {
                        if (err)
                        {
                            console.error(err);
                        } // if
                    },
                    function()
                    { // Finished callback
                        fs.readFile("index.html", function(err, data) {
                            if (err)
                            {
                                res.statusCode = 500;
                                res.end(`Error getting the file: ${err}.`);
                            } // if
                            else
                            {
                                // Write the index file to the response
                                res.writeHead(200, {'Content-Type': 'text/html'});
                                res.end(data);
                            } // else
                        }); // Read file callback
                    }); // Insert statement callback
                } // Not blacklisted block
            }); // Blacklist check callback
        }); // Database serialization callback
    } // if
}).listen(80);
