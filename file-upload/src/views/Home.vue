<template>
   <div>
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload" :disabled="!container.file || curStatus !== STATUS.wait">上传</el-button>
    <el-button @click="handleResume" v-if="curStatus === STATUS.pause">恢复</el-button>
    <el-button v-else :disabled="curStatus !== STATUS.uploading || !container.hash" @click="handlePause">暂停</el-button>
    <div>
      <div>计算文件 hash</div>
      <el-progress :text-inside="true" :stroke-width="24" :percentage="hashPercentage"></el-progress>
      <div>总进度</div>
      <el-progress :percentage="uploadPercentage"></el-progress>
    </div>
    <el-table :data=data>
      <el-table-column prop="hash" label="切片hash" align="center"></el-table-column>
      <el-table-column label="大小(KB)" align="center" width="120">
        <template v-slot="{ row }">
          {{ row.chunk.size | transformByte }}
        </template>
      </el-table-column>
      <el-table-column label="进度" align="center">
        <template v-slot="{ row }">
          <el-progress :percentage="row.percentage" color="#909399"></el-progress>
        </template>
      </el-table-column>
    </el-table>
  </div>

</template>

<script>
import { Button } from 'element-ui';

// const CHUNK_SIZE = 10 * 1024 * 1024; // 切片大小
const CHUNK_SIZE = 10 * 1024;
const STATUS = {
  wait: Symbol('wait'),
  pause: Symbol('pause'),
  uploading: Symbol('uploading')
};

export default {
  data: () => ({
    STATUS: STATUS,
    container: {
      file: null
    },
    hashPercentage: 0,
    fakeUploadPercentage: 0,
    data: [],
    curStatus: STATUS.wait
  }),
  filters: {
    transformByte (val) {
      return Math.round(val / 1024);
    }
  },
  computed: {
    uploadPercentage () {
      if (!this.container.file || !this.data.length) return 0;
      let loaded = this.data.reduce((acc, cur) => acc + cur.chunk.size * cur.percentage, 0);
      return +(loaded / this.container.file.size).toFixed(2);
    }
  },
  methods: {
    async handleResume () {
      this.curStatus = STATUS.uploading;
      const { uploadedList } = await this.verifyUpload();
      await this.uploadChunks(uploadedList);
    },
    handlePause () {
      this.curStatus = STATUS.pause;
      this.resetData();
    },
    resetData () {
      this.requestList.forEach(xhr => xhr.abort());
      this.requestList = [];
      this.container.worker && (this.container.worker.onmessage = null);
    },
    request ({ url, method = 'post', data, headers, onProgress, requestList }) {
      return new Promise (resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        for (let key in headers) {
          xhr.setRequestHeader(key, headers[key])
        }
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) {
            let res = xhr.response;
            if (res && (res = JSON.parse(res))) {
              if (res.code === 0) {
                if (requestList) {
                  const index = requestList.findIndex(item => item === xhr);
                  requestList.splice(index, 1);
                }
                resolve(res.data);
              }
            }
          }
        };
        requestList?.push(xhr);
        xhr.upload.onprogress = onProgress;
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
          file: file.slice(cur, cur + CHUNK_SIZE),
        });
        cur += CHUNK_SIZE;
      }
      return fileChunkList;
    },
    async handleUpload () {
      if (!this.container.file) return;
      this.curStatus = STATUS.uploading;
      const fileChunkList = this.createFileChunk(this.container.file);
      this.container.hash = await this.calculateHash(fileChunkList);

      const { shouldUpload, uploadedList } = await this.verifyUpload();
      if (!shouldUpload) {
        this.$message.success('秒传：上传成功');
        this.curStatus = STATUS.wait;
        return;
      }

      this.data = fileChunkList.map(({ file }, index) => ({
        chunk: file,
        hash: this.container.file.name + '-' + index,
        percentage: 0
      }));
      await this.uploadChunks(uploadedList);
    },
    async verifyUpload () {
      const data = await this.request({
        url: 'http://localhost:3000/verify',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          fileName: this.container.file.name,
          fileHash: this.container.hash
        })
      });
      return data;
    },
    async uploadChunks (uploadedList = []) {
      const requestList = this.data.filter(({ hash }) => !uploadedList.includes(hash)).map(async ({ chunk, hash }, index) => {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('hash', hash);
        formData.append('fileName', this.container.file.name);
        formData.append('fileHash', this.container.hash);
        return this.request({
          url: 'http://localhost:3000',
          data: formData,
          onProgress: this.uploadOnprogressHandler(this.data[index]),
          requestList: this.requestList
        });
      });
      await Promise.all(requestList);
      await this.postMergeRequest();
    },
    uploadOnprogressHandler (item) {
      return e => {
        item.percentage = +(e.loaded / e.total * 100).toFixed(2);
      };
    },
    // 通知服务端合并请求
    async postMergeRequest () {
      await this.request({
        url: 'http://localhost:3000/merge',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          chunkSize: CHUNK_SIZE,
          fileName: this.container.file.name,
          fileHash: this.container.hash
        })
      });
      this.$message.success('上传成功');
      this.curStatus = STATUS.wait;
    },
    // 用web-worker生成文件hash值
    calculateHash (fileChunkList) {
      return new Promise (resolve => {
        const worker = new Worker('/generate-hash.js');
        this.container.worker = worker;
        worker.postMessage({ fileChunkList, fileSize: this.container.file.size, chunkSize: CHUNK_SIZE });
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
