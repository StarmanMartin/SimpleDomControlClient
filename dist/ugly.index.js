var e={d:(t,n)=>{for(var r in n)e.o(n,r)&&!e.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:n[r]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t)},t={};let n;e.d(t,{gM:()=>Y,iV:()=>q,l2:()=>oe,du:()=>u,fB:()=>_,fi:()=>k,on:()=>N,Lf:()=>C,SO:()=>m,hK:()=>E,l0:()=>ie,Mv:()=>le,X$:()=>x});const r=/([^\s,]+)/g,s=/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;function o(){return n||(n=$("body")),n}function i(){return new Promise((function(e){e()}))}function l(e){return(e=(e=e.replace(/[A-Z]/g,(e=>`-${e.toLowerCase()}`))).replace(/[0-9]+/g,(e=>`-${e}`))).replace(/^[-]/g,"")}function a(e){return e.replace(/-./g,(e=>`${e[1].toUpperCase()}`))}const c=(e,t)=>{let n=t,r=Object.getOwnPropertyNames(e.prototype).concat(Object.getOwnPropertySymbols(e.prototype));for(;""!==n.name;)Object.getOwnPropertyNames(n.prototype).concat(Object.getOwnPropertySymbols(n.prototype)).forEach((t=>{t.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/)||r.includes(t)||(r.push(t),Object.defineProperty(e.prototype,t,Object.getOwnPropertyDescriptor(n.prototype,t)))})),n=Object.getPrototypeOf(n)};function h(e,t,n){return $.ajax({url:t,type:n||"POST",xhr:function(){var e=$.ajaxSettings.xhr();return e.upload&&e.upload.addEventListener("progress",d,!1),e},data:e,cache:!1,contentType:!1,processData:!1,beforeSend:function(e,t){(function(e){return/^(GET|HEAD|OPTIONS|TRACE)$/.test(e)})(t.type)||this.crossDomain||e.setRequestHeader("X-CSRFToken",window.CSRF_TOKEN)}})}function d(e){if(e.lengthComputable){var t=Math.round(e.loaded/e.total*100),n=$(".progress-container");100===t?n.hide():n.show(),t+="%",n.find(".progress-bar").css({width:t}).text(t)}}function u(e,t=null){return"string"!=typeof e?e:t&&void 0!==t[e]?"function"==typeof t[e]?t[e].bind(t):t[e]:e.match(/^(true|false)$/)?"true"===e:"undefined"!==e?"none"===e.toLowerCase()?null:e.match(/^-?\d+$/)?parseInt(e):e.match(/^-?\d+\.?\d+$/)?parseFloat(e):e.match(/^(['][^']*['])|(["][^"]*["])$/)?e.substr(1,e.length-2):e:void 0}function f(){return([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,(e=>(e^crypto.getRandomValues(new Uint8Array(1))[0]&15>>e/4).toString(16)))}function _(e){e.find(".has-error").removeClass("has-error").find(".alert-danger").remove(),e.find(".non-field-errors").remove()}function m(e,t){t=$("<div>").append(t),e.find(".has-error").removeClass("has-error").find(".alert-danger").safeRemove(),e.find(".non-field-errors").safeRemove();let n=t.find("input[type=file]").parent();e.find("input[type=file]").parent().each((function(e){$(this).replaceWith(n[e])}));let r=0===t.find(".non-field-errors").insertAfter(e.find(".hidden-form-fields")).length;return t.find(".has-error").each((function(){r=!1;let t=$(this),n=t.data("auto-id"),s=e.find(".form-group."+n);s.addClass("has-error"),s.find(".form-input-container").append(t.find(".alert-danger"))})),r}function p(e,t,n=null){let r=function(e,t){let n;e||(e=[]);let r=t.data(),s={};for(let t in r)r.hasOwnProperty(t)&&t!==F&&!e.includes(t)&&(s[t]=r[t]);n=[];for(let t=0;t<e.length;t++){let s=e[t];r.hasOwnProperty(s)?n.push(r[s]):n.push("undefined")}return n.push(s),n}(e,t);return function(e,t=null){let n=[];for(let r=0;r<e.length;r++){let s=u(e[r],t);n.push(s)}return n}(r,n)}function g(e,t,n){if(!e)return!1;if("function"!=typeof e.onInit)return!1;let o;var i;"function"==typeof e._on_init_params?o=e._on_init_params():o=(i=e.onInit.toString().replace(s,"")).slice(i.indexOf("(")+1,i.indexOf(")")).match(r)||[];let l=p(o,t,n._parentController);if(e.onInit.apply(n,l),n===e)for(let r in e._mixins)g(e._mixins[r],t,n)}let y={},v={};function w(){return Object.keys(v)}function O(e,t){if(e){let n=a(t._tagName);e._childController[n]||(e._childController[n]=[]),e._childController[n].push(t)}return t._parentController=e}function b(e,t,n,r){let s=[];r=function(e,t){e=(e=e.concat(v[t][1])).filter(((e,t,n)=>n.indexOf(e)===t));let n=!0;for(;n;){n=!1;for(let t of e)for(let r of v[t][1])e.includes(r)||(e.push(r),n=!0)}return e}(r,n);for(let e of r)s.push(v[e][0]);let o=new(function(e,...t){let n=class{constructor(...n){let r={};t.forEach((e=>{let t;Object.assign(this,t=new e),t._tagName=e.prototype._tagName,t._isMixin=!0,r[e.name]=t})),Object.assign(this,new e),this._mixins=r}get mixins(){return this._mixins}};return c(n,e),t.forEach((e=>{c(n,e)})),n}(v[n][0],...s));return o._tagName=n,O(e,o),o.$container=t,function(e,t){g(t,e,t)}(t,o),o}function k(e,t,n,r){let s=a(n);if(y[s]){let n=y[s];return O(e,n),n.$container=t,n}return b(e,t,n,r)}function C(e){const t=function(e){return function(e){let t={args:{}};return e.contentUrl&&(t=A(e,e.contentUrl),e.contentUrl=t.url),Promise.all([T(e.contentUrl,t.args,e._tagName,e.contentReload)]).then((function(e){let t=e[0];return t?$(t):null}))}(e).then((t=>!e.onLoad||e._onLoadDone?t:(e._onLoadDone=!0,(e.onLoad(t)||i()).then((()=>t)))))}(e).then((function(t){return function(e,t){return I(e,t).then((function(t){if(t=t||!0,e.willShow){let n=e.willShow();if(n instanceof Promise)return n.then((function(){return t}))}return t}))}(e,t)})).then((()=>function(e){return e.refresh&&e.refresh()}(e))).catch((function(t){return I(e,t)}));return e.load_async?Promise.resolve():t}let P={},S={};function N(e,t){return E(e),S.hasOwnProperty(e)?t[S[e]]?void P[e].push(t):console.log("No event handler: "+e,t):console.log("No event: "+e,t)}function E(e,t){t||(t=e),S[e]||(S[e]=t,P[e]=[])}function q(e){for(let t in P)if(P.hasOwnProperty(t))for(let n=P[t].length;n>=0;n--)e===P[t][n]&&P[t].splice(n,1)}function x(e){let t=Array.apply(null,arguments);if(e=t.shift(),!P.hasOwnProperty(e)||!S.hasOwnProperty(e))return i();let n=P[e],r=S[e],s=[];for(let e=0;e<n.length;e++){let o=n[e][r].apply(n[e],t);void 0!==o&&s.push(o)}return Promise.all(s)}let R={};const F="_controller_",M="_sdc_controller_";function j(e,t,n){if(!e)return[];let r=e.children(),s=[];return r.each((function(e,r){let o=$(r),i=o.prop("tagName").toLowerCase().split("_");$.inArray(i[0],t)>=0?s.push({tag:i[0],super:i.splice(1)||[],dom:o}):i[0].startsWith("this.")?o.addClass(`_bind_to_update_handler sdc_uuid_${n._uuid}`):s=s.concat(j(o,t,n))})),s}function T(e,t,n,r){return e?R[n]?Promise.resolve(R[n]):(t.VERSION=oe.VERSION,t._method="content",$.get(e,t).then((function(e){return r||(R[n]=e),e})).catch((function(e){if(x("navLoaded",{controller_name:()=>e.status}),301===e.status)throw x("onNavLink",e.responseJSON["url-link"]),"<sdc-error data-code='403'></sdc-error>";throw`<sdc-error data-code="${e.status}">${e.responseText}</sdc-error>`}))):Promise.resolve(!1)}function L(e,t){return t=t||e.data(F),G(oe.tagNames,e,t)}function A(e){let t=e.contentUrl;if(e&&0===e._urlParams.length){let n,r=/%\(([^)]+)\)\w/gm;for(e._urlParams=[];n=r.exec(t);)e._urlParams.push(n[1]),e.contentReload=!0}let n=function(e,t){return p(e._urlParams,t)}(e,e.$container);return e._urlParams.length&&(t=function(e,t,n){for(let r in e._urlParams)if(e._urlParams.hasOwnProperty(r)){let s=e._urlParams[r],o=RegExp("%\\("+s+"\\)\\w","gm");t=t.replace(o,""+n.shift())}return t}(e,t,n)),e.parsedContentUrl=t,{url:t,args:n[n.length-1]}}function U(e){return e.hasClass(M)?e.data(`${F}`):e.closest(`.${M}`).data(`${F}`)}function D(e,t,n,r){let s=e.data(F);return s?L(e,s):(s=k(r,e,t,n),e.data(F,s),e.addClass(M),C(s))}function I(e,t){if(t&&t.length>0){e.$container.empty(),e.$container.attr(e._tagName,"");for(let t in e._mixins)e.$container.attr(e._mixins[t]._tagName,"");e.$container.append(t)}return L(e.$container,e)}function G(e,t,n){return new Promise((r=>{let s=j(t,e,n),o=s.length;if(0===o)return r();for(let e=0;e<s.length;e++)D(s[e].dom,s[e].tag,s[e].super,n).then((()=>{if(o--,0===o)return r()}))}))}function J(e){return V(e,e.$container)}function V(e,t){const n=[];return t.find(`._bind_to_update_handler.sdc_uuid_${e._uuid}`).each((function(){const t=$(this);let r;if(t.hasClass("_with_handler"))r=t.data("handler");else{let t=this.tagName.toLowerCase().replace(/^this./,"");e[t]&&(r=e[t])}void 0!==r&&("function"==typeof r&&(r=r.bind(e)(t.data())),n.push(Promise.resolve(r).then((n=>{const r=$("<div></div>");return r.append(n),G(w(),r,e).then((()=>V(e,r).then((()=>(t.safeEmpty().text("").append(n),!0)))))}))))})),Promise.all(n)}let B=!1,W=!1,K=null;const X=25e3;let z={};function H(){return W=!0,new Promise((e=>{K="https:"===window.location.protocol?new WebSocket(`wss://${window.location.host}/sdc_ws/ws/`):new WebSocket(`ws://${window.location.host}/sdc_ws/ws/`),K.onmessage=function(e){let t=JSON.parse(e.data);if(t.is_error)oe.Global.sdcAlertMessenger&&(t.msg||t.header)&&oe.Global.sdcAlertMessenger.pushErrorMsg(t.header||"",t.msg||""),z[t.id]&&(z[t.id][1](t.data),delete z[t.id]);else if(oe.Global.sdcAlertMessenger&&(t.msg||t.header)&&oe.Global.sdcAlertMessenger.pushMsg(t.header||"",t.msg||""),t.type&&"sdc_recall"===t.type)z[t.id]&&(z[t.id][0](t.data),delete z[t.id]);else if(t.type&&"sdc_event"===t.type){let e=t.event;e&&x(e,t.payload)}else t.type&&"sdc_redirect"===t.type&&x("onNavLink",t.link)},K.onclose=function(){console.error("SDC Socket closed unexpectedly"),B=!1;for(const[e,t]of Object.entries(z))t[1]({}),delete z[e];setTimeout((()=>{H()}),1e3)},K.onerror=function(e){if(console.error("Socket encountered error: ",e.message,"Closing socket"),B)try{K.close()}catch(e){}},K.onopen=function(){B=!0,W=!1,e()}}))}function Z(){return new Promise((e=>B?e():W?void setTimeout((()=>{Z().then((()=>{e()}))}),200):e(H())))}class Q{constructor(e,t={}){this.values_list=[],this.values={},this.model_name=e,this.model_query=t,this._is_connected=!1,this._is_conneting_process=!1,this._auto_reconnect=!0,this.socket=null,this.open_request={},this.on_update=()=>{},this.on_create=()=>{},this.form_id=f()}[Symbol.iterator](){let e=0;return{next:function(){return e<this.values_list?(++e,{value:this.values_list[e],done:!1}):{value:null,done:!0}}}}byPk(e){if(null!==e){let t=this.values_list.find((t=>t.pk===e));return t||(t={pk:e},this.values_list.push(t)),t}return{pk:e}}filter(e){return this.model_query=Object.assign({},this.model_query,e),this}load(){return this.isConnected().then((()=>{const e=f();return new Promise(((t,n)=>{this.socket.send(JSON.stringify({event:"model",event_type:"load",event_id:e,args:{model_name:this.model_name,model_query:this.model_query}})),this.open_request[e]=[t,n]}))}))}listView(e={},t=null,n=null){let r=$('<div class="container-fluid">');return this.isConnected().then((()=>{const s=f();new Promise(((o,i)=>{this.socket.send(JSON.stringify({event:"model",event_type:"list_view",event_id:s,args:{model_name:this.model_name,model_query:this.model_query,filter:e}})),this.open_request[s]=[e=>{r.append(e.html),oe.refresh(r),t&&t(e),o(e)},e=>{n&&n(e),i(e)}]}))})),r}detailView(e=-1,t=null,n=null){let r,s=$('<div class="container-fluid">');return r=0!==this.values_list.length?this.isConnected():this.load(),r.then((()=>{-1===e&&(e=this.values_list[0].pk);const r=f();new Promise(((o,i)=>{this.socket.send(JSON.stringify({event:"model",event_type:"detail_view",event_id:r,args:{model_name:this.model_name,model_query:this.model_query,pk:e}})),this.open_request[r]=[e=>{s.append(e.html),oe.refresh(s),t&&t(e),o(e)},e=>{n&&n(e),i(e)}]}))})),s}syncFormToModel(e){return this.syncForm(e)}syncModelToForm(e){e&&e.hasClass(this.form_id)||(e=$(`.${this.form_id}`));let t=this;e.each((function(){if(!this.hasAttribute("data-model_pk"))return;let e=$(this).data("model_pk"),n=t.byPk(e);for(let e of this.elements){let t=e.name;if(t&&""!==t)if("checkbox"===e.type)e.checked=n[t];else if("file"===e.type&&n[t]instanceof File){let t=new DataTransfer;t.items.add(file),e.files=t}else $(e).val(n[t])}}))}syncForm(e){e&&e.hasClass(this.form_id)||(e=$(`.${this.form_id}`));const t=this;let n=[];return e.each((function(){let e=$(this).data("model_pk"),r=t.byPk(e);for(let e of this.elements){let t=e.name;t&&""!==t&&("hidden"===e.type?r[t]=(s=$(e).val()).toLowerCase().match(/^(true|false)$/)?"true"===s.toLowerCase():"undefined"!==s?"none"===s.toLowerCase()?null:s.match(/^-?\d+$/)?parseInt(s):s.match(/^-?\d+\.?\d+$/)?parseFloat(s):s.match(/^(['][^']*['])|(["][^"]*["])$/)?s.substring(1,s.length-1):s:void 0:"checkbox"===e.type?r[t]=e.checked:"file"===e.type?r[t]=e.files[0]:r[t]=$(e).val())}var s;return n.push(r),r})),this.values_list.length<=1&&n.length>0&&(this.values=n.at(-1)),n}createForm(e=null,t=null){let n=$('<div class="container-fluid">');return this.isConnected().then((()=>{const r=f();new Promise(((s,o)=>{this.socket.send(JSON.stringify({event:"model",event_type:"create_form",event_id:r,args:{model_name:this.model_name,model_query:this.model_query}})),this.open_request[r]=[t=>{n.append(t.html);let r=n.closest("form").addClass(`sdc-model-create-form sdc-model-form ${this.form_id}`).data("model",this).data("model_pk",null);r[0].hasAttribute("sdc_submit")||r.attr("sdc_submit","submitModelForm"),oe.refresh(n),e&&e(t),s(t)},e=>{t&&t(e),o(e)}]}))})),n}editForm(e=-1,t=null,n=null){let r;r=0!==this.values_list.length?this.isConnected():this.load();let s=$('<div  class="container-fluid">');return r.then((()=>{e<=-1&&(e=this.values_list.at(e).pk);const r=f();new Promise(((o,i)=>{this.socket.send(JSON.stringify({event:"model",event_type:"edit_form",event_id:r,args:{model_name:this.model_name,model_query:this.model_query,pk:e}})),this.open_request[r]=[n=>{s.append(n.html);let r=s.closest("form").addClass(`sdc-model-edit-form sdc-model-form ${this.form_id}`).data("model",this).data("model_pk",e);r[0].hasAttribute("sdc_submit")||r.attr("sdc_submit","submitModelForm"),oe.refresh(s),t&&t(n),o(n)},e=>{n&&n(e),i(e)}]}))})),s}new(){return new Promise(((e,t)=>{const n=$("<form>").append(this.createForm((()=>{this.syncFormToModel(n),e()}),t))}))}save(e=-1){return this.isConnected().then((()=>{let t;t=e>-1?[this.byPk(e)]:this.values_list;let n=[];return t.forEach((e=>{const t=f();n.push(new Promise(((n,r)=>{this._readFiles(values).then((s=>{this.socket.send(JSON.stringify({event:"model",event_type:"save",event_id:t,args:{model_name:this.model_name,model_query:this.model_query,data:e,files:s}})),this.open_request[t]=[e=>{let t=JSON.parse(e.data.instance);this._parseServerRes(t),n(e)},r]}))})))})),Promise.all(n)}))}create(e=this.values){const t=f();return this.isConnected().then((()=>new Promise(((n,r)=>{this._readFiles(e).then((s=>{this.socket.send(JSON.stringify({event:"model",event_type:"create",event_id:t,args:{model_name:this.model_name,model_query:this.model_query,data:e,files:s}})),this.open_request[t]=[e=>{let t=JSON.parse(e.data.instance);this._parseServerRes(t),n(e)},r]}))}))))}delete(e=-1){-1===e&&(e=this.values?.pk);const t=f();return this.isConnected().then((()=>new Promise(((n,r)=>{this.socket.send(JSON.stringify({event:"model",event_type:"delete",event_id:t,args:{model_name:this.model_name,model_query:this.model_query,pk:e}})),this.open_request[t]=[n,r]}))))}isConnected(){return new Promise(((e,t)=>{if(this._is_connected)e();else if(this._is_conneting_process){const[n,r]=this.open_request._connecting_process;this.open_request._connecting_process=[()=>{n(),e()},()=>{r(),t()}]}else this._is_conneting_process=!0,this.open_request._connecting_process=[()=>{},()=>{}],this._connectToServer().then((()=>{e(this._checkConnection())}))}))}close(){this.socket&&(this._auto_reconnect=!1,this.socket.onclose=()=>{},this.socket.close(),delete this.socket)}clean(){return this.values_list=[],this.values={},this}_readFiles(e){let t=[],n={};for(const[r,s]of Object.entries(e))s instanceof File&&t.push(new Promise(((e,t)=>{((r,s)=>{let o=new FileReader;o.onload=o=>{const i=f();this.open_request[i]=[e,t];let l=o.target.result,a=parseInt(Math.ceil(l.length/X));n[r]={id:i,file_name:s.name,field_name:r,content_length:s.size};for(let e=0;e<a;++e)this.socket.send(JSON.stringify({event:"model",event_type:"upload",event_id:i,args:{chunk:l.slice(X*e,X*(e+1)),idx:e,number_of_chunks:a,file_name:s.name,field_name:r,content_length:s.size,content_type:s.type,model_name:this.model_name,model_query:this.model_query}}))},o.onerror=()=>{t()},o.readAsBinaryString(s)})(r,s)})));return Promise.all(t).then((()=>n))}_onMessage(e){let t=JSON.parse(e.data);if(t.is_error)this.open_request.hasOwnProperty(t.event_id)&&(this.open_request[t.event_id][1](t),delete this.open_request[t.event_id]),oe.Global.sdcAlertMessenger&&(t.msg||t.header)&&oe.Global.sdcAlertMessenger.pushErrorMsg(t.header||"",t.msg||""),"connect"===t.type&&(this.open_request._connecting_process[1](t),delete this.open_request._connecting_process,this._auto_reconnect=!1,this.socket.close());else{if(oe.Global.sdcAlertMessenger&&(t.msg||t.header)&&oe.Global.sdcAlertMessenger.pushMsg(t.header||"",t.msg||""),"connect"===t.type)this._is_connected=!0,this._is_conneting_process=!1,this.open_request._connecting_process[0](t),delete this.open_request._connecting_process;else if("load"===t.type){const e=JSON.parse(t.args.data);this.values_list=[],this._parseServerRes(e)}else if("on_update"===t.type||"on_create"===t.type){const e=JSON.parse(t.args.data);let n,r=this._parseServerRes(e);n="on_create"===t.type?this.on_create:this.on_update,n(r)}this.open_request.hasOwnProperty(t.event_id)&&(this.open_request[t.event_id][0](t),delete this.open_request[t.event_id])}}_connectToServer(){return new Promise((e=>{const t=`${this.model_name}`+(this.model_id>0?`/${this.model_id}`:"");"https:"===window.location.protocol?this.socket=new WebSocket(`wss://${window.location.host}/sdc_ws/model/${t}`):this.socket=new WebSocket(`ws://${window.location.host}/sdc_ws/model/${t}`),this.socket.onmessage=this._onMessage.bind(this),this.socket.onclose=e=>{console.error(`SDC Model (${this.model_name}, ${this.model_id}) Socket closed unexpectedly`),this._is_connected=!1;for(const[t,n]of Object.entries(this.open_request))n[1](e);this.open_request={},setTimeout((()=>{this._auto_reconnect&&this._connectToServer().then((()=>{}))}),1e3)},this.socket.onerror=e=>{if(console.error(`Model Socket encountered error: ${e} Closing socket`),this._is_connected)try{this.socket.close()}catch(e){}},this.socket.onopen=()=>{e()}}))}_checkConnection(){const e=f();return new Promise(((t,n)=>{this.socket.send(JSON.stringify({event:"model",event_type:"connect",event_id:e,args:{model_name:this.model_name,model_query:this.model_query}})),this.open_request[e]=[t,n]}))}_parseServerRes(e){let t=[];for(let n of e){const e=n.pk,r=this.byPk(e);for(const[e,t]of Object.entries(n.fields))r[e]=t;t.push(r)}return 1===this.values_list.length?this.values=this.values_list.at(-1):this.values={},t}}class Y{constructor(){this._uuid=f(),this.contentUrl="",this.contentReload=!1,this.hasSubnavView=!1,this.events=[],this.load_async=!1,this.isEventsSet=!1,this._allEvents=null,this._urlParams=[],this._models=[],this._cssUrls=[],this.afterShow=()=>{console.warn("afterShow is deprecated!!")},this._mixins={},this._tagName="",this._childController={},this._parentController=null,this._onLoadDone=!1,this.$container=null,this._isMixin=!1}_runLifecycle(e,t){oe.DEBUG&&console.debug(e,this._tagName);let n=[];if(!this._isMixin){this._isMixin=!0;for(let r in this._mixins){let s=this._mixins[r];"function"==typeof s[e]&&n.push(s[e].apply(this,t))}return Promise.all(n).then((()=>{this._isMixin=!1}))}}onInit(){oe.DEBUG&&console.DEBUG(Array.apply(null,arguments),this._tagName)}onLoad(){return this._runLifecycle("onLoad",arguments)}willShow(){return this._runLifecycle("willShow",arguments)}onRefresh(){return this._runLifecycle("onRefresh",arguments)}onRemove(){return this._runLifecycle("onRemove",arguments),!0}remove(){for(const e of this._models)e.close();let e=this._childController;for(let t in e)if(e.hasOwnProperty(t))for(let n of e[t])if(!n.remove())return!1;if(!this.onRemove||this.onRemove()){q(this);const e=a(this._tagName);if(this._parentController._childController[e]){let t=this._parentController._childController[e];for(let e=0;e<t.length;e++)t[e]===this&&t.splice(e,1)}return this.$container.remove(),!0}return!1}controller_name(){return this._tagName.replace(/-./g,(e=>` ${e[1].toUpperCase()}`)).replace(/^./g,(e=>`${e.toUpperCase()}`))}addEvent(e,t,n){this.getEvents(),this._allEvents[e]=this._allEvents[e]||{},this._allEvents[e][t]=n}getEvents(){if(this._allEvents)return this._allEvents;let e=[];e=e.concat(this.events);for(let t in this._mixins){let n=this._mixins[t];Array.isArray(n.events)&&(e=e.concat(n.events))}return this._allEvents=Object.assign({},...e)}post(e,t){return oe.post(this,e,t)}get(e,t){return oe.get(this,e,t)}submitForm(e,t,n){return oe.submitFormAndUpdateView(this,e,t,n)}serverCall(e,t){let n=this.contentUrl.match(/sdc_view\/([^/]+)/i);if(n&&!(n.length<2))return function(e,t,n,r){let s=f();return Z().then((()=>{K.send(JSON.stringify({event:"sdc_call",id:s,controller:t,app:e,function:n,args:r}))})),new Promise(((e,t)=>{z[s]=[e,t]}))}(n[1],this._tagName,e,t);console.error("To use the serverCall function the contentUrl must be set: "+this.name)}newModel(e,t={}){let n=new Q(e,t);return this._models.push(n),n}find(e){return this.$container.find(e)}refresh(){return oe.refresh(this.$container,this)}reload(){return oe.reloadController(this)}_submitModelForm(e,t){let n=[];if(!this._isMixin){t.stopPropagation(),t.preventDefault();let r=e.data("model");const s=r.syncForm(e);for(let t of s)n.push(new Promise(((n,s)=>{let o;o=null!==t.pk?r.save(t.pk):r.create(t),o.then((t=>{_(e),n(t)})).catch((t=>{m(e,$(t.html)),s(t)}))})))}return Promise.all(n).then((e=>Object.assign({},...e.flat())))}}const ee=Object.keys(window).filter((e=>/^on/.test(e))).map((e=>e.slice(2)));function te(e){let t=e.type;e.hasOwnProperty("namespace")&&e.namespace&&e.namespace.length&&(t+=`.${e.namespace}`);let n=$(e.target),r=null,s=!1,o=!1;for(e.stopImmediatePropagation=()=>o=!0,e.stopPropagation=()=>o=s=!0;n.length;){let i=n.attr(`sdc_${t}`);if(i){if(!r&&(r=U(n),!r))return;for(;r;){if(i.split(" ").forEach((o=>{if(s)return;let i=null;if("function"==typeof o)i=o;else if("function"==typeof r[o])i=r[o];else if("string"==typeof o&&o.startsWith("this.event_")){if(i=r.getEvents()[t],!i)return;if(i=i[o.slice(11)],!i)return}i&&i.call(r,n,e)})),o)return;r=r._parentController}}if(s)return;n=n.parent()}return{res:!0}}function ne(e){if(e.isEventsSet)return;const t=e.getEvents();for(let n in t)if(t.hasOwnProperty(n)){let r=t[n];for(let t in r)r.hasOwnProperty(t)&&e.find(t).each((function(){let e=$(this),r=e.attr(`sdc_${n}`)||null;r=r?r.split(" "):[];const s=`this.event_${t}`;-1===r.indexOf(s)&&(r.push(s),e.attr(`sdc_${n}`,r.join(" ")))}))}}window.sdcDom=function(e,t,...n){if(!e)return"";const r=function(e,t){let n,r=!1;if("string"==typeof e)n=$(document.createElement(e));else{const t=`this.${e.name}`;n=$(document.createElement(t)),n.data("handler",e),r=!0}return t&&Object.entries(t).forEach((([e,t])=>{e.startsWith("on")?n[0].addEventListener(e.substring(2).toLowerCase(),t):n[0].setAttribute(e,t)})),r&&n.addClass("_bind_to_update_handler _with_handler"),n}(e,t);for(const e of n)r.append(e);return r};let re,se,oe={CSRF_TOKEN:window.CSRF_TOKEN||"",LANGUAGE_CODE:window.LANGUAGE_CODE||"en",DEBUG:window.DEBUG||!1,VERSION:window.VERSION||"0.0",tagNames:[],Global:y,rootController:null,_isInit:!1,init_sdc:()=>{if(!oe._isInit){oe._isInit=!0;const e=$.fn.trigger;$.fn.trigger=function(t){const n={}.hasOwnProperty.call(t,"type")?t.type:t;return ee.includes(n)||(ee.push(n),$(window).on(n,te)),e.call(this,t)},$.fn.safeReplace=function(e){return oe.safeReplace($(this),e)},$.fn.safeEmpty=function(){return oe.safeEmpty($(this))},$.fn.safeRemove=function(){return oe.safeRemove($(this))},Z(),function(){const e=$(window);ee.forEach((t=>{e.on(t,te)}))}(),oe.rootController=oe.rootController||new Y}return oe.tagNames=w(),G(oe.tagNames,o(),oe.rootController)},controllerToTag:e=>l(e.name).replace(/-controller$/,""),registerGlobal:e=>{let t=oe.controllerToTag(e),n=new e;v[t]=[n,[]],n._tagName=t,y[a(t)]=n},cleanCache:()=>{R={}},register:e=>{let t=oe.controllerToTag(e);return v[t]=[e,[]],e.prototype._tagName=t,{addMixin:(...e)=>{for(let n of e){let e;"string"==typeof n?e=l(n):n&&(e=oe.controllerToTag(n)),v[t][1].push(e)}}}},post:(e,t,n)=>(n||(n={}),n.CSRF_TOKEN=oe.CSRF_TOKEN,oe.ajax(e,t,params,$.post)),get:(e,t,n)=>oe.ajax(e,t,n,$.get),ajax:(e,t,n,r)=>{n||(n={}),n.VERSION=oe.VERSION,n._method=n._method||"api";const s=new Promise(((o,i)=>r(t,n).then(((t,n,r)=>{o(t,n,r),"redirect"===t.status?x("onNavLink",t["url-link"]):s.then((()=>{oe.refresh(e.$container)}))})).catch(i)));return s},submitFormAndUpdateView:(e,t,n,r)=>{let s=new FormData(t);const o=e=>{e["url-link"]?x("onNavLink",e["url-link"]):window.location.href=e.url},i=new Promise(((l,a)=>{h(s,n||t.action,r||t.method).then(((t,n,r)=>{l(t,n,r),"redirect"===t.status?o(t):i.then((()=>{oe.refresh(e.$container)}))})).catch(((e,t,n)=>{301===e.status?(e=e.responseJSON,o(e),l(e,t,n)):a(e,t,n)}))}));return i},submitForm:(e,t,n)=>{let r=new FormData(e);return new Promise(((s,o)=>{h(r,t||e.action,n||e.method).then(s).catch(o)}))},getController:e=>U(e),safeEmpty:e=>(e.children().each((function(e,t){let n=$(t);oe.safeRemove(n)})),e),safeReplace:(e,t)=>(t.insertBefore(e),oe.safeRemove(e)),safeRemove:e=>(e.each((function(){let e=$(this);e.data(`${F}`)&&e.data(`${F}`).remove()})),e.find(`.${M}`).each((function(){const e=$(this).data(`${F}`);e&&e.remove()})),e.remove()),reloadController:e=>function(e){if(e.contentUrl){let t=A(e,e.contentUrl);return e.contentUrl=t.url,T(e.contentUrl,t.args,e._tagName,e.contentReload)}return new Promise((e=>{e($())}))}(e).then((t=>{let n=$(t);e._childController={},G(oe.tagNames,n,e).then((()=>{oe.safeEmpty(e.$container),e.$container.append(n),oe.refresh(e.$container,e)}))})),refresh:(e,t)=>{if(t||(t=oe.getController(e)),!t)return i();let n=t,r=[];for(;n;)n.isEventsSet=!1,r.unshift(n),n=n._parentController;return G(oe.tagNames,t.$container,t).then((()=>{J(t).then((()=>{for(let e of r)ne(e);t.onRefresh(e)}))}))}};const ie=function(){if(B){B=!1;try{K.close()}catch(e){}}},le={get_controller:async function(e,t={},n=""){if(!jest)throw new Error("JEST is not defined");re||(se=$.ajax.bind($),re=jest.spyOn($,"ajax"),re.mockImplementation((function(e){return se(e).then((e=>e)).catch((e=>e))}))),o().empty();const r=$(`<${e}>${n}</${e}>`);for(const[e,n]of Object.entries(t))r.data(e,n);const s=$("<div></div>").append(r);return o().append(s),await oe.init_sdc(),oe.getController(r)}};var ae=t.gM,ce=t.iV,he=t.l2,de=t.du,ue=t.fB,fe=t.fi,_e=t.on,me=t.Lf,pe=t.SO,ge=t.hK,ye=t.l0,ve=t.Mv,we=t.X$;export{ae as AbstractSDC,ce as allOff,he as app,de as checkIfParamNumberBoolOrString,ue as clearErrorsInForm,fe as controllerFactory,_e as on,me as runControlFlowFunctions,pe as setErrorsInForm,ge as setEvent,ye as socketReconnect,ve as test_utils,we as trigger};