var e={d:(t,n)=>{for(var r in n)e.o(n,r)&&!e.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:n[r]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t)},t={};let n;e.d(t,{n$:()=>re,du:()=>q,yA:()=>he,g3:()=>d,u2:()=>m,n9:()=>O,on:()=>E,yy:()=>S,R6:()=>p,$n:()=>R,hA:()=>de,VB:()=>_e,hZ:()=>F});const r=/([^\s,]+)/g,o=/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;function s(){return n||(n=$("body")),n}function i(){return new Promise((function(e){e()}))}function l(e){return(e=(e=e.replace(/[A-Z]/g,(e=>`-${e.toLowerCase()}`))).replace(/[0-9]+/g,(e=>`-${e}`))).replace(/^[-]/g,"")}function a(e){return e.replace(/-./g,(e=>`${e[1].toUpperCase()}`))}const c=(e,t)=>{let n=t,r=Object.getOwnPropertyNames(e.prototype).concat(Object.getOwnPropertySymbols(e.prototype));for(;""!==n.name;)Object.getOwnPropertyNames(n.prototype).concat(Object.getOwnPropertySymbols(n.prototype)).forEach((t=>{t.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/)||r.includes(t)||(r.push(t),Object.defineProperty(e.prototype,t,Object.getOwnPropertyDescriptor(n.prototype,t)))})),n=Object.getPrototypeOf(n)};function u(e,t,n){return $.ajax({url:t,type:n||"POST",xhr:function(){var e=$.ajaxSettings.xhr();return e.upload&&e.upload.addEventListener("progress",h,!1),e},data:e,cache:!1,contentType:!1,processData:!1,beforeSend:function(e,t){(function(e){return/^(GET|HEAD|OPTIONS|TRACE)$/.test(e)})(t.type)||this.crossDomain||e.setRequestHeader("X-CSRFToken",window.CSRF_TOKEN)}})}function h(e){if(e.lengthComputable){var t=Math.round(e.loaded/e.total*100),n=$(".progress-container");100===t?n.hide():n.show(),t+="%",n.find(".progress-bar").css({width:t}).text(t)}}function d(e,t=null){return"string"!=typeof e?e:t&&void 0!==t[e]?"function"==typeof t[e]?t[e].bind(t):t[e]:e.match(/^(true|false)$/)?"true"===e:"undefined"!==e?"none"===e.toLowerCase()?null:e.match(/^-?\d+$/)?parseInt(e):e.match(/^-?\d+\.?\d+$/)?parseFloat(e):e.match(/^(['][^']*['])|(["][^"]*["])$/)?e.substr(1,e.length-2):e:void 0}function f(){return([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,(e=>(e^crypto.getRandomValues(new Uint8Array(1))[0]&15>>e/4).toString(16)))}function m(e){e.find(".has-error").removeClass("has-error").find(".alert-danger").remove(),e.find(".non-field-errors").remove()}function p(e,t){t=$("<div>").append(t),e.find(".has-error").removeClass("has-error").find(".alert-danger").safeRemove(),e.find(".non-field-errors").safeRemove();let n=t.find("input[type=file]").parent();e.find("input[type=file]").parent().each((function(e){$(this).replaceWith(n[e])}));let r=0===t.find(".non-field-errors").insertAfter(e.find(".hidden-form-fields")).length;return t.find(".has-error").each((function(){r=!1;let t=$(this),n=t.data("auto-id"),o=e.find(".form-group."+n);o.addClass("has-error"),o.find(".form-input-container").append(t.find(".alert-danger"))})),r}function g(e,t,n=null){let r=function(e,t){let n;e||(e=[]);let r=t.data(),o={};for(let t in r)r.hasOwnProperty(t)&&t!==T&&!e.includes(t)&&(o[t]=r[t]);n=[];for(let t=0;t<e.length;t++){let o=e[t];r.hasOwnProperty(o)?n.push(r[o]):n.push("undefined")}return n.push(o),n}(e,t);return function(e,t=null){let n=[];for(let r=0;r<e.length;r++){let o=d(e[r],t);n.push(o)}return n}(r,n)}function y(e,t,n){if(!e)return!1;if("function"!=typeof e.onInit)return!1;let s;var i;"function"==typeof e._on_init_params?s=e._on_init_params():s=(i=e.onInit.toString().replace(o,"")).slice(i.indexOf("(")+1,i.indexOf(")")).match(r)||[];let l=g(s,t,n._parentController);if(e.onInit.apply(n,l),n===e)for(let r in e._mixins)y(e._mixins[r],t,n)}let v={},w={};function C(){return Object.keys(w)}function b(e,t){if(e){let n=a(t._tagName);e._childController[n]||(e._childController[n]=[]),e._childController[n].push(t)}return t._parentController=e}function k(e,t,n,r){let o=[];r=function(e,t){e=(e=e.concat(w[t][1])).filter(((e,t,n)=>n.indexOf(e)===t));let n=!0;for(;n;){n=!1;for(let t of e)for(let r of w[t][1])e.includes(r)||(e.push(r),n=!0)}return e}(r,n);for(let e of r)o.push(w[e][0]);let s=new(function(e,...t){let n=class{constructor(...n){let r={};t.forEach((e=>{let t;Object.assign(this,t=new e),t._tagName=e.prototype._tagName,t._isMixin=!0,r[e.name]=t})),Object.assign(this,new e),this._mixins=r}get mixins(){return this._mixins}};return c(n,e),t.forEach((e=>{c(n,e)})),n}(w[n][0],...o));return s._tagName=n,b(e,s),s.$container=t,function(e,t){y(t,e,t)}(t,s),s}function O(e,t,n,r){let o=a(n);if(v[o]){let n=v[o];return b(e,n),n.$container=t,n}return k(e,t,n,r)}function S(e){const t=function(e){return function(e){let t={args:{}};return e.contentUrl&&(t=M(e,e.contentUrl),e.contentUrl=t.url),Promise.all([j(e.contentUrl,t.args,e._tagName,e.contentReload)]).then((function(e){let t=e[0];if(t)try{return $(t)}catch{return $("<div></div>").append(t)}return null}))}(e).then((t=>!e.onLoad||e._onLoadDone?t:(e._onLoadDone=!0,(e.onLoad(t)||i()).then((()=>t)))))}(e).then((function(t){return function(e,t){return J(e,t).then((function(t){if(t=t||!0,e.willShow){let n=e.willShow();if(n instanceof Promise)return n.then((function(){return t}))}return t}))}(e,t)})).then((()=>function(e){return e.refresh&&e.refresh()}(e))).catch((function(t){return J(e,t)}));return e.load_async?Promise.resolve():t}let N={},P={};function E(e,t){return R(e),P.hasOwnProperty(e)?t[P[e]]?void N[e].push(t):console.log("No event handler: "+e,t):console.log("No event: "+e,t)}function R(e,t){t||(t=e),P[e]||(P[e]=t,N[e]=[])}function q(e){for(let t in N)if(N.hasOwnProperty(t))for(let n=N[t].length;n>=0;n--)e===N[t][n]&&N[t].splice(n,1)}function F(e){let t=Array.apply(null,arguments);if(e=t.shift(),!N.hasOwnProperty(e)||!P.hasOwnProperty(e))return i();let n=N[e],r=P[e],o=[];for(let e=0;e<n.length;e++){let s=n[e][r].apply(n[e],t);void 0!==s&&o.push(s)}return Promise.all(o)}let x={};const T="_controller_",A="_sdc_controller_";function L(e,t,n){if(!e)return[];let r=e.children(),o=[];return r.each((function(e,r){let s=$(r),i=s.prop("tagName").toLowerCase().split("_");$.inArray(i[0],t)>=0?o.push({tag:i[0],super:i.splice(1)||[],dom:s}):i[0].startsWith("this.")?s.addClass(`_bind_to_update_handler sdc_uuid_${n._uuid}`):o=o.concat(L(s,t,n))})),o}function j(e,t,n,r){return e?x[n]?Promise.resolve(x[n]):(t.VERSION=he.VERSION,t._method="content",$.get(e,t).then((function(e){return r||(x[n]=e),e})).catch((function(e){throw 301===e.status&&F("_RedirectOnView",e.responseJSON["url-link"]),F("navLoaded",{controller_name:()=>e.status}),`<sdc-error data-code="${e.status}">${e.responseText}</sdc-error>`}))):Promise.resolve(!1)}function I(e,t){return t=t||e.data(T),V(he.tagNames,e,t)}function M(e){let t=e.contentUrl;if(e&&0===e._urlParams.length){let n,r=/%\(([^)]+)\)\w/gm;for(e._urlParams=[];n=r.exec(t);)e._urlParams.push(n[1]),e.contentReload=!0}let n=function(e,t){return g(e._urlParams,t)}(e,e.$container);return e._urlParams.length&&(t=function(e,t,n){for(let r in e._urlParams)if(e._urlParams.hasOwnProperty(r)){let o=e._urlParams[r],s=RegExp("%\\("+o+"\\)\\w","gm");t=t.replace(s,""+n.shift())}return t}(e,t,n)),e.parsedContentUrl=t,{url:t,args:n[n.length-1]}}function U(e){return e.hasClass(A)?e.data(`${T}`):e.closest(`.${A}`).data(`${T}`)}function D(e,t,n,r){let o=e.data(T);return o?I(e,o):(o=O(r,e,t,n),e.data(T,o),e.addClass(A),S(o))}function J(e,t){if(t&&t.length>0){e.$container.empty(),e.$container.attr(e._tagName,"");for(let t in e._mixins)e.$container.attr(e._mixins[t]._tagName,"");e.$container.append(t)}return I(e.$container,e)}function V(e,t,n){return new Promise((r=>{let o=L(t,e,n),s=o.length;if(0===s)return r();for(let e=0;e<o.length;e++)D(o[e].dom,o[e].tag,o[e].super,n).then((()=>{if(s--,0===s)return r()}))}))}function B(e){return G(e,e.$container)}function G(e,t){const n=[];return t.find(`._bind_to_update_handler.sdc_uuid_${e._uuid}`).each((function(){const t=$(this);let r;if(t.hasClass("_with_handler"))r=t.data("handler");else{let t=this.tagName.toLowerCase().replace(/^this./,"");e[t]&&(r=e[t])}void 0!==r&&("function"==typeof r&&(r=r.bind(e)(t.data())),n.push(Promise.resolve(r).then((n=>{const r=$("<div></div>");return r.append(n),V(C(),r,e).then((()=>G(e,r).then((()=>(t.safeEmpty().text("").append(n),!0)))))}))))})),Promise.all(n)}const W=25e3;class K{constructor(e,t){this.pk=e,this._model=t}set model(e){this._model=e}get model(){return this._model}load(e){if(!this._model)throw new TypeError("Model is not set!!");return e.newModel(this._model,{pk:this.pk})}}const H={get(e,t){const n=e[t]??void 0;if(n instanceof K){if(!n.pk&&0!==n.pk)return null;const e=new Number(n.pk);return e.load=n.load.bind(n),e}return n},set(e,t,n){if(t in e){const r=e[t];r instanceof K?n.hasOwnProperty("pk")?r.pk=n.pk:r.pk=n:e[t]=n}else e[t]=n;return!0}};class Z{constructor(e,t={}){this.values_list=[],this.values={},this.model_name=e,this.model_query=t,this._is_connected=!1,this._is_conneting_process=!1,this._auto_reconnect=!0,this.socket=null,this.open_request={},this.on_update=()=>{},this.on_create=()=>{},this.form_id=f()}[Symbol.iterator](){let e=-1;return{next:()=>(++e,e<this.values_list.length?{value:this.values_list[e],done:!1}:{value:null,done:!0})}}length(){return this.values_list.length}byPk(e){if(null!==e){e=parseInt(e),isNaN(e)&&(e=-1);let t=this.values_list.find((t=>t.pk===e));return t||(t=new Proxy({pk:e},H),this.values_list.push(t)),t}return{pk:e}}filter(e){return this.model_query=Object.assign({},this.model_query,e),this}load(){return this.isConnected().then((()=>{const e=f();return new Promise(((t,n)=>{this.socket.send(JSON.stringify({event:"model",event_type:"load",event_id:e,args:{model_name:this.model_name,model_query:this.model_query}})),this.open_request[e]=[t,n]}))}))}listView(e={},t=null,n=null){let r=$('<div class="container-fluid">');return this.isConnected().then((()=>{const o=f();this.socket.send(JSON.stringify({event:"model",event_type:"list_view",event_id:o,args:{model_name:this.model_name,model_query:this.model_query,filter:e}})),this.open_request[o]=[e=>{r.append(e.html),he.refresh(r),t&&t(e)},e=>{n&&n(e)}]})),r}detailView(e=-1,t=null,n=null){e=parseInt(e),isNaN(e)&&(e=-1);let r,o=$('<div class="container-fluid">');return r=0!==this.values_list.length?this.isConnected():this.load(),r.then((()=>{-1===e&&(e=this.values_list[0].pk);const r=f();this.socket.send(JSON.stringify({event:"model",event_type:"detail_view",event_id:r,args:{model_name:this.model_name,model_query:this.model_query,pk:e}})),this.open_request[r]=[e=>{o.append(e.html),he.refresh(o),t&&t(e)},e=>{n&&n(e)}]})),o}syncFormToModel(e){return this.syncForm(e)}syncModelToForm(e){e&&e.hasClass(this.form_id)||(e=$(`.${this.form_id}`));let t=this;e.each((function(){if(!this.hasAttribute("data-model_pk"))return;let e=$(this).data("model_pk"),n=t.byPk(e);for(let e of this.elements){let t=e.name;if(t&&""!==t)if("checkbox"===e.type)e.checked=n[t];else if("file"===e.type&&n[t]instanceof File){let r=new DataTransfer;r.items.add(n[t]),e.files=r}else $(e).val(n[t])}}))}syncForm(e){e&&e.hasClass(this.form_id)||(e=$(`.${this.form_id}`));const t=this;let n=[];return e.each((function(){let e=$(this).data("model_pk"),r=t.byPk(e);for(let e of this.elements){let t=e.name;t&&""!==t&&("hidden"===e.type?r[t]=(o=$(e).val()).toLowerCase().match(/^(true|false)$/)?"true"===o.toLowerCase():"undefined"!==o?"none"===o.toLowerCase()?null:o.match(/^-?\d+$/)?parseInt(o):o.match(/^-?\d+\.?\d+$/)?parseFloat(o):o.match(/^(['][^']*['])|(["][^"]*["])$/)?o.substring(1,o.length-1):o:void 0:"checkbox"===e.type?r[t]=e.checked:"file"===e.type?r[t]=e.files[0]:r[t]=$(e).val())}var o;return n.push(r),r})),this.values_list.length<=1&&n.length>0&&(this.values=n.at(-1)),n}createForm(e=null,t=null){let n=$('<div class="container-fluid">');return this.isConnected().then((()=>{this._getForm(null,"create_form",null,n,e,t)})),n}editForm(e=-1,t=null,n=null){let r;e=parseInt(e),isNaN(e)&&(e=-1),r=0!==this.values_list.length?this.isConnected():this.load();let o=$('<div  class="container-fluid">');return r.then((()=>{e<=-1&&(e=this.values_list.at(e).pk),this._getForm(e,"edit_form",null,o,t,n)})),o}namedForm(e=-1,t,n=null,r=null){let o;e=parseInt(e),isNaN(e)&&(e=-1),o=0!==this.values_list.length?this.isConnected():this.load();let s=$('<div  class="container-fluid">');return o.then((()=>{e<=-1&&(e=this.values_list.at(e).pk),this._getForm(e,"named_form",t,s,n,r)})),s}_getForm(e,t,n,r,o,s){e=parseInt(e),isNaN(e)&&(e=-1);const i=f();this.socket.send(JSON.stringify({event:"model",event_type:t,event_id:i,args:{model_name:this.model_name,model_query:this.model_query,pk:e,form_name:n}}));const l=null===e||-1===e?"create":"edit";this.open_request[i]=[t=>{r.append(t.html);let n=r.closest("form").addClass(`sdc-model-${l}-form sdc-model-form ${this.form_id}`).data("model",this).data("model_pk",e);n.length>0&&!n[0].hasAttribute("sdc_submit")&&n.attr("sdc_submit","submitModelFormDistributor"),he.refresh(r),o&&o(t)},e=>{s&&s(e)}]}new(){return new Promise(((e,t)=>{const n=$("<form>").append(this.createForm((()=>{this.syncFormToModel(n),e()}),t))}))}save(e=-1){return e=parseInt(e),isNaN(e)&&(e=-1),this.isConnected().then((()=>{let t;t=e>-1?[this.byPk(e)]:this.values_list;let n=[];return t.forEach((e=>{const t=f();n.push(new Promise(((n,r)=>{this._readFiles(e).then((o=>{this.socket.send(JSON.stringify({event:"model",event_type:"save",event_id:t,args:{model_name:this.model_name,model_query:this.model_query,data:e,files:o}})),this.open_request[t]=[e=>{let t="string"==typeof e.data.instance?JSON.parse(e.data.instance):e.data.instance;e.data.instance=this._parseServerRes(t),n(e)},r]}))})))})),Promise.all(n)}))}create(e=this.values){const t=f();return this.isConnected().then((()=>new Promise(((n,r)=>{this._readFiles(e).then((o=>{this.socket.send(JSON.stringify({event:"model",event_type:"create",event_id:t,args:{model_name:this.model_name,model_query:this.model_query,data:e,files:o}})),this.open_request[t]=[e=>{let t="string"==typeof e.data.instance?JSON.parse(e.data.instance):e.data.instance;e.data.instance=this._parseServerRes(t)[0],n(e)},r]}))}))))}delete(e=-1){e=parseInt(e),isNaN(e)&&(e=-1),-1===e&&(e=this.values?.pk);const t=f();return this.isConnected().then((()=>new Promise(((n,r)=>{this.socket.send(JSON.stringify({event:"model",event_type:"delete",event_id:t,args:{model_name:this.model_name,model_query:this.model_query,pk:e}})),this.open_request[t]=[n,r]}))))}isConnected(){return new Promise(((e,t)=>{if(this._is_connected)e();else if(this._is_conneting_process){const[n,r]=this.open_request._connecting_process;this.open_request._connecting_process=[()=>{n(),e()},()=>{r(),t()}]}else this._is_conneting_process=!0,this.open_request._connecting_process=[()=>{},()=>{}],this._connectToServer().then((()=>{e(this._checkConnection())}))}))}close(){this.socket&&(this._auto_reconnect=!1,this.socket.onclose=()=>{},this.socket.close(),delete this.socket)}clean(){return this.values_list=[],this.values={},this}_readFiles(e){let t=[],n={};for(const[r,o]of Object.entries(e))o instanceof File&&t.push(new Promise(((e,t)=>{((r,o)=>{let s=new FileReader;s.onload=s=>{const i=f();this.open_request[i]=[e,t];let l=s.target.result,a=parseInt(Math.ceil(l.length/W));n[r]={id:i,file_name:o.name,field_name:r,content_length:o.size};for(let e=0;e<a;++e)this.socket.send(JSON.stringify({event:"model",event_type:"upload",event_id:i,args:{chunk:l.slice(W*e,W*(e+1)),idx:e,number_of_chunks:a,file_name:o.name,field_name:r,content_length:o.size,content_type:o.type,model_name:this.model_name,model_query:this.model_query}}))},s.onerror=()=>{t()},s.readAsBinaryString(o)})(r,o)})));return Promise.all(t).then((()=>n))}_onMessage(e){let t=JSON.parse(e.data);if(t.is_error)this.open_request.hasOwnProperty(t.event_id)&&(this.open_request[t.event_id][1](t),delete this.open_request[t.event_id]),(t.msg||t.header)&&F("pushErrorMsg",t.header||"",t.msg||""),"connect"===t.type&&(this.open_request._connecting_process[1](t),delete this.open_request._connecting_process,this._auto_reconnect=!1,this.socket.close());else{if((t.msg||t.header)&&F("pushMsg",t.header||"",t.msg||""),"connect"===t.type)this._is_connected=!0,this._is_conneting_process=!1,this.open_request._connecting_process[0](t),delete this.open_request._connecting_process;else if("load"===t.type){const e=JSON.parse(t.args.data);this.values_list=[],t.args.data=this._parseServerRes(e)}else if("on_update"===t.type||"on_create"===t.type){const e=JSON.parse(t.args.data);let n,r=this._parseServerRes(e);n="on_create"===t.type?this.on_create:this.on_update,n(r),t.args.data=r}let e=t.data?.instance;e&&(t.data.instance=JSON.parse(t.data.instance)),this.open_request.hasOwnProperty(t.event_id)&&(this.open_request[t.event_id][0](t),delete this.open_request[t.event_id])}}_connectToServer(){return new Promise((e=>{const t=`${this.model_name}`+(this.model_id>0?`/${this.model_id}`:"");"https:"===window.location.protocol?this.socket=new WebSocket(`wss://${window.location.host}/sdc_ws/model/${t}`):this.socket=new WebSocket(`ws://${window.location.host}/sdc_ws/model/${t}`),this.socket.onmessage=this._onMessage.bind(this),this.socket.onclose=e=>{console.error(`SDC Model (${this.model_name}, ${this.model_id}) Socket closed unexpectedly`),this._is_connected=!1;for(const[t,n]of Object.entries(this.open_request))n[1](e);this.open_request={},setTimeout((()=>{this._auto_reconnect&&this._connectToServer().then((()=>{}))}),1e3)},this.socket.onerror=e=>{if(console.error(`Model Socket encountered error: ${e} Closing socket`),this._is_connected)try{this.socket.close()}catch(e){}},this.socket.onopen=()=>{e()}}))}_checkConnection(){const e=f();return new Promise(((t,n)=>{this.socket.send(JSON.stringify({event:"model",event_type:"connect",event_id:e,args:{model_name:this.model_name,model_query:this.model_query}})),this.open_request[e]=[t,n]}))}_parseServerRes(e){let t=[];for(let n of e){const e=n.pk,r=this.byPk(e);for(const[e,t]of Object.entries(n.fields))t&&"object"==typeof t&&t.__is_sdc_model__?r[e]=new K(t.pk,t.model):r[e]=t;t.push(r)}return 1===this.values_list.length?this.values=this.values_list.at(-1):this.values={},t}}let z=!1,X=!1,Q=null,Y={};function ee(){return window.SERVER_CALL_VIA_WEB_SOCKET?new Promise((e=>z?e():X?void setTimeout((()=>{ee().then((()=>{e()}))}),200):e(ne()))):Promise.resolve(!0)}function te(){window.SERVER_CALL_VIA_WEB_SOCKET&&function(){if(z){z=!1;try{Q.close()}catch(e){}}}()}function ne(){return X=!0,new Promise((e=>{Q="https:"===window.location.protocol?new WebSocket(`wss://${window.location.host}/sdc_ws/ws/`):new WebSocket(`ws://${window.location.host}/sdc_ws/ws/`),Q.onmessage=function(e){let t=JSON.parse(e.data);if(t.is_error)(t.msg||t.header)&&F("pushErrorMsg",t.header||"",t.msg||""),Y[t.id]&&(Y[t.id][1](t.data||null),delete Y[t.id]);else if((t.msg||t.header)&&F("pushMsg",t.header||"",t.msg||""),t.type&&"sdc_recall"===t.type)Y[t.id]&&(Y[t.id][0](t.data),delete Y[t.id]);else if(t.type&&"sdc_event"===t.type){let e=t.event;e&&F(e,t.payload)}else t.type&&"sdc_redirect"===t.type&&F("onNavLink",t.link)},Q.onclose=function(){z&&console.error("SDC Socket closed unexpectedly"),z=!1;for(const[e,t]of Object.entries(Y))t[1]({}),delete Y[e];setTimeout((()=>{ne()}),1e3)},Q.onerror=function(e){if(console.error("Socket encountered error: ",e.message,"Closing socket"),z)try{Q.close()}catch(e){}},Q.onopen=function(){z=!0,X=!1,e()}}))}class re{constructor(){this._uuid=f(),this.contentUrl="",this.contentReload=!1,this.events=[],this.load_async=!1,this._isEventsSet=!1,this._allEvents=null,this._urlParams=[],this._models=[],this._cssUrls=[],this.afterShow=()=>{console.warn("afterShow is deprecated!!")},this._mixins={},this._tagName="",this._childController={},this._parentController=null,this._onLoadDone=!1,this.$container=null,this._isMixin=!1}_runLifecycle(e,t){he.DEBUG&&console.debug(e,this._tagName);let n=[];if(!this._isMixin){this._isMixin=!0;for(let r in this._mixins){let o=this._mixins[r];"function"==typeof o[e]&&n.push(o[e].apply(this,t))}return Promise.all(n).then((()=>{this._isMixin=!1}))}}onInit(){he.DEBUG&&console.DEBUG(Array.apply(null,arguments),this._tagName)}get parentController(){return this._parentController}get childController(){return this._childController}onLoad(){return this._runLifecycle("onLoad",arguments)}willShow(){return this._runLifecycle("willShow",arguments)}onRefresh(){return this._runLifecycle("onRefresh",arguments)}onRemove(){return this._runLifecycle("onRemove",arguments),!0}remove(){for(const e of this._models)e.close();let e=this._childController;for(let t in e)if(e.hasOwnProperty(t))for(let n of e[t])if(!n.remove())return!1;if(!this.onRemove||this.onRemove()){q(this);const e=a(this._tagName);if(this._parentController._childController[e]){let t=this._parentController._childController[e];for(let e=0;e<t.length;e++)t[e]===this&&t.splice(e,1)}return this.$container.remove(),!0}return!1}controller_name(){return this._tagName.replace(/-./g,(e=>` ${e[1].toUpperCase()}`)).replace(/^./g,(e=>`${e.toUpperCase()}`))}addEvent(e,t,n){this.getEvents(),this._allEvents[e]=this._allEvents[e]||{},this._allEvents[e][t]=n}getEvents(){if(this._allEvents)return this._allEvents;let e=[];e=e.concat(this.events);for(let t in this._mixins){let n=this._mixins[t];Array.isArray(n.events)&&(e=e.concat(n.events))}return this._allEvents=_.merge(...e)}post(e,t){return he.post(this,e,t)}get(e,t){return he.get(this,e,t)}submitForm(e,t,n){return he.submitFormAndUpdateView(this,e,t,n)}serverCall(e,t){let n=this.contentUrl.match(/sdc_view\/([^/]+)/i);if(n&&!(n.length<2))return function(e,t,n,r,o){return window.SERVER_CALL_VIA_WEB_SOCKET?function(e,t,n,r){let o=f();return ee().then((()=>{Q.send(JSON.stringify({event:"sdc_call",id:o,controller:t,app:e,function:n,args:r}))})),new Promise(((e,t)=>{Y[o]=[e,t]}))}(e,t,r,o):function(e,t,n){return"object"!=typeof n&&Array.isArray(n)&&null===n&&(n={arg0:n}),n={data:JSON.stringify(n),_sdc_func_name:t,_method:"sdc_server_call"},$.post({url:e,data:n,beforeSend:function(e,t){e.setRequestHeader("X-CSRFToken",window.CSRF_TOKEN)}}).then((e=>e._return_data))}(n,r,o)}(n[1],this._tagName,this.parsedContentUrl,e,t);console.error("To use the serverCall function the contentUrl must be set: "+this.name)}newModel(e,t={}){if(e instanceof Number&&e.hasOwnProperty("load"))return e.load(this);const n=new Z(e,t);return this._models.push(n),n}updateModel(e,t={},n){let r=new Z(e,t);return r.load().then((()=>{r.values|=n,r.save().then((()=>(r.close(),r.values)))}))}find(e){return this.$container.find(e)}refresh(){return he.refresh(this.$container,this)}reload(){return he.reloadController(this)}submitModelFormDistributor(e,t){return"function"==typeof this._submitModelForm?this._submitModelForm(e,t):"function"==typeof this.submitModelForm?this.submitModelForm(e,t):this.defaultSubmitModelForm(e,t)}iterateAllChildren(){let e=this._childController,t=[];for(let n in e)if(e.hasOwnProperty(n))for(let r of e[n])t.push(r),t.push(...r.iterateAllChildren());return t}defaultSubmitModelForm(e,t){let n=[];if(!this._isMixin){t.stopPropagation(),t.preventDefault();let r=e.data("model");const o=r.syncForm(e);for(let t of o)n.push(new Promise(((n,o)=>{let s;s=null!==t.pk&&t.pk>=0?r.save(t.pk):r.create(t),s.then((t=>{m(e),this.submit_model_form_success&&this.submit_model_form_success(t[0]);for(const e of this.iterateAllChildren())e.submit_model_form_success&&e.submit_model_form_success(t[0]);n(t)})).catch((t=>{p(e,$(t.html)),this.submit_model_form_error&&this.submit_model_form_error(t);for(const e of this.iterateAllChildren())e.submit_model_form_error&&e.submit_model_form_error(t);o(t)}))})))}return Promise.all(n).then((e=>Object.assign({},...e.flat())))}}const oe=["onbeforeunload"],se=Object.keys(window).filter((e=>/^on/.test(e)&&!oe.includes(e))).map((e=>e.slice(2)));function ie(e){let t=e.type;e.hasOwnProperty("namespace")&&e.namespace&&e.namespace.length&&(t+=`.${e.namespace}`);let n=$(e.target),r=null,o=!1,s=!1;for(e.stopImmediatePropagation=()=>s=!0,e.stopPropagation=()=>s=o=!0;n.length;){let i=n.attr(`sdc_${t}`);if(i){if(!r&&(r=U(n),!r))return;for(;r;){if(i.split(" ").forEach((s=>{if(o)return;let i=null;if("function"==typeof s)i=s;else if("function"==typeof r[s])i=r[s];else if("string"==typeof s&&s.startsWith("this.event_")){if(i=r.getEvents()[t],!i)return;if(i=i[s.slice(11)],!i)return}i&&i.call(r,n,e)})),s)return;r=r._parentController}}if(o)return;n=n.parent()}return{res:!0}}function le(e){if(e._isEventsSet)return;const t=e.getEvents();for(let n in t)if(t.hasOwnProperty(n)){let r=t[n];for(let t in r)r.hasOwnProperty(t)&&e.find(t).each((function(){let e=$(this),r=e.attr(`sdc_${n}`)||null;r=r?r.split(" "):[];const o=`this.event_${t}`;-1===r.indexOf(o)&&(r.push(o),e.attr(`sdc_${n}`,r.join(" ")))}))}}const ae={classname:"class"};window.sdcDom=function(e,t,...n){if(!e)return"";const r=function(e,t){let n,r=!1;if("string"==typeof e)n=$(document.createElement(e));else{const t=`this.${e.name}`;n=$(document.createElement(t)),n.data("handler",e),r=!0}return t&&Object.entries(t).forEach((([e,t])=>{e.startsWith("on")?n[0].addEventListener(e.substring(2).toLowerCase(),t):(ae[e.toLowerCase()]&&(e=ae[e.toLowerCase()]),n[0].setAttribute(e,t))})),r&&n.addClass("_bind_to_update_handler _with_handler"),n}(e,t);for(const e of n)r.append(e);return r};let ce,ue,he={CSRF_TOKEN:window.CSRF_TOKEN||"",LANGUAGE_CODE:window.LANGUAGE_CODE||"en",DEBUG:window.DEBUG||!1,VERSION:window.VERSION||"0.0",tagNames:[],Global:v,rootController:null,_isInit:!1,_origin_trigger:null,init_sdc:()=>{he._isInit||(he._isInit=!0,he._origin_trigger?te():(he._origin_trigger=$.fn.trigger,$.fn.trigger=function(e){const t={}.hasOwnProperty.call(e,"type")?e.type:e;return se.includes(t)||(se.push(t),$(window).on(t,ie)),he._origin_trigger.call(this,e)},he.updateJquery()),ee(),function(){const e=$(window);se.forEach((t=>{e.off(t).on(t,ie)}))}(),he.rootController=he.rootController||new re),he.tagNames=C();for(let[e,t]of Object.entries(he.Global))t.$container||(v[e].$container=s());return V(he.tagNames,s(),he.rootController)},updateJquery:()=>{$.fn.safeReplace=function(e){return he.safeReplace($(this),e)},$.fn.safeEmpty=function(){return he.safeEmpty($(this))},$.fn.safeRemove=function(){return he.safeRemove($(this))}},controllerToTag:e=>l(e.name).replace(/-controller$/,""),registerGlobal:e=>{let t=he.controllerToTag(e),n=new e;w[t]=[n,[]],n._tagName=t,window[a(t)]=v[a(t)]=n},cleanCache:()=>{x={}},register:e=>{let t=he.controllerToTag(e);return w[t]=[e,[]],e.prototype._tagName=t,{addMixin:(...e)=>{for(let n of e){let e;"string"==typeof n?e=l(n):n&&(e=he.controllerToTag(n)),w[t][1].push(e)}}}},post:(e,t,n)=>(n||(n={}),n.CSRF_TOKEN=he.CSRF_TOKEN,he.ajax(e,t,params,$.post)),get:(e,t,n)=>he.ajax(e,t,n,$.get),ajax:(e,t,n,r)=>{n||(n={}),n.VERSION=he.VERSION,n._method=n._method||"api";const o=new Promise(((s,i)=>r(t,n).then(((t,n,r)=>{s(t,n,r),"redirect"===t.status?F("onNavLink",t["url-link"]):o.then((()=>{he.refresh(e.$container)}))})).catch(i)));return o},submitFormAndUpdateView:(e,t,n,r)=>{let o=new FormData(t);const s=e=>{e["url-link"]?F("onNavLink",e["url-link"]):window.location.href=e.url},i=new Promise(((l,a)=>{u(o,n||t.action,r||t.method).then(((t,n,r)=>{l(t,n,r),"redirect"===t.status?s(t):i.then((()=>{he.refresh(e.$container)}))})).catch(((e,t,n)=>{301===e.status?(e=e.responseJSON,s(e),l(e,t,n)):a(e,t,n)}))}));return i},submitForm:(e,t,n)=>{let r=new FormData(e);return new Promise(((o,s)=>{u(r,t||e.action,n||e.method).then(o).catch(s)}))},getController:e=>U(e),safeEmpty:e=>(e.children().each((function(e,t){let n=$(t);he.safeRemove(n)})),e),safeReplace:(e,t)=>(t.insertBefore(e),he.safeRemove(e)),safeRemove:e=>(e.each((function(){let e=$(this);e.data(`${T}`)&&e.data(`${T}`).remove()})),e.find(`.${A}`).each((function(){const e=$(this).data(`${T}`);e&&e.remove()})),e.remove()),reloadController:e=>function(e){if(e.contentUrl){let t=M(e,e.contentUrl);return e.contentUrl=t.url,j(e.contentUrl,t.args,e._tagName,e.contentReload)}return new Promise((e=>{e($())}))}(e).then((t=>{let n=$(t);e._childController={},V(he.tagNames,n,e).then((()=>{he.safeEmpty(e.$container),e.$container.append(n),he.refresh(e.$container,e)}))})),refresh:(e,t)=>{if(t||(t=he.getController(e)),!t)return i();let n=t,r=[];for(;n;)n._isEventsSet=!1,r.unshift(n),n=n._parentController;return V(he.tagNames,t.$container,t).then((()=>{B(t).then((()=>{for(let e of r)le(e);t.onRefresh(e)}))}))}};const de=te,_e={get_controller:async function(e,t={},n=""){if(!jest)throw new Error("JEST is not defined");ce||(ue=$.ajax.bind($),ce=jest.spyOn($,"ajax"),ce.mockImplementation((function(e){return ue(e).then((e=>e)).catch((e=>e))})));const r=$("body");he.updateJquery(),r.safeEmpty();const o=$(`<${e}>${n}</${e}>`);for(const[e,n]of Object.entries(t))o.data(e,n);const s=$("<div></div>").append(o);return r.append(s),he._isInit=!1,he.cleanCache(),await he.init_sdc(),he.getController(o)},getCsrfToken:function(){return function(e){if(document.cookie&&""!==document.cookie){const t=document.cookie.split(";");for(let n=0;n<t.length;n++){const r=t[n].trim();if(r.substring(0,10)===e+"=")return decodeURIComponent(r.substring(10))}}return""}("csrftoken")}};var fe=t.n$,me=t.du,pe=t.yA,ge=t.g3,ye=t.u2,ve=t.n9,we=t.on,$e=t.yy,Ce=t.R6,be=t.$n,ke=t.hA,Oe=t.VB,Se=t.hZ;export{fe as AbstractSDC,me as allOff,pe as app,ge as checkIfParamNumberBoolOrString,ye as clearErrorsInForm,ve as controllerFactory,we as on,$e as runControlFlowFunctions,Ce as setErrorsInForm,be as setEvent,ke as socketReconnect,Oe as test_utils,Se as trigger};