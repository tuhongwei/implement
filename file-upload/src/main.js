import Vue from 'vue'
import App from './App.vue'
import router from './router'

import { Button } from 'element-ui';
Vue.component(Button.name, Button);

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
