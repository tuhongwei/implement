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

const pipStream = (path, writeStream) => 
  new Promise(resolve => {
    const readStream = fse.createReadStream(path);
    writeStream.on('finish', () => {
    	writeStream.end();
      fse.unlinkSync(path);
      resolve();
    });
    readStream.pipe(writeStream);
  });

const mergeFileChunk = async (fileHash, fileName, size) => {
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${extractExt(fileName)}`);
  const chunkDir = path.resolve(UPLOAD_DIR, fileHash);
  const chunkPaths = await fse.readdir(chunkDir);
  chunkPaths.sort((a, b) => a.slice(a.lastIndexOf('-') + 1) - b.slice(b.lastIndexOf('-') + 1));
  await Promise.all(chunkPaths.map((chunkPath, index) => 
    pipStream(path.resolve(chunkDir, chunkPath), fse.createWriteStream(filePath, {
      start: index * size
    }))
  ));
  fse.rmdirSync(chunkDir); //  合并完成后删除切片目录
};

module.exports = {
  async handleVerifyUpload (req, res) {
    
  },
  async handleMerge (req, res) {
    const data = await resolvePost(req);
    const { fileHash, fileName, size } = data;
    await mergeFileChunk(fileHash, fileName, size);
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