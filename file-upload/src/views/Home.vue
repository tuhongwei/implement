<template>
   <div>
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">上传</el-button>
    <a href="">222</a>
    <a>
      <span>11</span>
      <input type="text">
    </a>
  </div>

</template>

<script>
import { Button } from 'element-ui';

export default {
  data: () => ({
    container: {
      file: null
    }
  }),
  methods: {
     handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      Object.assign(this.$data, this.$options.data());
      this.container.file = file;
    },
    async handleUpload() {}
  },
  components: {
    Button: Button.name
  }
};
</script>
<style>
  a:focus-within {
    color: red;
  }
</style>
