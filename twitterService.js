var Twitter = require("twitter");
var fs = require("fs");

const cliente = new Twitter({
  consumer_key: "nv9dX4YecJjKTqpOjlqXXYL85",
  consumer_secret: "ZkMIMG6AY2Ar25Dej0Q7unCtZHJLn5irGVsDUzgIt9dR5Ex78f",
  access_token_key: "800601329173336065-002deFXp8E3Atx2gGPbfZFFVkgrfskQ",
  access_token_secret: "PkU8fI57wcj5KcqhyNklDDlN1f5l5lkY9j1n8TTJyl2uO",
});

async function TweetMediasAndStatus(q) {
  var data = [];

  data.push(fs.readFileSync("image.jpg"));

  // Si existe cada imagen de resumen, se agrega al array de data a twittear
  try {
    if (fs.existsSync("resumen.jpg")) {
      data.push(fs.readFileSync("resumen.jpg"));
      console.log(" 0");
    }
  } catch (err) {}
  try {
    if (fs.existsSync("resumenx.jpg")) {
      data.push(fs.readFileSync("resumenx.jpg"));
      console.log(" 0");
    }
  } catch (err) {}
  try {
    if (fs.existsSync("resumenxx.jpg")) {
      data.push(fs.readFileSync("resumenxx.jpg"));
      console.log(" 0");
    }
  } catch (err) {}

  // Por cada data, se sube al Stream
  var medias = [];
  for (let i = 0; i < data.length; i++) {
    console.log("Data " + i + " " + data[i].length);
    medias.push(await subirMedia(data[i]));
  }

  await tuitearTweetAndMedias(q, medias.join(","));
}

async function subirMedia(data) {
  return new Promise((resolve) => {
    cliente.post(
      "media/upload",
      { media: data },
      function (error, media, response) {
        if (!error) {
          resolve(media.media_id_string);
        } else {
          console.log(error);
        }
      }
    );
  });
}

async function tuitearTweetAndMedias(q, ids) {
  return new Promise((resolve) => {
    var status = {
      status: q,
      media_ids: ids, // Pass the media id string
    };
    cliente.post("statuses/update", status, function (error, tweet, response) {
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

function SearchAndFollow(q) {
  new Promise((resolve) => {
    cliente.get("search/tweets", q, function (err, data, response) {
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
    });
  });
}

function Follow(userId) {
  cliente.post("friendships/create", { user_id: userId }, function (err, res) {
    if (err) console.log(err);
  });
}

module.exports = {
  TweetMediasAndStatus,
  SearchAndFollow,
};
