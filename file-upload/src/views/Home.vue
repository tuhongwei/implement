<template>
   <div>
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">上传</el-button>
    <div>
      <div>计算文件 hash</div>
      <el-progress :text-inside="true" :stroke-width="24" :percentage="hashPercentage"></el-progress>
      <div>总进度</div>
      <!-- <el-progress :percentage="fakeUploadPercentage"></el-progress> -->
    </div>
  </div>

</template>

<script>
import { Button } from 'element-ui';

const SIZE = 10 * 1024 * 1024; // 切片大小


export default {
  data: () => ({
    container: {
      file: null
    },
    hashPercentage: 0,
    fakeUploadPercentage: 0,
    data: []
  }),
  methods: {
    reuqest ({ url, method = 'post', data, headers, reuqestList }) {
      return new Promise (resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        for (let key in headers) {
          xhr.setRequestHeader(key, headers[key])
        }
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) {
            resolve({ data: xhr.response });
          }
        };
        xhr.send(data);
      });
    },
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      Object.assign(this.$data, this.$options.data());
      this.container.file = file;

    },
    createFileChunk (file) {
      const fileChunkList = [];
      let cur = 0;
      while (cur < file.size) {
        fileChunkList.push({
          file: file.slice(cur, cur + SIZE),
        });
        cur += SIZE;
      }
      return fileChunkList;
    },
    async handleUpload () {
      if (!this.container.file) return;
      const fileChunkList = this.createFileChunk(this.container.file);
      this.container.hash = await this.calculateHash(fileChunkList);
      this.data = fileChunkList.map(({ file }, index) => {
        return {
          chunk: file,
          hash: this.container.file.name + '-' + index
        };
      });
      await this.uploadChunks();
    },
    async uploadChunks () {
      const reuqestList = this.data.map(async ({ chunk, hash }) => {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('hash', hash);
        formData.append('fileName', this.container.file.name);
        formData.append('fileHash', this.container.hash);
        return this.reuqest({
          url: 'http://localhost:3000',
          data: formData
        });
      });
      await Promise.all(reuqestList);
      await this.postMergeRequest();
    },
    // 通知服务端合并请求
    async postMergeRequest () {
      this.reuqest({
        url: 'http://localhost:3000/merge',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          size: SIZE,
          fileHash: this.container.hash,
          fileName: this.container.file.name
        })
      });
    },
    // 用web-worker生成文件hash值
    calculateHash (fileChunkList) {
      return new Promise (resolve => {
        const worker = new Worker('/generate-hash.js');
        worker.postMessage({ fileChunkList, fileSize: this.container.file.size });
        worker.onmessage = e => {
          const { percentage, hash } = e.data;
          this.hashPercentage = percentage;
          hash && (resolve(hash));
        };
      });
    }
  }
};
</script>
