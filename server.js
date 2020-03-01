var Twiter = require('twitter');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs'),
    request = require('request');
var express = require('express');
var path = require('path');
var Canvas = require('canvas');

var cliente = new Twiter({
    consumer_key: 'nv9dX4YecJjKTqpOjlqXXYL85',
    consumer_secret: 'ZkMIMG6AY2Ar25Dej0Q7unCtZHJLn5irGVsDUzgIt9dR5Ex78f',
    access_token_key: '800601329173336065-002deFXp8E3Atx2gGPbfZFFVkgrfskQ',
    access_token_secret: 'PkU8fI57wcj5KcqhyNklDDlN1f5l5lkY9j1n8TTJyl2uO'
});

var generos;
var cantResumes = 0;

console.log("---------------- BOT INICIADO. ----------------");

var app = express();

app.set('port', (process.env.PORT || 5000));

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});


setInterval(Loop, 1800000);
// Loop();
//removeResumes();
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
    else {
        multimedia = false;
        Loop();
        console.log('No tenia poster.');
        return;
    }

    var generosPeli = [];
    peli.genre_ids.forEach(g => {
        generosPeli.push(generos.genres.find(function(el) {
            return el.id == g;
        }).name);
    })

    var tituloGeneros = peli.original_title +
        ' (' + peli.release_date.substring(0, 4) + ')\n\n Generos: ' + generosPeli.join(', ');

    if (tituloGeneros.length > 279)
        tituloGeneros = tituloGeneros.substring(0, 279);

    if (peli.overview)
        await TextToImg(peli.original_title, peli.overview, "resumen");
    else {
        console.log("Pelicula sin resumen");
        Loop();
        return;
    }

    // console.log(resumen);
    var resMedia;
    if (multimedia) {
        //resMedia = await tuitearMedia(tituloGeneros);
        console.log('Tweeteando');
        await TweetMediasAndStatus(tituloGeneros);
    } else {
        console.log("SIN PORTADA");
        Loop();
        return;
    }
    //resMedia = await tuitear(tituloGeneros)

    /* RESUMEN EN TWEETS
    var resumen = ResumeToArray(peli.overview); //.match(/.{1,143}/g);
    var lastTwId = resMedia.id_str;
    if (resumen != null) {
        for (let i = 0; i < resumen.length; i++) {
            lastTwId = await Responder(resumen[i], lastTwId);
        }
    }
    */

    var date = new Date();
    date.setMinutes(date.getMinutes() - 180);
    var current_hour = date.getHours() + ':' + date.getMinutes();
    cantResumes = 0;
    console.log("NEW TWEET AT " + current_hour + "!");
    console.log("FILM: " + peli.original_title);
    console.log("--------------------------------------");


    SearchAndFollow({
        q: 'pelicula',
        count: 50,
        result_type: 'recent'
    });
    console.log("PEOPLE FOLLOWED");
    console.log("--------------------------------------");
    removeResumes();
}

var reqTimer = setTimeout(function wakeUp() {
    request("https://quever-bot.herokuapp.com", function() {
        console.log("WAKE UP DYNO");
    });
    return reqTimer = setTimeout(wakeUp, 1200000);
}, 1200000);

function removeResumes() {
    try {
        fs.unlinkSync("resumen.jpg");
        fs.unlinkSync("resumenx.jpg");
        fs.unlinkSync("resumenxx.jpg");
    } catch (err) {
        //console.log(err);
    }
}

function fontFile(name) {
    return path.join(__dirname, '/', name);
}

//TextToImg("HOLA GENTE COMO ESTAN ESTO ES UN EJEMPLO PARA VER SI ESTA COSA FUNCA XDDD SUSCRIBITE PAPA NO SEAS GATO AH.");

