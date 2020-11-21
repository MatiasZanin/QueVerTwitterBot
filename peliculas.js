var Helpers = require("./helpers");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require("fs");
var request = require("request");
let generos;

async function Initialize() {
  generos = await ObtenerGeneros();
}

async function ObtenerGeneros() {
  result = await ListaGeneros();
  generos = JSON.parse(result);
  return generos;
}

function ObtenerGenerosDePelicula(peli) {
  var generosPeli = [];
  peli.genre_ids.forEach((g) => {
    generosPeli.push(
      generos.genres.find(function (el) {
        return el.id == g;
      }).name
    );
  });
  return generosPeli;
}

async function ObtenerPelicula() {
  var ranGen = Math.floor(Math.random() * generos.genres.length);
  var gen = generos.genres[ranGen].id;
  var urlAndPages = await GetUrl(gen);
  var ranPage = Math.floor(Math.random() * urlAndPages.total) + 1;
  var listPelis = await LeerPelicula(urlAndPages.url, ranPage);
  var ranPeli = Math.floor(Math.random() * listPelis.length);
  var peli = listPelis[ranPeli];
  if (
    !isASCII(peli.original_title) ||
    !(await downloadPoster(peli)) ||
    !peli.overview
  ) {
    console.log("Pelicula salta, titulo: " + peli.original_title);
    return ObtenerPelicula();
  }

  return peli;
}

function TextoDelTweet(peli, generosPeli) {
  var tituloGeneros =
    peli.original_title +
    " (" +
    peli.release_date.substring(0, 4) +
    ")\n\n Generos: " +
    generosPeli.join(", ");

  if (tituloGeneros.length > 279)
    tituloGeneros = tituloGeneros.substring(0, 279);
  return tituloGeneros;
}

async function downloadPoster(peli) {
  if (peli.poster_path != null && peli.poster_path != "") {
    await download(
      "https://image.tmdb.org/t/p/w500/" + peli.poster_path,
      "image.jpg"
    );
    return true;
  } else {
    console.log("No tenia poster.");
    return false;
  }
}

async function download(uri, filename) {
  return new Promise((resolve) => {
    request.head(uri, function (err, res, body) {
      request(uri)
        .pipe(fs.createWriteStream(filename))
        .on("close", function () {
          resolve(true);
        });
    });
  });
}

function isASCII(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

function ListaGeneros() {
  return new Promise((resolve) => {
    const Http = new XMLHttpRequest();
    const url =
      "    https://api.themoviedb.org/3/genre/movie/list?api_key=a14057df1b919c8d534bd28011b0127d&language=es";
    Http.open("GET", url);
    Http.send();

    Http.onload = function () {
      resolve(Http.responseText);
    };
  });
}

function LeerPelicula(url, page) {
  return new Promise((resolve) => {
    const Http = new XMLHttpRequest();
    url += "&page=" + page;
    Http.open("GET", url);
    Http.send();

    Http.onload = function () {
      var r = JSON.parse(Http.responseText);
      // console.log(r.results[0].title);
      resolve(r.results);
    };
  });
}

function GetUrl(genre) {
  return new Promise((resolve) => {
    const Http = new XMLHttpRequest();
    //const url = 'https://api.themoviedb.org/3/discover/movie?api_key=a14057df1b919c8d534bd28011b0127d&language=es&page=' + page + '&with_genres=' + genre;
    //'page=' + page,
    var params = [
      "api_key=a14057df1b919c8d534bd28011b0127d",
      "language=es",
      "with_genres=" + genre,
      "release_date.gte=1985-01-01",
    ];
    const url =
      "https://api.themoviedb.org/3/discover/movie?" + params.join("&");
    Http.open("GET", url);
    Http.send();

    Http.onload = function () {
      var r = JSON.parse(Http.responseText);
      // console.log(r.results[0].title);
      resolve({
        total: r.total_pages,
        url: url,
      });
    };
  });
}

module.exports = {
  Initialize,
  ObtenerPelicula,
  ObtenerGenerosDePelicula,
  TextoDelTweet,
};
