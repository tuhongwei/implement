import Vue from 'vue'
import App from './App.vue'
import router from './router'

import { Button, Table, TableColumn, progress, Message } from 'element-ui';
Vue.use(Button);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(progress);
Vue.prototype.$message = Message;

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
