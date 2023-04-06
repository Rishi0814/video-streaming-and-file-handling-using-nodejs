const express = require("express");
const app = express();
const port = 4000;
const bodyParser = require("body-parser");
const fs = require("fs");
app.use(bodyParser.json());
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname} - ${Date.now()}.mp4`);
  },
});
const upload = multer({ storage });

app.post("/uploadfile", upload.single("file"), (req, res) => {
  console.log(req.file);
  res.send("uploaded");
});

app.get("/videos/:filename", function (req, res) {
  const path = "./uploads/" + req.params.filename;
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;
  function rangeParser(fileSize, rangeHeader) {
    const range = rangeHeader && rangeHeader.match(/bytes=([0-9]+)-([0-9]*)/);

    if (range) {
      const start = parseInt(range[1], 10);
      let end = range[2] ? parseInt(range[2], 10) : fileSize - 1;
      end = end < fileSize ? end : fileSize - 1;

      return [{ start, end }];
    }

    return [{ start: 0, end: fileSize - 1 }];
  }

  if (range) {
    const parts = rangeParser(fileSize, range);
    const start = parts[0].start;
    const end = parts[0].end;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(path, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
});

app.get("/download", (req, res) => {
  res.download("./uploads/Cvmu_hackathon.mp4");
});
app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
