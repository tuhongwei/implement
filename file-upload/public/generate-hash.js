self.importScripts('/spark-md5.min.js');

self.onmessage = e => {
  const { fileChunkList, fileSize, chunkSize } = e.data;
  const spark = new self.SparkMD5.ArrayBuffer();
  let count = 0;
  let percentage = 0;
  let fileReader = new FileReader();
  fileReader.onload = e => {
    spark.append(e.target.result); // Append array buffer
    count++;
    if (count >= fileChunkList.length) {
      self.postMessage({
        percentage: 100,
        hash: spark.end()
      });
      self.close();
    } else {
      loadNext();
    }
  };

  fileReader.onprogress = e => {
    // console.log('计算文件hash进度', (e.loaded + chunkSize * count) / fileSize * 100);
    self.postMessage({
      percentage: (e.loaded + chunkSize * count) / fileSize * 100
    });
  };

  loadNext();

  function loadNext () {
    fileReader.readAsArrayBuffer(fileChunkList[count].file);
  }
}