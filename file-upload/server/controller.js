const multiparty = require("multiparty");
const path = require("path");
const fse = require("fs-extra");

const UPLOAD_DIR = path.resolve(__dirname, '..', 'target');
const extractExt = filename =>
  filename.slice(filename.lastIndexOf(".")); // 提取后缀名

const resolvePost = req => {
  new Promise(resolve => {
    let chunk = '';
    req.on('data', data => {
      chunk += data;
    });
    req.on('end', () => {
      resolve(JSON.parse(chunk))
    });
  });
};

const mergeFileChunk = (filePath, fileHash, size) => {
  
};

module.exports = class {
  async handleVerifyUpload (req, res) {
    const data = await resolvePost(req);
    const { fileHash, fileName, size } = data;
    const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${extractExt(fileName)}`);
    await mergeFileChunk(filePath, fileHash, size);
    res.end(JSON.stringify({
      code: 0,
      msg: 'file merged success';
    }));
  }
  handleMerge (req, res) {

  }
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
      console.log(chunk, filePath, fse)
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
}