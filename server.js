var Twiter = require('twitter');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs'),
    request = require('request');
var express = require('express');

var cliente = new Twiter({
    consumer_key: 'nv9dX4YecJjKTqpOjlqXXYL85',
    consumer_secret: 'ZkMIMG6AY2Ar25Dej0Q7unCtZHJLn5irGVsDUzgIt9dR5Ex78f',
    access_token_key: '800601329173336065-002deFXp8E3Atx2gGPbfZFFVkgrfskQ',
    access_token_secret: 'PkU8fI57wcj5KcqhyNklDDlN1f5l5lkY9j1n8TTJyl2uO'
});

var generos;

console.log("---------------- BOT INICIADO. ----------------");

var app = express();

app.set('port', (process.env.PORT || 5000));

//For avoidong Heroku $PORT error
app.get('/', function (request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function () {
    console.log('App is running, server is listening on port ', app.get('port'));
});


setInterval(Loop, 1800000);

async function Loop() {
    await init();
    var ranGen = Math.floor(Math.random() * (generos.genres.length));
    var gen = generos.genres[ranGen].id;
    var urlAndPages = await GetUrl(gen);
    var ranPage = Math.floor(Math.random() * (urlAndPages.total)) + 1;
    var listPelis = await LeerPelicula(urlAndPages.url, ranPage);
    var ranPeli = Math.floor(Math.random() * listPelis.length);
    var peli = listPelis[ranPeli];
    var multimedia = true;

    if (!isASCII(peli.original_title)) {
        Loop();
        console.log('Pelicula salta, titulo: ' + peli.original_title);
        return;
    }

    if (peli.poster_path != null && peli.poster_path != '')
        await download('https://image.tmdb.org/t/p/w500/' + peli.poster_path, 'image.jpg');
    else
        multimedia = false;

    var generosPeli = [];
    peli.genre_ids.forEach(g => {
        generosPeli.push(generos.genres.find(function (el) {
            return el.id == g;
        }).name);
    })

    var tituloGeneros = peli.original_title +
        ' (' + peli.release_date.substring(0, 4) + ')\n\n Generos: ' + generosPeli.join(', ');

    if (tituloGeneros.length > 143)
        tituloGeneros = tituloGeneros.substring(0, 143);

    var resumen = ResumeToArray(peli.overview); //.match(/.{1,143}/g);
    // console.log(resumen);
    var resMedia;
    if (multimedia)
        resMedia = await tuitearMedia(tituloGeneros);
    else
        resMedia = await tuitear(tituloGeneros)

    var lastTwId = resMedia.id_str;
    if (resumen != null) {
        for (let i = 0; i < resumen.length; i++) {
            lastTwId = await Responder(resumen[i], lastTwId);
        }
    }

    var date = new Date();
    var current_hour = date.getHours() + ':' + date.getMinutes();
    console.log("NEW TWEET AT " + current_hour + "!");
    console.log("FILM: " + peli.original_title);
    console.log("--------------------------------------");
    console.log('\r');
}

var reqTimer = setTimeout(function wakeUp() {
    request("https://quever-bot.herokuapp.com", function () {
        console.log("WAKE UP DYNO");
    });
    return reqTimer = setTimeout(wakeUp, 1200000);
}, 1200000);

function ResumeToArray(resumen) {
    var arr = [];

    while (resumen.length > 140) {
        var trimmed = resumen.substring(0, 140);
        var reTrimmed = trimmed.substring(0, Math.min(trimmed.length, trimmed.lastIndexOf(" ")));
        resumen = resumen.substring(reTrimmed.length);
        if (resumen.length > 0)
            reTrimmed += '...';
        arr.push(reTrimmed);
        // console.log(resumen.length);
    };
    arr.push(resumen);
    // console.log(arr);
    return arr;
}

async function init() {
    await ObtenerGeneros();
}


function tuitear(q) {
    return new Promise(resolve => {
        cliente.post('statuses/update', { status: q })
            .then((tweet) => {
                resolve(tweet);
            })
            .catch((error) => {
                console.log(error);
            });
    })
}

async function tuitearMedia(q) {
    return new Promise(resolve => {
        // Load your image
        var data = require('fs').readFileSync('image.jpg');

        // Make post request on media endpoint. Pass file data as media parameter
        cliente.post('media/upload', { media: data }, function (error, media, response) {

            if (!error) {

                // If successful, a media object will be returned.
                // console.log(media);

                // Lets tweet it
                var status = {
                    status: q,
                    media_ids: media.media_id_string // Pass the media id string
                }

                cliente.post('statuses/update', status, function (error, tweet, response) {
                    if (!error) {
                        // console.log(tweet);
                        var jsnTweet = JSON.parse(JSON.stringify(tweet));
                        resolve(jsnTweet);
                    }
                });

            }
        });
    })
}

function stremear() {
    cliente.stream('statuses/filter', { track: 'twitter' }, function (stream) {
        stream.on('data', function (tweet) {
            console.log(tweet.text);
        });

        stream.on('error', function (error) {
            console.log(error);
        });
    });
}


async function asyncResponder() {
    result = await LeerTweets();
    var r = JSON.parse(JSON.stringify(result));

    r.statuses.forEach(element => {
        console.log(element.text);
        Responder('Hola expandMind!', element.id_str);
    });


}

function LeerTweets() {
    return new Promise(resolve => {
        cliente.get('search/tweets', { q: 'Test 128998' }, function (error, tweets, response) {
            // var r = JSON.parse(JSON.stringify(tweets));
            // console.log(r.statuses[0].text);
            resolve(tweets);
        });
    });
}

function Responder(q, id) {
    return new Promise(resolve => {
        var res = {
            status: q,
            in_reply_to_status_id: '' + id
        };

        cliente.post('statuses/update', res,
            function (err, data, response) {
                resolve(data.id_str);
            }
        );
    })
}

function GetUrl(genre) {
    return new Promise(resolve => {
        const Http = new XMLHttpRequest();
        //const url = 'https://api.themoviedb.org/3/discover/movie?api_key=a14057df1b919c8d534bd28011b0127d&language=es&page=' + page + '&with_genres=' + genre;
        //'page=' + page,
        var params = [
            'api_key=a14057df1b919c8d534bd28011b0127d',
            'language=es',
            'with_genres=' + genre
        ];
        const url = 'https://api.themoviedb.org/3/discover/movie?' + params.join('&');
        Http.open("GET", url);
        Http.send();

        Http.onload = function () {
            var r = JSON.parse((Http.responseText));
            // console.log(r.results[0].title);
            resolve({
                total: r.total_pages,
                url: url
            });
        }
    })
}

function LeerPelicula(url, page) {
    return new Promise(resolve => {
        const Http = new XMLHttpRequest();
        url += '&page=' + page;
        Http.open("GET", url);
        Http.send();

        Http.onload = function () {
            var r = JSON.parse((Http.responseText));
            // console.log(r.results[0].title);
            resolve(r.results);
        }
    })
}

function ListaGeneros() {
    return new Promise(resolve => {
        const Http = new XMLHttpRequest();
        const url = '    https://api.themoviedb.org/3/genre/movie/list?api_key=a14057df1b919c8d534bd28011b0127d&language=es';
        Http.open("GET", url);
        Http.send();

        Http.onload = function () {
            resolve(Http.responseText);
        }
    })
}

async function ObtenerGeneros() {
    result = await ListaGeneros();
    // console.log(result);
    generos = JSON.parse(result);
    // console.log(generos.genres[0].id);
}


async function download(uri, filename) {
    return new Promise(resolve => {
        request.head(uri, function (err, res, body) {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', function () {
                resolve(true);
            });
        });
    })
};

function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}