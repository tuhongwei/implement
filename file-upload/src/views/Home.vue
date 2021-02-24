<template>
   <div>
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">上传</el-button>
  </div>

</template>

<script>
import { Button } from 'element-ui';

const SIZE = 10 * 1024 * 1024; // 切片大小


export default {
  data: () => ({
    container: {
      file: null
    }
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
    createFileChunk (file, size = SIZE) {
      const fileChunkList = [];
      let cur = 0;
      while (cur < file.size) {
        fileChunkList.push({
          file: file.slice(cur, cur + size),
        });
        cur += size;
      }
      return fileChunkList;
    },
    async handleUpload () {
      if (!this.container.file) return;
      const fileChunkList = this.createFileChunk(this.container.file);
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
        return this.reuqest({
          url: 'http://localhost:3000',
          data: formData
        });
      });
      Promise.all(reuqestList);
    }
  }
};
</script>