async function TextToImg(title, resumen, nombreArchivo, withTitle = true) {
    return new Promise(async resolve => {
        Canvas.registerFont(fontFile('arial.ttf'), { family: 'arial' });

        var line = 0;
        var canvas = Canvas.createCanvas(1280, 1920);
        var ctx = canvas.getContext('2d');

        var Image = Canvas.Image;
        var img = new Image();
        img.src = 'molde_resumen.jpg';

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff4902';
        ctx.textAlign = 'center';

        var lineTitle = 0;
        if (withTitle) {
            ctx.textBaseline = 'middle';
            ctx.font = '60pt arial';

            var newTitle = "";
            var arrTitle = title.split(" "),
                i;

            for (let i = 0; i < arrTitle.length; i++) {
                var newTitle2 = newTitle + arrTitle[i] + " ";
                if (ctx.measureText(newTitle2).width > 1100) {
                    newTitle += '\n' + arrTitle[i] + " ";
                    lineTitle++;
                } else
                    newTitle = newTitle2;
            }

            ctx.fillText(newTitle, (canvas.width / 2), 230);
        }
        ctx.fillStyle = 'black';
        ctx.font = '50pt arial';

        var arr = resumen.split(" "),
            i;

        var newRes = "";
        for (let i = 0; i < arr.length; i++) {
            var newRes2 = newRes + arr[i] + " ";
            if (ctx.measureText(newRes2).width > 1000) {
                var maxLines = 19;
                if (withTitle)
                    maxLines = 17 - lineTitle;
                if (line == maxLines) {
                    cantResumes++;
                    if (cantResumes < 3) {
                        await TextToImg('', arr.slice(i, arr.length).join(' '), nombreArchivo + "x", false);
                        console.log("Se hizo una nueva");
                    }
                    break;
                } else {
                    newRes += '\n' + arr[i] + " ";
                    line++;
                }
            } else
                newRes = newRes2;
        }

        var pointY = 200;
        if (withTitle) {
            pointY = 350 + 100 * lineTitle;
        }
        ctx.fillText(newRes, (canvas.width / 2), pointY);

        canvas.createJPEGStream().pipe(fs.createWriteStream(path.join(__dirname, nombreArchivo + '.jpg'))).on('finish', resolve);


        console.log('Imagenes creadas');
    });
}

//

function ResumeToArray(resumen) {
    var arr = [];

    while (resumen.length > 276) {
        var trimmed = resumen.substring(0, 276);
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
        cliente.post('media/upload', { media: data }, function(error, media, response) {

            if (!error) {

                // If successful, a media object will be returned.
                // console.log(media);

                // Lets tweet it
                var status = {
                    status: q,
                    media_ids: media.media_id_string // Pass the media id string
                }

                cliente.post('statuses/update', status, function(error, tweet, response) {
                    if (!error) {
                        // console.log(tweet);
                        var jsnTweet = JSON.parse(JSON.stringify(tweet));
                        resolve(jsnTweet);
                    }
                });

            } else {
                console.log(error);
            }
        });
    })
}

async function TweetMediasAndStatus(q) {
    var data = [];

    data.push(fs.readFileSync('image.jpg'));

    try {
        if (fs.existsSync('resumen.jpg')) {
            data.push(fs.readFileSync('resumen.jpg'));
            console.log(' 0');
        }
    } catch (err) {}
    try {
        if (fs.existsSync('resumenx.jpg')) {
            data.push(fs.readFileSync('resumenx.jpg'));
            console.log(' 0');
        }
    } catch (err) {}
    try {
        if (fs.existsSync('resumenxx.jpg')) {
            data.push(fs.readFileSync('resumenxx.jpg'));
            console.log(' 0');
        }
    } catch (err) {}

    var medias = [];
    for (let i = 0; i < data.length; i++) {
        console.log('Data ' + i + ' ' + data[i].length);
        medias.push(await subirMedia(data[i]));
    }

    await tuitearTweetAndMedias(q, medias.join(','));

}

async function subirMedia(data) {
    return new Promise(resolve => {
        cliente.post('media/upload', { media: data }, function(error, media, response) {
            if (!error) {
                resolve(media.media_id_string);
            } else {
                console.log(error);
            }
        });
    })
}

