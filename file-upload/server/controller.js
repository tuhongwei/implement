const multiparty = require("multiparty");
const path = require("path");
const fse = require("fs-extra");

const UPLOAD_DIR = path.resolve(__dirname, '..', 'target');
const extractExt = fileName =>
  fileName.slice(fileName.lastIndexOf(".")); // 提取后缀名

const resolvePost = req => 
  new Promise(resolve => {
    let chunk = '';
    req.on('data', data => {
      chunk += data;
    });
    req.on('end', () => {
      resolve(JSON.parse(chunk))
    });
  });

const pipeStream = (path, writeStream, chunkSize) => 
  new Promise((resolve, reject) => {
    const readStream = fse.createReadStream(path, {
      highWaterMark: chunkSize
    });
    readStream.on('end', () => {
      // fse.unlinkSync(path);
      readStream.unpipe();
      resolve();
    });
    readStream.pipe(writeStream, { end: false });
    readStream.on('error', reject);
  });

const mergeFileChunk = async (fileHash, fileName, chunkSize) => {
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${extractExt(fileName)}`);
  const chunkDir = path.resolve(UPLOAD_DIR, fileHash);
  const chunkPaths = await fse.readdir(chunkDir);
  chunkPaths.sort((a, b) => a.slice(a.lastIndexOf('-') + 1) - b.slice(b.lastIndexOf('-') + 1));
  const writeStream = fse.createWriteStream(filePath);
  await Promise.all(chunkPaths.map((chunkPath, index) =>
    pipeStream(path.resolve(chunkDir, chunkPath), writeStream, chunkSize)
  )).then(() => {
    // close the stream to prevent memory leaks
    writeStream.close();
    return Promise.resolve(filePath);
  })
  // fse.rmdirSync(chunkDir); //  合并完成后删除切片目录
};

module.exports = {
  async handleVerifyUpload (req, res) {
    
  },
  async handleMerge (req, res) {
    const data = await resolvePost(req);
    const { fileHash, fileName, chunkSize } = data;
    await mergeFileChunk(fileHash, fileName, chunkSize);
    res.end(JSON.stringify({
      code: 0,
      msg: 'file merged success'
    }));
  },
  handleFormData (req, res) {
    const form = new multiparty.Form();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.log(err);
        res.status = 500;
        res.end('process file chunk failed');
        return;
      }
      const [chunk] = files.chunk;
      const [hash] = fields.hash;
      const [fileHash] = fields.fileHash;
      const [fileName] = fields.fileName;
      const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${extractExt(fileName)}`);
      const chunkDir = path.resolve(UPLOAD_DIR, fileHash);
      if (fse.pathExistsSync(filePath)) {
        res.end('file exist');
        return;
      }
      if (!fse.pathExistsSync(chunkDir)) {
        await fse.mkdirs(chunkDir);
      }
      await fse.move(chunk.path, path.resolve(chunkDir, hash));
      res.end('received file chunk');
    });
  }
};