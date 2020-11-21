var Twitter = require("twitter");
var Server = require("./server");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require("fs"),
  request = require("request");
var express = require("express");
var path = require("path");
var Canvas = require("canvas");
var peliculas = require("./peliculas");
var helpers = require("./helpers");
var twitterService = require("./twitterService");
const { Initialize } = require("./peliculas");

console.log("Hi!");
Loop();

setInterval(Loop, 1800000);

async function Loop() {
  await peliculas.Initialize();
  let peli = await peliculas.ObtenerPelicula();
  let generos = await peliculas.ObtenerGenerosDePelicula(peli);
  let tweetText = peliculas.TextoDelTweet(peli, generos);

  await helpers.TextToImg(peli.original_title, peli.overview, "resumen");

  await twitterService.TweetMediasAndStatus(tweetText);

  helpers.showInfoTweet(peli);

  twitterService.SearchAndFollow({
    q: "pelicula",
    count: 50,
    result_type: "recent",
  });

  helpers.removeResumes();
}

var reqTimer = setTimeout(function wakeUp() {
  request("https://quever-bot.herokuapp.com", function () {
    console.log("WAKE UP DYNO");
  });

  return (reqTimer = setTimeout(wakeUp, 1200000));
}, 2000);