async function tuitearTweetAndMedias(q, ids) {
    return new Promise(resolve => {
        var status = {
            status: q,
            media_ids: ids // Pass the media id string
        }
        cliente.post('statuses/update', status, function(error, tweet, response) {
            if (!error) {
                // console.log(tweet);
                var jsnTweet = JSON.parse(JSON.stringify(tweet));
                resolve(jsnTweet);
            } else {
                console.log(error);
            }
        });
    });
}

//

async function TweetMediaChinked() {
    var data = [];
    data.push(require('fs').readFileSync('image.jpg'));

    // try {
    //     data.push(require('fs').readFileSync('resumen.jpg'));
    // } catch (err) {}
    // try {
    //     data.push(require('fs').readFileSync('resumenx.jpg'));
    // } catch (err) {}

    const mediaType = 'image/gif';
    var medias = [];
    var index = -1;
    for (let i = 0; i < data.length; i++) {
        var mediaSize = data[i].size;
        console.log("CHUNK--------------------------------------");
        var mdata = await initUpload(mediaType, mediaSize);
        var id = mdata.media_id_string;
        console.log(mdata);
        index++;
        await appendUpload(id, data[i], index);
        console.log("CHUNK2--------------------------------------");
        medias.push(id);
    }
    console.log(medias[0]);
    tuitearMedia('Hola', medias[0]);

}

async function tuitearMedia(q, ids) {
    return new Promise(resolve => {
        var status = {
            status: q,
            media_ids: ids
        }
        cliente.post('statuses/update', status, function(error, tweet, response) {
            if (!error) {
                var jsnTweet = JSON.parse(JSON.stringify(tweet));
                resolve(jsnTweet);
            } else {
                console.log(error);
            }
        });
    })
}

function initUpload(mediaType, mediaSize) {
    return new Promise(resolve => {
        return makePost('media/upload', {
            command: 'INIT',
            total_bytes: mediaSize,
            media_type: mediaType,
        }).then(data => resolve(data));
    });
}

function appendUpload(mediaId, mediaData, index) {
    console.log(mediaId);
    return new Promise(resolve => {
        makePost('media/upload', {
            command: 'APPEND',
            media_id: mediaId,
            media: mediaData,
            segment_index: index
        }).then(data => resolve());
    });
}

function finalizeUpload(mediaId) {
    console.log("FINALIZE " + mediaId);
    return makePost('media/upload', {
            Name: 'test',
            command: 'FINALIZE',
            media_id: mediaId
        }).then(data => console.log("LIIIIIIIIIIIISTO"))
        .catch(err => console.log(err));
}

function makePost(endpoint, params) {
    return new Promise((resolve, reject) => {
        cliente.post(endpoint, params, (error, data, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

//

function SearchAndFollow(q) {
    new Promise(resolve => {
        cliente.get('search/tweets', q, function(err, data, response) {
            console.log(data.statuses.length);
            // console.log(response);
            if (!err) {
                for (i = 0; i < data.statuses.length; i++) {
                    Follow(data.statuses[i].user.id);
                }
                resolve(data.statuses);
            } else {
                console.log(err);
            }
        })
    });
}

function Follow(userId) {
    cliente.post('friendships/create', { user_id: userId }, function(err, res) {
        if (err)
            console.log(err);
    })
}

function stremear(q) {
    cliente.stream('statuses/filter', { track: q }, function(stream) {
        stream.on('data', function(tweet) {
            console.log(tweet.text);
        });

        stream.on('error', function(error) {
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
        cliente.get('search/tweets', { q: 'Test 128998' }, function(error, tweets, response) {
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
            function(err, data, response) {
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
            'with_genres=' + genre,
            'release_date.gte=1985-01-01'
        ];
        const url = 'https://api.themoviedb.org/3/discover/movie?' + params.join('&');
        Http.open("GET", url);
        Http.send();

        Http.onload = function() {
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

        Http.onload = function() {
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

        Http.onload = function() {
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
        request.head(uri, function(err, res, body) {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', function() {
                resolve(true);
            });
        });
    })
};

function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}