var fs = require("fs");
var path = require("path");
var Canvas = require("canvas");

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
  return path.join(__dirname, "/", name);
}

async function TextToImg(title, resumen, nombreArchivo, withTitle = true) {
  return new Promise(async (resolve) => {
    cantResumes = 0;
    Canvas.registerFont(fontFile("arial.ttf"), { family: "arial" });

    var line = 0;
    var canvas = Canvas.createCanvas(1280, 1920);
    var ctx = canvas.getContext("2d");

    var Image = Canvas.Image;
    var img = new Image();
    img.src = "molde_resumen.jpg";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff4902";
    ctx.textAlign = "center";

    var lineTitle = 0;
    if (withTitle) {
      ctx.textBaseline = "middle";
      ctx.font = "60pt arial";

      var newTitle = "";
      var arrTitle = title.split(" "),
        i;

      for (let i = 0; i < arrTitle.length; i++) {
        var newTitle2 = newTitle + arrTitle[i] + " ";
        if (ctx.measureText(newTitle2).width > 1100) {
          newTitle += "\n" + arrTitle[i] + " ";
          lineTitle++;
        } else newTitle = newTitle2;
      }

      ctx.fillText(newTitle, canvas.width / 2, 230);
    }
    ctx.fillStyle = "black";
    ctx.font = "50pt arial";

    var arr = resumen.split(" "),
      i;

    var newRes = "";
    for (let i = 0; i < arr.length; i++) {
      var newRes2 = newRes + arr[i] + " ";
      if (ctx.measureText(newRes2).width > 1000) {
        var maxLines = 19;
        if (withTitle) maxLines = 17 - lineTitle;
        if (line == maxLines) {
          cantResumes++;
          if (cantResumes < 3) {
            await TextToImg(
              "",
              arr.slice(i, arr.length).join(" "),
              nombreArchivo + "x",
              false
            );
            console.log("Se hizo una nueva");
          }
          break;
        } else {
          newRes += "\n" + arr[i] + " ";
          line++;
        }
      } else newRes = newRes2;
    }

    var pointY = 200;
    if (withTitle) {
      pointY = 350 + 100 * lineTitle;
    }
    ctx.fillText(newRes, canvas.width / 2, pointY);

    canvas
      .createJPEGStream()
      .pipe(fs.createWriteStream(path.join(__dirname, nombreArchivo + ".jpg")))
      .on("finish", resolve);

    console.log("Imagenes creadas");
  });
}

function showInfoTweet(peli) {
  var date = new Date();
  date.setMinutes(date.getMinutes() - 180);
  var current_hour = date.getHours() + ":" + date.getMinutes();
  cantResumes = 0;
  console.log("NEW TWEET AT " + current_hour + "!");
  console.log("FILM: " + peli.original_title);
  console.log("--------------------------------------");
}

module.exports = {
  TextToImg,
  removeResumes,
  showInfoTweet,
};
